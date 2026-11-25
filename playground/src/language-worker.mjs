import { getTower, getCanonicalSources, getCanonicalTower, useCompiler } from './compiler-runtime.mjs';
import { runToEnd } from './tower-host.mjs';
let queue = Promise.resolve();
self.onmessage = ({data}) => { queue = queue.then(() => receive(data)); };
async function receive({id, method, source, cursor, foundation, bedrock, editingModule, files=[], builtins={}, activePath='input.tower', library='.tower', compiler, pointerBytes=4}) {
  try {
    useCompiler(compiler);
    const editingGrammar = editingModule === 'bedrock' || editingModule === 'foundation';
    const project = {entry:activePath, files, builtins, library};
    const {tower} = method === 'highlight' || editingGrammar ? await getCanonicalTower() : await getTower(foundation, bedrock, project);
    let result;
    if (method === 'warm') {
      result = null;
    } else if (method === 'complete' || method === 'document') {
      if (editingGrammar) {
        // A grammar document starts at the seed. Inspect its imports even
        // when the project wrapper is precisely what the user is repairing.
        const baseline = await getCanonicalSources();
        const grammar = {...builtins, foundation:baseline.foundation, bedrock:editingModule === 'bedrock' ? baseline.bedrock : bedrock};
        tower.configureModules({...project, builtins:grammar, replaceBuiltins:true});
      }
      result = method === 'complete' ? tower.complete(source, cursor, {editingModule}) : tower.inspectDocument(source,{editingModule,pointerBytes});
      if (result.error) throw new Error(result.error);
    } else {
      const handle = tower.create(source);
      try { runToEnd(tower, handle); result = tower.inspect(handle).highlights; }
      finally { tower.destroy(handle); }
    }
    self.postMessage({id, result});
  } catch (error) { self.postMessage({id, error: error.message || String(error)}); }
}
