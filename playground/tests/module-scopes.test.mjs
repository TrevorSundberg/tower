import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower, runToEnd} from '../src/tower-host.mjs';
import {loadLLVM, executeWasm} from '../src/llvm-host.mjs';
import {hoverAt, hoverIndex} from '../src/language-queries.mjs';
import {builtins as grammar} from './compiler-fixtures.mjs';

const read = name => readFile(new URL(name, new URL('../../', import.meta.url)));
const compiler = await loadTower(await read(process.env.TOWER_TEST_WASM || 'build/browser-wasi/tower.wasm'), undefined, grammar.foundation,
  undefined, grammar.bedrock, {tower: grammar.tower, builtins: grammar});
const file = (path, text) => ({path, text});
const libraries = Object.entries(grammar).map(([name, text]) => file(name + '.tower', text));
function configure(files) { compiler.configureModules({entry: 'main.tower', library: '.', files: [...libraries, ...files]}); }
function run(source, files, fast = false) {
  configure(files);
  const handle = compiler.compile(source);
  try {
    if (fast) compiler.useFast(handle);
    return compiler.execute(handle, 100000);
  } finally { compiler.destroyExecution(handle); }
}
function succeeds(source, files, output) {
  for (const fast of [false, true]) {
    const result = run(source, files, fast);
    assert.equal(result.status, 'done', result.error);
    assert.equal(result.output, output);
  }
}
function fails(source, files, message, path) {
  const result = run(source, files);
  assert.equal(result.status, 'error');
  assert.match(result.error, message);
  if (path) assert.equal(result.errorFile, path);
}

const twins = [1, 2].map((n, i) => file(`${i ? 'right' : 'left'}/tools.tower`, `import tower;
// Helper from module ${n}.
fn helper(): i32 { return hidden(); }
fn hidden(): i32 { return ${n}; }
struct Item { value: i32; }
var count: i32 = ${n};
`));

test('canonical module scopes distinguish identical basenames, functions, nominal types and globals', () => {
  succeeds(`import tower; import left.tools as left; import "right/tools.tower" as right;
print(left.helper()); print(right.helper());
var a: left.Item; var b: right.Item; a.value = 30; b.value = 40;
print(a.value); print(b.value); left.count = 5; right.count = 6;
print(left.count); print(right.count);`, twins, '1\n2\n30\n40\n5\n6\n');
  fails('import tower; import left.tools as left; import right.tools as right; var a: left.Item; var b: right.Item; var p: left.Item* = &b;',
    twins, /Expected|type|compatible/i);
});

test('sibling and transitive declarations cannot satisfy an undeclared dependency', () => {
  const files = [file('left.tower', 'import tower; fn answer(): i32 { return hidden(); }'),
    file('right.tower', 'import tower; fn hidden(): i32 { return 42; }')];
  fails('import tower; import left; import right; print(answer());', files, /Unknown function 'hidden'/, 'left.tower');
  files[0].text = 'import tower; import right; fn answer(): i32 { return hidden(); }';
  succeeds('import tower; import left; print(answer());', files, '42\n');
  fails('import tower; import left; print(hidden());', files, /Unknown function 'hidden'/, 'main.tower');
});

test('open imports diagnose ambiguity at use, while aliases and local declarations disambiguate', () => {
  fails('import tower; import left.tools; import right.tools; print(helper());', twins, /Ambiguous imported name 'helper'/);
  succeeds('import tower; import left.tools; import right.tools; fn helper(): i32 { return 7; } print(helper());', twins, '7\n');
  fails('import tower; import left.tools as left; print(helper());', twins, /Unknown function 'helper'/);
  fails('import tower; import left.tools as left; print(left.missing());', twins, /Unknown function/);
});

test('callable visibility is shared by ordinary functions and templates', () => {
  const files = [file('a.tower', 'import tower; fn helper(value: i32): i32 { return value; }'),
    file('b.tower', 'import tower; fn helper(T: type, value: T): T { return value; }')];
  fails('import tower; import a; import b; print(helper(1));', files, /Ambiguous imported name/);
  succeeds('import tower; import b; fn helper(value: i32): i32 { return value; } print(helper(7));', files, '7\n');
  fails('import tower; fn Same(T: type): type { struct Item { value: T; } return Item; } fn Same(T: type, value: T): T { return value; }', [], /Duplicate template/);
});

test('a lexical value shadows an alias and indexed calls are not name spellings', () => {
  succeeds('import tower; import left.tools as lib; struct Holder { count: i32; } fn local(): i32 { var lib: Holder; lib.count = 3; return lib.count; } print(local());', twins, '3\n');
  fails('import tower; import left.tools as lib; fn local(): i32 { var lib: i32 = 1; return lib.helper(); } print(local());', twins, /Field access requires a struct/);
  fails('import tower; fn `values[0]`(): i32 { return 1; } var values: i32[1]; print(values[0]());', [], /Call requires a function value/);
});

test('aliases preserve canonical identity, dependency order and diamond initialization', () => {
  const files = [
    file('shared.tower', 'import tower; print(1); var value: i32 = 40;'),
    file('left.tower', 'import tower; import shared as common; print(2); fn answer(): i32 { return common.value; }'),
    file('right.tower', 'import tower; import "./shared.tower"; print(3); fn other(): i32 { var n = value + 2; return n; }'),
  ];
  succeeds('import tower; import left; import right; import "left.tower" as again; print(answer()); print(again.answer()); print(other());', files,
    '1\n2\n3\n40\n40\n42\n');
});

test('module cleanup retains dependency bindings and runs once after program statements', () => {
  const files = [
    file('shared.tower', 'import tower; var value = 1; print(10); defer print(value);'),
    file('left.tower', 'import tower; import shared as common; print(20); defer print(2); fn change(): void { common.value = 9; }'),
    file('right.tower', 'import tower; import shared; print(30); defer print(3);'),
  ];
  const source = 'import tower; import left; import right; print(40); change(); defer print(4);';
  const expected = '10\n20\n30\n40\n4\n3\n2\n9\n';
  succeeds(source, files, expected);
  configure(files);
  const handle = compiler.compile(source);
  try {
    const canonical = compiler.foundation(handle).source;
    const round = compiler.compileFoundation(canonical);
    try {
      const result = compiler.execute(round, 100000);
      assert.equal(result.status, 'done', result.error);
      assert.equal(result.output, expected);
    } finally { compiler.destroyExecution(round); }
  } finally { compiler.destroyExecution(handle); }
});

test('qualified templates resolve their own dependencies and keep concrete type identity', () => {
  const files = [file('model_types.tower', `import tower;
fn Box(T: type): type { struct Result { value: T; } return Result; }
fn identity(T: type, value: T): T { return value; }
fn hidden(): i32 { return 9; }
fn local(T: type, value: T): i32 { return hidden(); }`)];
  succeeds(`import tower; import model_types as types; fn hidden(): i32 { return 99; }
var box: types.Box(i32); box.value = types.identity(i32, 42);
print(box.value); print(types.local(i32, 1));
var p = alloc(types.Box(i32), 1); p.value = 7; print(p.value); free(p);`, files, '42\n9\n7\n');
});

test('qualified enums bind nominal types and members across module scopes', () => {
  const files = [file('left.tower', 'import tower; enum Mode: u32 { Ready = 4 }'),
    file('right.tower', 'import tower; enum Mode: u32 { Ready = 8 }')];
  succeeds('import tower; import left as a; import right as b; var m: a.Mode = a.Mode.Ready; print(convert(u32, m)); print(convert(u32, b.Mode.Ready));', files, '4\n8\n');
  fails('import tower; import left as a; import right as b; var m: a.Mode = b.Mode.Ready;', files, /Expected|type|compatible/i);
});

test('alias collisions and duplicate aliases are diagnosed, including imported-file coordinates', () => {
  fails('import tower; import left.tools as lib; import right.tools as lib;', twins, /Duplicate import alias/);
  fails('import tower; import left.tools as helper; fn helper(): i32 { return 0; }', twins, /alias conflicts/i);
  // Standard type names are ordinary imports and can be shadowed by an alias.
  succeeds('import tower; import left.tools as i32; print(i32.helper());', twins, '1\n');
  const files = [...twins, file('bad.tower', 'import tower; import left.tools as helper; fn helper(): i32 { return 0; }')];
  fails('import tower; import bad;', files, /alias conflicts/i, 'bad.tower');
});

test('declaration-only cycles permit mutually recursive functions through explicit imports', () => {
  const files = [
    file('a.tower', 'import tower; import b as b; fn even(n: i32): bool { var zero = n == 0; if zero { return true; } var next = n - 1; return b.odd(next); }'),
    file('b.tower', 'import tower; import a as a; fn odd(n: i32): bool { var zero = n == 0; if zero { return false; } var next = n - 1; return a.even(next); }'),
  ];
  succeeds('import tower; import a as a; print(a.even(8)); print(a.even(7));', files, 'true\nfalse\n');
  files[1].text += '\nprint(1);';
  fails('import tower; import a;', files, /Import cycle.*initialization/);
  files[1].text = 'import tower; import a; parse Extra = \'extra\';';
  fails('import tower; import a;', files, /Import cycle/);
});

test('rejected grammar cycles cannot publish unfinished dependency snapshots into the module cache', () => {
  configure([file('a.tower', "import tower; import b; parse ExtraA = 'a';"),
    file('b.tower', "import tower; import a; parse ExtraB = 'b';")]);
  for (const entry of ['a', 'b', 'a', 'b']) {
    const handle = compiler.compile(`import tower; import ${entry};`);
    try {
      const result = compiler.execute(handle, 0);
      assert.equal(result.status, 'error');
      assert.match(result.error, /Import cycle/);
    } finally { compiler.destroyExecution(handle); }
  }
});

test('explicit foreign declarations coalesce and link to a matching Tower export', () => {
  const files = [
    file('api.tower', 'import tower; extern fn answer(): i32;'),
    file('other.tower', 'import tower; extern fn answer(): i32;'),
    file('implementation.tower', 'import tower; export fn answer(): i32 { return 42; }'),
  ];
  succeeds('import tower; import api; import other; import implementation; print(answer());', files, '42\n');
  succeeds('import tower; import api; import other; import implementation; var value = answer(); print(value);', files, '42\n');
  files[1].text = 'import tower; extern fn answer(): bool;';
  fails('import tower; import api; import other; import implementation;', files, /Incompatible declarations of foreign symbol/);
});

test('formatting preserves aliases, comments and escaped identifiers', () => {
  configure(twins);
  let source = 'import tower; import left . tools /* keep */ as `left.lib`; print(`left.lib`.helper());';
  for (let i = 0; i < 2; ++i) {
    const handle = compiler.create(source);
    try {
      const {end} = runToEnd(compiler, handle);
      assert.equal(end.status, 'done', end.error);
      const result = compiler.format(handle);
      assert.equal(result.error, undefined);
      assert.match(result.source, /as `left\.lib`/);
      assert.match(result.source, /keep/);
      if (i) assert.equal(result.source, source);
      source = result.source;
    } finally { compiler.destroy(handle); }
  }
  succeeds(source, twins, '1\n');
});

test('editing import grammar cannot silently discard the alias capture', () => {
  configure([]);
  const handle = compiler.create("import tower; parse ImportDeclaration = 'import' $name:ImportPath 'as' Identifier ';';");
  try {
    const {end} = runToEnd(compiler, handle);
    assert.equal(end.status, 'error');
    assert.match(end.error, /ImportDeclaration.*alias/);
  } finally { compiler.destroy(handle); }
});

function complete(source, files) {
  configure(files);
  const cursor = source.indexOf('|');
  source = source.replace('|', '');
  const result = compiler.complete(source, Buffer.byteLength(source.slice(0, cursor)));
  assert.equal(result.error, undefined);
  return result.options.map(item => item.label);
}

test('completion offers only visible declarations and qualified members', () => {
  assert.ok(complete('import tower; import left.tools as left; lef|', twins).includes('left'));
  assert.deepEqual(complete('import tower; import left.tools as left; print(left.he|);', twins), ['helper']);
  assert.deepEqual(complete('import tower; import left.tools as left; var value: left.It|;', twins), ['Item']);
  assert.ok(!complete('import tower; import left.tools as left; he|', twins).includes('helper'));
  const files = [file('a.tower', 'import tower; import b; fn visible(): i32 { return hidden(); }'),
    file('b.tower', 'import tower; fn hidden(): i32 { return 1; }')];
  assert.ok(!complete('import tower; import a; hid|', files).includes('hidden'));
  files[1].text += ' fn hidden_generic(T: type): i32 { return 1; }';
  assert.ok(!complete('import tower; import a; var value: i32 = hid|;', files).includes('hidden_generic'));
});

test('colliding names round trip through compilable Foundation and raw/optimized LLVM', async () => {
  const source = 'import tower; import left.tools as left; import right.tools as right; fn `helper@left/tools.tower`(): i32 { return 9; } print(left.helper()); print(right.helper()); print(`helper@left/tools.tower`());';
  configure(twins);
  const handle = compiler.compile(source);
  let foundation;
  try {
    const result = compiler.foundation(handle);
    assert.equal(result.error, undefined);
    foundation = result.source;
  } finally { compiler.destroyExecution(handle); }
  succeeds(foundation, [], '1\n2\n9\n');
  const second = compiler.compile(foundation);
  try { assert.equal(compiler.foundation(second).source, foundation); }
  finally { compiler.destroyExecution(second); }
  const llvm = await loadLLVM(await read('build/browser-wasi-llvm/tower-llvm.wasm'), undefined, grammar.foundation,
    undefined, grammar.bedrock, {tower: grammar.tower, builtins: grammar});
  for (const optimize of [false, true]) {
    llvm.configureModules({entry:'main.tower', library:'.', files:[...libraries,...twins]});
    const result = llvm.compile(source, {optimize});
    assert.notEqual(result.status, 'error', result.error);
    const execution = await executeWasm(result);
    assert.equal(execution.status, 'done', execution.error);
    assert.equal(execution.output, '1\n2\n9\n');
  }
});

test('hover keeps original names and follows an alias to the correct declaration and documentation', () => {
  configure(twins);
  const source = 'import tower; import left.tools as left; import right.tools as right; print(left.helper()); print(right.helper());';
  const result = compiler.inspectDocument(source);
  assert.equal(result.error, undefined);
  const index = hoverIndex(source, result);
  for (const [name, n] of [['left', 1], ['right', 2]]) {
    const entry = hoverAt(index, source.indexOf(name + '.helper') + name.length + 2);
    assert.equal(entry.signature, 'fn helper(): i32');
    assert.equal(entry.declarationFile, name + '/tools.tower');
    assert.match(entry.documentation, new RegExp('module ' + n));
  }
});

test('module ownership and cyclic import components are released with programs and queries', () => {
  const cyclic = [file('a.tower', 'import tower; import b; fn helper(): i32 { return 1; }'),
    file('b.tower', 'import tower; import a; fn other(): i32 { return helper(); }')];
  const source = 'import tower; import left.tools as left; print(left.helper());';
  const exercise = () => {
    succeeds('import tower; import b; print(other());', cyclic, '1\n');
    succeeds(source, twins, '1\n');
    configure(twins);
    assert.equal(compiler.inspectDocument(source).error, undefined);
    assert.deepEqual(complete('import tower; import left.tools as left; print(left.he|);', twins), ['helper']);
  };
  for (let i = 0; i < 3; ++i) exercise();
  const nodes = compiler.exports.tw_live_nodes(), allocations = compiler.exports.tw_live_allocations();
  for (let i = 0; i < 20; ++i) exercise();
  assert.equal(compiler.exports.tw_live_nodes(), nodes);
  assert.equal(compiler.exports.tw_live_allocations(), allocations);
});
