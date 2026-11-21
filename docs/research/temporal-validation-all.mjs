/** Run every retained temporal diagnostic without mixing their evidence scopes. */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const suites = [
  ['temporal-memory-validation.mjs', (r) => ({
    scope: 'Selective dirty queue, fixed instruction universe',
    comparisons: r.totals.referenceComparisons, updateBatches: r.totals.updateBatches,
  })],
  ['temporal-api-validation.mjs', (r) => ({
    scope: 'Dynamic byte-memory API, conservative full reconstruction',
    comparisons: r.totals.comparisons, successfulRepairs: r.totals.successfulRepairs,
    rejectedRepairs: r.totals.rejectedRepairs,
  })],
  ['temporal-api-adversarial.mjs', (r) => ({ cases: r.cases, assertions: r.assertions })],
  ['temporal-api-breaks.mjs', null],
  ['temporal-minimal-validation.mjs', (r) => ({
    scope: 'Reduced typed-by-value surface and implicit context',
    comparisons: r.totals.comparisons, successfulRepairs: r.totals.successfulRepairs,
    rejectedRepairs: r.totals.rejectedRepairs, rejectedOperations: r.totals.rejectedOperations,
    numericCases: r.totals.numericCases, suites: r.totals.suites,
  })],
  ['temporal-original-examples-validation.mjs', (r) => ({
    scope: 'Original proposal translated to the minimal typed API',
    comparisons: r.totals.oracleComparisons, successfulRepairs: r.totals.successfulRepairs,
    cases: r.totals.cases,
  })],
  ['temporal-api-mutations.mjs', (r) => ({
    detectedMutations: r.detectedMutations, survivingMutations: r.survivingMutations,
  })],
  ['temporal-nested-validation.mjs', (r) => ({
    scope: r.scope, cases: r.totals.cases, oracleComparisons: r.totals.oracleComparisons,
    successfulRepairs: r.totals.successfulRepairs, assertions: r.totals.directedAssertions,
  })],
  ['temporal-nested-adversarial.mjs', (r) => ({ cases: r.cases, assertions: r.assertions })],
  ['temporal-nested-mutations.mjs', (r) => ({
    detectedMutations: r.detectedMutations, survivingMutations: r.survivingMutations,
  })],
  ['temporal-nested-surface-validation.mjs', (r) => ({
    cases: r.totals.cases, assertions: r.totals.assertions,
  })],
  ['temporal-byte-validation.mjs', (r) => ({
    scope: r.scope, cases: r.totals.cases, comparisons: r.totals.comparisons,
    successfulRepairs: r.totals.successfulRepairs, assertions: r.totals.assertions,
  })],
  ['temporal-byte-adversarial.mjs', (r) => ({
    cases: r.totals.cases, assertions: r.totals.assertions,
  })],
  ['temporal-core-validation.mjs', (r) => ({
    scope: 'Ten-operation raw-pointer core; independent fresh numerical results',
    cases: r.cases, comparisons: r.comparisons, successfulRepairs: r.successfulRepairs,
    assertions: r.assertions,
  })],
  ['temporal-core-adversarial.mjs', (r) => ({
    cases: r.cases, assertions: r.assertions, expectedFailures: r.expectedFailures,
    successfulRepairs: r.successfulRepairs,
  })],
  ['temporal-core-mutations.mjs', (r) => ({
    baselineProbes: r.baselineProbes, detectedMutations: r.detected,
    survivingMutations: r.survivors,
  })],
  ['temporal-core-example.mjs', null],
];
const results = [];
for (const [name, summarize] of suites) {
  const child = spawnSync(process.execPath, [fileURLToPath(new URL(name, import.meta.url))],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 60000 });
  if (child.error || child.status !== 0) {
    results.push({ suite: name, status: 'FAIL', error: child.error?.message,
      stdout: child.stdout, stderr: child.stderr });
    process.exitCode = 1;
    break;
  }
  if (summarize) {
    const data = JSON.parse(child.stdout);
    if (data.status !== 'PASS') throw new Error(`${name} did not report PASS`);
    results.push({ suite: name, status: 'PASS', ...summarize(data) });
  } else results.push({ suite: name, status: 'PASS', summary: child.stdout.trim().split(/\r?\n/).at(-1) });
}
console.log(JSON.stringify({ status: process.exitCode ? 'FAIL' : 'PASS', runtime: process.version,
  nativePerformanceClaim: false, mechanizedProofClaim: false, results }, null, 2));
