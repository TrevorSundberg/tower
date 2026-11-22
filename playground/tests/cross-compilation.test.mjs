import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { loadLLVM, executeWasm } from './compiler-fixtures.mjs';
import { targets, targetInputs } from '../src/targets.mjs';
const read = p => readFile(new URL('../../' + p, import.meta.url));
let bytes;
try { bytes = await read('build/browser-wasi-llvm/tower-cross.wasm'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const foundation = (await read('scaffolding/foundation.tower')).toString();
const compiler = bytes ? await loadLLVM(bytes, console.error, foundation) : null;
const source = (await read('scaffolding/tests/cross_target_program.tower')).toString();
await mkdir(new URL('../../build/cross', import.meta.url), {recursive:true});

for (const [key,target] of Object.entries(targets)) test('browser cross compiler: ' + target.label, {skip: !compiler, timeout:120000}, async () => {
  const inputs = await targetInputs(target, path => read('build/' + path.slice(2)));
  const options = {target:target.triple, emit:'executable', inputs};
  const result = compiler.compile(source, options);
  assert.equal(result.status, 'compiled', result.error);
  const output = result.binary ?? result.wasm;
  const magic = key === 'wasm' ? [0,97,115,109] : key === 'windows' ? [77,90] : key.startsWith('mac') ? [207,250,237,254] : [127,69,76,70];
  assert.deepEqual([...output.subarray(0,magic.length)], magic);
  if (key === 'wasm') assert.equal((await executeWasm(result)).output, '5\n84\n42\n4\n41\n42\n');
  else { assert.match(result.before, /@tower_allocate\(i64/); assert.match(result.disassembly,/\bret\b/); }
  await writeFile(new URL(`../../build/cross/${key}.${target.extension}`,import.meta.url),output);
  const repeat = compiler.compile(source, options);
  assert.equal(repeat.status, 'compiled', repeat.error);
  assert.deepEqual(repeat.binary ?? repeat.wasm, output, 'same-input repeat emission/linking must be reproducible');
  const object = compiler.compile('export fn answer(): i32 { return 42; }', {target:target.triple,library:true});
  assert.equal(object.status, 'compiled', object.error); assert.equal(object.format,'object');
  assert.doesNotMatch(object.before, /define .*@tower_main/);
  const program = compiler.compile('extern fn answer(): i32; var x: i32 = answer(); print(x);', {...options,inputs:{...inputs,'answer.o':object.object}});
  assert.equal(program.status,'compiled',program.error);
  if (key === 'wasm') assert.equal((await executeWasm(program)).output,'42\n');
  await writeFile(new URL(`../../build/cross/library-${key}.${target.extension}`,import.meta.url),program.binary ?? program.wasm);
});

test('native linker errors are recoverable and unknown targets are diagnosed', {skip:!compiler}, () => {
  const bad = compiler.compile('print(42);', {target:targets.linux.triple,emit:'executable'});
  assert.equal(bad.status,'error'); assert.match(bad.error,/Link failed/);
  assert.equal(compiler.compile('print(42);').status,'compiled');
  const unknown = compiler.compile('print(42);', {target:'unknown-unknown-unknown',emit:'object'});
  assert.equal(unknown.status,'error'); assert.match(unknown.error,/target/i);
});
