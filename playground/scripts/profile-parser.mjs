// Warm parsing + tree JSON timings, excluding grammar construction/reset.
// Optional old WASM path provides a reproducible before/after comparison.
import { readFile, writeFile } from 'node:fs/promises';
import { loadTower } from '../src/tower-host.mjs';
const bootstrap = await readFile(new URL('../../scaffolding/foundation.tower', import.meta.url), 'utf8');
const versions = [['after', new URL('../../build/browser-wasi/tower.wasm', import.meta.url)]];
if (process.argv[2]) versions.unshift(['before', process.argv[2]]);
const report = { at: new Date().toISOString(), method: 'Median of 11 warm step calls, includes tree JSON, excludes declaration parsing and reset.', versions: {} };
for (const [name, path] of versions) {
  const tower = await loadTower(await readFile(path), undefined, bootstrap);
  const results = report.versions[name] = {};
  for (const [shape, declaration, body] of [
    ['nested', "parse Value = '(' Value ')' | Number;parse Statement = Value ';';", n => '('.repeat(n) + '1' + ')'.repeat(n) + ';'],
    ['repetition', "parse Statement = Number* ';';", n => '1 '.repeat(n) + ';'],
  ]) {
    results[shape] = [];
    for (const n of [256, 512, 1024, 2048]) {
      const source = declaration + body(n), handle = tower.create(source), samples = [];
      try {
        for (let iteration = 0; iteration < 16; iteration++) {
          tower.reset(handle, source);
          for (let i = 0; i < (shape === 'nested' ? 2 : 1); i++) {
            const event = tower.step(handle);
            if (event.status !== 'declaration') throw new Error(event.error);
          }
          const start = performance.now(), event = tower.step(handle);
          const elapsed = performance.now() - start;
          if (event.status !== 'statement') throw new Error(event.error);
          if (iteration >= 5) samples.push(elapsed);
        }
        samples.sort((a, b) => a - b);
        results[shape].push({ n, medianMs: +samples[5].toFixed(3) });
      } finally { tower.destroy(handle); }
    }
  }
}
await writeFile(new URL('../../build/playground-parser-scaling.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
