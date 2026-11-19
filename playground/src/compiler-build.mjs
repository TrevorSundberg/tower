import {loadLLVM, executeWasm} from './llvm-host.mjs';
import {loadTower, runToEnd} from './tower-host.mjs';

// The recipe lists separate platform object units; each unit is compiled from
// its Tower import closure. No JS import resolver or source concatenation.
// The running compiler is generation N; these files describe generation N+1.
// With library '.', `import tower;` reads the project's ordinary tower.tower,
// which imports foundation.tower and bedrock.tower, not generation N+1's binary.
export async function buildCompiler({compiler, recipe, files, support, progress = () => {}, onObject = () => {}}) {
  const inputs = {}, sources = new Map(files.map(file => [file.path, file.text]));
  const grammar = Object.fromEntries(['bedrock','foundation','tower'].map(name => [name,sources.get(name+'.tower')]));
  for (const unit of recipe.units) {
    if (!sources.has(unit.entry)) throw new Error('Missing compiler entry: '+unit.entry);
    progress('Compiling '+unit.entry);
    compiler.configureModules({entry:unit.entry, files, builtins:grammar, library:'.'});
    const result = compiler.compile(sources.get(unit.entry), {library:true, emit:'object'});
    if (result.status === 'error') throw new Error((result.errorFile || unit.entry)+': '+result.error);
    inputs[unit.object] = result.object;
    await onObject(unit, result.object);
    // Yield between synchronous compiler calls so progress is observable.
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  return linkCompiler({compiler, recipe, files, inputs, support, progress});
}

export async function linkCompiler({compiler, recipe, files, inputs, support, progress = () => {}}) {
  const grammar = Object.fromEntries(['bedrock','foundation','tower'].map(name => [name,files.find(file => file.path === name+'.tower')?.text]));
  const modules = {}, bytes = {};
  for (const [name, reactor] of Object.entries(recipe.reactors)) {
    progress('Linking '+name+'.wasm');
    const selected = Object.fromEntries(reactor.units.map(key => [key+'.o',inputs[key+'.o']]));
    for (const file of reactor.support) selected[file.slice(0,-3)] = await support(file);
    bytes[name] = compiler.linkReactor(selected, reactor.arguments);
    modules[name] = await WebAssembly.compile(bytes[name]);
    const exported = new Set(WebAssembly.Module.exports(modules[name]).map(item => item.name));
    for (const symbol of reactor.exports) if (!exported.has(symbol)) throw new Error(name+' reactor is missing export '+symbol);
  }
  progress('Checking new compiler');
  // Instantiate every candidate before publishing any of them. A failed build
  // leaves the previous generation active; reset never depends on candidate code.
  const tower = await loadTower(modules.tower, undefined, grammar.foundation, undefined, grammar.bedrock, {tower:grammar.tower});
  const fixture = 'import tower; import "answer"; print(answer());';
  const probeFiles = [{path:'probe.tower',text:fixture}, {path:'answer.tower',text:'import tower; fn answer(): i32 { return 42; }'}];
  tower.configureModules({entry:'probe.tower',files:probeFiles,builtins:grammar});
  const parse = tower.create(fixture);
  try { const {end} = runToEnd(tower,parse); if (end.status !== 'done') throw new Error('Candidate parser: '+end.error); }
  finally { tower.destroy(parse); }
  const handle = tower.compile(fixture);
  let foundation;
  try {
    foundation = tower.foundation(handle).source;
    for (const fast of [false,true]) {
      const run = fast ? tower.compile(fixture) : handle;
      try {
        if (fast) tower.useFast(run);
        let output = '', status;
        for (let i = 0; i < 100; ++i) {
          const result = tower.execute(run,10000); output += result.output; status = result.status;
          if (status !== 'executing') break;
        }
        if (status !== 'done' || output !== '42\n') throw new Error('Candidate interpreter failed the import check');
      } finally { if (fast) tower.destroyExecution(run); }
    }
  } finally { tower.destroyExecution(handle); }
  tower.configureModules({entry:'completion.tower',files:[],builtins:grammar});
  const partial = 'var value: i32 = 1; var valid: bool = true; fn check(flag: bool): void {} check(va';
  const completion = tower.complete(partial,new TextEncoder().encode(partial).length);
  if (completion.error || completion.options?.length !== 1 || completion.options[0].label !== 'valid')
    throw new Error('Candidate typed completion check failed');
  const llvm = await loadLLVM(modules.llvm, undefined, grammar.foundation, undefined, grammar.bedrock, {tower:grammar.tower});
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
    const optimized = tower.compile(lowered.foundation);
    try {
      tower.useFast(optimized);
      let output = '', status;
      for (let i = 0; i < 100; ++i) {
        const run = tower.execute(optimized,10000); output += run.output; status = run.status;
        if (status !== 'executing') break;
      }
      if (status !== 'done' || output !== '42\n') throw new Error('Candidate LLVM interpreter check failed');
      const restored = tower.loadBytecode(tower.bytecode(optimized,{optimizationProfile:lowered.optimizationProfile}));
      tower.destroyExecution(restored);
    } finally { tower.destroyExecution(optimized); }
  }
  const cross = await loadLLVM(modules.cross, undefined, grammar.foundation, undefined, grammar.bedrock, {tower:grammar.tower});
  const native = cross.compile(foundation,{emit:'object',target:'x86_64-unknown-linux-gnu'});
  if (native.status === 'error' || !native.object?.length) throw new Error('Candidate native target check failed: '+native.error);
  const hashes = Object.fromEntries(await Promise.all(Object.entries(bytes).map(async ([key,data]) =>
    [key, Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)), b => b.toString(16).padStart(2,'0')).join('')])));
  return {modules, hashes, sizes:Object.fromEntries(Object.entries(bytes).map(([key,data]) => [key,data.length]))};
}
