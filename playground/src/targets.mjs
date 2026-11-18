// Supported executable profiles, not a list of everything LLVM can emit.
// Detection selects a profile; it never changes a profile's semantics/layout.
export const targets = {
  wasm: { label: 'WebAssembly', os: 'web', architecture: 'wasm32', syntax: 'wasm', triple: 'wasm32-unknown-unknown', pointerBytes: 4, extension: 'wasm', inputs: [] },
  windows: { label: 'Windows x64', os: 'windows', architecture: 'x64', syntax: 'x86', triple: 'x86_64-pc-windows-msvc', pointerBytes: 8, extension: 'exe', inputs: ['kernel32.lib'] },
  linux: { label: 'Linux x64', os: 'linux', architecture: 'x64', syntax: 'x86', triple: 'x86_64-unknown-linux-gnu', pointerBytes: 8, extension: 'elf', inputs: [] },
  'linux-arm': { label: 'Linux ARM64', os: 'linux', architecture: 'arm64', syntax: 'arm', triple: 'aarch64-unknown-linux-gnu', pointerBytes: 8, extension: 'elf', inputs: [] },
  mac: { label: 'macOS x64', os: 'mac', architecture: 'x64', syntax: 'x86', triple: 'x86_64-apple-macos11', pointerBytes: 8, extension: 'macho', inputs: ['libSystem.tbd'] },
  'mac-arm': { label: 'macOS ARM64', os: 'mac', architecture: 'arm64', syntax: 'arm', triple: 'arm64-apple-macos11', pointerBytes: 8, extension: 'macho', inputs: ['libSystem.tbd'] },
};

export const nativeTargetKeys = Object.keys(targets).filter(key => key !== 'wasm');
export const targetSelectionKey = 'tower-build-targets-v2';
export const emptySelection = () => Object.fromEntries(Object.keys(targets).map(key => [key, false]));

export function savedTargetSelection(storage) {
  try {
    const current = JSON.parse(storage.getItem(targetSelectionKey));
    if (current && typeof current === 'object' && !Array.isArray(current) &&
        Object.keys(targets).some(key => typeof current[key] === 'boolean'))
      return Object.fromEntries(Object.keys(targets).map(key => [key, current[key] === true]));
    const old = JSON.parse(storage.getItem('tower-build-targets-v1'));
    if (old && ['wasm', 'x86', 'arm'].some(key => typeof old[key] === 'boolean'))
      return Object.fromEntries(Object.entries(targets).map(([key, target]) =>
        [key, key === 'wasm' ? old.wasm !== false : old[target.syntax] === true]));
  } catch { /* Storage may be unavailable or corrupt. Use detection. */ }
  return null;
}

export function linkInputsForTarget(inputs, key) {
  return Object.fromEntries(Object.entries(inputs).filter(([name]) =>
    !Object.keys(targets).some(target => name.startsWith(target + '--')) || name.startsWith(key + '--')));
}

export async function targetInputs(target, fetchBytes) {
  if (!target || !Object.values(targets).includes(target)) throw new Error('Unknown compilation target');
  const names = target === targets.wasm ? [] : [target.triple + '-runtime.o', ...target.inputs];
  return Object.fromEntries(await Promise.all(names.map(async name => [name, await fetchBytes('./targets/' + name)])));
}
