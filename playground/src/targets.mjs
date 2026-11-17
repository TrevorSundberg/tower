// Explicit target descriptions; none depend on the browser's host platform.
export const targets = {
  wasm: { label: 'WebAssembly', triple: 'wasm32-unknown-unknown', pointerBytes: 4, extension: 'wasm', inputs: [] },
  windows: { label: 'Windows x64', triple: 'x86_64-pc-windows-msvc', pointerBytes: 8, extension: 'exe', inputs: ['kernel32.lib'] },
  linux: { label: 'Linux x64', triple: 'x86_64-unknown-linux-gnu', pointerBytes: 8, extension: 'elf', inputs: [] },
  'linux-arm': { label: 'Linux ARM64', triple: 'aarch64-unknown-linux-gnu', pointerBytes: 8, extension: 'elf', inputs: [] },
  mac: { label: 'macOS x64', triple: 'x86_64-apple-macos11', pointerBytes: 8, extension: 'macho', inputs: ['libSystem.tbd'] },
  'mac-arm': { label: 'macOS ARM64', triple: 'arm64-apple-macos11', pointerBytes: 8, extension: 'macho', inputs: ['libSystem.tbd'] },
};

export async function targetInputs(target, fetchBytes) {
  if (!target || !Object.values(targets).includes(target)) throw new Error('Unknown compilation target');
  const names = target.pointerBytes === 4 ? [] : [target.triple + '-runtime.o', ...target.inputs];
  return Object.fromEntries(await Promise.all(names.map(async name => [name, await fetchBytes('./targets/' + name)])));
}
