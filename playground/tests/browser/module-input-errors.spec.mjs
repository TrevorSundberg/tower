import {fileURLToPath} from 'node:url';
import {test, expect} from './worker-lifecycle.mjs';

const workerGroup = fileURLToPath(new URL('../../src/compiler-worker-group.mjs', import.meta.url));
const expected = ['42\n', 'Invalid module input: .tower/tower.tower', '42\n',
  'Invalid module input: extra.tower', 'Invalid module input: extra.tower'];

async function exerciseModules() {
  const {createCompilerWorker} = await import('./compiler-worker-group.mjs');
  const names = await (await fetch('./builtins.json')).json();
  const builtins = Object.fromEntries(await Promise.all(names.map(async name =>
    [name, await (await fetch('./' + name + '.tower')).text()])));
  const {foundation, bedrock, tower} = builtins;
  const main = {path:'main.tower', text:'import tower; print(42);'};
  const invalid = {path:'extra.tower', text:'\0'};
  const worker = createCompilerWorker('./execution-worker.js', {type:'module'});
  let id = 0;
  function execute(drive) {
    return new Promise((resolve, reject) => {
      worker.onerror = event => reject(new Error(event.message));
      worker.onmessage = ({data}) => {
        if (data.id !== id) return;
        if (data.ready) worker.postMessage({command:'execute', id});
        if (data.error) resolve(data.error);
        if (data.result && data.result.status !== 'executing') resolve(data.result.error || data.result.output);
      };
      worker.postMessage({id:++id, backend:'interpreter', entry:main.path, source:main.text,
        files:[main], drive, builtins, foundation, bedrock});
    });
  }
  try {
    const warm = await execute([main]);
    builtins.tower += '\0';
    const competing = await execute([main, invalid]);
    builtins.tower = tower;
    const recovered = await execute([main]);
    const failedReplacement = await execute([main, invalid]);
    const retry = await execute([main]);
    return [warm, competing, recovered, failedReplacement, retry];
  } finally { worker.terminate(); }
}

for (const isolated of [false, true]) {
  const reactor = isolated ? 'tower-threads.wasm' : 'tower.wasm';
  test(`warm Execute preserves the first module error and retries failed replacements (${reactor})`, async ({page}, info) => {
    const headers = isolated ? {
      'Cross-Origin-Opener-Policy':'same-origin', 'Cross-Origin-Embedder-Policy':'require-corp',
    } : {};
    // This empty document has no editor, service worker, or other Wasm consumer.
    await page.route('/module-input-errors.html', route => route.fulfill({
      contentType:'text/html', body:'<!doctype html><title>Module input errors</title>', headers,
    }));
    await page.route('/compiler-worker-group.mjs', route => route.fulfill({path:workerGroup, contentType:'text/javascript'}));
    if (isolated) {
      // Dedicated workers need their own matching embedder policy.
      await page.route(/\/(execution-worker|compiler-thread-worker)\.js$/, async route => {
        const response = await route.fetch();
        await route.fulfill({response, headers:{...response.headers(), ...headers}});
      });
    }
    const requests = [];
    page.on('request', request => {
      if (request.url().endsWith('.wasm')) requests.push(request.url());
    });
    await page.goto('/module-input-errors.html');
    const crossOriginIsolated = await page.evaluate(() => self.crossOriginIsolated);
    expect(crossOriginIsolated).toBe(isolated);
    const replies = await page.evaluate(exerciseModules);
    await expect.poll(() => page.workers().map(worker => worker.url())).toEqual([]);
    await info.attach('module input replies', {contentType:'application/json',
      body:JSON.stringify({crossOriginIsolated, requests, expected, replies, remainingWorkers:page.workers().map(worker => worker.url())})});
    expect([...new Set(requests)]).toEqual([new URL(reactor, page.url()).href]);
    expect(replies).toEqual(expected);
  });
}
