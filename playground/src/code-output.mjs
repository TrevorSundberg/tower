import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { StreamLanguage, HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { outputParser } from './output-syntax.mjs';
import { paint, highlighting, towerDecorations } from './tower-highlights.mjs';
import { highlightFoundation } from './language-service.mjs';

const languages = new Map();
const styles = syntaxHighlighting(HighlightStyle.define([
  { tag: tags.keyword, class: 'tw-keyword' },
  { tag: tags.typeName, class: 'tw-rule' },
  { tag: [tags.variableName, tags.special(tags.variableName)], class: 'tw-capture' },
  { tag: [tags.labelName, tags.function(tags.variableName)], class: 'tw-rule' },
  { tag: tags.string, class: 'tw-string' },
  { tag: tags.number, class: 'tw-number' },
  { tag: tags.comment, class: 'tw-comment' },
  { tag: tags.meta, class: 'tw-rule' },
  { tag: tags.operator, class: 'tw-operator' },
]));

export class CodeOutput {
  constructor(parent, syntax) {
    this.parent = parent; this.syntax = syntax; this.text = ''; this.view = null;
    parent.classList.add('code-output');
  }
  setText(text = '') {
    if (text === this.text) return; // Timings/phases never re-highlight unchanged code.
    this.text = text;
    if (!text) { this.view?.destroy(); this.view = null; this.parent.replaceChildren(); return; }
    if (!this.view) {
      if (this.syntax !== 'tower' && !languages.has(this.syntax)) languages.set(this.syntax, StreamLanguage.define(outputParser(this.syntax)));
      this.view = new EditorView({ parent: this.parent, state: EditorState.create({ doc: text, extensions: [
        EditorState.readOnly.of(true), EditorView.editable.of(false),
        EditorView.contentAttributes.of({ 'aria-label': this.parent.getAttribute('aria-label'), tabindex: '0' }),
        keymap.of(defaultKeymap), this.syntax === 'tower' ? highlighting : [languages.get(this.syntax), styles],
        EditorView.theme({ '&': { color: '#d4e0e2', backgroundColor: '#121a1e' } }, { dark: true }),
      ] }) });
    } else {
      const update = {
        changes: { from: 0, to: this.view.state.doc.length, insert: text },
        // Generated output is replaced as a whole. Keep its viewport anchor.
        effects: this.view.scrollSnapshot(),
      };
      if (this.view.inView) this.view.dispatch(update);
      else {
        // Mapping a whole-document replacement expands an offscreen viewport to
        // the entire document. CodeMirror only trims that viewport when visible.
        // Reset its derived view state, then restore the reader's scroll anchor.
        this.view.setState(this.view.state.update(update).state);
        this.view.dispatch({effects:update.effects});
      }
    }
    if (this.syntax === 'tower') {
      const view = this.view;
      highlightFoundation(text, this).then(spans => {
        if (this.view === view && this.text === text && spans)
          view.dispatch({effects:paint.of(towerDecorations(text, spans))});
      }).catch(() => {});
    }
  }
}
