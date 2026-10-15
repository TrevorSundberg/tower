/**
 * Executable, deliberately conservative temporal API specification.
 * See temporal-model-contract.md. No application-specific dependency hooks.
 * This reconstructs memory and scans all executed instructions on repair.
 * Its cache avoids selected result calculations, NOT the reconstruction scan.
 */

const timelines = new WeakMap();
const edits = new WeakMap();
const tokens = new WeakMap();
const SAFE_NAME = /^[A-Za-z0-9_.:-]+$/;
const OPS = new Set(['const', 'load', 'store', 'add', 'sub', 'mul', 'and', 'xor',
  'eq', 'lt', 'if', 'repeat', 'call', 'return', 'mark']);

export class TemporalError extends Error {
  constructor(code, message) { super(`${code}: ${message}`); this.code = code; }
}
const fail = (code, message) => { throw new TemporalError(code, message); };
const requireThat = (test, code, message) => { if (!test) fail(code, message); };
const copy = (value) => structuredClone(value);

function integer(value) {
  requireThat(typeof value === 'bigint' || (typeof value === 'number' && Number.isSafeInteger(value)),
    'BAD_PROGRAM', 'Expected an exact integer');
  return BigInt.asUintN(64, BigInt(value));
}

function checkedAddress(addr, width, length) {
  requireThat(Number.isSafeInteger(addr) && addr >= 0 && addr <= length &&
    Number.isSafeInteger(width) && width >= 0 && width <= length - addr,
  'BOUNDS', `Invalid byte range ${addr}+${width} in ${length} bytes`);
  return addr;
}

function payload(bytes) {
  requireThat(bytes instanceof Uint8Array, 'BAD_BYTES', 'Payload must be a Uint8Array');
  // Buffer is a Uint8Array subclass, but Buffer.slice() aliases the input.
  // Construct a plain typed array instead of dispatching a virtual slice method.
  return new Uint8Array(bytes);
}

function checkedProgram(program) {
  let result;
  try { result = copy(program); } catch { fail('BAD_PROGRAM', 'Program must be cloneable data'); }
  requireThat(result && result.functions && typeof result.functions === 'object' && !Array.isArray(result.functions),
    'BAD_PROGRAM', 'Missing functions');
  for (const [name, fn] of Object.entries(result.functions)) {
    requireThat(SAFE_NAME.test(name) && fn && Array.isArray(fn.params) && Array.isArray(fn.body),
      'BAD_PROGRAM', `Malformed function ${name}`);
    requireThat(fn.params.every((p) => typeof p === 'string' && p.length > 0) && new Set(fn.params).size === fn.params.length,
      'BAD_PROGRAM', `Invalid parameters in ${name}`);
    const ids = new Set();
    const operand = (value) => {
      if (value && typeof value === 'object') requireThat(!Array.isArray(value) &&
        typeof value.reg === 'string' && value.reg.length > 0, 'BAD_PROGRAM', 'Invalid register operand');
      else integer(value);
    };
    const destination = (name) => requireThat(typeof name === 'string' && name.length > 0,
      'BAD_PROGRAM', 'Invalid destination register');
    const blocks = [fn.body];
    while (blocks.length) {
      const body = blocks.pop();
      requireThat(Array.isArray(body), 'BAD_PROGRAM', 'Block must be an array');
      for (const ins of body) {
        requireThat(ins && typeof ins.id === 'string' && SAFE_NAME.test(ins.id) && !ids.has(ins.id),
          'BAD_PROGRAM', `Duplicate or unsafe instruction identity in ${name}`);
        ids.add(ins.id);
        requireThat(OPS.has(ins.op), 'BAD_PROGRAM', `Unsupported opcode ${ins.op}`);
        switch (ins.op) {
          case 'const': destination(ins.dst); operand(ins.value); break;
          case 'load': case 'store':
            requireThat([1, 2, 4, 8].includes(ins.width), 'BAD_PROGRAM', 'Invalid memory access width');
            operand(ins.addr);
            if (ins.op === 'load') destination(ins.dst); else operand(ins.value);
            break;
          case 'add': case 'sub': case 'mul': case 'and': case 'xor': case 'eq': case 'lt':
            destination(ins.dst); operand(ins.a); operand(ins.b); break;
          case 'if': operand(ins.cond); blocks.push(ins.then, ins.else ?? []); break;
          case 'repeat': operand(ins.count); destination(ins.index); blocks.push(ins.body); break;
          case 'call':
            destination(ins.dst);
            if (typeof ins.fn === 'string') requireThat(SAFE_NAME.test(ins.fn), 'BAD_PROGRAM', 'Invalid call target');
            else operand(ins.fn);
            requireThat(ins.args === undefined || Array.isArray(ins.args), 'BAD_PROGRAM', 'Call arguments must be an array');
            for (const arg of ins.args ?? []) operand(arg);
            break;
          case 'return': operand(ins.value); break;
          case 'mark': requireThat(typeof ins.label === 'string', 'BAD_PROGRAM', 'Mark label must be text'); break;
        }
      }
    }
  }
  return result;
}

// Independent of the reference interpreter: a forward trace/cache executor.
function execute(program, history, previousCache = new Map()) {
  const memory = history.initial.slice();
  const sources = Array.from(memory, (_, i) => `init:${i}`);
  const trace = [];
  const marks = [];
  const results = new Map();
  const cache = new Map();
  const patches = new Map();
  const encountered = new Set();
  const stats = { visitedInstructions: 0, byteReads: 0, byteWrites: 0,
    resultCacheHits: 0, resultCacheMisses: 0, cacheMissKeys: [],
    createdOccurrences: 0, removedOccurrences: 0 };
  for (const patch of history.patches) {
    if (!patches.has(patch.at)) patches.set(patch.at, []);
    patches.get(patch.at).push(patch);
  }

  function record(key, op) {
    requireThat(trace.length < history.maxSteps, 'STEP_LIMIT', 'Execution budget exceeded');
    const entry = { key, op, value: null, reads: [], writes: [] };
    trace.push(entry);
    stats.visitedInstructions += 1;
    return entry;
  }

  function result(entry, args, compute) {
    const old = previousCache.get(entry.key);
    const equal = old?.op === entry.op && old.args.length === args.length &&
      args.every((value, i) => value === old.args[i]);
    let value;
    if (equal) { value = old.value; stats.resultCacheHits += 1; }
    else {
      value = compute();
      stats.resultCacheMisses += 1;
      stats.cacheMissKeys.push(entry.key);
      if (!old) stats.createdOccurrences += 1;
    }
    cache.set(entry.key, { op: entry.op, args, value });
    entry.value = value;
    return value;
  }

  function put(entry, addr, bytes) {
    checkedAddress(addr, bytes.length, memory.length);
    for (let i = 0; i < bytes.length; i += 1) {
      memory[addr + i] = bytes[i];
      sources[addr + i] = entry.key;
      entry.writes.push({ addr: addr + i, value: bytes[i], source: entry.key });
      stats.byteWrites += 1;
    }
  }

  function external(event) {
    const entry = record(`write:${event.id}`, 'external-store');
    result(entry, [event.addr, ...event.bytes], () => null);
    put(entry, event.addr, event.bytes);
  }

  function* runFunction(name, args, prefix, depth) {
    requireThat(depth <= history.maxDepth, 'DEPTH_LIMIT', 'Call depth budget exceeded');
    const fn = Object.hasOwn(program.functions, name) ? program.functions[name] : null;
    requireThat(fn && args.length === fn.params.length, 'BAD_PROGRAM', `Unknown target or wrong arity: ${name}`);
    const regs = new Map(fn.params.map((param, i) => [param, integer(args[i])]));
    const read = (operand) => {
      if (operand && typeof operand === 'object' && typeof operand.reg === 'string') {
        requireThat(regs.has(operand.reg), 'UNDEFINED_REGISTER', operand.reg);
        return regs.get(operand.reg);
      }
      return integer(operand);
    };
    const set = (dst, value) => {
      requireThat(typeof dst === 'string', 'BAD_PROGRAM', 'Missing destination register');
      regs.set(dst, value);
    };

    function* block(body, path) {
      for (const ins of body) {
        const key = `${path}/${ins.id}`;
        const entry = record(key, ins.op);
        switch (ins.op) {
          case 'const': {
            const value = read(ins.value);
            set(ins.dst, result(entry, [value], () => value));
            break;
          }
          case 'load': {
            requireThat([1, 2, 4, 8].includes(ins.width), 'BAD_PROGRAM', 'Invalid load width');
            const raw = read(ins.addr);
            const addr = checkedAddress(Number(raw), ins.width, memory.length);
            const bytes = [];
            for (let i = 0; i < ins.width; i += 1) {
              bytes.push(memory[addr + i]);
              entry.reads.push({ addr: addr + i, value: memory[addr + i], source: sources[addr + i] });
              stats.byteReads += 1;
            }
            set(ins.dst, result(entry, [addr, ins.width, ...bytes], () => {
              let value = 0n;
              for (let i = bytes.length - 1; i >= 0; i -= 1) value = (value << 8n) | BigInt(bytes[i]);
              return value;
            }));
            break;
          }
          case 'store': {
            requireThat([1, 2, 4, 8].includes(ins.width), 'BAD_PROGRAM', 'Invalid store width');
            const addr = checkedAddress(Number(read(ins.addr)), ins.width, memory.length);
            const value = read(ins.value);
            const bytes = new Uint8Array(ins.width);
            let rest = value;
            for (let i = 0; i < bytes.length; i += 1) { bytes[i] = Number(rest & 255n); rest >>= 8n; }
            result(entry, [addr, ...bytes], () => null);
            // A cache hit NEVER means the historical effect may be omitted.
            put(entry, addr, bytes);
            break;
          }
          case 'add': case 'sub': case 'mul': case 'and': case 'xor': case 'eq': case 'lt': {
            const a = read(ins.a), b = read(ins.b);
            set(ins.dst, result(entry, [a, b], () => {
              switch (ins.op) {
                case 'add': return BigInt.asUintN(64, a + b);
                case 'sub': return BigInt.asUintN(64, a - b);
                case 'mul': return BigInt.asUintN(64, a * b);
                case 'and': return a & b;
                case 'xor': return a ^ b;
                case 'eq': return a === b ? 1n : 0n;
                case 'lt': return a < b ? 1n : 0n;
              }
            }));
            break;
          }
          case 'if': {
            const cond = read(ins.cond);
            result(entry, [cond], () => cond);
            const returned = yield* block(cond !== 0n ? ins.then : (ins.else ?? []), `${key}?${cond !== 0n ? 1 : 0}`);
            if (returned) return returned;
            break;
          }
          case 'repeat': {
            const count = read(ins.count);
            requireThat(count <= BigInt(history.maxSteps), 'STEP_LIMIT', 'Repeat count exceeds budget');
            result(entry, [count], () => count);
            for (let i = 0n; i < count; i += 1n) {
              set(ins.index, i);
              const returned = yield* block(ins.body, `${key}#${i}`);
              if (returned) return returned;
            }
            break;
          }
          case 'call': {
            const name = typeof ins.fn === 'string' ? ins.fn : String(read(ins.fn));
            const args = (ins.args ?? []).map(read);
            // Always visit the callee, including its memory effects, before reuse.
            const value = yield { name, args, prefix: `${key}@${name}`, depth: depth + 1 };
            set(ins.dst, result(entry, [name, ...args, value], () => value));
            break;
          }
          case 'return': {
            const value = read(ins.value);
            return { value: result(entry, [value], () => value) };
          }
          case 'mark': {
            const label = ins.label ?? ins.id;
            requireThat(typeof label === 'string', 'BAD_PROGRAM', 'Mark label must be text');
            marks.push({ key, label });
            result(entry, [], () => null);
            for (const patch of patches.get(key) ?? []) {
              requireThat(!encountered.has(patch.id), 'BAD_PROGRAM', 'Duplicate patch execution');
              encountered.add(patch.id);
              external(patch);
            }
            break;
          }
          default: fail('BAD_PROGRAM', `Unsupported opcode ${ins.op}`);
        }
      }
      return null;
    }
    return (yield* block(fn.body, prefix))?.value ?? 0n;
  }

  // Generator trampoline: modeled recursion must not inherit the JavaScript
  // host's shallower native call-stack limit. The model's own budgets still apply.
  function invoke(name, args, prefix) {
    const stack = [runFunction(name, args, prefix, 1)];
    let returned;
    while (stack.length) {
      const step = stack.at(-1).next(returned);
      if (step.done) { stack.pop(); returned = step.value; }
      else {
        const child = step.value;
        stack.push(runFunction(child.name, child.args, child.prefix, child.depth));
        returned = undefined;
      }
    }
    return returned;
  }

  for (const event of history.events) {
    if (event.kind === 'write') external(event);
    else if (event.kind === 'call') results.set(event.id,
      invoke(event.fn, event.args, `${event.id}/${event.fn}`));
    else fail('BAD_PROGRAM', `Unsupported event ${event.kind}`);
  }
  requireThat(encountered.size === history.patches.length, 'ORPHANED_POINT', 'An intervention mark no longer executes');
  for (const key of previousCache.keys()) if (!cache.has(key)) stats.removedOccurrences += 1;
  return { memory, sources, trace, marks, results, stats, cache };
}

function timeline(t) {
  const state = timelines.get(t);
  requireThat(state && !state.destroyed, 'INVALID_TIMELINE', 'Unknown or destroyed timeline');
  return state;
}
function editable(edit) {
  const state = edits.get(edit);
  requireThat(state && !state.closed, 'INVALID_EDIT', 'Unknown or consumed edit');
  timeline(state.owner);
  return state;
}
function idle(state) { requireThat(!state.edit, 'EDIT_OPEN', 'Finish the open edit first'); }
function eventSet(history) { return new Set([...history.events, ...history.patches].map((event) => event.id)); }
function newId(state, prefix) { return `${prefix}${state.nextId++}`; }
function makeWrite(state, owner, id, provisional = null) {
  const handle = Object.freeze({ kind: 'Write', id });
  tokens.set(handle, { kind: 'Write', owner, id, live: false, provisional });
  state.writeHandles.set(id, handle);
  return handle;
}
function publish(state, history, frame) {
  state.history = history;
  state.frame = frame;
  state.revision += 1;
  const present = eventSet(history);
  for (const [id, token] of state.writeHandles) {
    const info = tokens.get(token);
    info.live = present.has(id);
    info.provisional = null;
  }
}
function lookupWrite(edit, handle) {
  const info = tokens.get(handle);
  requireThat(info?.kind === 'Write' && info.owner === edit.owner &&
    (info.live || info.provisional === edit.token), 'INVALID_WRITE', 'Wrong-owner, removed, forged or provisional write');
  const event = [...edit.history.events, ...edit.history.patches].find((event) => event.id === info.id);
  requireThat(event?.kind === 'write', 'INVALID_WRITE', 'Write was removed from this candidate');
  return event;
}

export function temporal_create(program, options = {}) {
  if (options.memorySize !== undefined) requireThat(Number.isSafeInteger(options.memorySize) && options.memorySize >= 0,
    'BOUNDS', 'Memory size must be a nonnegative safe integer');
  const initial = options.initialMemory === undefined
    ? new Uint8Array(options.memorySize ?? 64) : payload(options.initialMemory);
  if (options.memorySize !== undefined) requireThat(options.memorySize === initial.length,
    'BOUNDS', 'Initial memory size mismatch');
  const history = { initial, events: [], patches: [],
    maxSteps: options.maxSteps ?? 100000, maxDepth: options.maxDepth ?? 128 };
  for (const limit of [history.maxSteps, history.maxDepth]) requireThat(Number.isSafeInteger(limit) && limit > 0,
    'BAD_PROGRAM', 'Limits must be positive safe integers');
  const t = Object.freeze({ kind: 'Timeline' });
  const compiled = checkedProgram(program);
  const state = { program: compiled, history, frame: execute(compiled, history), revision: 0,
    nextId: 1, edit: null, destroyed: false, writeHandles: new Map() };
  timelines.set(t, state);
  return t;
}

export function temporal_write(t, address, bytes) {
  const state = timeline(t);
  idle(state);
  const data = payload(bytes);
  checkedAddress(address, data.length, state.history.initial.length);
  const id = newId(state, 'w');
  const history = copy(state.history);
  history.events.push({ kind: 'write', id, addr: address, bytes: data });
  const frame = execute(state.program, history, state.frame.cache);
  const handle = makeWrite(state, t, id);
  publish(state, history, frame);
  return handle;
}

export function temporal_call(t, functionName, args = []) {
  const state = timeline(t);
  idle(state);
  requireThat(typeof functionName === 'string' && Array.isArray(args), 'BAD_PROGRAM', 'Malformed invocation');
  const id = newId(state, 'i');
  const history = copy(state.history);
  // Do not call methods on the caller's Array subclass: an overridden map()
  // could return the original object and retain a mutable host alias.
  const capturedArgs = [];
  const count = args.length;
  for (let i = 0; i < count; i += 1) capturedArgs.push(integer(args[i]));
  history.events.push({ kind: 'call', id, fn: functionName, args: capturedArgs });
  const frame = execute(state.program, history, state.frame.cache);
  publish(state, history, frame);
  return frame.results.get(id);
}

export function temporal_edit(t) {
  const state = timeline(t);
  idle(state);
  const edit = Object.freeze({ kind: 'Edit' });
  edits.set(edit, { owner: t, token: edit, history: copy(state.history), created: [], closed: false });
  state.edit = edit;
  return edit;
}

export function temporal_replace(edit, write, bytes) {
  const candidate = editable(edit);
  const event = lookupWrite(candidate, write);
  const data = payload(bytes);
  requireThat(data.length === event.bytes.length, 'SIZE_MISMATCH', 'Replacement size must match');
  event.bytes = data;
}

export function temporal_store_at(edit, point, address, bytes) {
  const candidate = editable(edit);
  const state = timeline(candidate.owner);
  const info = tokens.get(point);
  requireThat(info?.kind === 'Point' && info.owner === candidate.owner && info.revision === state.revision,
    'INVALID_POINT', 'Wrong-owner, stale or forged point');
  const data = payload(bytes);
  checkedAddress(address, data.length, state.history.initial.length);
  const id = newId(state, 'w');
  candidate.history.patches.push({ kind: 'write', id, at: info.key, addr: address, bytes: data });
  const handle = makeWrite(state, candidate.owner, id, edit);
  candidate.created.push(handle);
  return handle;
}

export function temporal_remove(edit, write) {
  const candidate = editable(edit);
  const event = lookupWrite(candidate, write);
  candidate.history.events = candidate.history.events.filter((item) => item.id !== event.id);
  candidate.history.patches = candidate.history.patches.filter((item) => item.id !== event.id);
}

function close(candidate) {
  const state = timeline(candidate.owner);
  for (const handle of candidate.created) {
    const info = tokens.get(handle);
    if (info.provisional === candidate.token) { info.provisional = null; info.live = false; }
  }
  candidate.closed = true;
  state.edit = null;
}

export function temporal_repair(edit) {
  const candidate = editable(edit);
  const state = timeline(candidate.owner);
  try {
    const frame = execute(state.program, candidate.history, state.frame.cache);
    publish(state, candidate.history, frame);
    return copy(frame.stats);
  } finally { close(candidate); }
}

export function temporal_cancel(edit) { close(editable(edit)); }

export function temporal_points(t, label) {
  const state = timeline(t);
  return state.frame.marks.filter((mark) => label === undefined || mark.label === label).map((mark) => {
    const handle = Object.freeze({ kind: 'Point', ...mark });
    tokens.set(handle, { kind: 'Point', owner: t, revision: state.revision, key: mark.key });
    return handle;
  });
}

export function temporal_inspect(t) {
  const state = timeline(t);
  const { cache, ...frame } = state.frame;
  return copy({ ...frame, revision: state.revision });
}

export function temporal_destroy(t) {
  const state = timeline(t);
  idle(state);
  state.destroyed = true;
  state.history = null;
  state.frame = null;
  state.program = null;
  for (const token of state.writeHandles.values()) tokens.get(token).live = false;
  state.writeHandles.clear();
}
