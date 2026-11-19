// Usage: node playground/scripts/profile-replacement-port.mjs before.wasm report.json [after.wasm]
// Run after builds/tests finish. Times include compilation and Foundation output.
import {readFile, writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {loadTower} from '../src/tower-host.mjs';

const [baseline, destination, current] = process.argv.slice(2);
assert(baseline && destination, 'Supply a baseline Wasm compiler and report path');
const root = new URL('../../', import.meta.url);
const foundation = await readFile(new URL('scaffolding/foundation.tower', root), 'utf8');
const bedrock = await readFile(new URL('scaffolding/bedrock.tower', root), 'utf8');
const after = current ?? new URL('build/browser-wasi/tower.wasm', root);
const compilers = {};
for (const [name, path] of [['before', baseline], ['after', after]]) {
  compilers[name] = await loadTower(await readFile(path), undefined, foundation, undefined, bedrock);
}
const duplicate = "parse Statement |= 'twice' '{' $body:Statement* '}' => replace { { $body $body } };\n";
const statements = count => 'value = value + 1;\n'.repeat(count);
const fixtures = {
  capture200: duplicate + 'var value: i32 = 0; twice {' + statements(200) + '} print(value);',
  capture1000: duplicate + 'var value: i32 = 0; twice {' + statements(1000) + '} print(value);',
  nestedCapture: duplicate + 'var value: i32 = 0; twice { twice { twice {' + statements(40) + '} } } print(value);',
  statements500: "parse Statement |= 'bump' ';' => replace { value = value + 1; }; var value: i32 = 0;\n" + 'bump;\n'.repeat(500) + 'print(value);',
  inferred500: "parse Bump = 'bump' ';' => replace { value = value + 1; }; parse Statement |= Bump; var value: i32 = 0;\n" + 'bump;\n'.repeat(500) + 'print(value);',
};
const report = {node:process.version, baseline, current:String(after),
  method:'12 warmups + 40 alternating paired samples; compile + canonical Foundation formatting; milliseconds', fixtures:{}};
for (const [fixture, source] of Object.entries(fixtures)) {
  const samples = {before:[], after:[]};
  let expected;
  for (let sample = 0; sample < 52; ++sample) {
    for (const name of sample % 2 ? ['after', 'before'] : ['before', 'after']) {
      const tower = compilers[name];
      const start = performance.now();
      const handle = tower.compile(source);
      try {
        const result = tower.foundation(handle);
        const elapsed = performance.now() - start;
        assert.equal(result.error, undefined, JSON.stringify(result));
        expected ??= JSON.stringify(result);
        assert.equal(JSON.stringify(result), expected, fixture);
        if (sample >= 12) samples[name].push(elapsed);
      } finally {
        tower.destroyExecution(handle);
      }
    }
  }
  const result = report.fixtures[fixture] = {};
  for (const name of ['before', 'after']) {
    const sorted = [...samples[name]].sort((a, b) => a - b);
    result[name] = {p50:+sorted[20].toFixed(3), p95:+sorted[38].toFixed(3), samples:samples[name]};
  }
  console.log(fixture, JSON.stringify(Object.fromEntries(Object.entries(result).map(([name, {p50, p95}]) => [name, {p50, p95}]))));
}
await writeFile(destination, JSON.stringify(report, null, 2) + '\n');
