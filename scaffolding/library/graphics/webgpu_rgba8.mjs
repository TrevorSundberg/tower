// WebGPU object and promise lifetimes stay on the browser side of the Wasm ABI.
import {executeWasm} from '../../../playground/src/llvm-host.mjs';

const signatures = {
  webgpu_fixture_phase: [],
  webgpu_adapter_fact: ['u8*'],
  webgpu_texture_rgba8unorm: ['usize', 'usize', 'u32', 'u32'],
  webgpu_staging: ['usize', 'u32'],
  webgpu_clear_store: ['f64', 'f64', 'f64', 'f64'],
  webgpu_copy_to_buffer: ['usize', 'usize', 'usize'],
  webgpu_submit: [],
  webgpu_read_mapped: ['u8*', 'usize'],
  webgpu_observe: ['u8*', 'u8*', 'usize'],
};

function guestString(memory, pointer) {
  const end = memory.indexOf(0, pointer);
  if (end < 0) throw Error('Unterminated Tower label');
  return new TextDecoder().decode(memory.subarray(pointer, end));
}

// Chromium can put PCI IDs in the ANGLE device string and add trailing zero
// components to the driver version. Match all fields against the same CDP row.
function matchesBrowserDevice(info, devices) {
  const {vendor, device, description, driver} = info;
  const placeholder = /unknown|redact|masked|hidden|unavailable|unspecified|generic|anonymous|^n\/a$/i;
  if (![vendor, description, driver].every(s => typeof s === 'string' && s.trim() && !placeholder.test(s))) return false;
  if (!/[\da-z]/i.test(description) || /^(gpu|adapter|graphics|device)$/i.test(description.trim())) return false;
  if (!/^0x[\da-f]{1,8}$/i.test(device) || !(Number(device) > 0 && Number(device) < 0xffff)) return false;
  const versions = driver.match(/\b\d+(?:\.\d+)+\b/g) ?? [];
  const normalizeVersion = v => v.replace(/(?:\.0)+$/, '');
  return devices.some(row => {
    const renderer = (row.deviceString ?? '').toLowerCase();
    const ids = renderer.match(/\b0x[\da-f]+\b/g) ?? [];
    const vendorWords = (row.vendorString ?? '').toLowerCase().split(/\W+/);
    const version = row.driverVersion ?? '';
    const deviceMatches = row.deviceId ? row.deviceId === Number(device) : ids.some(id => Number(id) === Number(device));
    return vendorWords.includes(vendor.toLowerCase()) && renderer.includes(description.toLowerCase()) && deviceMatches &&
      /^\d+(?:\.\d+)+$/.test(version) && /[1-9]/.test(version) &&
      versions.some(v => normalizeVersion(v) === normalizeVersion(version));
  });
}

export async function runWebgpuRgba8(wasm, {forceFallbackAdapter = false, getGpuDevices = async () => [], log = console.log} = {}) {
  let device, texture, view, staging, encoder, mapped;
  let phase, facts, submits = 0;
  const imports = {
    webgpu_fixture_phase: () => phase,
    webgpu_adapter_fact(context, pointer) {
      const name = guestString(context.memory(), pointer);
      if (!Object.hasOwn(facts, name)) throw Error('Unknown WebGPU adapter fact ' + name);
      return Number(facts[name]);
    },
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
      const name = guestString(memory, label);
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
  if (!adapter) throw Error('No WebGPU adapter for forceFallbackAdapter=' + forceFallbackAdapter + '. Inspect the browser GPU log and selected ICD.');
  const info = adapter.info ?? await adapter.requestAdapterInfo?.() ?? {};
  const fields = ['vendor', 'architecture', 'device', 'description', 'backend', 'driver', 'type', 'subgroupMinSize', 'subgroupMaxSize'];
  const identity = Object.fromEntries(fields.map(key => [key, info[key] ?? null]));
  identity.isFallbackAdapter = info.isFallbackAdapter ?? adapter.isFallbackAdapter ?? null;
  log('adapter=' + JSON.stringify(identity));
  const softwareName = /swiftshader|llvmpipe|lavapipe|softpipe|swrast|software|\bwarp\b|microsoft basic render/i;
  facts = {
    softwareRequested: forceFallbackAdapter,
    software: identity.isFallbackAdapter === true || /^cpu$/i.test(info.type) ||
      [info.architecture, info.vendor, info.description, info.driver].some(value => softwareName.test(value)),
    nonFallback: identity.isFallbackAdapter === false,
    physical: /^(discrete|integrated)[ -]?gpu$/i.test(info.type),
    vulkan: info.backend?.toLowerCase() === 'vulkan',
    matchingDeviceAndDriver: !forceFallbackAdapter && matchesBrowserDevice(identity, await getGpuDevices()),
  };
  log('adapter_evidence=' + JSON.stringify(facts));
  await runPhase(3);
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
      if (staging.mapState !== 'unmapped') errors.push(Error('Staging buffer remained mapped'));
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
