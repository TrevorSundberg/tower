import {test,expect} from '@playwright/test';
import {selectDocument} from './project-helpers.mjs';

async function edit(page,text) {
  await page.locator('#editor').click({position:{x:80,y:20}});
  await page.getByRole('textbox',{name:'Tower source'}).press('ControlOrMeta+a');
  await page.keyboard.insertText(text);await page.keyboard.press('Escape');
}
test.beforeEach(async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('tower-build-targets-v3',JSON.stringify({wasm:false,interpreter:true,fast:false})));
  await page.goto('/');await expect(page.locator('#status')).toContainText('Complete');
});
test('new parse errors wait ten seconds from the last edit while analysis continues',async({page})=>{
  await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));
  await edit(page,'print(42)');await page.clock.runFor(500);
  await expect(page.locator('#status')).toContainText('Stopped');
  await expect(page.locator('.tw-inline-error')).toHaveCount(0);
  await page.clock.fastForward(9000);
  await expect(page.locator('#editor-error')).toBeHidden();
  await page.keyboard.insertText(' ');await page.clock.runFor(500);
  await expect(page.locator('#status')).toContainText('Stopped');
  await page.clock.fastForward(9499);
  await expect(page.locator('#editor-error')).toBeHidden();
  await page.clock.fastForward(1);
  await expect(page.locator('.tw-inline-error-message')).toContainText("Missing ';'");
});
test('moving the caret or clicking away reveals errors without waiting for idle',async({page})=>{
  await edit(page,'print(42)');await expect(page.locator('#status')).toContainText('Stopped');
  await expect(page.locator('#editor-error')).toBeHidden();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.tw-inline-error-message')).toContainText("Missing ';'");
  await edit(page,'print(42);');await expect(page.locator('.tw-inline-error')).toHaveCount(0);
  await edit(page,'var wrong: i32 = true;');
  await expect(page.locator('#execution-status')).toContainText('Failed');
  await expect(page.locator('#editor-error')).toBeHidden();
  await expect(page.locator('#execution-error')).toBeHidden();
  await page.getByRole('tab',{name:'Active grammar'}).click();
  await expect(page.locator('.tw-inline-error-message')).toContainText('Expected i32');
  await expect(page.locator('#execution-error')).toContainText('Expected i32');
});
test('corrected input and document switches discard pending diagnostics',async({page})=>{
  await edit(page,'print(42)');await expect(page.locator('#status')).toContainText('Stopped');
  await page.keyboard.insertText(';');await expect(page.locator('#status')).toContainText('Complete');
  await page.keyboard.press('ArrowLeft');await expect(page.locator('.tw-inline-error')).toHaveCount(0);
  await edit(page,'var wrong: i32 = true;');await expect(page.locator('#execution-status')).toContainText('Failed');
  await selectDocument(page,'increment.tower');await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('#editor-error')).toBeHidden();
  await expect(page.locator('#execution-error')).toBeHidden();
});
