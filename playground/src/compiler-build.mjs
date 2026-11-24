import {loadLLVM, executeWasm} from './llvm-host.mjs';
import {loadTower, runToEnd} from './tower-host.mjs';
import {compilerPool} from './compiler-pool.mjs';

let nextRevision = 0n;

// The recipe lists separate platform object units; each unit is compiled from
// its Tower import closure. No JS import resolver or source concatenation.
// The running compiler is generation N; these files describe generation N+1.
// With library '.', `import tower;` reads the project's ordinary tower.tower,
// which imports foundation.tower and bedrock.tower, not generation N+1's binary.
export async function compileUnits({compiler, recipe, files, workers = 1, createWorker, signal, progress = () => {}, onObject = () => {}}) {
  if (!Number.isInteger(workers) || workers < 1 || workers > 8) throw new Error('Compiler workers must be between 1 and 8');
  files = files.map(({path,text}) => ({path,text}));
  recipe = {units:recipe.units.map(unit => ({...unit}))};
  const inputs = {}, sources = new Map(files.map(file => [file.path, file.text]));
  const grammar = Object.fromEntries(files.filter(file => /^(?:[^/]+|types\/[^/]+)\.tower$/.test(file.path)).map(file => [file.path.slice(0,-6),file.text]));
  for (const unit of recipe.units) if (!sources.has(unit.entry)) throw new Error('Missing compiler entry: '+unit.entry);
  if (new Set(recipe.units.map(unit => unit.object)).size !== recipe.units.length) throw new Error('Duplicate compiler object name');
  const revision = ++nextRevision, profile = 1n; // Current wasm32 optimized object recipe.
  const work = compiler.createWork(recipe.units.length,workers,revision,profile);
  const results = [], timings = [];
  let pool;
  const abort = () => work.cancel();
  signal?.addEventListener('abort',abort,{once:true});
  try {
    if (signal?.aborted) throw new Error('Compiler build cancelled');
    if (createWorker) pool = await compilerPool({count:workers,createWorker,module:compiler.module,files,grammar,revision,profile,signal});
    else if (workers !== 1) throw new Error('Parallel compilation requires a worker transport');
    await Promise.all(Array.from({length:workers},async (_,lane) => {
      for (;;) {
        const id = work.next();
        if (!id) return;
        const unit = recipe.units[id-1];
        progress('Compiling '+unit.entry+' ('+workers+' worker'+(workers===1?'':'s')+')');
        let result;
        if (pool) result = await pool.run(lane,id,unit.entry);
        else {
          compiler.configureModules({entry:unit.entry,files,builtins:grammar,library:'.'});
          const start = performance.timeOrigin + performance.now();
          const compiled = compiler.compile(sources.get(unit.entry),{library:true,emit:'object'});
          result = {object:compiled.object,start,end:performance.timeOrigin+performance.now(),
            error:compiled.status==='error' ? (compiled.errorFile || unit.entry)+': '+compiled.error : undefined};
          await new Promise(resolve => setTimeout(resolve,0));
        }
        if (!work.accept(id,!result.error)) throw new Error('Stale or cancelled compiler result');
        results[id-1] = result;
        timings[id-1] = {entry:unit.entry,lane,start:result.start,end:result.end};
        // Tower decides when the earliest diagnostic is final. Closing the
        // transport interrupts later units whose results cannot affect it.
        if (work.done() && work.failed()) throw new Error(results[work.failed()-1].error);
      }
    }));
    if (!work.done()) throw new Error('Compiler work did not complete');
    const failed = work.failed();
    if (failed) throw new Error(results[failed-1].error);
    for (let i = 0; i < recipe.units.length; ++i) {
      if (signal?.aborted) throw new Error('Compiler build cancelled');
      const unit = recipe.units[i];
      inputs[unit.object] = results[i].object;
      await onObject(unit,results[i].object);
    }
    return {inputs,stats:{workers,peak:work.peak(),timings}};
  } finally {
    signal?.removeEventListener('abort',abort);
    work.cancel();
    try { await pool?.close(); } finally { work.close(); }
  }
}

export async function buildCompiler(options) {
  options = {...options,files:structuredClone(options.files),recipe:structuredClone(options.recipe)};
  const {inputs,stats} = await compileUnits(options);
  if (options.signal?.aborted) throw new Error('Compiler build cancelled');
  const result = await linkCompiler({...options,inputs});
  return {...result,stats};
}

export async function linkCompiler({compiler, recipe, files, inputs, support, progress = () => {}, onReactor = () => {}}) {
  const grammar = Object.fromEntries(files.filter(file => /^(?:[^/]+|types\/[^/]+)\.tower$/.test(file.path)).map(file => [file.path.slice(0,-6),file.text]));
  const modules = {}, bytes = {};
  for (const [name, reactor] of Object.entries(recipe.reactors)) {
    progress('Linking '+name+'.wasm');
    const selected = Object.fromEntries(reactor.units.map(key => [key+'.o',inputs[key+'.o']]));
    for (const file of reactor.support) selected[file.slice(0,-3)] = await support(file);
    bytes[name] = compiler.linkReactor(selected, reactor.arguments);
    await onReactor(name, bytes[name]); // Optional retained candidate evidence, before validation/publication.
    modules[name] = await WebAssembly.compile(bytes[name]);
    const exported = new Set(WebAssembly.Module.exports(modules[name]).map(item => item.name));
    for (const symbol of reactor.exports) if (!exported.has(symbol)) throw new Error(name+' reactor is missing export '+symbol);
  }
  progress('Checking new compiler');
  // Instantiate every candidate before publishing any of them. A failed build
  // leaves the previous generation active; reset never depends on candidate code.
  const tower = await loadTower(modules.tower, undefined, grammar.foundation, undefined, grammar.bedrock, {tower:grammar.tower,builtins:grammar});
  const fixture = '// candidate C metadata\nimport tower; import helpers.answer as left; import other.answer as right; import helpers.answer as again; var total = left.answer() + right.answer(); print(total);';
  const probeFiles = [{path:'probe.tower',text:fixture},
    {path:'helpers/answer.tower',text:'import tower; fn answer(): i32 { return hidden(); } fn hidden(): i32 { return 20; }'},
    {path:'other/answer.tower',text:'import tower; fn answer(): i32 { return hidden(); } fn hidden(): i32 { return 22; }'}];
  tower.configureModules({entry:'probe.tower',files:probeFiles,builtins:grammar});
  const parse = tower.create(fixture);
  try { const {end} = runToEnd(tower,parse); if (end.status !== 'done') throw new Error('Candidate parser: '+end.error); }
  finally { tower.destroy(parse); }
  const handle = tower.compile(fixture);
  let foundation;
  try {
    foundation = tower.foundation(handle).source;
    tower.checkCandidate(handle,{roku:true});
    const fast = tower.compile(fixture);
    try { tower.checkCandidate(fast,{fast:true}); }
    finally { tower.destroyExecution(fast); }
  } finally { tower.destroyExecution(handle); }
  const qualified = 'import tower; import helpers.answer as left; left.an';
  const members = tower.complete(qualified,new TextEncoder().encode(qualified).length);
  if (members.error || members.options?.length !== 1 || members.options[0].label !== 'answer')
    throw new Error('Candidate module completion check failed');
  const hidden = tower.compile('import tower; import helpers.answer as left; print(answer());');
  try {
    if (!/Unknown function/.test(tower.execute(hidden,0).error ?? ''))
      throw new Error('Candidate module visibility check failed');
  } finally { tower.destroyExecution(hidden); }
  tower.configureModules({entry:'completion.tower',files:[],builtins:grammar});
  const partial = 'import foundation; var value: i32 = 1; var valid: bool = true; fn check(flag: bool): void {} check(va';
  const completion = tower.complete(partial,new TextEncoder().encode(partial).length);
  if (completion.error || completion.options?.length !== 1 || completion.options[0].label !== 'valid')
    throw new Error('Candidate typed completion check failed');
  const hoverSource = 'import foundation;\n// Documented value.\nvar value: i32 = 42; print(value);';
  const inspected = tower.inspectDocument(hoverSource);
  if (!inspected.entries.some(entry => entry.type === 'i32' && entry.documentation === 'Documented value.'))
    throw new Error('Candidate attached hover documentation check failed');
  if (!inspected.entries?.some(entry => entry.from === hoverSource.lastIndexOf('value') && entry.signature === 'var value: i32' && entry.type === 'i32' && entry.binding))
    throw new Error('Candidate typed hover check failed');
  const grammarHover = tower.inspectDocument("import foundation; fn identity(p:i32*):i32 { return *p; } parse CoreCall |= 'read' $target:CoreLocation => replace { identity(&$target) }; var value:i32=42; print(read value);");
  if (!grammarHover.entries?.some(entry => entry.kind === 'capture substitution' && entry.category === 'CoreLocation') ||
      !grammarHover.entries.some(entry => entry.kind === 'address of') ||
      !grammarHover.entries.some(entry => entry.replacementCategory === 'CoreCall' && entry.signature === 'fn identity(p: i32*): i32'))
    throw new Error('Candidate grammar tree hover check failed');
  const syntaxSource="import foundation; parse Variable = Identifier; parse Expression = Identifier | Number; parse Statement = Expression ';'; parse ForEach = 'for' '(' $Variable 'in' $Expression ')' '{' $Statement* '}'; parse Statement |= ForEach; for (item in items) { item; }";
  const syntaxHover=tower.inspectDocument(syntaxSource),loop=syntaxSource.indexOf('for (item');
  if (!syntaxHover.entries?.some(entry=>entry.from===loop && entry.matchedRule==='ForEach') ||
      !syntaxHover.entries.some(entry=>entry.from>loop && entry.capture==='Variable' && entry.capturedBy==='ForEach') ||
      !syntaxHover.entries.some(entry=>entry.module==='foundation' && entry.category===undefined))
    throw new Error('Candidate custom syntax hover check failed');
  const enumHover = tower.inspectDocument('import tower; enum State:u32 { Idle = 0, Busy = 4 } var state:State = State.Busy;');
  if (!enumHover.entries?.some(entry => entry.signature === 'State.Busy' && entry.type === 'State'))
    throw new Error('Candidate enum hover check failed');
  const llvm = await loadLLVM(modules.llvm, undefined, grammar.foundation, undefined, grammar.bedrock, {tower:grammar.tower,builtins:grammar});
  const result = llvm.compile(foundation);
  if (result.status === 'error') throw new Error('Candidate LLVM: '+result.error);
  const executed = await executeWasm(result);
  if (executed.status !== 'done' || executed.output !== '42\n') throw new Error('Candidate LLVM execution check failed');
  // The fast runner also consumes Foundation reconstructed through LLVM. Check
  // both profiles so a successor cannot silently drop that shared-node path.
  tower.configureModules({entry:'optimized.tower',files:[],builtins:grammar});
  for (const optimize of [true,false]) {
    const lowered = llvm.compile(foundation,{emit:'foundation',optimize});
    if (lowered.status === 'error') throw new Error('Candidate LLVM Foundation: '+lowered.error);
    const prepared = tower.prepareFoundationPackage(lowered.foundation,{optimizationProfile:lowered.optimizationProfile});
    const optimized = prepared.handle;
    try {
      tower.checkCandidate(optimized,{fast:true});
    } finally { tower.destroyExecution(optimized); }
    const restored = tower.loadBytecode(prepared.bytecode);
    try { tower.checkCandidate(restored,{fast:true}); }
    finally { tower.destroyExecution(restored); }
  }
  const cross = await loadLLVM(modules.cross, undefined, grammar.foundation, undefined, grammar.bedrock, {tower:grammar.tower,builtins:grammar});
  const native = cross.compile(foundation,{emit:'object',target:'x86_64-unknown-linux-gnu'});
  if (native.status === 'error' || !native.object?.length) throw new Error('Candidate native target check failed: '+native.error);
  const hashes = Object.fromEntries(await Promise.all(Object.entries(bytes).map(async ([key,data]) =>
    [key, Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)), b => b.toString(16).padStart(2,'0')).join('')])));
  return {modules, hashes, sizes:Object.fromEntries(Object.entries(bytes).map(([key,data]) => [key,data.length]))};
}
