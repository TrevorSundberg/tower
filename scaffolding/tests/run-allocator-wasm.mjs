// Invocation transport only; allocation checks and expected results are Tower.
import {readFile} from 'node:fs/promises';
const {instance} = await WebAssembly.instantiate(await readFile(process.argv[2]), {
  tower: {trap() { throw new Error('Unexpected Tower allocator trap'); }},
});
const status = instance.exports[process.argv[3] || 'allocator_wasm_tests']();
if (status) throw new Error(`Tower Wasm allocator check ${status} failed`);
console.log('Tower Wasm allocation/growth checks passed');
