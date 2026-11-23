// An OS-message gate before guest initialization, released only by cancellation
// in the partial-startup control. No sleep or artificial guest work is involved.
import {compilerThreadPort} from '../src/compiler-worker-group.mjs';
let initializingPort;
self.onmessage = ({data}) => {
  initializingPort = compilerThreadPort(data);
  if (!initializingPort) throw new Error('Partial-startup control requires its worker port');
  // Keep incoming initialization queued: do not start this port's message loop.
  initializingPort.postMessage({startupHeld:true});
};
