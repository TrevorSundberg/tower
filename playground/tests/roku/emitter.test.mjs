import {test} from 'node:test';
import {mkdir, readFile, readdir, writeFile} from 'node:fs/promises';
import {files} from '../compiler-fixtures.mjs';
import {fixtureSource, openLLVM, openTower, requireStatus} from '../compiler_test_host.mjs';
import {copyText, guestString} from '../guest_text.mjs';
import {selectedTestSteps} from '../selected_test.mjs';
import {runBrightScript} from './harness.mjs';

const root = new URL('./fixtures/emitter/', import.meta.url);
const fixtures = new Map(await Promise.all((await readdir(root)).map(async name =>
  [name, await readFile(new URL(name, root), 'utf8')])));
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
function copyOutput(context, text, size) {
  const address = copyText(context, text);
  const memory = context.memory();
  new DataView(memory.buffer, memory.byteOffset).setUint32(size, Buffer.byteLength(text), true);
  return address;
}

// Keep subject handles in a separate reactor so the live-node check sees
// exactly the application state. Release them even when a Tower assertion traps.
const handles = new Set();
function own(handle) { handles.add(handle); return handle; }
function release(handle) { tower.destroyExecution(handle); handles.delete(handle); }
let request, output;
const probe = await openTower({threads:{capacity:1}, imports:{
  roku_read(ctx, path, size) {
    const name = guestString(ctx, path);
    const text = fixtures.get(name) ?? fixtureSource('.tower/' + name);
    return size ? copyOutput(ctx, text, size) : copyText(ctx, text);
  },
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
  roku_submit(ctx, program, main) {
    if (request || output !== undefined) throw new Error('Unconsumed simulator request');
    request = [guestString(ctx, program), main ? guestString(ctx, main) : undefined];
  },
  roku_take_output(ctx, size) {
    if (output === undefined) return 0;
    const address = copyOutput(ctx, output, size);
    output = undefined;
    return address;
  },
}});

const suite = files.filter(({path}) => ['backend/text', 'library/testing', 'library/test_fixtures', 'library/vector']
  .some(name => path === '.tower/' + name + '.tower'));
for (const [path, text] of fixtures) if (path.endsWith('.tower')) suite.push({path, text});

async function check(entry) {
  try {
    for (const _ of selectedTestSteps(probe, 'emitter.tower', 10_000,
      {files:suite, suffix:'_' + entry + '_test.tower'}, 4096)) {
      if (request) {
        output = await runBrightScript(...request);
        request = undefined;
      }
    }
  } finally {
    request = output = undefined;
    for (const handle of handles) release(handle);
  }
}

for (const mode of ['O0', 'O2']) test(`optimized foundation to Roku (${mode}) executes shared semantics`,
  {timeout:180000}, () => check('shared_' + mode.toLowerCase()));
test('narrow integer operations and output survive scalar reconstruction', {timeout:180000}, () => check('narrow'));
test('Roku source uses selected layout, preserves comments, is deterministic and rejects foreign ABIs', () => check('layout'));
test('recursion, simultaneous phi copies, many arguments, unsigned arithmetic and text output', () => check('recursion'));
test('runtime traps unwind instead of continuing with a fabricated result', () => check('traps'));
test('LLVM scalar idioms retain high-bit semantics after reconstruction', {timeout:180000}, () => check('idioms'));
test('LLVM population count retains bounded full-width patterns after reconstruction', {timeout:180000}, () => check('population'));

test('build a sideloadable conformance package for later device validation', async () => {
  const source = fixtureSource('.tower/tests/backend_semantics.tower');
  const original = tower.compile(source, {pointerBytes:4});
  try {
    const round = tower.compile(optimizedFoundation(foundation(original), true), {pointerBytes:4});
    try {
      const directory = new URL('../../../build/roku-device/source/', import.meta.url);
      await mkdir(directory, {recursive:true});
      await writeFile(new URL('program.brs', directory), tower.rokuSource(round));
      await writeFile(new URL('Main.brs', directory), fixtures.get('package.brs'));
      await writeFile(new URL('../manifest', directory), 'title=Tower Roku conformance\nmajor_version=1\nminor_version=0\nbuild_version=0\n');
      await writeFile(new URL('../expected.txt', directory), 'TOWER_ROKU_BEGIN\n' + reference(original) + 'TOWER_ROKU_END\n');
    } finally { tower.destroyExecution(round); }
  } finally { tower.destroyExecution(original); }
});
