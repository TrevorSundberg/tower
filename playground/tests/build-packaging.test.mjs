import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, cp, symlink, writeFile, readFile, rm, readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {targets} from '../src/targets.mjs';

const repository = fileURLToPath(new URL('../../', import.meta.url));
test('deployment bundles remove stale backends, require complete packs and checksum all assets', async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), 'tower-package-'));
  try {
    for (const name of ['playground/scripts/build.mjs', 'playground/src', 'playground/index.html',
      'playground/style.css', 'playground/CNAME', 'playground/licenses', 'scaffolding/examples', 'scaffolding/bedrock.tower',
      'scaffolding/foundation.tower', 'scaffolding/tower.tower', 'scaffolding/library', 'scaffolding/backend/foreign_grammar.tower', 'third_party/llvm-project/llvm/LICENSE.TXT', 'third_party/llvm-project/libcxx/LICENSE.TXT']) {
      await mkdir(path.dirname(path.join(fixture, name)), {recursive:true});
      await cp(path.join(repository, name), path.join(fixture, name), {recursive:true});
    }
    await symlink(path.join(repository, 'playground/node_modules'), path.join(fixture, 'playground/node_modules'), 'junction');
    const put = async (name, bytes = 'fixture') => {
      await mkdir(path.dirname(path.join(fixture, name)), {recursive:true});
      await writeFile(path.join(fixture, name), bytes);
    };
    await put('build/browser-wasi/tower.wasm');
    await put('build/browser-wasi-llvm/tower-llvm.wasm');
    await put('build/browser-wasi-llvm/tower-cross.wasm');
    await put('build/compiler-project/project.json', JSON.stringify({reactors:{tower:{support:['support-tower-0.a.gz']}}}));
    await put('build/compiler-project/support-tower-0.a.gz');
    await put('build/compiler-project/obsolete-support.o.gz');
    for (const target of Object.values(targets)) if (target.pointerBytes !== 4)
      for (const name of [target.triple + '-runtime.o', ...target.inputs]) await put('build/targets/' + name);
    const build = (required = false) => spawnSync(process.execPath, [path.join(fixture, 'playground/scripts/build.mjs')], {
      encoding:'utf8', env:{...process.env, TOWER_REQUIRE_BACKENDS:required ? '1' : '0'},
    });
    let result = build(true);
    assert.equal(result.status, 0, result.stderr);
    const dist = path.join(fixture, 'playground/dist');
    assert.equal(await readFile(path.join(dist, 'CNAME'), 'utf8'), 'tower-lang.org\n');
    assert.equal(await readFile(path.join(dist,'compiler/support-tower-0.a.gz'),'utf8'), 'fixture');
    await assert.rejects(readFile(path.join(dist,'compiler/obsolete-support.o.gz')), {code:'ENOENT'});
    const manifest = JSON.parse(await readFile(path.join(dist, 'deployment-manifest.json')));
    const files = (await readdir(dist, {recursive:true, withFileTypes:true})).filter(entry => entry.isFile());
    assert.equal(Object.keys(manifest.assets).length, files.length - 1);
    for (const [name, hash] of Object.entries(manifest.assets))
      assert.equal(createHash('sha256').update(await readFile(path.join(dist, name))).digest('hex'), hash, name);
    await rm(path.join(fixture, 'build/compiler-project'), {recursive:true});
    result = build(true);
    assert.notEqual(result.status, 0, 'full deployment must include the compiler project');
    assert.match(result.stderr, /Full deployment requires the compiler project/);
    await rm(path.join(fixture, 'build/targets/kernel32.lib'));
    result = build();
    assert.notEqual(result.status, 0, 'present cross compiler requires all target inputs');
    assert.match(result.stderr, /kernel32\.lib/);
    await rm(path.join(fixture, 'build/browser-wasi-llvm'), {recursive:true});
    await put('playground/dist/obsolete-worker.js');
    result = build();
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(await readFile(path.join(dist, 'capabilities.json'))), {llvm:false, cross:false});
    for (const name of ['obsolete-worker.js', 'tower-llvm.wasm', 'tower-llvm.wasm.gz', 'tower-cross.wasm.gz', 'targets', 'compiler/project.json'])
      await assert.rejects(readFile(path.join(dist, name)), {code:'ENOENT'});
    result = build(true);
    assert.notEqual(result.status, 0, 'full deployment must reject parser-only builds');
    assert.match(result.stderr, /Full deployment requires/);
  } finally {
    await rm(fixture, {recursive:true, force:true});
  }
});
