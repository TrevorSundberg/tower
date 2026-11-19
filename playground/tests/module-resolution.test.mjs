import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
// Use the real host directly: test fixtures intentionally install extra modules.
import {loadTower} from '../src/tower-host.mjs';

const read = path => readFile(new URL('../../'+path,import.meta.url));
const wasm = await read('build/browser-wasi/tower.wasm');
const grammar = Object.fromEntries(await Promise.all(['bedrock','foundation','tower'].map(async name =>
  [name,(await read('scaffolding/'+name+'.tower')).toString()])));
const host = () => loadTower(wasm,undefined,grammar.foundation,undefined,grammar.bedrock,{tower:grammar.tower});
const file = (path,text) => ({path,text});
const sources = () => Object.entries(grammar).map(([name,text]) => file(name+'.tower',text));
function run(compiler, source, files, entry = 'units/main.tower') {
  compiler.configureModules({entry,library:'.',files});
  const handle = compiler.compile(source);
  try { return {...compiler.execute(handle,10000),dependencies:compiler.dependencies()}; }
  finally { compiler.destroyExecution(handle); }
}

test('Tower, Foundation and Bedrock work under ordinary renamed paths',async () => {
  const compiler = await host();
  const files = [
    file('syntax/declarations.tower',grammar.bedrock),
    file('syntax/core.tower',grammar.foundation.replace('import bedrock;','import "declarations";')),
    file('syntax/language.tower',grammar.tower.replace('import foundation;','import "core";')),
  ];
  const result = run(compiler,'import "syntax/language"; const Answer: i32 = 42; print(Answer());',files);
  assert.equal(result.status,'done',result.error);
  assert.equal(result.output,'42\n');
  assert.deepEqual(new Set(result.dependencies),new Set(['units/main.tower',...files.map(f=>f.path)]));
});

test('tower uses ordinary nearest-file lookup and invalidates cached resolutions after edits',async () => {
  const compiler = await host(), files = sources();
  const root = files.find(f=>f.path==='tower.tower');
  // Keep these modules declaration-only so they qualify for grammar caching.
  root.text += "\nparse Statement |= 'marker' ';' => replace { print(1); };";
  const source = 'import tower; const Answer: i32 = 42; print(Answer()); marker;';
  assert.equal(run(compiler,source,files).output,'42\n1\n');
  const local = file('units/tower.tower',grammar.tower+"\nparse Statement |= 'marker' ';' => replace { print(2); };");
  files.push(local);
  const nearer = run(compiler,source,files);
  assert.equal(nearer.output,'42\n2\n',nearer.error);
  assert.ok(nearer.dependencies.includes(local.path));
  assert.ok(!nearer.dependencies.includes(root.path));
  local.text = local.text.replace('print(2);','print(3);');
  assert.equal(run(compiler,source,files).output,'42\n3\n');
  // A broken nearer module must diagnose its own dependency, not fall back.
  local.text = 'import missing_grammar;';
  const broken = run(compiler,source,files);
  assert.equal(broken.status,'error');
  assert.equal(broken.errorFile,local.path);
  assert.match(broken.error,/Cannot read imported module: missing_grammar/);
  files.pop();
  assert.equal(run(compiler,source.replace('import tower;','import "tower";'),files).output,'42\n1\n');
});

test('tower has no privileged fallback or exemption from import cycles',async () => {
  const compiler = await host();
  // The host has a bundled .tower/tower.tower, but this project's library is '.'.
  const files = sources().filter(f=>f.path!=='tower.tower');
  const missing = run(compiler,'import tower; print(42);',files);
  assert.equal(missing.status,'error');
  assert.match(missing.error,/Cannot read imported module: tower/);
  files.push(file('tower.tower','import tower;'));
  const cycle = run(compiler,'import tower;',files);
  assert.equal(cycle.status,'error');
  assert.match(cycle.error,/cycl/i);
});
