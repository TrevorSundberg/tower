// Observe browser ownership without serializing CDP script/source/Wasm payloads.
// The existing JSON reporter links this attachment; failure traces stay enabled.
import {writeFile} from 'node:fs/promises';
import {test as base, expect} from '@playwright/test';

export const test = base.extend({
  workerLifecycle: [async ({browser}, use, info) => {
    const cdp = await browser.newBrowserCDPSession();
    const start = performance.now(), events = [], live = new Set();
    const record = (event, fields) => events.push({event, milliseconds:performance.now()-start, ...fields});
    cdp.on('Target.targetCreated', ({targetInfo}) => {
      if (targetInfo.type !== 'worker') return;
      live.add(targetInfo.targetId);
      record('created', {targetInfo});
    });
    cdp.on('Target.targetInfoChanged', ({targetInfo}) => {
      if (live.has(targetInfo.targetId)) record('changed', {targetInfo});
    });
    cdp.on('Target.targetDestroyed', ({targetId}) => {
      if (live.delete(targetId)) record('destroyed', {targetId});
    });
    const workers = async () => (await cdp.send('Target.getTargets')).targetInfos.filter(t => t.type === 'worker');
    const initial = await workers();
    await cdp.send('Target.setDiscoverTargets', {discover:true});
    let remaining, observationError;
    try {
      expect(initial, 'No workers left by the preceding test').toEqual([]);
      await use(); // Page/context teardown runs before this automatic fixture.
      await expect.poll(() => live.size, {timeout:30000, message:'Every observed worker target must retire'}).toBe(0);
    } finally {
      try { remaining = await workers(); }
      catch (error) { observationError = error; }
      const path = info.outputPath('worker-lifecycle.json');
      await writeFile(path, JSON.stringify({initial, events, remaining,
        observationError:observationError?.stack, durationMilliseconds:performance.now()-start}, null, 2)+'\n');
      await info.attach('worker lifecycle', {path, contentType:'application/json'});
      await cdp.detach();
    }
    if (observationError) throw observationError;
    expect(remaining, 'No live dedicated worker targets after context teardown').toEqual([]);
  }, {auto:true}],
});
export {expect};
