import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, cp, symlink, writeFile, readFile, rm, readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync, spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {targets} from '../src/targets.mjs';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const packager = process.env.TOWER_PLAYGROUND_ASSET_PACKAGER || path.join(execFileSync('bash',
  [path.join(repository, 'playground/scripts/build-bootstrap.sh'), '--tools', 'package_playground_assets'],
  {encoding:'utf8', stdio:['ignore','pipe','inherit']}).trim(), 'package_playground_assets');
test('deployment bundles remove stale backends, require complete packs and checksum all assets', async t => {
  const fixture = await mkdtemp(path.join(tmpdir(), 'tower-package-'));
  try {
    for (const name of ['playground/scripts/build.mjs', 'playground/src', 'playground/index.html',
      'playground/style.css', 'playground/CNAME', 'playground/licenses', 'scaffolding/examples', 'scaffolding/bedrock.tower',
      'scaffolding/foundation.tower', 'scaffolding/foundation_syntax.tower', 'scaffolding/types.tower',
      'scaffolding/tower.tower', 'scaffolding/library', 'scaffolding/backend/foreign_grammar.tower']) {
      await mkdir(path.dirname(path.join(fixture, name)), {recursive:true});
      await cp(path.join(repository, name), path.join(fixture, name), {recursive:true});
    }
    await symlink(path.join(repository, 'playground/node_modules'), path.join(fixture, 'playground/node_modules'), 'junction');
    const put = async (name, bytes = 'fixture') => {
      await mkdir(path.dirname(path.join(fixture, name)), {recursive:true});
      await writeFile(path.join(fixture, name), bytes);
    };
    // Only exercise filesystem/packaging contracts: none of these synthetic
    // compiler, archive or notice bytes are runtime/deployment acceptance inputs.
    for (const name of ['llvm', 'libcxx'])
      await put(`third_party/llvm-project/${name}/LICENSE.TXT`, `synthetic ${name} notice\n`);
    await put('build/browser-wasi/tower.wasm');
    await put('build/browser-wasi-threads/tower.wasm');
    await put('build/browser-wasi-llvm/tower-llvm.wasm');
    await put('build/browser-wasi-llvm/tower-cross.wasm');
    await put('build/compiler-project/project.json', JSON.stringify({reactors:{tower:{support:['support-tower-0.a.gz']}}}));
    await put('build/compiler-project/support-tower-0.a.gz');
    await put('build/compiler-project/obsolete-support.o.gz');
    for (const target of Object.values(targets)) if (target.pointerBytes !== 4)
      for (const name of [target.triple + '-runtime.o', ...target.inputs]) await put('build/targets/' + name);
    // Each case owns both requirements, independent of the outer release suite.
    const build = (backends = false, threads = false) => {
      const result = spawnSync(process.execPath, [path.join(fixture, 'playground/scripts/build.mjs')], {
        encoding:'utf8', env:{...process.env, TOWER_PLAYGROUND_ASSET_PACKAGER:packager,
          TOWER_REQUIRE_BACKENDS:backends ? '1' : '0', TOWER_REQUIRE_THREADS:threads ? '1' : '0'},
      });
      assert.ifError(result.error);
      assert.equal(result.signal, null, result.stderr);
      return result;
    };
    let result = build(true, true);
    assert.equal(result.status, 0, result.stderr);
    const dist = path.join(fixture, 'playground/dist');
    const cname = await readFile(path.join(repository, 'playground/CNAME'), 'utf8');
    const checkManifest = async () => {
      assert.equal(await readFile(path.join(dist, 'CNAME'), 'utf8'), cname);
      const manifest = JSON.parse(await readFile(path.join(dist, 'deployment-manifest.json')));
      const files = (await readdir(dist, {recursive:true, withFileTypes:true})).filter(entry => entry.isFile());
      assert.equal(Object.keys(manifest.assets).length, files.length - 1);
      for (const [name, hash] of Object.entries(manifest.assets))
        assert.equal(createHash('sha256').update(await readFile(path.join(dist, name))).digest('hex'), hash, name);
      t.diagnostic(`Verified ${Object.keys(manifest.assets).length} emitted asset hashes and CNAME`);
    };
    assert.deepEqual(JSON.parse(await readFile(path.join(dist, 'capabilities.json'))), {llvm:true, cross:true, threads:true});
    assert.equal(await readFile(path.join(dist,'tower-threads.wasm'),'utf8'), 'fixture');
    assert.equal(await readFile(path.join(dist,'compiler/support-tower-0.a.gz'),'utf8'), 'fixture');
    await assert.rejects(readFile(path.join(dist,'compiler/obsolete-support.o.gz')), {code:'ENOENT'});
    for (const name of ['tower-llvm.wasm.gz', 'tower-cross.wasm.gz'])
      assert.equal(gunzipSync(await readFile(path.join(dist,name))).toString(), 'fixture');
    await assert.rejects(readFile(path.join(dist,'tower-cross.wasm')), {code:'ENOENT'});
    await checkManifest();
    await rm(path.join(fixture, 'build/browser-wasi-threads/tower.wasm'));
    result = build(true, true);
    assert.notEqual(result.status, 0, 'mandatory threads must reject a missing artifact');
    assert.match(result.stderr, /Threaded deployment requires build-threads\.sh/);
    t.diagnostic('Rejected missing required threads');
    await put('build/browser-wasi-threads/tower.wasm');
    await rm(path.join(fixture, 'build/compiler-project/support-tower-0.a.gz'));
    result = build(true, true);
    assert.notEqual(result.status, 0, 'compiler recipe support files must exist');
    assert.match(result.stderr, /support-tower-0\.a\.gz/);
    t.diagnostic('Rejected missing declared compiler support archive');
    await put('build/compiler-project/support-tower-0.a.gz');
    await rm(path.join(fixture, 'build/compiler-project'), {recursive:true});
    result = build(true, true);
    assert.notEqual(result.status, 0, 'full deployment must include the compiler project');
    assert.match(result.stderr, /Full deployment requires the compiler project/);
    t.diagnostic('Rejected missing required compiler project');
    await rm(path.join(fixture, 'build/targets/kernel32.lib'));
    result = build();
    assert.notEqual(result.status, 0, 'present cross compiler requires all target inputs');
    assert.match(result.stderr, /kernel32\.lib/);
    t.diagnostic('Rejected incomplete target inputs with a present cross compiler');
    await rm(path.join(fixture, 'build/browser-wasi-llvm'), {recursive:true});
    await rm(path.join(fixture, 'build/browser-wasi-threads'), {recursive:true});
    await put('playground/dist/obsolete-worker.js');
    for (const name of ['tower-llvm.wasm', 'tower-llvm.wasm.gz', 'tower-cross.wasm.gz', 'tower-threads.wasm', 'targets/stale.o', 'compiler/project.json'])
      await put('playground/dist/' + name, 'stale');
    result = build();
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(await readFile(path.join(dist, 'capabilities.json'))), {llvm:false, cross:false, threads:false});
    for (const name of ['obsolete-worker.js', 'tower-llvm.wasm', 'tower-llvm.wasm.gz', 'tower-cross.wasm.gz', 'tower-threads.wasm', 'targets', 'compiler/project.json'])
      await assert.rejects(readFile(path.join(dist, name)), {code:'ENOENT'});
    await checkManifest();
    t.diagnostic('Optional capabilities absent; stale assets removed');
    result = build(true);
    assert.notEqual(result.status, 0, 'full deployment must reject parser-only builds');
    assert.match(result.stderr, /Full deployment requires both LLVM reactors and target support packs/);
    t.diagnostic('Rejected missing required backends');
  } finally {
    await rm(fixture, {recursive:true, force:true});
  }
});
