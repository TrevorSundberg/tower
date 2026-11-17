import { EditorState, StateEffect, StateField } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, Decoration } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { byteOffsets } from './offsets.mjs';
import { editorDiagnostics, goToDiagnostic, setDiagnostic, sourceDiagnostic } from './diagnostics.mjs';
import { expandedCode } from './expanded-code.mjs';
import { replacementLocations } from './replacement-locations.mjs';
import { compareResults } from './comparison.mjs';
import { selectFoundation } from './foundation-storage.mjs';

const $ = id => document.getElementById(id);
const paint = StateEffect.define(), selectSpan = StateEffect.define();
const highlighting = StateField.define({
  create: () => Decoration.none,
  update(value, transaction) {
    if (transaction.docChanged) value = value.map(transaction.changes);
    for (const effect of transaction.effects) if (effect.is(paint)) value = effect.value;
    return value;
  }, provide: field => EditorView.decorations.from(field),
});
const selectionMark = StateField.define({
  create: () => Decoration.none,
  update(value, transaction) {
    if (transaction.docChanged) value = Decoration.none;
    for (const effect of transaction.effects) if (effect.is(selectSpan)) value = effect.value;
    return value;
  }, provide: field => EditorView.decorations.from(field),
});

class Engine {
  constructor() { this.id = 0; this.pending = null; this.worker = null; }
  stop(message = 'Superseded') {
    this.worker?.terminate(); this.worker = null;
    if (this.pending) { clearTimeout(this.pending.timer); this.pending.reject(new Error(message)); this.pending = null; }
  }
  request(method, source) {
    if (this.pending) this.stop();
    if (!this.worker) {
      this.worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
      this.worker.onerror = event => { event.preventDefault(); this.stop(event.message || 'Tower worker stopped'); };
      this.worker.onmessage = ({ data }) => {
        const pending = this.pending;
        if (!pending || data.id !== pending.id) return;
        clearTimeout(pending.timer); this.pending = null;
        if (data.error) { this.stop(); pending.reject(new Error(data.error)); }
        else pending.resolve(data.result);
      };
    }
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      const timer = setTimeout(() => this.stop('Parsing exceeded 10 seconds. Simplify the grammar and try again.'), 10000);
      this.pending = { id, resolve, reject, timer };
      this.worker.postMessage({ id, method, source, foundation, bedrock, editingModule });
    });
  }
}
const engine = new Engine();
let editor, source = '', offsets = [0], result = null, generation = 0;
let frame = 0, queued = null, saveTimer, dirty = true, busy = false, example = '';
let executionId = 0, executionError = null, runners = {};
let autoTimer = 0, documentRevision = 0, executedRevision = -1;
let llvmDownload, foundation = '', bundledFoundation = '', editingModule = '', bedrock = '', bundledBedrock = '';
let programSource = '', programFilename = 'foreach.tower';
let editorExtensions, programState;
const moduleStates = {};
const backendIds = ['interpreter', 'llvm'];
const outputId = backend => backend === 'interpreter' ? 'execution-output' : 'llvm-output';
const errorId = backend => backend === 'interpreter' ? 'execution-error' : 'llvm-error';
function isExecuting() { return backendIds.some(key => runners[key]?.worker); }
function showTimings() {
  const a = runners.interpreter?.timings ?? {}, b = runners.llvm?.timings ?? {};
  const values = [['Tower compile', a.tower], ['Instructions', a.instructions], ['LLVM compile', b.llvm],
    ['LLVM raw', b.before], ['LLVM optimize', b.after], ['LLVM emit/link', b.emit],
    ['Interpreter run', a.execute], ['LLVM run', b.execute], ['Tower load', a.load], ['LLVM load', b.llvmLoad]];
  $('timings').replaceChildren(...values.map(([label, ms]) => {
    const value = node('span', '', `${label} ${ms === undefined ? '—' : ms.toFixed(1) + ' ms'}`);
    value.title = label === 'Instructions' ? 'Format shared Foundation nodes as compilable Tower source; no separate bytecode is built.' : label;
    return value;
  }));
  $('steps').textContent = runners.interpreter?.result?.steps !== undefined ? `${runners.interpreter.result.steps.toLocaleString()} steps` : '';
}
function clearCompiled() {
  for (const id of ['core-instructions', 'llvm-before', 'llvm-after']) $(id).textContent = '';
  if (llvmDownload) URL.revokeObjectURL(llvmDownload); llvmDownload = null;
  $('llvm-download').hidden = true; $('llvm-status').textContent = '';
  runners = {}; showTimings();
  for (const backend of backendIds) {
    $(outputId(backend)).textContent = ''; $(errorId(backend)).hidden = true;
    $(backend + '-phase').textContent = 'Ready';
  }
  $('output-limit').hidden = $('llvm-output-limit').hidden = true;
}
try { $('auto-execute').checked = localStorage.getItem('tower-auto-execute-v1') !== 'false'; } catch {}
function scheduleAutoExecution() {
  clearTimeout(autoTimer); autoTimer = 0;
  if (!$('auto-execute').checked || dirty || executedRevision === documentRevision) return;
  if (result?.end?.status !== 'done') { $('execution-status').textContent = 'Waiting for valid source'; return; }
  if (!result.events.some(event => event.status === 'statement' && event.nodes.some(item => item.production !== null && item.label.startsWith('Core')))) {
    $('execution-status').textContent = 'Syntax only'; return;
  }
  $('execution-status').textContent = 'Waiting…';
  const revision = documentRevision;
  autoTimer = setTimeout(() => {
    autoTimer = 0;
    if (revision !== documentRevision || dirty || !$('auto-execute').checked) return;
    if (editor.composing) { scheduleAutoExecution(); return; }
    execute();
  }, 120);
}
function stopExecution(message) {
  clearTimeout(autoTimer); autoTimer = 0; ++executionId;
  for (const backend of backendIds) {
    const runner = runners[backend];
    if (runner?.worker) {
      runner.worker.terminate(); runner.worker = null;
      $(backend + '-phase').textContent = 'Cancelled';
    }
  }
  $('execute').disabled = !editor;
  $('cancel-execution').disabled = true;
  if (message) $('execution-status').textContent = message;
}
function executionDiagnostic(error) {
  const diagnostic = sourceDiagnostic(editor.state.doc, byteOffsets(editor.state.doc.toString()), error, result?.snapshot?.highlights ?? []);
  editor.dispatch({ effects: setDiagnostic.of(diagnostic) });
  $('editor-error').hidden = !diagnostic;
  if (diagnostic) {
    $('editor-error').textContent = `Error · Ln ${diagnostic.line}`;
    $('editor-error').setAttribute('aria-label', `Go to error on line ${diagnostic.line}`);
    $('editor-error').title = diagnostic.message;
  }
}
function updateComparison() {
  const a = runners.interpreter, b = runners.llvm;
  const differences = compareResults(a?.result, b?.result);
  if (a?.failure || b?.failure) $('execution-status').textContent = isExecuting() ? 'Comparison unavailable · running…' : 'Comparison unavailable';
  else if (differences) {
    $('execution-status').textContent = differences.length ? `Backend mismatch · ${differences.join(', ')}` :
      a.result.status === 'error' ? 'Failed · backends match' : a.result.outputTruncated ? 'Finished · captured results match (output limited)' : 'Finished · backends match';
  } else $('execution-status').textContent = 'Executing…';
  $('execute').disabled = isExecuting();
  $('cancel-execution').disabled = !isExecuting();
}
function execute() {
  stopExecution(); clearCompiled();
  executedRevision = documentRevision; executionError = null; executionDiagnostic(null);
  $('execution-status').textContent = 'Executing…';
  $('execute').disabled = true; $('cancel-execution').disabled = false;
  const id = executionId, text = editor.state.doc.toString();
  for (const backend of backendIds) {
    const worker = new Worker(new URL('./execution-worker.js', import.meta.url), { type: 'module' });
    const runner = runners[backend] = { worker, output: '', timings: {} };
    $(backend + '-phase').textContent = 'Loading…';
    const finish = () => { worker.terminate(); runner.worker = null; showTimings(); updateComparison(); };
    const fail = message => {
      runner.failure = message; $(errorId(backend)).textContent = message; $(errorId(backend)).hidden = false;
      $(backend + '-phase').textContent = 'Unavailable'; finish();
    };
    worker.onerror = event => { event.preventDefault(); if (id === executionId) fail(event.message || 'Execution worker stopped'); };
    worker.onmessage = ({ data }) => {
      if (id !== executionId || data.id !== id) return;
      if (data.timings) { runner.timings = data.timings; showTimings(); }
      if (data.error) { fail(data.error); return; }
      if (data.phase) $(backend + '-phase').textContent = data.phase;
      if (data.foundation !== undefined && backend === 'interpreter') $('core-instructions').textContent = data.foundation;
      if (data.llvm) {
        $('llvm-before').textContent = data.llvm.before; $('llvm-after').textContent = data.llvm.after;
        llvmDownload = URL.createObjectURL(new Blob([data.llvm.wasm], { type: 'application/wasm' }));
        $('llvm-download').href = llvmDownload; $('llvm-download').hidden = false;
        $('llvm-status').textContent = `${data.llvm.wasm.length.toLocaleString()} bytes`;
      }
      const answer = data.result;
      if (!answer) return;
      if (answer.output) { runner.output += answer.output; $(outputId(backend)).append(document.createTextNode(answer.output)); }
      $(backend === 'interpreter' ? 'output-limit' : 'llvm-output-limit').hidden = !answer.outputTruncated;
      if (answer.status === 'executing') return;
      runner.result = { ...answer, output: runner.output };
      $(backend + '-phase').textContent = answer.status === 'error' ? 'Failed' : 'Finished';
      if (answer.status === 'error') {
        $(errorId(backend)).textContent = answer.error; $(errorId(backend)).hidden = false;
        if (!executionError) { executionError = answer; executionDiagnostic(answer); }
      }
      finish();
    };
    worker.postMessage({ id, source: text, foundation, bedrock, backend });
  }
}
function node(tag, className, text) {
  const value = document.createElement(tag);
  if (className) value.className = className;
  if (text !== undefined) value.textContent = text;
  return value;
}
function empty(container, title, description) {
  const box = node('div', 'empty');
  box.append(node('span', 'empty-icon', '{ }'), node('strong', '', title), node('p', '', description));
  container.replaceChildren(box);
}
function controls() {
  $('auto-execute').disabled = !editor;
  $('execute').disabled = !editor || isExecuting();
  for (const id of ['open', 'save', 'restore', 'example-kind']) $(id).disabled = !editor;
  // Keep the last result visible while typing, but do not use its old spans.
  for (const id of ['tree']) {
    $(id).inert = dirty;
    $(id).setAttribute('aria-busy', String(dirty));
  }
}
function showError(message) {
  $('diagnostic').hidden = false;
  $('error-message').textContent = message;
}
function clearInspection() {
  result = null;
  $('diagnostic').hidden = true;
  $('editor-error').hidden = true;
  if (editor) editor.dispatch({ effects: setDiagnostic.of(null) });
  $('revision').textContent = 'Revision 0';
  $('tree-caption').textContent = 'Document';
  $('keywords').replaceChildren(); $('rules').replaceChildren(); $('token-rules').replaceChildren();
  $('node-info').textContent = 'Tree spans refer to UTF-8 source bytes.';
  empty($('tree'), 'Document', '');
}
function sourceRange(start, end, scroll = true) {
  const from = offsets[Math.min(start, offsets.length - 1)] ?? 0;
  const to = offsets[Math.min(end, offsets.length - 1)] ?? from;
  const effects = [selectSpan.of(from < to ? Decoration.set([Decoration.mark({ class: 'tw-selected' }).range(from, to)]) : Decoration.none)];
  if (scroll) effects.push(EditorView.scrollIntoView(from, { y: 'center' }));
  editor.dispatch({ effects });
}
function chooseNode(item, target, event) {
  $('tree').querySelectorAll('.selected').forEach(element => element.classList.remove('selected'));
  target.classList.add('selected');
  sourceRange(item.start, item.end);
  const rule = item.production === null ? 'token' : `production ${item.production}`;
  $('node-info').textContent = `${item.role ? item.role + ' · ' : ''}${item.label} · ${rule} · bytes [${item.start}, ${item.end}) · node ${item.id}`;
  if (item.origin) {
    const trace = event.expansions?.[item.origin.expansion];
    $('node-info').textContent += ` · ${item.origin.generated ? 'generated' : 'captured'}${trace ? ' by ' + trace.rule : ''} · template bytes [${item.origin.templateStart}, ${item.origin.templateEnd})`;
  }
}
function renderTree() {
  $('tree-caption').textContent = 'Document';
  const list = node('ul'), row = node('li'), documentTree = node('details'); documentTree.open = true;
  const heading = node('summary', 'document-root', 'Document'), roots = node('ul', 'document-children');
  heading.addEventListener('click', () => {
    chooseNode({ label: 'Document', start: 0, end: offsets.length - 1, production: 'root', id: 'document' }, heading, {});
  });
  documentTree.append(heading, roots); row.append(documentTree); list.append(row);
  const events = result?.events ?? [];
  const firstStatement = events.findIndex(event => event.status === 'statement');
  events.forEach((event, eventIndex) => {
    const nodes = event.nodes, children = nodes.map(() => []);
    nodes.forEach((item, index) => { if (item.parent !== null) children[item.parent].push(index); });
    const locations = replacementLocations(event);
    const showTokens = $('tokens').checked;
    function append(index, parent, depth) {
      const item = nodes[index];
      if (!showTokens && item.production === null && !item.role) return;
      const row = node('li'); row.dataset.eventIndex = eventIndex; row.dataset.nodeIndex = index;
      const childIndexes = children[index].filter(i => showTokens || nodes[i].production !== null || nodes[i].role);
      const traces = locations.get(index) ?? [];
      const expandable = childIndexes.length || traces.length;
      const control = node(expandable ? 'summary' : 'button', expandable ? '' : 'leaf');
      if (item.role) control.append(node('span', 'node-role', '$' + item.role));
      const label = index === 0 && event.status === 'declaration'
        ? nodes.filter(n => n.production === null).slice(0, 2).map(n => n.label).join(' ')
        : item.label.startsWith('capture(') && item.role ? 'capture list' : item.label;
      control.append(node('span', item.production === null ? 'node-token' : 'node-label', label), node('span', 'node-span', item.start + '...' + item.end));
      if (index === 0 && event.status === 'statement') {
        const excerpt = source.slice(offsets[item.start], offsets[item.end]).split('\n')[0].slice(0, 70);
        control.append(node('span', 'node-preview', excerpt));
      }
      control.title = item.label + ' | bytes [' + item.start + ', ' + item.end + ')';
      if (item.origin?.generated) control.append(node('span', 'node-span', 'generated'));
      control.addEventListener('click', () => { chooseNode(item, control, event); });
      if (expandable) {
        const details = node('details'), descendants = node('ul'); let loaded = false;
        const populate = () => {
          if (loaded || !details.open) return; loaded = true;
          if (traces.length) {
            const replacement = node('li', 'replacement-preview');
            for (const trace of traces) {
              const button = node('button', 'leaf replacement', 'replace ' + trace.rule);
              button.addEventListener('click', () => {
                chooseNode({ label: 'replace ' + trace.rule, start: trace.start, end: trace.end, production: 'replacement', id: index }, button, event);
                $('node-info').textContent += ' | definition bytes [' + trace.definitionStart + ', ' + trace.definitionEnd + ')';
              });
              replacement.append(button);
            }
            const selected = [], pending = [index];
            while (pending.length) { const i = pending.pop(); selected.push(nodes[i]); pending.push(...children[i].slice().reverse()); }
            const code = node('pre', 'expanded-code', expandedCode(selected));
            code.setAttribute('aria-label', 'Fully expanded replacement');
            code.title = 'Final replacement subtree; spacing normalized, skipped comments omitted.';
            replacement.append(code); descendants.append(replacement);
          }
          for (const child of childIndexes) append(child, descendants, depth + 1);
        };
        details.open = eventIndex === firstStatement && depth < 3;
        details.append(control, descendants); details.addEventListener('toggle', populate);
        row.append(details); populate();
      } else row.append(control);
      parent.append(row);
    }
    if (nodes.length) append(0, roots, 0);
  });
  $('tree').replaceChildren(list);
}
function renderGrammar(snapshot) {
  $('revision').textContent = `Revision ${snapshot?.revision ?? 0}`;
  $('keywords').replaceChildren(...(snapshot?.keywords ?? ['parse']).map(word => node('code', '', word)));
  $('rules').replaceChildren();
  for (const rule of snapshot?.rules ?? []) {
    const row = node('div', 'rule'); row.append(node('strong', '', rule.name), node('code', '', rule.definition)); $('rules').append(row);
  }
  if (!snapshot?.rules.length) $('rules').append(node('p', 'empty', 'Only the bootstrap declaration grammar is installed.'));
  $('token-rules').replaceChildren(node('p', 'eyebrow', 'TOKEN RULES'));
  for (const token of snapshot?.tokens ?? []) {
    const row = node('div', 'rule');
    row.append(node('strong', '', `${token.skip ? 'skip' : 'token'} ${token.name}`),
      node('code', '', `/${token.pattern}/${token.kind ? ' as ' + token.kind : ''}`));
    $('token-rules').append(row);
  }
}
function render() {
  const snapshot = result.snapshot;
  const decorations = snapshot.highlights.filter(token => token.end > token.start).map(token => {
    const from = offsets[token.start], to = offsets[token.end];
    return Decoration.mark({ class: `tw-${token.kind}`, attributes: { 'data-revision': String(token.revision) } }).range(from, to);
  });
  const error = result.end?.status === 'error' ? result.end : executionError;
  const diagnostic = sourceDiagnostic(editor.state.doc, offsets, error, snapshot.highlights);
  editor.dispatch({ effects: [paint.of(Decoration.set(decorations, true)), setDiagnostic.of(diagnostic)] });
  $('editor-error').hidden = !diagnostic;
  if (diagnostic) {
    $('editor-error').textContent = `Error · Ln ${diagnostic.line}`;
    $('editor-error').setAttribute('aria-label', `Go to error on line ${diagnostic.line}`);
    $('editor-error').title = diagnostic.message;
  }
  $('diagnostic').hidden = true;
  if (error && !diagnostic) showError(error.error);
  renderTree(); renderGrammar(snapshot);
  const prefix = result.end?.status === 'error' ? 'Stopped' : result.end?.status === 'done' ? 'Complete' : 'Paused';
  $('status').textContent = `${prefix} · ${snapshot.revision} grammar revisions · ${result.ms.toFixed(1)} ms`;
  $('runtime').classList.add('ready'); $('runtime-text').textContent = 'WASM ready';
}
async function perform(method) {
  // One request in flight, one latest pending request. Ordinary edits never
  // destroy the warm WASM worker or accumulate a backlog of obsolete sources.
  if (busy) { queued = method; return; }
  cancelAnimationFrame(frame); frame = 0; queued = null;
  const ticket = ++generation;
  method = 'analyze';
  source = editor.state.doc.toString(); offsets = byteOffsets(source);
  busy = true; controls(); $('status').textContent = 'Tower is parsing…';
  try {
    const answer = await engine.request(method, source);
    if (ticket !== generation) return;
    result = answer; dirty = false;
    render(); scheduleAutoExecution();
  } catch (error) {
    if (ticket !== generation) return;
    dirty = true; clearInspection(); showError(error.message);
    $('status').textContent = 'Unable to finish. Edit the source to retry.';
    $('runtime').classList.remove('ready'); $('runtime-text').textContent = 'WASM stopped';
  } finally {
    busy = false; controls();
    if (queued) schedule(queued);
  }
}
function schedule(method = 'analyze') {
  queued = method;
  if (frame || busy) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    // Do not disturb a mobile/IME composition with parse decorations.
    if (editor.composing) { schedule(queued); return; }
    perform(queued);
  });
}
function persist() {
  clearTimeout(saveTimer);
  try {
    if (editingModule === 'bedrock') bedrock = editor.state.doc.toString();
    else if (editingModule === 'foundation') foundation = editor.state.doc.toString();
    else programSource = editor.state.doc.toString();
    localStorage.setItem('tower-playground-source-v1', programSource);
    localStorage.setItem('tower-playground-foundation-v1', foundation);
    localStorage.setItem('tower-playground-foundation-base-v1', bundledFoundation);
    localStorage.setItem('tower-playground-bedrock-v1', bedrock);
    localStorage.setItem('tower-playground-bedrock-base-v1', bundledBedrock);
  } catch {}
}
window.addEventListener('pagehide', () => { if (editor) persist(); stopExecution(); });
function changed() {
  ++documentRevision;
  const wasExecuting = isExecuting();
  stopExecution(wasExecuting ? 'Cancelled by edit' : 'Ready');
  clearCompiled();
  executionError = null;
  if (editingModule === 'bedrock') bedrock = editor.state.doc.toString();
  else if (editingModule === 'foundation') foundation = editor.state.doc.toString();
  else programSource = editor.state.doc.toString();
  ++generation; dirty = true; controls();
  $('node-info').textContent = 'Tree spans refer to UTF-8 source bytes.';
  $('diagnostic').hidden = true;
  $('editor-error').hidden = true;
  $('status').textContent = 'Updating…';
  clearTimeout(saveTimer); saveTimer = setTimeout(persist, 250);
  schedule();
}
function replaceSource(text, filename = 'scratch.tower') {
  $('filename').textContent = editingModule ? editingModule + '.tower' : filename;
  editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: text } });
}
function switchDocument(target = '') {
  if (editingModule === target) return;
  persist();
  if (editingModule) moduleStates[editingModule] = editor.state;
  else { programState = editor.state; programFilename = $('filename').textContent; }
  editingModule = target;
  const selection = target ? target + '.tower' : programFilename;
  if ([...$('example-kind').options].some(option => option.value === selection)) $('example-kind').value = selection;
  $('filename').textContent = target ? target + '.tower' : programFilename;
  editor.setState((target ? moduleStates[target] : programState) ?? EditorState.create({
    doc: target === 'bedrock' ? bedrock : target === 'foundation' ? foundation : programSource,
    extensions: editorExtensions,
  }));
  changed();
}

function showTab(which) {
  for (const tab of ['tree', 'grammar']) {
    const active = tab === which;
    $(tab + '-tab').setAttribute('aria-selected', String(active));
    $(tab + '-tab').tabIndex = active ? 0 : -1;
    $(tab + '-pane').hidden = !active;
  }
}
for (const tab of ['tree', 'grammar']) {
  $(tab + '-tab').onclick = () => showTab(tab);
  $(tab + '-tab').onkeydown = event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); const other = tab === 'tree' ? 'grammar' : 'tree'; showTab(other); $(other + '-tab').focus(); }
  };
}
$('tokens').onchange = () => renderTree();
$('execute').onclick = () => execute();
$('cancel-execution').onclick = () => { executedRevision = documentRevision; stopExecution('Cancelled'); };
$('auto-execute').onchange = () => {
  try { localStorage.setItem('tower-auto-execute-v1', String($('auto-execute').checked)); } catch {}
  if ($('auto-execute').checked) {
    executedRevision = -1;
    if (!dirty && !result?.end) perform('analyze');
    else scheduleAutoExecution();
  } else stopExecution('Auto off');
};
async function loadDocument(reset = false) {
  const filename = $('example-kind').value;
  if (filename === 'bedrock.tower' || filename === 'foundation.tower') {
    const target = filename.slice(0, -6);
    switchDocument(target);
    if (reset) replaceSource(target === 'bedrock' ? bundledBedrock : bundledFoundation, filename);
    return;
  }
  if (!reset && filename === programFilename) { switchDocument(''); return; }
  try {
    let text = example;
    if (filename !== 'foreach.tower') {
      const response = await fetch('./' + filename);
      if (!response.ok) throw new Error('Unable to load example');
      text = await response.text();
    }
    switchDocument('');
    programFilename = filename; $('example-kind').value = filename; replaceSource(text, filename);
  } catch (error) { showError(error.message); }
}
$('restore').onclick = () => loadDocument(true);
$('example-kind').onchange = () => loadDocument();
$('open').onclick = () => $('file').click();
$('file').onchange = async () => {
  const file = $('file').files[0]; if (!file) return;
  try {
    if (file.size > 128 * 1024) throw new Error('Playground source limit is 128 KiB');
    replaceSource(await file.text(), file.name);
  } catch (error) { showError(error.message); }
  $('file').value = '';
};
$('save').onclick = () => {
  const url = URL.createObjectURL(new Blob([editor.state.doc.toString()], { type: 'text/plain;charset=utf-8' }));
  const link = node('a'); link.href = url; link.download = $('filename').textContent; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$('editor-error').onclick = () => goToDiagnostic(editor);



async function start() {
  const [response, module, seed] = await Promise.all([fetch('./foreach.tower'), fetch('./foundation.tower'), fetch('./bedrock.tower')]);
  if (!seed.ok) throw new Error('Unable to load bedrock.tower');
  bedrock = bundledBedrock = await seed.text();
  if (!module.ok) throw new Error('Unable to load foundation.tower');
  foundation = bundledFoundation = await module.text();
  if (!response.ok) throw new Error('Unable to load the example');
  example = await response.text();
  let initial = example;
  try {
    initial = localStorage.getItem('tower-playground-source-v1') ?? example;
    bedrock = await selectFoundation(bundledBedrock, localStorage.getItem('tower-playground-bedrock-v1'), localStorage.getItem('tower-playground-bedrock-base-v1'));
    const savedFoundation = localStorage.getItem('tower-playground-foundation-v1');
    foundation = await selectFoundation(bundledFoundation, savedFoundation, localStorage.getItem('tower-playground-foundation-base-v1'), { bedrock });
    if (savedFoundation !== null && foundation !== savedFoundation) {
      // Keep the original locally before upgrading the editor's saved document.
      // A reload or another document switch must not bring the old copy back.
      const backup = 'tower-playground-foundation-before-inheritance-v1';
      if (localStorage.getItem(backup) === null) localStorage.setItem(backup, savedFoundation);
      localStorage.setItem('tower-playground-foundation-v1', foundation);
      localStorage.setItem('tower-playground-foundation-base-v1', bundledFoundation);
    }
  } catch {}
  programSource = initial;
  editorExtensions = [
    lineNumbers(), highlightActiveLineGutter(), highlightActiveLine(), history(), highlighting, selectionMark, editorDiagnostics,
    EditorView.lineWrapping, EditorView.theme({ '&': { color: '#d4e0e2', backgroundColor: '#121a1e' } }, { dark: true }),
    EditorView.contentAttributes.of({ 'aria-label': 'Tower source', spellcheck: 'false', autocapitalize: 'off', autocorrect: 'off' }),
    keymap.of([{ key: 'Mod-Enter', run: () => { perform('analyze'); return true; } }, ...defaultKeymap, ...historyKeymap, indentWithTab]),
    EditorView.updateListener.of(update => {
      if (update.docChanged) changed();
      if (update.selectionSet || update.docChanged) {
        const position = update.state.selection.main.head, line = update.state.doc.lineAt(position);
        $('position').textContent = `Ln ${line.number}, Col ${position - line.from + 1}`;
      }
    }),
  ];
  editor = new EditorView({ parent: $('editor'), state: EditorState.create({ doc: initial, extensions: editorExtensions }) });
  clearCompiled(); clearInspection(); showTab('tree'); controls();
  await perform('analyze');
}
controls();
start().catch(error => { showError(error.message); $('status').textContent = 'Could not start. Serve the dist folder over HTTP and reload.'; });
