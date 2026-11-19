// A single speculative compiler answer. Reuse requires the exact source,
// cursor, grammar, active file and module inputs; this is not a symbol cache.
export class CompletionQueries {
  constructor(service) { this.service=service; this.forecast=null; }
  retain(payload) {
    if (this.forecast?.key !== JSON.stringify(payload)) this.clear();
  }
  predict(payload) {
    const key=JSON.stringify(payload);
    if (this.forecast?.key === key) return;
    this.clear();
    // Speculation must not replace a queued foreground request while the
    // worker is warming. LanguageService coalesces each consumer separately.
    const request=this.service.request('prediction',payload);
    this.forecast={key,request};
    request.promise.catch(() => { if(this.forecast?.request===request)this.clear(); });
  }
  query(payload) {
    if (this.forecast?.key === JSON.stringify(payload)) {
      const {request}=this.forecast; this.forecast=null; return request;
    }
    this.clear();
    return this.service.request('complete',payload);
  }
  clear() { this.forecast?.request.cancel(); this.forecast=null; }
}
