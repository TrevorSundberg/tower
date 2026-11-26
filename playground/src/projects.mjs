// Project files are plain source text. IndexedDB stores whole project snapshots
// atomically; localStorage is only used for the small last-project preference.
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
  // A queued write can outlive the page even with an explicit commit. During
  // navigation, hand pending snapshots to the next document in this history
  // entry. Keep IndexedDB authoritative once its transaction completes.
  const key = 'towerPendingProjectWritesV1';
  const revisions = new Map(), pending = new Map();
  let checkpointed = !!history.state?.[key], dirty = checkpointed;
  function checkpoint() {
    if (!dirty) return;
    if (pending.size || checkpointed) {
      const state = {...history.state};
      if (pending.size) state[key] = Array.from(pending.values(), ({project, revision, predecessors}) =>
        ({snapshot:{...project, storageRevision:revision}, predecessors:[...predecessors]}));
      else delete state[key];
      history.replaceState(state, '');
    }
    checkpointed = pending.size > 0;
    dirty = false;
  }
  for (const {snapshot, predecessors} of history.state?.[key] ?? []) {
    validateProject(snapshot);
    // Reconcile against the durable revision atomically. Another tab's newer
    // snapshot must win over a stale navigation entry.
    await transaction('readwrite', store => {
      const request = store.get(snapshot.id);
      request.onsuccess = () => {
        if (predecessors.includes(request.result?.storageRevision)) store.put(snapshot);
        store.transaction.commit();
      };
      return request;
    });
  }
  checkpoint();

  async function list() {
    const projects = await transaction('readonly', store => store.getAll());
    for (const project of projects) {
      revisions.set(project.id, project.storageRevision);
      delete project.storageRevision;
    }
    return projects;
  }
  async function save(project) {
    const prior = pending.get(project.id);
    const predecessors = prior?.predecessors ?? new Set([revisions.get(project.id)]);
    if (prior) predecessors.add(prior.revision);
    const revision = crypto.randomUUID();
    // beforeunload precedes the browser's capture of history.state for a
    // reload. pagehide alone is too late. Listen only while writes are pending.
    if (!pending.size) window.addEventListener('beforeunload', checkpoint);
    pending.set(project.id, {project, revision, predecessors});
    dirty = true;
    try {
      await transaction('readwrite', store => {
        const request = store.put({...project, storageRevision:revision});
        store.transaction.commit();
        return request;
      });
      revisions.set(project.id, revision);
    } finally {
      if (pending.get(project.id)?.revision === revision) {
        pending.delete(project.id);
        dirty = true;
      }
      if (!pending.size) {
        window.removeEventListener('beforeunload', checkpoint);
        if (checkpointed) checkpoint();
      }
    }
  }
  return {list, save, checkpoint};
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
