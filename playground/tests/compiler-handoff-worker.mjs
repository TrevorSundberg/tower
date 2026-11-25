// Hold this child's first completed pthread immediately before the physical
// READY store. The coordinator opens the gate at its wait on this exact slot.
import {parentPort, workerData} from 'node:worker_threads';
import '../src/compiler-thread-worker.mjs';

parentPort.once('message', ({status, slot}) => {
  const store = Atomics.store;
  Atomics.store = (array, index, value) => {
    if (array === status && index === slot && value === 1 && Atomics.load(status, slot) === 2) {
      Atomics.store = store;
      if (Atomics.wait(workerData, 0, 0, 5000) === 'timed-out')
        throw new Error('Coordinator never acknowledged the joined pthread');
    }
    return store(array, index, value);
  };
});
