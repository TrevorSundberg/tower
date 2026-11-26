import {after, test} from 'node:test';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {access, mkdtemp, readFile, writeFile, rm} from 'node:fs/promises';
import {homedir, tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {files, loadTower, loadLLVM, executeWasm} from './compiler-fixtures.mjs';
import {sourceLocation} from '../src/source-location.mjs';

const root = new URL('../../', import.meta.url);
const read = (name, encoding) => readFile(new URL(name, root), encoding);
const fixture = name => read('scaffolding/tests/' + name, 'utf8');
const clauses = name => fixture('for_clauses/' + name + '.tower');
const source = await fixture('for_loops.tower');
const golden = (await fixture('for_loops.expected.txt')).replaceAll('\r\n', '\n');
const foundation = await read('scaffolding/foundation.tower', 'utf8');
const cases = new URL('scaffolding/compiler/semantic_control_cases/', root);
const receiver = await read('playground/tests/fixtures/for_loops/received.tower', 'utf8');
const bytes = process.env.TOWER_TEST_WASM ? undefined : await read('build/browser-wasi/tower.wasm');
const tower = await loadTower(bytes, undefined, foundation);
after(() => tower.close());

// Named fields come from the transport. Only quoted leaf values come from guests.
function literal(value) {
  if (value && typeof value === 'object')
    return '{' + Object.entries(value).map(([key, field]) => key + ': ' + literal(field)).join(',\n') + '}';
  if (typeof value !== 'string' || /[\x00-\x08\x0b\x0c\x0e-\x1f]/u.test(value))
    throw new Error('Expected reactor text representable as a Tower string');
  return JSON.stringify(value);
}

// Older selected reactors still produce their own observations. Use the native
// test entry for those versions, respecting the build script's output directory.
async function nativeCompiler() {
  const exe = process.platform === 'win32' ? 'towerc.exe' : 'towerc';
  const cached = join(homedir(), '.cache', 'tower', 'native', exe);
  const installed = fileURLToPath(new URL('build/native/' + exe, root));
  const candidates = process.env.TOWER_NATIVE_BUILD ? [resolve(process.env.TOWER_NATIVE_BUILD, exe)] : [cached, installed];
  for (const path of candidates) {
    try { await access(path); return path; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  throw new Error('Selected reactor has no test entry. Build the native test compiler with ' +
    'playground/scripts/build-native.sh or set TOWER_NATIVE_BUILD. Looked for ' + candidates.join(', '));
}

async function checkObservations(name, rows, count) {
  const data = `import compiler.semantic_control_cases.${name};\nvar actual: Observations = ${literal(rows)};\n`;
  if (tower.exports.tw_exec_create_tests) {
    const entry = 'received.tower';
    const inputs = [...files, {path:entry, text:receiver}, {path:'observations.tower', text:data}];
    tower.configureModules({entry, files:inputs});
    const handle = tower.compileTests();
    try {
      let result;
      do { result = tower.execute(handle, 100000); } while (result.status === 'executing');
      if (result.status !== 'done') {
        const file = inputs.find(file => file.path === result.errorFile);
        if (!file) throw new Error(result.error ?? 'Unexpected test status ' + result.status);
        const lines = Buffer.from(file.text).subarray(0, result.errorOffset).toString('utf8').split('\n');
        throw new Error(sourceLocation(file.path, lines.length, [...lines.at(-1)].length + 1) + ': ' + result.error);
      }
      const selected = tower.testCount(handle);
      if (selected !== count) throw new Error(`${name}: selected ${selected} Tower tests, expected ${count}`);
      process.stderr.write(`${name}: ${selected} Tower tests passed\n`);
    } finally { tower.destroyExecution(handle); }
    return;
  }
  const dir = await mkdtemp(join(tmpdir(), 'tower-for-'));
  try {
    const suite = fileURLToPath(new URL(name + '.tower', cases)).replaceAll('\\', '/');
    const entry = join(dir, 'received.tower');
    await writeFile(entry, receiver);
    await writeFile(join(dir, 'observations.tower'), data);
    const {stderr} = await promisify(execFile)(await nativeCompiler(), ['--test', entry, '--test-details', '--jobs', '1',
      '--foundation', fileURLToPath(new URL('scaffolding/foundation.tower', root))]);
    const passed = stderr.replaceAll('\\', '/').split(/\r?\n/).filter(line => line.startsWith(suite + ':') && line.endsWith(': test passed'));
    if (passed.length !== count)
      throw new Error('Missing Tower test report for ' + entry + '\n' + stderr);
    process.stderr.write(stderr);
  } finally { await rm(dir, {recursive:true, force:true}); }
}

function requireStatus(result, status) {
  if (result.status !== status) throw new Error(result.error ?? 'Unexpected reactor status ' + result.status);
  return result;
}

test('counted-loop interpreter, diagnostic, grammar and format cases', async () => {
  const rows = {golden};
  function execute(handle) {
    let output = '', result;
    for (let i = 0; i < 100000; i++) {
      result = tower.execute(handle, 7);
      output += result.output;
      if (result.status !== 'executing') break;
    }
    requireStatus(result, 'done');
    return output;
  }
  function withHandle(handle, action) {
    try { return action(handle); } finally { tower.destroyExecution(handle); }
  }
  function format(text) {
    const handle = tower.create(text);
    try {
      let result;
      do { result = tower.step(handle); } while (result.status !== 'done' && result.status !== 'error');
      requireStatus(result, 'done');
      const formatted = tower.format(handle);
      if (formatted.error !== undefined) throw new Error(formatted.error);
      return formatted.source;
    } finally { tower.destroy(handle); }
  }

  for (const pointerBytes of [4, 8]) for (const fast of [false, true]) {
    const run = withHandle(tower.compile(source, {pointerBytes}), handle => {
      if (fast) tower.useFast(handle);
      const output = execute(handle);
      const foundation = tower.foundation(handle).source;
      return withHandle(tower.compileFoundation(foundation), rebuilt => {
        if (fast) tower.useFast(rebuilt);
        return {output, foundation, reparsed_output:execute(rebuilt), re_emitted:tower.foundation(rebuilt).source};
      });
    });
    rows[(fast ? 'fast' : 'graph') + 8 * pointerBytes] = run;
  }

  for (const name of ['condition', 'update', 'private_header', 'private_body', 'braces', 'missing_return']) {
    const text = name === 'braces' ? await fixture('syntax_invalid/for_braces.tower') : await clauses(name);
    const {status, error, output} = withHandle(tower.compile(text), h => tower.execute(h, 100000));
    rows[name] = {status, error:error ?? '', output};
  }
  rows.identifier = withHandle(tower.compile(await clauses('foundation_identifier')), execute);
  rows.first_format = format(await read('playground/tests/fixtures/for_loops/unformatted.tower', 'utf8'));
  rows.second_format = format(rows.first_format);
  rows.formatted_output = withHandle(tower.compile(rows.first_format), execute);
  await checkObservations('interpreters', rows, 4);
});

test('counted-loop LLVM/Wasm cases', {skip: !!process.env.TOWER_INTERPRETER_ONLY}, async () => {
  const bytes = process.env.TOWER_TEST_LLVM_WASM ? undefined : await read('build/browser-wasi-llvm/tower-llvm.wasm');
  const llvm = await loadLLVM(bytes, undefined, foundation);
  const rows = {golden};
  for (const optimize of [false, true]) {
    const compiled = requireStatus(llvm.compile(source, {optimize}), 'compiled');
    const executed = requireStatus(await executeWasm(compiled), 'done');
    rows[optimize ? 'optimized' : 'raw'] = executed.output;
  }
  await checkObservations('llvm', rows, 1);
});
