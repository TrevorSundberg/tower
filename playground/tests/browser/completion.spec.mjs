import {test, expect} from '@playwright/test';
import {selectDocument} from './project-helpers.mjs';

async function source(page, text) {
  const editor = page.locator('#editor .cm-content');
  await editor.press('Escape');
  await editor.click(); await editor.press('ControlOrMeta+a');
  await page.keyboard.insertText(text);
  // Installing a fixture can itself start completion; each test triggers its
  // own query after this replacement, with the caret at the document end.
  await editor.press('ControlOrMeta+End');
  await editor.press('Escape');
  return editor;
}
test.beforeEach(async ({page}) => {
  await page.goto('/'); await expect(page.locator('#status')).toContainText('Complete');
  await page.locator('#auto-execute').uncheck();
});
test('typing opens suggestions; Tab/Enter accept; Escape dismisses; undo restores input', async ({page}) => {
  const editor = await source(page, '');
  await page.keyboard.type('pri');
  await expect(page.getByRole('option').filter({hasText:'print'})).toBeVisible();
  await page.keyboard.press('Tab'); await expect(editor.locator('.cm-line')).toHaveText('print');
  await page.keyboard.press('ControlOrMeta+z'); await expect(editor.locator('.cm-line')).toHaveText('pri');
  await page.keyboard.press('Control+Space');
  await expect(page.getByRole('option').filter({hasText:'print'})).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.getByRole('listbox')).toHaveCount(0);
  await page.keyboard.press('Control+Space');
  await expect(page.getByRole('option').filter({hasText:'print'})).toBeVisible();
  await page.keyboard.press('Enter'); await expect(editor.locator('.cm-line')).toHaveText('print');
});
test('locals, types and members complete on unfinished code, including a touch selection', async ({page}) => {
  const editor = await source(page, 'fn demo(parameter: i32): void { var local: i32 = 1; ');
  await page.keyboard.type('loc');
  await expect(page.getByRole('option').filter({hasText:'local'})).toBeVisible();
  await page.getByRole('option').filter({hasText:'local'}).click();
  await expect(editor).toContainText('1; local');
  await source(page, 'struct Point { x: i32; y: i32; } var point: Point; point');
  await page.keyboard.type('.');
  await expect(page.getByRole('option').filter({hasText:/^x/})).toBeVisible();
  await expect(page.locator('.cm-tooltip-autocomplete [role=option]')).toHaveCount(2);
  await source(page, 'var count: '); await page.keyboard.type('u');
  await expect(page.getByRole('option').filter({hasText:'usize'})).toBeVisible();
  await expect(page.getByRole('option').filter({hasText:'print'})).toHaveCount(0);
  await source(page, 'fn demo(local: i32): void { { { { ');
  await page.keyboard.type('loc');
  await expect(page.getByRole('option').filter({hasText:'local'})).toBeVisible();
  await source(page, 'fn demo(value: ');
  await page.keyboard.type('i');
  await expect(page.getByRole('option').filter({hasText:'i32'})).toBeVisible();
});
test('comments suppress completion and switching documents rejects old results', async ({page}) => {
  await source(page, '// '); await page.keyboard.type('pri');
  await page.keyboard.press('Control+Space');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await source(page, ''); await page.keyboard.type('pri');
  await selectDocument(page, 'foundation.tower');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await source(page, 'parse Example = CoreO'); await page.keyboard.press('Control+Space');
  // Foundation starts from Bedrock, so Foundation's own CoreOperand is not imported.
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await source(page, 'parse Example = Id'); await page.keyboard.press('Control+Space');
  await expect(page.getByRole('option').filter({hasText:'Identifier'})).toBeVisible();
});

test('call suggestions follow parser state and the resolved parameter type', async ({page}) => {
  await source(page, 'var value: i32 = 1; print(');
  await page.keyboard.type('va');
  const options = page.locator('.cm-tooltip-autocomplete [role=option]');
  await expect(options).toHaveCount(1);
  await expect(options).toContainText('value');
  await expect(options).not.toContainText('active grammar');
  await source(page, 'var value: i32 = 1; var valid: bool = true; fn check(flag: bool): void {} check(');
  await page.keyboard.type('va');
  await expect(options).toHaveCount(1);
  await expect(options).toContainText('valid');
  await page.keyboard.press('Tab');
  await expect(page.locator('#editor .cm-content')).toContainText('check(valid');
});

test('member suggestions use inferred types and field-path resolution', async ({page}) => {
  await source(page, 'struct Inner { count: i32; ready: bool; } struct Outer { inner: Inner; } var outer: Outer; var pointer = &outer; var flag: bool = pointer.inner');
  await page.keyboard.type('.');
  const options = page.locator('.cm-tooltip-autocomplete [role=option]');
  await expect(options).toHaveCount(1);
  await expect(options).toContainText('ready');
});

test('late completion replies cannot replace suggestions for newer input', async ({page}) => {
  const oldSource = 'import tower; pri';
  await source(page, oldSource);
  await page.evaluate(oldSource => {
    const post = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function(data, ...args) {
      if (data.method === 'complete' && data.source === oldSource && data.cursor === oldSource.length) {
        Worker.prototype.postMessage = post;
        const hold = event => {
          if (event.data.id !== data.id) return;
          this.removeEventListener('message', hold, true);
          event.stopImmediatePropagation();
          window.heldLabels = event.data.result.options.map(option => option.label);
          window.releaseCompletion = () => this.dispatchEvent(new MessageEvent('message', {data:event.data}));
        };
        this.addEventListener('message', hold, true);
      }
      return post.call(this, data, ...args);
    };
  }, oldSource);
  await page.keyboard.press('Control+Space');
  await expect.poll(() => page.evaluate(() => window.heldLabels ?? [])).toContain('print');
  await source(page, 'import tower; var value: u'); await page.keyboard.press('Control+Space');
  await page.evaluate(() => window.releaseCompletion());
  await expect(page.locator('.cm-tooltip-autocomplete [role=option]').filter({hasText:'usize'})).toBeVisible();
  await expect(page.locator('.cm-tooltip-autocomplete [role=option]').filter({hasText:'print'})).toHaveCount(0);
});

test('dot uses an exact prepared compiler answer, including changed types and a Unicode prefix',async({page})=>{
  await page.evaluate(()=>{
    window.queries=[];window.prepared=[];
    const post=Worker.prototype.postMessage;
    Worker.prototype.postMessage=function(data,...args) {
      if(data.method==='complete') {
        window.queries.push(data.source);
        const receive=event=>{
          if(event.data.id!==data.id)return;
          this.removeEventListener('message',receive);
          window.prepared.push(data.source);
        };
        this.addEventListener('message',receive);
      }
      return post.call(this,data,...args);
    };
  });
  for(const field of ['first','changed']) {
    const text=`import tower;\n// 雪🚀\nstruct Point { ${field}:i32; } var point:Point; print(point);`;
    await source(page,text);await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowLeft');
    const predicted=text.replace('print(point);','print(point.);');
    await expect.poll(()=>page.evaluate(text=>window.prepared.includes(text),predicted)).toBe(true);
    const before=await page.evaluate(()=>window.queries.length);
    await page.keyboard.press('.');
    await expect(page.locator('.cm-completionLabel')).toHaveText([field]);
    expect(await page.evaluate(()=>window.queries.length)).toBe(before);
  }
});

test('a slow first worker load does not let speculation discard the visible completion request',async({page})=>{
  await page.route('**/language-worker.js',async route=>{
    await new Promise(resolve=>setTimeout(resolve,400));await route.continue();
  });
  await source(page,'pri');await page.keyboard.press('Control+Space');
  await expect(page.getByRole('option').filter({hasText:'print'})).toBeVisible();
});
