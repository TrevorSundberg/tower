// OS/browser transport for selected existing Tower work/query/language fixtures.
// Does not require packaged UI assets, LLVM reactors or a deployment build.
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from '@playwright/test';
import {files, builtins} from '../tests/compiler-fixtures.mjs';

const [compilerPath, workPath, reportPath] = process.argv.slice(2);
if (!compilerPath || !workPath || !reportPath) throw new Error('Usage: node playground/scripts/test-shared-compiler.mjs COMPILER.wasm WORK.wasm REPORT.json');
const root = fileURLToPath(new URL('../../', import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const compiler = await readFile(compilerPath), work = await readFile(workPath);
const fixtures = await Promise.all(['decltype_lazy_body', 'decltype_generic_headers', 'comptime_flow'].map(async name =>
  ({name, source:await readFile(path.join(root, 'scaffolding/tests', name+'.tower'), 'utf8'), output:'0\n'})));
const headers = {'Cross-Origin-Opener-Policy':'same-origin', 'Cross-Origin-Embedder-Policy':'require-corp', 'Cache-Control':'no-store'};
const server = http.createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    let bytes, type;
    if (pathname === '/') { bytes = '<!doctype html><title>Tower shared compiler checks</title>'; type = 'text/html'; }
    else if (pathname === '/compiler.wasm' || pathname === '/work.wasm') {
      bytes = pathname === '/compiler.wasm' ? compiler : work; type = 'application/wasm';
    } else if (/^\/playground\/(?:src|tests)\/[a-z0-9_-]+\.mjs$/.test(pathname)) {
      bytes = await readFile(path.join(root, pathname.slice(1))); type = 'text/javascript';
    } else { response.writeHead(404, headers).end(); return; }
    response.writeHead(200, {...headers, 'Content-Type':type}).end(bytes);
  } catch (error) { response.writeHead(500, headers).end(error.message); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
const report = {compilerSHA256:hash(compiler), workSHA256:hash(work),
  fixtureHashes:Object.fromEntries(fixtures.map(fixture => [fixture.name, hash(fixture.source)])),
  resourceSHA256:hash(JSON.stringify({files, builtins})), trials:[], passed:false};
try {
  browser = await chromium.launch({headless:true});
  report.browser = browser.version();
  const context = await browser.newContext(), page = await context.newPage();
  await page.goto('http://127.0.0.1:'+server.address().port);
  report.host = await page.evaluate(() => ({userAgent:navigator.userAgent, hardwareConcurrency:navigator.hardwareConcurrency,
    isolated:crossOriginIsolated, sharedArrayBuffer:typeof SharedArrayBuffer !== 'undefined'}));
  assert.equal(report.host.isolated, true);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.exposeFunction('phaseProgress', name => console.log(name));
  let workers, retirementDeadline;
  page.on('worker', worker => {
    const entry = {url:worker.url(), closed:false};
    entry.finished = new Promise(resolve => worker.once('close', () => { entry.closed = true; resolve(); }));
    workers.push(entry);
  });
  const waitClosed = async entries => {
    let timer;
    try {
      await Promise.race([Promise.all(entries.map(worker => worker.finished)), new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Observed browser workers did not terminate')),
          Math.max(0, retirementDeadline-performance.now()));
      })]);
    } finally { clearTimeout(timer); }
  };
  await page.exposeFunction('joinBrowserChildren', async capacity => {
    // One unchanged 30s budget covers child retirement, coordinator termination
    // and both independent browser observations; no extra waiting allowance.
    retirementDeadline = performance.now()+30000;
    const children = workers.filter(worker => worker.url.endsWith('/src/compiler-thread-worker.mjs'));
    assert.equal(children.length, capacity, 'Observe every actual nested worker');
    const start = performance.now();
    await waitClosed(children);
    return performance.now()-start;
  });
  const cdp = await context.newCDPSession(page);
  const {targetInfo} = await cdp.send('Target.getTargetInfo');
  for (const trial of [{mode:'pool', capacity:4}, {mode:'compiler', capacity:1}, {mode:'compiler', capacity:4}]) {
    workers = [];
    const start = performance.now();
    const receipt = await page.evaluate(data => new Promise((resolve, reject) => {
      const worker = new Worker('/playground/tests/shared_compiler_worker.mjs', {type:'module'});
      const timer = setTimeout(() => { worker.terminate(); reject(new Error('Selected browser compiler trial exceeded 180 seconds')); }, 180000);
      const finish = action => { clearTimeout(timer); worker.terminate(); action(); };
      let result, started = false;
      worker.onerror = event => finish(() => reject(new Error(event.message)));
      worker.onmessage = ({data:message}) => {
        if (message.probe === 'start') { started = true; worker.postMessage(data); return; }
        if (message.probe === 'retire') {
          result.coordinatorProbes = ['start', 'retire'];
          finish(() => resolve(result)); return;
        }
        if (message.progress) { window.phaseProgress(message.progress); return; }
        if (message.error) finish(() => reject(new Error(JSON.stringify(message))));
        else if (started && message.result) {
          result = message.result;
          // terminate() requests shutdown; it is not a join. Keep the
          // coordinator's event loop alive until the browser reports each child
          // closed, then probe that loop before its single owner terminates it.
          window.joinBrowserChildren(data.capacity).then(milliseconds => {
            result.childCloseMilliseconds = milliseconds;
            worker.postMessage({probe:'retire'});
          },
            error => finish(() => reject(error)));
        }
      };
      worker.postMessage({probe:'start'});
    }), {...trial, files, builtins, fixtures});
    receipt.wallMilliseconds = performance.now()-start;
    // Retain canonical hashes in evidence, but compare the full text first.
    report.trials.push(receipt);
    let remaining;
    const closing = performance.now(), deadline = retirementDeadline;
    do {
      remaining = (await cdp.send('Target.getTargets')).targetInfos.filter(target =>
        target.browserContextId === targetInfo.browserContextId && target.type === 'worker');
      if (remaining.length) await new Promise(resolve => setTimeout(resolve, 25));
    } while (remaining.length && performance.now()<deadline);
    receipt.closeMilliseconds = performance.now()-closing;
    receipt.remainingWorkerTargets = remaining;
    assert.equal(remaining.length, 0, 'Closing the coordinator must terminate every nested browser worker: '+JSON.stringify(remaining));
    receipt.browserWorkersAfterClose = remaining.length;
    assert.equal(workers.length, trial.capacity+1, 'Coordinator and nested worker observations');
    // Target destruction and Playwright's close notification use separate CDP
    // sessions; either event may reach Node first. Require both observations.
    await waitClosed(workers);
    assert.ok(workers.every(worker => worker.closed), 'Every observed worker emitted close');
    receipt.browserWorkersClosed = workers.length;
  }
  const serial = report.trials.find(trial => trial.mode === 'compiler' && trial.capacity === 1);
  const parallel = report.trials.find(trial => trial.mode === 'compiler' && trial.capacity === 4);
  assert.deepEqual(parallel.results, serial.results, 'Serial/parallel output and canonical Foundation');
  for (const trial of [serial, parallel]) for (const fixture of fixtures) {
    const [graph, fast] = trial.results.filter(result => result.name === fixture.name);
    assert.equal(graph.canonical, fast.canonical);
  }
  assert.deepEqual(errors, []);
  report.passed = true;
} catch (error) {
  report.error = error.stack || error.message;
  process.exitCode = 1;
} finally {
  for (const trial of report.trials) for (const result of trial.results) {
    result.canonicalSHA256 = hash(result.canonical); delete result.canonical;
  }
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
  await writeFile(reportPath, JSON.stringify(report, null, 2)+'\n');
}
if (!report.passed) throw new Error(report.error);
console.log('Selected shared-Wasm browser checks passed; '+reportPath);
