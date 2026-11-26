import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {openTower} from './compiler_test_host.mjs';
import {builtins as grammar} from './compiler-fixtures.mjs';
import {guestString} from './guest_text.mjs';
import {moduleText, selectedCases} from './module_case_host.mjs';
import {newProject, validateProject, projectDiagnostic} from '../src/projects.mjs';
import {exportProject, importProject} from '../src/project-archive.mjs';
import {TowerWASI} from '../src/wasi-host.mjs';

const builtins = {foundation:grammar.foundation, bedrock:grammar.bedrock};
const tower = await openTower();
let rootHost;
const inputs = new URL('./project_cases/inputs/', import.meta.url);
const read = name => readFileSync(new URL(name, inputs), 'utf8');
let files, result, foundation;

function execute(host, handle, format = false) {
  try {
    result = host.execute(handle, 10000);
    if (result.outputTruncated) throw new Error('Truncated project output');
    if (format) foundation = host.foundation(handle).source;
  } finally { host.destroyExecution(handle); }
}

const frontend = selectedCases('project_cases', {
  project_clear() { files = []; },
  project_add(ctx, path, fixture) {
    files.push({path:guestString(ctx, path), text:read(guestString(ctx, fixture))});
  },
  project_run() {
    execute(tower, tower.compileFiles(files), true);
    result = projectDiagnostic(result, files);
  },
  project_replay() { execute(tower, tower.compile(foundation)); },
  project_add_library() {
    for (const [name,text] of Object.entries(grammar)) files.push({path:name + '.tower', text});
  },
  project_run_entry(ctx, path, directory) {
    const entry = guestString(ctx, path);
    rootHost.configureModules({entry, library:guestString(ctx, directory), files});
    execute(rootHost, rootHost.compile(files.find(file => file.path === entry).text));
    result.dependencies = rootHost.dependencies().join('\n') + '\n';
  },
  project_file_bytes: (_ctx, i) => Buffer.byteLength(files[i].text),
  project_offset() {
    if (!Number.isSafeInteger(result.errorOffset) || result.errorOffset < 0)
      throw new Error('Invalid project diagnostic offset');
    return result.errorOffset;
  },
  project_field: (ctx, field) => moduleText(ctx, result[guestString(ctx, field)]),
  project_expected: (ctx, fixture) => moduleText(ctx, read(guestString(ctx, fixture))),
});
function checkFrontend(name) {
  files = [];
  return frontend(name);
}
test('project binds across files, preserves effect order and canonical round trips', () => checkFrontend('binding'));
test('imported project files have isolated grammars and byte-correct diagnostics', () => checkFrontend('grammar'));
test('cross-file semantic and specialized template diagnostics retain file coordinates', () => checkFrontend('template'));
test('ZIP round trips large Unicode files, builtins, order and link bytes', async () => {
  const project = newProject('Large project',builtins,[{path:'src/main.tower',text:'print(42);'},{path:'data/large.txt',text:'雪🚀'.repeat(1100000)}]);
  project.links['fixture.o'] = Uint8Array.of(0,255,3); project.active = 'data/large.txt';
  const result = await importProject(exportProject(project));
  assert.deepEqual(result.files,project.files); assert.deepEqual(result.links,project.links); assert.deepEqual(result.builtins,builtins); assert.equal(result.active,project.active);
  assert.notEqual(result.id,project.id);
});
test('project paths and damaged archives cannot corrupt a drive', async () => {
  for (const path of ['../escape.tower','/absolute','a\\b','a/../b','.tower/project.json','a//b','C:/file'])
    assert.throws(()=>newProject('bad',builtins,[{path,text:''}]));
  assert.throws(()=>newProject('bad',builtins,[{path:'a',text:''},{path:'a/b',text:''}]));
  const project = newProject('ok',builtins);
  const bytes = new Uint8Array(await exportProject(project).arrayBuffer()); bytes[70] ^= 1;
  await assert.rejects(importProject(new Blob([bytes])));
  await assert.rejects(importProject(new Blob(['invalid'])));
  assert.throws(()=>validateProject({...project,files:[...project.files,...project.files]}));
});
test('mounting replaces the WASI drive, directories and open file descriptors', () => {
  const wasi = new TowerWASI(); wasi.mountFiles([{path:'src/a.tower',text:'hello'}]);
  assert.equal(wasi.files.get('src').type,3); assert.equal(new TextDecoder().decode(wasi.files.get('src/a.tower').data),'hello');
  wasi.fds.set(4,{node:wasi.files.get('src/a.tower')});
  wasi.mountFiles([{path:'main.tower',text:'other'}]);
  assert.equal(wasi.files.has('src'),false); assert.equal(wasi.fds.has(4),false);
  assert.throws(()=>wasi.mountFiles([{path:'../bad',text:''}]));
  assert.equal(wasi.files.has('main.tower'),true);
});
test('compilation accepts source above the previous 128 KiB limit', () => checkFrontend('large'));
test('an explicit project-root library resolves sibling imports from nested build entries', async () => {
  rootHost = await openTower();
  await checkFrontend('root');
});
