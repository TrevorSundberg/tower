import { test, expect } from '@playwright/test';
test.use({ storageState: { cookies: [], origins: [] } });

test('fresh Mac hints select its platform plus Wasm and preserve subsequent native choices',async({page})=>{
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'platform',{value:'MacIntel'});
    Object.defineProperty(navigator,'userAgentData',{value:{platform:'macOS',getHighEntropyValues:async()=>({architecture:'arm',bitness:'64'})}});
  });
  await page.goto('/'); await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('#target-options input:checked')).toHaveCount(2);
  await expect(page.locator('#target-mac-arm')).toBeChecked();
  await expect(page.locator('#target-wasm')).toBeChecked();
  await expect(page.locator('#wasm-column')).toBeVisible();
  await page.locator('#build-targets summary').click();
  await expect(page.locator('#target-label-mac-arm')).toContainText('macOS ARM64 (detected)');
  await expect(page.locator('#target-default')).toHaveCount(0);
  await expect(page.locator('#target-options')).toContainText('arm64-apple-macos11');
  await expect(page.locator('#target-options input')).toHaveCount(6);
  await page.locator('#target-mac-arm').uncheck(); await page.locator('#target-linux').check();
  await page.locator('#target-wasm').uncheck();
  await page.reload(); await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('#target-wasm')).toBeChecked();
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
  await expect(page.locator('#target-wasm')).toBeChecked();
  await expect(page.locator('#target-options input:checked')).toHaveCount(2);
  await expect(page.locator('#target-options')).not.toContainText('(detected)');
  await page.goto('/?mobile'); await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('#target-options input:checked')).toHaveCount(1);
  await expect(page.locator('#target-wasm')).toBeChecked();
  await expect(page.locator('#target-options')).not.toContainText('(detected)');
});

test('pre-update saved selections cannot override Windows plus Wasm defaults',async({page})=>{
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'userAgentData',{value:{platform:'Windows',getHighEntropyValues:async()=>({architecture:'x86',bitness:'64'})}});
    localStorage.setItem('tower-build-targets-v1',JSON.stringify({wasm:true,x86:true,arm:false}));
    localStorage.setItem('tower-build-targets-v2',JSON.stringify({wasm:true,windows:true,linux:true,'linux-arm':true,mac:true,'mac-arm':true}));
  });
  await page.goto('/');await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('#target-options input:checked')).toHaveCount(2);
  await expect(page.locator('#target-wasm')).toBeChecked();
  await expect(page.locator('#target-windows')).toBeChecked();
  await expect(page.locator('#target-label-windows')).toContainText('Windows x64 (detected)');
  await expect(page.locator('#target-default')).toHaveCount(0);
  await page.reload();await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('#target-options input:checked')).toHaveCount(2);
  await expect(page.locator('#target-wasm')).toBeChecked();
  await expect(page.locator('#target-windows')).toBeChecked();
});

test('a single selected native profile fetches no sibling platform runtimes',async({page})=>{
  test.setTimeout(60000);
  await page.addInitScript(()=>{
    localStorage.setItem('tower-build-targets-v3',JSON.stringify({linux:true}));
    localStorage.setItem('tower-playground-source-v1','print(42);');
  });
  const requests=[];page.on('request',r=>requests.push(r.url()));
  await page.goto('/');
  await expect(page.locator('#linux-downloads a')).toHaveCount(1,{timeout:45000});
  await expect(page.locator('.execution-column:visible:not(#wasm-disassembly-column)').filter({has:page.locator('[id$="-downloads"]')})).toHaveCount(1);
  await expect(page.locator('#linux-column h2')).toHaveText('Linux x64 disassembly');
  expect(requests.filter(url=>url.includes('/targets/')).map(url=>url.split('/').pop())).toEqual(['x86_64-unknown-linux-gnu-runtime.o']);
  expect(page.workers().filter(worker=>worker.url().includes('target-worker'))).toHaveLength(1);
  await expect(page.locator('#execution-output')).toHaveText('42\n');
  await expect(page.locator('#llvm-output')).toHaveText('42\n');
  await expect(page.locator('#execution-status')).toContainText('backends match');
});
