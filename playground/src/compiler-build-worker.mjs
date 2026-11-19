import {getCompiler, useCompiler} from './compiler-runtime.mjs';
import {fetchBytes} from './fetch-bytes.mjs';
import {buildCompiler} from './compiler-build.mjs';
import {compilerUnitMessages} from './compiler-unit.mjs';
const unitMessages = compilerUnitMessages((data,transfer) => postMessage(data,transfer ?? []));
self.onmessage = async ({data}) => {
  if (data.type === 'prepare' || data.type === 'compile') { await unitMessages(data); return; }
  const {id,compiler,files} = data;
  try {
    useCompiler(compiler);
    const recipe = await fetch('./compiler/project.json').then(response => {
      if (!response.ok) throw new Error('Compiler build recipe is unavailable');
      return response.json();
    });
    const loaded = await getCompiler('./tower-llvm.wasm.gz');
    const result = await buildCompiler({compiler:loaded.compiler, recipe, files,
      workers:Math.min(2,navigator.hardwareConcurrency || 1),
      createWorker:() => new Worker(new URL('./compiler-build-worker.js',import.meta.url),{type:'module'}),
      support:name => fetchBytes('./compiler/'+name), progress:phase => postMessage({id,phase})});
    postMessage({id,...result});
  } catch (error) { postMessage({id,error:error.message || String(error)}); }
};
