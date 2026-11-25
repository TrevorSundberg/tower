import { loadTower } from './tower-host.mjs';
import { loadLLVM, executeWasm } from './llvm-host.mjs';
import { fetchBytes } from './fetch-bytes.mjs';

// Worker-local compiler state survives completed programs. Each compile still
// creates a new execution handle; canceling active work terminates its worker.
let towerReady, installedFoundation, installedBedrock;
const compilers = new Map();
const warmRuns = new Map();
let canonicalSources;
let bundledTower;
let selected = {revision:0};
export function useCompiler(selection = {revision:0}) {
  if (selected.revision === selection.revision) return false;
  towerReady?.then(tower => tower.close(), () => {});
  for (const pending of compilers.values()) pending.then(compiler => compiler.close?.(), () => {});
  selected = selection;
  towerReady = undefined; installedFoundation = installedBedrock = undefined;
  compilers.clear(); warmRuns.clear();
  return true;
}
async function bundledTowerBytes() {
  bundledTower ??= (async () => {
    const shared = globalThis.crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined';
    if (shared) {
      const response = await fetch('./capabilities.json');
      if (response.ok && (await response.json()).threads) return fetchBytes('./tower-threads.wasm');
    }
    return fetchBytes('./tower.wasm');
  })();
  const pending = bundledTower;
  try { return await pending; }
  catch (error) { if (bundledTower === pending) bundledTower = undefined; throw error; }
}
export function getCanonicalSources() {
  canonicalSources ??= (async () => {
    const manifest = await fetch('./builtins.json');
    if (!manifest.ok) throw new Error('Builtin module manifest is unavailable');
    return Object.fromEntries(await Promise.all((await manifest.json()).map(async name => {
      const response = await fetch('./'+name+'.tower');
      if (!response.ok) throw new Error(name+'.tower is unavailable');
      return [name, await response.text()];
    })));
  })();
  return canonicalSources;
}
// Canonical packages use the bundled grammar, regardless of editor overrides.
// Existing execution handles retain their checked nodes across grammar changes.
export async function getCanonicalTower() {
  return getTower();
}
export async function getTower(foundation, bedrock, project) {
  const sources = project?.builtins ?? await getCanonicalSources();
  foundation ??= sources.foundation;
  bedrock ??= sources.bedrock;
  const builtins = {...sources, bedrock, foundation};
  const inputs = {entry:'input.tower', files:[], library:'.tower', ...project, builtins, replaceBuiltins:true};
  const start = performance.now();
  const cached = !!towerReady && installedFoundation === foundation && installedBedrock === bedrock;
  const cold = !towerReady;
  if (cold) {
    towerReady = Promise.resolve(selected.tower ?? bundledTowerBytes()).then(bytes =>
      loadTower(bytes, undefined, foundation, undefined, bedrock, {tower:builtins.tower, builtins, project:inputs}));
    installedFoundation = foundation; installedBedrock = bedrock;
  }
  const pending = towerReady;
  let tower;
  try { tower = await pending; }
  catch (error) { if (towerReady === pending) towerReady = undefined; throw error; }
  if (!cold) {
    // Preserve the first upload diagnostic and retry an interrupted upload.
    // Unchanged warm inputs need only the complete project replacement below.
    const grammar = {foundation, bedrock, tower:builtins.tower};
    if (project && !tower.hasAppliedBuiltins(grammar)) tower.configureModules({builtins:grammar});
    tower.configureModules(inputs);
    if (installedBedrock !== bedrock) {
      tower.configureBedrock(bedrock); installedBedrock = bedrock; installedFoundation = null;
    }
    if (installedFoundation !== foundation) { tower.configure(foundation); installedFoundation = foundation; }
  }
  return {tower, loadMs:performance.now() - start, cached};
}
export async function getCompiler(url) {
  const start = performance.now();
  const cached = compilers.has(url);
  if (!compilers.has(url)) compilers.set(url, (async () => {
    const [wasm, builtins] = await Promise.all([selected[url.includes('cross') ? 'cross' : 'llvm'] ?? fetchBytes(url), getCanonicalSources()]);
    return loadLLVM(wasm, undefined, builtins.foundation, undefined, builtins.bedrock, {tower:builtins.tower, builtins});
  })());
  const pending = compilers.get(url);
  try {
    const compiler = await pending;
    return {compiler, loadMs:performance.now() - start, cached};
  } catch (error) {
    if (compilers.get(url) === pending) compilers.delete(url);
    throw error;
  }
}

// Prime parsing, optimization, code generation and linking with fixed internal
// source, never the editor contents. Wasm also instantiates/runs one small module.
export function warmCompiler(url, options = {}) {
  const key = url + ':' + (options.target ?? 'wasm');
  if (!warmRuns.has(key)) {
    const pending = (async () => {
      const {compiler} = await getCompiler(url);
      const compiled = compiler.compile('import tower; var warm: i32 = 42; print(warm);', options);
      if (compiled.status === 'error') throw new Error(compiled.error);
      if (!options.target) {
        const result = await executeWasm(compiled);
        if (result.status !== 'done' || result.output !== '42\n') throw new Error('LLVM warm run failed');
      }
    })();
    warmRuns.set(key, pending);
    pending.catch(() => { if (warmRuns.get(key) === pending) warmRuns.delete(key); });
  }
  return warmRuns.get(key);
}
