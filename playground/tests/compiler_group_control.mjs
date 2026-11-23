// Browser ownership fault injection; all guest work is the existing Tower fixture.
import {compilerThreads} from '../src/compiler-threads.mjs';
import {compilerWorkerFactory} from '../src/compiler-worker-group.mjs';
import {TowerWASI} from '../src/wasi-host.mjs';
let transport;
self.onmessage = ({data}) => {
  if (data.crash) throw new Error('Injected compiler coordinator failure');
  if (data.retire) {
    self.postMessage({retireBoundary:true});
    self.postMessage({echo:'retired-generation'});
    console.info('compiler-boundary '+JSON.stringify({label:'coordinator:old-reply-posted', at:performance.timeOrigin+performance.now()}));
    return;
  }
  if (data.echo) { self.postMessage({echo:data.echo}); return; }
  open(data).catch(error => {
    console.info('compiler-boundary '+JSON.stringify({label:'coordinator:error '+error.message, at:performance.timeOrigin+performance.now()}));
    const failed = transport?.failed();
    transport?.close();
    self.postMessage({error:error.message, failed});
  });
};
async function open({mode, capacity}) {
  const trace = label => { if (mode === 'shared-trap') console.info('compiler-boundary '+JSON.stringify({label, at:performance.timeOrigin+performance.now()})); };
  trace('coordinator:open');
  const module = await WebAssembly.compile(await (await fetch('/work.wasm')).arrayBuffer());
  const create = await compilerWorkerFactory(capacity);
  let threadReadyCount = 0, heldCount = 0;
  const workerFactory = url => {
    const worker = create(url);
    if (mode === 'partial-startup-cancel') worker.addEventListener('message', ({data}) => {
      if (data.ready) threadReadyCount++;
      if (data.startupHeld) self.postMessage({partialStarted:true, threadReadyCount, heldCount:++heldCount});
    });
    if (mode === 'shared-trap') {
      const post = worker.postMessage.bind(worker);
      worker.postMessage = data => { trace('coordinator:send '+(data.initialize ? 'initialize slot='+data.slot : 'guest id='+data.id)); post(data); };
      worker.addEventListener('message', ({data}) => trace('coordinator:receive '+JSON.stringify(data)));
    }
    if (mode === 'startup-cancel') self.postMessage({progress:'creating'});
    return worker;
  };
  const workerURL = mode === 'startup-error' ? new URL('./missing_compiler_group_thread.mjs', import.meta.url)
    : mode === 'partial-startup-cancel' ? new URL('./compiler_group_startup_worker.mjs', import.meta.url)
    : mode === 'shared-trap' ? new URL('./compiler-failure-worker.mjs', import.meta.url) : undefined;
  trace('coordinator:threads-opening');
  transport = await compilerThreads(module, {capacity,
    ...(mode === 'generation-retire' ? {} : {workerFactory}), ...(workerURL ? {workerURL} : {})});
  trace('coordinator:threads-ready');
  if (mode === 'shared-trap') {
    const wasi = new TowerWASI();
    const instance = await WebAssembly.instantiate(module,
      {env:transport.env, wasi:transport.wasi, wasi_snapshot_preview1:wasi.wasiImport});
    transport.attach(instance); wasi.initialize(instance);
    trace('coordinator:guest-entry');
    instance.exports.main();
    throw new Error('Injected shared worker trap did not propagate');
  }
  self.postMessage({ready:true});
}
