import { outputText } from './output-text.mjs';
import {test,expect} from '@playwright/test';

test('Templates run in both workers and show concrete shared foundation output',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.locator('#example-kind').selectOption('templates.tower');
 await expect(page.locator('#filename')).toHaveText('templates.tower');
 await expect(page.locator('#execution-output')).toHaveText('20\n10\n');
 await expect(page.locator('#llvm-output')).toHaveText('20\n10\n',{timeout:25000});
 await expect.poll(()=>outputText(page,'core-instructions')).toContain('struct `buffer(i32, 4)`');
 await expect.poll(()=>outputText(page,'core-instructions')).toContain('fn `push(i32)`');
 await expect.poll(()=>outputText(page,'core-instructions')).not.toContain('T: type');
 await expect(page.locator('#execution-status')).toContainText('match');
 await page.screenshot({path:`../build/templates-${info.project.name}.png`});
 expect(errors).toEqual([]);
});
