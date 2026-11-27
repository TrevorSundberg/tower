// From the repository root, with LLVM/Clang 19 available:
// mkdir -p build && bootstrap/linux-x64/towerc scaffolding/library/graphics/webgpu_rgba8_fixture.tower --bedrock scaffolding/bedrock.tower --foundation scaffolding/foundation.tower --cc clang-19 --target wasm32-unknown-unknown -o build/webgpu_rgba8.wasm
// npm ci --prefix playground --ignore-scripts
// CHROMIUM=/path/to/chromium timeout 60 node scaffolding/library/graphics/webgpu_rgba8_run.mjs hardware
// Use software for a separate, explicitly requested fallback adapter.
import {chromium} from '../../../playground/node_modules/playwright/index.mjs';
import {readFile} from 'node:fs/promises';

const mode = process.argv[2];
if (!['hardware', 'software'].includes(mode)) throw Error('Specify hardware or software');
const args = ['--enable-automation', '--enable-unsafe-webgpu', '--enable-webgpu-developer-features', '--ignore-gpu-blocklist',
  '--enable-features=Vulkan', '--disable-vulkan-surface', '--use-angle=' + (mode === 'hardware' ? 'vulkan' : 'swiftshader')];
const browser = await chromium.launch({executablePath: process.env.CHROMIUM, args, timeout: 20000});
try {
  const cdp = await browser.newBrowserCDPSession();
  console.log('mode', mode, 'version', await cdp.send('Browser.getVersion'));
  console.log('flags', (await cdp.send('Browser.getBrowserCommandLine')).arguments);
  const page = await browser.newPage();
  page.on('console', msg => console.log(msg.type(), msg.text()));
  await page.exposeFunction('getGpuDevices', async () => (await cdp.send('SystemInfo.getInfo')).gpu.devices);
  const transport = '/scaffolding/library/graphics/webgpu_rgba8.mjs';
  await page.route('http://127.0.0.1/**', async route => {
    const {pathname} = new URL(route.request().url());
    if (pathname === '/') return route.fulfill({contentType:'text/html', body:'<!doctype html><title>RGBA8 fixture</title>'});
    if (pathname === '/build/webgpu_rgba8.wasm' || pathname === transport || /^\/playground\/src\/[\w-]+\.mjs$/.test(pathname)) {
      return route.fulfill({contentType: pathname.endsWith('.wasm') ? 'application/wasm' : 'text/javascript', body: await readFile('.' + pathname)});
    }
    return route.abort();
  });
  await page.goto('http://127.0.0.1/');
  try {
    await page.evaluate(async ({mode, transport}) => {
      const {runWebgpuRgba8} = await import(transport);
      await runWebgpuRgba8(await (await fetch('/build/webgpu_rgba8.wasm')).arrayBuffer(), {
        forceFallbackAdapter: mode === 'software', getGpuDevices: window.getGpuDevices,
      });
    }, {mode, transport});
  } finally {
    console.log('CDP GPU', JSON.stringify((await cdp.send('SystemInfo.getInfo')).gpu, null, 2));
  }
} finally {
  await browser.close();
}
