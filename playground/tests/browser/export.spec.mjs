import { outputText } from './output-text.mjs';
import {selectDocument} from './project-helpers.mjs';
import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test.beforeEach(async({page})=>{
 await page.goto('/');await expect(page.locator('#status')).toContainText('Complete');
 await selectDocument(page, 'memory.tower');
 await expect(page.locator('#execution-status')).toContainText('backends match',{timeout:30000});
});
async function choose(page,key,checked){
 await page.locator('#build-targets summary').click();await page.locator('#target-'+key).setChecked(checked);
 await page.locator('#build-targets summary').click();
}
test('target selection controls compilation and equal columns without stopping the interpreter',async({page},info)=>{
 await expect(page.locator('#wasm-disassembly-column #llvm-download')).toBeVisible();
 await expect.poll(()=>outputText(page,'wasm-disassembly')).toContain('tower_main');
 await expect.poll(()=>outputText(page,'wasm-disassembly')).toContain('i32.const');
 await expect(page.locator('.runner-column h2').first()).toContainText('Interpreter Execution');
 await expect(page.locator('#wasm-column h2')).toContainText('Wasm Execution');
 const event=page.waitForEvent('download');await page.locator('#llvm-download').click();
 expect(WebAssembly.validate(await readFile(await(await event).path()))).toBe(true);
 const widths=await page.locator('.execution-column:visible').evaluateAll(items=>items.map(x=>x.getBoundingClientRect().width));
 expect(Math.max(...widths)-Math.min(...widths)).toBeLessThan(2);
 await page.screenshot({path:`../build/targets-${info.project.name}.png`,fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
 await choose(page,'wasm',false);
 await expect(page.locator('#execution-output')).toHaveText('5\n84\n42\n');
 await expect(page.locator('.execution-column:visible')).toHaveCount(2);
 await expect(page.locator('#llvm-raw-column')).toBeHidden();await expect(page.locator('#wasm-column')).toBeHidden();
 await expect(page.locator('#wasm-disassembly-column')).toBeHidden();await expect(page.locator('#llvm-download')).toBeHidden();
 const requests=[];page.on('request',r=>requests.push(r.url()));
 await page.locator('#execute').click();await expect(page.locator('#execution-status')).toHaveText('Finished');
 expect(requests.some(url=>url.includes('tower-llvm')||url.includes('tower-cross'))).toBe(false);
});
test('native targets compile automatically, display disassembly and download platform files',async({page},info)=>{
 test.setTimeout(180000);
 await choose(page,'wasm',false);
 await page.locator('#auto-execute').uncheck();
 for(const key of ['windows','linux','mac','linux-arm','mac-arm']) await choose(page,key,true);
 await page.locator('#auto-execute').check();
 await expect(page.locator('#mac-arm-downloads a')).toHaveCount(1,{timeout:120000});
 await expect(page.locator('#llvm-raw-column')).toBeVisible();await expect(page.locator('#wasm-column')).toBeHidden();
 for(const [key,label,extension,magic] of [['windows','Windows x64','exe',[77,90]],['linux','Linux x64','elf',[127,69,76,70]],['mac','macOS x64','macho',[207,250,237,254]],['linux-arm','Linux ARM64','elf',[127,69,76,70]],['mac-arm','macOS ARM64','macho',[207,250,237,254]]]){
  await expect(page.locator('#'+key+'-error')).toBeHidden();
  await expect(page.locator('#'+key+'-column h2')).toHaveText(label+' disassembly');
  await expect.poll(()=>outputText(page,key+'-disassembly')).toContain('ret');
  const event=page.waitForEvent('download');await page.locator('#'+key+'-downloads').getByRole('link',{name:label,exact:true}).click();
  const download=await event;await download.saveAs(`../build/browser-export-${info.project.name}.${extension}`);
  expect(download.suggestedFilename()).toBe('memory-'+key+'.'+extension);
  expect([...(await readFile(await download.path())).subarray(0,magic.length)]).toEqual(magic);
  await page.locator('#'+key+'-disassembly').scrollIntoViewIfNeeded();
  await expect(page.locator('#'+key+'-disassembly .tw-keyword').first()).toBeVisible();
 }
 async function reuse(file) {
  await expect(page.locator('#mac-arm-phase')).toHaveText('Finished');
  const workers=page.workers().filter(w=>w.url().includes('target-worker'));
  expect(workers).toHaveLength(1);
  const requests=[];const record=r=>requests.push(r.url());page.on('request',record);
  await selectDocument(page, file);
  await expect(page.locator('#mac-arm-downloads a')).toHaveAttribute('download',file.replace('.tower','-mac-arm.macho'));
  await expect(page.locator('#mac-arm-phase')).toHaveText('Finished');
  expect(page.workers().filter(w=>w.url().includes('target-worker'))).not.toEqual(workers);
  expect(requests.some(url=>url.includes('tower-cross.wasm'))).toBe(true);
  page.off('request',record);
 }
 await reuse('functions.tower');
 await reuse('memory.tower');
 await page.screenshot({path:`../build/targets-arm-${info.project.name}.png`,fullPage:true});
});
test('cancel stops pending native builds and edits discard stale downloads',async({page})=>{
 let release;const gate=new Promise(r=>release=r);
 await page.route('**/tower-cross.wasm.gz',async route=>{await gate;await route.continue().catch(()=>{});});
 await choose(page,'windows',true);await expect(page.locator('#windows-phase')).toHaveText('Loading…');
 await page.locator('#cancel-execution').click();await expect(page.locator('#execution-status')).toHaveText('Cancelled');
 release();await page.unroute('**/tower-cross.wasm.gz');await choose(page,'windows',false);
 const editor=page.getByRole('textbox',{name:'Tower source'});await editor.click();await editor.press('ControlOrMeta+a');await page.keyboard.insertText('print(42);');
 await expect(page.locator('#execution-output')).toHaveText('42\n');await expect(page.locator('#windows-downloads a')).toHaveCount(0);
});
