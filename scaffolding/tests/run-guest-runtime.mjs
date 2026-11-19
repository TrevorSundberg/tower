// Transport only: functional checks live in guest-runtime.tower.
// Usage: node scaffolding/tests/run-guest-runtime.mjs /path/to/towerc
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {executeWasm} from '../../playground/src/llvm-host.mjs';
const root = fileURLToPath(new URL('../../', import.meta.url));
const compiler = process.argv[2];
if (!compiler) throw Error('Supply a native Tower compiler');
const out = new URL('../../build/shared-runtime/', import.meta.url);
await mkdir(out, {recursive:true});
const modules = ['host/guest-memory.tower', 'host/platform-output.tower', 'tests/guest-runtime.tower'];
const source = (await Promise.all(modules.map(path => readFile(new URL('../' + path, import.meta.url), 'utf8')))).join('\n');
const input = fileURLToPath(new URL('tests.tower', out));
await writeFile(input, source);
const expected = 'Tower guest runtime passed\n';
const common = [input, '--bedrock', root + 'scaffolding/bedrock.tower', '--foundation', root + 'scaffolding/foundation.tower'];
for (const triple of ['wasm32-unknown-unknown', 'x86_64-pc-linux-gnu']) {
  const interpreted = execFileSync(compiler, [...common, '--target', triple, '--interpret'], {encoding:'utf8'});
  if (interpreted !== expected) throw Error(triple + ': interpreter output mismatch: ' + interpreted);
}
const native = fileURLToPath(new URL('native-tests', out));
execFileSync(compiler, [...common, '-o', native]);
if (execFileSync(native, [], {encoding:'utf8'}) !== expected) throw Error('Native runtime test failed');
const wasm = fileURLToPath(new URL('tests.wasm', out));
execFileSync(compiler, [...common, '--target', 'wasm32-unknown-unknown', '-o', wasm]);
const result = await executeWasm({wasm:new Uint8Array(await readFile(wasm)),
  signatures:{platform_write:['u32','u8*','usize']}});
if (result.status !== 'done' || result.output !== expected) throw Error(JSON.stringify(result));
console.log('Tower runtime: 32/64-bit interpretation, native execution and Wasm execution passed.');
