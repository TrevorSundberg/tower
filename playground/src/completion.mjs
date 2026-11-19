import { autocompletion, acceptCompletion } from '@codemirror/autocomplete';
import { ViewPlugin, keymap } from '@codemirror/view';
import { Prec } from '@codemirror/state';
import { byteOffsets } from './offsets.mjs';
import { LanguageService } from './language-service.mjs';
import { CompletionQueries } from './completion-queries.mjs';
import { compilerSelection } from './compiler-selection.mjs';

export function towerCompletion(configuration) {
  const service = new LanguageService();
  const queries = new CompletionQueries(service);
  const encoder = new TextEncoder();
  function payload(source, position) {
    const config=configuration();
    return {...config, compilerRevision:compilerSelection().revision, method:'complete', source, cursor:encoder.encode(source.slice(0,position)).length,
      builtins:{...config.builtins},
      files:config.files?.filter(file=>file.path.endsWith('.tower')).map(file=>({path:file.path,text:file.path===config.activePath?source:file.text}))};
  }
  const warm = () => service.request('warm', {method:'warm', ...configuration()}).promise.catch(() => {});
  const prediction=ViewPlugin.fromClass(class {
    constructor(view) { this.view=view; this.timer=null; }
    update(update) {
      if(update.focusChanged && update.view.hasFocus)warm();
      if(!update.docChanged && !update.selectionSet && !update.focusChanged)return;
      clearTimeout(this.timer);
      if(!update.view.hasFocus) { queries.clear(); return; }
      const {head,empty}=update.state.selection.main;
      queries.retain(payload(update.state.doc.toString(),head));
      if(!empty || update.view.composing)return;
      // Let rapid typing finish. Ask the same Tower/Wasm compiler about an
      // inserted dot, including the complete suffix and every module input.
      this.timer=setTimeout(()=>{
        const {state}=this.view, {head,empty}=state.selection.main;
        const source=state.doc.toString();
        if(!this.view.hasFocus || !empty || configuration().editingModule || !/[\w`]$/.test(source.slice(0,head)))return;
        queries.predict(payload(source.slice(0,head)+'.'+source.slice(head),head+1));
      },80);
    }
    destroy() { clearTimeout(this.timer); queries.clear(); service.stop(); }
  });
  return [prediction,
    autocompletion({activateOnTyping:true, activateOnTypingDelay:0, interactionDelay:0, override:[async context => {
    const source = context.state.doc.toString();
    if (!context.explicit && !/[\w.`]$/.test(source.slice(0, context.pos))) return null;
    const request = queries.query(payload(source,context.pos));
    context.addEventListener('abort', request.cancel, {onDocChange:true});
    try {
      const result = await request.promise;
      if (context.aborted || !result?.options.length) return null;
      const offsets = byteOffsets(source);
      return {from:offsets[result.from], to:offsets[result.to], options:result.options};
    } catch { return null; }
  }]}), Prec.highest(keymap.of([{key:'Tab', run:acceptCompletion}]))];
}
