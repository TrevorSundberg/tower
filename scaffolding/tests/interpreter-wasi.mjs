// Run the Tower graph/cache suite using the same portable WASI host as
// the playground (including in-memory grammar inputs).
// Usage: node scaffolding/tests/interpreter-wasi.mjs program.wasm [arguments...]
import { readFile } from 'node:fs/promises';
import { TowerWASI, WASIExit } from '../../playground/src/wasi-host.mjs';
const host = new TowerWASI({ log: text => process.stdout.write(text + '\n') });
host.mountFiles(await Promise.all(['foundation.tower', 'bedrock.tower'].map(async path => ({
  path, text: await readFile(new URL('../' + path, import.meta.url), 'utf8'),
}))));
const argv = ['tower-interpreter-tests', ...process.argv.slice(3)].map(arg => new TextEncoder().encode(arg + '\0'));
host.wasiImport.args_sizes_get = (count, size) => {
  host.put32(count, argv.length); host.put32(size, argv.reduce((sum, arg) => sum + arg.length, 0)); return 0;
};
host.wasiImport.args_get = (pointers, buffer) => {
  for (const arg of argv) {
    host.put32(pointers, buffer); host.memory(buffer, arg.length).set(arg);
    pointers += 4; buffer += arg.length;
  }
  return 0;
};
const { instance } = await WebAssembly.instantiate(await readFile(process.argv[2]), { wasi_snapshot_preview1: host.wasiImport });
host.initialize(instance);
try { instance.exports._start(); }
catch (error) { if (error instanceof WASIExit) process.exitCode = error.code; else throw error; }
