// Project files are plain source text. IndexedDB stores whole project snapshots
// atomically; localStorage is only used for the small last-project preference.
export const examples = ['foreach', 'execution', 'increment', 'inference', 'templates', 'match', 'collections', 'functions', 'structs', 'memory', 'replacements', 'tokens'];
export function filePath(path) {
  if (typeof path !== 'string' || !path || path.length > 1024 || /[\\\x00-\x1f:]/.test(path) || path.split('/').some(p => !p || p === '.' || p === '..') || path === '.tower' || path.startsWith('.tower/'))
    throw new Error('Use a relative file path, such as src/main.tower.');
  return path;
}
export function validateProject(project) {
  if (!project || project.version !== 1 || typeof project.name !== 'string' || !project.name.trim() || !Array.isArray(project.files) || !project.files.length)
    throw new Error('Invalid Tower project.');
  const paths = new Set();
  if (project.library !== undefined && !['.', '.tower'].includes(project.library)) throw new Error('Invalid project library root.');
  if (project.compilerProject !== undefined && typeof project.compilerProject !== 'boolean') throw new Error('Invalid compiler project flag.');
  for (const file of project.files) {
    filePath(file.path);
    if (typeof file.text !== 'string' || paths.has(file.path)) throw new Error('Invalid or duplicate file: ' + file.path);
    paths.add(file.path);
  }
  for (const path of paths) for (let at = path.indexOf('/'); at >= 0; at = path.indexOf('/', at + 1))
    if (paths.has(path.slice(0, at))) throw new Error('A file conflicts with a folder: ' + path);
  for (const [name, text] of Object.entries(project.builtins ?? {})) { filePath(name + '.tower'); if (typeof text !== 'string') throw new Error('Invalid builtin module: ' + name); }
  for (const key of ['bedrock', 'foundation']) if (typeof project.builtins?.[key] !== 'string') throw new Error('Missing built-in: ' + key);
  if (!paths.has(project.active) && !Object.keys(project.builtins).map(name => '.tower/' + name + '.tower').includes(project.active)) project.active = project.files[0].path;
  project.links ??= {};
  for (const [name, bytes] of Object.entries(project.links))
    if (!/^[a-zA-Z0-9._-]{1,128}$/.test(name) || name.startsWith('tower-') || !(bytes instanceof Uint8Array) || bytes.length > 64 * 1024 * 1024)
      throw new Error('Invalid link input: ' + name);
  if (Object.keys(project.links).length > 60) throw new Error('At most 60 link inputs');
  return project;
}
export function newProject(name, builtins, files = [{path:'main.tower', text:'import tower;\n\nprint(42);\n'}]) {
  return validateProject({version:1, id:crypto.randomUUID(), name, files, active:files[0].path, builtins:{...builtins}, baseline:{...builtins}, links:{}});
}
export async function projectStore() {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('tower-projects', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('projects', {keyPath:'id'});
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  function transaction(mode, action) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('projects', mode), request = action(tx.objectStore('projects'));
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = () => reject(tx.error ?? new Error('Project storage transaction aborted.'));
    });
  }
  return {list:() => transaction('readonly', s => s.getAll()), save:p => transaction('readwrite', s => s.put(p))};
}

// The first Tower file is the project entry. Tower resolves its import closure.
export function projectSources(project) { return project.files.filter(file => file.path.endsWith('.tower')).slice(0, 1); }

// Retire unchanged bundled paths after a rename; keep edited/user files intact.
export function refreshCompilerSources(project, recipe) {
  const current = new Set(recipe.files.map(file => file.path));
  project.files = project.files.filter(file => current.has(file.path) ||
    file.text !== project.sourceBaseline?.[file.path]);
  for (const file of recipe.files) {
    const saved = project.files.find(saved => saved.path === file.path);
    if (!saved) project.files.push({...file});
    else if (saved.text === project.sourceBaseline?.[file.path]) saved.text = file.text;
  }
  if (!project.files.some(file => file.path === project.active)) project.active = recipe.entry;
  project.sourceBaseline = Object.fromEntries(recipe.files.map(file => [file.path, file.text]));
}
export function projectDiagnostic(result, files) {
  if (result.status !== 'error' || result.errorFile || !files?.length) return result;
  let offset = result.errorOffset ?? 0;
  for (const [index, file] of files.entries()) {
    const length = new TextEncoder().encode(file.text).length;
    if (offset <= length || index === files.length - 1) return {...result, errorFile:file.path, errorOffset:offset};
    offset -= length + 1;
  }
}
