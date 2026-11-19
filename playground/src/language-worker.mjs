import { getTower, getCanonicalTower, useCompiler } from './compiler-runtime.mjs';
import { runToEnd } from './tower-host.mjs';
let queue = Promise.resolve();
let baseline;
function baselines() {
  baseline ??= Promise.all(['foundation','bedrock'].map(async name => {
    const response = await fetch('./'+name+'.tower');
    if (!response.ok) throw new Error('Cannot load '+name+'.tower');
    return response.text();
  }));
  return baseline;
}
self.onmessage = ({data}) => { queue = queue.then(() => receive(data)); };
async function receive({id, method, source, cursor, foundation, bedrock, editingModule, files=[], builtins={}, activePath='input.tower', library='.tower', compiler}) {
  try {
    useCompiler(compiler);
    if (['bedrock','foundation'].includes(editingModule)) {
      const [baseFoundation, baseBedrock] = await baselines();
      foundation = baseFoundation;
      if (editingModule === 'bedrock') bedrock = baseBedrock;
    }
    const {tower} = method === 'highlight' ? await getCanonicalTower() : await getTower(foundation, bedrock, builtins.tower);
    let result;
    if (method === 'complete') {
      tower.configureModules({entry:activePath, files, builtins:{...builtins,foundation,bedrock}, library});
      result = tower.complete(source, cursor, {editingModule});
      if (result.error) throw new Error(result.error);
    } else {
      const handle = tower.create(source);
      try { runToEnd(tower, handle); result = tower.inspect(handle).highlights; }
      finally { tower.destroy(handle); }
    }
    self.postMessage({id, result});
  } catch (error) { self.postMessage({id, error: error.message || String(error)}); }
}
