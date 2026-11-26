// A selected Tower test can suspend for the real simulator. Device files are
// copied as counted bytes, including on readback, before the guest resumes.
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {readFile, readdir} from 'node:fs/promises';
import {files} from '../compiler-fixtures.mjs';
import {fixtureSource, openTower} from '../compiler_test_host.mjs';
import {copyText, guestString} from '../guest_text.mjs';
import {selectedTestSteps} from '../selected_test.mjs';
import {runBrightScript} from './harness.mjs';

const root = new URL('./fixtures/emitter/', import.meta.url);
const fixtures = new Map(await Promise.all((await readdir(root)).map(async name =>
  [name, await readFile(new URL(name, root), 'utf8')])));
const suite = files.filter(({path}) => ['backend/text', 'library/testing', 'library/test_fixtures', 'library/vector']
  .some(name => path === '.tower/' + name + '.tower'));
for (const [path, text] of fixtures) if (path.endsWith('.tower')) suite.push({path, text});

export function copyOutput(ctx, text, size) {
  const address = copyText(ctx, text);
  const memory = ctx.memory();
  new DataView(memory.buffer, memory.byteOffset).setUint32(size, Buffer.byteLength(text), true);
  return address;
}

const device = new URL('../../../build/roku-device/', import.meta.url);
const outputs = new Set(['source/program.brs', 'source/Main.brs', 'manifest', 'expected.txt',
  'integers.brs', 'integers-expected.txt']);
function deviceFile(ctx, path) {
  const name = guestString(ctx, path);
  if (!outputs.has(name)) throw new Error('Unknown Roku package path ' + name);
  return new URL(name, device);
}

export async function openRokuTests(entry, imports = {}, inputs = new Map()) {
  let request, output;
  const probe = await openTower({threads:{capacity:1}, imports:{
    ...imports,
    roku_read(ctx, path, size) {
      const name = guestString(ctx, path);
      const text = inputs.get(name) ?? fixtures.get(name) ?? fixtureSource('.tower/' + name);
      return size ? copyOutput(ctx, text, size) : copyText(ctx, text);
    },
    roku_submit(ctx, program, main) {
      if (request || output !== undefined) throw new Error('Unconsumed simulator request');
      request = [guestString(ctx, program), main ? guestString(ctx, main) : undefined];
    },
    roku_take_output(ctx, size) {
      if (output === undefined) return 0;
      const address = copyOutput(ctx, output, size);
      output = undefined;
      return address;
    },
    roku_write(ctx, path, data, size) {
      const file = deviceFile(ctx, path);
      mkdirSync(new URL('.', file), {recursive:true});
      writeFileSync(file, ctx.memory().subarray(data, data + size));
    },
    roku_readback(ctx, path, size) {
      const bytes = readFileSync(deviceFile(ctx, path));
      const address = ctx.allocate(bytes.length + 1);
      if (!address) throw new Error('Cannot allocate package readback');
      const memory = ctx.memory();
      memory.set(bytes, address);
      new DataView(memory.buffer, memory.byteOffset).setUint32(size, bytes.length, true);
      return address;
    },
  }});
  return async (suffix, stepBudget = 4096) => {
    try {
      for (const _ of selectedTestSteps(probe, entry, 10_000,
        {files:suite, suffix:'_' + suffix + '_test.tower'}, stepBudget)) {
        if (request) {
          output = await runBrightScript(...request);
          request = undefined;
        }
      }
    } finally { request = output = undefined; }
  };
}
