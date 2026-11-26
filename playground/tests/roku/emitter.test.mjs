import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {openLLVM, openTower, requireStatus} from '../compiler_test_host.mjs';
import {copyText, guestString} from '../guest_text.mjs';
import {copyOutput, openRokuTests} from './test_host.mjs';

const idioms = JSON.parse(await readFile(new URL('../../../scaffolding/tests/llvm-scalar-idioms.json', import.meta.url)));
const tower = await openTower();
const llvm = await openLLVM();

function foundation(handle) {
  const checked = tower.execute(handle, 0);
  if (checked.status === 'error') requireStatus(checked, 'done');
  return tower.foundation(handle).source;
}
function optimizedFoundation(source, optimize) {
  const result = llvm.compile(source, {
    emit:'foundation', target:'wasm32-unknown-unknown', optimize,
  });
  requireStatus(result, 'compiled');
  return result.foundation;
}
function reference(handle) {
  const result = tower.execute(handle, 2_000_000);
  requireStatus(result, 'done');
  return result.output;
}
// Keep subject handles in a separate reactor so the live-node check sees
// exactly the application state. Release them even when a Tower assertion traps.
const handles = new Set();
function own(handle) { handles.add(handle); return handle; }
function release(handle) { tower.destroyExecution(handle); handles.delete(handle); }
const selected = await openRokuTests('emitter.tower', {
  roku_compile: (ctx, source, pointerBytes) => own(tower.compile(guestString(ctx, source), {pointerBytes})),
  roku_release: (_, handle) => release(handle),
  roku_foundation: (ctx, handle) => copyText(ctx, foundation(handle)),
  roku_llvm: (ctx, canonical, optimize) => copyText(ctx, optimizedFoundation(guestString(ctx, canonical), Boolean(optimize))),
  roku_emit: (ctx, handle, comments) => copyText(ctx, tower.rokuSource(handle, {comments:Boolean(comments)})),
  roku_emit_error(ctx, handle) {
    try { tower.rokuSource(handle); }
    catch (error) { return copyText(ctx, error.message); }
    return 0;
  },
  roku_reference: (ctx, handle, size) => copyOutput(ctx, reference(handle), size),
  roku_live_nodes: () => tower.exports.tw_live_nodes(),
  roku_idiom_count: () => idioms.length,
  roku_idiom_name: (ctx, index) => copyText(ctx, idioms[index][0]),
  roku_idiom_source: (ctx, index) => copyText(ctx, idioms[index][1]),
  roku_idiom_expected: (ctx, index, size) => copyOutput(ctx, idioms[index][2], size),
});

async function check(entry) {
  try { await selected(entry); }
  finally { for (const handle of handles) release(handle); }
}

for (const mode of ['O0', 'O2']) test(`optimized foundation to Roku (${mode}) executes shared semantics`,
  {timeout:180000}, () => check('shared_' + mode.toLowerCase()));
test('narrow integer operations and output survive scalar reconstruction', {timeout:180000}, () => check('narrow'));
test('Roku source uses selected layout, preserves comments, is deterministic and rejects foreign ABIs', () => check('layout'));
test('recursion, simultaneous phi copies, many arguments, unsigned arithmetic and text output', () => check('recursion'));
test('runtime traps unwind instead of continuing with a fabricated result', () => check('traps'));
test('LLVM scalar idioms retain high-bit semantics after reconstruction', {timeout:180000}, () => check('idioms'));
test('LLVM population count retains bounded full-width patterns after reconstruction', {timeout:180000}, () => check('population'));

test('build a sideloadable conformance package for later device validation', () => check('package'));
