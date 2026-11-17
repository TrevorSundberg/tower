import { RangeSet, StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView, GutterMarker, WidgetType, gutter } from '@codemirror/view';

export const setDiagnostic = StateEffect.define();

class ErrorMessage extends WidgetType {
  constructor(diagnostic) { super(); this.diagnostic = diagnostic; }
  eq(other) {
    const a = this.diagnostic, b = other.diagnostic;
    return a.from === b.from && a.line === b.line && a.column === b.column && a.message === b.message;
  }
  toDOM() {
    const { line, column, message } = this.diagnostic;
    const box = document.createElement('div'); box.className = 'tw-inline-error';
    box.setAttribute('role', 'alert'); box.contentEditable = 'false';
    const card = box.appendChild(document.createElement('div')); card.className = 'tw-inline-error-card';
    card.tabIndex = 0;
    const heading = card.appendChild(document.createElement('div')); heading.className = 'tw-inline-error-heading';
    const label = heading.appendChild(document.createElement('strong')); label.textContent = 'Error';
    const location = heading.appendChild(document.createElement('span')); location.textContent = `Ln ${line}, Col ${column}`;
    const body = card.appendChild(document.createElement('div')); body.className = 'tw-inline-error-message'; body.textContent = message;
    return box;
  }
}

class ErrorPoint extends WidgetType {
  toDOM() {
    const point = document.createElement('span'); point.className = 'tw-error-point';
    point.setAttribute('aria-hidden', 'true'); point.textContent = '▏';
    return point;
  }
  eq() { return true; }
}

class ErrorMarker extends GutterMarker {
  toDOM() {
    const marker = document.createElement('span'); marker.className = 'tw-error-marker';
    marker.textContent = '!'; marker.title = 'Error on this line';
    marker.setAttribute('aria-hidden', 'true'); return marker;
  }
}
const marker = new ErrorMarker();
const empty = { diagnostic: null, decorations: Decoration.none, markers: RangeSet.empty };
const diagnostics = StateField.define({
  create: () => empty,
  update(value, transaction) {
    // Clear stale locations inside the document transaction, not in a second
    // dispatch from the editor's update listener.
    if (transaction.docChanged) value = empty;
    for (const effect of transaction.effects) if (effect.is(setDiagnostic)) {
      const diagnostic = effect.value;
      if (!diagnostic) { value = empty; continue; }
      const line = transaction.state.doc.lineAt(diagnostic.from);
      const decorations = [Decoration.line({ class: 'tw-error-line' }).range(line.from),
        Decoration.widget({ widget: new ErrorMessage(diagnostic), block: true, side: 1 }).range(line.to)];
      if (diagnostic.to > diagnostic.from) decorations.push(Decoration.mark({
        class: 'tw-error-range', attributes: { title: diagnostic.message },
      }).range(diagnostic.from, diagnostic.to));
      else decorations.push(Decoration.widget({ widget: new ErrorPoint(), side: 1 }).range(diagnostic.from));
      value = { diagnostic, decorations: Decoration.set(decorations, true), markers: RangeSet.of(marker.range(line.from)) };
    }
    return value;
  },
  provide: field => EditorView.decorations.from(field, value => value.decorations),
});

export function goToDiagnostic(view) {
  const diagnostic = view.state.field(diagnostics).diagnostic;
  if (!diagnostic) return false;
  view.dispatch({ selection: { anchor: diagnostic.from, head: diagnostic.to },
    effects: EditorView.scrollIntoView(diagnostic.from, { y: 'center' }) });
  view.focus(); return true;
}

export const editorDiagnostics = [diagnostics, gutter({
  class: 'tw-error-gutter',
  markers: view => view.state.field(diagnostics).markers,
  initialSpacer: () => marker,
  domEventHandlers: { click: (view, line) => {
    const diagnostic = view.state.field(diagnostics).diagnostic;
    return diagnostic && view.state.doc.lineAt(diagnostic.from).from === line.from ? goToDiagnostic(view) : false;
  } },
})];

export function sourceDiagnostic(doc, offsets, error, highlights = []) {
  if (!Number.isInteger(error?.errorOffset)) return null;
  const byte = Math.max(0, Math.min(error.errorOffset, offsets.length - 1));
  const from = Math.min(offsets[byte], doc.length), line = doc.lineAt(from);
  const token = highlights.find(token => token.start <= byte && byte < token.end);
  // UTF-8 offsets may point at a non-ASCII scalar; never split its UTF-16 pair.
  const character = doc.sliceString(from, Math.min(from + 2, doc.length));
  const characterEnd = from + (character.codePointAt(0) > 0xffff ? 2 : 1);
  const to = from === line.to ? from : Math.min(line.to, token ? offsets[token.end] : characterEnd);
  const message = error.error.replace(/^Construct at byte \d+:\s*/, '')
    .replace(/^Unexpected \$ at byte \d+ in state\([^)]*\)$/, 'Unexpected end of input')
    .replace(/ at byte \d+(?: in state\([^)]*\))?$/, '');
  return { from, to, line: line.number, column: from - line.from + 1, message };
}
