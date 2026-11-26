import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {loadTower} from '../src/tower-host.mjs';
import {compare_results} from './comparison_host.mjs';
import {runSelectedTest} from './selected_test.mjs';

test('comparison waits for both terminal results and includes observable traps and truncation', async () => {
  const read = path => readFile(new URL(path, import.meta.url), 'utf8');
  const entry = 'playground/src/comparison_test.tower';
  const files = [{path:entry, text:await read('../src/comparison_test.tower')}];
  const modules = ['bedrock', 'foundation_syntax', 'types', 'foundation', 'tower',
    'library/testing', 'backend/text', 'library/vector', 'tests/browser_comparison'];
  const builtins = Object.fromEntries(await Promise.all(modules.map(async name =>
    [name, await read('../../scaffolding/' + name + '.tower')])));
  const bytes = await readFile(process.env.TOWER_TEST_WASM ||
    new URL('../../build/browser-wasi/tower.wasm', import.meta.url));
  const host = await loadTower(bytes, undefined, builtins.foundation, undefined, builtins.bedrock, {
    tower:builtins.tower, builtins, project:{files}, threads:{capacity:1},
    imports:{compare_results},
  });
  // The owner is an ES module. Collect the explicit Tower entry on its own.
  try { runSelectedTest(host, entry, 1, {suffix:'_browser_test.tower'}); }
  finally { host.close(); }
});
