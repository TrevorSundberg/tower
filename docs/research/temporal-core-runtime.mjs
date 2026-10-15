/**
 * Minimal temporal API semantic prototype. Compiler output is a deterministic
 * opcode program. Pointers are integers in ONE address space; allocations carry
 * explicit owner/lifetime metadata. Repair uses full replay, not incrementality.
 */
export const Status = Object.freeze({ OK: 0n, ORPHANED_POINT: 1n, TRAP: 2n });
// Tokens belong to a runtime, even when several prototypes share one JS process.
// Raw numeric memory addresses, unlike capabilities, belong to each VM's address space.
let nextOpaqueHandle = 1n << 52n;
export class TemporalError extends Error {
  constructor(code, message) { super(`${code}: ${message}`); this.code = code; }
}
const fail = (code, message) => { throw new TemporalError(code, message); };
const check = (yes, code, message) => { if (!yes) fail(code, message); };
const index = (v) => {
  check((typeof v === 'number' && Number.isSafeInteger(v) && v >= 0) ||
    (typeof v === 'bigint' && v >= 0n && v <= BigInt(Number.MAX_SAFE_INTEGER)),
  'BAD_INTEGER', 'Expected a nonnegative exact integer'); return Number(v);
};
const count = (v) => { const n = index(v); check(n > 0, 'BAD_SIZE', 'Byte count must be positive'); return n; };
const u64 = (v) => {
  check(typeof v === 'bigint' || (typeof v === 'number' && Number.isSafeInteger(v)),
    'BAD_VALUE', 'Expected an exact integer'); return BigInt.asUintN(64, BigInt(v));
};
const byteLength = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype), 'length').get;
const byteKind = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype), Symbol.toStringTag).get;
const snapshot = (source, n) => {
  let length; try { length = byteLength.call(source); } catch { fail('BAD_SOURCE', 'Expected a real Uint8Array'); }
  check(byteKind.call(source) === 'Uint8Array', 'BAD_SOURCE', 'Expected an unsigned byte view');
  check(n <= length, 'BOUNDS', 'Source is shorter than byte count');
  const result = new Uint8Array(n);
  try { for (let i = 0; i < n; i++) result[i] = source[i]; }
  catch { fail('BAD_SOURCE', 'Source bytes unavailable'); }
  return result;
};
const cloneAllocation = (a) => ({ ...a, bytes: new Uint8Array(a.bytes), producers: [...a.producers] });
const cloneNode = (n) => ({ ...n, events: n.events.map(e => ({ ...e, args: new Uint8Array(e.args) })),
  patches: n.patches.map(p => ({ ...p, bytes: new Uint8Array(p.bytes) })),
  identities: new Map(n.identities), points: new Map(n.points), reached: new Set(n.reached),
  trace: n.trace.map(t => ({ ...t, reads: t.reads.map(r => ({ ...r })),
    writes: t.writes.map(w => ({ ...w })), operands: [...t.operands], controls: [...t.controls] })),
  results: [...n.results], resultProducers: [...n.resultProducers] });
const cloneWorld = (w) => ({ nodes: new Map([...w.nodes].map(([k, v]) => [k, cloneNode(v)])),
  allocations: new Map([...w.allocations].map(([k, v]) => [k, cloneAllocation(v)])),
  edits: new Map([...w.edits].map(([k, v]) => [k, { ...v,
    patches: v.patches.map(p => ({ ...p, bytes: new Uint8Array(p.bytes) })) }])) });

function compile(input) {
  let p; try { p = structuredClone(input); } catch { fail('BAD_PROGRAM', 'Program must be cloneable data'); }
  check(p && p.functions && typeof p.functions === 'object', 'BAD_PROGRAM', 'Expected functions');
  const ops = new Set(['const', 'load', 'store', 'alloc', 'free', 'add', 'sub', 'mul', 'and', 'xor',
    'eq', 'lt', 'if', 'repeat', 'call', 'return', 'temporal']);
  const operand = (v) => {
    if (v === null || typeof v === 'string') return;
    if (v && typeof v === 'object') {
      check(Object.keys(v).length === 1 && typeof v.reg === 'string', 'BAD_PROGRAM', 'Malformed register operand'); return;
    }
    u64(v);
  };
  const fieldName = (v) => check(typeof v === 'string' && v.length > 0, 'BAD_PROGRAM', 'Expected a name');
  for (const [name, fn] of Object.entries(p.functions)) {
    check(/^[A-Za-z0-9_.:-]+$/.test(name) && Array.isArray(fn.params) && Array.isArray(fn.body),
      'BAD_PROGRAM', 'Malformed function');
    check(new Set(fn.params).size === fn.params.length && fn.params.every(x => typeof x === 'string'),
      'BAD_PROGRAM', 'Invalid parameters');
    const ids = new Set(), blocks = [{ body: fn.body, depth: 0 }];
    while (blocks.length) {
      const { body, depth } = blocks.pop();
      check(Array.isArray(body) && depth < 64, 'BAD_PROGRAM', 'Invalid block nesting');
      for (const ins of body) {
        check(ins && ops.has(ins.op) && typeof ins.id === 'string' && /^[A-Za-z0-9_.:-]+$/.test(ins.id) && !ids.has(ins.id),
          'BAD_PROGRAM', 'Unknown opcode or invalid/duplicate instruction id'); ids.add(ins.id);
        if (ins.op === 'if') { blocks.push({ body: ins.then, depth: depth + 1 }); blocks.push({ body: ins.else ?? [], depth: depth + 1 }); }
        if (ins.op === 'repeat') blocks.push({ body: ins.body, depth: depth + 1 });
        if (ins.op === 'load' || ins.op === 'store') check([1, 2, 4, 8].includes(ins.width), 'BAD_PROGRAM', 'Invalid scalar width');
        if (ins.op === 'temporal') check(typeof ins.name === 'string' && Array.isArray(ins.args), 'BAD_PROGRAM', 'Malformed temporal instruction');
        switch (ins.op) {
          case 'const': fieldName(ins.dst); operand(ins.value); break;
          case 'load': fieldName(ins.dst); operand(ins.addr); break;
          case 'store': operand(ins.addr); operand(ins.value); break;
          case 'alloc': fieldName(ins.dst); operand(ins.size); if (ins.alignment !== undefined) operand(ins.alignment); break;
          case 'free': operand(ins.addr); break;
          case 'add': case 'sub': case 'mul': case 'and': case 'xor': case 'eq': case 'lt':
            fieldName(ins.dst); operand(ins.a); operand(ins.b); break;
          case 'if': operand(ins.cond); break;
          case 'repeat': operand(ins.count); fieldName(ins.index); break;
          case 'call':
            operand(ins.fn); check(Array.isArray(ins.args ?? []), 'BAD_PROGRAM', 'Call arguments must be an array');
            (ins.args ?? []).forEach(operand); if (ins.dst !== undefined) fieldName(ins.dst); break;
          case 'return': operand(ins.value); break;
          case 'temporal': ins.args.forEach(operand); if (ins.dst !== undefined) fieldName(ins.dst); break;
        }
      }
    }
  }
  return p;
}

export function createTemporalRuntime(input, options = {}) {
  const program = compile(input);
  const maxSteps = options.maxSteps ?? 100000, maxDepth = options.maxDepth ?? 64;
  check(Number.isSafeInteger(maxSteps) && maxSteps > 0 && Number.isSafeInteger(maxDepth) && maxDepth > 0 && maxDepth <= 128,
    'BAD_OPTIONS', 'Invalid bounded interpreter budget');
  let nextAddress = 1n << 32n;
  const metadata = new Map(), globals = new Map();
  let sealed = false, context = null, budget = null;
  const freshNode = (id, parent) => ({ id, parent, alive: true, events: [], patches: [],
    identities: new Map(), points: new Map(), reached: new Set(['start']), tail: 'start',
    trace: [], results: [], resultProducers: [], openEdit: null });
  let world = { nodes: new Map([[0n, freshNode(0n, 'host')]]), allocations: new Map(), edits: new Map() };
  let replayPool = null;
  const handle = (kind, data) => { const id = nextOpaqueHandle++; metadata.set(id, { kind, ...data }); return id; };
  const historyId = (h) => h === null ? 0n : (typeof h === 'number' && h === 0 ? 0n : h);
  const node = (h) => {
    const id = historyId(h), n = world.nodes.get(id);
    check(n?.alive, 'BAD_HISTORY', 'History is foreign, dead, or invalid'); return n;
  };
  const token = (h, kind) => { const m = metadata.get(h); check(m?.kind === kind, 'BAD_HANDLE', `Expected ${kind}`); return m; };
  const ancestor = (a, b) => {
    for (let n = world.nodes.get(b); n; n = world.nodes.get(n.parent)) if (n.id === a) return true;
    return false;
  };
  const controlled = (h) => {
    const n = node(h);
    check(context ? n.parent === context.history : n.parent === 'host', 'OWNERSHIP', 'Only the immediate controller may mutate a history');
    return n;
  };
  const noEdits = (id) => {
    for (const e of world.edits.values()) check(!(ancestor(id, e.history) || ancestor(e.history, id)),
      'OPEN_EDIT', 'An overlapping history has an open edit');
  };
  const ownNode = () => { check(context, 'NOT_EXECUTING', 'Compiler primitive requires tracked execution'); return node(context.history); };
  const identity = (n, key, kind, extra = {}) => {
    if (n.identities.has(key)) return n.identities.get(key);
    // Identity belongs to the producing occurrence. Undoing a later destroy or
    // cancellation can make that SAME occurrence live again. If the producer
    // itself disappeared from a published trace, its identity is no longer in
    // this pool and is never assigned to a later reappearing occurrence.
    const previous = replayPool?.nodes.get(n.id)?.identities.get(key);
    const id = previous ?? handle(kind, { history: n.id, key, ...extra });
    n.identities.set(key, id); return id;
  };
  const pointer = (p) => BigInt(index(p));
  const allocation = (p, size, { write = false, checkReader = true } = {}) => {
    const address = pointer(p), width = count(size);
    for (const a of world.allocations.values()) {
      if (address >= a.base && address - a.base <= BigInt(a.size) && BigInt(width) <= BigInt(a.size) - (address - a.base)) {
        check(a.live, 'DEAD_MEMORY', 'Allocation lifetime has ended');
        if (checkReader && context) {
          check(a.owner === context.history || (!write && node(a.owner).parent === context.history),
            'OWNERSHIP', 'Ordinary reads may observe self or immediate child; writes require self');
        }
        check(!write || !a.readonly, 'READ_ONLY', 'Argument snapshot is read-only');
        return { a, offset: Number(address - a.base), address, width };
      }
    }
    fail('BOUNDS', 'Pointer span is not contained in a registered allocation');
  };
  const readBytes = (p, size, tracked = true) => {
    const { a, offset, address, width } = allocation(p, size);
    if (tracked && context?.record) for (let i = 0; i < width; i++) context.record.reads.push({
      address: address + BigInt(i), producer: a.producers[offset + i], value: a.bytes[offset + i] });
    return new Uint8Array(a.bytes.subarray(offset, offset + width));
  };
  const sourceBytes = (source, size) => {
    const n = count(size);
    if (typeof source === 'number' || typeof source === 'bigint') return readBytes(source, n);
    check(!context, 'BAD_SOURCE', 'Tracked code must pass a tracked source pointer');
    return snapshot(source, n);
  };
  const putBytes = (p, bytes, producer, patchOwner = null) => {
    const access = allocation(p, bytes.length, { write: true, checkReader: patchOwner === null });
    const { a, offset, address } = access;
    if (patchOwner !== null) check(a.owner === patchOwner && !a.readonly, 'OWNERSHIP', 'Historical destination belongs to another history');
    for (let i = 0; i < bytes.length; i++) {
      a.bytes[offset + i] = bytes[i]; a.producers[offset + i] = producer;
      if (context?.record && patchOwner === null) context.record.writes.push({ address: address + BigInt(i), value: bytes[i] });
    }
  };
  const tick = () => { check(budget && ++budget.steps <= maxSteps, 'TRAP', 'Prototype execution budget exhausted'); };
  const allocate = (size, alignment = 1, kind = 'heap', bytes = null) => {
    const n = ownNode(), width = count(size);
    const align = count(alignment);
    check((BigInt(align) & (BigInt(align) - 1n)) === 0n && align <= 16 * 1024 * 1024,
      'ALIGNMENT', 'Alignment must be a supported power of two');
    check(width <= 16 * 1024 * 1024, 'TRAP', 'Prototype allocation bound exceeded');
    const key = `${context.path}/allocation:${kind}`;
    let base = n.identities.get(key) ?? replayPool?.nodes.get(n.id)?.identities.get(key);
    if (base === undefined) {
      base = nextAddress; nextAddress += 16n * 1024n * 1024n;
      check(nextAddress < (1n << 50n), 'TRAP', 'Prototype address reservation exhausted');
    }
    n.identities.set(key, base);
    const previous = world.allocations.get(base);
    check(!previous || !previous.live, 'ALLOCATION', 'Repeated live allocation identity');
    const data = bytes ? new Uint8Array(bytes) : new Uint8Array(width);
    world.allocations.set(base, { base, size: width, alignment: align, owner: n.id, kind,
      live: true, readonly: kind === 'arguments', bytes: data,
      producers: Array.from(data, () => context.path) });
    if (context.record) for (let i = 0; i < width; i++) context.record.writes.push({ address: base + BigInt(i), value: data[i] });
    return base;
  };
  const builtins = Object.freeze({
    builtin_temporal_global(base, bytes, byteCount) {
      check(arguments.length === 3 && !sealed && !context, 'BOOTSTRAP', 'Globals must be registered before using the runtime');
      const p = pointer(base), data = snapshot(bytes, count(byteCount));
      check(p > 0n && p + BigInt(data.length) < (1n << 32n), 'BOUNDS', 'Globals must lie below the heap range');
      for (const a of globals.values()) check(p + BigInt(data.length) <= a.base || a.base + BigInt(a.size) <= p,
        'OVERLAP', 'Global allocation ranges overlap');
      const a = { base: p, size: data.length, alignment: 1, owner: 0n, kind: 'global', live: true,
        readonly: false, bytes: data, producers: Array.from(data, (_, i) => `global:${p}:${i}`) };
      globals.set(p, a); world.allocations.set(p, cloneAllocation(a));
    },
    builtin_temporal_alloc(size, alignment) { check(arguments.length === 2, 'ARITY', 'alloc expects size and alignment'); return allocate(size, alignment); },
    builtin_temporal_free(p) {
      check(arguments.length === 1, 'ARITY', 'free expects one argument'); ownNode();
      const { a, address } = allocation(p, 1, { write: true });
      check(a.kind === 'heap' && address === a.base, 'BAD_FREE', 'free requires the base of a live owned heap allocation'); a.live = false;
    },
    builtin_temporal_load(p, width) {
      check(arguments.length === 2 && [1, 2, 4, 8].includes(width), 'BAD_WIDTH', 'Scalar load expects width 1, 2, 4, or 8'); ownNode();
      const bytes = readBytes(p, width); let value = 0n;
      for (let i = width - 1; i >= 0; i--) value = (value << 8n) | BigInt(bytes[i]); return value;
    },
    builtin_temporal_store(p, value, width) {
      check(arguments.length === 3 && [1, 2, 4, 8].includes(width), 'BAD_WIDTH', 'Scalar store expects width 1, 2, 4, or 8'); ownNode();
      let v = u64(value); const bytes = new Uint8Array(width);
      for (let i = 0; i < width; i++) { bytes[i] = Number(v & 255n); v >>= 8n; }
      putBytes(p, bytes, context.path);
    },
  });
  const visit = (id, anchor) => {
    const pending = [{ anchor }];
    while (pending.length) {
      const item = pending.pop(), n = node(id);
      if (item.patch) {
        const patch = item.patch; tick();
        putBytes(patch.destination, patch.bytes, `patch:${patch.id}`, id);
        n.trace.push({ id: `patch:${patch.id}`, op: 'intervention', reads: [],
          writes: [...patch.bytes].map((value, i) => ({ address: patch.destination + BigInt(i), value })),
          operands: patch.sourceProducer ? [patch.sourceProducer] : [], controls: [] });
        pending.push({ anchor: `patch:${patch.id}/after` }); continue;
      }
      n.reached.add(item.anchor); n.tail = item.anchor;
      const oldPoint = replayPool?.nodes.get(id)?.points.get(item.anchor);
      if (oldPoint !== undefined && !n.points.has(item.anchor)) n.points.set(item.anchor, oldPoint);
      const patches = n.patches.filter(p => p.anchor === item.anchor);
      for (let i = patches.length - 1; i >= 0; i--) pending.push({ patch: patches[i] });
    }
  };
  const cleanPoints = (n) => {
    for (const key of n.points.keys()) if (!n.reached.has(key)) n.points.delete(key);
    for (const p of n.patches) check(n.reached.has(p.anchor), 'ORPHANED_POINT', 'An intervention point disappeared');
  };
  const executeFunction = (history, name, args, path, controls = [], argumentProducers = []) => {
    const fn = Object.hasOwn(program.functions, name) ? program.functions[name] : null;
    check(fn && args.length === fn.params.length, 'BAD_CALL', 'Unknown function or wrong argument count');
    budget.depth++;
    const previousContext = context;
    const regs = new Map(fn.params.map((p, i) => [p, { value: args[i], producer: `${path}/arg:${i}` }]));
    for (let i = 0; i < fn.params.length; i++) node(history).trace.push({
      id: `${path}/arg:${i}`, op: 'parameter', reads: [], writes: [],
      operands: argumentProducers[i] ? [argumentProducers[i]] : [], controls: [...controls] });
    const operand = (o, record) => {
      if (o && typeof o === 'object') {
        check(Object.keys(o).length === 1 && typeof o.reg === 'string' && regs.has(o.reg), 'BAD_REGISTER', 'Unknown or malformed register');
        const r = regs.get(o.reg); if (record) record.operands.push(r.producer); return r.value;
      }
      check(o === null || ['string', 'number', 'bigint'].includes(typeof o), 'BAD_OPERAND', 'Invalid operand'); return o;
    };
    let returned = false, result = 0n, resultProducer = null;
    const block = (body, prefix, activeControls) => {
      budget.blocks++;
      try {
        check(budget.blocks <= 256, 'TRAP', 'Prototype structural-depth budget exhausted');
      for (const ins of body) {
        if (returned) break; tick(); const ip = `${prefix}/${ins.id}`;
        const record = { id: ip, op: ins.op, reads: [], writes: [], operands: [], controls: [...activeControls] };
        context = { history, path: ip, boundary: `${ip}/after`, record };
        const get = (o) => operand(o, record);
        const set = (value) => { if (ins.dst !== undefined) regs.set(ins.dst, { value, producer: ip }); };
        switch (ins.op) {
          case 'const': set(get(ins.value)); break;
          case 'load': set(builtins.builtin_temporal_load(get(ins.addr), ins.width)); break;
          case 'store': builtins.builtin_temporal_store(get(ins.addr), get(ins.value), ins.width); break;
          case 'alloc': set(builtins.builtin_temporal_alloc(get(ins.size), get(ins.alignment ?? 1))); break;
          case 'free': builtins.builtin_temporal_free(get(ins.addr)); break;
          case 'add': set(u64(u64(get(ins.a)) + u64(get(ins.b)))); break;
          case 'sub': set(u64(u64(get(ins.a)) - u64(get(ins.b)))); break;
          case 'mul': set(u64(u64(get(ins.a)) * u64(get(ins.b)))); break;
          case 'and': set(u64(get(ins.a)) & u64(get(ins.b))); break;
          case 'xor': set(u64(get(ins.a)) ^ u64(get(ins.b))); break;
          case 'eq': {
            const a = get(ins.a), b = get(ins.b);
            const numeric = v => v === null || typeof v === 'number' || typeof v === 'bigint';
            set((numeric(a) && numeric(b) ? u64(a ?? 0n) === u64(b ?? 0n) : a === b) ? 1n : 0n); break;
          }
          case 'lt': set(u64(get(ins.a)) < u64(get(ins.b)) ? 1n : 0n); break;
          case 'if': {
            const yes = u64(get(ins.cond)) !== 0n;
            node(history).trace.push(record);
            block(yes ? ins.then : (ins.else ?? []), `${ip}/${yes ? 'then' : 'else'}`, [...activeControls, ip]);
            visit(history, `${ip}/after`); continue;
          }
          case 'repeat': {
            const times = index(get(ins.count)); check(times <= maxSteps, 'TRAP', 'Prototype loop bound exhausted');
            node(history).trace.push(record);
            for (let i = 0; i < times && !returned; i++) {
              node(history).trace.push({ id: `${ip}/iteration:${i}`, op: 'iteration', reads: [], writes: [],
                operands: [ip], controls: [...activeControls] });
              regs.set(ins.index, { value: BigInt(i), producer: `${ip}/iteration:${i}` });
              block(ins.body, `${ip}/iteration:${i}`, [...activeControls, ip]);
            }
            visit(history, `${ip}/after`); continue;
          }
          case 'call': {
            const callName = typeof ins.fn === 'string' ? ins.fn : get(ins.fn);
            const callArgs = (ins.args ?? []).map(get);
            const producers = (ins.args ?? []).map(o => o && typeof o === 'object' ? regs.get(o.reg).producer : null);
            const entry = `${ip}/entry`;
            node(history).trace.push({ id: entry, op: 'call-entry', reads: [], writes: [],
              operands: [...record.operands], controls: [...activeControls] });
            const callResult = executeFunction(history, callName, callArgs, `${ip}/call:${callName}`, [...activeControls, entry], producers);
            if (callResult.producer) record.operands.push(callResult.producer); set(callResult.value); break;
          }
          case 'temporal': {
            check(Object.hasOwn(api, ins.name), 'BAD_API', 'Unknown user operation');
            set(api[ins.name](...ins.args.map(get))); break;
          }
          case 'return': result = get(ins.value); resultProducer = ip; returned = true; break;
        }
        context = { history, path: ip, boundary: `${ip}/after`, record };
        node(history).trace.push(record); visit(history, `${ip}/after`);
      }
      } finally { budget.blocks--; }
    };
    try {
      check(budget.depth <= maxDepth, 'TRAP', 'Prototype call-depth budget exhausted');
      block(fn.body, path, controls); return { value: result, producer: resultProducer };
    }
    finally { context = previousContext; budget.depth--; }
  };
  const replay = (id) => {
    const previousPool = replayPool, previousContext = context;
    const old = node(id), descendants = new Set([...world.nodes.keys()].filter(h => ancestor(id, h)));
    const poolNodes = new Map(previousPool?.nodes ?? []);
    for (const [h, current] of world.nodes) {
      const older = poolNodes.get(h);
      poolNodes.set(h, older ? { ...current,
        identities: new Map([...older.identities, ...current.identities]),
        points: new Map([...older.points, ...current.points]) } : { ...current,
        identities: new Map(current.identities), points: new Map(current.points) });
    }
    replayPool = { nodes: poolNodes };
    for (const h of descendants) if (h !== id) world.nodes.get(h).alive = false;
    for (const [base, a] of world.allocations) if (descendants.has(a.owner)) world.allocations.delete(base);
    const fresh = freshNode(id, old.parent); fresh.events = old.events; fresh.patches = old.patches;
    fresh.openEdit = old.openEdit; world.nodes.set(id, fresh);
    if (id === 0n) for (const [base, a] of globals) world.allocations.set(base, cloneAllocation(a));
    try {
      context = null; visit(id, 'start');
      for (const event of fresh.events) {
        const prefix = `run:${event.id}`;
        context = { history: id, path: `${prefix}/arguments`, boundary: `${prefix}/arguments/after`, record: null };
        const argumentPointer = event.args.length ? allocate(event.args.length, 1, 'arguments', event.args) : 0n;
        node(id).trace.push({ id: `${prefix}/arguments`, op: 'argument-storage', reads: [],
          writes: [...event.args].map((value, i) => ({ address: argumentPointer + BigInt(i), value })),
          operands: event.sourceProducer ? [event.sourceProducer] : [], controls: [] });
        const outcome = executeFunction(id, event.fn, [argumentPointer], `${prefix}/fn:${event.fn}`, [], [`${prefix}/arguments`]);
        const value = u64(outcome.value ?? 0n);
        if (argumentPointer) world.allocations.get(argumentPointer).live = false;
        node(id).results.push(value); node(id).resultProducers.push(outcome.producer);
        context = null; visit(id, `${prefix}/end`);
      }
      cleanPoints(node(id));
      return node(id).results.at(-1) ?? 0n;
    } finally { context = previousContext; replayPool = previousPool; }
  };
  const transactional = (fn) => {
    const before = world; world = cloneWorld(world);
    const oldBudget = budget; if (!budget) budget = { steps: 0, depth: 0, blocks: 0 };
    try { return fn(); } catch (error) { world = before; throw error; }
    finally { budget = oldBudget; }
  };
  const editInfo = (e) => {
    token(e, 'Edit'); const info = world.edits.get(e);
    check(info, 'BAD_EDIT', 'Edit is closed or foreign'); controlled(info.history); return info;
  };
  const methods = {
    temporal_create() {
      const owner = context ? node(context.history) : null;
      const id = owner ? identity(owner, `${context.path}/create`, 'History') : handle('History', { host: true });
      world.nodes.set(id, freshNode(id, owner?.id ?? 'host')); return id;
    },
    temporal_destroy(h) {
      const n = controlled(h); check(n.id !== 0n, 'ROOT', 'The default history cannot be destroyed'); noEdits(n.id);
      const ids = new Set([...world.nodes.keys()].filter(id => ancestor(n.id, id)));
      for (const id of ids) world.nodes.get(id).alive = false;
      for (const a of world.allocations.values()) if (ids.has(a.owner)) a.live = false;
    },
    temporal_run(h, fn, args, argumentByteCount) {
      const n = controlled(h); noEdits(n.id);
      check(typeof fn === 'string' && Object.hasOwn(program.functions, fn) && program.functions[fn].params.length === 1,
        'BAD_CALL', 'History entry must name a one-argument opcode function');
      const width = index(argumentByteCount);
      const readStart = context?.record?.reads.length ?? 0;
      const data = width ? sourceBytes(args, width) : new Uint8Array();
      const sourceProducer = context ? `${context.path}/captured-arguments` : null;
      if (context) node(context.history).trace.push({ id: sourceProducer, op: 'argument-capture',
        reads: context.record.reads.slice(readStart), writes: [], operands: [...context.record.operands],
        controls: [...context.record.controls] });
      const eventId = context ? identity(node(context.history), `${context.path}/run-event`, 'Run') : handle('Run', { host: true });
      n.events.push({ id: eventId, fn, args: data, sourceProducer });
      const result = transactional(() => {
        const value = replay(n.id);
        for (const open of world.edits.values()) check(!ancestor(n.id, open.history), 'OPEN_EDIT', 'A descendant edit was left open');
        return value;
      });
      const producer = node(n.id).resultProducers.at(-1);
      if (producer && context?.record) context.record.operands.push(producer);
      return result;
    },
    temporal_point(h) {
      const n = node(h);
      const self = context && n.id === context.history;
      if (!self) controlled(h);
      const anchor = self ? context.boundary : n.tail;
      let id = n.points.get(anchor) ?? replayPool?.nodes.get(n.id)?.points.get(anchor);
      if (id === undefined) id = handle('Point', { history: n.id, anchor });
      n.points.set(anchor, id); return id;
    },
    temporal_edit(h) {
      const n = controlled(h); noEdits(n.id);
      const id = context ? identity(node(context.history), `${context.path}/edit`, 'Edit') : handle('Edit', { history: n.id });
      world.edits.set(id, { history: n.id, patches: n.patches.map(p => ({ ...p, bytes: new Uint8Array(p.bytes) })) });
      n.openEdit = id; return id;
    },
    temporal_store_at(e, p, destination, source, byteCount) {
      const info = editInfo(e), point = token(p, 'Point'), n = node(info.history);
      check(point.history === n.id && n.points.get(point.anchor) === p && n.reached.has(point.anchor),
        'BAD_POINT', 'Point is foreign or its original occurrence disappeared');
      const dest = pointer(destination), bytes = sourceBytes(source, byteCount);
      const id = context ? identity(node(context.history), `${context.path}/write`, 'Write', { target: n.id })
        : handle('Write', { target: n.id });
      check(!info.patches.some(x => x.id === id), 'DUPLICATE', 'Write occurrence already staged');
      info.patches.push({ id, anchor: point.anchor, destination: dest, bytes,
        sourceProducer: context?.path ?? null }); return id;
    },
    temporal_replace(e, w, source) {
      const info = editInfo(e); token(w, 'Write'); const p = info.patches.find(patch => patch.id === w);
      check(p, 'BAD_WRITE', 'Write is foreign, removed, or not in this edit'); p.bytes = sourceBytes(source, p.bytes.length);
      p.sourceProducer = context?.path ?? null;
    },
    temporal_remove(e, w) {
      const info = editInfo(e); token(w, 'Write'); const at = info.patches.findIndex(p => p.id === w);
      check(at >= 0, 'BAD_WRITE', 'Write is foreign or removed'); info.patches.splice(at, 1);
    },
    temporal_repair(e) {
      const info = editInfo(e), h = info.history;
      world.edits.delete(e); node(h).openEdit = null;
      try {
        transactional(() => {
          node(h).patches = info.patches; replay(h);
          for (const open of world.edits.values()) check(!ancestor(h, open.history), 'OPEN_EDIT', 'A descendant edit was left open');
        }); return Status.OK;
      } catch (error) {
        if (!(error instanceof TemporalError)) throw error;
        return error.code === 'ORPHANED_POINT' ? Status.ORPHANED_POINT : Status.TRAP;
      }
    },
    temporal_cancel(e) { const info = editInfo(e); world.edits.delete(e); node(info.history).openEdit = null; },
  };
  const api = {};
  for (const [name, method] of Object.entries(methods)) {
    const wrapper = function (...args) {
      check(args.length === method.length, 'ARITY', `${name} expects ${method.length} arguments`); sealed = true;
      if (context) return method(...args);
      return transactional(() => method(...args));
    };
    Object.defineProperty(wrapper, 'length', { value: method.length }); api[name] = wrapper;
  }
  Object.freeze(api);
  const debug = Object.freeze({
    read(p, n) { check(!context, 'DEBUG', 'Debugger reads are outside execution'); return readBytes(p, n, false); },
    ownership(p, n = 1) { return allocation(p, n, { checkReader: false }).a.owner; },
    inspect(h) {
      const n = node(h);
      return { id: n.id, parent: n.parent, alive: n.alive, tail: n.tail,
        allocations: [...world.allocations.values()].filter(a => a.owner === n.id).map(a => ({ ...a, bytes: [...a.bytes], producers: [...a.producers] })),
        trace: structuredClone(n.trace), events: structuredClone(n.events), patches: structuredClone(n.patches),
        points: [...n.points].map(([anchor, id]) => ({ anchor, id })), results: [...n.results] };
    },
  });
  return Object.freeze({ builtins, api, debug });
}
