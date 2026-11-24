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

const [compilerPath, workPath, reportPath, selection] = process.argv.slice(2);
if (!compilerPath || !workPath || !reportPath) throw new Error('Usage: node playground/scripts/test-shared-compiler.mjs COMPILER.wasm WORK.wasm REPORT.json [lr-bounded|ownership[:modes]]');
const ownershipModes = ['startup-cancel', 'partial-startup-cancel', 'busy-cancel', 'coordinator-error', 'coordinator-messageerror', 'startup-error', 'shared-trap', 'generation-retire', 'retired-errors'];
const selectedModes = selection === 'ownership' ? ownershipModes : selection?.startsWith('ownership:') ? selection.slice('ownership:'.length).split(',') : null;
const boundedLR = selection === 'lr-bounded';
if (selection !== undefined && !boundedLR && (!selectedModes || selectedModes.some(mode => !ownershipModes.includes(mode)))) throw new Error('Unknown shared compiler selection');
const root = fileURLToPath(new URL('../../', import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const compiler = await readFile(compilerPath), work = await readFile(workPath);
const fixtures = await Promise.all(['decltype_lazy_body', 'decltype_generic_headers', 'comptime_flow'].map(async name =>
  ({name, source:await readFile(path.join(root, 'scaffolding/tests', name+'.tower'), 'utf8'), output:'0\n'})));
fixtures.push({name:'entity_descriptor_growth', output:'0\n',
  source:await readFile(new URL('../tests/fixtures/entity_descriptor_growth.tower', import.meta.url), 'utf8')});
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
  report.boundaries = [];
  page.on('console', message => {
    if (message.text().startsWith('compiler-boundary ')) {
      report.boundaries.push(JSON.parse(message.text().slice('compiler-boundary '.length)));
      console.log(message.text());
    }
  });
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
  if (selectedModes) {
    const capacity = 4;
    for (const mode of selectedModes) {
      workers = [];
      const start = performance.now();
      const receipt = await page.evaluate(async data => {
        const {createCompilerWorker} = await import('/playground/src/compiler-worker-group.mjs');
        return new Promise((resolve, reject) => {
          const busy = data.mode === 'busy-cancel';
          const worker = createCompilerWorker('/playground/tests/'+(busy ? 'shared_compiler_worker' : 'compiler_group_control')+'.mjs',
            {type:'module', capacity:data.capacity});
          let closed = false, ready = false, retired = false, replacement;
          let errors = 0, staleErrors = 0, staleMessageErrors = 0, staleMessages = 0;
          const timer = setTimeout(() => finish({error:'Ownership control exceeded 180 seconds'}, true), 180000);
          const finish = (result, failed = false) => {
            if (closed) return;
            closed = true; clearTimeout(timer); worker.terminate(); replacement?.terminate();
            // Let already-queued messages cross their event boundary; the owner
            // must suppress them. This does not wait for or substitute retirement.
            setTimeout(() => failed ? reject(new Error(result.error)) : resolve({...result, ready,
              errors, staleErrors, staleMessageErrors, staleMessages}), 0);
          };
          const replace = () => {
            retired = true; worker.terminate();
            replacement = createCompilerWorker('/playground/tests/shared_compiler_worker.mjs', {type:'module', capacity:data.capacity});
            replacement.onerror = event => { event.preventDefault(); finish({error:event.message}, true); };
            replacement.onmessage = ({data:message}) => {
              if (message.probe === 'start') {
                // Controlled page EventTarget delivery, not a claim that the
                // browser queued a native error. Old callbacks model stop() on
                // the reusable Engine/LanguageService owner's current worker.
                for (let repeat = 0; repeat < 2; repeat++) {
                  worker.dispatchEvent(new ErrorEvent('error', {message:'Retired coordinator failure', cancelable:true}));
                  worker.dispatchEvent(new MessageEvent('messageerror'));
                }
                worker.dispatchEvent(new MessageEvent('message', {data:{echo:'retired-generation'}}));
                if (staleErrors || staleMessageErrors || staleMessages) {
                  finish({error:'Retired coordinator events reached its owner'}); return;
                }
                replacement.postMessage({...data, mode:'pool'});
              } else if (message.error) finish({error:message.error}, true);
              else if (message.result) finish({replacement:message.result});
            };
            replacement.postMessage({probe:'start'});
          };
          worker.onerror = event => {
            event.preventDefault();
            if (retired) { staleErrors++; replacement?.terminate(); return; }
            errors++;
            if (closed) return;
            const expected = data.mode === 'coordinator-error' ? /Injected compiler coordinator failure/
              : data.mode === 'startup-error' ? /Compiler thread failed during startup/
              : data.mode === 'coordinator-messageerror' ? /Compiler coordinator message failed/ : null;
            finish({error:event.message}, !expected?.test(event.message));
            // The first active failure must be delivered once even when more
            // coordinator failures arrive reentrantly after group retirement.
            worker.dispatchEvent(new ErrorEvent('error', {message:'Duplicate coordinator failure', cancelable:true}));
            worker.dispatchEvent(new MessageEvent('messageerror'));
          };
          worker.addEventListener('messageerror', () => { staleMessageErrors++; replacement?.terminate(); });
          worker.onmessage = ({data:message}) => {
            if (retired) { staleMessages++; replacement?.terminate(); return; }
            if (closed) { reject(new Error('Retired compiler forwarded an old-generation message')); return; }
            if (message.ready) {
              ready = true;
              if (data.mode === 'coordinator-error') worker.postMessage({crash:true});
              else if (data.mode === 'coordinator-messageerror') worker.dispatchEvent(new MessageEvent('messageerror'));
              else if (data.mode === 'generation-retire') worker.postMessage({retire:true});
              else if (data.mode === 'retired-errors') replace();
              else finish({error:'Unexpected completed startup'}, true);
            } else if (data.mode === 'generation-retire' && message.retireBoundary) {
              finish({cancelled:'generation'});
            } else if (data.mode === 'partial-startup-cancel' && message.partialStarted) {
              finish({cancelled:'partial-startup', threadReadyCount:message.threadReadyCount, heldCount:message.heldCount});
            } else if (data.mode === 'startup-cancel' && message.progress === 'creating') {
              finish({cancelled:'startup'});
            } else if (busy && message.progress === 'lr_work_tests') {
              finish({cancelled:'lr_work_tests'});
            } else if (message.error) {
              finish({error:message.error, sharedFailure:message.failed},
                data.mode !== 'shared-trap' || !message.failed || !/Injected compiler worker failure/.test(message.error));
            } else if (message.result) finish({error:'Cancellation did not interrupt the selected workload'}, true);
          };
          worker.postMessage(busy ? {...data, mode:'compiler'} : data);
        });
      }, {mode, capacity, files, builtins, fixtures});
      receipt.mode = mode; receipt.results = []; receipt.wallMilliseconds = performance.now()-start;
      report.trials.push(receipt);
      retirementDeadline = performance.now()+30000;
      let remaining;
      do {
        remaining = (await cdp.send('Target.getTargets')).targetInfos.filter(target =>
          target.browserContextId === targetInfo.browserContextId && target.type === 'worker');
        if (remaining.length) await new Promise(resolve => setTimeout(resolve, 25));
      } while (remaining.length && performance.now()<retirementDeadline);
      receipt.remainingWorkerTargets = remaining;
      assert.equal(remaining.length, 0, 'Ownership control must close every worker: '+JSON.stringify(remaining));
      await waitClosed(workers);
      assert.ok(workers.every(worker => worker.closed));
      receipt.browserWorkersClosed = workers.length;
      receipt.browserWorkersAfterClose = remaining.length;
      const groups = mode === 'retired-errors' ? 2 : 1;
      assert.ok(workers.length >= 1 && workers.length <= groups*(capacity+1), 'No workers beyond the declared groups');
      if (mode === 'retired-errors') {
        assert.equal(receipt.error, undefined);
        assert.equal(receipt.replacement?.mode, 'pool');
        assert.equal(receipt.replacement.opened, capacity);
        assert.equal(receipt.replacement.closed, capacity);
      }
      if (!['startup-cancel', 'partial-startup-cancel', 'startup-error'].includes(mode)) assert.equal(workers.length, groups*(capacity+1));
      assert.equal(receipt.errors, ['coordinator-error', 'coordinator-messageerror', 'startup-error'].includes(mode) ? 1 : 0);
      assert.equal(receipt.staleErrors, 0);
      assert.equal(receipt.staleMessageErrors, 0);
      assert.equal(receipt.staleMessages, 0);
      if (mode === 'startup-cancel') assert.equal(receipt.ready, false);
      if (mode === 'partial-startup-cancel') {
        assert.ok(workers.length > 1, 'Cancellation must observe an actual child');
        assert.ok(receipt.heldCount > 0 && receipt.threadReadyCount < capacity);
        assert.equal(receipt.ready, false);
      }
      if (mode === 'generation-retire') assert.ok(report.boundaries.some(item => item.label === 'coordinator:old-reply-posted'),
        'The retiring coordinator must actually post its old-generation reply');
      console.log('Ownership control passed: '+mode);
    }
  } else for (const trial of boundedLR ? [{mode:'lr-bounded', capacity:2}] :
    [{mode:'pool', capacity:4}, {mode:'compiler', capacity:1}, {mode:'compiler', capacity:4}]) {
    workers = [];
    const start = performance.now();
    const receipt = await page.evaluate(async data => {
      const {createCompilerWorker} = await import('/playground/src/compiler-worker-group.mjs');
      return new Promise((resolve, reject) => {
      const worker = createCompilerWorker('/playground/tests/shared_compiler_worker.mjs', {type:'module', capacity:data.capacity});
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
      });
    }, {...trial, files, builtins, fixtures:boundedLR ? [] : fixtures});
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
  if (!selectedModes && !boundedLR) {
  const serial = report.trials.find(trial => trial.mode === 'compiler' && trial.capacity === 1);
  const parallel = report.trials.find(trial => trial.mode === 'compiler' && trial.capacity === 4);
  assert.deepEqual(parallel.results, serial.results, 'Serial/parallel output and canonical Foundation');
  for (const trial of [serial, parallel]) for (const fixture of fixtures) {
    const [graph, fast] = trial.results.filter(result => result.name === fixture.name);
    assert.equal(graph.canonical, fast.canonical);
  }
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
