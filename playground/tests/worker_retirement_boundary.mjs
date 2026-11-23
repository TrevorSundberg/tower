// Browser lifecycle control/observation only; no Tower work or scheduling logic.
const parameters = new URL(import.meta.url).searchParams;
if (parameters.get('role') === 'child') {
  self.onmessage = ({data}) => self.postMessage({ready:true, probe:data.probe});
} else {
  const post = self.postMessage.bind(self);
  const observe = (event, details = {}) => post({boundary:{event,
    at:performance.timeOrigin+performance.now(), ...details}});
  const BrowserWorker = self.Worker;
  let nextChild = 0, retireCheckpoint;
  self.Worker = class extends BrowserWorker {
    constructor(url, options) {
      super(url, options);
      this.childOrdinal = nextChild++;
      observe('child.created', {child:this.childOrdinal, url:String(url)});
      this.addEventListener('message', ({data}) => {
        if (data.ready) observe('child.ready', {child:this.childOrdinal});
      });
    }
    terminate() {
      observe('child.terminate.call', {child:this.childOrdinal});
      const result = super.terminate();
      observe('child.terminate.return', {child:this.childOrdinal, returnType:typeof result});
      return result;
    }
  };
  self.postMessage = (message, ...args) => {
    if (message.probe || message.result || message.error)
      observe('coordinator.reply.call', {probe:message.probe, result:Boolean(message.result), error:message.error});
    const result = post(message, ...args);
    if (message.probe) observe('coordinator.reply.return', {probe:message.probe});
    if (message.probe === 'retire') queueMicrotask(() => {
      Atomics.store(retireCheckpoint, 0, 1);
      observe('coordinator.reply.checkpoint', {probe:message.probe});
    });
    return result;
  };
  self.addEventListener('message', ({data}) => {
    if (!data.probe) return;
    if (data.retireCheckpoint) retireCheckpoint = new Int32Array(data.retireCheckpoint);
    observe('coordinator.probe.received', {probe:data.probe});
  });
  if (parameters.get('mode') === 'tower') {
    // Run the unchanged standalone pool branch, including its Tower assertions.
    await import('./shared_compiler_worker.mjs');
  } else {
    self.onmessage = async ({data}) => {
      if (data.probe) { self.postMessage({probe:data.probe}); return; }
      const children = [];
      try {
        await Promise.all(Array.from({length:data.capacity}, () => new Promise((resolve, reject) => {
          const child = new Worker(new URL('worker_retirement_boundary.mjs?role=child', import.meta.url), {type:'module'});
          children.push(child);
          child.onmessage = ({data}) => { if (data.ready) resolve(); };
          child.onerror = event => reject(new Error(event.message));
          child.postMessage({probe:'ready'});
        })));
        for (const child of children) child.terminate();
        self.postMessage({result:{mode:'no-wasm', capacity:data.capacity, children:children.length}});
      } catch (error) {
        for (const child of children) child.terminate();
        self.postMessage({error:error.stack || error.message});
      }
    };
  }
  // Dynamic import can yield to incoming messages. Publish handler readiness
  // before the harness sends the same start/retire protocol as the strict test.
  post({boundaryReady:true});
}
