import {test} from 'node:test';
import {readdir, readFile} from 'node:fs/promises';
import {files, generatedSource} from './compiler-fixtures.mjs';
import {fixtureSource, guestString, openLLVM, openTower, requireStatus, runSelectedTest} from './compiler_test_host.mjs';
import {copyText} from './guest_text.mjs';

const root = new URL('./fixtures/c_source/', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const inputs = new Map();
for (const name of await readdir(new URL('inputs/', root))) {
  if (name.endsWith('.tower') || name.endsWith('.expected')) inputs.set(name, await read('inputs/' + name));
}
inputs.set('increment.tower', fixtureSource('.tower/examples/increment.tower'));

const tower = await openTower();
const handles = new Set();
let llvm;
function release(handle) {
  tower.destroyExecution(handle);
  handles.delete(handle);
}

// Keep subject handles and their allocation counters in a separate reactor.
const probe = await openTower({threads:{capacity:1}, imports:{
  c_input(ctx, name) {
    const key = guestString(ctx, name);
    if (!inputs.has(key)) throw new Error('Missing C emitter fixture ' + key);
    return copyText(ctx, inputs.get(key));
  },
  c_compile(ctx, source, pointerBytes) {
    const handle = tower.compile(guestString(ctx, source), {pointerBytes});
    handles.add(handle);
    return handle;
  },
  c_release: (_, handle) => release(handle),
  c_foundation: (ctx, handle) => copyText(ctx, tower.foundation(handle).source),
  c_emit: (ctx, handle, comments) => copyText(ctx, tower.cSource(handle, {comments:Boolean(comments)})),
  c_emit_error(ctx, handle) {
    try { tower.cSource(handle); }
    catch (error) { return copyText(ctx, error.message); }
    return 0;
  },
  c_strip: (_, handle) => tower.stripComments(handle),
  c_nodes: () => tower.exports.tw_live_nodes(),
  c_allocations: () => tower.exports.tw_live_allocations(),
  c_execute(ctx, handle) {
    const result = tower.execute(handle, 100_000);
    requireStatus(result, 'done');
    return copyText(ctx, result.output);
  },
  c_llvm(ctx, source, optimize, target) {
    const result = llvm.compile(guestString(ctx, source), {emit:'foundation', optimize:Boolean(optimize), target:guestString(ctx, target)});
    requireStatus(result, 'compiled');
    return copyText(ctx, result.foundation);
  },
}});

const suite = files.filter(({path}) => ['.tower/backend/text.tower', '.tower/library/testing.tower',
  '.tower/library/vector.tower'].includes(path));
suite.push({path:'observations.tower', text:await read('observations.tower')});
async function check(name) {
  const entry = name + '_test.tower';
  const files = [...suite, {path:entry, text:await read(entry)}];
  // Each explicit entry is standalone under the browser companion rule.
  try { runSelectedTest(probe, entry, 500, {files, suffix:'_browser_test.tower'}); }
  finally { for (const handle of handles) release(handle); }
}
async function checkLLVM(name) {
  llvm ??= await openLLVM();
  return check(name);
}

test('C consumes the same entities, preserves comments, strips on request and releases storage', () => check('release'));
test('LLVM optimization carries comments through compilable foundation and C', () => checkLLVM('llvm'));
test('increment replacements preserve every example comment in raw and optimized C', () => checkLLVM('increment'));
test('foreign C++ names diagnose instead of producing invalid C', () => check('foreign'));
test('C ABI signatures retain signed parameters and return types', () => check('abi'));
test('bulk comment indexing keeps declaration associations and canonical order', async () => {
  inputs.set('generated.tower', await generatedSource(tower,
    new URL('../../scaffolding/tests/stress/comment_functions.tower', import.meta.url)));
  return check('bulk');
});
