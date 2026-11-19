// Worker lifecycle/message transport only. Scheduling, admission and completion
// validation live in Tower's CompilerWork, shared with serial interpretation.
export async function compilerPool({count, createWorker, module, files, grammar, revision, profile, signal}) {
  const lanes = [];
  const ready = [];
  let closed = false, closing;
  function close(reason = new Error('Compiler workers stopped')) {
    if (closed) return closing;
    closed = true;
    signal?.removeEventListener('abort',abort);
    closing = Promise.all(lanes.map(lane => {
      lane.reject?.(reason); lane.reject = undefined;
      return lane.worker.terminate();
    }));
    return closing;
  }
  const abort = () => close(new Error('Compiler build cancelled'));
  signal?.addEventListener('abort',abort,{once:true});
  try {
    if (signal?.aborted) throw new Error('Compiler build cancelled');
    for (let i = 0; i < count; ++i) {
      const worker = createWorker();
      const lane = {worker,unit:0};
      lanes.push(lane);
      ready.push(new Promise((resolve,reject) => { lane.resolve = resolve; lane.reject = reject; }));
      const receive = data => {
        if (closed) return;
        if (data.type === 'fatal') { close(new Error(data.error)); return; }
        const expected = lane.unit === 0 ? data.type === 'ready' :
          data.type === 'result' && data.unit === lane.unit && (data.error || data.object instanceof Uint8Array && data.object.length > 0);
        if (!expected || data.revision !== revision || data.profile !== profile || !lane.resolve) {
          close(new Error('Unexpected compiler worker completion')); return;
        }
        const resolve = lane.resolve;
        lane.resolve = lane.reject = undefined;
        resolve(data);
      };
      const error = event => close(new Error(event.message || 'Compiler worker failed'));
      if (worker.addEventListener) {
        worker.addEventListener('message',event => receive(event.data));
        worker.addEventListener('error',error);
        worker.addEventListener('messageerror',error);
      } else {
        worker.on('message',receive); worker.on('error',error);
        worker.on('exit',code => { if (!closed) close(new Error('Compiler worker exited: '+code)); });
      }
      worker.postMessage({type:'prepare',module,files,grammar,revision,profile});
    }
    await Promise.all(ready);
    return {
      run(laneIndex,unit,entry) {
        if (closed) return Promise.reject(new Error('Compiler workers stopped'));
        const lane = lanes[laneIndex];
        if (lane.resolve) return Promise.reject(new Error('Compiler worker is busy'));
        lane.unit = unit;
        return new Promise((resolve,reject) => {
          lane.resolve = resolve; lane.reject = reject;
          lane.worker.postMessage({type:'compile',unit,entry,revision,profile});
        });
      },
      close,
    };
  } catch (error) {
    const stopped = close(error);
    await Promise.allSettled(ready);
    await stopped;
    throw error;
  }
}
