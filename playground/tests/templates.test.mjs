import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {files, runToEnd} from './compiler-fixtures.mjs';
import {fixtureSource, guestString, llvmOutput, openLLVM, openTower, requireStatus, runSelectedTest} from './compiler_test_host.mjs';

const tower = await openTower();
const llvm = process.env.TOWER_INTERPRETER_ONLY ? null : await openLLVM();
const cases = '.tower/compiler/generics_cases/';
const inputs = 'tests/template_inputs/';
const source = path => fixtureSource('.tower/' + path + '.tower');
const expected = path => readFileSync(new URL('../../scaffolding/' + path + '.expected', import.meta.url));

function execute(text, pointerBytes = 4, fast = false) {
  const handle = tower.compile(text, {pointerBytes});
  try {
    if (fast) tower.useFast(handle);
    let result, output = '';
    do {
      result = tower.execute(handle, 100_000);
      if (result.outputTruncated) throw new Error('Truncated template output');
      output += result.output;
    } while (result.status === 'executing');
    return {...result, output, foundation:result.status === 'done' ? tower.foundation(handle).source : undefined};
  } finally { tower.destroyExecution(handle); }
}

async function observe(path) {
  const text = source(path);
  const program = {source:text, expected:expected(path), engines:new Map()};
  let canonical;
  for (const width of [4, 8]) for (const fast of [false, true]) {
    const direct = execute(text, width, fast);
    requireStatus(direct, 'done');
    canonical = direct.foundation;
    const replay = execute(canonical, width, fast);
    requireStatus(replay, 'done');
    program.engines.set(width + '/' + fast, {output:direct.output, Foundation:canonical,
      'replay output':replay.output, 'replay Foundation':replay.foundation});
  }
  if (llvm) {
    program['LLVM source'] = await llvmOutput(llvm, text);
    program['LLVM Foundation'] = await llvmOutput(llvm, canonical);
  }
  return program;
}

// Only the current registration owns these observations. The selected Tower
// declaration runs in a separate interpreter and reads counted copies.
let programs, program, engine;
const encoder = new TextEncoder();
const checks = await openTower({threads:{capacity:1}, imports:{
  template_select(context, name) {
    program = programs.get(guestString(context, name));
    engine = undefined;
  },
  template_engine(_context, width, fast) { engine = program.engines.get(Number(width) + '/' + Boolean(fast)); },
  template_has_llvm: () => Boolean(llvm),
  template_read(context, key, dest, capacity) {
    const field = guestString(context, key);
    const value = engine?.[field] ?? program[field];
    const bytes = typeof value === 'string' ? encoder.encode(value) : value;
    if (!(bytes instanceof Uint8Array)) throw new Error('Missing template observation ' + field);
    if (dest && bytes.length <= Number(capacity)) context.memory().set(bytes, Number(dest));
    return bytes.length;
  },
  template_format() {
    const handle = tower.create(program.source);
    try {
      requireStatus(runToEnd(tower, handle).end, 'done');
      const result = tower.format(handle);
      if (result.error !== undefined) throw new Error(result.error);
      program.formatted = result.source;
    } finally { tower.destroy(handle); }
  },
  template_reject(context, name) {
    const path = guestString(context, name);
    const result = execute(source(path));
    program = {...result, error:result.error ?? '', errorFile:result.errorFile ?? '', expected:expected(path)};
    engine = undefined;
    if (result.status === 'error' && !Number.isSafeInteger(result.errorOffset)) throw new Error("Missing template diagnostic offset");
    return result.errorOffset ?? 0;
  },
  template_steps: () => program.steps,
}});
checks.configureModules({files:files.filter(({path}) => path.startsWith(cases) ||
  path.startsWith('.tower/library/') || path === '.tower/backend/text.tower')});

function register(title, entry, ...paths) {
  test(title, async () => {
    programs = new Map();
    try {
      for (const path of paths) programs.set(path, await observe(path));
      runSelectedTest(checks, cases + entry + '_test.tower', 300, {suffix:'_browser_test.tower'});
    } finally { programs = program = engine = undefined; }
  });
}

register('compiler scans preserve token ownership and interleaved specialization identities', 'scans', 'tests/compiler_scans');
register('the short fixed-size stack example specializes type and integer arguments', 'inline_stack', 'examples/templates');
register('integer type arguments preserve identity, forward through constructors and resolve array lengths', 'integer_forwarding', 'tests/type_numeric_composition');
register('invalid integer type argument: zero length', 'zero_length');
register('invalid integer type argument: excessive length', 'excessive_length');
register('invalid integer type argument: negative unsigned argument', 'unsigned_negative');
register('invalid integer type argument: type instead of integer', 'type_for_size');
register('invalid integer type argument: boolean argument type', 'boolean_parameter');
register('invalid integer type argument: mutable storage', 'mutable');
register('immutable known storage supplies an integer type argument', 'known', 'tests/type_numeric_known');
register('nested integer negation supplies a valid array extent', 'negation', 'tests/type_numeric_negation');
register('generic calls bind types without replacing value identifiers or duplicating effects', 'call_effects',
  inputs + 'type_grammar', inputs + 'parameter_shadow', 'tests/type_identity_composition');
register('template names bind forward and recursion reuses concrete nodes', 'forward_recursion', inputs + 'forward_recursion');
register('nominal identities, type-argument shapes and generated name collisions stay distinct', 'nominal_collision', inputs + 'nominal_collision');
register('the typed vector grows scalar and pointer storage with target layouts', 'vector_growth', inputs + 'vector_growth');
register('invalid templates fail before effects and retain instantiation context', 'invalid_templates');
