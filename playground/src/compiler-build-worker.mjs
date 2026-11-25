import {getCompiler, useCompiler} from './compiler-runtime.mjs';
import {fetchBytes} from './fetch-bytes.mjs';
import {buildCompiler, linkCompiler} from './compiler-build.mjs';
import {compilerUnitMessages, objectHost} from './compiler-unit.mjs';
// A single transferred object set. The page owns it only between Builds.
const maxObjectBytes = 4 * 1024 * 1024;
const maxObjectCount = 64;
const unitMessages = compilerUnitMessages((data,transfer) => postMessage(data,transfer ?? []));
self.onmessage = async ({data}) => {
  if (data.type === 'prepare' || data.type === 'compile') { await unitMessages(data); return; }
  const {id,compiler,files,stockLLVM} = data;
  try {
    useCompiler(compiler);
    const recipe = await fetch('./compiler/project.json').then(response => {
      if (!response.ok) throw new Error('Compiler build recipe is unavailable');
      return response.json();
    });
    const loaded = await getCompiler('./tower-llvm.wasm.gz');
    const packaged = files.length === recipe.files.length && files.every(({path,text},i) =>
      path === recipe.files[i].path && text === recipe.files[i].text);
    // stockLLVM is the hash of the selected module, established by linking the
    // packaged sources with the bundled compiler. Never trust edited generators
    // to report their own inputs. An unbundled host has no executable stamp.
    const reusable = objectHost && packaged && compiler.llvm && stockLLVM &&
      recipe.units.length <= maxObjectCount;
    let key;
    if (reusable) {
      const bytes = new TextEncoder().encode(JSON.stringify([objectHost,stockLLVM,recipe]));
      const digest = await crypto.subtle.digest('SHA-256',bytes);
      key = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2,'0')).join('');
    }
    const options = {compiler:loaded.compiler, recipe, files,
      workers:Math.min(2,navigator.hardwareConcurrency || 1),
      createWorker:() => new Worker(new URL('./compiler-build-worker.js',import.meta.url),{type:'module'}),
      support:name => fetchBytes('./compiler/'+name), progress:phase => postMessage({id,phase})};
    let objects = [], totalBytes = 0, result;
    if (key && data.retained?.key === key) {
      objects = data.retained.objects;
      const inputs = Object.fromEntries(recipe.units.map(({object},i) => [object,objects[i]]));
      result = await linkCompiler({...options,inputs});
      result.stats = {workers:0,peak:0,timings:[],objectHits:objects.length};
    } else {
      data.retained = undefined;
      result = await buildCompiler({...options,onObject(_unit,bytes,host) {
        if (!key) return;
        totalBytes += bytes.buffer.byteLength;
        if (host !== objectHost || totalBytes > maxObjectBytes) {
          key = undefined;
          objects = [];
        } else objects.push(bytes);
      }});
    }
    const packagedGeneratorHash = packaged && !compiler.llvm ? result.hashes.llvm : undefined;
    const retained = key && stockLLVM === result.hashes.llvm ? {key,objects} : undefined;
    postMessage({id,...result,packagedGeneratorHash,retained},retained ? objects.map(object => object.buffer) : []);
  } catch (error) { postMessage({id,error:error.message || String(error)}); }
};
