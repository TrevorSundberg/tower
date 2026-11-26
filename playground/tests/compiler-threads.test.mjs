import {test} from 'node:test';
import {Worker} from 'node:worker_threads';
import {readFile} from 'node:fs/promises';
import {compilerThreads} from '../src/compiler-threads.mjs';
import {TowerWASI} from '../src/wasi-host.mjs';
import {loadTower as loadChecks} from '../src/tower-host.mjs';
import {copyText, guestString} from './guest_text.mjs';
import {selectedTestSteps} from './selected_test.mjs';

const phase = (name, details = {}) => {
  if (process.env.TOWER_TEST_PHASES === '1') console.error(JSON.stringify({phase:name, ...details}));
};

let bytes;
try { bytes = await readFile(process.env.TOWER_TEST_WORK_WASM ?? 'build/browser-wasi-threads/tower-work-tests.wasm'); }
catch (error) {
  if (error.code !== 'ENOENT' || process.env.TOWER_REQUIRE_THREADS === '1') throw error;
}

async function selected(name, imports, settle) {
  const entry = 'compiler_threads.tower', suffix = '_' + name + '_test.tower';
  const files = await Promise.all([entry, 'compiler_threads' + suffix].map(async path =>
    ({path, text:await readFile(new URL(path, import.meta.url), 'utf8')})));
  const modules = ['bedrock','foundation_syntax','types','foundation','tower','library/testing','library/test_data','backend/text','library/vector'];
  const builtins = Object.fromEntries(await Promise.all(modules.map(async path =>
    [path, await readFile('scaffolding/' + path + '.tower', 'utf8')])));
  const image = await readFile(process.env.TOWER_TEST_WASM || 'build/browser-wasi/tower.wasm');
  const checks = await loadChecks(image, undefined, builtins.foundation, undefined, builtins.bedrock,
    {tower:builtins.tower, builtins, imports, threads:{capacity:1}});
  try {
    for (const _ of selectedTestSteps(checks, entry, 65536, {files, suffix}, 2048)) {
      if (settle) await settle();
    }
  } finally { checks.close(); }
}

async function withPool(options, run) {
  const module = await WebAssembly.compile(bytes);
  const transport = await compilerThreads(module, options);
  try {
    const wasi = new TowerWASI();
    const instance = await WebAssembly.instantiate(module, {
      env:transport.env, wasi:transport.wasi, wasi_snapshot_preview1:wasi.wasiImport,
    });
    transport.attach(instance);
    wasi.initialize(instance);
    await run(instance.exports, transport);
  } finally { transport.close(); }
}

test('the Tower pool overlaps four distinct Wasm threads and reuses their jobs', {skip:!bytes, timeout:30000}, async () => {
  phase('pool:start');
  let repeat = 0;
  await withPool({}, wasm => selected('pool', {run_pool() {
    const result = wasm.main();
    phase('pool:completed', {repeat:repeat++, result});
    return result;
  }}));
});

test('a joined pthread returns its physical slot before the next four-lane pool', {skip:!bytes}, async t => {
  const gate = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));
  let status;
  const exits = [];
  function workerFactory(url) {
    const child = exits.length ? new Worker(url) :
      new Worker(new URL('./compiler-handoff-worker.mjs', import.meta.url), {workerData:gate});
    exits.push(new Promise(resolve => child.once('exit', resolve)));
    if (exits.length === 1) {
      const post = child.postMessage.bind(child);
      child.postMessage = (message, ...args) => {
        if (message.initialize) status = message.status;
        return post(message, ...args);
      };
    }
    return child;
  }
  try {
    await withPool({workerFactory}, wasm => {
      const wait = Atomics.wait;
      t.mock.method(Atomics, 'wait', (array, slot, ...args) => {
        if (array === status && slot === 0) {
          Atomics.store(gate, 0, 1);
          Atomics.notify(gate, 0);
        }
        return wait(array, slot, ...args);
      });
      return selected('handoff', {run_pool:() => wasm.main(), handoff_gate:() => Atomics.load(gate, 0)});
    });
  } finally { await Promise.all(exits); }
});

test('a worker trap interrupts a blocked coordinator through shared failure state', {skip:!bytes, timeout:10000}, async () => {
  phase('trap:start');
  await withPool({workerURL:new URL('./compiler-failure-worker.mjs', import.meta.url)}, (wasm, transport) =>
    selected('trap', {
      run_until_trap(ctx) {
        try { wasm.main(); }
        catch (error) { return copyText(ctx, error.message); }
        return copyText(ctx, '');
      },
      transport_failed:() => transport.failed(),
    }));
  phase('trap:completed');
});

test('declaration, body checking, lowering and staging are deterministic at 1/2/4/8 workers', {skip:!bytes, timeout:120000}, async () => {
  const {builtins, files, loadTower, loadTowerBytes, generatedSource} = await import('./compiler-fixtures.mjs');
  const compiler = await readFile('build/browser-wasi-threads/tower.wasm');
  const lrFixture = process.env.TOWER_TEST_LR_WASM && await readFile(process.env.TOWER_TEST_LR_WASM);
  const sources = new Map(files.map(file => [file.path, file.text]));
  const fixture = path => {
    const source = sources.get('.tower/tests/' + path + '.tower');
    if (source === undefined) throw new Error('Missing compiler thread fixture ' + path);
    return source;
  };
  let tower, capacity, pending, lrCode, result, foundationSize;
  const live = new Set(), mounted = [];
  const open = image => (lrFixture ? loadTowerBytes : loadTower)(image, undefined,
    builtins.foundation, undefined, undefined, {threads:{capacity}});
  function start(operation) {
    if (pending) throw new Error('Overlapping compiler test requests');
    pending = operation();
  }
  async function settle() {
    try { await pending; } finally { pending = undefined; }
  }
  function destroy(handle) {
    tower.destroyExecution(handle);
    live.delete(handle);
  }
  const imports = {
    request_open(_, workers) {
      capacity = workers;
      phase('compiler:load', {capacity});
      start(async () => { tower = await open(compiler); });
    },
    request_source(ctx, key) {
      const path = guestString(ctx, key);
      start(async () => {
        const source = await generatedSource(tower, 'scaffolding/tests/' + path + '.tower');
        sources.set('.tower/tests/' + path + '.tower', source);
      });
    },
    request_lr() {
      start(async () => {
        const lr = lrFixture ? await open(lrFixture) : tower;
        try { lrCode = lr.exports.lr_work_tests(); }
        finally { if (lrFixture) lr.close(); }
      });
    },
    waiting:() => Boolean(pending),
    lr_code:() => lrCode,
    semantic_world:(_, width) => tower.exports.semantic_world_tests(width),
    mount_fixture(ctx, filename, key) {
      mounted.push({path:guestString(ctx, filename), text:fixture(guestString(ctx, key))});
    },
    configure_entry(ctx, entry) {
      tower.configureModules({entry:guestString(ctx, entry), files:mounted.splice(0)});
    },
    compile_fixture(ctx, key, width) {
      const path = guestString(ctx, key);
      phase('fixture:compile', {capacity, path, width});
      const handle = tower.compile(fixture(path), {pointerBytes:width});
      live.add(handle);
      result = undefined;
      return handle;
    },
    select_fast:(_, handle) => tower.useFast(handle),
    execute_step(_, handle, budget) {
      const step = tower.execute(handle, budget);
      step.output = (result?.output ?? '') + step.output;
      result = step;
    },
    executing:() => result.status === 'executing',
    status_text:ctx => copyText(ctx, result.status),
    output_text:ctx => copyText(ctx, result.output),
    diagnostic:ctx => copyText(ctx, result.error ?? ''),
    diagnostic_offset:() => result.errorOffset,
    foundation_text(ctx, handle) {
      const text = tower.foundation(handle).source;
      foundationSize = Buffer.byteLength(text);
      return copyText(ctx, text);
    },
    foundation_size:() => foundationSize,
    output_size:() => Buffer.byteLength(result.output),
    destroy_fixture:(_, handle) => destroy(handle),
    close_compiler:() => tower.close(),
    closed_compile_error(ctx, source) {
      const input = guestString(ctx, source);
      let handle;
      try { handle = tower.compile(input); }
      catch (error) { return copyText(ctx, error.message); }
      destroy(handle);
      return copyText(ctx, '');
    },
  };
  try { await selected('determinism', imports, settle); }
  finally {
    try { await settle(); }
    finally {
      try { for (const handle of live) destroy(handle); }
      finally { tower?.close(); }
    }
  }
});
