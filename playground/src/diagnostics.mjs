import { RangeSet, StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView, GutterMarker, ViewPlugin, WidgetType, gutter } from '@codemirror/view';

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
    const outline = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    outline.classList.add('tw-error-bubble'); outline.setAttribute('aria-hidden', 'true');
    outline.appendChild(document.createElementNS(outline.namespaceURI, 'path'));
    box.appendChild(outline);
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
    point.setAttribute('aria-hidden', 'true'); point.contentEditable = 'false';
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
function decorate(diagnostic, doc, widget = new ErrorMessage(diagnostic), showPoint = diagnostic.from === diagnostic.to) {
  const line = doc.lineAt(diagnostic.from);
  const decorations = [Decoration.line({ class: 'tw-error-line' }).range(line.from),
    Decoration.widget({ widget, block: true, side: 1 }).range(line.to)];
  if (diagnostic.to > diagnostic.from) decorations.push(Decoration.mark({
    class: 'tw-error-range', attributes: { title: diagnostic.message },
  }).range(diagnostic.from, diagnostic.to));
  else if (showPoint) decorations.push(Decoration.widget({ widget: new ErrorPoint(), side: 1 }).range(diagnostic.from));
  return {diagnostic, widget, showPoint, decorations:Decoration.set(decorations,true), markers:RangeSet.of(marker.range(line.from))};
}
const diagnostics = StateField.define({
  create: () => empty,
  update(value, transaction) {
    // Keep the last diagnostic visible while the trailing edit debounce runs.
    // Map its anchors without rebuilding the card; a completed analysis replaces it.
    // A deleted underline must not turn into a new end-of-input caret.
    if (transaction.docChanged && value.diagnostic) {
      const from=transaction.changes.mapPos(value.diagnostic.from,1);
      const to=Math.max(from,transaction.changes.mapPos(value.diagnostic.to,1));
      value=decorate({...value.diagnostic,from,to},transaction.state.doc,value.widget,value.showPoint);
    }
    for (const effect of transaction.effects) if (effect.is(setDiagnostic)) {
      const diagnostic = effect.value;
      if (!diagnostic) { value = empty; continue; }
      value = decorate(diagnostic,transaction.state.doc);
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

// Draw the card and its connector as one filled outline, so the tail cannot
// leave a seam or double border where it meets a rounded corner. Coordinates
// come from the marked text's final visual row (including wrapped tokens).
const bubbleOutline = ViewPlugin.fromClass(class {
  constructor(view) { this.measure(view); }
  update(update) {
    if (update.docChanged || update.geometryChanged || update.viewportChanged ||
        update.transactions.some(transaction=>transaction.effects.some(effect=>effect.is(setDiagnostic)))) this.measure(update.view);
  }
  measure(view) {
    view.requestMeasure({key:this, read:()=>{
      const diagnostic=view.state.field(diagnostics,false)?.diagnostic;
      const box=view.dom.querySelector('.tw-inline-error');
      if (!box || !diagnostic) return null;
      const bounds=box.getBoundingClientRect(), card=box.querySelector('.tw-inline-error-card').getBoundingClientRect();
      const rectangles=[...view.dom.querySelectorAll('.tw-error-range')].flatMap(mark=>[...mark.getClientRects()]).filter(rect=>rect.width>0);
      let start,end;
      if (rectangles.length) {
        const lastTop=Math.max(...rectangles.map(rect=>rect.top));
        const row=rectangles.filter(rect=>Math.abs(rect.top-lastTop)<2);
        start=Math.min(...row.map(rect=>rect.left)); end=Math.max(...row.map(rect=>rect.right));
      } else {
        const point=view.coordsAtPos(diagnostic.from,1);
        if (!point) return null;
        start=point.left; end=start+6;
      }
      const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
      let left=card.left-bounds.left+.5, right=card.right-bounds.left-.5;
      const top=card.top-bounds.top+.5, bottom=card.bottom-bounds.top-.5, radius=5;
      const tipY=parseFloat(getComputedStyle(box).getPropertyValue('--error-gap'))+.5;
      const tipLeft=clamp(start-bounds.left,.5,bounds.width-1.5);
      const tipRight=clamp(end-bounds.left,tipLeft+1,bounds.width-.5);
      // At an edge, align that side of the body with the text and remove its
      // upper rounding. This makes a right trapezoid, never a pinched neck.
      const flushLeft=tipLeft<=left+radius, flushRight=tipRight>=right-radius;
      if (flushLeft) left=tipLeft;
      if (flushRight) right=tipRight;
      const joinLeft=flushLeft ? left : Math.max(left+radius,tipLeft-6);
      const joinRight=flushRight ? right : Math.min(right-radius,tipRight+6);
      const path=`M ${left+(flushLeft ? 0 : radius)} ${top} H ${joinLeft} L ${tipLeft} ${tipY} H ${tipRight} L ${joinRight} ${top}
        H ${right-(flushRight ? 0 : radius)} ${flushRight ? '' : `Q ${right} ${top} ${right} ${top+radius}`} V ${bottom-radius}
        Q ${right} ${bottom} ${right-radius} ${bottom} H ${left+radius}
        Q ${left} ${bottom} ${left} ${bottom-radius} V ${top+(flushLeft ? 0 : radius)}
        ${flushLeft ? '' : `Q ${left} ${top} ${left+radius} ${top}`} Z`;
      return {box,width:bounds.width,height:bounds.height,path};
    }, write:measured=>{
      if (!measured) return;
      const {box,width,height,path}=measured, svg=box.querySelector('.tw-error-bubble');
      svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
      svg.firstElementChild.setAttribute('d',path);
      box.classList.add('has-bubble-outline');
    }});
  }
});

export const editorDiagnostics = [diagnostics, bubbleOutline, gutter({
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
