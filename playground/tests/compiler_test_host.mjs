// Browser transport for language tests executed by real Tower and LLVM reactors.
import {after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {decodeBytes} from '../src/host-bytes.mjs';
import {builtins, executeWasm, files, loadLLVM, loadTower} from './compiler-fixtures.mjs';

const read = path => readFile(new URL('../../' + path, import.meta.url));
const bytes = process.env.TOWER_TEST_WASM ? undefined : await read('build/browser-wasi/tower.wasm');
export async function openTower(options) {
  const host = await loadTower(bytes, undefined, builtins.foundation, undefined, undefined, options);
  after(() => host.close());
  return host;
}

export async function openLLVM() {
  const bytes = process.env.TOWER_TEST_LLVM_WASM ? undefined : await read('build/browser-wasi-llvm/tower-llvm.wasm');
  return loadLLVM(bytes, undefined, builtins.foundation);
}

export function requireStatus(result, status) {
  assert.equal(result.status, status, result.error && `${result.errorFile ?? 'input'} at byte ${result.errorOffset}: ${result.error}`);
  assert.ok(!result.outputTruncated, 'Truncated guest output');
}

export async function llvmOutput(llvm, source, options) {
  const compiled = llvm.compile(source, options);
  requireStatus(compiled, 'compiled');
  const result = await executeWasm(compiled);
  requireStatus(result, 'done');
  return result.output;
}

const sources = new Map(files.map(({path, text}) => [path, text]));
export function fixtureSource(path) {
  if (!sources.has(path)) throw new Error('Missing Tower fixture ' + path);
  return sources.get(path);
}

const decoder = new TextDecoder('utf-8', {fatal:true});
export function guestString(context, pointer) {
  const start = Number(pointer);
  if (!Number.isSafeInteger(start) || start <= 0) throw new Error('Invalid guest pointer');
  const memory = context.memory(), end = memory.indexOf(0, start);
  if (end < 0) throw new Error('Unterminated guest string');
  return decodeBytes(decoder, memory.subarray(start, end));
}

export function runSelectedTest(tower, entry, chunks = 10, {files, ...testOptions} = {}) {
  tower.configureModules(files ? {entry, files} : {entry});
  const handle = tower.compileTests(testOptions);
  try {
    const checked = tower.execute(handle, 0);
    if (checked.status === 'error') requireStatus(checked, 'done');
    assert.equal(tower.testCount(handle), 1, entry);
    tower.useFast(handle);
    for (let i = 0; i < chunks; i++) {
      const result = tower.execute(handle, 100_000);
      if (result.status !== 'executing') return requireStatus(result, 'done');
    }
    assert.fail(entry + ' exceeded its execution budget');
  } finally { tower.destroyExecution(handle); }
}
