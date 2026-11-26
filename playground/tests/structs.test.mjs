import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {readFile} from 'node:fs/promises';
import {executeWasm} from './compiler-fixtures.mjs';
import {fixtureSource, guestString, openLLVM, openTower, runSelectedTest} from './compiler_test_host.mjs';
import {originalDiagnostic} from '../src/foundation-source.mjs';

const root = '.tower/tests/struct_cases/';
const milestone = '.tower/examples/structs.tower';
const tower = await openTower();
let llvm, llvmSkip;
try { llvm = await openLLVM(); }
catch (error) {
  if (error.code !== 'ENOENT' || process.env.TOWER_TEST_LLVM_WASM) throw error;
  llvmSkip = error.message;
}

function withSource(path, observe) {
  const handle = tower.compile(fixtureSource(path));
  try { return observe(handle); }
  finally { tower.destroyExecution(handle); }
}

let observations;
const reflected = (context, name) => {
  const type = guestString(context, name);
  const item = observations.source.types.find(t => t.name === type);
  assert.ok(item, `Missing reflected type ${type}`);
  return item;
};

// The assertion guest must never compile on the instance whose live nodes it measures.
const checks = await openTower({imports: {
  struct_status(context, engine, wanted) {
    return observations[guestString(context, engine)].status === guestString(context, wanted);
  },
  struct_same(context, left, right, property) {
    const key = guestString(context, property);
    const a = observations[guestString(context, left)], b = observations[guestString(context, right)];
    return Object.hasOwn(a, key) && Object.hasOwn(b, key) && isDeepStrictEqual(a[key], b[key]);
  },
  struct_has_llvm: () => !!llvm,
  struct_type_layout(context, name, size, alignment) {
    const item = reflected(context, name);
    return item.size === size && item.alignment === alignment;
  },
  struct_field_count: (context, name) => reflected(context, name).fields.length,
  struct_field_offset: (context, name, index) => reflected(context, name).fields[index].offset,
  struct_field_is(context, owner, index, name, type, offset, size, alignment) {
    return isDeepStrictEqual(reflected(context, owner).fields[index], {
      name:guestString(context, name), type:guestString(context, type), offset, size, alignment,
    });
  },
  struct_execute_invalid(context, file) {
    observations.source = withSource(root + 'invalid/' + guestString(context, file) + '.tower', h => tower.execute(h));
  },
  struct_error_contains: (context, text) => observations.source.error.includes(guestString(context, text)),
  struct_steps: () => observations.source.steps,
  struct_empty_output: () => observations.source.output === '',
  struct_live_nodes: () => tower.exports.tw_live_nodes(),
  struct_compile_execute_inspect_release(context, path) {
    withSource(guestString(context, path), handle => {
      tower.execute(handle);
      tower.foundation(handle);
    });
  },
}});

function check(name, observed = {}) {
  observations = observed;
  try { runSelectedTest(checks, root + 'browser/' + name + '.tower'); }
  finally { observations = undefined; }
}

const cases = [
  ['milestone example', 'milestone', milestone],
  ['nested inline structs', 'nested'],
  ['recursive pointer fields', 'recursive'],
  ['forward types and functions', 'forward'],
  ['field destination captured before a call redirects its pointer', 'redirect'],
  ['pointer stored in a field aliases a scalar', 'scalar_alias'],
  ['field pointers before initialization', 'field_address'],
  ['empty structs still have distinct storage', 'empty'],
  ['quoted type and field names', 'quoted'],
];

for (const [name, file, path = root + file + '.tower'] of cases) {
  test(`structs round trip and execute: ${name}`, async t => {
    const output = await readFile(new URL(`../../scaffolding/tests/struct_cases/${file}.expected`, import.meta.url), 'utf8');
    const handle = tower.compile(fixtureSource(path));
    try {
      const source = tower.execute(handle, 10000);
      const formatted = tower.foundation(handle);
      const second = tower.compileFoundation(formatted.source);
      let roundtrip;
      try {
        const canonical = tower.foundation(second);
        roundtrip = {...tower.execute(second), foundation:canonical.source, types:canonical.types};
      } finally { tower.destroyExecution(second); }
      const observed = {
        source:{...source, foundation:formatted.source, types:formatted.types},
        roundtrip, expected:{output},
      };
      if (llvm) {
        observed.compiler = llvm.compile(formatted.source);
        if (observed.compiler.status === 'compiled') {
          observed.llvm = originalDiagnostic(await executeWasm(observed.compiler), formatted.spans, formatted.sourceMap);
        }
      } else {
        await t.test('LLVM/Wasm', {skip:llvmSkip}, () => {});
      }
      check('roundtrip', observed);
    } finally { tower.destroyExecution(handle); }
  });
}

test('type objects expose deterministic layout and fields from one registry', () => {
  withSource(root + 'layout.tower', handle => {
    check('layout', {source:{...tower.execute(handle), types:tower.foundation(handle).types}});
  });
});

test('invalid structs and field operations are checked before effects', () => check('diagnostics'));
test('struct/type nodes are released with successful and rejected programs', () => check('release'));
