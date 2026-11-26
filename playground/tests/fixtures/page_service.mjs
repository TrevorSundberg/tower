import assert from 'node:assert/strict';
import {LanguageService} from '../../src/language-service.mjs';

export function pageService(t) {
  const workers = [];
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const previousWorker = Object.getOwnPropertyDescriptor(globalThis, 'Worker');
  globalThis.document = {};
  globalThis.Worker = class extends EventTarget {
    constructor() {
      super();
      this.posted = [];
      workers.push(this);
    }
    postMessage(message, transfer) {
      if (!this.owner) {
        assert.ok(message.towerCompilerOwner instanceof MessagePort);
        assert.deepEqual(transfer, [message.towerCompilerOwner]);
        this.owner = structuredClone(message, {transfer}).towerCompilerOwner;
        return;
      }
      this.posted.push(message);
    }
    set onmessage(listener) { this.addEventListener('message', listener); }
    reply(id, result) { this.dispatchEvent(new MessageEvent('message', {data:{id, result}})); }
    terminate() { this.owner.close(); this.terminated = true; }
  };
  const service = new LanguageService();
  t.after(() => {
    service.stop();
    for (const [name, previous] of [['document', previousDocument], ['Worker', previousWorker]]) {
      if (previous) Object.defineProperty(globalThis, name, previous);
      else delete globalThis[name];
    }
  });
  return {service, workers};
}
