// Transport for Tower's module environment. Resolution and dependency discovery
// execute in Tower; this adapter supplies explicit project source capabilities.
// `builtins` is the saved project's library-file collection, not a resolver
// privilege: .tower/tower.tower follows the same lookup as any supplied file.
export function moduleInputs(exports, initial = {}) {
  const allocate = exports.tw_alloc || exports.malloc, free = exports.tw_free || exports.free;
  const environment = exports.frontend_modules_create();
  let state = {entry:'input.tower', files:[], builtins:initial, library:'.tower'};
  function text(value, action) {
    const bytes = new TextEncoder().encode(value), pointer = allocate(bytes.length + 1);
    if (!pointer) throw new Error('Unable to allocate module input');
    try {
      const memory = new Uint8Array(exports.memory.buffer);
      memory.set(bytes, pointer); memory[pointer + bytes.length] = 0;
      return action(pointer, bytes.length);
    } finally { free(pointer); }
  }
  function configure(update = {}) {
    state = {...state, ...update, builtins:{...state.builtins, ...update.builtins}};
    exports.frontend_modules_clear(environment);
    const files = [...state.files.filter(file => file.path.endsWith('.tower')), ...Object.entries(state.builtins).filter(([,source]) => typeof source === 'string')
      .map(([name, source]) => ({path:'.tower/' + name + '.tower', text:source}))];
    for (const file of files) text(file.path, name => text(file.text, (source, length) => {
      if (!exports.frontend_modules_source(environment, name, source, length)) throw new Error('Invalid module input: ' + file.path);
    }));
    text(state.entry, entry => text(state.library, library => exports.frontend_modules_configure(environment, entry, library)));
  }
  configure();
  function string(pointer) {
    const memory = new Uint8Array(exports.memory.buffer);
    return new TextDecoder().decode(memory.subarray(pointer, memory.indexOf(0, pointer)));
  }
  return {
    environment, configure,
    sourceMap() {
      const files = [], count = exports.frontend_modules_source_count(environment);
      for (let i = 0; i < count; ++i) files.push({
        path:string(exports.frontend_modules_source_name(environment, i)),
        base:exports.frontend_modules_source_base(environment, i),
        length:exports.frontend_modules_source_length(environment, i),
      });
      return {files, errorFile:string(exports.frontend_modules_error_file(environment)), errorOffset:exports.frontend_modules_error_offset(environment)};
    },
    dependencies() {
      const result = [], count = exports.frontend_modules_used_count(environment);
      for (let i = 0; i < count; ++i) {
        const pointer = exports.frontend_modules_used_name(environment, i), memory = new Uint8Array(exports.memory.buffer);
        result.push(new TextDecoder().decode(memory.subarray(pointer, memory.indexOf(0, pointer))));
      }
      if (exports.frontend_modules_implicit(environment)) result.push('.tower/bedrock.tower', '.tower/foundation.tower');
      return [...new Set(result)];
    },
  };
}

export function moduleDiagnostic(result, map) {
  if (result.status !== 'error' || !map) return result;
  if (map.errorFile) return {...result, errorFile:map.errorFile, errorOffset:map.errorOffset};
  const offset = result.errorOffset ?? 0;
  const file = map.files.find(file => offset >= file.base && offset <= file.base + file.length);
  return file ? {...result, errorFile:file.path, errorOffset:offset - file.base} : result;
}
