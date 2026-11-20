import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower} from './compiler-fixtures.mjs';
import {newProject, validateProject, projectDiagnostic} from '../src/projects.mjs';
import {exportProject, importProject} from '../src/project-archive.mjs';
import {TowerWASI} from '../src/wasi-host.mjs';
const read = path => readFile(new URL('../../' + path, import.meta.url));
const builtins = {foundation:(await read('scaffolding/foundation.tower')).toString(), bedrock:(await read('scaffolding/bedrock.tower')).toString()};
const tower = await loadTower(await read('build/browser-wasi/tower.wasm'), undefined, builtins.foundation, undefined, builtins.bedrock);
function run(files) {
  const handle = tower.compileFiles(files.map(([path,text]) => ({path,text})));
  try { const result = tower.execute(handle, 10000); return {...result, foundation:tower.foundation(handle).source}; }
  finally { tower.destroyExecution(handle); }
}
test('project binds across files, preserves effect order and canonical round trips', () => {
  const result = run([['main.tower','import tower; import lib.answer; print(answer()); print(1);'],['lib/answer.tower','import tower; fn answer(): i32 { return 42; } print(2);']]);
  assert.equal(result.status,'done',result.error); assert.equal(result.output,'2\n42\n1\n');
  const handle = tower.compile(result.foundation);
  try { assert.equal(tower.execute(handle,10000).output,result.output); } finally { tower.destroyExecution(handle); }
});
test('imported project files have isolated grammars and byte-correct diagnostics', () => {
  const first = "import tower; import src.b; // snow: 雪\nparse Statement |= 'show' $x:CoreOperand ';' => replace { print($x); }; show 1;";
  const files = [{path:'a.tower',text:first},{path:'src/b.tower',text:'import tower; show 2;'}];
  const result = projectDiagnostic(run(files.map(f=>[f.path,f.text])),files);
  assert.equal(result.status,'error'); assert.equal(result.errorFile,'src/b.tower'); assert.ok(result.errorOffset < files[1].text.length);
  assert.equal(run([['a.tower',first],['src/b.tower','import tower; print(2);']]).output,'2\n1\n');
});
test('cross-file semantic and specialized template diagnostics retain file coordinates', () => {
  const files = [{path:'main.tower',text:'import tower; import bad; print(1);'}, {path:'bad.tower',text:'import tower; var broken: i32 = true;'}];
  const result = projectDiagnostic(run(files.map(f=>[f.path,f.text])),files);
  assert.equal(result.errorFile,'bad.tower'); assert.ok(result.errorOffset < files[1].text.length);
  assert.match(result.error,/Expected i32/);
  const generic = run([['main.tower','import tower; import lib; print(identity(i32,42));'],['lib.tower','import tower; fn identity(T: type, value: T): T { return value; }']]);
  assert.equal(generic.output,'42\n',generic.error);
});
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
test('compilation accepts source above the previous 128 KiB limit', () => {
  const result = run([['big.tower','// ' + 'x'.repeat(180000) + '\nprint(42);']]);
  assert.equal(result.output,'42\n',result.error);
});

test('an explicit project-root library resolves sibling imports from nested build entries', async () => {
  const grammar = Object.fromEntries(await Promise.all(['bedrock','foundation','tower'].map(async name =>
    [name,(await read('scaffolding/'+name+'.tower')).toString()])));
  const host = await loadTower(await read('build/browser-wasi/tower.wasm'),undefined,grammar.foundation,undefined,grammar.bedrock);
  const files = [...Object.entries(grammar).map(([name,text]) => ({path:name+'.tower',text})),
    {path:'units/main.tower',text:'import tower; import lib.value; print(value());'},
    {path:'lib/value.tower',text:'import tower; fn value(): i32 { return 42; }'}];
  host.configureModules({entry:'units/main.tower',library:'.',files});
  const handle = host.compile(files[3].text);
  try {
    const result = host.execute(handle,10000);
    assert.equal(result.status,'done',result.error); assert.equal(result.output,'42\n');
    assert.ok(host.dependencies().includes('lib/value.tower'));
  } finally { host.destroyExecution(handle); }
});
