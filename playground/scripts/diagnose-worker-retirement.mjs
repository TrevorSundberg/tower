// Bounded browser/OS boundary diagnostic. Does not alter the shared release gate.
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium} from '@playwright/test';

const [mode, workPath, reportPath, frozenSource] = process.argv.slice(2);
if (!['no-wasm', 'tower', 'tower-direct'].includes(mode) || !workPath || !reportPath)
  throw new Error('Usage: diagnose-worker-retirement.mjs no-wasm|tower|tower-direct WORK.wasm REPORT.json [FROZEN_SOURCE_ROOT]');
const root = fileURLToPath(new URL('../../', import.meta.url));
const sourceRoot = frozenSource ? path.resolve(frozenSource) : root;
const RETIREMENT_MS = 30000, PROBE_MS = 1000, TRIAL_MS = 180000, CAPACITY = 4;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const work = await readFile(workPath);
const report = {mode, sourceRoot, workSHA256:hash(work), launch:{headless:true}, capacity:CAPACITY,
  retirementBudgetMilliseconds:RETIREMENT_MS, sourceHashes:{}, events:[], passed:false};
let payload = {};
if (frozenSource) {
  const {files, builtins} = await import(pathToFileURL(path.join(sourceRoot, 'playground/tests/compiler-fixtures.mjs')));
  const fixtures = await Promise.all(['decltype_lazy_body', 'decltype_generic_headers', 'comptime_flow'].map(async name =>
    ({name, source:await readFile(path.join(sourceRoot, 'scaffolding/tests', name+'.tower'), 'utf8'), output:'0\n'})));
  payload = {files, builtins, fixtures};
  report.resourceSHA256 = hash(JSON.stringify({files, builtins}));
  report.payloadBytes = Buffer.byteLength(JSON.stringify(payload));
}
const record = (event, details = {}) => report.events.push({event,
  at:performance.timeOrigin+performance.now(), ...details});
const headers = {'Cross-Origin-Opener-Policy':'same-origin', 'Cross-Origin-Embedder-Policy':'require-corp', 'Cache-Control':'no-store'};
const server = http.createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    let bytes, type;
    if (pathname === '/') { bytes = '<!doctype html><title>Worker retirement boundary</title>'; type = 'text/html'; }
    else if (pathname === '/work.wasm') { bytes = work; type = 'application/wasm'; }
    else if (/^\/playground\/(?:src|tests)\/[a-z0-9_-]+\.mjs$/.test(pathname)) {
      const transportRoot = pathname.endsWith('/worker_retirement_boundary.mjs') ? root : sourceRoot;
      bytes = await readFile(path.join(transportRoot, pathname.slice(1)));
      report.sourceHashes[pathname] = hash(bytes); type = 'text/javascript';
    } else { response.writeHead(404, headers).end(); return; }
    response.writeHead(200, {...headers, 'Content-Type':type}).end(bytes);
  } catch (error) { response.writeHead(500, headers).end(error.message); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser, diagnosticPage, deadline, workers = [], live = [];
const isCoordinator = entry => entry.url.includes('mode=') || entry.url.endsWith('/shared_compiler_worker.mjs');
const start = performance.now();
const bounded = async (promise, milliseconds) => {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Observation deadline expired')), Math.max(0, milliseconds));
  })]); } finally { clearTimeout(timer); }
};
try {
  browser = await chromium.launch(report.launch);
  report.browser = browser.version();
  const discovery = await browser.newBrowserCDPSession();
  const known = new Map();
  discovery.on('Target.targetCreated', ({targetInfo}) => {
    known.set(targetInfo.targetId, targetInfo);
    if (targetInfo.type === 'worker') record('cdp.created', {target:targetInfo});
  });
  discovery.on('Target.targetDestroyed', ({targetId}) => {
    if (known.get(targetId)?.type === 'worker') record('cdp.destroyed', {targetId});
    known.delete(targetId);
  });
  await discovery.send('Target.setDiscoverTargets', {discover:true});
  const context = await browser.newContext(), page = await context.newPage();
  diagnosticPage = page;
  page.on('worker', worker => {
    const entry = {worker, ordinal:workers.length, url:worker.url(), closed:false};
    record('playwright.created', {ordinal:entry.ordinal, url:entry.url});
    entry.finished = new Promise(resolve => worker.once('close', () => {
      entry.closed = true; record('playwright.closed', {ordinal:entry.ordinal, url:entry.url}); resolve();
    }));
    workers.push(entry);
  });
  page.on('pageerror', error => record('page.error', {error:error.message}));
  await page.goto('http://127.0.0.1:'+server.address().port);
  report.host = await page.evaluate(() => ({userAgent:navigator.userAgent,
    hardwareConcurrency:navigator.hardwareConcurrency, isolated:crossOriginIsolated}));
  assert.equal(report.host.isolated, true);
  await page.exposeFunction('joinBoundaryChildren', async () => {
    deadline = performance.now()+RETIREMENT_MS;
    const children = workers.filter(entry => !isCoordinator(entry));
    assert.equal(children.length, CAPACITY);
    record('children.join.begin');
    await bounded(Promise.all(children.map(entry => entry.finished)), deadline-performance.now());
    record('children.join.closed');
  });
  report.result = await page.evaluate(({mode, capacity, trialMS, payload}) => new Promise((resolve, reject) => {
    const events = [], record = (event, details = {}) => events.push({event,
      at:performance.timeOrigin+performance.now(), ...details});
    // One coordinator-owned scalar observed atomically by its parent. It proves
    // reaching the reply's microtask checkpoint, not native child-thread join.
    const retireCheckpoint = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));
    const worker = new Worker(mode === 'tower-direct' ? '/playground/tests/shared_compiler_worker.mjs'
      : '/playground/tests/worker_retirement_boundary.mjs?mode='+mode, {type:'module'});
    const checkpoint = () => mode === 'tower-direct' ? null : Atomics.load(retireCheckpoint, 0);
    const terminate = () => {
      record('parent.terminate.call', {retireCheckpoint:checkpoint()});
      const result = worker.terminate();
      record('parent.terminate.return', {returnType:typeof result, retireCheckpoint:checkpoint()});
    };
    const timer = setTimeout(() => { terminate(); reject(new Error('Boundary trial exceeded180 seconds')); }, trialMS);
    let result;
    window.boundaryProbeAfterTermination = () => {
      record('parent.post-after-terminate'); worker.postMessage({probe:'after-terminate'});
    };
    window.boundaryEvents = events;
    window.boundaryCheckpoint = checkpoint;
    const start = () => {
      record('parent.start-probe.sent');
      worker.postMessage({probe:'start', retireCheckpoint:retireCheckpoint.buffer});
    };
    worker.onerror = event => { clearTimeout(timer); terminate(); reject(new Error(event.message)); };
    worker.onmessage = ({data}) => {
      if (data.boundary) { events.push({...data.boundary, receivedAt:performance.timeOrigin+performance.now()}); return; }
      if (data.boundaryReady) {
        start(); return;
      }
      if (data.probe) record('parent.probe.received', {probe:data.probe});
      if (data.probe === 'start') { worker.postMessage({mode:'pool', capacity, ...payload}); return; }
      if (data.probe === 'retire') {
        clearTimeout(timer); terminate(); resolve({fixture:result}); return;
      }
      if (data.error) { clearTimeout(timer); terminate(); reject(new Error(data.error)); return; }
      if (data.result) {
        result = data.result; record('parent.result.received');
        window.joinBoundaryChildren().then(() => {
          record('parent.retire-probe.sent'); worker.postMessage({probe:'retire'});
        }, error => { clearTimeout(timer); terminate(); reject(error); });
      }
    };
    if (mode === 'tower-direct') start();
  }), {mode, capacity:CAPACITY, trialMS:TRIAL_MS, payload});
  const cdp = await context.newCDPSession(page);
  const {targetInfo} = await cdp.send('Target.getTargetInfo');
  let probed = false;
  do {
    live = (await discovery.send('Target.getTargets')).targetInfos.filter(target =>
      target.browserContextId === targetInfo.browserContextId && target.type === 'worker');
    if (live.length && !probed && deadline-performance.now() < RETIREMENT_MS-PROBE_MS) {
      probed = true;
      await page.evaluate(() => window.boundaryProbeAfterTermination());
      const coordinator = workers.find(isCoordinator);
      report.postTerminateEvaluation = await bounded(coordinator.worker.evaluate(() => ({alive:true, url:location.href}))
        .then(value => ({value}), error => ({error:error.message})), Math.min(PROBE_MS, deadline-performance.now()))
        .catch(error => ({error:error.message}));
      record('post-terminate.evaluation', report.postTerminateEvaluation);
    }
    if (live.length) await new Promise(resolve => setTimeout(resolve, 25));
  } while (live.length && performance.now()<deadline);
  report.liveTargetsAtDeadline = live;
  report.pageEvents = await page.evaluate(() => window.boundaryEvents);
  report.retireCheckpoint = await page.evaluate(() => window.boundaryCheckpoint());
  // OS thread names are supplementary: they can outlive a destroyed context.
  if (process.platform === 'linux') report.osThreads = execFileSync('/usr/bin/ps',
    ['-eLo','pid,ppid,lwp,stat,comm,wchan:32'], {encoding:'utf8'});
  assert.equal(live.length, 0, 'Coordinator/nested worker target survived retirement');
  assert.equal(workers.length, CAPACITY+1);
  await bounded(Promise.all(workers.map(entry => entry.finished)), deadline-performance.now());
  assert.ok(workers.every(entry => entry.closed));
  report.passed = true;
} catch (error) {
  report.error = error.stack || error.message; process.exitCode = 1;
} finally {
  if (!report.pageEvents && diagnosticPage) report.pageEvents = await diagnosticPage.evaluate(() => window.boundaryEvents).catch(() => null);
  report.observedWorkers = workers.map(({ordinal, url, closed}) => ({ordinal, url, closed}));
  report.wallMilliseconds = performance.now()-start;
  // Preserve observations before closing the browser; teardown is not a pass.
  await writeFile(reportPath, JSON.stringify(report, null, 2)+'\n');
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
console.log((report.passed ? 'PASS' : 'FAIL')+' '+mode+' '+reportPath);
