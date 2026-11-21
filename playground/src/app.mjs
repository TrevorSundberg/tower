import { EditorState, StateEffect, StateField } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, Decoration } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { byteOffsets } from './offsets.mjs';
import { editorDiagnostics, goToDiagnostic, setDiagnostic, sourceDiagnostic } from './diagnostics.mjs';
import { DiagnosticDelay } from './diagnostic-delay.mjs';
import {documentLocation,sourceLocation} from './source-location.mjs';
import { expandedCode } from './expanded-code.mjs';
import { replacementLocations } from './replacement-locations.mjs';
import { compareResults } from './comparison.mjs';
import { selectFoundation } from './foundation-storage.mjs';
import { targets, sourceTargets, targetChoices, nativeTargetKeys, emptySelection, savedTargetSelection, targetSelectionKey, linkInputsForTarget } from './targets.mjs';
import { detectBrowserTarget, defaultTargetSelection } from './browser-target.mjs';
import { OutputPane } from './output-pane.mjs';
import {examples, filePath, newProject, projectStore, validateProject, projectSources, refreshCompilerSources} from './projects.mjs';
import {exportProject, importProject} from './project-archive.mjs';
import {compilerSelection, selectCompiler, onCompilerSelection} from './compiler-selection.mjs';
import { towerCompletion } from './completion.mjs';
import { paint, highlighting, towerDecorations } from './tower-highlights.mjs';
import { prepareCompilerIsolation } from './compiler-isolation.mjs';

await prepareCompilerIsolation();

const $ = id => document.getElementById(id);
const selectSpan = StateEffect.define();
const selectionMark = StateField.define({
  create: () => Decoration.none,
  update(value, transaction) {
    if (transaction.docChanged) value = Decoration.none;
    for (const effect of transaction.effects) if (effect.is(selectSpan)) value = effect.value;
    return value;
  }, provide: field => EditorView.decorations.from(field),
});

function cancelCompilerBuild(message) {
  clearTimeout(compilerBuildTimer); compilerBuildTimer = null;
  ++compilerBuildId;
  compilerBuildWorker?.terminate(); compilerBuildWorker = null;
  $('cancel-compiler-build').disabled = true;
  if (message) $('compiler-build-status').textContent = message;
}
function scheduleCompilerBuild() {
  if (!project?.compilerProject) return;
  const snapshot = JSON.stringify(project.files);
  if (snapshot === compilerBuildSnapshot) return;
  cancelCompilerBuild('Compiler source changed');
  if (!$('auto-rebuild-compiler').checked) return;
  compilerBuildTimer = setTimeout(() => rebuildCompiler(), 1000);
}
function rebuildCompiler() {
  if (!project?.compilerProject) return;
  captureDocument(); cancelCompilerBuild(); stopExecution();
  const id = compilerBuildId, owner = project;
  compilerBuildSnapshot = JSON.stringify(project.files);
  $('cancel-compiler-build').disabled = false;
  $('compiler-build-status').textContent = 'Loading compiler build…';
  const worker = compilerBuildWorker = new Worker(new URL('./compiler-build-worker.js',import.meta.url),{type:'module'});
  const fail = message => { if (id !== compilerBuildId) return; cancelCompilerBuild('Build failed: '+message); };
  worker.onerror = event => { event.preventDefault(); fail(event.message || 'Compiler build worker stopped'); };
  worker.onmessage = ({data}) => {
    if (id !== compilerBuildId || data.id !== id || project !== owner) return;
    if (data.error) { fail(data.error); return; }
    if (data.phase) $('compiler-build-status').textContent = data.phase;
    if (data.modules) {
      cancelCompilerBuild();
      ++compilerGeneration;
      selectCompiler(data.modules);
      $('compiler-build-status').textContent = 'Compiler generation '+compilerGeneration+' active · '+data.stats.workers+' workers · import, interpreter and LLVM checks passed';
    }
  };
  worker.postMessage({id,files:project.files,compiler:compilerSelection()});
}

class Engine {
  constructor() { this.id = 0; this.pending = null; this.worker = null; }
  stop(message = 'Superseded') {
    this.worker?.terminate(); this.worker = null;
    if (this.pending) { this.pending.reject(new Error(message)); this.pending = null; }
  }
  request(method, source) {
    if (this.pending) this.stop();
    if (!this.worker) {
      this.worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
      this.worker.onerror = event => { event.preventDefault(); this.stop(event.message || 'Tower worker stopped'); };
      this.worker.onmessage = ({ data }) => {
        const pending = this.pending;
        if (!pending || data.id !== pending.id) return;
        this.pending = null;
        if (data.error) { this.stop(); pending.reject(new Error(data.error)); }
        else pending.resolve(data.result);
      };
    }
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      // Parsing runs in a disposable worker. Stop and edits cancel it explicitly;
      // a large valid grammar must not fail because of a wall-clock deadline.
      this.pending = { id, resolve, reject };
      this.worker.postMessage({ compiler:compilerSelection(), library:project.library ?? '.tower', id, method, source, foundation, bedrock, editingModule, files:project.files, builtins:project.builtins, activePath, entry:projectSources(project)[0]?.path });
    });
  }
}
const engine = new Engine();
let editor, source = '', offsets = [0], result = null, generation = 0;
let frame = 0, queued = null, dirty = true, busy = false;
let executionId = 0, executionError = null, runners = {};
const idleExecutionWorkers = new Map();
let linkInputs = {}, llvmViews = {};
let selectedTargets = { ...emptySelection(), wasm: true, interpreter: true, fast: true }, savedSelection = null, targetsChanged = false;
try { savedSelection = savedTargetSelection(localStorage); } catch {}
if (savedSelection) selectedTargets = savedSelection;
const browserTarget = detectBrowserTarget(navigator);
const outputPanes = new Map(), runnerPanes = new Map();
const outputBody = document.querySelector('.execution-body');
function addPane(config, runner) {
  const pane = new OutputPane(outputBody, config);
  outputPanes.set(config.output, pane);
  if (runner) runnerPanes.set(runner, pane);
  return pane;
}
addPane({title:'Tower instructions', output:'core-instructions', label:'Canonical foundation source', syntax:'tower'});
addPane({id:'interpreter-column', title:'Graph interpreter', output:'execution-output', label:'Graph interpreter output', phase:'interpreter-phase', error:'execution-error', limit:'output-limit'}, 'interpreter');
addPane({id:'fast-column', title:'Fast interpreter', output:'fast-output', label:'Fast interpreter output', phase:'fast-phase', error:'fast-error', limit:'fast-limit'}, 'fast');
addPane({id:'wasm-column', title:'Wasm Execution', output:'llvm-output', label:'LLVM output', phase:'llvm-phase', error:'llvm-error', limit:'llvm-output-limit'}, 'llvm');
addPane({id:'llvm-raw-column', title:'LLVM raw', output:'llvm-before', syntax:'llvm'});
addPane({id:'llvm-optimized-column', title:'LLVM optimized', output:'llvm-after', syntax:'llvm'});
addPane({id:'c-column', title:'C source', description:'Portable C, 64-bit little endian target', output:'c-disassembly', syntax:'c', phase:'c-phase', error:'c-error', downloads:{id:'c-downloads',link:'c-download'}}, 'c');
addPane({id:'roku-column', title:'Roku BrightScript', description:'32-bit profile; physical-device testing pending', output:'roku-disassembly', syntax:'brightscript', phase:'roku-phase', error:'roku-error', downloads:{id:'roku-downloads',link:'roku-download'}}, 'roku');
addPane({id:'fast-disassembly-column', title:'Bytecode disassembly', description:'Compilable foundation reconstructed from the validated .towerbc package', output:'fast-disassembly', label:'Bytecode disassembly as foundation', syntax:'tower', downloads:{id:'fast-downloads', link:'fast-download', size:'fast-size'}});
addPane({id:'wasm-disassembly-column', title:'WebAssembly disassembly', output:'wasm-disassembly', label:'Wasm disassembly', syntax:'wasm', downloads:{id:'wasm-downloads', link:'llvm-download', size:'llvm-status'}});
for (const key of nativeTargetKeys) {
  const target = targets[key];
  addPane({id:key+'-column', title:target.label+' disassembly', description:target.triple, output:key+'-disassembly', syntax:target.syntax, phase:key+'-phase', error:key+'-error', downloads:{id:key+'-downloads'}}, key);
}
function showCode(id, text) { outputPanes.get(id).code.setText(text); }
function setPhase(backend, text = '') { runnerPanes.get(backend).setPhase(text); }
function downloadName(key, extension) { return $('filename').textContent.replace(/\.tower$/, '')+'-'+key+'.'+extension; }
const selectedNativeKeys = () => nativeTargetKeys.filter(key => selectedTargets[key]);
const buildKeys = () => [...selectedNativeKeys(), ...Object.keys(sourceTargets).filter(key=>selectedTargets[key])];
let autoTimer = 0, documentRevision = 0, executedRevision = -1;
const typingDebounceMs = 200;
let diagnosticPhase = null;
const diagnosticDelay = new DiagnosticDelay((channel, value) => {
  if (channel === 'editor') publishDiagnostic(value?.error ?? null, value?.phase ?? null);
  else { $(channel).textContent = value ?? ''; $(channel).hidden = value === null; }
});
const reportProblem = (channel, value) => diagnosticDelay.update(channel, value, documentRevision);
let typingDeadline = 0;
let foundation = '', bundledFoundation = '', editingModule = '', bedrock = '', bundledBedrock = '', bundledTower = '', bundledBuiltins = {};
let documentLoadId = 0;
let editorExtensions, projects = [], project, storage, activePath = '', saveSequence = 0;
const fileStates = new Map(), bundledExamples = new Map(), compilerSources = new Map();
let compilerBuildWorker, compilerBuildTimer, compilerBuildId = 0, compilerBuildSnapshot = '', compilerGeneration = 0;
const backendIds = ['interpreter', 'fast', 'llvm'];
const selectedBackends = () => backendIds.filter(key => selectedTargets[key === 'llvm' ? 'wasm' : key]);
const outputId = backend => backend === 'interpreter' ? 'execution-output' : backend === 'fast' ? 'fast-output' : 'llvm-output';
const errorId = backend => backend === 'interpreter' ? 'execution-error' : backend === 'fast' ? 'fast-error' : 'llvm-error';
function isExecuting() { return Object.values(runners).some(runner => runner.worker); }
function cancelState() { $('cancel-execution').disabled = !busy && !isExecuting(); }
function warmSelectedTargets() {
  for (const backend of ['llvm','native']) {
    if (!(backend === 'llvm' ? selectedTargets.wasm : selectedNativeKeys().length) || idleExecutionWorkers.has(backend) || runners[backend]?.worker) continue;
    const worker = new Worker(new URL(backend === 'llvm' ? './execution-worker.js' : './target-worker.js',import.meta.url),{type:'module'});
    idleExecutionWorkers.set(backend,worker);
    const started = performance.now();
    const discard = () => {
      if (idleExecutionWorkers.get(backend) === worker) { idleExecutionWorkers.delete(backend); worker.terminate(); }
    };
    worker.addEventListener('error',discard,{once:true});
    const warmed = ({data}) => {
      if (!data.warm) return;
      worker.removeEventListener('message',warmed); worker.removeEventListener('error',discard);
      if (data.error) discard();
      else performance.measure('tower-'+backend+'-warm',{start:started,end:performance.now()});
    };
    worker.addEventListener('message',warmed);
    worker.postMessage({compiler:compilerSelection(), command:'warm',targetKeys:selectedNativeKeys()});
  }
}
function updateColumns() {
  const any = selectedTargets.fast || selectedTargets.wasm || buildKeys().length > 0;
  $('c-column').hidden = !selectedTargets.c;
  $('roku-column').hidden = !selectedTargets.roku;
  $('interpreter-column').hidden = !selectedTargets.interpreter;
  $('fast-column').hidden = !selectedTargets.fast;
  $('fast-disassembly-column').hidden = !selectedTargets.fast;
  $('llvm-raw-column').hidden = $('llvm-optimized-column').hidden = !any;
  $('wasm-column').hidden = !selectedTargets.wasm;
  $('wasm-disassembly-column').hidden = !selectedTargets.wasm;
  for (const key of nativeTargetKeys) $(key+'-column').hidden = !selectedTargets[key];
  const count = 1 + (any ? 2 : 0) + Object.values(selectedTargets).filter(Boolean).length + (selectedTargets.wasm ? 1 : 0) + (selectedTargets.fast ? 1 : 0);
  document.querySelector('.execution-body').style.setProperty('--columns',count);
}
function showLLVM(key,before,after) {
  llvmViews[key] = {before,after};
  renderLLVM();
}
function renderLLVM() {
  const keys = Object.keys(targetChoices).filter(key=>llvmViews[key]);
  for (const [field,id] of [['before','llvm-before'],['after','llvm-after']])
    showCode(id,keys.map(key => (keys.length > 1 ? '; '+targetChoices[key].label+'\n' : '')+llvmViews[key][field]).join('\n\n'));
}
function compileNative(id,text) {
  const keys = buildKeys();
  const worker = idleExecutionWorkers.get('native') ?? new Worker(new URL('./target-worker.js',import.meta.url),{type:'module'});
  idleExecutionWorkers.delete('native');
  const runner = runners.native = {worker,keys,timings:{},failure:null,completed:new Set()};
  for (const key of keys) setPhase(key,'Loading…');
  const beginDisplay = () => { if (!runner.displayStarted) { keys.forEach(clearNative); renderLLVM(); runner.displayStarted=true; } };
  const fail = (message,key) => {
    runner.failure=message;
    for (const target of key ? [key] : keys.filter(key=>!runner.completed.has(key))) {
      reportProblem(target+'-error',message);
      setPhase(target,'Failed'); runner.completed.add(target);
    }
  };
  const finish = () => {
    worker.onmessage = worker.onerror = null;
    if (runner.failure) worker.terminate(); else idleExecutionWorkers.set('native',worker);
    runner.worker=null; showTimings(); updateComparison();
  };
  worker.onerror = event => { event.preventDefault(); if(id!==executionId)return; beginDisplay(); fail(event.message); finish(); };
  worker.onmessage = ({data}) => {
    if(id!==executionId || data.id!==id)return;
    if (data.foundation !== undefined && !selectedBackends().length) showCode('core-instructions',data.foundation);
    if(data.phase && !data.done) for (const key of data.target ? [data.target] : keys) setPhase(key,data.phase);
    if(data.error || data.bytes || data.done) beginDisplay();
    if(data.error) fail(data.error,data.target);
    if(data.bytes) {
      const target=targets[data.target] ?? sourceTargets[data.target];
      if (data.before !== undefined) showLLVM(data.target,data.before,data.after);
      showCode(data.target+'-disassembly',data.disassembly);
      outputPanes.get(data.target+'-disassembly').setDownload(data.bytes, {label:data.target==='c'?'Download C':data.target==='roku'?'Download BrightScript':target.label, filename:downloadName(data.target,target.extension), type:target.mime??'application/octet-stream'});
      setPhase(data.target); runner.completed.add(data.target);
      runner.timings[target.label]=data.ms; showTimings();
    }
    if(data.done)finish();
  };
  worker.postMessage({compiler:compilerSelection(), library:project.library ?? '.tower', id,source:text,foundation,bedrock,targetKeys:keys,inputs:linkInputs, files:editingModule ? undefined : projectSources(project), drive:project.files, builtins:project.builtins, entry:editingModule ? activePath : projectSources(project)[0]?.path,optimize:$('optimize').checked,comments:$('preserve-comments').checked});
}
function showTimings() {
  const a = runners.interpreter?.timings ?? {}, b = runners.llvm?.timings ?? {};
  const values = [['Tower load', a.load, a.loadCached], ['Tower compile', a.tower], ['Instructions', a.instructions],
    ['Graph run', a.execute], ['Fast LLVM', runners.fast?.timings?.optimize], ['Fast prepare', runners.fast?.timings?.prepare], ['Bytecode package', runners.fast?.timings?.package], ['Fast run', runners.fast?.timings?.execute], ['LLVM load', b.llvmLoad, b.llvmLoadCached], ['LLVM parse', b.parse],
    ['LLVM raw', b.before], ['LLVM optimize', b.after], ['LLVM emit', b.emit], ['Link', b.link],
    ['LLVM disassembly', b.disassembly], ['LLVM compile total', b.llvm], ['LLVM run', b.execute]];
  for(const [label,ms] of Object.entries(runners.native?.timings??{})) values.push([label+' compile',ms]);
  const shown = values.filter(([label]) => selectedTargets.wasm || !label.startsWith('LLVM') && label !== 'Link');
  const existing = new Map([...$('timings').children].map(value=>[value.dataset.label,value]));
  const elements = shown.map(([label, ms, cached]) => {
    const value = existing.get(label) ?? node('span'); value.dataset.label = label;
    const text = `${label} ${ms === undefined ? '—' : ms.toFixed(1) + ' ms'}${cached ? ' (cached)' : ''}`;
    if (value.textContent !== text) value.textContent = text;
    value.title = cached ? 'Time measured this run to reuse cached compiler state.' :
      label === 'LLVM compile total' ? 'Total includes the LLVM phases above; it is not an additional stage.' :
      label === 'Instructions' ? 'Format shared Foundation nodes as compilable Tower source; no separate bytecode is built.' : label;
    return value;
  });
  if (elements.some((element,index)=>$('timings').children[index]!==element) || elements.length!==$('timings').children.length) $('timings').replaceChildren(...elements);
  $('timings').title = 'Backend branches run in parallel; each is listed in pipeline order. Totals include their detailed phases.';
  if (runners.interpreter?.result?.steps !== undefined) $('steps').textContent = `${runners.interpreter.result.steps.toLocaleString()} steps`;
}
function clearNative(key) {
  outputPanes.get(key+'-disassembly').clearDownload();
  delete llvmViews[key];
  showCode(key+'-disassembly','');
  reportProblem(key+'-error',null);
}
function clearWasm() {
  outputPanes.get('wasm-disassembly').clearDownload();
  showCode('wasm-disassembly',''); delete llvmViews.wasm;
}
function clearCompiled() {
  outputPanes.get('fast-disassembly').clearDownload(); showCode('fast-disassembly','');
  for(const key of [...nativeTargetKeys,...Object.keys(sourceTargets)]) { clearNative(key); setPhase(key); }
  clearWasm(); llvmViews={}; $('steps').textContent = '';
  for (const id of ['core-instructions', 'llvm-before', 'llvm-after']) showCode(id,'');
  runners = {}; showTimings();
  for (const backend of backendIds) {
    $(outputId(backend)).textContent = ''; reportProblem(errorId(backend),null);
    setPhase(backend);
  }
  $('fast-limit').hidden = $('output-limit').hidden = $('llvm-output-limit').hidden = true;
}
try { $('auto-execute').checked = localStorage.getItem('tower-auto-execute-v1') !== 'false'; } catch {}
function scheduleAutoExecution() {
  clearTimeout(autoTimer); autoTimer = 0;
  if (project?.compilerProject) return;
  if (!$('auto-execute').checked || dirty || executedRevision === documentRevision) return;
  if (result?.end?.status !== 'done' && (editingModule || activePath === projectSources(project)[0]?.path)) { $('execution-status').textContent = 'Waiting for valid source'; return; }
  const entry = projectSources(project)[0]?.path;
  const importsProgram = !editingModule && (project.dependencies ?? []).some(path =>
    ![entry, '.tower/bedrock.tower', '.tower/foundation.tower', '.tower/tower.tower'].includes(path));
  if ((editingModule || activePath === entry) && !importsProgram && !result.events.some(event => event.status === 'statement' && event.nodes.some(item => item.production !== null && item.label.startsWith('Core')))) {
    clearCompiled(); $('execution-status').textContent = 'Syntax only'; return;
  }
  $('execution-status').textContent = 'Waiting…';
  const revision = documentRevision;
  autoTimer = setTimeout(() => {
    autoTimer = 0;
    if (revision !== documentRevision || dirty || !$('auto-execute').checked) return;
    if (editor.composing) { scheduleAutoExecution(); return; }
    execute();
  }, Math.max(editor.composing ? typingDebounceMs : 0, typingDeadline - performance.now()));
}
function stopExecution(message) {
  clearTimeout(autoTimer); autoTimer = 0; ++executionId;
  for (const backend of Object.keys(runners)) {
    const runner = runners[backend];
    if (runner?.worker) {
      runner.worker.terminate(); runner.worker = null;
      for (const key of backend === 'native' ? runner.keys.filter(key=>!runner.completed.has(key)) : [backend]) setPhase(key,'Cancelled');
    }
  }
  $('execute').disabled = !editor;
  cancelState();
  if (message) $('execution-status').textContent = message;
}
function executionDiagnostic(error) {
  reportProblem('editor', error ? {error,phase:'execution'} : null);
}
function publishDiagnostic(error, phase) {
  if (error?.errorFile && error.errorFile !== activePath) {
    const text=project.files.find(file=>file.path===error.errorFile)?.text ??
      (error.errorFile.startsWith('.tower/')?project.builtins[error.errorFile.slice(7,-6)]:undefined);
    let location=error.errorFile;
    if(text!==undefined && Number.isInteger(error.errorOffset)) {
      const doc=EditorState.create({doc:text}).doc;
      const diagnostic=sourceDiagnostic(doc,byteOffsets(text),error,[],error.errorFile);
      location=sourceLocation(diagnostic.file,diagnostic.line,diagnostic.column);
    }
    showError(location + ': ' + error.error); return;
  }
  diagnosticPhase = error ? phase : null;
  const diagnostic = sourceDiagnostic(editor.state.doc, byteOffsets(editor.state.doc.toString()), error, result?.snapshot?.highlights ?? [], activePath);
  editor.dispatch({ effects: setDiagnostic.of(diagnostic) });
  $('editor-error').hidden = !diagnostic;
  $('diagnostic').hidden = true;
  if (error && !diagnostic) showError(error.error);
  if (diagnostic) {
    const location=sourceLocation(diagnostic.file,diagnostic.line,diagnostic.column);
    $('editor-error').textContent = `Error · ${location}`;
    $('editor-error').setAttribute('aria-label', `Go to error at ${location}`);
    $('editor-error').title = diagnostic.message;
  }
}
function updateComparison() {
  const active = selectedBackends().map(key => runners[key]);
  const complete = active.every(runner => runner?.result);
  const a = active[0];
  const differences = complete && a ? active.slice(1).flatMap(runner => compareResults(a.result, runner.result)) : null;
  const nativeRunning = runners.native?.worker;
  if (active.some(runner => runner?.failure)) $('execution-status').textContent = isExecuting() ? 'Comparison unavailable · running…' : 'Comparison unavailable';
  else if (differences) {
    $('execution-status').textContent = differences.length ? 'Backend mismatch · ' + [...new Set(differences)].join(', ') :
      (a.result.status === 'error' ? 'Failed' : 'Finished') + (active.length > 1 ? a.result.outputTruncated ? ' · captured results match (output limited)' : ' · backends match' : '');
  } else $('execution-status').textContent = active.length ? 'Executing…' : nativeRunning ? 'Compiling…' : 'No execution targets selected';
  if(nativeRunning) $('execution-status').textContent += ' · compiling targets…';
  else if(runners.native?.failure) $('execution-status').textContent += ' · target build failed';
  $('execute').disabled = isExecuting();
  if (!isExecuting() && !executionError && result?.end?.status === 'done') executionDiagnostic(null);
  cancelState();
}
function execute() {
  if (project?.compilerProject) { rebuildCompiler(); return; }
  stopExecution(); runners = {};
  executedRevision = documentRevision; executionError = null;
  $('execution-status').textContent = 'Executing…';
  $('execute').disabled = true; $('cancel-execution').disabled = false;
  const id = executionId, text = editor.state.doc.toString();
  for (const backend of selectedBackends()) {
    const worker = idleExecutionWorkers.get(backend) ?? new Worker(new URL('./execution-worker.js', import.meta.url), { type: 'module' });
    idleExecutionWorkers.delete(backend);
    const runner = runners[backend] = { worker, output: '', timings: {} };
    setPhase(backend,'Loading…');
    const finish = () => {
      worker.onmessage = worker.onerror = null;
      if (runner.failure) worker.terminate(); else idleExecutionWorkers.set(backend, worker);
      runner.worker = null; showTimings(); updateComparison();
    };
    const fail = message => {
      if (backend === 'fast') { outputPanes.get('fast-disassembly').clearDownload(); showCode('fast-disassembly',''); }
      $(outputId(backend)).textContent='';
      runner.failure = message; reportProblem(errorId(backend),message);
      setPhase(backend,'Unavailable'); finish();
    };
    worker.onerror = event => { event.preventDefault(); if (id === executionId) fail(event.message || 'Execution worker stopped'); };
    worker.onmessage = ({ data }) => {
      if (id !== executionId || data.id !== id) return;
      if (data.timings) { runner.timings = data.timings; showTimings(); }
      if (data.error) { fail(data.error); return; }
      if (data.phase) setPhase(backend,data.phase);
      if (data.foundation !== undefined) {
        // Semantic compilation has succeeded. A previous run's diagnostic no
        // longer applies, even if this new program executes indefinitely.
        if (!executionError && diagnosticPhase === 'execution') executionDiagnostic(null);
        runner.formatted=true;
        if (backend === selectedBackends()[0]) showCode('core-instructions',data.foundation);
      }
      if (data.bytecode) {
        showCode('fast-disassembly',data.disassembly);
        outputPanes.get('fast-disassembly').setDownload(data.bytecode,{label:'.towerbc v1',filename:downloadName('fast','towerbc')});
        $('fast-size').title = `${data.cache.codeBytes} bytes of packed code; ${data.cache.cacheCapacityBytes} bytes of cache storage. Package also includes canonical foundation for validation and reconstruction.`;
      }
      if(data.fastLLVM) showLLVM('fast',data.fastLLVM.before,data.fastLLVM.after);
      if (data.llvm) {
        runner.compiled=true;
        showLLVM('wasm',data.llvm.before,data.llvm.after);
        showCode('wasm-disassembly',data.llvm.disassembly);
        outputPanes.get('wasm-disassembly').setDownload(data.llvm.wasm, {label:'WASM', filename:downloadName('wasm','wasm'), type:'application/wasm'});
      }
      const answer = data.result;
      if (!answer) return;
      if (!runner.displayStarted) {
        $(outputId(backend)).textContent=''; reportProblem(errorId(backend),null);
        runner.displayStarted=true;
      }
      if (answer.output) { runner.output += answer.output; $(outputId(backend)).append(document.createTextNode(answer.output)); }
      $(backend === 'interpreter' ? 'output-limit' : backend === 'fast' ? 'fast-limit' : 'llvm-output-limit').hidden = !answer.outputTruncated;
      if (answer.status === 'executing') return;
      runner.result = { ...answer, output: runner.output };
      setPhase(backend,answer.status === 'error' ? 'Failed' : '');
      if (answer.status === 'error') {
        if (backend === 'fast' && !runner.formatted) { outputPanes.get('fast-disassembly').clearDownload(); showCode('fast-disassembly',''); }
        if (backend === selectedBackends()[0] && !runner.formatted) showCode('core-instructions','');
        if (backend === 'llvm' && !data.llvm && !runner.compiled) { clearWasm(); renderLLVM(); }
        reportProblem(errorId(backend),answer.error);
        if (!executionError) { executionError = answer; executionDiagnostic(answer); }
      }
      finish();
    };
    worker.postMessage({compiler:compilerSelection(), library:project.library ?? '.tower',  id, source: text, foundation, bedrock, backend, files:editingModule ? undefined : projectSources(project), drive:project.files, builtins:project.builtins, entry:editingModule ? activePath : projectSources(project)[0]?.path, pointerBytes:selectedTargets.wasm || !selectedNativeKeys().length ? 4 : 8, inputs:linkInputsForTarget(linkInputs,'wasm') ,optimize:$('optimize').checked,comments:$('preserve-comments').checked});
  }
  if(buildKeys().length) compileNative(id,text);
  updateComparison();
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
  cancelState();
  $('auto-execute').disabled = !editor;
  $('execute').disabled = !editor || isExecuting();
  for (const id of ['open', 'save', 'new-project', 'new-file', 'project-kind']) $(id).disabled = !editor;
  $('restore').disabled = !editor || !editingModule && !(project.compilerProject ? compilerSources : bundledExamples).has(activePath);
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
  diagnosticDelay.reset(documentRevision);
  diagnosticPhase = null;
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
    const row = node('div', 'rule'); row.append(node('strong', '', rule.name + (rule.pending ? ' (pending)' : '')), node('code', '', rule.definition)); $('rules').append(row);
  }
  if (!snapshot?.rules.length) $('rules').append(node('p', 'empty', 'Only the bootstrap declaration grammar is installed.'));
  $('token-rules').replaceChildren(node('p', 'eyebrow', 'TOKEN RULES'));
  for (const token of snapshot?.tokens ?? []) {
    const row = node('div', 'rule');
    row.append(node('strong', '', `${token.skip ? 'skip' : 'token'} ${token.name}`),
      node('code', '', `/${token.pattern}/${token.contextual ? ' when expected' : ''}${token.kind ? ' as ' + token.kind : ''}`));
    $('token-rules').append(row);
  }
}
function render() {
  const snapshot = result.snapshot;
  const decorations = towerDecorations(editor.state.doc.toString(), snapshot.highlights);
  const error = result.end?.status === 'error' ? result.end : executionError;
  const awaitingExecution = diagnosticPhase === 'execution' && result.end?.status === 'done' && $('auto-execute').checked &&
    (executedRevision !== documentRevision || isExecuting()) &&
    result.events.some(event => event.status === 'statement' && event.nodes.some(item => item.production !== null && item.label.startsWith('Core')));
  editor.dispatch({effects:paint.of(decorations)});
  if (!awaitingExecution) reportProblem('editor', error ? {error,phase:result.end?.status === 'error' ? 'parse' : 'execution'} : null);
  renderTree(); renderGrammar(snapshot);
  const prefix = result.end?.status === 'error' ? 'Stopped' : result.end?.status === 'done' ? 'Complete' : 'Paused';
  $('status').textContent = `${prefix} · ${snapshot.revision} grammar revisions · ${result.ms.toFixed(1)} ms`;
  $('runtime').classList.add('ready'); $('runtime-text').textContent = 'WASM ready';
}
async function perform(method) {
  // One request in flight, one latest pending request. Completed requests keep
  // the warm worker; newer edits coalesce while obsolete replies are discarded.
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
    project.dependencies = answer.dependencies ?? []; renderFiles();
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
function captureDocument() {
  if (!project || !editor || !activePath) return;
  const text = editor.state.doc.toString();
  if (editingModule) project.builtins[editingModule] = text;
  else project.files.find(file => file.path === activePath).text = text;
  foundation = project.builtins.foundation; bedrock = project.builtins.bedrock;
  project.active = activePath; project.links = linkInputs;
}
async function persist() {
  captureDocument();
  if (!project) return;
  const sequence = ++saveSequence;
  $('project-storage').textContent = 'Saving...';
  try {
    if (!storage) throw new Error('Browser storage unavailable');
    await storage.save(project);
    if (sequence === saveSequence) $('project-storage').textContent = 'Saved in browser';
  } catch (error) {
    if (sequence === saveSequence) $('project-storage').textContent = 'Not saved: ' + error.message + '. Use Save to download.';
  }
}
window.addEventListener('pagehide', () => { if (editor) persist(); stopExecution(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && editor) persist(); });
function changed(deferDiagnostics = editor.hasFocus) {
  ++saveSequence; // an older write must not mark these newer edits as saved
  typingDeadline = performance.now() + typingDebounceMs;
  cancelAnimationFrame(frame); frame=0;
  ++documentRevision;
  if (deferDiagnostics) diagnosticDelay.edit(documentRevision);
  else diagnosticDelay.reset(documentRevision);
  const wasExecuting = isExecuting();
  stopExecution(wasExecuting ? 'Cancelled by edit' : 'Ready');
  executionError = null; captureDocument();
  ++generation;
  dirty = true; controls();
  $('node-info').textContent = 'Tree spans refer to UTF-8 source bytes.';
  $('status').textContent = 'Updating...';
  $('project-storage').textContent = 'Unsaved changes';
  persist();
  scheduleCompilerBuild();
  schedule();
}
function replaceSource(text) {
  editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: text } });
  typingDeadline = 0; schedule();
}
function renderFiles() {
  $('project-kind').replaceChildren(...projects.map(p => new Option(p.name, p.id)));
  $('project-kind').value = project.id;
  const tree = $('file-tree');
  const opened = new Map([...tree.querySelectorAll('details')].map(el => [el.dataset.path, el.open]));
  tree.replaceChildren();
  const add = (parent, path, label, builtin = false) => {
    const button = node('button', 'file-entry', label); button.dataset.path = path;
    button.setAttribute('aria-current', String(path === activePath)); button.title = path;
    if (builtin) button.append(node('span', 'builtin-badge', 'library'));
    button.onclick = () => selectFile(path); parent.append(button);
  };
  for (const path of project.dependencies ?? []) {
    const name = path.startsWith('.tower/') ? path.slice(7, -6) : '';
    if (Object.hasOwn(project.builtins, name)) add(tree, path, name + '.tower', true);
  }
  const root = node('div', 'project-files'); tree.append(root);
  root.append(node('div', 'project-root', project.name));
  const folders = new Map([['', root]]);
  for (const file of project.files) {
    const parts = file.path.split('/'); let parent = root, path = '';
    for (const part of parts.slice(0,-1)) {
      path = path ? path + '/' + part : part;
      if (!folders.has(path)) {
        const folder = node('details', 'file-folder'); folder.dataset.path = path; folder.open = opened.get(path) ?? (!project.compilerProject || activePath.startsWith(path + '/'));
        folder.append(node('summary', '', part)); parent.append(folder); folders.set(path, folder);
      }
      parent = folders.get(path);
    }
    add(parent, file.path, parts.at(-1));
  }
  for (const id of ['rename-file','delete-file','move-file-up']) $(id).disabled = !!editingModule;
  $('delete-file').disabled ||= project.files.length === 1;
  $('move-file-up').disabled ||= project.files[0].path === activePath;
  $('restore').disabled = !editingModule && !(project.compilerProject ? compilerSources : bundledExamples).has(activePath);
  $('compiler-controls').hidden = !project.compilerProject;
  $('execute').textContent = project.compilerProject ? 'Rebuild compiler' : 'Execute';
}
function selectFile(path, fresh = false) {
  if (!fresh && path === activePath) return;
  if (!fresh && editor) { persist(); fileStates.set(activePath, editor.state); }
  activePath = project.active = path;
  editingModule = path.startsWith('.tower/') ? path.slice(7, -6) : '';
  foundation = project.builtins.foundation; bedrock = project.builtins.bedrock;
  const text = editingModule ? project.builtins[editingModule] : project.files.find(f => f.path === path).text;
  $('filename').textContent = editingModule ? editingModule + '.tower' : path;
  editor.setState(fileStates.get(path) ?? EditorState.create({doc:text, extensions:editorExtensions}));
  showPosition(editor.state);
  stopExecution(); clearCompiled(); clearInspection(); renderFiles(); changed(false); typingDeadline = 0; schedule();
}
function showPosition(state) {
  const location=documentLocation(state.doc,state.selection.main.head,activePath);
  $('position').textContent=sourceLocation(location.file,location.line,location.column);
}
function selectProject(id) {
  const next = projects.find(p => p.id === id); if (!next || next === project) return;
  if (project) persist();
  ++documentLoadId; ++generation;
  if (engine.pending) engine.stop();
  stopExecution(); fileStates.clear();
  cancelCompilerBuild();
  project = next; linkInputs = project.links; activePath = '';
  try { localStorage.setItem('tower-project-selected-v1', id); } catch {}
  updateLinkFiles(); selectFile(project.active, true);
}
function projectAction(action) {
  try { action(); } catch (error) { showError(error.message); }
}
$('project-kind').onchange = () => selectProject($('project-kind').value);
$('new-project').onclick = () => projectAction(() => {
  const name = prompt('Project name', 'Untitled'); if (!name?.trim()) return;
  const next = newProject(name.trim(), {...bundledBuiltins});
  projects.push(next); selectProject(next.id);
});
$('new-file').onclick = () => projectAction(() => {
  const path = prompt('File path (folders use /)', 'src/main.tower'); if (!path) return;
  filePath(path); validateProject({...project, files:[...project.files, {path, text:''}]});
  project.files.push({path, text:''}); selectFile(path);
});
$('rename-file').onclick = () => projectAction(() => {
  const path = prompt('File path', activePath); if (!path || path === activePath) return;
  filePath(path); captureDocument();
  validateProject({...project, files:project.files.map(f => f.path === activePath ? {...f, path} : f)});
  project.files.find(f => f.path === activePath).path = path;
  fileStates.set(path, editor.state); fileStates.delete(activePath); selectFile(path, true);
});
$('delete-file').onclick = () => {
  if (!confirm('Delete ' + activePath + ' from this project?')) return;
  project.files = project.files.filter(f => f.path !== activePath); fileStates.delete(activePath);
  selectFile(project.files[0].path, true);
};
$('move-file-up').onclick = () => {
  const index = project.files.findIndex(f => f.path === activePath);
  if (index > 0) { [project.files[index-1], project.files[index]] = [project.files[index], project.files[index-1]]; renderFiles(); changed(); }
};

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
$('rebuild-compiler').onclick = rebuildCompiler;
$('cancel-compiler-build').onclick = () => cancelCompilerBuild('Compiler build cancelled');
$('auto-rebuild-compiler').onchange = () => {
  if (!$('auto-rebuild-compiler').checked) cancelCompilerBuild('Auto rebuild off');
  else { compilerBuildSnapshot = ''; scheduleCompilerBuild(); }
};
$('reset-compiler').onclick = () => {
  cancelCompilerBuild(); compilerGeneration = 0; selectCompiler();
  $('compiler-build-status').textContent = 'Original compiler restored · source edits retained';
};
onCompilerSelection(selection => {
  engine.stop(); stopExecution();
  for (const worker of idleExecutionWorkers.values()) worker.terminate();
  idleExecutionWorkers.clear();
  $('active-compiler').textContent = selection.tower ? 'Compiler generation '+compilerGeneration : 'Original compiler';
  $('reset-compiler').disabled = !selection.tower;
  ++generation; dirty = true; executedRevision = -1; clearCompiled(); clearInspection(); controls(); schedule();
});
$('tokens').onchange = () => renderTree();
$('execute').onclick = () => { diagnosticDelay.reveal(); execute(); };
$('cancel-execution').onclick = () => {
  executedRevision = documentRevision;
  if (busy) {
    ++generation; queued = null;
    engine.stop('Cancelled'); dirty = true;
    $('status').textContent = 'Parsing cancelled';
  }
  stopExecution('Cancelled');
};
for(const [key,target] of Object.entries(targetChoices)) {
  const label=node('label'), input=node('input'), caption=node('span','',target.label);
  caption.id='target-label-'+key;
  input.type='checkbox'; input.id='target-'+key; input.checked=!!selectedTargets[key];
  if(target.description) caption.append(node('small','',target.description));
  else if(key!=='wasm') caption.append(node('small','',target.triple));
  else caption.append(node('small','','32-bit · browser module'));
  label.append(input,caption); $('target-options').append(label);
  input.onchange=()=>{
    targetsChanged=true;
    selectedTargets[key]=input.checked;
    if (!selectedTargets[key]) {
      const backend = key === 'wasm' ? 'llvm' : nativeTargetKeys.includes(key) ? 'native' : key;
      if (backend!=='native' || !selectedNativeKeys().length) {
        idleExecutionWorkers.get(backend)?.terminate(); idleExecutionWorkers.delete(backend);
      }
    }
    try {localStorage.setItem(targetSelectionKey,JSON.stringify(selectedTargets));}catch{}
    stopExecution('Targets changed'); clearCompiled(); updateColumns(); executedRevision=-1; warmSelectedTargets(); scheduleAutoExecution();
  };
}
updateColumns();
document.addEventListener('click',event=>{if(!$('build-targets').contains(event.target))$('build-targets').open=false;});
$('build-targets').addEventListener('keydown',event=>{if(event.key==='Escape')$('build-targets').open=false;});
function fitTargetMenu() {
  if (!$('build-targets').open) return;
  const menu=$('build-targets').querySelector('.target-menu');
  // The menu opens above its positioned parent (the heading on mobile).
  // Keep its first options reachable even after scrolling to the last option.
  const available=menu.offsetParent.getBoundingClientRect().top-12;
  menu.style.maxHeight=`min(60vh, ${Math.max(0,available)}px)`;
}
$('build-targets').addEventListener('toggle',fitTargetMenu);
window.addEventListener('resize',fitTargetMenu);
const targetMenuLayout=new ResizeObserver(fitTargetMenu);
targetMenuLayout.observe(document.querySelector('.workspace'));
targetMenuLayout.observe(document.querySelector('.execution-heading'));
try { $('optimize').checked = localStorage.getItem('tower-optimize-v1') !== 'false'; } catch {}
$('optimize').onchange = () => {
  try { localStorage.setItem('tower-optimize-v1',String($('optimize').checked)); } catch {}
  stopExecution('Optimization changed'); clearCompiled(); executedRevision=-1; scheduleAutoExecution();
};
try { $('preserve-comments').checked = localStorage.getItem('tower-comments-v1') !== 'false'; } catch {}
$('preserve-comments').onchange = () => {
  try { localStorage.setItem('tower-comments-v1',String($('preserve-comments').checked)); } catch {}
  stopExecution('Comments changed'); clearCompiled(); executedRevision=-1; scheduleAutoExecution();
};
$('link-files').onclick = () => $('link-input').click();
function updateLinkFiles() {
  if (project) { project.links = linkInputs; persist(); }
  const names = Object.keys(linkInputs);
  $('link-files').textContent = names.length ? `Link files (${names.length})` : 'Link files';
  $('link-files').title = names.length ? names.join('\n') : 'Add object files or static libraries';
  $('clear-link-files').hidden = !names.length;
  stopExecution('Link inputs changed'); clearCompiled(); executedRevision=-1; scheduleAutoExecution();
}
$('link-input').onchange = async () => {
  const owner = project;
  try {
    const additions = {};
    for (const file of $('link-input').files) {
      if (file.size > 64 * 1024 * 1024 || !/^[a-zA-Z0-9._-]{1,128}$/.test(file.name) || file.name.startsWith('tower-')) throw new Error('Link inputs need a simple filename and must be at most 64 MiB: ' + file.name);
      additions[file.name] = new Uint8Array(await file.arrayBuffer());
    }
    if (Object.keys({ ...linkInputs, ...additions }).length > 60) throw new Error('At most 60 link inputs');
    if (owner !== project) return;
    Object.assign(linkInputs, additions); updateLinkFiles();
  } catch (error) { $('build-status').textContent = error.message; }
  finally { $('link-input').value = ''; }
};
$('clear-link-files').onclick = () => { linkInputs = {}; updateLinkFiles(); };
$('auto-execute').onchange = () => {
  try { localStorage.setItem('tower-auto-execute-v1', String($('auto-execute').checked)); } catch {}
  if ($('auto-execute').checked) {
    executedRevision = -1;
    if (!dirty && !result?.end) perform('analyze');
    else scheduleAutoExecution();
  } else stopExecution('Auto off');
};
$('restore').onclick = () => replaceSource(editingModule ? bundledBuiltins[editingModule] : (project.compilerProject ? compilerSources : bundledExamples).get(activePath));
$('open').onclick = () => $('file').click();
$('file').onchange = async () => {
  const file = $('file').files[0]; if (!file) return;
  const ticket = ++documentLoadId;
  try {
    const next = await importProject(file);
    if (ticket !== documentLoadId) return;
    projects.push(next); selectProject(next.id);
  } catch (error) { showError(error.message); }
  $('file').value = '';
};
$('save').onclick = () => projectAction(() => {
  persist();
  const url = URL.createObjectURL(exportProject(project));
  const link = node('a'); link.href = url; link.download = project.name.replace(/[^a-zA-Z0-9._-]/g, '_') + '.zip'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('editor-error').onclick = () => goToDiagnostic(editor);



async function start() {
  const detection = await browserTarget;
  if (detection.strongMatch) $('target-label-'+detection.key).firstChild.appendData(' (detected)');
  if (!savedSelection && !targetsChanged) {
    selectedTargets=defaultTargetSelection(detection);
    for (const key of Object.keys(targetChoices)) $('target-'+key).checked=selectedTargets[key];
    updateColumns();
  }
  const builtinNames = await fetch('./builtins.json').then(response => response.json());
  const names = [...builtinNames,...examples];
  const texts = await Promise.all(names.map(async name => {
    const response = await fetch('./' + name + '.tower');
    if (!response.ok) throw new Error('Unable to load ' + name);
    return response.text();
  }));
  bundledBuiltins = Object.fromEntries(builtinNames.map((name, i) => [name, texts[i]]));
  bundledBedrock = bundledBuiltins.bedrock; bundledFoundation = bundledBuiltins.foundation; bundledTower = bundledBuiltins.tower;
  for (const [i, name] of examples.entries()) bundledExamples.set(name + '.tower', texts[i+builtinNames.length]);
  try { storage = await projectStore(); projects = (await storage.list()).map(validateProject); }
  catch (error) { $('project-storage').textContent = 'Browser storage unavailable: ' + error.message; }
  const builtins = {...bundledBuiltins};
  for (const name of examples) if (!projects.some(p => p.id === 'example:' + name)) {
    const initial = newProject(name === 'foreach' ? 'ForEach' : name[0].toUpperCase() + name.slice(1), builtins, [{path:name + '.tower', text:bundledExamples.get(name + '.tower')}]);
    initial.id = 'example:' + name; projects.push(initial);
    if (storage) try { await storage.save(initial); }
    catch (error) { $('project-storage').textContent = 'Not saved: ' + error.message; }
  }
  const compilerResponse = await fetch('./compiler/project.json');
  if (compilerResponse.ok) {
    const recipe = await compilerResponse.json();
    for (const file of recipe.files) compilerSources.set(file.path,file.text);
    let compilerProject = projects.find(p => p.id === 'tower:compiler');
    if (!compilerProject) {
      compilerProject = newProject('Tower Compiler', builtins, recipe.files);
      Object.assign(compilerProject,{id:'tower:compiler',compilerProject:true,library:'.'});
      projects.push(compilerProject);
    } else {
      refreshCompilerSources(compilerProject, recipe);
    }
    compilerProject.sourceBaseline = Object.fromEntries(compilerSources);
    compilerBuildSnapshot = JSON.stringify(compilerProject.files);
    if (storage) try { await storage.save(compilerProject); }
    catch (error) { $('project-storage').textContent = 'Not saved: '+error.message; }
  }
  // One-time migration leaves localStorage documents intact as backup.
  try {
    if (!localStorage.getItem('tower-project-migrated-v1')) {
      const old = JSON.parse(localStorage.getItem('tower-playground-document-v1') || 'null');
      const text = old?.source ?? localStorage.getItem('tower-playground-source-v1');
      const savedBedrock = await selectFoundation(bundledBedrock, localStorage.getItem('tower-playground-bedrock-v1'), localStorage.getItem('tower-playground-bedrock-base-v1'));
      const savedFoundation = await selectFoundation(bundledFoundation, localStorage.getItem('tower-playground-foundation-v1'), localStorage.getItem('tower-playground-foundation-base-v1'), {bedrock:savedBedrock});
      if (text !== null || savedBedrock !== bundledBedrock || savedFoundation !== bundledFoundation) {
        const legacy = newProject('Recovered workspace', {bedrock:savedBedrock, foundation:savedFoundation}, [{path:old?.filename || [...bundledExamples].find(([,source]) => source === text)?.[0] || 'scratch.tower', text:text ?? bundledExamples.get('foreach.tower')}]);
        if (['bedrock','foundation'].includes(old?.module)) legacy.active = '.tower/' + old.module + '.tower';
        legacy.baseline = builtins;
        if (storage) { await storage.save(legacy); localStorage.setItem('tower-project-migrated-v1','true'); }
        projects.push(legacy); localStorage.setItem('tower-project-selected-v1',legacy.id);
      } else if (storage) localStorage.setItem('tower-project-migrated-v1','true');
    }
  } catch (error) { $('project-storage').textContent = 'Previous workspace could not migrate: ' + error.message; }
  for (const p of projects) {
    // Remove the retired bundled explanation from saved copies too, retaining
    // every other edit to the example.
    const example = p.files.find(file => file.path === 'foreach.tower');
    if (example) {
      const updated = example.text.replace(/^\/\/ This feature is defined here, not in the C\+\+ parser\.(?:\r?\n|$)/gm, '');
      if (updated !== example.text) {
        example.text = updated;
        if (storage) try { await storage.save(p); }
        catch (error) { $('project-storage').textContent = 'Not saved: ' + error.message; }
      }
    }
    p.builtins.bedrock = await selectFoundation(bundledBedrock, p.builtins.bedrock, p.baseline?.bedrock ?? null);
    p.builtins.foundation = await selectFoundation(bundledFoundation, p.builtins.foundation, p.baseline?.foundation ?? null, {bedrock:p.builtins.bedrock});
    p.builtins.tower = await selectFoundation(bundledTower, p.builtins.tower ?? null, p.baseline?.tower ?? null);
    for (const [name, text] of Object.entries(builtins)) p.builtins[name] = await selectFoundation(text, p.builtins[name] ?? null, p.baseline?.[name] ?? null);
    p.baseline = {...builtins};
  }
  editorExtensions = [
    towerCompletion(() => ({library:project.library ?? '.tower', foundation, bedrock, editingModule, files:project.files, builtins:project.builtins, activePath,
      pointerBytes:selectedTargets.wasm || !selectedNativeKeys().length ? 4 : 8})),
    lineNumbers(), highlightActiveLineGutter(), highlightActiveLine(), history(), highlighting, selectionMark, editorDiagnostics,
    EditorView.lineWrapping, EditorView.theme({ '&': { color: '#d4e0e2', backgroundColor: '#121a1e' } }, { dark: true }),
    EditorView.contentAttributes.of({ 'aria-label': 'Tower source', spellcheck: 'false', autocapitalize: 'off', autocorrect: 'off' }),
    keymap.of([{ key: 'Mod-Enter', run: () => { diagnosticDelay.reveal(); perform('analyze'); return true; } }, ...defaultKeymap, ...historyKeymap, indentWithTab]),
    EditorView.domEventHandlers({blur: () => { queueMicrotask(() => diagnosticDelay.reveal()); }}),
    EditorView.updateListener.of(update => {
      if (update.docChanged) changed();
      else if (update.selectionSet && !update.startState.selection.eq(update.state.selection) && !update.view.composing)
        queueMicrotask(() => diagnosticDelay.reveal());
      if (update.selectionSet || update.docChanged) {
        showPosition(update.state);
      }
    }),
  ];
  editor = new EditorView({ parent: $('editor'), state: EditorState.create({ doc: '', extensions: editorExtensions }) });
  let selected; try { selected = localStorage.getItem('tower-project-selected-v1'); } catch {}
  selectProject(projects.find(p => p.id === selected)?.id ?? 'example:foreach');
  clearCompiled(); clearInspection(); showTab('tree'); controls();
  warmSelectedTargets();
  await perform('analyze');
}
controls();
start().catch(error => { showError(error.message); $('status').textContent = 'Could not start. Serve the dist folder over HTTP and reload.'; });
