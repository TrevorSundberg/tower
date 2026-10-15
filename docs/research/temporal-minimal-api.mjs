/**
 * Typed lowering experiment for the minimal language-facing control API.
 * There is ONE typed write/replace/store_at form, not a second _value API.
 * Byte buffers, widths, history ownership and engine pointers are private here.
 * This is compiler-operand simulation, not an implemented C compiler or ABI.
 */
import * as kernel from './temporal-api-model.mjs';

const TYPES = Object.freeze({ u8: 1, u16: 2, u32: 4, u64: 8, ptr: 8 });
const reject = (code, message) => { throw new kernel.TemporalError(code, message); };

export function createValidationHarness(program, options = {}) {
  // The runtime/compiler owns this context. It is not a language API parameter.
  const history = kernel.temporal_create(program, options);
  const locations = new WeakMap();
  const writes = new WeakMap();
  const edits = new WeakSet();
  let alive = true;
  const active = () => { if (!alive) reject('INVALID_TIMELINE', 'Destroyed validation context'); };
  const describe = (destination) => {
    active();
    const info = locations.get(destination);
    if (!info) reject('INVALID_LOCATION', 'Destination must be an owned compiler-typed memory location');
    return info;
  };
  const writeType = (event) => {
    active();
    const type = writes.get(event);
    if (!type) reject('INVALID_WRITE', 'Wrong-owner or forged typed write handle');
    return type;
  };
  const ownedEdit = (edit) => {
    active();
    if (!edits.has(edit)) reject('INVALID_EDIT', 'Wrong-owner or forged edit handle');
  };

  function encode(type, value) {
    let integer;
    if (type === 'ptr') {
      if (value === null || value === 0 || value === 0n) integer = 0n;
      else {
        const pointee = locations.get(value);
        if (!pointee) reject('TYPE_MISMATCH', 'Pointer-valued input must be an owned typed address or null');
        integer = BigInt(pointee.address);
      }
    } else {
      if (value && typeof value === 'object') reject('TYPE_MISMATCH', 'Pointer/aggregate is not an unsigned scalar value');
      if (typeof value !== 'bigint' && !(typeof value === 'number' && Number.isSafeInteger(value))) {
        reject('BAD_VALUE', 'Only exact integer scalar values are modeled');
      }
      integer = BigInt(value);
    }
    // The destination type determines integer conversion and storage width.
    // This private encoding is not a requirement to materialize an SSA temporary
    // in source-visible memory in the eventual native implementation.
    const width = TYPES[type];
    let bits = BigInt.asUintN(width * 8, integer);
    const bytes = new Uint8Array(width);
    for (let i = 0; i < width; i += 1) { bytes[i] = Number(bits & 255n); bits >>= 8n; }
    return bytes;
  }

  const api = Object.freeze({
    temporal_write(destination, value) {
      const { address, type } = describe(destination);
      const event = kernel.temporal_write(history, address, encode(type, value));
      writes.set(event, type);
      return event;
    },
    temporal_edit() {
      active();
      const edit = kernel.temporal_edit(history);
      edits.add(edit);
      return edit;
    },
    temporal_replace(edit, event, value) {
      ownedEdit(edit);
      kernel.temporal_replace(edit, event, encode(writeType(event), value));
    },
    temporal_store_at(edit, point, destination, value) {
      ownedEdit(edit);
      const { address, type } = describe(destination);
      const event = kernel.temporal_store_at(edit, point, address, encode(type, value));
      writes.set(event, type);
      return event;
    },
    temporal_remove(edit, event) { ownedEdit(edit); writeType(event); kernel.temporal_remove(edit, event); },
    temporal_repair(edit) { ownedEdit(edit); return kernel.temporal_repair(edit); },
    temporal_cancel(edit) { ownedEdit(edit); kernel.temporal_cancel(edit); },
  });

  // The remaining methods emulate compiler/runtime bindings and observation.
  // They are diagnostic harness machinery, not extra source-language APIs.
  return Object.freeze({
    api,
    location(address, type) {
      active();
      if (!Object.hasOwn(TYPES, type)) reject('TYPE_MISMATCH', `Unsupported model type ${type}`);
      if (!Number.isSafeInteger(address) || address < 0) reject('INVALID_LOCATION', 'Invalid logical address');
      const location = Object.freeze({ kind: 'CompilerLocation', address, type });
      locations.set(location, { address, type });
      return location;
    },
    run(fn, args = []) { active(); return kernel.temporal_call(history, fn, args); },
    points(label) { active(); return kernel.temporal_points(history, label); },
    inspect() { active(); return kernel.temporal_inspect(history); },
    destroy() { active(); kernel.temporal_destroy(history); alive = false; },
  });
}
