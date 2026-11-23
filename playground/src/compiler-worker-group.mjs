// Browser lifetime transport only. The page owns every native Worker; direct
// MessagePorts carry the existing compiler-thread protocol without a relay loop.
const OWNER = 'towerCompilerOwner', THREAD = 'towerCompilerThreadPort';
let owner;
if (typeof self !== 'undefined' && typeof document === 'undefined') {
  owner = new Promise(resolve => {
    const receive = event => {
      if (!(event.data?.[OWNER] instanceof MessagePort)) return;
      event.stopImmediatePropagation();
      self.removeEventListener('message', receive);
      resolve(event.data[OWNER]);
    };
    self.addEventListener('message', receive);
  });
}
let nextThread = 0; // Coordinator-local transport identities, never compiler IDs.
export async function compilerWorkerFactory(capacity) {
  if (!owner) throw new Error('Compiler threads require a page-owned coordinator');
  const control = await owner;
  return url => {
    const id = ++nextThread, {port1, port2} = new MessageChannel();
    let closed = false;
    port1.terminate = () => {
      if (closed) return;
      closed = true;
      control.postMessage({action:'terminate', id});
      port1.close();
    };
    control.postMessage({action:'create', id, url:String(url), capacity, port:port2}, [port2]);
    port1.start();
    return port1;
  };
}

export function createCompilerWorker(url, {capacity = 4, ...options} = {}) {
  if (typeof document === 'undefined') throw new Error('Compiler worker groups must be owned by the page');
  if (!Number.isInteger(capacity) || capacity < 1) throw new Error('Invalid compiler worker group capacity');
  const worker = new Worker(url, options), {port1, port2} = new MessageChannel();
  const children = new Map(), terminate = worker.terminate.bind(worker);
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    for (const child of children.values()) child.terminate();
    children.clear(); port1.close(); terminate();
  };
  const fail = message => {
    if (closed) return;
    close();
    worker.dispatchEvent(new ErrorEvent('error', {message}));
  };
  worker.terminate = close;
  worker.addEventListener('error', close);
  worker.addEventListener('messageerror', () => fail('Compiler coordinator message failed'));
  // A queued old-generation result must not reach a caller after cancellation.
  worker.addEventListener('message', event => { if (closed) event.stopImmediatePropagation(); });
  port1.onmessage = ({data}) => {
    if (closed) { data.port?.close(); return; }
    if (data.action === 'terminate') {
      children.get(data.id)?.terminate(); children.delete(data.id); return;
    }
    if (data.action !== 'create' || !(data.port instanceof MessagePort)) {
      fail('Invalid compiler worker group request'); return;
    }
    if (children.has(data.id) || data.capacity > capacity || children.size >= capacity) {
      data.port.close(); fail('Compiler worker group capacity exceeded'); return;
    }
    let child;
    try {
      child = new Worker(data.url, {type:'module'});
      children.set(data.id, child);
      child.addEventListener('error', event => {
        event.preventDefault(); fail(event.message || 'Compiler thread failed during startup');
      });
      child.addEventListener('messageerror', () => fail('Compiler thread message failed'));
      child.postMessage({[THREAD]:data.port}, [data.port]);
    } catch (error) { data.port.close(); fail(error.message); }
  };
  port1.onmessageerror = () => fail('Compiler worker group message failed');
  try { worker.postMessage({[OWNER]:port2}, [port2]); }
  catch (error) { port2.close(); close(); throw error; }
  return worker;
}

export function compilerThreadPort(data) { return data?.[THREAD]; }
