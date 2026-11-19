import { getTower, getCanonicalTower } from './compiler-runtime.mjs';
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
async function receive({id, method, source, cursor, foundation, bedrock, editingModule, files}) {
  try {
    if (editingModule) {
      const [baseFoundation, baseBedrock] = await baselines();
      foundation = baseFoundation;
      if (editingModule === 'bedrock') bedrock = baseBedrock;
    }
    const {tower} = method === 'highlight' ? await getCanonicalTower() : await getTower(foundation, bedrock);
    let result;
    if (method === 'complete') {
      result = tower.complete(source, cursor, {editingModule, files});
      if (result.error) throw new Error(result.error);
    } else {
      const handle = tower.create(source);
      try { runToEnd(tower, handle); result = tower.inspect(handle).highlights; }
      finally { tower.destroy(handle); }
    }
    self.postMessage({id, result});
  } catch (error) { self.postMessage({id, error: error.message || String(error)}); }
}
