// Run the host/parser command with the browser's portable WASI host. The full
// suite needs the source fixtures as well as its grammar modules. Its CMake
// target maps __FILE__ to this mounted tree, independent of the build host.
// Usage: node scaffolding/tests/host-wasi.mjs program.wasm [arguments...]
import {readFile, readdir} from 'node:fs/promises';
import {Worker, workerData, parentPort} from 'node:worker_threads';
import {TowerWASI, WASIExit} from '../../playground/src/wasi-host.mjs';
// Shared-instance transport only. Tower fixtures own exported operations and
// assertions; each worker instantiates the supplied module against the same memory.
if (workerData?.towerInstance) {
  const {module, memory, moduleName, memoryName, entry, ordinal} = workerData;
  const instance = await WebAssembly.instantiate(module, {[moduleName]: {[memoryName]:memory}});
  instance.exports[entry](ordinal);
  parentPort.postMessage('complete');
  parentPort.close();
} else if (process.env.TOWER_TEST_INSTANCE_PHASES) {
  const module = await WebAssembly.compile(await readFile(process.argv[2]));
  const memory = new WebAssembly.Memory({initial:Number(process.env.TOWER_TEST_MEMORY_INITIAL),
    maximum:Number(process.env.TOWER_TEST_MEMORY_MAXIMUM), shared:true});
  for (const phase of JSON.parse(process.env.TOWER_TEST_INSTANCE_PHASES)) {
    await Promise.all(Array.from({length:phase.workers}, (_, ordinal) => new Promise((resolve, reject) => {
      const worker = new Worker(new URL(import.meta.url), {workerData:{towerInstance:true, module, memory,
        moduleName:process.env.TOWER_TEST_MEMORY_MODULE ?? 'env',
        memoryName:process.env.TOWER_TEST_MEMORY_NAME ?? 'memory', entry:phase.entry, ordinal}});
      const timer = setTimeout(() => { worker.terminate(); reject(new Error('Instance worker timed out')); }, 30000);
      worker.once('error', reject);
      worker.once('exit', code => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error(`Instance worker exited ${code}`)); });
    })));
  }
  console.log('Shared instance operations completed');
} else {
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
host.mountFiles([...files.map(file => ({...file, path:'source/' + file.path})), ...files]);
const argv = process.argv.slice(2).map(arg => new TextEncoder().encode(arg + '\0'));
const pointerBytes = 4;
host.wasiImport.args_sizes_get = (count, size) => {
  host.put32(count, argv.length); host.put32(size, argv.reduce((sum, arg) => sum + arg.length, 0)); return 0;
};
host.wasiImport.args_get = (pointers, buffer) => {
  for (const arg of argv) {
    host.put32(pointers, buffer); host.memory(buffer, arg.length).set(arg);
    pointers += pointerBytes; buffer += arg.length;
  }
  return 0;
};
const imports = {wasi_snapshot_preview1: host.wasiImport};
// Explicit host-memory transport for linker fixtures; assertions stay in Tower.
if (process.env.TOWER_TEST_MEMORY_MODULE !== undefined) {
  const memory = new WebAssembly.Memory({initial:Number(process.env.TOWER_TEST_MEMORY_INITIAL),
    maximum:Number(process.env.TOWER_TEST_MEMORY_MAXIMUM)});
  imports[process.env.TOWER_TEST_MEMORY_MODULE] = {[process.env.TOWER_TEST_MEMORY_NAME ?? 'memory']:memory};
}
const {instance} = await WebAssembly.instantiate(await readFile(process.argv[2]), imports);
host.initialize(instance);
try { instance.exports._start(); }
catch (error) { if (error instanceof WASIExit) process.exitCode = error.code; else throw error; }
}
