import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {TowerWASI, WASIExit} from '../src/wasi-host.mjs';
import {loadTower} from '../src/tower-host.mjs';
import {guestString} from './guest_text.mjs';
import {runSelectedTest} from './selected_test.mjs';

const root = new URL('../../', import.meta.url);
const directory = 'playground/src/';
const read = path => readFile(new URL(path, root));
const source = async path => ({path, text:(await read(path)).toString('utf8')});
const modules = ['bedrock', 'foundation_syntax', 'types', 'foundation', 'tower',
  'library/testing', 'library/test_fixtures'];
const builtins = Object.fromEntries(await Promise.all(modules.map(async name =>
  [name, (await source('scaffolding/' + name + '.tower')).text])));
const compiler = await WebAssembly.compile(await readFile(process.env.TOWER_TEST_WASM ||
  new URL('build/browser-wasi/tower.wasm', root)));
const declarations = await source(directory + 'wasi_test_abi.tower');
const streamInput = await read(directory + 'wasi_split_utf8.txt');
const encoder = new TextEncoder(), decoder = new TextDecoder();

function copyBytes(context, data, size) {
  const pointer = context.allocate(data.length || 1);
  if (!pointer) throw new Error('Cannot copy WASI observation to the guest');
  const memory = context.memory();
  memory.set(data, pointer);
  new DataView(memory.buffer, memory.byteOffset).setUint32(size, data.length, true);
  return pointer;
}

function openSubject() {
  const logs = [], wasi = new TowerWASI({log:text => logs.push(text)});
  const memory = new WebAssembly.Memory({initial:2});
  wasi.initialize({exports:{memory}});
  return {wasi, memory, logs};
}

// Each serial registration owns a fresh subject. Only the assertion reactor
// and its language resources live across selections.
let subject, checks;
function wasiImports() {
  const bytes = () => new Uint8Array(subject.memory.buffer);
  const view = () => new DataView(subject.memory.buffer);
  const observe = (context, data, decode, size) =>
    copyBytes(context, decode ? encoder.encode(decoder.decode(data)) : data, size);
  return {
    ...Object.fromEntries(Object.keys(subject.wasi.wasiImport).map(name =>
      [name, {wasm:(...args) => subject.wasi.wasiImport[name](...args)}])),
    grow_memory: (_, pages) => subject.memory.grow(pages),
    put_text(context, offset, text) {
      const data = encoder.encode(guestString(context, text));
      bytes().set(data, offset);
      return data.length;
    },
    put_u32: (_, offset, value) => view().setUint32(offset, value, true),
    get_u8: (_, offset) => view().getUint8(offset),
    get_u16: (_, offset) => view().getUint16(offset, true),
    get_u32: (_, offset) => view().getUint32(offset, true),
    get_u64: (_, offset) => view().getBigUint64(offset, true),
    read_bytes: (context, offset, length, decode, size) =>
      observe(context, bytes().subarray(offset, offset + length), decode, size),
    file_bytes: (context, path, decode, size) =>
      observe(context, subject.wasi.files.get(guestString(context, path)).data, decode, size),
    put_stream_fixture: (_, offset) => bytes().set(streamInput, offset),
    log_count: () => subject.logs.length,
    log_bytes: (context, index, size) => copyBytes(context, encoder.encode(subject.logs[index]), size),
    call_proc_exit(_, code) {
      subject.exit = undefined;
      try { subject.wasi.wasiImport.proc_exit(code); }
      catch (error) { subject.exit = error; }
    },
    caught_wasi_exit: () => subject.exit instanceof WASIExit,
    caught_exit_code: () => typeof subject.exit?.code === 'number' ? subject.exit.code : NaN,
  };
}

test.after(() => checks?.close());

for (const [name, companion] of [
  ['Tower WASI file offsets, pread, truncation, holes and memory growth', 'offsets'],
  ['Tower WASI directory ABI, rename, unlink and path confinement', 'directory'],
  ['Tower WASI reports faults, supplies clocks/entropy and handles UTF-8 streams', 'streams'],
  ['Tower WASI hard links share contents and survive unlinking the original', 'hard_links'],
]) {
  test(name, async () => {
    const entry = await source(directory + 'wasi_' + companion + '_test.tower');
    subject = openSubject();
    try {
      checks ??= await loadTower(compiler, undefined, builtins.foundation, undefined, builtins.bedrock,
        {builtins, tower:builtins.tower, imports:wasiImports(), threads:{capacity:1}});
      runSelectedTest(checks, entry.path, 100, {files:[entry, declarations], suffix:'_browser_test.tower'});
    } finally { subject = undefined; }
  });
}
