// WebGPU object and promise lifetimes stay on the browser side of the Wasm ABI.
import {executeWasm} from '../../../playground/src/llvm-host.mjs';

const signatures = {
  webgpu_fixture_phase: [],
  webgpu_texture_rgba8unorm: ['usize', 'usize', 'u32', 'u32'],
  webgpu_staging: ['usize', 'u32'],
  webgpu_clear_store: ['f64', 'f64', 'f64', 'f64'],
  webgpu_copy_to_buffer: ['usize', 'usize', 'usize'],
  webgpu_submit: [],
  webgpu_read_mapped: ['u8*', 'usize'],
  webgpu_observe: ['u8*', 'u8*', 'usize'],
};

export async function runWebgpuRgba8(wasm, {forceFallbackAdapter = false, log = console.log} = {}) {
  let device, texture, view, staging, encoder, mapped;
  let phase, submits = 0;
  const imports = {
    webgpu_fixture_phase: () => phase,
    webgpu_texture_rgba8unorm(_, width, height, sampleCount, usage) {
      texture = device.createTexture({size: [width, height], format: 'rgba8unorm', sampleCount, usage});
      view = texture.createView();
      encoder = device.createCommandEncoder();
    },
    webgpu_staging(_, size, usage) {
      staging = device.createBuffer({size, usage});
    },
    webgpu_clear_store(_, r, g, b, a) {
      encoder.beginRenderPass({colorAttachments: [{view, loadOp: 'clear', storeOp: 'store',
        clearValue: {r, g, b, a}}]}).end();
    },
    webgpu_copy_to_buffer(_, width, height, bytesPerRow) {
      encoder.copyTextureToBuffer({texture}, {buffer: staging, bytesPerRow}, [width, height]);
    },
    webgpu_submit() {
      device.queue.submit([encoder.finish()]);
      submits++;
    },
    webgpu_read_mapped(context, dst, capacity) {
      if (capacity < mapped.byteLength) throw Error('Mapped range exceeds Tower buffer');
      context.memory().set(mapped, dst);
      return mapped.byteLength;
    },
    webgpu_observe(context, label, pointer, length) {
      const memory = context.memory();
      const name = new TextDecoder().decode(memory.subarray(label, memory.indexOf(0, label)));
      const hex = Array.from(memory.subarray(pointer, pointer + length), b => b.toString(16).padStart(2, '0')).join('');
      log(name + '=' + hex);
    },
  };
  async function runPhase(number) {
    phase = number;
    const result = await executeWasm({wasm, signatures}, undefined, {imports});
    if (result.status !== 'done') throw Error('Tower phase ' + phase + ': ' + result.error + ' at ' + result.errorOffset);
  }
  await runPhase(0);
  log('cpu_controls=passed');
  const adapter = await navigator.gpu?.requestAdapter({forceFallbackAdapter});
  if (!adapter) throw Error('No WebGPU adapter for forceFallbackAdapter=' + forceFallbackAdapter);
  const info = adapter.info ?? await adapter.requestAdapterInfo();
  const fields = ['vendor', 'architecture', 'device', 'description', 'backend', 'driver', 'type', 'subgroupMinSize', 'subgroupMaxSize'];
  const identity = Object.fromEntries(fields.map(key => [key, info[key] ?? null]));
  identity.isFallbackAdapter = info.isFallbackAdapter ?? adapter.isFallbackAdapter ?? null;
  log('adapter=' + JSON.stringify(identity));
  if (!forceFallbackAdapter && (identity.isFallbackAdapter || info.type?.toLowerCase() === 'cpu')) {
    throw Error('Hardware request selected a software or fallback adapter');
  }
  device = await adapter.requestDevice();
  const errors = [];
  device.addEventListener('uncapturederror', event => errors.push(event.error));
  device.lost.then(info => {
    if (info.reason !== 'destroyed') errors.push(Error('Device lost: ' + info.message));
  });
  device.pushErrorScope('validation');
  try {
    await runPhase(1);
    if (submits !== 1) throw Error('Unexpected submission count ' + submits);
    await device.queue.onSubmittedWorkDone();
    log('submits=1 queue=completed');
    await staging.mapAsync(GPUMapMode.READ);
    mapped = new Uint8Array(staging.getMappedRange());
    log('map=fulfilled bytes=' + mapped.byteLength);
    await runPhase(2);
  } catch (error) {
    errors.push(error);
  } finally {
    if (staging?.mapState === 'mapped') {
      staging.unmap();
      log('unmap=' + staging.mapState);
    }
    view = undefined;
    staging?.destroy();
    texture?.destroy();
    try {
      const validation = await device.popErrorScope();
      log('validation=' + (validation?.message ?? 'clean'));
      if (validation) errors.push(validation);
    } catch (error) {
      errors.push(error);
    } finally {
      device.destroy();
      await device.lost;
    }
  }
  if (errors.length) throw Error(errors.map(error => error.message).join('\n'));
}
