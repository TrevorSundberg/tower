import { StateEffect, StateField } from '@codemirror/state';
import { EditorView, Decoration } from '@codemirror/view';
import { byteOffsets } from './offsets.mjs';

export const paint = StateEffect.define();
export const highlighting = StateField.define({
  create: () => Decoration.none,
  update(value, transaction) {
    if (transaction.docChanged) value = value.map(transaction.changes);
    for (const effect of transaction.effects) if (effect.is(paint)) value = effect.value;
    return value;
  }, provide: field => EditorView.decorations.from(field),
});
export function towerDecorations(source, spans) {
  const offsets = byteOffsets(source);
  return Decoration.set(spans.filter(s => s.end > s.start && s.end < offsets.length).map(s =>
    Decoration.mark({class:`tw-${s.kind}`, attributes:{'data-revision':String(s.revision)}}).range(offsets[s.start], offsets[s.end])), true);
}
