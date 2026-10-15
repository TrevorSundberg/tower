/**
 * Independent, uncached fresh-replay oracle for the nested temporal prototype.
 *
 * There are deliberately no imports from the prototype, its bytecode model,
 * or its private state. Input is a program plus externally supplied ROOT input
 * writes and one root invocation. Output is a plain tree of byte memories and
 * invocation results. Public handle identities/revisions are not an oracle
 * output: the separate adversarial suite checks that part of the contract.
 *
 * Supported: exact u64 register arithmetic, little-endian overlapping 1/2/4/8
 * byte loads/stores, structured control flow, ordinary calls, marks, typed
 * locations, child entry, and the complete nested temporal command surface.
 * No native pointers, FFI, scheduling, or claimed incremental optimization.
 * maxDepth bounds both ordinary-call depth and owned-history depth separately;
 * this oracle does not assert equivalence of combined runtime fuel accounting.
 */

const TYPE_BYTES = Object.freeze({u8: 1, u16: 2, u32: 4, u64: 8, ptr: 8});
const STATUS = Object.freeze({
  OK: 'TEMPORAL_OK', ORPHAN: 'TEMPORAL_ORPHANED_POINT',
  TRAP: 'TEMPORAL_TRAP', LIMIT: 'TEMPORAL_LIMIT',
});

function reject(code, message) {
  const error = new Error(`Independent nested oracle: ${message}`);
  error.code = code;
  throw error;
}

function demand(test, code, message) {
  if (!test) reject(code, message);
}

function unsigned(value) {
  demand(typeof value === 'bigint' || Number.isSafeInteger(value),
    'BAD_PROGRAM', 'Expected an exact integer');
  return BigInt.asUintN(64, BigInt(value));
}

function range(memory, address, length) {
  const a = typeof address === 'bigint' ? address : BigInt(address);
  demand(a >= 0n && a <= BigInt(memory.length) &&
    Number.isSafeInteger(length) && length >= 0 && BigInt(length) <= BigInt(memory.length) - a,
  'BOUNDS', `Out-of-bounds range ${String(address)} + ${length}`);
  return Number(a);
}

function bytesFor(type, value) {
  const count = TYPE_BYTES[type];
  demand(count !== undefined, 'BAD_TYPE', `Unknown type ${String(type)}`);
  if (type === 'ptr') {
    if (value === null) value = 0n;
    else if (value && value.tag === 'location') value = BigInt(value.address);
  }
  let remaining = unsigned(value);
  const output = new Uint8Array(count);
  for (let i = 0; i < count; i++) {
    output[i] = Number(remaining & 255n);
    remaining >>= 8n;
  }
  return output;
}

/**
 * Execute root input writes followed by one root invocation from scratch.
 * null in bytecode always names the root; omitted load/location history names
 * the currently executing history. Children inherit the original memory image,
 * not the parent's current modified memory.
 *
 * @returns {{memory: Uint8Array, children: object[], result: unknown}}
 */
export function referenceNestedRun(program, options = {}) {
  demand(program && program.functions && typeof program.functions === 'object',
    'BAD_PROGRAM', 'Missing function definitions');
  const definitions = structuredClone(program.functions);
  const seed = options.initialMemory === undefined
    ? new Uint8Array(options.memorySize ?? 64)
    : new Uint8Array(options.initialMemory);
  if (options.memorySize !== undefined) demand(seed.length === options.memorySize,
    'BOUNDS', 'Initial memory size mismatch');
  const maxSteps = options.maxSteps ?? 100000;
  const maxDepth = options.maxDepth ?? 128;
  demand(Number.isSafeInteger(maxSteps) && maxSteps > 0 &&
    Number.isSafeInteger(maxDepth) && maxDepth > 0, 'BAD_PROGRAM', 'Invalid execution limits');
  let nextEvent = 1;
  let nextHistory = 1;

  function history(parent) {
    return {tag: 'history', number: nextHistory++, parent, dead: false,
      revision: 0, busy: false, edit: null, events: [], patches: [],
      published: {memory: new Uint8Array(seed), children: [], marks: [], result: 0n}};
  }
  const root = history(null);

  function resolve(value) {
    const h = value === null ? root : value;
    demand(h?.tag === 'history' && !h.dead, 'INVALID_HISTORY', 'Unknown or dead history');
    return h;
  }

  function controlled(current, target) {
    demand(current === null ? target === root || target.parent === null : target.parent === current,
      'HISTORY_ACCESS', 'Controller does not own this history');
    demand(!target.busy, 'HISTORY_BUSY', 'Cannot amend an executing history');
    return target;
  }

  function notEditing(target) {
    demand(target.edit === null, 'EDIT_OPEN', 'An edit is already open');
  }

  function location(current, value) {
    demand(value?.tag === 'location', 'INVALID_LOCATION', 'Expected typed location');
    const h = resolve(value.history);
    controlled(current, h);
    range(h.published.memory, value.address, TYPE_BYTES[value.type]);
    return value;
  }

  function die(h) {
    h.dead = true;
    for (const child of h.published.children) die(child);
  }

  function publish(h, events, patches, frame) {
    for (const oldChild of h.published.children) die(oldChild);
    h.events = events;
    h.patches = patches;
    h.published = frame;
    h.revision++;
  }

  function cloneEvent(e) {
    return e.kind === 'write' ? {...e, bytes: new Uint8Array(e.bytes)} : {...e, args: [...e.args]};
  }

  function editFor(current, e) {
    demand(e?.tag === 'edit' && !e.closed && !e.history.dead && e.history.edit === e,
      'INVALID_EDIT', 'Unknown or consumed edit');
    controlled(current, e.history);
    return e;
  }

  function findWrite(e, token) {
    demand(token?.tag === 'write' && token.history === e.history,
      'INVALID_WRITE', 'Write has wrong owner');
    const event = [...e.events, ...e.patches].find(item => item.id === token.id && item.kind === 'write');
    demand(event, 'INVALID_WRITE', 'Write no longer exists in candidate');
    return event;
  }

  function numeric(op, left, right) {
    if (op === 'eq' && (typeof left === 'string' || typeof right === 'string' ||
      left === null || right === null || typeof left === 'object' || typeof right === 'object')) {
      return left === right ? 1n : 0n;
    }
    const a = unsigned(left), b = unsigned(right);
    if (op === 'add') return BigInt.asUintN(64, a + b);
    if (op === 'sub') return BigInt.asUintN(64, a - b);
    if (op === 'mul') return BigInt.asUintN(64, a * b);
    if (op === 'and') return a & b;
    if (op === 'xor') return a ^ b;
    if (op === 'eq') return a === b ? 1n : 0n;
    if (op === 'lt') return a < b ? 1n : 0n;
    reject('BAD_PROGRAM', `Unsupported arithmetic ${op}`);
  }

  function perform(current, frame, name, args) {
    switch (name) {
      case 'temporal_create': {
        const h = history(current);
        frame.children.push(h);
        return h;
      }
      case 'temporal_destroy': {
        const h = controlled(current, resolve(args[0]));
        notEditing(h);
        die(h);
        return null;
      }
      case 'temporal_write': {
        const loc = location(current, args[0]);
        const h = loc.history;
        notEditing(h);
        const event = {kind: 'write', id: nextEvent++, address: loc.address,
          type: loc.type, bytes: bytesFor(loc.type, args[1])};
        const events = [...h.events, event];
        const fresh = replay(h, events, h.patches);
        publish(h, events, h.patches, fresh);
        return {tag: 'write', history: h, id: event.id};
      }
      case 'temporal_edit': {
        const h = controlled(current, resolve(args[0]));
        notEditing(h);
        const e = {tag: 'edit', history: h, closed: false,
          events: h.events.map(cloneEvent), patches: h.patches.map(cloneEvent)};
        h.edit = e;
        return e;
      }
      case 'temporal_replace': {
        const e = editFor(current, args[0]);
        const event = findWrite(e, args[1]);
        event.bytes = bytesFor(event.type, args[2]);
        return null;
      }
      case 'temporal_remove': {
        const e = editFor(current, args[0]);
        const event = findWrite(e, args[1]);
        e.events = e.events.filter(item => item.id !== event.id);
        e.patches = e.patches.filter(item => item.id !== event.id);
        return null;
      }
      case 'temporal_repair': {
        const e = editFor(current, args[0]);
        try {
          const fresh = replay(e.history, e.events, e.patches);
          publish(e.history, e.events, e.patches, fresh);
          return STATUS.OK;
        } catch (error) {
          if (error.code === 'ORPHANED_POINT') return STATUS.ORPHAN;
          if (error.code === 'STEP_LIMIT' || error.code === 'DEPTH_LIMIT') return STATUS.LIMIT;
          if (['BOUNDS', 'BAD_PROGRAM', 'BAD_TYPE', 'UNDEFINED_REGISTER',
            'HISTORY_ACCESS', 'HISTORY_BUSY', 'EDIT_OPEN', 'INVALID_HISTORY',
            'INVALID_LOCATION', 'INVALID_EDIT', 'INVALID_WRITE', 'INVALID_POINT'].includes(error.code)) return STATUS.TRAP;
          throw error;
        } finally {
          e.closed = true;
          e.history.edit = null;
        }
      }
      case 'temporal_cancel': {
        const e = editFor(current, args[0]);
        e.closed = true;
        e.history.edit = null;
        return null;
      }
      case 'temporal_point': {
        const h = resolve(args[0]);
        if (h !== current) controlled(current, h);
        const index = Number(args[2]);
        const marks = (h === current ? frame : h.published).marks.filter(mark => mark.label === args[1]);
        demand(Number.isSafeInteger(index) && index >= 0 && index < marks.length,
          'INVALID_POINT', 'No such mark occurrence');
        return {tag: 'point', history: h, revision: h.revision, anchor: marks[index].anchor};
      }
      case 'temporal_store_at': {
        const e = editFor(current, args[0]);
        const point = args[1];
        demand(point?.tag === 'point' && point.history === e.history && point.revision === e.history.revision,
          'INVALID_POINT', 'Stale or wrong-owner point');
        const loc = location(current, args[2]);
        demand(loc.history === e.history, 'INVALID_LOCATION', 'Insertion has wrong owner');
        const event = {kind: 'write', id: nextEvent++, anchor: point.anchor,
          address: loc.address, type: loc.type, bytes: bytesFor(loc.type, args[3])};
        e.patches.push(event);
        return {tag: 'write', history: e.history, id: event.id};
      }
      default: reject('BAD_PROGRAM', `Unsupported temporal command ${name}`);
    }
  }

  function replay(h, events, patches) {
    let historyDepth = 0;
    for (let owner = h; owner !== null; owner = owner.parent) historyDepth++;
    demand(historyDepth <= maxDepth, 'DEPTH_LIMIT', 'Owned-history depth exceeded');
    const frame = {memory: new Uint8Array(seed), children: [], marks: [], result: 0n};
    const reached = new Set();
    let steps = 0;
    function tick() {
      demand(++steps <= maxSteps, 'STEP_LIMIT', 'Execution budget exceeded');
    }
    function put(event) {
      tick();
      const address = range(frame.memory, event.address, event.bytes.length);
      frame.memory.set(event.bytes, address);
    }
    function mark(label, anchor) {
      demand(typeof label === 'string', 'BAD_PROGRAM', 'Mark label must be text');
      frame.marks.push({anchor, label});
      for (const patch of patches) if (patch.anchor === anchor) { reached.add(patch.id); put(patch); }
    }

    function invoke(name, args, prefix) {
      const stack = [];
      let callDepth = 0;
      let answer = 0n;
      function start(target, values, path, caller) {
        const definition = definitions[target];
        demand(definition && Array.isArray(definition.params) && Array.isArray(definition.body) &&
          values.length === definition.params.length, 'BAD_PROGRAM', `Unknown target or wrong arity: ${target}`);
        demand(++callDepth <= maxDepth, 'DEPTH_LIMIT', 'Call depth exceeded');
        const registers = new Map(definition.params.map((param, i) => [param, values[i]]));
        stack.push({kind: 'function', caller});
        stack.push({kind: 'block', body: definition.body, index: 0, registers, path});
      }
      function finish(value) {
        let item;
        do { item = stack.pop(); } while (item && item.kind !== 'function');
        demand(item, 'BAD_PROGRAM', 'Invalid return');
        callDepth--;
        if (item.caller) item.caller.registers.set(item.caller.destination, value);
        else answer = value;
      }
      start(name, args, prefix, null);
      while (stack.length) {
        const current = stack.at(-1);
        if (current.kind === 'function') { finish(0n); continue; }
        if (current.kind === 'repeat') {
          if (current.next === current.count) { stack.pop(); continue; }
          const iteration = current.next++;
          current.registers.set(current.indexName, iteration);
          stack.push({kind: 'block', body: current.body, index: 0,
            registers: current.registers, path: `${current.path}#${iteration}`});
          continue;
        }
        if (current.index === current.body.length) { stack.pop(); continue; }
        const ins = current.body[current.index++];
        demand(ins && typeof ins.id === 'string', 'BAD_PROGRAM', 'Missing instruction identity');
        tick();
        const key = `${current.path}/${ins.id}`;
        const regs = current.registers;
        const read = operand => {
          if (operand && typeof operand === 'object') {
            demand(typeof operand.reg === 'string' && regs.has(operand.reg),
              'UNDEFINED_REGISTER', `Missing register ${String(operand.reg)}`);
            return regs.get(operand.reg);
          }
          if (operand === null || typeof operand === 'string') return operand;
          return unsigned(operand);
        };
        const storeResult = value => { if (ins.dst !== undefined) regs.set(ins.dst, value); };
        if (ins.op === 'const') storeResult(read(ins.value));
        else if (['add', 'sub', 'mul', 'and', 'xor', 'eq', 'lt'].includes(ins.op)) {
          storeResult(numeric(ins.op, read(ins.a), read(ins.b)));
        } else if (ins.op === 'load' || ins.op === 'store') {
          demand([1, 2, 4, 8].includes(ins.width), 'BAD_PROGRAM', 'Unsupported memory width');
          const target = ins.history === undefined ? h : resolve(read(ins.history));
          let memory;
          if (target === h) memory = frame.memory;
          else {
            controlled(h, target);
            demand(ins.op === 'load', 'HISTORY_ACCESS', 'Ordinary store cannot write a child');
            memory = target.published.memory;
          }
          const address = range(memory, unsigned(read(ins.addr)), ins.width);
          if (ins.op === 'load') {
            let value = 0n;
            for (let i = 0; i < ins.width; i++) value |= BigInt(memory[address + i]) << BigInt(i * 8);
            storeResult(value);
          } else {
            const value = unsigned(read(ins.value));
            for (let i = 0; i < ins.width; i++) memory[address + i] = Number((value >> BigInt(i * 8)) & 255n);
          }
        } else if (ins.op === 'if') {
          const yes = unsigned(read(ins.cond)) !== 0n;
          stack.push({kind: 'block', body: yes ? ins.then : (ins.else ?? []), index: 0,
            registers: regs, path: `${key}?${yes ? 1 : 0}`});
        } else if (ins.op === 'repeat') {
          const count = unsigned(read(ins.count));
          demand(count <= BigInt(maxSteps), 'STEP_LIMIT', 'Loop exceeds execution budget');
          stack.push({kind: 'repeat', body: ins.body, count, next: 0n,
            indexName: ins.index, registers: regs, path: key});
        } else if (ins.op === 'call') {
          const target = typeof ins.fn === 'string' ? ins.fn : String(read(ins.fn));
          start(target, (ins.args ?? []).map(read), `${key}@${target}`, {registers: regs, destination: ins.dst});
        } else if (ins.op === 'return') finish(read(ins.value));
        else if (ins.op === 'mark') {
          mark(ins.label, key);
        } else if (ins.op === 'location') {
          const target = ins.history === undefined ? h : resolve(read(ins.history));
          demand(target === h || target.parent === h, 'HISTORY_ACCESS', 'Cannot obtain unrelated memory location');
          const type = ins.type ?? 'u32';
          const width = TYPE_BYTES[type];
          demand(width !== undefined, 'BAD_TYPE', 'Unknown location type');
          const address = range(target === h ? frame.memory : target.published.memory, unsigned(read(ins.addr)), width);
          storeResult({tag: 'location', history: target, address, type});
        } else if (ins.op === 'temporal') {
          const args = (ins.args ?? []).map(read);
          if (ins.name === 'temporal_mark') { mark(args[0], key); storeResult(null); }
          else storeResult(perform(h, frame, ins.name, args));
        } else if (ins.op === 'enter') {
          const target = controlled(h, resolve(read(ins.history)));
          notEditing(target);
          const event = {kind: 'call', id: nextEvent++, fn: typeof ins.fn === 'string' ? ins.fn : String(read(ins.fn)),
            args: (ins.args ?? []).map(read)};
          const updated = [...target.events, event];
          const fresh = replay(target, updated, target.patches);
          publish(target, updated, target.patches, fresh);
          storeResult(fresh.result);
        } else reject('BAD_PROGRAM', `Unsupported opcode ${ins.op}`);
      }
      return answer;
    }

    h.busy = true;
    try {
      for (const event of events) {
        if (event.kind === 'write') put(event);
        else frame.result = invoke(event.fn, event.args, `${event.id}/${event.fn}`);
      }
      demand(reached.size === patches.length, 'ORPHANED_POINT', 'An insertion anchor no longer executes');
      const pendingChildren = [...frame.children];
      while (pendingChildren.length) {
        const child = pendingChildren.pop();
        if (child.dead) continue;
        demand(child.edit === null, 'EDIT_OPEN', 'Cannot publish an unfinished descendant edit');
        pendingChildren.push(...child.published.children);
      }
      return frame;
    } catch (error) {
      for (const child of frame.children) die(child);
      throw error;
    } finally { h.busy = false; }
  }

  for (const input of options.inputs ?? []) {
    const type = input.type ?? 'u32';
    const bytes = bytesFor(type, input.value);
    const address = range(seed, input.address, bytes.length);
    root.events.push({kind: 'write', id: nextEvent++, address, type, bytes});
  }
  root.events.push({kind: 'call', id: nextEvent++, fn: options.fn ?? 'main',
    args: (options.args ?? []).map(value => value === null || typeof value === 'string' ? value : unsigned(value))});
  root.published = replay(root, root.events, []);

  function plain(h) {
    const value = h.published.result;
    return {memory: new Uint8Array(h.published.memory),
      children: h.published.children.filter(child => !child.dead).map(plain),
      // Opaque returned capabilities are intentionally not compared by identity.
      result: value && typeof value === 'object' ? {kind: value.tag} : value};
  }
  return plain(root);
}
