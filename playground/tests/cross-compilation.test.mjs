import {after, test} from 'node:test';
import {mkdir, readFile} from 'node:fs/promises';
import {writeFileSync} from 'node:fs';
import {builtins, executeWasm, files, loadLLVM} from './compiler-fixtures.mjs';
import {loadTower} from '../src/tower-host.mjs';
import {targets, targetInputs} from '../src/targets.mjs';
import {copyText, guestString} from './guest_text.mjs';
import {selectedTestSteps} from './selected_test.mjs';

const root = new URL('../../', import.meta.url);
const read = path => readFile(new URL(path, root));
const source = (await read('scaffolding/tests/cross_target_program.tower')).toString();
const output = new URL('build/cross/', root);
await mkdir(output, {recursive:true});

let bytes;
try {
  bytes = await read('build/browser-wasi-llvm/tower-cross.wasm');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const compiler = bytes ? await loadLLVM(bytes, console.error, builtins.foundation) : null;
const folder = 'playground/tests/fixtures/cross_compilation/';
const suiteFile = async path => ({path, text:(await read(folder + path)).toString()});
const shared = await Promise.all(['cross.tower', 'checks_test.tower'].map(suiteFile));
const libraries = files.filter(({path}) =>
  ['.tower/library/testing.tower', '.tower/library/test_data.tower',
   '.tower/library/vector.tower', '.tower/backend/text.tower'].includes(path));

// One registration owns its results and the outstanding Wasm execution. Guest
// handles index this array until the selected test and its last call finish.
let host, target, inputs, filename, results, pending;
function compile(text, options) {
  return results.push(compiler.compile(text, options)) - 1;
}
function executable(text, linkInputs) {
  return compile(text, {target:target.triple, emit:'executable', inputs:linkInputs});
}
function binary(id) {
  return results[id].binary ?? results[id].wasm;
}

const imports = {
  emit_program:() => executable(source, inputs),
  emit_library:(ctx, text) => compile(guestString(ctx, text), {target:target.triple, library:true}),
  link_external:(ctx, text, name, id) =>
    executable(guestString(ctx, text), {...inputs, [guestString(ctx, name)]:results[id].object}),
  target_triple:(ctx, key) => copyText(ctx, targets[guestString(ctx, key)].triple),
  compile_without_inputs:(ctx, text, triple, emit) =>
    compile(guestString(ctx, text), {target:guestString(ctx, triple), emit:guestString(ctx, emit)}),
  compile_default:(ctx, text) => compile(guestString(ctx, text)),
  result_text(ctx, id, field) {
    const value = results[id][guestString(ctx, field)];
    if (typeof value !== 'string' || value.includes('\0')) throw new Error('Expected NUL-free compiler text');
    return copyText(ctx, value);
  },
  result_matches(ctx, id, field, pattern, flags) {
    const value = results[id][guestString(ctx, field)];
    if (typeof value !== 'string') throw new Error('Missing compiler text');
    return new RegExp(guestString(ctx, pattern), guestString(ctx, flags)).test(value);
  },
  binary_size:(_, id) => binary(id).length,
  binary_copy(ctx, id) {
    const bytes = binary(id), address = ctx.allocate(bytes.length || 1);
    if (!address) throw new Error('Cannot copy emitted bytes into the selected test');
    ctx.memory().set(bytes, address);
    return address;
  },
  execute_wasm(_, id) {
    pending = executeWasm(results[id]).then(run => { results[id].output = run.output; });
  },
  execution_ready:() => !pending,
  save_binary:(_, id, library) => writeFileSync(new URL((library ? 'library-' : '') + filename, output), binary(id)),
};

async function run(name, key) {
  if (!host) {
    const bytes = await readFile(process.env.TOWER_TEST_WASM || new URL('build/browser-wasi/tower.wasm', root));
    host = await loadTower(bytes, undefined, builtins.foundation, undefined, builtins.bedrock,
      {tower:builtins.tower, builtins, imports, threads:{capacity:1}});
  }
  if (key) {
    target = targets[key];
    inputs = await targetInputs(target, path => read('build/' + path.slice(2)));
    filename = key + '.' + target.extension;
  }
  const suffix = '_' + name + '_test.tower';
  const sources = [...libraries, ...shared, await suiteFile('cross' + suffix)];
  results = [];
  try {
    for (const _ of selectedTestSteps(host, 'cross.tower', 1024, {files:sources, suffix}, 16384)) {
      if (pending) { await pending; pending = undefined; }
    }
  } finally {
    try { await pending; }
    finally { pending = results = target = inputs = filename = undefined; }
  }
}
after(() => host?.close());

for (const [key, profile] of Object.entries(targets)) {
  test('browser cross compiler: ' + profile.label, {skip:!compiler, timeout:120000},
    () => run(key.replaceAll('-', '_'), key));
}
test('native linker errors are recoverable and unknown targets are diagnosed', {skip:!compiler}, () => run('errors'));
