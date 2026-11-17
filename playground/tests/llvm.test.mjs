import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { TowerWASI } from '../src/wasi-host.mjs';
import { configureTower } from '../src/bootstrap.mjs';
let bytes;
try { bytes = await readFile(new URL('../../build/browser-wasi-llvm/tower-llvm.wasm', import.meta.url)); }
catch (error) { if (error.code !== 'ENOENT') throw error; }

test('LLVM executes inside WASM and emits a WebAssembly object in the browser filesystem', { skip: !bytes }, async () => {
  const logs = [];
  const wasi = new TowerWASI({ log: line => logs.push(line) });
  const { instance } = await WebAssembly.instantiate(bytes, { wasi_snapshot_preview1: wasi.wasiImport });
  wasi.initialize(instance);
  configureTower(instance.exports, await readFile(new URL('../../scaffolding/foundation.tower', import.meta.url), 'utf8'));
  assert.equal(instance.exports.entry(), 123, logs.join('\n'));
  const object = wasi.files.get('sum.o')?.data;
  assert.ok(object?.length > 8, logs.join('\n'));
  assert.deepEqual(Array.from(object.subarray(0,8)), [0,97,115,109,1,0,0,0]);
  const directory = new URL('../../build/browser-llvm-smoke/', import.meta.url);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL('sum.o', directory), object);
});
