// Reproducible native/WASM and actual input-to-render timings. Run a static
// server first, then: node scripts/profile.mjs ../build/playground-profile.json
import { chromium, devices } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { loadTower } from '../src/tower-host.mjs';

const summary = values => {
  const sorted = [...values].sort((a, b) => a - b);
  const percentile = p => +sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))].toFixed(2);
  return { count: values.length, p50: percentile(.5), p95: percentile(.95), max: percentile(1) };
};
const source = await readFile(new URL('../../scaffolding/examples/foreach.tower', import.meta.url), 'utf8');
const bytes = await readFile(new URL('../../build/browser-wasi/tower.wasm', import.meta.url));
const bootstrap = await readFile(new URL('../../scaffolding/foundation.tower', import.meta.url), 'utf8');
const bedrock = await readFile(new URL('../../scaffolding/bedrock.tower', import.meta.url), 'utf8');
const started = performance.now(), tower = await loadTower(bytes, undefined, bootstrap, undefined, bedrock);
const report = { at: new Date().toISOString(), units: 'milliseconds', moduleBytes: bytes.length,
  node: process.version, instantiate: performance.now() - started,
  sessionReuse: typeof tower.exports.tw_reset === 'function',
  measurement: 'Editor text mutation to result DOM update / next animation frame; actual keyboard input via Playwright',
  wasm: {}, browser: {} };
for (const [name, input] of [['example', source], ['500 loops', source + 'foreach(item in items){item;}\n'.repeat(500)]]) {
  const samples = { total: [], resetOrCreate: [], declarations: [], statements: [], inspect: [], destroy: [] };
  let handle = 0, snapshot;
  for (let i = 0; i < 25; i++) {
    const time = performance.now();
    if (handle) tower.reset(handle, input); else handle = tower.create(input);
    const created = performance.now();
    let declarations = 0, statements = 0;
    for (;;) {
      const before = performance.now(), event = tower.step(handle), elapsed = performance.now() - before;
      if (event.status === 'declaration') declarations += elapsed;
      else statements += elapsed;
      if (event.status === 'error') throw new Error(event.error);
      if (event.status === 'done') break;
    }
    const parsed = performance.now(); snapshot = tower.inspect(handle);
    const inspected = performance.now();
    if (!report.sessionReuse) { tower.destroy(handle); handle = 0; }
    const end = performance.now();
    if (i < 5) continue; // Tier up WASM before reporting steady-state edits.
    for (const [key, value] of Object.entries({ total: end - time, resetOrCreate: created - time,
      declarations, statements, inspect: inspected - parsed, destroy: end - inspected })) samples[key].push(value);
  }
  if (handle) tower.destroy(handle);
  report.wasm[name] = Object.fromEntries(Object.entries(samples).map(([key, values]) => [key, summary(values)]));
  report.wasm[name].grammarBuilds = snapshot.grammarBuilds;
  report.wasm[name].grammarCacheHits = snapshot.grammarCacheHits;
}

const browser = await chromium.launch();
try {
  for (const [name, options] of [['desktop', { viewport: { width: 1440, height: 1000 } }], ['mobile', devices['Pixel 7']]]) {
    const context = await browser.newContext(options), page = await context.newPage();
    await page.addInitScript(() => {
      const profile = window.__typingProfile = { edits: [], workers: 0, requests: [], input: null };
      const NativeWorker = window.Worker;
      window.Worker = class extends NativeWorker {
        constructor(...args) {
          super(...args); profile.workers++;
          this.addEventListener('message', ({ data }) => {
            const request = profile.requests.findLast(r => r.id === data.id && r.finished === undefined);
            if (request) { request.finished = performance.now(); request.parse = data.result?.ms; }
          });
        }
        postMessage(data, ...args) {
          profile.requests.push({ id: data.id, method: data.method, at: performance.now() });
          return super.postMessage(data, ...args);
        }
      };
      window.__startTypingProfile = () => {
        const content = document.querySelector('.cm-content');
        let previous = content.textContent;
        // Android CodeMirror can apply edits without a DOM input event. Watch
        // actual text changes, ignoring decoration-only mutations, on both.
        new MutationObserver(() => {
          const text = content.textContent;
          if (text !== previous) { previous = text; profile.input = { at: performance.now() }; }
        }).observe(content, { childList: true, characterData: true, subtree: true });
        new MutationObserver(() => {
          if (!profile.input || !/^(Complete|Stopped)/.test(document.querySelector('#status').textContent)) return;
          const edit = profile.input; profile.input = null;
          edit.render = performance.now() - edit.at;
          const request = profile.requests.at(-1);
          edit.queue = request.at - edit.at;
          edit.worker = request.finished - request.at;
          edit.parse = request.parse;
          requestAnimationFrame(() => { edit.frame = performance.now() - edit.at; profile.edits.push(edit); });
        }).observe(document.querySelector('#status'), { childList: true, characterData: true, subtree: true });
      };
    });
    await page.goto(process.env.TOWER_PROFILE_URL || 'http://127.0.0.1:4173/');
    await page.waitForFunction(() => document.querySelector('#status').textContent.startsWith('Complete'));
    await page.evaluate(() => window.__startTypingProfile());
    const editor = page.getByRole('textbox', { name: 'Tower source' });
    await editor.click(); await editor.press('ControlOrMeta+End');
    await page.keyboard.insertText('\n// typing ');
    await page.waitForFunction(() => window.__typingProfile.edits.length >= 1).catch(async error => {
      console.error(name, await page.evaluate(() => ({ profile: window.__typingProfile,
        status: document.querySelector('#status').textContent, source: document.querySelector('.cm-content').textContent })));
      throw error;
    });
    for (let i = 0; i < 20; i++) {
      await page.keyboard.insertText(String.fromCharCode(97 + i));
      await page.waitForFunction(count => window.__typingProfile.edits.length >= count, i + 2);
    }
    const single = await page.evaluate(() => window.__typingProfile.edits.slice(1));
    const count = await page.evaluate(() => window.__typingProfile.edits.length);
    const typing = ' continuous typing keeps going with no pause';
    await page.keyboard.type(typing, { delay: 15 });
    await page.waitForFunction(() => window.__typingProfile.input === null && document.querySelector('#status').textContent.startsWith('Complete'));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
    const state = await page.evaluate(() => window.__typingProfile);
    report.browser[name] = {
      isolated: Object.fromEntries(['render', 'frame', 'queue', 'worker', 'parse'].map(key => [key, summary(single.map(s => s[key]))])),
      continuous: { inputEvents: typing.length, updates: state.edits.length - count, final: state.edits.at(-1) },
      workers: state.workers,
    };
    console.error(name, JSON.stringify(report.browser[name]));
    await context.close();
  }
} finally { await browser.close(); }
const output = path.resolve(process.argv[2] || '../build/playground-profile.json');
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
