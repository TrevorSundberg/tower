// Explicit host implementations for an interpreter/compiled Wasm external call.
export function foreignArgument(value, type, pointerBytes = 4) {
  const bits = BigInt(value);
  if (type === 'f32' || type === 'f64') {
    const storage = new DataView(new ArrayBuffer(8));
    storage.setBigUint64(0, BigInt.asUintN(64, bits), true);
    return type === 'f32' ? storage.getFloat32(0, true) : storage.getFloat64(0, true);
  }
  if (type === 'i64') return BigInt.asIntN(64, bits);
  if (type === 'u64') return BigInt.asUintN(64, bits);
  if (pointerBytes === 8 && (type === 'usize' || type.endsWith('*'))) return BigInt.asUintN(64, bits);
  if (type === 'i32') return Number(BigInt.asIntN(32, bits));
  if (type === 'i8') return Number(BigInt.asIntN(8, bits));
  if (type === 'i16') return Number(BigInt.asIntN(16, bits));
  if (type === 'u16') return Number(BigInt.asUintN(16, bits));
  return Number(BigInt.asUintN(type === 'u8' || type === 'bool' ? 8 : 32, bits));
}
export function foreignResult(value, type) {
  if (type !== 'f32' && type !== 'f64') return BigInt(value);
  const storage = new DataView(new ArrayBuffer(8));
  if (type === 'f32') storage.setFloat32(0, Number(value), true);
  else storage.setFloat64(0, Number(value), true);
  return storage.getBigUint64(0, true);
}
export function invokeForeign(imports, name, context, args) {
  if (!Object.hasOwn(imports, name) || typeof imports[name] !== 'function' && typeof imports[name]?.wasm !== 'function')
    throw new Error(`No implementation registered for external function '${name}'`);
  const result = imports[name]?.wasm ? imports[name].wasm(...args) : imports[name](context, ...args);
  if (result?.then) throw new Error('External functions must return synchronously');
  return result ?? 0;
}
