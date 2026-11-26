// Exercise the lifetime boundary between browser project uploads and live test handles.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {files} from './compiler-fixtures.mjs';
import {openTower, requireStatus} from './compiler_test_host.mjs';

const tower = await openTower();
const owner = '.tower/tests/function_values.tower';
const companion = '.tower/tests/function_values_test.tower';
const oracle = '.tower/tests/function_values.expected';
const expected = await readFile(new URL('../../scaffolding/tests/function_values.expected', import.meta.url), 'utf8');

test('live fixture grants retain their compiled source and registered oracle across uploads', () => {
  const handles = [];
  function select(entry, project, pointerBytes) {
    tower.configureModules({entry, files:project});
    const handle = tower.compileTests({pointerBytes});
    handles.push(handle);
    assert.equal(tower.testCount(handle), 1);
    return handle;
  }
  function execute(handle) {
    const result = tower.execute(handle, 100000);
    assert.ok(!result.outputTruncated);
    return result;
  }
  try {
    const original = [...files, {path:oracle, text:expected}];
    const older = select(owner, original, 4);
    const edited = original.map(file => file.path === owner ?
      {...file, text:file.text.replace('print(convert(i32, check()))', 'print(1)')} : file);
    assert.notEqual(edited.find(f => f.path === owner).text, original.find(f => f.path === owner).text);
    const wrong = select(companion, edited, 8);
    const missing = select(companion, files, 4);
    const restored = select(owner, original, 8);
    // A mounted oracle remains inaccessible to the handle compiled without it.
    tower.mountFiles(original);
    requireStatus(execute(restored), 'done');
    const absent = execute(missing);
    requireStatus(absent, 'error');
    assert.equal(absent.error, 'Cannot open fixture: ' + oracle);
    assert.equal(absent.errorFile, companion);
    const mismatch = execute(wrong);
    requireStatus(mismatch, 'error');
    assert.equal(mismatch.error, 'Function values stdout differs from function_values.expected');
    assert.equal(mismatch.errorFile, companion);
    requireStatus(execute(older), 'done');
  } finally {
    for (const handle of handles) tower.destroyExecution(handle);
  }
});
