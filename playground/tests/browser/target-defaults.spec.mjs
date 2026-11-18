import { test, expect } from '@playwright/test';
test.use({ storageState: { cookies: [], origins: [] } });

test('fresh Mac hints select only its platform and preserve subsequent manual choices',async({page})=>{
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'platform',{value:'MacIntel'});
    Object.defineProperty(navigator,'userAgentData',{value:{platform:'macOS',getHighEntropyValues:async()=>({architecture:'arm',bitness:'64'})}});
  });
  await page.goto('/'); await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('#target-options input:checked')).toHaveCount(2);
  await expect(page.locator('#target-mac-arm')).toBeChecked();
  await expect(page.locator('#target-wasm')).toBeChecked();
  await page.locator('#build-targets summary').click();
  await expect(page.locator('#target-default')).toContainText('client hints');
  await expect(page.locator('#target-options')).toContainText('arm64-apple-macos11');
  await expect(page.locator('#target-options input')).toHaveCount(6);
  await page.locator('#target-mac-arm').uncheck(); await page.locator('#target-linux').check();
  await page.reload(); await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('#target-linux')).toBeChecked();
  await expect(page.locator('#target-mac-arm')).not.toBeChecked();
});

test('unknown browser falls back to Windows x64 and unavailable mobile ABI uses WebAssembly',async({page})=>{
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'platform',{value:''});
    Object.defineProperty(navigator,'userAgent',{value:''});
    Object.defineProperty(navigator,'userAgentData',{value:location.search.includes('mobile') ?
      {platform:'Android',getHighEntropyValues:async()=>({architecture:'arm',bitness:'64'})} : undefined});
  });
  await page.goto('/'); await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('#target-windows')).toBeChecked();
  await expect(page.locator('#target-default')).toContainText('fallback');
  await page.goto('/?mobile'); await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('#target-options input:checked')).toHaveCount(1);
  await expect(page.locator('#target-wasm')).toBeChecked();
});

test('a single selected native profile fetches no sibling platform runtimes',async({page})=>{
  test.setTimeout(60000);
  await page.addInitScript(()=>{
    localStorage.setItem('tower-build-targets-v2',JSON.stringify({linux:true}));
    localStorage.setItem('tower-playground-source-v1','print(42);');
  });
  const requests=[];page.on('request',r=>requests.push(r.url()));
  await page.goto('/');
  await expect(page.locator('#linux-downloads a')).toHaveCount(1,{timeout:45000});
  await expect(page.locator('.native-column:visible')).toHaveCount(1);
  await expect(page.locator('#linux-column h2')).toHaveText('Linux x64 disassembly');
  expect(requests.filter(url=>url.includes('/targets/')).map(url=>url.split('/').pop())).toEqual(['x86_64-unknown-linux-gnu-runtime.o']);
  expect(page.workers().filter(worker=>worker.url().includes('target-worker'))).toHaveLength(1);
  await expect(page.locator('#execution-output')).toHaveText('42\n');
});
