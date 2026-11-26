import {after, test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runToEnd} from './compiler-fixtures.mjs';
import {fixtureSource, guestString, llvmOutput, openLLVM, openTower, runSelectedTest} from './compiler_test_host.mjs';

const cases = '.tower/library/bytes_cases/';
const source = fixtureSource(cases + 'roundtrip.tower');
const grammar = fixtureSource(cases + 'source_reset.tower');
const expected = await readFile(new URL('../../scaffolding/library/bytes_cases/roundtrip.expected', import.meta.url));
const subject = await openTower();
const llvm = await openLLVM();
after(() => llvm.close?.());

const text = new TextEncoder();
const observations = new Map();
const layouts = new Map();
const e = subject.exports;
let buffer, seed, parser;
const header = offset => new DataView(e.memory.buffer).getUint32(buffer + offset, true);

// The assertions execute in a separate reactor. Only these callbacks touch the subject's memory and parser.
const runner = await openTower({imports: {
  read_observation(context, name, destination, capacity) {
    const bytes = observations.get(guestString(context, name));
    if (destination && bytes.length <= capacity) context.memory().set(bytes, destination);
    return bytes.length;
  },
  reflected_size: (_, width) => layouts.get(width).size,
  reflected_alignment: (_, width) => layouts.get(width).alignment,
  reflected_field_count: (_, width) => layouts.get(width).fields.length,
  reflected_offset: (_, width, field) => layouts.get(width).fields[field].offset,
  seed_address: () => seed,
  buffer_data: () => header(0),
  buffer_length: () => header(4),
  buffer_capacity: () => header(8),
  subject_byte: (_, address) => new Uint8Array(e.memory.buffer)[address],
  subject_assign: (_, address, length) => e.bytes_assign_text(buffer, address, length),
  subject_append: (_, address, length) => e.bytes_append(buffer, address, length),
  subject_reserve: (_, capacity) => e.bytes_reserve(buffer, capacity),
  reset_source(_, leadingBlank) {
    const input = leadingBlank ? '\n' + grammar : grammar;
    subject.reset(parser, input);
    const {events, end} = runToEnd(subject, parser);
    assert.equal(end.status, 'done', end.error);
    const formatted = subject.format(parser);
    assert.equal(formatted.error, undefined);
    const node = events.find(event => event.status === 'statement').nodes[0];
    const bytes = text.encode(input);
    observations.set('invocation', bytes.subarray(node.start, node.end));
    observations.set('replacement', bytes.subarray(node.origin.templateStart, node.origin.templateEnd));
    observations.set('formatted', text.encode(formatted.source));
    return node.origin.generated;
  },
}});

test('compiler byte buffers share target layouts and interpreter/LLVM semantics', async () => {
  observations.set('expected', expected);
  observations.set('LLVM source', text.encode(await llvmOutput(llvm, source)));
  for (const pointerBytes of [4, 8]) {
    let canonical;
    for (const form of ['source', 'Foundation']) {
      const handle = subject.compile(form === 'source' ? source : canonical, {pointerBytes});
      try {
        const result = subject.execute(handle, 100000);
        assert.equal(result.status, 'done', result.error);
        assert.ok(!result.outputTruncated);
        observations.set(`graph ${form} ${pointerBytes}`, text.encode(result.output));
        if (form === 'source') {
          const foundation = subject.foundation(handle);
          layouts.set(pointerBytes, foundation.types.find(type => type.name === 'ByteBuffer'));
          canonical = foundation.source;
        }
      } finally { subject.destroyExecution(handle); }
    }
    observations.set('LLVM Foundation ' + pointerBytes, text.encode(await llvmOutput(llvm, canonical)));
  }
  runSelectedTest(runner, cases + 'layout_and_execution.tower');
});

test('the browser compiler owns its source using the compiled Tower buffer exports', () => {
  buffer = e.tw_alloc(12);
  seed = e.tw_alloc(5);
  e.bytes_init(buffer);
  try {
    new Uint8Array(e.memory.buffer).set(text.encode('Tower'), seed);
    runSelectedTest(runner, cases + 'exported_buffer.tower');
  } finally {
    e.bytes_dispose(buffer);
    e.tw_free(seed);
    e.tw_free(buffer);
  }
});

test('source resets retain grammar provenance and formatting', () => {
  parser = subject.create(grammar);
  try { runSelectedTest(runner, cases + 'reset_provenance.tower'); }
  finally { subject.destroy(parser); }
});
