import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test.beforeEach(async({page})=>{
 await page.goto('/');await expect(page.locator('#status')).toContainText('Complete');
 await page.locator('#example-kind').selectOption('memory.tower');
 await expect(page.locator('#execution-status')).toContainText('backends match',{timeout:30000});
});
async function choose(page,key,checked){
 await page.locator('#build-targets summary').click();await page.locator('#target-'+key).setChecked(checked);
 await page.locator('#build-targets summary').click();
}
test('target selection controls compilation and equal columns without stopping the interpreter',async({page},info)=>{
 await expect(page.locator('#llvm-download')).toBeVisible();
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
 const requests=[];page.on('request',r=>requests.push(r.url()));
 await page.locator('#execute').click();await expect(page.locator('#execution-status')).toHaveText('Finished');
 expect(requests.some(url=>url.includes('tower-llvm')||url.includes('tower-cross'))).toBe(false);
});
test('native targets compile automatically, display disassembly and download platform files',async({page},info)=>{
 test.setTimeout(180000);
 await choose(page,'wasm',false);await choose(page,'x86',true);
 await expect(page.locator('#x86-downloads a')).toHaveCount(3,{timeout:120000});
 await expect(page.locator('#x86-error')).toBeHidden();await expect(page.locator('#x86-disassembly')).toContainText('ret');
 await expect(page.locator('#llvm-raw-column')).toBeVisible();await expect(page.locator('#wasm-column')).toBeHidden();
 for(const [label,extension,magic] of [['Windows x64','exe',[77,90]],['Linux x64','elf',[127,69,76,70]],['macOS x64','macho',[207,250,237,254]]]){
  const event=page.waitForEvent('download');await page.locator('#x86-downloads').getByRole('link',{name:label,exact:true}).click();
  const download=await event;await download.saveAs(`../build/browser-export-${info.project.name}.${extension}`);
  expect([...(await readFile(await download.path())).subarray(0,magic.length)]).toEqual(magic);
 }
 await choose(page,'x86',false);await choose(page,'arm',true);
 await expect(page.locator('#arm-downloads a')).toHaveCount(2,{timeout:120000});
 await expect(page.locator('#arm-error')).toBeHidden();await expect(page.locator('#arm-disassembly')).toContainText('ret');
 await page.screenshot({path:`../build/targets-arm-${info.project.name}.png`,fullPage:true});
});
test('cancel stops pending native builds and edits discard stale downloads',async({page})=>{
 let release;const gate=new Promise(r=>release=r);
 await page.route('**/tower-cross.wasm.gz',async route=>{await gate;await route.continue().catch(()=>{});});
 await choose(page,'x86',true);await expect(page.locator('#x86-phase')).toHaveText('Loading…');
 await page.locator('#cancel-execution').click();await expect(page.locator('#execution-status')).toHaveText('Cancelled');
 release();await page.unroute('**/tower-cross.wasm.gz');await choose(page,'x86',false);
 const editor=page.getByRole('textbox',{name:'Tower source'});await editor.click();await editor.press('ControlOrMeta+a');await page.keyboard.insertText('print(42);');
 await expect(page.locator('#execution-output')).toHaveText('42\n');await expect(page.locator('#x86-downloads a')).toHaveCount(0);
});
