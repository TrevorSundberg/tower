import { loadTower, runToEnd } from './tower-host.mjs';
let tower, handle = 0, moduleHandle = 0, bedrockHandle = 0, installed, installedBedrock;
const ready = (async () => {
  const [wasm, module, seed] = await Promise.all([fetch('./tower.wasm'), fetch('./foundation.tower'), fetch('./bedrock.tower')]);
  if (!wasm.ok || !module.ok || !seed.ok) throw new Error('Could not load Tower, bedrock.tower and foundation.tower');
  installed = await module.text(); installedBedrock = await seed.text();
  tower = await loadTower(await wasm.arrayBuffer(), undefined, installed, undefined, installedBedrock);
})();
self.onmessage = async ({ data: { id, source, foundation, bedrock, editingModule } }) => {
  try {
    await ready;
    foundation ??= installed; bedrock ??= installedBedrock;
    const start = performance.now();
    let current;
    if (editingModule === 'bedrock') {
      // Restart from the native baseline; each declaration then updates this
      // session's reader, even when a downstream module is currently invalid.
      if (bedrockHandle) tower.reset(bedrockHandle, source);
      else bedrockHandle = tower.createBedrock(source);
      current = bedrockHandle;
    } else {
      if (installedBedrock !== bedrock) {
        try { tower.configureBedrock(bedrock); }
        catch (error) { throw new Error('bedrock.tower: ' + error.message); }
        installedBedrock = bedrock; installed = null;
        if (handle) tower.destroy(handle); handle = 0;
        if (moduleHandle) tower.destroy(moduleHandle); moduleHandle = 0;
      }
      if (editingModule === 'foundation') {
        if (moduleHandle) tower.reset(moduleHandle, source);
        else moduleHandle = tower.createFoundation(source);
        current = moduleHandle;
      } else {
        if (installed !== foundation) {
          try { tower.configure(foundation); }
          catch (error) { throw new Error('foundation.tower: ' + error.message); }
          installed = foundation;
          if (handle) tower.destroy(handle); handle = 0;
        }
        if (handle) tower.reset(handle, source);
        else handle = tower.create(source);
        current = handle;
      }
    }
    const { events, end } = runToEnd(tower, current);
    const snapshot = tower.inspect(current);
    if (editingModule && end.status === 'done') {
      const bytes = new TextEncoder().encode(source).length;
      const name = editingModule === 'bedrock' ? 'Bedrock' : 'Foundation';
      if (!snapshot.tokens.length || bytes > 65536) Object.assign(end, { status: 'error', errorOffset: 0,
        error: bytes > 65536 ? name + ' limit is 64 KiB' : name + ' must define at least one token or skip rule' });
    }
    self.postMessage({ id, result: { events, end, snapshot, ms: performance.now() - start } });
  } catch (error) { self.postMessage({ id, error: error.message || String(error) }); }
};
