import { autocompletion, acceptCompletion } from '@codemirror/autocomplete';
import { keymap } from '@codemirror/view';
import { Prec } from '@codemirror/state';
import { byteOffsets } from './offsets.mjs';
import { LanguageService } from './language-service.mjs';

export function towerCompletion(configuration) {
  const service = new LanguageService();
  return [autocompletion({activateOnTyping:true, activateOnTypingDelay:100, interactionDelay:0, override:[async context => {
    const source = context.state.doc.toString();
    if (!context.explicit && !/[\w.`]$/.test(source.slice(0, context.pos))) return null;
    const cursor = new TextEncoder().encode(source.slice(0, context.pos)).length;
    const request = service.request('complete', {method:'complete', source, cursor, ...configuration()});
    context.addEventListener('abort', request.cancel, {onDocChange:true});
    try {
      const result = await request.promise;
      if (context.aborted || !result?.options.length) return null;
      const offsets = byteOffsets(source);
      return {from:offsets[result.from], to:offsets[result.to], options:result.options};
    } catch { return null; }
  }]}), Prec.highest(keymap.of([{key:'Tab', run:acceptCompletion}]))];
}
