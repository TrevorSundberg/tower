// Session-only compiler generations. Reload and Reset always recover the shipped
// compiler; source edits remain in the normal project store/ZIP.
let selection = {revision:0};
const listeners = new Set();
export const compilerSelection = () => selection;
export function selectCompiler(modules = {}) {
  selection = {...modules, revision:selection.revision + 1};
  for (const notify of listeners) notify(selection);
}
export function onCompilerSelection(notify) { listeners.add(notify); return () => listeners.delete(notify); }
