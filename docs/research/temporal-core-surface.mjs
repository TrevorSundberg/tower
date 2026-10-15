/** Check the written C-like boundary against the executable public/compiler split.
 * This is a declaration/contract check, NOT a native C compilation test.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createTemporalRuntime, Status, TemporalError } from './temporal-core-runtime.mjs';

let assertions = 0;
const equal = (a, b, why) => { assert.deepEqual(a, b, why); assertions++; };
const rejected = work => { assert.throws(work, TemporalError); assertions++; };
const header = readFileSync(new URL('./temporal-core.h', import.meta.url), 'utf8');
const clean = header.replace(/\/\*[\s\S]*?\*\//g, '');
const declarations = [...clean.matchAll(/\b((?:builtin_)?temporal_[a-z_]+)\s*\(([^;]*?)\)\s*;/g)]
  .map(match => ({ name: match[1], args: match[2].trim() === 'void' ? []
    : match[2].split(',').map(arg => arg.trim().replace(/\s+/g, ' ')) }));
const expected = {
  builtin_temporal_global: ['void *base', 'const void *initial', 'size_t byte_count'],
  builtin_temporal_alloc: ['size_t byte_count', 'size_t alignment'],
  builtin_temporal_free: ['void *allocation'],
  builtin_temporal_load: ['const void *address', 'size_t byte_count'],
  builtin_temporal_store: ['void *address', 'uint64_t value', 'size_t byte_count'],
  temporal_create: [],
  temporal_destroy: ['History history'],
  temporal_run: ['History history', 'TemporalEntry entry', 'const void *arguments', 'size_t argument_bytes'],
  temporal_point: ['History history'],
  temporal_edit: ['History history'],
  temporal_store_at: ['Edit edit', 'Point point', 'void *destination', 'const void *source', 'size_t byte_count'],
  temporal_replace: ['Edit edit', 'Write write', 'const void *source'],
  temporal_remove: ['Edit edit', 'Write write'],
  temporal_repair: ['Edit edit'],
  temporal_cancel: ['Edit edit'],
};
equal(declarations.map(d => d.name), Object.keys(expected), 'compiler intrinsics first; exact declarations; no convenience aliases');
for (const declaration of declarations) equal(declaration.args, expected[declaration.name], declaration.name);

const runtime = createTemporalRuntime({ functions: {
  main: { params: ['args'], body: [
    { id: 'load', op: 'load', dst: 'value', addr: 1024, width: 4 },
    { id: 'plus', op: 'add', dst: 'next', a: { reg: 'value' }, b: 1 },
    { id: 'store', op: 'store', addr: 1024, width: 4, value: { reg: 'next' } },
    { id: 'return', op: 'return', value: 1024 },
  ] },
} });
equal([...Object.keys(runtime.builtins), ...Object.keys(runtime.api)], Object.keys(expected));
for (const declaration of declarations) {
  const method = runtime.builtins[declaration.name] ?? runtime.api[declaration.name];
  equal(method.length, declaration.args.length, `${declaration.name}: real executable arity`);
  rejected(() => method(...Array(method.length + 1).fill(null)));
}
equal(Status, { OK: 0n, ORPHANED_POINT: 1n, TRAP: 2n }, 'C enum values agree with machine values');

runtime.builtins.builtin_temporal_global(1024, new Uint8Array([7, 0, 0, 0]), 4);
rejected(() => runtime.builtins.builtin_temporal_alloc(4, 4));
rejected(() => runtime.builtins.builtin_temporal_free(1024));
rejected(() => runtime.builtins.builtin_temporal_load(1024, 4));
rejected(() => runtime.builtins.builtin_temporal_store(1024, 0, 4));
equal(runtime.api.temporal_run(null, 'main', null, 0), 1024n);
equal(runtime.debug.read(1024, 4), new Uint8Array([8, 0, 0, 0]));
const trace = runtime.debug.inspect(null).trace;
equal(trace.some(t => t.op === 'load' && t.reads.length === 4), true, 'ordinary load byte dependencies');
equal(trace.some(t => t.op === 'store' && t.writes.length === 4), true, 'ordinary store tracked without user calls');
equal(trace.some(t => t.op === 'add' && t.operands.length > 0), true, 'ordinary temporary operand dependencies');

console.log(JSON.stringify({ status: 'PASS', suite: 'temporal-core-surface',
  assertions, compilerIntrinsics: 5, userOperations: 10,
  nativeCompilationClaim: false }, null, 2));
