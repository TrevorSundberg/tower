// Existing host tests supply explicit source capabilities to the Tower loader.
// These wrappers only transport files; imports are parsed/resolved by Tower.
import {readFile, readdir} from 'node:fs/promises';
import {loadTower as createTower} from '../src/tower-host.mjs';
import {loadLLVM as createLLVM} from '../src/llvm-host.mjs';
export {runToEnd} from '../src/tower-host.mjs';
export {executeWasm} from '../src/llvm-host.mjs';
const root = new URL('../../scaffolding/', import.meta.url);
const builtins = Object.fromEntries(await Promise.all(['bedrock','foundation','tower'].map(async name =>
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
const files = await sources();
export async function loadTower(bytes, log, bootstrap, foundation, bedrock = builtins.bedrock, options = {}) {
  if (process.env.TOWER_TEST_WASM) bytes = await readFile(process.env.TOWER_TEST_WASM);
  const host = await createTower(bytes, log, bootstrap, foundation, bedrock, {tower:builtins.tower, ...options});
  host.configureModules({files});
  return host;
}
export async function loadLLVM(bytes, log, bootstrap, foundation, bedrock = builtins.bedrock, options = {}) {
  if (process.env.TOWER_TEST_LLVM_WASM) bytes = await readFile(process.env.TOWER_TEST_LLVM_WASM);
  const host = await createLLVM(bytes, log, bootstrap, foundation, bedrock, {tower:builtins.tower, ...options});
  host.configureModules({files});
  return host;
}
