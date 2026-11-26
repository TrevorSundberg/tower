import assert from 'node:assert/strict';

export function requireStatus(result, status) {
  assert.equal(result.status, status, result.error && `${result.errorFile ?? 'input'} at byte ${result.errorOffset}: ${result.error}`);
  assert.ok(!result.outputTruncated, 'Truncated guest output');
}

export function runSelectedTest(tower, entry, chunks = 10, {files, ...testOptions} = {}) {
  tower.configureModules(files ? {entry, files} : {entry});
  const handle = tower.compileTests(testOptions);
  try {
    const checked = tower.execute(handle, 0);
    if (checked.status === 'error') requireStatus(checked, 'done');
    assert.equal(tower.testCount(handle), 1, entry);
    tower.useFast(handle);
    for (let i = 0; i < chunks; i++) {
      const result = tower.execute(handle, 100_000);
      if (result.status !== 'executing') return requireStatus(result, 'done');
    }
    assert.fail(entry + ' exceeded its execution budget');
  } finally { tower.destroyExecution(handle); }
}
