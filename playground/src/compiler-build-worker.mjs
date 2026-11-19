import {getCompiler, useCompiler} from './compiler-runtime.mjs';
import {fetchBytes} from './fetch-bytes.mjs';
import {buildCompiler} from './compiler-build.mjs';
self.onmessage = async ({data:{id, compiler, files}}) => {
  try {
    useCompiler(compiler);
    const recipe = await fetch('./compiler/project.json').then(response => {
      if (!response.ok) throw new Error('Compiler build recipe is unavailable');
      return response.json();
    });
    const loaded = await getCompiler('./tower-llvm.wasm.gz');
    const result = await buildCompiler({compiler:loaded.compiler, recipe, files,
      support:name => fetchBytes('./compiler/'+name), progress:phase => postMessage({id,phase})});
    postMessage({id,...result});
  } catch (error) { postMessage({id,error:error.message || String(error)}); }
};
