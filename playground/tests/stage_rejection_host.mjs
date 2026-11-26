// Subject handles close before the selected Tower test reads these fields.
import {after} from 'node:test';
import {readFile} from 'node:fs/promises';
import {loadTower} from '../src/tower-host.mjs';
import {builtins, files} from './compiler-fixtures.mjs';
import {fixtureSource, guestString, runSelectedTest} from './compiler_test_host.mjs';

let result, portable, readMessage;

function integerField(name) {
 const value = result[name];
 if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid rejection field ' + name);
 return value;
}
const encoder = new TextEncoder();

const imports = {
 stage_text(context, field) {
  const key = guestString(context, field);
  if (key === 'error') readMessage = true;
  const value = result[key];
  if (typeof value !== 'string' || value.includes('\0')) throw new Error('Invalid rejection field ' + key);
  const bytes = encoder.encode(value + '\0');
  const pointer = context.allocate(bytes.length);
  if (!pointer) throw new Error('Cannot copy rejection field ' + key);
  context.memory().set(bytes, pointer);
  return pointer;
 },
 stage_error_offset: () => integerField('errorOffset'),
 stage_portable: () => portable,
 stage_steps: () => integerField('steps'),
 stage_output_truncated() {
  if (typeof result.outputTruncated !== 'boolean') throw new Error('Missing output truncation flag');
  return result.outputTruncated;
 },
};

function checkObservation(checker, name, backend, pointerBytes, observation) {
 result = observation;
 readMessage = false;
 portable = backend === 'portable';
 try {
  const entry = `${directory}${name}_browser.tower`;
  runSelectedTest(checker, entry, 10, {pointerBytes, suffix:'_browser_test.tower'});
  if (!readMessage) throw new Error(entry + ' did not read the subject diagnostic');
 } catch (error) {
  throw new Error(`${name} (${backend}, ${pointerBytes}-byte pointers): ${error.message}\nObserved: ${JSON.stringify(result)}`, {cause:error});
 } finally { result = undefined; }
}

const directory = '.tower/tests/semantic_invalid/';
// Install the assertion project's sources when the private reactor opens.
const assertionInputs = files.filter(({path}) => path.startsWith(directory) ||
 path.startsWith('.tower/library/') || path === '.tower/backend/text.tower');

// Keep filtered runs lazy. The checker lives across independently registered Node tests.
let checker;
after(() => checker?.close());

export async function checkStageRejection(host, project, name, backend) {
 if (!checker) {
  const wasm = await readFile(process.env.TOWER_TEST_WASM || new URL('../../build/browser-wasi/tower.wasm', import.meta.url));
  checker = await loadTower(wasm, undefined, builtins.foundation, undefined, builtins.bedrock, {
   imports, builtins, tower:builtins.tower, project:{files:assertionInputs},
  });
 }
 const entry = directory + name + '.tower';
 const source = fixtureSource(entry);
 try {
  host.configureModules({entry});
  for (const width of [4, 8]) {
   let observed;
   if (backend === 'portable') {
    const handle = host.compile(source, {pointerBytes:width});
    try { observed = host.execute(handle); }
    finally { host.destroyExecution(handle); }
   } else {
    observed = host.compile(source, {target:`wasm${width * 8}-unknown-unknown`});
   }
   checkObservation(checker, name, backend, width, observed);
  }
 } finally { host.configureModules(project); }
}
