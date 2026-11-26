import {readFileSync} from 'node:fs';
import {after} from 'node:test';
import {loadTower} from '../src/tower-host.mjs';
import {copyText} from './guest_text.mjs';
import {runSelectedTest} from './selected_test.mjs';

// The Tower API uses NUL-terminated UTF-8. Reject embedded terminators so an
// unexpected suffix in host output cannot disappear before an equality check.
export function moduleText(context, text) {
  if (typeof text !== 'string' || text.includes('\0')) throw new Error('Expected NUL-free module text');
  return copyText(context, text);
}

const sources = new URL('../../scaffolding/', import.meta.url);
const read = (root, name) => readFileSync(new URL(name, root), 'utf8');
const names = ['bedrock', 'foundation_syntax', 'types', 'foundation', 'tower'];
const grammar = Object.fromEntries(names.map(name => [name, read(sources, name + '.tower')]));
let module;
export async function moduleHost(options = {}, wrapper = grammar.foundation) {
  module ??= WebAssembly.compile(readFileSync(process.env.TOWER_TEST_WASM ||
    new URL('../../build/browser-wasi/tower.wasm', import.meta.url)));
  return loadTower(await module, undefined, wrapper, undefined, grammar.bedrock,
    {builtins:grammar, tower:grammar.tower, ...options});
}

// Keep the assertion VM separate from the project whose loader is under test.
export function selectedCases(directory, imports) {
  const root = new URL(directory + '/', import.meta.url);
  const prefix = 'playground/tests/' + directory + '/';
  const libraries = Object.fromEntries(['library/testing', 'backend/text', 'library/vector']
    .map(name => [name, read(sources, name + '.tower')]));
  let checks;
  after(() => checks?.close());
  return async (name, chunks = 10) => {
    checks ??= await moduleHost({imports, builtins:{...grammar, ...libraries}, threads:{capacity:1}});
    const entry = name + '_test.tower';
    const files = [entry, 'session.tower'].map(path => ({path:prefix + path, text:read(root, path)}));
    // Each entry belongs to a named Node registration. Collect its explicit
    // test body directly, without requiring a same-stem Tower production file.
    runSelectedTest(checks, prefix + entry, chunks, {files, suffix:'_module_test.tower'});
  };
}
