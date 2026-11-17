// From playground: node scripts/profile-replacements.mjs
// Measures WASM parsing/expansion/JSON, not browser input-to-paint latency.
import { readFile, writeFile } from 'node:fs/promises';
import { loadTower, runToEnd } from '../src/tower-host.mjs';
const source = await readFile(new URL('../../scaffolding/examples/replacements.tower', import.meta.url), 'utf8');
const tower = await loadTower(await readFile(new URL('../../build/browser-wasi/tower.wasm', import.meta.url)), undefined,
  await readFile(new URL('../../scaffolding/foundation.tower', import.meta.url), 'utf8'));
const handle = tower.create(source);
try {
  const start = performance.now();
  const initial = runToEnd(tower, handle);
  if (initial.end.status !== 'done') throw new Error(initial.end.error);
  const coldParseMs = performance.now() - start, samples = [];
  for (let i = 0; i < 16; ++i) {
    const before = performance.now();
    tower.reset(handle, source.replace('increment(2 * 3);', `increment(2 * ${i % 2 + 3});`));
    const result = runToEnd(tower, handle);
    if (result.end.status !== 'done') throw new Error(result.end.error);
    tower.inspect(handle);
    if (i >= 5) samples.push(performance.now() - before);
  }
  samples.sort((a, b) => a - b);
  const snapshot = tower.inspect(handle);
  const report = { at: new Date().toISOString(),
    measurement: 'WASM reset, full parse/expansion, JSON and inspection; edits to invocation only',
    coldParseMs, warmMedianMs: samples[5], warmMaxMs: samples.at(-1),
    warmGrammarBuilds: snapshot.grammarBuilds, warmGrammarCacheHits: snapshot.grammarCacheHits, samples };
  await writeFile(new URL('../../build/replacements-profile.json', import.meta.url), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { tower.destroy(handle); }
