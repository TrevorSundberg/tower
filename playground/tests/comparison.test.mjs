import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareResults } from '../src/comparison.mjs';
test('comparison waits for both terminal results and includes observable traps and truncation', () => {
  const done = { status: 'done', output: '42\n', steps: 42 };
  assert.equal(compareResults(done, null), null);
  assert.deepEqual(compareResults(done, { status: 'done', output: '42\n', error: '', errorOffset: 0, outputTruncated: false }), []);
  assert.deepEqual(compareResults(done, { ...done, output: '43\n' }), ['output']);
  const trap = { status: 'error', output: '', error: 'Division by zero', errorOffset: 17 };
  assert.deepEqual(compareResults(trap, { ...trap, errorOffset: 18 }), ['errorOffset']);
  assert.deepEqual(compareResults(done, { ...done, outputTruncated: true }), ['outputTruncated']);
});
