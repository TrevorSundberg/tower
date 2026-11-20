import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
// Use the real host directly: test fixtures intentionally install extra modules.
import {loadTower, runToEnd} from '../src/tower-host.mjs';

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
    file('syntax/core.tower',grammar.foundation.replace('import bedrock;','import "declarations.tower";')),
    file('syntax/language.tower',grammar.tower.replace('import foundation;','import "core.tower";')),
  ];
  const result = run(compiler,'import "syntax/language.tower"; const Answer: i32 = 42; print(Answer());',files);
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
  assert.equal(run(compiler,source.replace('import tower;','import "tower.tower";'),files).output,'42\n1\n');
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

test('dotted and quoted paths share module identity, effects and imported bindings',async () => {
  const compiler = await host(), files = sources();
  files.push(file('foo/bar/baz.tower','import tower; print(1); fn answer(): i32 { return 42; }'));
  const source = String.raw`import tower; import foo.bar.baz; import "foo/bar/baz.tower"; import "foo\\bar\\baz.tower"; print(answer());`;
  const result = run(compiler,source,files);
  assert.equal(result.status,'done',result.error);
  assert.equal(result.output,'1\n42\n');
  assert.equal(result.dependencies.filter(path=>path==='foo/bar/baz.tower').length,1);
});

test('relative strings are anchored to their importer and normalize either separator',async () => {
  const compiler = await host(), files = sources();
  files.push(file('shared/helpers.tower','import tower; fn answer(): i32 { return 42; }'));
  const source = String.raw`import tower; import "..\\shared\\helpers.tower"; print(answer());`;
  assert.equal(run(compiler,source,files).output,'42\n');
  // This file would be found by searching the library root for ../shared/helpers.
  // It must not mask the missing dependency relative to units/main.tower.
  files[files.length-1].path = '../shared/helpers.tower';
  const result = run(compiler,source,files);
  assert.equal(result.status,'error');
  assert.match(result.error,/Cannot read imported module: ..\/shared\/helpers/);
});

test('import formatting preserves dotted segments and literal dots, with canonical slash paths',async () => {
  const compiler = await host(), files = sources();
  files.push(file('foo/bar/baz.tower','import tower;'),file('foo.bar.tower','import tower;'),file('foo/bar.baz.tower','import tower;'));
  const source = String.raw`import tower; import foo /* path comment */ . bar . baz; import "foo\\bar\\baz.tower";` + ' import `foo.bar`; import foo.`bar.baz`;';
  compiler.configureModules({entry:'main.tower',library:'.',files});
  let formatted;
  for (let i=0;i<2;++i) {
    const handle = compiler.create(i ? formatted : source);
    try {
      const {end} = runToEnd(compiler,handle);
      assert.equal(end.status,'done',end.error);
      const result = compiler.format(handle);
      assert.equal(result.error,undefined);
      if (i) assert.equal(result.source,formatted);
      else formatted = result.source;
    } finally { compiler.destroy(handle); }
  }
  assert.match(formatted,/import foo\.bar\.baz;/);
  assert.match(formatted,/import 'foo\/bar\/baz.tower';/);
  assert.ok(formatted.includes('import `foo.bar`;'));
  assert.ok(formatted.includes('import foo.`bar.baz`;'));
  assert.ok(formatted.includes('/* path comment */'));
});

test('dotted imports reject empty segments and report errors from the selected file',async () => {
  const compiler = await host(), files = sources();
  files.push(file('foo/bar.tower','import tower; var broken: i32 = true;'));
  for (const source of ['import .;','import foo..bar;','import foo.;'])
    assert.equal(run(compiler,source,files).status,'error',source);
  const result = run(compiler,'import tower; import foo.bar;',files);
  assert.equal(result.status,'error');
  assert.equal(result.errorFile,'foo/bar.tower');
  assert.match(result.error,/Expected i32/);
});

test('saved Bedrock grammars with direct identifier imports remain usable',async () => {
  const compiler = await host(), files = sources();
  const bedrock = files.find(f=>f.path==='bedrock.tower');
  bedrock.text = bedrock.text.replace(/^parse Import(?:Path|Name) = .*\n/gm,'').replaceAll('$name:ImportName','$name:Identifier');
  files.push(file('helper.tower','import tower; fn answer(): i32 { return 42; }'));
  const result = run(compiler,'import tower; import helper; print(answer());',files);
  assert.equal(result.status,'done',result.error);
  assert.equal(result.output,'42\n');
});

test('each leading dot moves up one directory, including aliases and cached grammars',async () => {
  const compiler = await host(), files = sources();
  files.push(file('a/b/helper.tower','import tower; fn one(): i32 { return 1; }'),
    file('a/helper.tower','import tower; fn two(): i32 { return 2; }'),
    file('helper.tower','import tower; fn three(): i32 { return 3; }'));
  const source = 'import tower; import .helper as near; import ..helper; import ...helper; print(near.one()); print(two()); print(three());';
  for(let i=0;i<2;i++) {
    const result = run(compiler,source,files,'a/b/c/main.tower');
    assert.equal(result.status,'done',result.error);
    assert.equal(result.output,'1\n2\n3\n');
  }
});

test('leading-dot imports never fall back to library paths',async () => {
  const compiler=await host(),files=sources();
  files.push(file('../helper.tower','import tower;'));
  const result=run(compiler,'import .helper;',files);
  assert.equal(result.status,'error');
  assert.match(result.error,/Cannot read imported module: ..\/helper/);
});

test('quoted imports use the exact complete filename and case, including arbitrary user names',async () => {
  const compiler=await host(),files=sources();
  files.push(file('custom folder/a-b.tower','import tower; fn answer(): i32 { return 42; }'),
    file('no_extension','import tower;'),file('Other.Tower','import tower;'));
  const result=run(compiler,'import "custom folder/a-b.tower"; import "no_extension"; import "Other.Tower"; print(answer());',files);
  assert.equal(result.status,'done',result.error);
  assert.equal(result.output,'42\n');
  for(const name of ['tower','Tower.tower','custom folder/a-b','Custom folder/a-b.tower','custom folder/A-b.tower','Other.tower']) {
    const result=run(compiler,`import "${name}";`,files);
    assert.equal(result.status,'error',name);
    assert.match(result.error,/Cannot read imported module/);
  }
});

test('parent import terms, comments and aliases survive repeated formatting',async () => {
  const compiler=await host(),files=sources();
  files.push(file('helpers.tower','import tower;'));
  compiler.configureModules({entry:'a/b/main.tower',library:'.',files});
  let source='import tower; import . /* parent */ . helpers as tools;';
  for(let i=0;i<2;i++) {
    const handle=compiler.create(source);
    try {
      const {end}=runToEnd(compiler,handle);
      assert.equal(end.status,'done',end.error);
      const result=compiler.format(handle);
      assert.equal(result.error,undefined);
      assert.match(result.source,/import \.\.helpers as tools;/);
      assert.ok(result.source.includes('/* parent */'));
      if(i)assert.equal(result.source,source);
      source=result.source;
    } finally {compiler.destroy(handle);}
  }
});
