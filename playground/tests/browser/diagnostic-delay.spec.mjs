import {test,expect} from '@playwright/test';
import {savedSource} from './project-helpers.mjs';

const missingSemicolon = 'import foundation;\nprint(42)';
const wrongType = 'import foundation;\nvar wrong: i32 = true;';

async function edit(page,text) {
  const editor = page.getByRole('textbox',{name:'Tower source'});
  await editor.focus();
  await editor.press('ControlOrMeta+a');
  await page.keyboard.insertText(text);
  await page.keyboard.press('Escape');
  await expect.poll(()=>savedSource(page)).toBe(text);
}
async function expectMissingSemicolon(page) {
  await expect(page.locator('.tw-inline-error-message')).toContainText("Missing ';' before end of input.");
  await expect(page.locator('.tw-inline-error-heading')).toHaveText('Errorforeach.tower:2:10');
  await expect(page.locator('.tw-error-point')).toHaveCount(1);
}
test.beforeEach(async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('tower-build-targets-v3',JSON.stringify({wasm:false,interpreter:true,fast:false})));
  await page.goto('/');await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('#filename')).toHaveText('foreach.tower');
});
test('new parse errors wait ten seconds from the last edit while analysis continues',async({page})=>{
  await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));
  await edit(page,missingSemicolon);await page.clock.runFor(500);
  await expect(page.locator('#status')).toContainText('Stopped');
  await expect(page.locator('.tw-inline-error')).toHaveCount(0);
  await page.clock.fastForward(9000);
  await expect(page.locator('#editor-error')).toBeHidden();
  await page.keyboard.insertText(' ');await page.clock.runFor(500);
  await expect.poll(()=>savedSource(page)).toBe(missingSemicolon+' ');
  await expect(page.locator('#status')).toContainText('Stopped');
  await page.clock.fastForward(9499);
  await expect(page.locator('#editor-error')).toBeHidden();
  await expect(page.locator('.tw-inline-error')).toHaveCount(0);
  await page.clock.fastForward(1);
  await expectMissingSemicolon(page);
});
test('moving the caret or clicking away reveals errors without waiting for idle',async({page})=>{
  await page.clock.install();
  await edit(page,missingSemicolon);await expect(page.locator('#status')).toContainText('Stopped');
  await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now()+1000)));
  await expect(page.locator('#editor-error')).toBeHidden();
  await expect(page.locator('#position')).toHaveText('foreach.tower:2:10');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#position')).toHaveText('foreach.tower:2:9');
  await expectMissingSemicolon(page);
  await page.locator('#editor-error').click();
  await expect(page.locator('#position')).toHaveText('foreach.tower:2:10');
  await page.clock.resume();
  await page.keyboard.insertText(';');
  await expect.poll(()=>savedSource(page)).toBe(missingSemicolon+';');
  await expect(page.locator('#execution-output')).toHaveText('42\n');
  await expect(page.locator('.tw-inline-error')).toHaveCount(0);
  await edit(page,wrongType);
  await expect(page.locator('#execution-status')).toContainText('Failed');
  await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now()+1000)));
  await expect(page.locator('#editor-error')).toBeHidden();
  await expect(page.locator('#execution-error')).toBeHidden();
  await page.getByRole('tab',{name:'Active grammar'}).click();
  await expect(page.locator('.tw-inline-error-message')).toContainText('Expected i32, got bool');
  await expect(page.locator('.tw-inline-error-heading')).toHaveText('Errorforeach.tower:2:18');
  await expect(page.locator('.tw-error-range')).toHaveText('true');
  await expect(page.locator('#execution-error')).toContainText('Expected i32, got bool');
});
test('corrected input and document switches discard pending diagnostics',async({page},info)=>{
  await edit(page,missingSemicolon);await expect(page.locator('#status')).toContainText('Stopped');
  await expect(page.locator('.tw-inline-error')).toHaveCount(0);
  // Hold one real parse reply across the correction. Inspect the UI after the
  // obsolete reply is consumed, before the next animation frame can parse again.
  await page.evaluate(source=>{
    const send = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function(request,...rest) {
      if (request.method === 'analyze' && request.source === source) {
        Worker.prototype.postMessage = send;
        const receive = this.onmessage;
        this.onmessage = event=>{
          this.onmessage = receive;
          window.releaseParse = () => {
            receive.call(this,event);
            return event.data.result.end;
          };
        };
      }
      return send.call(this,request,...rest);
    };
  },missingSemicolon+' ');
  await page.keyboard.insertText(' ');
  await expect.poll(()=>page.evaluate(()=>typeof window.releaseParse)).toBe('function');
  await page.keyboard.insertText(';');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#status')).toHaveText('Updating...');
  const stale = await page.evaluate(async()=>{
    const end = window.releaseParse();
    await Promise.resolve();
    return {end,status:document.querySelector('#status').textContent,
      visible:!!document.querySelector('.tw-inline-error')};
  });
  await info.attach('superseded-parse',{body:JSON.stringify(stale),contentType:'application/json'});
  expect(stale.end.error).toContain("Missing ';' before end of input.");
  expect(stale.end.errorOffset).toBe(missingSemicolon.length);
  expect(stale.status).toContain('Updating');
  expect(stale.visible).toBe(false);
  await expect.poll(()=>savedSource(page)).toBe(missingSemicolon+' ;');
  await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('#execution-output')).toHaveText('42\n');
  await expect(page.locator('.tw-inline-error')).toHaveCount(0);

  await page.clock.install();
  await edit(page,wrongType);await expect(page.locator('#execution-status')).toContainText('Failed');
  await expect(page.locator('#editor-error')).toBeHidden();
  await expect(page.locator('#execution-error')).toBeHidden();
  await page.locator('#file-tree button[data-path=".tower/bedrock.tower"]').click();
  await expect(page.locator('#filename')).toHaveText('bedrock.tower');
  await page.clock.fastForward(10000);
  await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('#editor-error')).toBeHidden();
  await expect(page.locator('.tw-inline-error')).toHaveCount(0);
  await expect(page.locator('#execution-error')).toBeHidden();
});
