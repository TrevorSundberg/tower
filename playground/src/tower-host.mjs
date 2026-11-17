import { TowerWASI } from './wasi-host.mjs';
import { configureTower, configureFoundation, configureBedrock } from './bootstrap.mjs';

/** The only module which knows about Wasm pointers and the C ABI. */
export async function loadTower(bytes, log = () => {}, bootstrap, foundation, bedrock) {
  const wasi = new TowerWASI({ log });
  const module = await WebAssembly.compile(bytes);
  const instance = await WebAssembly.instantiate(module, { wasi_snapshot_preview1: wasi.wasiImport });
  wasi.initialize(instance);
  const exports = instance.exports;
  if (exports.tw_abi_version() !== 3) throw new Error('Unsupported Tower browser ABI');
  if (bedrock !== undefined) configureBedrock(exports, bedrock);
  configureTower(exports, bootstrap);
  if (foundation !== undefined) configureFoundation(exports, foundation);
  const decoder = new TextDecoder('utf-8', { fatal: true });
  function string(pointer) {
    const memory = new Uint8Array(exports.memory.buffer);
    const end = memory.indexOf(0, pointer);
    if (!pointer || end === -1) throw new Error('Invalid response from Tower');
    return decoder.decode(memory.subarray(pointer, end));
  }
  function withSource(source, action) {
      const bytes = new TextEncoder().encode(source);
      if (bytes.length > 128 * 1024) throw new Error('Playground source limit is 128 KiB');
      const pointer = exports.tw_alloc(bytes.length + 1);
      if (!pointer) throw new Error('Unable to allocate source memory');
      try {
        new Uint8Array(exports.memory.buffer).set(bytes, pointer);
        const result = action(pointer, bytes.length);
        if (!result) throw new Error(string(exports.tw_last_error()));
        return result;
      } finally { exports.tw_free(pointer); }
  }
  return {
    exports,
    configure: source => configureTower(exports, source),
    configureBedrock: source => configureBedrock(exports, source),
    bedrockSeed: () => string(exports.tw_bedrock_seed()),
    createBedrock: source => withSource(source, (pointer, length) => exports.tw_create_bedrock(pointer, length)),
    createFoundation: source => withSource(source, (pointer, length) => exports.tw_create_foundation(pointer, length)),
    create: source => withSource(source, (pointer, length) => exports.tw_create(pointer, length)),
    reset: (handle, source) => withSource(source, (pointer, length) => exports.tw_reset(handle, pointer, length)),
    step: handle => JSON.parse(string(exports.tw_step(handle))),
    inspect: handle => JSON.parse(string(exports.tw_inspect(handle))),
    format: handle => JSON.parse(string(exports.tw_format(handle))),
    destroy: handle => exports.tw_destroy(handle),
    compile: source => withSource(source, (pointer, length) => exports.tw_exec_create(pointer, length)),
    execute: (handle, budget = 10000) => JSON.parse(string(exports.tw_exec_step(handle, budget))),
    compileFoundation: source => withSource(source, (pointer, length) => exports.tw_exec_create_foundation(pointer, length)),
    foundation: handle => JSON.parse(string(exports.tw_exec_foundation(handle))),
    destroyExecution: handle => exports.tw_exec_destroy(handle),
  };
}

export function runToEnd(tower, handle, events = []) {
  for (let i = 0; i < 1024; i++) {
    const event = tower.step(handle);
    if (event.status === 'error' || event.status === 'done') return { events, end: event };
    events.push(event);
  }
  throw new Error('Playground limit: 1,024 constructs per run');
}
