import {after, test} from 'node:test';
import {readFileSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {loadTower, runToEnd} from '../src/tower-host.mjs';
import {copyText, guestString} from './guest_text.mjs';
import {requireStatus, runSelectedTest} from './selected_test.mjs';

const fixtures = new URL('fixtures/scanners/', import.meta.url);
const modules = ['bedrock', 'foundation_syntax', 'types', 'foundation', 'tower',
  'library/testing', 'library/test_fixtures', 'library/vector', 'backend/text'];
const builtins = Object.fromEntries(await Promise.all(modules.map(async name =>
  [name, await readFile(new URL('../../scaffolding/' + name + '.tower', import.meta.url), 'utf8')])));
const wasm = await WebAssembly.compile(await readFile(process.env.TOWER_TEST_WASM ||
  new URL('../../build/browser-wasi/tower.wasm', import.meta.url)));
const open = options => loadTower(wasm, undefined, builtins.foundation, undefined, builtins.bedrock,
  {tower:builtins.tower, builtins, ...options});

// Assertion compilation must leave the subject's parser and its node IDs independent.
const subject = await open();
let checks, parsed, formatted;
after(() => { checks?.close(); subject.close(); });

function storeWord(context, address, value) {
  if (context.pointerBytes !== 4) throw new Error('Expected wasm32 scanner guest');
  const memory = context.memory();
  new DataView(memory.buffer, memory.byteOffset, memory.byteLength).setUint32(address, value, true);
}

function countedText(context, text, size) {
  const pointer = copyText(context, text);
  if (size) storeWord(context, size, Buffer.byteLength(text));
  return pointer;
}

const imports = {
  scanner_file(context, name, size) {
    const file = guestString(context, name);
    if (!/^[a-z_]+\.(tower|expected)$/.test(file)) throw new Error('Invalid scanner fixture ' + file);
    return countedText(context, readFileSync(new URL(file, fixtures), 'utf8'), size);
  },
  scanner_seed: context => copyText(context, subject.bedrockSeed()),
  scanner_parse(context, input, entry) {
    const source = guestString(context, input);
    const handle = entry ? subject.createBedrock(source) : subject.create(source);
    try {
      parsed = runToEnd(subject, handle);
      // Formatting allocates parser node IDs visible in subsequent sessions.
      formatted = subject.format(handle).source;
      return parsed.end.status === 'done';
    } finally { subject.destroy(handle); }
  },
  scanner_formatted: context => copyText(context, formatted),
  scanner_error: context => copyText(context, parsed.end.error),
  scanner_node_count: (_context, event) => parsed.events[event].nodes.length,
  scanner_node_label: (context, event, node) => copyText(context, parsed.events[event].nodes[node].label),
  scanner_output(context, input, size) {
    const handle = subject.compile(guestString(context, input));
    try {
      const result = subject.execute(handle);
      requireStatus(result, 'done');
      return countedText(context, result.output, size);
    } finally { subject.destroyExecution(handle); }
  },
};

async function check(name) {
  checks ??= await open({imports, threads:{capacity:1}});
  const entry = name + '_test.tower';
  const files = await Promise.all([entry, 'observations.tower'].map(async path =>
    ({path, text:await readFile(new URL(path, fixtures), 'utf8')})));
  try { runSelectedTest(checks, entry, undefined, {files, suffix:'_browser_test.tower'}); }
  finally { parsed = formatted = undefined; }
}

test('pattern syntax is an overridable contextual token, including within Bedrock itself', () => check('hash_pattern'));
test('recursive templates use ordinary rules and token sets, preserving strings and trivia', () => check('nested_template'));
test('generic contextual tokens stay inactive elsewhere and survive formatting', () => check('contextual_digits'));
