// Existing host tests supply explicit source capabilities to the Tower loader.
// These wrappers only transport files; imports are parsed/resolved by Tower.
import {readFile, readdir} from 'node:fs/promises';
import {loadTower as createTower} from '../src/tower-host.mjs';
import {loadLLVM as createLLVM} from '../src/llvm-host.mjs';
export {runToEnd} from '../src/tower-host.mjs';
export {executeWasm} from '../src/llvm-host.mjs';
const root = new URL('../../scaffolding/', import.meta.url);
export const builtins = Object.fromEntries(await Promise.all(['bedrock','foundation','tower'].map(async name =>
  [name, await readFile(new URL(name + '.tower', root), 'utf8')])));
async function sources(directory = '') {
  const result = [];
  for (const entry of await readdir(new URL(directory, root), {withFileTypes:true})) {
    const name = directory + entry.name;
    if (entry.isDirectory()) result.push(...await sources(name + '/'));
    else if (entry.name.endsWith('.tower')) result.push({path:'.tower/' + name, text:await readFile(new URL(name, root), 'utf8')});
  }
  return result;
}
export const files = await sources();
Object.assign(builtins, Object.fromEntries(files.filter(file => /^\.tower\/(?:[^/]+|types\/[^/]+)\.tower$/.test(file.path)).map(file => [file.path.slice('.tower/'.length, -'.tower'.length), file.text])));
export async function loadTower(bytes, log, bootstrap, foundation, bedrock = builtins.bedrock, options = {}) {
  if (process.env.TOWER_TEST_WASM) bytes = await readFile(process.env.TOWER_TEST_WASM);
  return loadTowerBytes(bytes, log, bootstrap, foundation, bedrock, options);
}
export async function loadTowerBytes(bytes, log, bootstrap, foundation, bedrock = builtins.bedrock, options = {}) {
  const host = await createTower(bytes, log, bootstrap, foundation, bedrock, {tower:builtins.tower, builtins, ...options});
  host.configureModules({files});
  return host;
}
export async function loadLLVM(bytes, log, bootstrap, foundation, bedrock = builtins.bedrock, options = {}) {
  if (process.env.TOWER_TEST_LLVM_WASM) bytes = await readFile(process.env.TOWER_TEST_LLVM_WASM);
  const host = await createLLVM(bytes, log, bootstrap, foundation, bedrock, {tower:builtins.tower, builtins, ...options});
  host.configureModules({files});
  return host;
}

// Execute a Tower fixture producer and transport its source output unchanged.
export async function generatedSource(tower, path) {
  const handle = tower.compile(await readFile(path, 'utf8'));
  try {
    tower.useFast(handle);
    let output = '', result;
    do { result = tower.execute(handle, 100000); output += result.output; } while (result.status === 'executing');
    if (result.status !== 'done') throw new Error(result.error);
    if (result.outputTruncated) throw new Error('Tower fixture output was truncated');
    return output;
  } finally { tower.destroyExecution(handle); }
}
