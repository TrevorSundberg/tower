/**
 * Independent from-scratch oracle for temporal-model-contract.md.
 *
 * This interpreter intentionally does not import the incremental model, reuse
 * its traces, or cache instruction results. Each run starts with a fresh byte
 * array and executes the supplied history in forward order. Its only inputs
 * are a bytecode program and ordinary independently maintained history data.
 */

const NAME = /^[A-Za-z0-9_.:-]+$/;
const WIDTHS = new Set([1, 2, 4, 8]);
const BINARY = new Set(['add', 'sub', 'mul', 'and', 'xor', 'eq', 'lt']);

function fault(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function requireThat(condition, message) {
  if (!condition) fault('BAD_PROGRAM', message);
}

function token(value, what) {
  requireThat(typeof value === 'string' && NAME.test(value), `${what} must be a safe nonempty token`);
  return value;
}

function register(value, what) {
  requireThat(typeof value === 'string' && value.length > 0, `${what} must name a register`);
  return value;
}

function integer(value) {
  if (typeof value === 'bigint') return BigInt.asUintN(64, value);
  if (typeof value === 'number' && Number.isSafeInteger(value)) {
    return BigInt.asUintN(64, BigInt(value));
  }
  fault('BAD_PROGRAM', 'Integer literals must be BigInts or safe integer Numbers');
}

function checkOperand(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    register(value.reg, 'Operand');
    return;
  }
  integer(value);
}

function programFunctions(program) {
  requireThat(program && typeof program === 'object', 'Program must be an object');
  requireThat(program.functions && typeof program.functions === 'object' && !Array.isArray(program.functions),
    'Program.functions must be an object');
  const functions = new Map();
  for (const [name, definition] of Object.entries(program.functions)) {
    token(name, 'Function name');
    requireThat(definition && typeof definition === 'object', `Invalid function ${name}`);
    requireThat(Array.isArray(definition.params), `${name}.params must be an array`);
    const params = new Set();
    for (const parameter of definition.params) {
      register(parameter, 'Parameter');
      requireThat(!params.has(parameter), `Duplicate parameter ${parameter} in ${name}`);
      params.add(parameter);
    }
    requireThat(Array.isArray(definition.body), `${name}.body must be an array`);
    functions.set(name, definition);
    const instructionIDs = new Set();
    // Iterative structural validation does not consume the JavaScript stack.
    const pending = [{block: definition.body, exit: false}];
    const activeBlocks = new Set();
    while (pending.length) {
      const {block, exit} = pending.pop();
      if (exit) {
        activeBlocks.delete(block);
        continue;
      }
      requireThat(Array.isArray(block), `Instruction block in ${name} must be an array`);
      requireThat(!activeBlocks.has(block), `Cyclic instruction block in ${name}`);
      activeBlocks.add(block);
      pending.push({block, exit: true});
      for (const instruction of block) {
        requireThat(instruction && typeof instruction === 'object', `Invalid instruction in ${name}`);
        token(instruction.id, 'Instruction ID');
        requireThat(!instructionIDs.has(instruction.id), `Duplicate instruction ID ${instruction.id} in ${name}`);
        instructionIDs.add(instruction.id);
        const op = instruction.op;
        if (op === 'const') {
          register(instruction.dst, 'const destination');
          checkOperand(instruction.value);
        } else if (op === 'load') {
          register(instruction.dst, 'load destination');
          checkOperand(instruction.addr);
          requireThat(WIDTHS.has(instruction.width), 'load width must be 1, 2, 4, or 8');
        } else if (op === 'store') {
          checkOperand(instruction.addr);
          checkOperand(instruction.value);
          requireThat(WIDTHS.has(instruction.width), 'store width must be 1, 2, 4, or 8');
        } else if (BINARY.has(op)) {
          register(instruction.dst, `${op} destination`);
          checkOperand(instruction.a);
          checkOperand(instruction.b);
        } else if (op === 'if') {
          checkOperand(instruction.cond);
          pending.push({block: instruction.then, exit: false});
          if (instruction.else !== undefined) pending.push({block: instruction.else, exit: false});
        } else if (op === 'repeat') {
          checkOperand(instruction.count);
          register(instruction.index, 'repeat index');
          pending.push({block: instruction.body, exit: false});
        } else if (op === 'call') {
          register(instruction.dst, 'call destination');
          if (typeof instruction.fn === 'string') token(instruction.fn, 'Call target');
          else checkOperand(instruction.fn);
          requireThat(instruction.args === undefined || Array.isArray(instruction.args), 'call args must be an array');
          for (const argument of instruction.args ?? []) checkOperand(argument);
        } else if (op === 'return') {
          checkOperand(instruction.value);
        } else if (op === 'mark') {
          requireThat(typeof instruction.label === 'string', 'mark label must be a string');
        } else {
          fault('BAD_PROGRAM', `Unsupported instruction ${String(op)}`);
        }
      }
    }
  }
  return functions;
}

function checkedBytes(bytes, what) {
  requireThat(bytes instanceof Uint8Array, `${what} must be a Uint8Array`);
  return bytes;
}

/**
 * @param {{functions: Record<string, {params: string[], body: object[]}>}} program
 * @param {{initial: Uint8Array, events: object[], patches?: object[], maxSteps?: number, maxDepth?: number}} history
 * @returns {{memory: Uint8Array, sources: string[], trace: object[], marks: object[], results: Map<string, bigint>}}
 */
export function referenceRun(program, history) {
  const functions = programFunctions(program);
  requireThat(history && typeof history === 'object', 'History must be an object');
  const memory = new Uint8Array(checkedBytes(history.initial, 'Initial memory'));
  const sources = Array.from({length: memory.length}, (_, index) => `init:${index}`);
  const trace = [];
  const marks = [];
  const results = new Map();
  const maxSteps = history.maxSteps ?? 100000;
  const maxDepth = history.maxDepth ?? 128;
  requireThat(Number.isSafeInteger(maxSteps) && maxSteps > 0, 'maxSteps must be a positive safe integer');
  requireThat(Number.isSafeInteger(maxDepth) && maxDepth > 0, 'maxDepth must be a positive safe integer');
  requireThat(Array.isArray(history.events), 'History events must be an array');
  requireThat(history.patches === undefined || Array.isArray(history.patches), 'History patches must be an array');
  const patches = history.patches ?? [];
  const eventIDs = new Set();
  const patchBuckets = new Map();
  const patchCounts = new Map();

  function externalBounds(address, length) {
    if (!Number.isSafeInteger(address) || address < 0 || address > memory.length || length > memory.length - address) {
      fault('BOUNDS', `External byte range [${String(address)}, +${length}) is out of bounds`);
    }
    return address;
  }

  function validateExternalWrite(event) {
    checkedBytes(event.bytes, 'External write payload');
    externalBounds(event.addr, event.bytes.length);
  }

  for (const event of [...history.events, ...patches]) {
    requireThat(event && typeof event === 'object', 'History event must be an object');
    token(event.id, 'Event ID');
    requireThat(!eventIDs.has(event.id), `Duplicate history event ID ${event.id}`);
    eventIDs.add(event.id);
    if (event.kind === 'write') {
      validateExternalWrite(event);
    } else if (event.kind === 'call') {
      token(event.fn, 'Invocation target');
      requireThat(event.args === undefined || Array.isArray(event.args), 'Invocation args must be an array');
      for (const argument of event.args ?? []) integer(argument);
    } else {
      fault('BAD_PROGRAM', `Unsupported history event kind ${String(event.kind)}`);
    }
  }
  for (const patch of patches) {
    requireThat(patch.kind === 'write', 'Historical patches must be writes');
    requireThat(typeof patch.at === 'string' && patch.at.length > 0, 'Patch anchor must be a nonempty mark key');
    if (!patchBuckets.has(patch.at)) patchBuckets.set(patch.at, []);
    patchBuckets.get(patch.at).push(patch);
    patchCounts.set(patch.id, 0);
  }

  function enterRecord(key, op) {
    if (trace.length >= maxSteps) fault('STEP_LIMIT', `Instruction budget ${maxSteps} exhausted`);
    const record = {key, op, value: null, reads: [], writes: []};
    trace.push(record);
    return record;
  }

  function externalWrite(event) {
    const source = `write:${event.id}`;
    const record = enterRecord(source, 'external-store');
    for (let offset = 0; offset < event.bytes.length; offset++) {
      const address = event.addr + offset;
      const value = event.bytes[offset];
      memory[address] = value;
      sources[address] = source;
      record.writes.push({addr: address, value, source});
    }
  }

  function operand(value, registers) {
    if (value && typeof value === 'object') {
      if (!registers.has(value.reg)) fault('UNDEFINED_REGISTER', `Register ${value.reg} has no value`);
      return registers.get(value.reg);
    }
    return integer(value);
  }

  function byteAddress(value, width) {
    // Compare as BigInt before converting, so large wrapped pointers cannot lose precision.
    if (value > BigInt(memory.length) || BigInt(width) > BigInt(memory.length) - value) {
      fault('BOUNDS', `Opcode byte range [${value}, +${width}) is out of bounds`);
    }
    return Number(value);
  }

  function binary(op, left, right) {
    switch (op) {
      case 'add': return BigInt.asUintN(64, left + right);
      case 'sub': return BigInt.asUintN(64, left - right);
      case 'mul': return BigInt.asUintN(64, left * right);
      case 'and': return left & right;
      case 'xor': return left ^ right;
      case 'eq': return left === right ? 1n : 0n;
      case 'lt': return left < right ? 1n : 0n;
      default: fault('BAD_PROGRAM', `Unsupported arithmetic ${op}`);
    }
  }

  // Explicit execution frames keep host recursion separate from modeled calls.
  // A block frame retains the actual function's mutable local register map.
  function invoke(name, args, prefix) {
    const frames = [];
    let depth = 0;
    let topResult = 0n;

    function pushFunction(target, values, targetPrefix, returnTo) {
      const definition = functions.get(target);
      if (!definition) fault('BAD_PROGRAM', `Missing function ${target}`);
      requireThat(values.length === definition.params.length, `Arity mismatch calling ${target}`);
      if (depth >= maxDepth) fault('DEPTH_LIMIT', `Function depth budget ${maxDepth} exhausted`);
      depth++;
      const registers = new Map(definition.params.map((parameter, index) => [parameter, values[index]]));
      const functionFrame = {kind: 'function', registers, returnTo};
      frames.push(functionFrame);
      frames.push({kind: 'block', body: definition.body, next: 0, prefix: targetPrefix, registers});
    }

    function finishFunction(result) {
      let frame;
      do {
        frame = frames.pop();
        if (!frame) fault('BAD_PROGRAM', 'Return outside a function');
      } while (frame.kind !== 'function');
      depth--;
      if (frame.returnTo) {
        frame.returnTo.record.value = result;
        frame.returnTo.registers.set(frame.returnTo.destination, result);
      } else {
        topResult = result;
      }
    }

    pushFunction(name, args, prefix, null);
    while (frames.length) {
      const frame = frames[frames.length - 1];
      if (frame.kind === 'function') {
        finishFunction(0n);
        continue;
      }
      if (frame.kind === 'repeat') {
        if (frame.iteration === frame.count) {
          frames.pop();
          continue;
        }
        const index = frame.iteration++;
        frame.registers.set(frame.index, index);
        frames.push({kind: 'block', body: frame.body, next: 0,
          prefix: `${frame.key}#${index}`, registers: frame.registers});
        continue;
      }
      if (frame.next >= frame.body.length) {
        frames.pop();
        continue;
      }

      const instruction = frame.body[frame.next++];
      const key = `${frame.prefix}/${instruction.id}`;
      const record = enterRecord(key, instruction.op);
      const registers = frame.registers;
      const read = value => operand(value, registers);
      const op = instruction.op;
      if (op === 'const') {
        record.value = read(instruction.value);
        registers.set(instruction.dst, record.value);
      } else if (BINARY.has(op)) {
        record.value = binary(op, read(instruction.a), read(instruction.b));
        registers.set(instruction.dst, record.value);
      } else if (op === 'load') {
        const address = byteAddress(read(instruction.addr), instruction.width);
        let loaded = 0n;
        for (let offset = 0; offset < instruction.width; offset++) {
          const addr = address + offset;
          const value = memory[addr];
          record.reads.push({addr, value, source: sources[addr]});
          loaded |= BigInt(value) << BigInt(8 * offset);
        }
        record.value = loaded;
        registers.set(instruction.dst, loaded);
      } else if (op === 'store') {
        const address = byteAddress(read(instruction.addr), instruction.width);
        const stored = read(instruction.value);
        for (let offset = 0; offset < instruction.width; offset++) {
          const addr = address + offset;
          const value = Number((stored >> BigInt(8 * offset)) & 255n);
          memory[addr] = value;
          sources[addr] = key;
          record.writes.push({addr, value, source: key});
        }
      } else if (op === 'if') {
        record.value = read(instruction.cond);
        const chosen = record.value !== 0n;
        frames.push({kind: 'block', body: chosen ? instruction.then : (instruction.else ?? []),
          next: 0, prefix: `${key}?${chosen ? 1 : 0}`, registers});
      } else if (op === 'repeat') {
        record.value = read(instruction.count);
        if (record.value > BigInt(maxSteps)) fault('STEP_LIMIT', `Repeat count exceeds budget ${maxSteps}`);
        frames.push({kind: 'repeat', key, count: record.value, iteration: 0n,
          index: instruction.index, body: instruction.body, registers});
      } else if (op === 'call') {
        const target = typeof instruction.fn === 'string' ? instruction.fn : String(read(instruction.fn));
        const values = (instruction.args ?? []).map(read);
        pushFunction(target, values, `${key}@${target}`,
          {record, registers, destination: instruction.dst});
      } else if (op === 'return') {
        record.value = read(instruction.value);
        finishFunction(record.value);
      } else if (op === 'mark') {
        marks.push({key, label: instruction.label});
        for (const patch of patchBuckets.get(key) ?? []) {
          const count = patchCounts.get(patch.id) + 1;
          patchCounts.set(patch.id, count);
          if (count !== 1) fault('ORPHANED_POINT', `Patch ${patch.id} anchor was reached more than once`);
          externalWrite(patch);
        }
      }
    }
    return topResult;
  }

  for (const event of history.events) {
    if (event.kind === 'write') {
      externalWrite(event);
    } else {
      const args = (event.args ?? []).map(integer);
      results.set(event.id, invoke(event.fn, args, `${event.id}/${event.fn}`));
    }
  }
  for (const patch of patches) {
    if (patchCounts.get(patch.id) !== 1) {
      fault('ORPHANED_POINT', `Patch ${patch.id} anchor ${patch.at} was not reached exactly once`);
    }
  }
  return {memory, sources, trace, marks, results};
}
