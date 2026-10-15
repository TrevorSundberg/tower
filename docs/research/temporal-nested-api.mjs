/**
 * Executable closed-owned temporal histories, deliberately using FULL replay.
 * Memory is byte-addressed, arithmetic is unsigned 64-bit, and values/opaque
 * capabilities travel in registers. This is a semantic prototype, not a native
 * implementation or a claim of incremental speed. See the companion tests.
 *
 * The driver methods (address/location/run/read/inspect) stand in for compiler lowering
 * and debugger access. Ordinary call instructions need no temporal_call API.
 */

export const RepairStatus = Object.freeze({
  OK: 'TEMPORAL_OK', ORPHANED_POINT: 'TEMPORAL_ORPHANED_POINT',
  TRAP: 'TEMPORAL_TRAP', LIMIT: 'TEMPORAL_LIMIT',
});

export class TemporalError extends Error {
  constructor(code, message) { super(`${code}: ${message}`); this.code = code; }
}

const fail = (code, message) => { throw new TemporalError(code, message); };
const check = (condition, code, message) => { if (!condition) fail(code, message); };
const TYPES = Object.freeze({ u8: 1, u16: 2, u32: 4, u64: 8, ptr: 8 });
const typedArrayLength = Object.getOwnPropertyDescriptor(
  Object.getPrototypeOf(Uint8Array.prototype), 'length').get;
const SAFE_ID = /^[A-Za-z0-9_.:-]+$/;
const OPS = new Set(['const', 'load', 'store', 'add', 'sub', 'mul', 'and', 'xor',
  'eq', 'lt', 'if', 'repeat', 'call', 'return', 'mark', 'address', 'location', 'temporal', 'enter']);
const integer = (value) => {
  check(typeof value === 'bigint' || (typeof value === 'number' && Number.isSafeInteger(value)),
    'BAD_VALUE', 'Expected an exact integer');
  return BigInt.asUintN(64, BigInt(value));
};
const unsignedIndex = (value, code = 'BOUNDS') => {
  check((typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) ||
    (typeof value === 'bigint' && value >= 0n && value <= BigInt(Number.MAX_SAFE_INTEGER)),
  code, 'Expected a nonnegative exact index');
  return Number(value);
};
const bounds = (address, width, length) => {
  const n = unsignedIndex(address);
  check(Number.isSafeInteger(width) && width > 0 && n <= length && width <= length - n,
    'BOUNDS', 'Memory access is outside its history');
  return n;
};
const byteCount = (value) => {
  const count = unsignedIndex(value, 'BAD_SIZE');
  check(count > 0, 'BAD_SIZE', 'A temporal write must contain at least one byte');
  return count;
};

function compile(input) {
  let program;
  try { program = structuredClone(input); } catch { fail('BAD_PROGRAM', 'Program must be cloneable data'); }
  check(program && program.functions && typeof program.functions === 'object' &&
    !Array.isArray(program.functions), 'BAD_PROGRAM', 'Expected functions');
  const name = (v) => check(typeof v === 'string' && v.length > 0,
    'BAD_PROGRAM', 'Expected a nonempty name');
  const operand = (v) => {
    if (v === null || typeof v === 'string') return;
    if (typeof v === 'object') {
      check(v && !Array.isArray(v) && Object.keys(v).length === 1,
        'BAD_PROGRAM', 'Malformed register operand'); name(v.reg); return;
    }
    integer(v);
  };
  for (const [fnName, fn] of Object.entries(program.functions)) {
    name(fnName);
    check(SAFE_ID.test(fnName), 'BAD_PROGRAM', 'Unsafe function identity');
    check(fn && Array.isArray(fn.params) && Array.isArray(fn.body), 'BAD_PROGRAM', 'Malformed function');
    fn.params.forEach(name);
    check(new Set(fn.params).size === fn.params.length, 'BAD_PROGRAM', 'Duplicate parameter');
    const ids = new Set();
    const blocks = [{ body: fn.body, depth: 1 }];
    while (blocks.length) {
      const { body, depth } = blocks.pop();
      check(Array.isArray(body) && depth <= 64, 'BAD_PROGRAM', 'Invalid or excessively nested block');
      for (const ins of body) {
        check(ins && typeof ins === 'object' && OPS.has(ins.op), 'BAD_PROGRAM', 'Unsupported instruction');
        name(ins.id);
        check(SAFE_ID.test(ins.id), 'BAD_PROGRAM', 'Unsafe instruction identity');
        check(!ids.has(ins.id), 'BAD_PROGRAM', 'Duplicate instruction identity in one function');
        ids.add(ins.id);
        if (ins.history !== undefined) operand(ins.history);
        switch (ins.op) {
          case 'const': name(ins.dst); operand(ins.value); break;
          case 'load': case 'store':
            check([1, 2, 4, 8].includes(ins.width), 'BAD_PROGRAM', 'Invalid memory width');
            operand(ins.addr);
            if (ins.op === 'load') name(ins.dst);
            else { check(ins.history === undefined, 'BAD_PROGRAM', 'Ordinary stores target their own history'); operand(ins.value); }
            break;
          case 'address': name(ins.dst); operand(ins.addr); break;
          case 'location': name(ins.dst); operand(ins.addr);
            check(Object.hasOwn(TYPES, ins.type ?? 'u32'), 'BAD_PROGRAM', 'Unknown location type'); break;
          case 'add': case 'sub': case 'mul': case 'and': case 'xor': case 'eq': case 'lt':
            name(ins.dst); operand(ins.a); operand(ins.b); break;
          case 'if': operand(ins.cond); blocks.push({ body: ins.then, depth: depth + 1 },
            { body: ins.else ?? [], depth: depth + 1 }); break;
          case 'repeat': operand(ins.count); name(ins.index);
            blocks.push({ body: ins.body, depth: depth + 1 }); break;
          case 'call': case 'enter':
            if (ins.dst !== undefined) name(ins.dst);
            if (typeof ins.fn === 'string') name(ins.fn); else operand(ins.fn);
            if (ins.op === 'enter') operand(ins.history);
            check(ins.args === undefined || Array.isArray(ins.args), 'BAD_PROGRAM', 'Arguments must be an array');
            (ins.args ?? []).forEach(operand); break;
          case 'return': operand(ins.value); break;
          case 'mark': name(ins.label); break;
          case 'temporal': name(ins.name);
            if (ins.dst !== undefined) name(ins.dst);
            check(Array.isArray(ins.args), 'BAD_PROGRAM', 'Temporal arguments must be an array');
            ins.args.forEach(operand); break;
        }
      }
    }
  }
  return program;
}

// Canonical untyped, byte-counted public API. The old factory below is only a
// typed fixture adapter over the same engine, retained for existing regressions.
export function createByteRuntime(inputProgram, options = {}) {
  return createRuntime(inputProgram, options, false);
}
export function createNestedRuntime(inputProgram, options = {}) {
  return createRuntime(inputProgram, options, true);
}
function createRuntime(inputProgram, options, legacyTyped) {
  const program = compile(inputProgram);
  const size = options.memorySize ?? options.initialMemory?.length ?? 64;
  check(Number.isSafeInteger(size) && size >= 0 && size <= 16 * 1024 * 1024,
    'BOUNDS', 'Memory size must be between 0 and 16 MiB in this bounded model');
  check(options.initialMemory === undefined || options.initialMemory instanceof Uint8Array,
    'BAD_BYTES', 'Initial memory must be a Uint8Array');
  const initial = options.initialMemory === undefined ? new Uint8Array(size) : new Uint8Array(options.initialMemory);
  check(initial.length === size, 'BOUNDS', 'Initial memory size mismatch');
  const maxSteps = options.maxSteps ?? 100000;
  const maxDepth = options.maxDepth ?? 64;
  check(Number.isSafeInteger(maxSteps) && maxSteps > 0, 'BAD_PROGRAM', 'Invalid step budget');
  check(Number.isSafeInteger(maxDepth) && maxDepth > 0 && maxDepth <= 128,
    'BAD_PROGRAM', 'This bounded recursive interpreter supports maxDepth from 1 to 128');

  const metadata = new WeakMap();
  const token = (kind, data = {}) => {
    const handle = Object.freeze({ kind });
    metadata.set(handle, { kind, ...data });
    return handle;
  };
  const root = token('History', { id: 'root' });
  const emptyFrame = () => ({ memory: new Uint8Array(initial),
    sources: Array.from(initial, (_, i) => `initial:${i}`), trace: [], marks: [], results: new Map() });
  const freshNode = (id, handle, parent, old = null) => ({
    id, handle, parent, events: [], patches: [], frame: emptyFrame(),
    revision: old?.revision ?? 0, publication: {}, openEdit: null,
    writeTokens: new Map(old?.writeTokens ?? []),
  });
  let world = { nodes: new Map([['root', freshNode('root', root, null)]]),
    edits: new Map(), identities: new Map(), legacyWriteTypes: new Map(), nextId: 1 };
  let context = null;
  let budget = null;
  const pools = [];

  const copyEvent = (event) => ({ ...event,
    ...(event.bytes ? { bytes: new Uint8Array(event.bytes) } : {}),
    ...(event.args ? { args: [...event.args] } : {}),
  });
  const copyEdit = (edit) => ({ ...edit, events: edit.events.map(copyEvent),
    patches: edit.patches.map(copyEvent), created: [...edit.created] });
  // Frames are immutable unless their history is executing. Execution replaces
  // the target frame first; paused ancestor frames are deliberately retained.
  const cloneWorld = (source) => ({ nextId: source.nextId,
    identities: new Map(source.identities),
    legacyWriteTypes: new Map(source.legacyWriteTypes),
    nodes: new Map([...source.nodes].map(([id, node]) => [id, { ...node,
      events: node.events.map(copyEvent), patches: node.patches.map(copyEvent),
      writeTokens: new Map(node.writeTokens) }])),
    edits: new Map([...source.edits].map(([handle, edit]) => [handle, copyEdit(edit)])),
  });
  function transaction(action) {
    const previous = world;
    world = cloneWorld(world);
    try { return action(); } catch (error) { world = previous; throw error; }
  }
  function nodeFor(history) {
    const handle = history === null ? root : history;
    const info = metadata.get(handle);
    const node = info?.kind === 'History' ? world.nodes.get(info.id) : null;
    check(node && node.handle === handle, 'INVALID_HISTORY', 'Unknown, foreign, removed, or destroyed history');
    return node;
  }
  function isDescendant(id, ancestor) {
    for (let current = world.nodes.get(id); current; current = world.nodes.get(current.parent)) {
      if (current.id === ancestor) return true;
    }
    return false;
  }
  function control(node) {
    if (context) {
      check(!isDescendant(context.id, node.id), 'ACTIVE_HISTORY', 'Cannot amend the executing history or its ancestors');
      check(node.parent === context.id, 'WRONG_OWNER', 'Tracked code controls only its immediate owned child');
    } else check(node.parent === null, 'WRONG_OWNER', 'A retained parent exclusively controls this child');
  }
  function observation(node) {
    if (context) check(node.id === context.id || node.parent === context.id,
      'WRONG_OWNER', 'Tracked reads may observe own memory or an immediate owned child snapshot');
  }
  function unlocked(node, except = null) {
    for (const other of world.nodes.values()) {
      if (!other.openEdit || other.openEdit === except) continue;
      check(other.id !== node.id, 'EDIT_OPEN', 'Finish the open batch for this history');
      check(!isDescendant(node.id, other.id) && !isDescendant(other.id, node.id),
        'EDIT_CONFLICT', 'An ancestor or descendant has an open edit');
    }
  }
  function nodeAfter(id) { const node = world.nodes.get(id); check(node, 'INVALID_HISTORY', 'History disappeared'); return node; }
  function eventId(prefix) {
    if (!context) return `${prefix}:host:${world.nextId++}`;
    // Intern a structural tuple instead of recursively embedding parent paths:
    // collision-free identity, without exponential strings at deep nesting.
    const key = JSON.stringify([prefix, context.id, context.key]);
    let id = world.identities.get(key);
    if (!id) { id = `${prefix}:tracked:${world.nextId++}`; world.identities.set(key, id); }
    return id;
  }
  function writeHandle(node, id) {
    let handle = node.writeTokens.get(id);
    // A child's reconstructed prefix may not yet contain a later live write.
    // Keep the original committed subtree as an identity pool until the whole
    // ancestor execution finishes, rather than resurrecting by path globally.
    if (!handle) {
      const old = priorNode(node.id);
      if (old?.handle === node.handle) handle = old.writeTokens.get(id);
      if (handle) node.writeTokens.set(id, handle);
    }
    if (!handle) {
      handle = token('Write', { owner: node.handle, id });
      node.writeTokens.set(id, handle);
    }
    return handle;
  }
  function location(history, address, type = 'u32') {
    const node = nodeFor(history); observation(node);
    check(Object.hasOwn(TYPES, type), 'BAD_VALUE', 'Unknown value type');
    const addr = bounds(address, TYPES[type], size);
    return token('Location', { owner: node.handle, addr, type, width: TYPES[type] });
  }
  function address(history, offset) {
    const node = nodeFor(history); observation(node);
    const addr = unsignedIndex(offset);
    check(addr <= size, 'BOUNDS', 'Address is outside its history');
    return token('Address', { owner: node.handle, addr });
  }
  function addressInfo(handle) {
    const info = metadata.get(handle);
    check(info?.kind === 'Address' || info?.kind === 'Location',
      'INVALID_LOCATION', 'Expected a compiler-owned address');
    const node = nodeFor(info.owner);
    return { owner: info.owner, addr: info.addr, node };
  }
  function locationInfo(handle) {
    const info = metadata.get(handle);
    check(info?.kind === 'Location', 'INVALID_LOCATION', 'Expected a compiler-owned typed address');
    const node = nodeFor(info.owner);
    bounds(info.addr, info.width, size);
    return { ...info, node };
  }
  function encode(info, value) {
    let raw;
    if (info.type === 'ptr' && value !== null && typeof value === 'object') {
      const source = locationInfo(value);
      check(source.owner === info.owner, 'WRONG_OWNER', 'Raw pointer values cannot cross history ownership');
      raw = BigInt(source.addr);
    } else raw = info.type === 'ptr' && value === null ? 0n : integer(value);
    const bytes = new Uint8Array(info.width);
    for (let i = 0; i < bytes.length; i += 1) { bytes[i] = Number(raw & 255n); raw >>= 8n; }
    return bytes;
  }
  function captureBytes(source, count) {
    const bytes = new Uint8Array(count);
    if (source instanceof Uint8Array) {
      check(ArrayBuffer.isView(source), 'BAD_BYTES', 'A byte source must be a real typed-array view');
      check(typedArrayLength.call(source) >= count, 'BAD_BYTES', 'Source contains fewer bytes than the write');
      // Explicit copying avoids Buffer.slice() aliases and caller-owned views.
      for (let i = 0; i < count; i += 1) bytes[i] = source[i];
      return bytes;
    }
    const info = addressInfo(source); observation(info.node);
    const addr = bounds(info.addr, count, size), frame = info.node.frame;
    for (let i = 0; i < count; i += 1) bytes[i] = frame.memory[addr + i];
    // Source capture is a real read by the currently executing instruction.
    // The external store later consumes the captured bytes, not a borrowed
    // source pointer. Dependencies belong to this controller instruction.
    if (context) for (let i = 0; i < count; i += 1) context.entry.reads.push({
      history: info.owner, addr: addr + i, value: bytes[i], source: frame.sources[addr + i],
    });
    return bytes;
  }
  function captured(value) {
    if (value === null || typeof value === 'string' || metadata.has(value)) return value;
    return integer(value);
  }
  function argsCopy(args) {
    check(Array.isArray(args), 'BAD_VALUE', 'Arguments must be an array');
    const result = [];
    for (let i = 0, length = args.length; i < length; i += 1) {
      const value = captured(args[i]), info = metadata.get(value);
      check(!info?.kind.startsWith('Retained'), 'INVALID_POINT', 'Internal retained anchors are not public argument capabilities');
      if (info?.kind === 'Point') {
        const owner = nodeFor(info.owner);
        check(info.publication === owner.publication, 'INVALID_POINT', 'Cannot submit an expired public point');
        // Once accepted as an ordinary entry argument, the historical operand
        // is retained by occurrence identity, just like an insertion's anchor.
        // Replaying the prefix must not expire it before its original use.
        result.push(token('RetainedPoint', { ownerId: owner.id, key: info.key }));
      } else if (info?.kind === 'History') {
        const owner = nodeFor(value);
        result.push(token('RetainedHistory', { ownerId: owner.id }));
      } else if (info?.kind === 'Location') {
        const location = locationInfo(value);
        result.push(token('RetainedLocation', { ownerId: location.node.id,
          addr: location.addr, type: location.type, width: location.width }));
      } else if (info?.kind === 'Address') {
        const address = addressInfo(value);
        result.push(token('RetainedAddress', { ownerId: address.node.id, addr: address.addr }));
      } else if (info?.kind === 'Write') {
        const owner = nodeFor(info.owner);
        check(owner.writeTokens.get(info.id) === value &&
          [...owner.events, ...owner.patches].some((event) => event.id === info.id),
        'INVALID_WRITE', 'Cannot submit a removed or provisional write as an entry argument');
        result.push(token('RetainedWrite', { ownerId: owner.id, id: info.id }));
      } else result.push(value);
    }
    return result;
  }
  function entryArgument(value) {
    const info = metadata.get(value);
    if (!info?.kind.startsWith('Retained')) return captured(value);
    const owner = nodeAfter(info.ownerId);
    if (info.kind === 'RetainedHistory') return owner.handle;
    if (info.kind === 'RetainedAddress') return token('Address', {
      owner: owner.handle, addr: info.addr,
    });
    if (info.kind === 'RetainedLocation') return token('Location', {
      owner: owner.handle, addr: info.addr, type: info.type, width: info.width,
    });
    if (info.kind === 'RetainedWrite') {
      const handle = owner.writeTokens.get(info.id);
      check(handle && [...owner.events, ...owner.patches].some((event) => event.id === info.id),
        'INVALID_WRITE', 'Retained write occurrence disappeared');
      return handle;
    }
    check(info.kind === 'RetainedPoint', 'BAD_PROGRAM', 'Unknown retained argument');
    check(owner.frame.marks.some((mark) => mark.key === info.key), 'INVALID_POINT', 'Retained point occurrence disappeared');
    return token('Point', { owner: owner.handle, key: info.key, publication: owner.publication });
  }
  function editFor(handle) {
    const info = metadata.get(handle);
    const edit = info?.kind === 'Edit' ? world.edits.get(handle) : null;
    check(edit, 'INVALID_EDIT', 'Unknown, foreign, or consumed batch');
    const node = nodeFor(edit.owner); control(node);
    check(node.openEdit === handle, 'INVALID_EDIT', 'Batch is not the active batch');
    return edit;
  }
  function lookupWrite(edit, handle) {
    const info = metadata.get(handle);
    check(info?.kind === 'Write' && info.owner === edit.owner, 'INVALID_WRITE', 'Write belongs to another history');
    const event = [...edit.events, ...edit.patches].find((entry) => entry.id === info.id);
    const node = nodeFor(edit.owner);
    check(event?.kind === 'write' && node.writeTokens.get(info.id) === handle,
      'INVALID_WRITE', 'Removed, cancelled, stale, or forged write');
    return event;
  }
  function closeEdit(handle) {
    const edit = world.edits.get(handle);
    if (!edit) return;
    const node = nodeFor(edit.owner);
    node.openEdit = null;
    world.edits.delete(handle);
    const live = new Set([...node.events, ...node.patches].map((entry) => entry.id));
    for (const id of edit.created) if (!live.has(id)) node.writeTokens.delete(id);
  }
  function statusFor(error) {
    if (!(error instanceof TemporalError)) throw error;
    if (error.code === 'ORPHANED_POINT') return RepairStatus.ORPHANED_POINT;
    if (error.code === 'STEP_LIMIT' || error.code === 'DEPTH_LIMIT') return RepairStatus.LIMIT;
    // These are explicit modeled language traps. Unknown/internal errors escape.
    const traps = new Set(['BOUNDS', 'BAD_VALUE', 'BAD_SIZE', 'BAD_BYTES', 'BAD_PROGRAM', 'UNDEFINED_REGISTER',
      'WRONG_OWNER', 'ACTIVE_HISTORY', 'EDIT_OPEN', 'EDIT_CONFLICT', 'WRONG_PHASE',
      'INVALID_HISTORY', 'INVALID_LOCATION', 'INVALID_EDIT', 'INVALID_WRITE', 'INVALID_POINT']);
    if (traps.has(error.code)) return RepairStatus.TRAP;
    throw error;
  }
  function bump(node) { node.revision += 1; node.publication = {}; }
  function count() {
    check(budget && ++budget.steps <= maxSteps, 'STEP_LIMIT', 'Execution budget exceeded');
  }
  function withBudget(action) {
    if (budget) return action();
    budget = { steps: 0, depth: 0, structuralDepth: 0 };
    try { return action(); } finally { budget = null; }
  }
  function withDepth(action) {
    budget.depth += 1;
    try { check(budget.depth <= maxDepth, 'DEPTH_LIMIT', 'Execution depth exceeded'); return action(); }
    finally { budget.depth -= 1; }
  }
  function withStructure(action) {
    budget.structuralDepth += 1;
    try {
      check(budget.structuralDepth <= 256, 'DEPTH_LIMIT', 'Interpreter structural nesting exceeded');
      return action();
    } finally { budget.structuralDepth -= 1; }
  }
  function removeTree(id) {
    const doomed = [...world.nodes.keys()].filter((other) => isDescendant(other, id));
    for (const key of doomed) world.nodes.delete(key);
  }
  function priorNode(id) {
    for (let i = pools.length - 1; i >= 0; i -= 1) if (pools[i].has(id)) return pools[i].get(id);
    return null;
  }

  // These three operations are the untyped core. Events retain bytes, width
  // (bytes.length), destination, and identity; they never require a language T.
  function rawWrite(destination, source, countValue) {
    const info = addressInfo(destination); control(info.node); unlocked(info.node);
    const width = byteCount(countValue); bounds(info.addr, width, size);
    const bytes = captureBytes(source, width);
    return transaction(() => withBudget(() => {
      const node = nodeFor(info.owner), id = eventId('w');
      check(![...node.events, ...node.patches].some((e) => e.id === id), 'BAD_PROGRAM', 'Duplicate input event');
      const handle = writeHandle(node, id);
      node.events.push({ kind: 'write', id, addr: info.addr, bytes });
      execute(node.id); return handle;
    }));
  }
  function rawReplace(editHandle, handle, source) {
    const edit = editFor(editHandle), event = lookupWrite(edit, handle);
    const bytes = captureBytes(source, event.bytes.length);
    event.bytes = bytes;
  }
  function rawStoreAt(editHandle, point, destination, source, countValue) {
    const edit = editFor(editHandle), info = metadata.get(point), loc = addressInfo(destination);
    const node = nodeFor(edit.owner);
    check(info?.kind === 'Point' && info.owner === edit.owner && info.publication === node.publication,
      'INVALID_POINT', 'Wrong-owner, stale, or forged marked occurrence');
    check(loc.owner === edit.owner, 'WRONG_OWNER', 'Insertion destination belongs to another history');
    const width = byteCount(countValue); bounds(loc.addr, width, size);
    const bytes = captureBytes(source, width), id = eventId('p');
    check(![...edit.events, ...edit.patches].some((event) => event.id === id), 'BAD_PROGRAM', 'Duplicate inserted event');
    const handle = writeHandle(node, id);
    edit.patches.push({ kind: 'write', id, at: info.key, addr: loc.addr, bytes });
    edit.created.push(id);
    return handle;
  }

  const api = {
    temporal_create() {
      if (context) unlocked(nodeAfter(context.id));
      return transaction(() => {
        const id = eventId('h');
        check(!world.nodes.has(id), 'BAD_PROGRAM', 'Duplicate dynamic child creation');
        const old = context ? priorNode(id) : null;
        const handle = old?.handle ?? token('History', { id });
        world.nodes.set(id, freshNode(id, handle, context?.id ?? null, old));
        return handle;
      });
    },
    temporal_destroy(history) {
      const node = nodeFor(history); control(node); unlocked(node);
      check(node.id !== 'root', 'WRONG_OWNER', 'The default root belongs to the runtime');
      transaction(() => removeTree(node.id));
    },
    temporal_write: rawWrite,
    temporal_edit(history) {
      const node = nodeFor(history); control(node); unlocked(node);
      const handle = token('Edit');
      world.edits.set(handle, { owner: node.handle, events: node.events.map(copyEvent),
        patches: node.patches.map(copyEvent), created: [] });
      node.openEdit = handle;
      return handle;
    },
    temporal_replace: rawReplace,
    temporal_remove(editHandle, handle) {
      const edit = editFor(editHandle), event = lookupWrite(edit, handle);
      edit.events = edit.events.filter((entry) => entry.id !== event.id);
      edit.patches = edit.patches.filter((entry) => entry.id !== event.id);
    },
    temporal_repair(editHandle) {
      const edit = editFor(editHandle);
      try {
        transaction(() => withBudget(() => {
          const node = nodeFor(edit.owner);
          node.events = edit.events.map(copyEvent); node.patches = edit.patches.map(copyEvent);
          // This target's edit is resolved by this private execution. Related
          // children can therefore execute normally during reconstruction.
          node.openEdit = null;
          execute(node.id);
        }));
        return RepairStatus.OK;
      } catch (error) { return statusFor(error); }
      finally { closeEdit(editHandle); }
    },
    temporal_cancel(editHandle) { editFor(editHandle); closeEdit(editHandle); },
    temporal_mark(label) {
      check(context && typeof label === 'string', 'WRONG_PHASE', 'Marks must execute in tracked code');
      const node = nodeAfter(context.id), key = context.key;
      check(!node.frame.marks.some((mark) => mark.key === key), 'BAD_PROGRAM', 'Duplicate dynamic mark');
      node.frame.marks.push({ key, label });
      for (const patch of node.patches.filter((event) => event.at === key)) {
        check(!context.encountered.has(patch.id), 'BAD_PROGRAM', 'Duplicate insertion');
        context.encountered.add(patch.id);
        external(node.id, patch);
      }
    },
    temporal_point(history, label, occurrence) {
      const node = nodeFor(history); observation(node);
      check(typeof label === 'string', 'INVALID_POINT', 'Mark label must be text');
      const index = unsignedIndex(occurrence, 'INVALID_POINT');
      const point = node.frame.marks.filter((mark) => mark.label === label)[index];
      check(point, 'INVALID_POINT', 'That marked occurrence does not exist');
      return token('Point', { owner: node.handle, publication: node.publication, key: point.key });
    },
    temporal_store_at: rawStoreAt,
  };
  if (legacyTyped) {
    // Compatibility for existing typed fixtures, not overloads in the byte API.
    // All type metadata belongs to this adapter, never the raw write events.
    api.temporal_write = function temporal_write(destination, value) {
      const info = locationInfo(destination);
      const handle = rawWrite(destination, encode(info, value), info.width);
      world.legacyWriteTypes.set(handle, info.type);
      return handle;
    };
    api.temporal_replace = function temporal_replace(editHandle, handle, value) {
      const edit = editFor(editHandle), event = lookupWrite(edit, handle);
      const info = { owner: edit.owner, width: event.bytes.length, type: world.legacyWriteTypes.get(handle) };
      rawReplace(editHandle, handle, encode(info, value));
    };
    api.temporal_store_at = function temporal_store_at(editHandle, point, destination, value) {
      const info = locationInfo(destination);
      const handle = rawStoreAt(editHandle, point, destination, encode(info, value), info.width);
      world.legacyWriteTypes.set(handle, info.type);
      return handle;
    };
  }
  Object.freeze(api);

  function record(id, key, op) {
    count();
    const entry = { key, op, value: null, reads: [], writes: [] };
    nodeAfter(id).frame.trace.push(entry);
    return entry;
  }
  function put(id, entry, address, bytes) {
    const frame = nodeAfter(id).frame, addr = bounds(address, bytes.length, size);
    for (let i = 0; i < bytes.length; i += 1) {
      frame.memory[addr + i] = bytes[i]; frame.sources[addr + i] = entry.key;
      entry.writes.push({ addr: addr + i, value: bytes[i], source: entry.key });
    }
  }
  function external(id, event) {
    const entry = record(id, `write:${event.id}`, 'external-store');
    put(id, entry, event.addr, event.bytes);
  }
  function loadBytes(node, address, width, entry = null) {
    const addr = bounds(address, width, size); let value = 0n;
    for (let i = width - 1; i >= 0; i -= 1) {
      value = (value << 8n) | BigInt(node.frame.memory[addr + i]);
      if (entry) entry.reads.push({ history: node.handle, addr: addr + i,
        value: node.frame.memory[addr + i], source: node.frame.sources[addr + i] });
    }
    return value;
  }
  function run(history, fn, args = []) {
    const node = nodeFor(history); control(node); unlocked(node);
    check(typeof fn === 'string', 'BAD_PROGRAM', 'Function target must be text');
    const capturedArgs = argsCopy(args);
    return transaction(() => withBudget(() => {
      const target = nodeFor(node.handle), id = eventId('i');
      check(!target.events.some((event) => event.id === id), 'BAD_PROGRAM', 'Duplicate entry event');
      target.events.push({ kind: 'call', id, fn, args: capturedArgs });
      execute(target.id);
      return nodeAfter(target.id).frame.results.get(id);
    }));
  }

  function execute(id) {
    return withStructure(() => {
      const node = nodeAfter(id);
      const pool = new Map([...world.nodes].filter(([key]) => key !== id && isDescendant(key, id)));
      for (const key of pool.keys()) world.nodes.delete(key);
      pools.push(pool);
      node.frame = emptyFrame();
      const encountered = new Set();
      const previousContext = context;
      try {
        for (const event of node.events) {
          if (event.kind === 'write') external(id, event);
          else nodeAfter(id).frame.results.set(event.id,
            invoke(id, event.fn, event.args, `${event.id}/${event.fn}`, encountered));
        }
        check(encountered.size === nodeAfter(id).patches.length, 'ORPHANED_POINT', 'An inserted write lost its marked occurrence');
        for (const child of world.nodes.values()) if (child.id !== id && isDescendant(child.id, id)) {
          check(!child.openEdit, 'EDIT_OPEN', 'Tracked execution cannot publish an unfinished child edit');
        }
        const current = nodeAfter(id);
        const live = new Set([...current.events, ...current.patches].map((event) => event.id));
        for (const key of current.writeTokens.keys()) if (!live.has(key)) current.writeTokens.delete(key);
        bump(current);
      } finally { context = previousContext; pools.pop(); }
    });
  }
  function invoke(id, fnName, args, prefix, encountered) {
    return withDepth(() => {
      const fn = Object.hasOwn(program.functions, fnName) ? program.functions[fnName] : null;
      check(fn && fn.params.length === args.length, 'BAD_PROGRAM', 'Unknown function or wrong argument count');
      const regs = new Map(fn.params.map((param, index) => [param, entryArgument(args[index])]));
      const readOperand = (operand) => {
        if (operand && typeof operand === 'object' && typeof operand.reg === 'string') {
          check(regs.has(operand.reg), 'UNDEFINED_REGISTER', operand.reg);
          return regs.get(operand.reg);
        }
        return captured(operand);
      };
      const writeReg = (dst, value) => { if (dst !== undefined) regs.set(dst, value); };
      function block(body, path) {
        return withStructure(() => {
          for (const ins of body) {
            const key = `${path}/${ins.id}`, entry = record(id, key, ins.op);
            context = { id, key, encountered, entry };
            let value = null;
            switch (ins.op) {
              case 'const': value = readOperand(ins.value); writeReg(ins.dst, value); break;
              case 'address': value = address(ins.history === undefined ? nodeAfter(id).handle : readOperand(ins.history),
                readOperand(ins.addr)); writeReg(ins.dst, value); break;
              case 'location': value = location(ins.history === undefined ? nodeAfter(id).handle : readOperand(ins.history),
                readOperand(ins.addr), ins.type ?? 'u32'); writeReg(ins.dst, value); break;
              case 'load': {
                const target = nodeFor(ins.history === undefined ? nodeAfter(id).handle : readOperand(ins.history));
                observation(target); value = loadBytes(target, readOperand(ins.addr), ins.width, entry);
                writeReg(ins.dst, value); break;
              }
              case 'store': {
                const info = { owner: nodeAfter(id).handle, type: `u${ins.width * 8}`, width: ins.width };
                put(id, entry, readOperand(ins.addr), encode(info, readOperand(ins.value))); break;
              }
              case 'add': case 'sub': case 'mul': case 'and': case 'xor': case 'eq': case 'lt': {
                const a = readOperand(ins.a), b = readOperand(ins.b);
                if (ins.op === 'eq') value = a === b ? 1n : 0n;
                else {
                  const x = integer(a), y = integer(b);
                  switch (ins.op) {
                    case 'add': value = BigInt.asUintN(64, x + y); break;
                    case 'sub': value = BigInt.asUintN(64, x - y); break;
                    case 'mul': value = BigInt.asUintN(64, x * y); break;
                    case 'and': value = x & y; break;
                    case 'xor': value = x ^ y; break;
                    case 'lt': value = x < y ? 1n : 0n; break;
                  }
                }
                writeReg(ins.dst, value); break;
              }
              case 'if': {
                const yes = integer(readOperand(ins.cond)) !== 0n;
                const returned = block(yes ? ins.then : (ins.else ?? []), `${key}?${yes ? 1 : 0}`);
                if (returned) return returned; break;
              }
              case 'repeat': {
                const countValue = integer(readOperand(ins.count));
                check(countValue <= BigInt(maxSteps), 'STEP_LIMIT', 'Repeat exceeds budget');
                for (let i = 0n; i < countValue; i += 1n) {
                  writeReg(ins.index, i);
                  const returned = block(ins.body, `${key}#${i}`); if (returned) return returned;
                }
                break;
              }
              case 'call': {
                const target = typeof ins.fn === 'string' ? ins.fn : String(readOperand(ins.fn));
                value = invoke(id, target, (ins.args ?? []).map(readOperand), `${key}@${target}`, encountered);
                writeReg(ins.dst, value); break;
              }
              case 'enter': {
                const target = typeof ins.fn === 'string' ? ins.fn : String(readOperand(ins.fn));
                value = run(readOperand(ins.history), target, (ins.args ?? []).map(readOperand));
                writeReg(ins.dst, value); break;
              }
              case 'temporal': {
                check(Object.hasOwn(api, ins.name), 'BAD_PROGRAM', 'Unknown temporal builtin');
                check(ins.args.length === api[ins.name].length, 'BAD_PROGRAM', 'Wrong temporal builtin argument count');
                value = api[ins.name](...ins.args.map(readOperand)); writeReg(ins.dst, value); break;
              }
              case 'mark': api.temporal_mark(ins.label); break;
              case 'return': value = readOperand(ins.value); entry.value = value; return { value };
            }
            entry.value = value;
          }
          return null;
        });
      }
      return block(fn.body, prefix)?.value ?? 0n;
    });
  }
  function readTyped(destination) {
    const info = locationInfo(destination); observation(info.node);
    return loadBytes(info.node, info.addr, info.width);
  }
  function readBytes(destination, countValue) {
    const width = byteCount(countValue), info = addressInfo(destination); observation(info.node);
    bounds(info.addr, width, size);
    return captureBytes(destination, width);
  }
  function inspect(history) {
    const node = nodeFor(history); observation(node);
    return { memory: new Uint8Array(node.frame.memory), revision: node.revision,
      children: [...world.nodes.values()].filter((child) => child.parent === node.id).map((child) => child.handle),
      trace: node.frame.trace.map((entry) => ({ ...entry,
        reads: entry.reads.map((item) => ({ ...item })), writes: entry.writes.map((item) => ({ ...item })) })),
      marks: node.frame.marks.map((mark) => ({ ...mark })), results: new Map(node.frame.results),
      events: node.events.map(copyEvent), patches: node.patches.map(copyEvent),
    };
  }
  return Object.freeze({ api, address, location, run, inspect, read: legacyTyped ? readTyped : readBytes });
}
