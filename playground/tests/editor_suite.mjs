// Each Node file opens one reactor, lazily, so an unrelated name needs no Wasm.
import {after} from 'node:test';
import {readFile} from 'node:fs/promises';
import {loadTower} from '../src/tower-host.mjs';
import {selectedTestSteps} from './selected_test.mjs';
import {copyText, guestString} from './guest_text.mjs';

const source = path => readFile(new URL('../../' + path, import.meta.url), 'utf8');

export function editorSuite(folder, fixtureNames, imports) {
  let host, needsTurn;
  const fixtures = new Map();
  const bindings = {
    ...imports,
    promise_turn() { needsTurn = true; },
    editor_fixture(context, file) {
      const name = guestString(context, file);
      if (!fixtures.has(name)) throw new Error('Unknown editor fixture ' + name);
      return copyText(context, fixtures.get(name));
    },
  };
  const root = 'playground/src/' + folder + '/';
  after(() => host?.close());
  return async function run(name, setup) {
    if (!host) {
      for (const file of fixtureNames) fixtures.set(file, await source(root + file));
      const modules = ['bedrock', 'foundation_syntax', 'types', 'foundation', 'tower',
        'library/testing', 'backend/text', 'library/vector'];
      const builtins = Object.fromEntries(await Promise.all(modules.map(async module =>
        [module, await source('scaffolding/' + module + '.tower')])));
      const bytes = await readFile(process.env.TOWER_TEST_WASM ||
        new URL('../../build/browser-wasi/tower.wasm', import.meta.url));
      host = await loadTower(bytes, undefined, builtins.foundation, undefined, builtins.bedrock, {
        tower:builtins.tower, builtins, imports:bindings, threads:{capacity:1},
      });
    }
    needsTurn = false;
    setup();
    const entry = root + 'suite.tower';
    const suffix = '_' + name + '_test.tower';
    const files = await Promise.all([entry, root + 'suite' + suffix].map(async path => ({path, text:await source(path)})));
    // A foreign call is synchronous. Let native promise reactions run between
    // bounded interpreter steps while this same selected test is still live.
    for (const _ of selectedTestSteps(host, entry, 256, {files, suffix}, 256)) {
      if (needsTurn) {
        needsTurn = false;
        await Promise.resolve();
      }
    }
  };
}
