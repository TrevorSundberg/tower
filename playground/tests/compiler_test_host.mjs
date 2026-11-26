// Browser transport for language tests executed by real Tower and LLVM reactors.
import {after} from 'node:test';
import {requireStatus} from './selected_test.mjs';
import {readFile} from 'node:fs/promises';
import {builtins, executeWasm, files, loadLLVM, loadTower} from './compiler-fixtures.mjs';

export {requireStatus, runSelectedTest} from './selected_test.mjs';

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
  return decoder.decode(memory.subarray(start, end));
}
