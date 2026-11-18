import { loadTower } from './tower-host.mjs';
import { loadLLVM } from './llvm-host.mjs';
import { fetchBytes } from './fetch-bytes.mjs';

// Worker-local compiler state survives completed programs. Each compile still
// creates a new execution handle; canceling active work terminates its worker.
let towerReady, installedFoundation, installedBedrock;
const compilers = new Map();
export async function getTower(foundation, bedrock) {
  const start = performance.now();
  const cached = !!towerReady && installedFoundation === foundation && installedBedrock === bedrock;
  if (!towerReady) {
    towerReady = fetchBytes('./tower.wasm').then(bytes =>
      loadTower(bytes, undefined, foundation, undefined, bedrock));
    installedFoundation = foundation; installedBedrock = bedrock;
  }
  const tower = await towerReady;
  if (installedBedrock !== bedrock) {
    tower.configureBedrock(bedrock); installedBedrock = bedrock; installedFoundation = null;
  }
  if (installedFoundation !== foundation) { tower.configure(foundation); installedFoundation = foundation; }
  return {tower, loadMs:performance.now() - start, cached};
}
export async function getCompiler(url) {
  const start = performance.now();
  const cached = compilers.has(url);
  if (!compilers.has(url)) compilers.set(url, (async () => {
    const [wasm, canonical, seed] = await Promise.all([fetchBytes(url), fetch('./foundation.tower'), fetch('./bedrock.tower')]);
    if (!canonical.ok || !seed.ok) throw new Error('bedrock.tower or foundation.tower is unavailable');
    return loadLLVM(wasm, undefined, await canonical.text(), undefined, await seed.text());
  })());
  const compiler = await compilers.get(url);
  return {compiler, loadMs:performance.now() - start, cached};
}
