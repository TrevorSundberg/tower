// Run the host/parser command with the browser's portable WASI host. The full
// suite needs the source fixtures as well as its grammar modules. Its CMake
// target maps __FILE__ to this mounted tree, independent of the build host.
// Usage: node scaffolding/tests/host-wasi.mjs program.wasm
import {readFile, readdir} from 'node:fs/promises';
import {TowerWASI, WASIExit} from '../../playground/src/wasi-host.mjs';
const root = new URL('../', import.meta.url);
async function sources(folder = '') {
  const files = [];
  for (const entry of await readdir(new URL(folder, root), {withFileTypes:true})) {
    const path = folder + entry.name;
    if (entry.isDirectory()) files.push(...await sources(path + '/'));
    else if (path.endsWith('.tower')) files.push({path, text:await readFile(new URL(path, root), 'utf8')});
  }
  return files;
}
const host = new TowerWASI({log: text => process.stdout.write(text + '\n')});
const files = await sources();
host.mountFiles([...files.map(file => ({...file, path:'source/' + file.path})),
  ...files.filter(file => file.path === 'bedrock.tower' || file.path === 'foundation.tower')]);
const {instance} = await WebAssembly.instantiate(await readFile(process.argv[2]), {
  wasi_snapshot_preview1: host.wasiImport,
});
host.initialize(instance);
try { instance.exports._start(); }
catch (error) { if (error instanceof WASIExit) process.exitCode = error.code; else throw error; }
