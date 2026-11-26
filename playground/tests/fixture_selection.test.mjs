// Transport the actual project uploads and copy each terminal observation to the selected Tower test.
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {files} from './compiler-fixtures.mjs';
import {fixtureSource, guestString, openTower, requireStatus} from './compiler_test_host.mjs';

const root = '.tower/tests/';
const owner = root + 'function_values.tower';
const companion = root + 'function_values_test.tower';
const oracle = root + 'function_values.expected';
const grants = root + 'fixture_selection/live_grants';
const readExpected = name => readFile(new URL('../../scaffolding/tests/' + name + '.expected', import.meta.url), 'utf8');
const zero = await readExpected('function_values');
const wordBytes = await readExpected('fixture_selection/live_grants');

function replaceTexts(project, changes) {
  return project.map(file => Object.hasOwn(changes, file.path) ? {...file, text:changes[file.path]} : file);
}
const original = [...files, {path:oracle, text:zero}];
const edited = replaceTexts(original, {[owner]:fixtureSource(owner).replace('print(convert(i32, check()))', 'print(1)')});
const registered = [...replaceTexts(original, {[owner]:fixtureSource(grants + '.tower'), [oracle]:wordBytes}),
  {path:grants + '.expected', text:wordBytes}];
const mounted = replaceTexts(registered, {[grants + '.tower']:fixtureSource(owner), [grants + '.expected']:zero});

test('live fixture grants retain their compiled source and registered oracle across uploads', async () => {
  const results = new Map();
  const handles = new Set();
  const encoder = new TextEncoder();
  const tower = await openTower({imports:{
    fixture_result_number(context, name, field) {
      const value = results.get(guestString(context, name))[guestString(context, field)];
      if (typeof value !== 'boolean' && !Number.isSafeInteger(value)) throw new Error('Missing numeric fixture observation');
      return Number(value);
    },
    fixture_result_text(context, name, field, data, capacity) {
      const row = results.get(guestString(context, name));
      const key = guestString(context, field);
      const value = key === 'errorFile' ? row.errorFile ?? '' : row[key];
      if (typeof value !== 'string') throw new Error('Missing fixture text: ' + key);
      const bytes = encoder.encode(value);
      if (bytes.length <= Number(capacity)) context.memory().set(bytes, Number(data));
      return bytes.length;
    },
  }});

  function select(entry, project, pointerBytes) {
    tower.configureModules({entry, files:project});
    const handle = tower.compileTests({pointerBytes});
    handles.add(handle);
    return handle;
  }
  function release(handle) {
    tower.destroyExecution(handle);
    handles.delete(handle);
  }
  function observe(name, handle) {
    results.set(name, {count:tower.testCount(handle), ...tower.execute(handle, 100000)});
  }
  try {
    const older = select(owner, original, 4);
    const wrong = select(companion, edited, 8);
    const missing = select(companion, files, 4);
    const restored = select(owner, original, 8);
    // Mount the word-size program and its oracle over the old pair.
    tower.mountFiles(registered);
    observe('older', older);
    release(older);
    const check = select(grants + '_test.tower', registered, 8);
    // Both new siblings now have different bytes. The old absent oracle is mounted.
    tower.mountFiles(mounted);
    observe('restored', restored);
    observe('missing', missing);
    observe('wrong', wrong);
    const selected = tower.testCount(check);
    requireStatus(tower.execute(check, 100000), 'done');
    if (selected !== 1) throw new Error('Expected one live-grants assertion test');
  } finally {
    for (const handle of handles) release(handle);
  }
});
