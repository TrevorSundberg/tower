function configureGrammar(exports, source, name, setter) {
  if (typeof source !== 'string') throw new Error(`Load ${name.toLowerCase()}.tower before initializing Tower`);
  const bytes = new TextEncoder().encode(source);
  if (bytes.length > 65536) throw new Error(`${name} limit is 64 KiB`);
  const allocate = exports.tw_alloc || exports.malloc, free = exports.tw_free || exports.free;
  const pointer = allocate(bytes.length + 1);
  if (!pointer) throw new Error(`Unable to allocate ${name.toLowerCase()} module`);
  try {
    new Uint8Array(exports.memory.buffer).set(bytes, pointer);
    const error = exports[setter](pointer, bytes.length);
    const memory = new Uint8Array(exports.memory.buffer);
    const message = new TextDecoder().decode(memory.subarray(error, memory.indexOf(0, error)));
    if (message) throw new Error(message);
  } finally { free(pointer); }
}
export const configureTower = (exports, source) => configureGrammar(exports, source, 'Foundation', 'tw_set_bootstrap');
export const configureBedrock = (exports, source) => configureGrammar(exports, source, 'Bedrock', 'tw_set_bedrock');

export function configureFoundation(exports, source) {
  if (typeof source !== 'string') throw new Error('Load foundation.tower before initializing foundation compilation');
  const bytes = new TextEncoder().encode(source);
  const allocate = exports.tw_alloc || exports.malloc, free = exports.tw_free || exports.free;
  const pointer = allocate(bytes.length + 1);
  if (!pointer) throw new Error('Unable to allocate foundation grammar');
  try {
    new Uint8Array(exports.memory.buffer).set(bytes, pointer);
    if (!exports.tw_set_foundation(pointer, bytes.length)) throw new Error('Invalid foundation grammar configuration');
  } finally { free(pointer); }
}
