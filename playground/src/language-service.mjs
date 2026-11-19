// One active request and the latest pending request per consumer. Cancellation
// rejects stale replies without repeatedly discarding a warm Wasm compiler.
import {compilerSelection, onCompilerSelection} from './compiler-selection.mjs';
export class LanguageService {
  constructor() {
    this.id = 0; this.worker = null; this.active = null; this.queued = new Map();
    onCompilerSelection(() => this.stop('Compiler changed'));
  }
  request(key, payload) {
    this.queued.get(key)?.resolve(null);
    let task;
    const promise = new Promise((resolve, reject) => { task = {id:++this.id, key, payload, resolve, reject}; });
    this.queued.set(key, task);
    if (key === 'complete' && this.active?.key === 'document' && !this.active.preemption) {
      const document = this.active;
      // Wasm calls are synchronous. Give a small inspection a chance to finish,
      // but never let a large import closure monopolize the interactive worker.
      document.preemption = setTimeout(() => {
        document.preemption = null;
        if (this.active !== document || !this.queued.has('complete')) return;
        clearTimeout(document.timer); this.worker.terminate(); this.worker = null;
        this.active = null; document.resolve(null); this.pump();
      }, 16);
    }
    this.pump();
    return {promise, cancel: () => {
      task.resolve(null); task.canceled = true;
      if (this.queued.get(key) === task) this.queued.delete(key);
    }};
  }
  pump() {
    if (this.active || !this.queued.size) return;
    if (!this.worker) {
      this.worker = new Worker(new URL('./language-worker.js', import.meta.url), {type:'module'});
      this.worker.onerror = event => { event.preventDefault(); this.stop(event.message || 'Language worker stopped'); };
      this.worker.onmessage = ({data}) => {
        const task = this.active;
        if (!task || task.id !== data.id) return;
        clearTimeout(task.timer); clearTimeout(task.preemption); this.active = null;
        if (data.error) { this.worker.terminate(); this.worker = null; }
        if (!task.canceled) {
          if (data.error) task.reject(new Error(data.error)); else task.resolve(data.result);
        }
        this.pump();
      };
    }
    // A keystroke takes precedence over queued background document inspection.
    // Long document calls yield by worker replacement when a keystroke arrives.
    const task = this.queued.get('complete') ?? this.queued.values().next().value;
    this.queued.delete(task.key); this.active = task;
    task.timer = setTimeout(() => this.stop('Language query exceeded 10 seconds'), 10000);
    this.worker.postMessage({id:task.id, ...task.payload, compiler:compilerSelection()});
  }
  stop(message = 'Language query canceled') {
    this.worker?.terminate(); this.worker = null;
    if (this.active) { clearTimeout(this.active.timer); clearTimeout(this.active.preemption); this.active.reject(new Error(message)); this.active = null; }
    for (const task of this.queued.values()) task.reject(new Error(message));
    this.queued.clear();
  }
}

let highlighting;
const cache = new Map();
onCompilerSelection(() => cache.clear());
export function highlightFoundation(source, consumer) {
  if (cache.has(source)) return cache.get(source);
  highlighting ??= new LanguageService();
  const result = highlighting.request(consumer, {method:'highlight', source}).promise;
  cache.set(source, result);
  if (cache.size > 4) cache.delete(cache.keys().next().value);
  result.catch(() => cache.delete(source));
  result.then(value => { if (!value && cache.get(source) === result) cache.delete(source); }, () => {});
  return result;
}
