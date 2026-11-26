import {after, test} from 'node:test';
import {readFileSync} from 'node:fs';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {loadTower as createTower} from '../src/tower-host.mjs';
import {builtins, executeWasm, files, generatedSource} from './compiler-fixtures.mjs';
import {fixtureSource, guestString, openLLVM, openTower, requireStatus, runSelectedTest} from './compiler_test_host.mjs';

const root = '.tower/tests/';
const cases = root + 'semantic_port_cases/';
const expectedFiles = new URL('../../scaffolding/tests/semantic_port_cases/', import.meta.url);
const tower = await openTower();
const llvm = await openLLVM();
const artifacts = process.env.TOWER_TEST_ARTIFACTS;
if (artifacts) await mkdir(artifacts, {recursive:true});

let records;
const imports = {
  semantic_reject(context, file, width) {
    const name = guestString(context, file);
    if (!/^[a-z0-9_]+$/.test(name)) throw new Error('Invalid diagnostic fixture ' + name);
    const path = records.directory + '/' + name;
    const source = fixtureSource(root + path + '.tower');
    let result;
    if (width) {
      const handle = tower.compile(source, {pointerBytes:width});
      try { result = tower.execute(handle); }
      finally { tower.destroyExecution(handle); }
      if (result.outputTruncated) throw new Error('Truncated diagnostic output');
    } else {
      result = llvm.compile(source);
    }
    records[width] = {rejected:result};
    records.diagnostic = new URL('../' + path + '.expected', expectedFiles);
    if (!Number.isSafeInteger(result.errorOffset)) throw new Error('Missing diagnostic offset');
    return result.errorOffset;
  },
  semantic_bytes(context, width, route, field, size) {
    route = guestString(context, route);
    field = guestString(context, field);
    let bytes;
    if (route === 'diagnostic') {
      bytes = readFileSync(records.diagnostic);
    } else if (route === 'expected') {
      if (!/^[a-z0-9_]+$/.test(field)) throw new Error('Invalid expected file ' + field);
      bytes = readFileSync(new URL(field + '.expected', expectedFiles));
    } else {
      const value = records[width]?.[route]?.[field];
      if (typeof value !== 'string') throw new Error(`Missing ${width}/${route}/${field}`);
      bytes = Buffer.from(value);
    }
    if (context.pointerBytes !== 4) throw new Error('Expected a wasm32 assertion program');
    const address = context.allocate(bytes.length + 1);
    if (!address) throw new Error('Cannot allocate ' + field);
    const memory = context.memory();
    memory.set(bytes, address);
    memory[address + bytes.length] = 0;
    new DataView(memory.buffer, memory.byteOffset).setUint32(size, bytes.length, true);
    return address;
  },
};

const assertionFiles = files.filter(({path}) => path.startsWith(cases) ||
  ['.tower/library/testing.tower', '.tower/library/test_fixtures.tower',
   '.tower/backend/text.tower', '.tower/library/vector.tower'].includes(path));
const checks = await createTower(await readFile(process.env.TOWER_TEST_WASM ||
  new URL('../../build/browser-wasi/tower.wasm', import.meta.url)), undefined, builtins.foundation,
  undefined, builtins.bedrock, {tower:builtins.tower, builtins, imports, threads:{capacity:1}, project:{files:assertionFiles}});
after(() => checks.close());

function check(program, runs) {
  records = runs;
  try { runSelectedTest(checks, cases + program + '.tower', 4096); }
  finally { records = undefined; }
}

function subject(path) {
  const entry = root + path + '.tower';
  tower.configureModules({entry});
  llvm.configureModules({entry});
  return fixtureSource(entry);
}

function portable(source, pointerBytes, fast, format, executePhase, formatPhase, selectPhase) {
  const handle = tower.compile(source, {pointerBytes});
  try {
    if (fast) {
      selectPhase?.();
      tower.useFast(handle);
    }
    executePhase?.();
    let result, output = '';
    do {
      result = tower.execute(handle, 100000);
      if (result.outputTruncated) throw new Error('Truncated guest output');
      output += result.output;
    } while (result.status === 'executing');
    requireStatus(result, 'done');
    if (!format) return {output};
    formatPhase?.();
    const foundation = tower.foundation(handle);
    if (foundation.error) throw new Error(foundation.error);
    return {output, foundation:foundation.source};
  } finally { tower.destroyExecution(handle); }
}

async function executable(source, save, label, phase) {
  phase?.('LLVM executable ' + label);
  const compiled = llvm.compile(source);
  if (compiled.status !== 'compiled') await save?.('executable_' + label + '_error.json', JSON.stringify(compiled, null, 2));
  requireStatus(compiled, 'compiled');
  await save?.('executable_' + label + '.wasm', compiled.wasm);
  phase?.('LLVM executable run ' + label);
  const result = await executeWasm(compiled);
  requireStatus(result, 'done');
  return {output:result.output};
}

test('Tower semantic compiler preserves layouts, bindings, templates, and Foundation round trips', async () => {
  const source = subject('semantics'), runs = {};
  for (const width of [4, 8]) {
    const graph = portable(source, width, false, true);
    runs[width] = {graph, 'graph replay':portable(graph.foundation, width, false, true)};
  }
  runs[4]['source wasm'] = await executable(source);
  runs[4]['canonical wasm'] = await executable(runs[4].graph.foundation);
  check('layouts', runs);
});

const subjects = ['language_control', 'language_collections', 'language_enums', 'entity_pages', 'entity_tables',
  'entity_stage_ownership', 'work_graph', 'work_access', 'work_resume', 'work_observe', 'compiler_work',
  'compiler_batch', 'backend_popcount', 'backend_stack', 'backend_import_constants'];
for (const name of subjects) {
  test(`Tower ${name} agrees across graph, fast, LLVM and Foundation text`, async context => {
    const phase = label => console.error(process.env.TOWER_TEST_PHASES
      ? JSON.stringify({case:name, phase:label, pid:process.pid, milliseconds:performance.now(),
        cpu:process.cpuUsage(), rss:process.memoryUsage().rss, maxRssKiB:process.resourceUsage().maxRSS,
        portableCapacityBytes:tower.exports.memory.buffer.byteLength, llvmCapacityBytes:llvm.memoryCapacityBytes()})
      : `${name}: ${label}`);
    if (process.env.TOWER_TEST_PHASES) context.after(() => phase('released'));
    const save = async (suffix, data) => { if (artifacts) await writeFile(`${artifacts}/${name}_${suffix}`, data); };
    const source = subject(name), runs = {0:{case:{subject:name}}};
    await save('source.tower', source);
    for (const width of [4, 8]) {
      const bits = width * 8, row = runs[width] = {};
      for (const mode of ['graph', 'fast']) {
        phase(`compile ${bits}-bit ${mode}`);
        row[mode] = portable(source, width, mode === 'fast', true,
          () => phase(`execute ${bits}-bit ${mode}`), () => phase(`format ${bits}-bit ${mode}`));
        const canonical = row[mode].foundation;
        if (mode === 'fast') await save(bits + '_canonical.tower', canonical);
        phase(`canonical reparse ${bits}-bit`);
        row[mode + ' replay'] = portable(canonical, width, false, true, () => phase(`canonical execute ${bits}-bit`));
      }
      for (const optimize of [false, true]) {
        const mode = optimize ? 'optimized' : 'unoptimized', profile = bits + '_' + mode;
        phase(`LLVM Foundation ${bits}-bit optimize=${optimize}`);
        const rebuilt = llvm.compile(row.fast.foundation, {emit:'foundation', optimize, target:`wasm${bits}-unknown-unknown`});
        if (rebuilt.status !== 'compiled') await save(profile + '_error.json', JSON.stringify(rebuilt, null, 2));
        requireStatus(rebuilt, 'compiled');
        await save(profile + '_before.ll', rebuilt.before);
        await save(profile + '_after.ll', rebuilt.after);
        await save(profile + '_rebuilt.tower', rebuilt.foundation);
        phase(`LLVM Foundation reparse ${bits}-bit optimize=${optimize}`);
        row[mode] = portable(rebuilt.foundation, width, true, false,
          () => phase(`LLVM Foundation execute ${bits}-bit optimize=${optimize}`), undefined,
          () => phase(`LLVM Foundation Fast select ${bits}-bit optimize=${optimize}`));
        if (optimize) row[mode].ir = rebuilt.after;
      }
    }
    runs[4]['source wasm'] = await executable(source, save, 'source', phase);
    runs[4]['canonical wasm'] = await executable(runs[4].fast.foundation, save, 'canonical', phase);
    check('matrix', runs);
    phase('complete');
  });
}

function checkInvalid(program, directory) {
  // The original isolated selectors compile the fixture as input.tower.
  tower.configureModules({entry:'input.tower'});
  llvm.configureModules({entry:'input.tower'});
  check(program, {directory});
}

test('Tower semantic diagnostics agree between interpreter and LLVM entry points',
  () => checkInvalid('diagnostics', 'semantic_invalid'));

test('Tower-generated deep layout dependencies compile without recursive traversal', async () => {
  const entry = 'layout_depth_source';
  subject(entry);
  const source = await generatedSource(tower, new URL('../../scaffolding/tests/' + entry + '.tower', import.meta.url));
  const runs = {};
  for (const width of [4, 8]) runs[width] = {graph:portable(source, width, false, false)};
  runs[4]['source wasm'] = await executable(source);
  check('deep', runs);
});

test('Tower control-flow parser rejects incomplete and unbraced bodies',
  () => checkInvalid('syntax', 'syntax_invalid'));
