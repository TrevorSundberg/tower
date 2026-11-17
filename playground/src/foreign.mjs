// Explicit host implementations for an interpreter/compiled Wasm external call.
export function foreignArgument(value, type, pointerBytes = 4) {
  const bits = BigInt(value);
  if (type === 'i64') return BigInt.asIntN(64, bits);
  if (type === 'u64') return BigInt.asUintN(64, bits);
  if (pointerBytes === 8 && (type === 'usize' || type.endsWith('*'))) return BigInt.asUintN(64, bits);
  if (type === 'i32') return Number(BigInt.asIntN(32, bits));
  return Number(BigInt.asUintN(type === 'u8' || type === 'bool' ? 8 : 32, bits));
}
export function invokeForeign(imports, name, context, args) {
  if (!Object.hasOwn(imports, name) || typeof imports[name] !== 'function' && typeof imports[name]?.wasm !== 'function')
    throw new Error(`No implementation registered for external function '${name}'`);
  const result = imports[name]?.wasm ? imports[name].wasm(...args) : imports[name](context, ...args);
  if (result?.then) throw new Error('External functions must return synchronously');
  return result ?? 0;
}
