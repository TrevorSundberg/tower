// Compare parser reactors on the packaged compiler project, without browser or
// CPU-profiler overhead. Run from any directory; supply one or more .wasm paths.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadTower, runToEnd } from '../src/tower-host.mjs';

const root = new URL('../../', import.meta.url);
const project = JSON.parse(await readFile(new URL('build/compiler-project/project.json', root), 'utf8'));
const builtins = Object.fromEntries(await Promise.all(['bedrock', 'foundation', 'tower'].map(async name =>
  [name, await readFile(new URL(`scaffolding/${name}.tower`, root), 'utf8')])));
const entry = project.files.find(file => file.path === project.entry);
if (!entry) throw new Error('Compiler project entry is missing');
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const expected = new Map();
for (const wasm of process.argv.slice(2).length ? process.argv.slice(2) : [new URL('build/browser-wasi/tower.wasm', root)]) {
  const bytes = await readFile(wasm);
  const tower = await loadTower(bytes, undefined, builtins.foundation, undefined, builtins.bedrock, {tower: builtins.tower});
  tower.configureModules({entry: entry.path, library: '.', files: project.files, builtins});
  const handle = tower.create(entry.text);
  try {
    for (const phase of ['initial', 'reset']) {
      if (phase === 'reset') tower.reset(handle, entry.text);
      const start = performance.now();
      const parsed = runToEnd(tower, handle);
      const milliseconds = performance.now() - start;
      if (parsed.end.status !== 'done') throw new Error(parsed.end.error || 'Parse failed');
      const snapshot = tower.inspect(handle);
      // Compare corresponding phases: event revisions advance after reset.
      const result = digest({events: parsed.events, rules: snapshot.rules, keywords: snapshot.keywords,
        tokens: snapshot.tokens, highlights: snapshot.highlights, dependencies: tower.dependencies()});
      console.log(JSON.stringify({wasm: String(wasm), phase, milliseconds: +milliseconds.toFixed(2),
        entry: entry.path, files: project.files.length, grammarBuilds: snapshot.grammarBuilds,
        grammarCacheHits: snapshot.grammarCacheHits, result}));
      if (!expected.has(phase)) expected.set(phase, result);
      if (result !== expected.get(phase)) throw new Error('Parser results differ between reactors');
    }
  } finally { tower.destroy(handle); }
}
