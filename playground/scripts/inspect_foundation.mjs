// Artifact/ABI transport only: Tower fixtures own the semantic checks.
// node playground/scripts/inspect_foundation.mjs INPUT.tower OUTPUT_DIRECTORY [RECOVERY.tower]
// Requires TOWER_TEST_WASM and TOWER_TEST_LLVM_WASM; never builds or packages.
import assert from 'node:assert/strict';
import {access, readFile, writeFile, mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {loadTower, loadLLVM, builtins} from '../tests/compiler-fixtures.mjs';

const [input, directory, recovery] = process.argv.slice(2);
assert(input && directory, 'Supply a Tower fixture and an output directory');
assert(process.env.TOWER_TEST_WASM && process.env.TOWER_TEST_LLVM_WASM,
  'Supply both immutable reactor paths');
await Promise.all([input, recovery].filter(Boolean).map(path => access(path)));
// Refuse to overwrite a prior receipt, including a failed one.
await mkdir(directory);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const tower = await loadTower(undefined, undefined, builtins.foundation, builtins.foundation);
const llvm = await loadLLVM(undefined, undefined, builtins.foundation, builtins.foundation);
const events = [];
function record(phase, details = {}) {
  const event = {phase, milliseconds:performance.now(), cpu:process.cpuUsage(),
    rssBytes:process.memoryUsage().rss, maxRssKiB:process.resourceUsage().maxRSS,
    portableCapacityBytes:tower.exports.memory.buffer.byteLength,
    portableLiveNodes:tower.exports.tw_live_nodes(),
    portableLegacyAllocations:tower.exports.tw_live_allocations(), ...details};
  events.push(event);
  console.log(JSON.stringify(event));
}
async function save(name, text) {
  await writeFile(join(directory, name), text);
  return {bytes:Buffer.byteLength(text), sha256:hash(text)};
}
function execute(handle) {
  let result, output = '';
  const batches = 1000, steps = 10000;
  for (let batch = 0; batch < batches; batch++) {
    result = tower.execute(handle, steps); output += result.output;
    if (result.status !== 'executing') break;
  }
  assert.equal(result.status, 'done', JSON.stringify(result));
  assert.equal(output, '0\n');
  assert.equal(result.outputTruncated, false);
}
async function inspect(path, prefix) {
  const source = await readFile(path, 'utf8');
  record(prefix + ': source', {path, ...await save(prefix + '_source.tower', source)});
  const handle = tower.compile(source);
  try {
    execute(handle);
    const formatted = tower.foundation(handle);
    record(prefix + ': LLVM Foundation begin', {
      input:await save(prefix + '_input.tower', formatted.source), spans:formatted.spans.length});
    const result = llvm.compile(formatted.source, {emit:'foundation', optimize:false});
    const {foundation, before, after, ...response} = result;
    await save(prefix + '_response.json', JSON.stringify(response, null, 2) + '\n');
    record(prefix + ': LLVM Foundation end', response);
    if (before !== undefined) await save(prefix + '_before.ll', before);
    if (after !== undefined) await save(prefix + '_after.ll', after);
    if (foundation !== undefined) record(prefix + ': emitted', {
      output:await save(prefix + '_emitted.tower', foundation)});
    if (result.status !== 'compiled') { process.exitCode = 1; return; }
    // This is independent execution of the emitted text, never .towerbc packaging.
    record(prefix + ': portable emitted compile');
    const guest = tower.compile(foundation);
    try { execute(guest); record(prefix + ': portable emitted checked'); }
    finally { tower.destroyExecution(guest); }
  } finally {
    tower.destroyExecution(handle);
    record(prefix + ': released');
  }
}
try {
  record('loaded');
  try { await inspect(input, 'input'); }
  catch (error) { record('input: failure', {error:error.stack}); process.exitCode = 1; }
  if (recovery) await inspect(recovery, 'recovery');
} finally {
  record('final');
  await save('events.json', JSON.stringify(events, null, 2) + '\n');
  tower.close();
}
