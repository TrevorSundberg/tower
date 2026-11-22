import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {TowerWASI} from '../src/wasi-host.mjs';
import {configureBedrock, configureTower} from '../src/bootstrap.mjs';
import {moduleInputs} from '../src/module-inputs.mjs';
import {builtins, files} from './compiler-fixtures.mjs';

// Byte transport only; ownership, reconstruction and cleanup assertions are Tower.
test('backend source requests retain their explicit ECS world', async context => {
  const bytes = await readFile('build/browser-wasi-llvm/tower-llvm.wasm');
  const bedrock = await readFile('scaffolding/bedrock.tower', 'utf8');
  const foundation = await readFile('scaffolding/foundation.tower', 'utf8');
  const wasi = new TowerWASI();
  const {instance} = await WebAssembly.instantiate(bytes, {wasi_snapshot_preview1:wasi.wasiImport});
  wasi.initialize(instance);
  wasi.mountFiles(files);
  const e = instance.exports;
  if (!e.backend_source_world_tests && process.env.TOWER_REQUIRE_BACKEND_TESTS !== '1') {
    context.skip('Build with TOWER_BACKEND_TESTS=ON to run Tower backend fixtures');
    return;
  }
  const modules = moduleInputs(e, builtins);
  configureBedrock(e, bedrock);
  configureTower(e, foundation, modules.environment);
  const pointers = [];
  try {
    for (const source of [bedrock, foundation]) {
      const input = new TextEncoder().encode(source + '\0');
      const pointer = e.malloc(input.length);
      assert.ok(pointer);
      pointers.push(pointer);
      new Uint8Array(e.memory.buffer).set(input, pointer);
    }
    assert.equal(e.backend_source_tests(modules.environment), 0);
    assert.equal(e.backend_source_world_tests(...pointers), 0);
  } finally { for (const pointer of pointers) e.free(pointer); }
});
