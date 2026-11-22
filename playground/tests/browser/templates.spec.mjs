import { outputText } from './output-text.mjs';
import {selectDocument} from './project-helpers.mjs';
import {test,expect} from '@playwright/test';

test('Templates run in both workers and show concrete shared foundation output',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await selectDocument(page, 'templates.tower');
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

test('Tower match and collection examples execute and expose imported libraries',async({page})=>{
 await page.goto('/');
 for(const [name,output] of [['match','10\n20\n20\n30\n'],['collections','30\n20\n10\n10\n20\n30\n']]) {
  await selectDocument(page,name+'.tower');
  await expect(page.locator('#filename')).toHaveText(name+'.tower');
  for(const pane of ['execution-output','fast-output','llvm-output'])
   await expect(page.locator('#'+pane)).toHaveText(output,{timeout:25000});
  await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
 }
 await expect(page.locator('#file-tree button[data-path=".tower/library/queue.tower"]')).toBeVisible();
 const dependencies = await page.locator('#file-tree > button.file-entry').evaluateAll(items=>items.map(item=>item.dataset.path));
 expect(dependencies.indexOf('.tower/bedrock.tower')).toBeLessThan(dependencies.indexOf('.tower/foundation.tower'));
 expect(dependencies.indexOf('.tower/foundation.tower')).toBeLessThan(dependencies.indexOf('.tower/tower.tower'));
 expect(dependencies.indexOf('.tower/library/vector.tower')).toBeLessThan(dependencies.indexOf('.tower/library/stack.tower'));
 await selectDocument(page,'library/queue.tower');
 await expect(page.locator('.cm-content')).toContainText('fn queue(T: type): type');
 await selectDocument(page,'match.tower');
 await expect(page.locator('#file-tree button[data-path=".tower/library/queue.tower"]')).toHaveCount(0);
});
