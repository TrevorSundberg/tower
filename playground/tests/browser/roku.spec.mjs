import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {outputText} from './output-text.mjs';

test('Roku downloads optimized BrightScript, preserves comments and clears stale results',async({page})=>{
  test.setTimeout(120000);
  await page.addInitScript(()=>{
    localStorage.setItem('tower-build-targets-v3',JSON.stringify({wasm:true,c:true,roku:true}));
    localStorage.setItem('tower-playground-source-v1','// Roku download note\nvar value:u64=18446744073709551615; print(value); print(sizeof(usize));');
  });
  await page.goto('/');
  await expect(page.locator('#roku-download')).toHaveAttribute('href',/^blob:/,{timeout:60000});
  await expect(page.locator('#c-download')).toHaveAttribute('href',/^blob:/,{timeout:60000});
  await expect(page.locator('#execution-status')).toContainText('backends match');
  const download=page.waitForEvent('download');
  await page.locator('#roku-download').click();
  const artifact=await download;
  expect(artifact.suggestedFilename()).toMatch(/-roku\.brs$/);
  const brs=await readFile(await artifact.path(),'utf8');
  expect(brs).toContain('function TowerRun(');
  expect(brs).toContain('Roku download note');
  expect(brs).toContain('32-bit byte addresses');
  expect(brs).toBe(await outputText(page,'roku-disassembly'));
  await expect(page.locator('#roku-disassembly .tw-comment').first()).toBeVisible();
  await page.locator('#build-targets summary').click();
  await page.locator('#optimize').uncheck();
  await expect.poll(()=>outputText(page,'roku-disassembly'),{timeout:60000}).not.toBe(brs);
  await expect(page.locator('#roku-download')).toHaveAttribute('href',/^blob:/,{timeout:60000});
  await page.locator('#preserve-comments').uncheck();
  await expect.poll(async()=>{
    const code=await outputText(page,'roku-disassembly');
    return code.includes('function TowerRun(') && !code.includes('Roku download note');
  },{timeout:60000}).toBe(true);
  const staleURL=await page.locator('#roku-download').getAttribute('href');
  await page.locator('#target-roku').uncheck();
  await expect(page.locator('#roku-column')).toBeHidden();
  await expect(page.locator('#roku-download')).toHaveCount(0);
  expect(await page.evaluate(async url=>{try {await fetch(url);return true;} catch {return false;}},staleURL)).toBe(false);
});
