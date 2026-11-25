import {test, expect} from '@playwright/test';
import {selectDocument} from './project-helpers.mjs';

async function source(page, text) {
  const editor = page.locator('#editor .cm-content');
  await editor.press('Escape');
  await editor.click(); await editor.press('ControlOrMeta+a');
  // Use the editor's plain-text paste path. Chromium's insertText over a
  // multiline selection can leave a final newline after the inserted text.
  await editor.evaluate((element, text) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', text);
    element.dispatchEvent(new ClipboardEvent('paste', {clipboardData, bubbles:true, cancelable:true}));
  }, text);
  await expect(editor.locator('.cm-line')).toHaveText(text.split('\n'));
  // Installing a fixture can itself start completion; each test triggers its
  // own query after this replacement, with the caret at the document end.
  await editor.press('ControlOrMeta+End');
  await editor.press('Escape');
  return editor;
}
function towerSource(page, text) {
  return source(page, 'import tower;\n' + text);
}

// Match the actual foreground query at the document end. Capture the reply at
// the application's onmessage callback, which the worker already has at post time.
async function nextCompletion(page, source, hold = false) {
  return page.evaluateHandle(({source, hold}) => {
    const state = {answer:null};
    const post = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function(request, ...args) {
      if (request.method === 'complete' && request.source === source &&
          request.cursor === new TextEncoder().encode(source).length) {
        Worker.prototype.postMessage = post;
        const receive = this.onmessage;
        this.onmessage = event => {
          if (event.data.id !== request.id) return receive.call(this, event);
          this.onmessage = receive;
          state.answer = event.data.error ?? event.data.result.options.map(option => option.label);
          if (hold) state.release = () => receive.call(this, event);
          else receive.call(this, event);
        };
      }
      return post.call(this, request, ...args);
    };
    return state;
  }, {source, hold});
}

async function openEditor(page) {
  await page.goto('/'); await expect(page.locator('#status')).toContainText('Complete');
  await page.locator('#auto-execute').uncheck();
}
test('typing opens suggestions; Tab/Enter accept; Escape dismisses; undo restores input', async ({page}) => {
  await openEditor(page);
  const editor = await towerSource(page, '');
  await page.keyboard.type('pri');
  await expect(page.getByRole('option').filter({hasText:'print'})).toBeVisible();
  await page.keyboard.press('Tab'); await expect(editor.locator('.cm-line')).toHaveText(['import tower;', 'print']);
  await page.keyboard.press('ControlOrMeta+z'); await expect(editor.locator('.cm-line')).toHaveText(['import tower;', 'pri']);
  await page.keyboard.press('Control+Space');
  await expect(page.getByRole('option').filter({hasText:'print'})).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.getByRole('listbox')).toHaveCount(0);
  await page.keyboard.press('Control+Space');
  await expect(page.getByRole('option').filter({hasText:'print'})).toBeVisible();
  await page.keyboard.press('Enter'); await expect(editor.locator('.cm-line')).toHaveText(['import tower;', 'print']);
});
test('locals, types and members complete on unfinished code, including a touch selection', async ({page,hasTouch}) => {
  await openEditor(page);
  const prefix = 'fn other(localElsewhere: i32): void {}\nfn demo(parameter: i32): void { var local: i32 = 1; ';
  const editor = await towerSource(page, prefix);
  await page.keyboard.type('loc');
  await expect(page.getByRole('option').filter({hasText:'local'})).toBeVisible();
  await expect(page.getByRole('option').filter({hasText:'localElsewhere'})).toHaveCount(0);
  const local = page.getByRole('option').filter({hasText:'local'});
  if (hasTouch) await local.tap();
  else await local.click();
  await expect(editor).toContainText('1; local');
  await page.keyboard.type(' = 2; print(local); }');
  await expect(editor.locator('.cm-line')).toHaveText(('import tower;\n' + prefix + 'local = 2; print(local); }').split('\n'));
  await towerSource(page, 'struct Point { x: i32; y: i32; } var point: Point; point');
  await page.keyboard.type('.');
  await expect(page.getByRole('option').filter({hasText:/^x/})).toBeVisible();
  await expect(page.locator('.cm-tooltip-autocomplete [role=option]')).toHaveCount(2);
  await towerSource(page, 'var count: '); await page.keyboard.type('u');
  await expect(page.getByRole('option').filter({hasText:'usize'})).toBeVisible();
  await expect(page.getByRole('option').filter({hasText:'print'})).toHaveCount(0);
  await towerSource(page, 'fn demo(local: i32): void { { { { ');
  await page.keyboard.type('loc');
  await expect(page.getByRole('option').filter({hasText:'local'})).toBeVisible();
  await towerSource(page, 'fn demo(value: ');
  await page.keyboard.type('i');
  await expect(page.getByRole('option').filter({hasText:'i32'})).toBeVisible();
});
test('comments suppress completion and switching documents rejects old results', async ({page}) => {
  await openEditor(page);
  await selectDocument(page, 'memory.tower');
  await expect(page.locator('[data-path=".tower/foundation.tower"]')).toBeVisible();
  await expect(page.locator('#filename')).toHaveText('memory.tower');
  await towerSource(page, '// ');
  const comment = await nextCompletion(page, 'import tower;\n// pri');
  await page.keyboard.type('pri'); await page.keyboard.press('Control+Space');
  await expect.poll(() => comment.evaluate(state => state.answer)).toEqual([]);
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await towerSource(page, ''); await page.keyboard.type('pri');
  await expect(page.getByRole('option').filter({hasText:'print'})).toBeVisible();
  await selectDocument(page, 'foundation.tower');
  await expect(page.locator('#filename')).toHaveText('foundation.tower');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await source(page, 'parse Example = CoreO');
  const wrapper = await nextCompletion(page, 'parse Example = CoreO');
  await page.keyboard.press('Control+Space');
  await expect.poll(() => wrapper.evaluate(state => state.answer)).toEqual([]);
  // Foundation starts from Bedrock, so Foundation's own CoreOperand is not imported.
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await source(page, 'parse Example = Id'); await page.keyboard.press('Control+Space');
  await expect(page.getByRole('option').filter({hasText:'Identifier'})).toBeVisible();
});

test('call suggestions follow parser state and the resolved parameter type', async ({page}) => {
  await openEditor(page);
  await towerSource(page, 'var value: i32 = 1; print(');
  await page.keyboard.type('va');
  const options = page.locator('.cm-tooltip-autocomplete [role=option]');
  await expect(options).toHaveCount(1);
  await expect(options).toContainText('value');
  await expect(options).not.toContainText('active grammar');
  await towerSource(page, 'var value: i32 = 1; var valid: bool = true; fn check(flag: bool): void {} check(');
  await page.keyboard.type('va');
  await expect(options).toHaveCount(1);
  await expect(options).toContainText('valid');
  await page.keyboard.press('Tab');
  await expect(page.locator('#editor .cm-content')).toContainText('check(valid');
});

test('member suggestions use inferred types and field-path resolution', async ({page}) => {
  await openEditor(page);
  await towerSource(page, 'struct Inner { count: i32; ready: bool; } struct Outer { inner: Inner; } var outer: Outer; var pointer = &outer; var flag: bool = pointer.inner');
  await page.keyboard.type('.');
  const options = page.locator('.cm-tooltip-autocomplete [role=option]');
  await expect(options).toHaveCount(1);
  await expect(options).toContainText('ready');
});

test('late completion replies cannot replace suggestions for newer input', async ({page}) => {
  await openEditor(page);
  const oldSource = 'import tower; pri';
  await source(page, oldSource);
  const held = await nextCompletion(page, oldSource, true);
  await page.keyboard.press('Control+Space');
  await expect.poll(() => held.evaluate(state => state.answer)).toContain('print');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await source(page, 'import tower; var value: u'); await page.keyboard.press('Control+Space');
  await held.evaluate(state => state.release());
  await expect(page.locator('.cm-tooltip-autocomplete [role=option]').filter({hasText:'usize'})).toBeVisible();
  await expect(page.locator('.cm-tooltip-autocomplete [role=option]').filter({hasText:'print'})).toHaveCount(0);
});

test('dot uses an exact prepared compiler answer, including changed types and a Unicode prefix',async({page})=>{
  await openEditor(page);
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

    // Move back in front of the existing member separator. Give the prediction
    // timer a full turn, then check that only a real second dot makes the request.
    await page.keyboard.press('Escape');await page.keyboard.press('ArrowLeft');
    const doubled=predicted.replace('print(point.);','print(point..);');
    await page.waitForTimeout(200);
    expect(await page.evaluate(()=>window.queries)).not.toContain(doubled);
    await page.keyboard.press('.');
    await expect(page.locator('.cm-completionLabel')).toHaveText([field]);
    expect(await page.evaluate(()=>window.queries)).toContain(doubled);
  }
});

test('a slow first worker load does not let speculation discard the visible completion request',async({page})=>{
  // The isolation service worker fetches the worker script. Route at the
  // context boundary before navigation so the first load is actually held.
  let loads = 0;
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.context().route('**/language-worker.js', async route => {
    loads++;
    await gate;
    await route.continue();
  });
  try {
    await openEditor(page);
    await towerSource(page, 'pri');
    await page.keyboard.press('Control+Space');
    await expect.poll(() => loads).toBeGreaterThan(0);
    // Keep the first load pending through the editor's speculative-dot timer.
    await page.waitForTimeout(400);
    await expect(page.getByRole('listbox')).toHaveCount(0);
  } finally {
    release();
  }
  const print = page.getByRole('option').filter({hasText:'print'});
  await expect(print).toBeVisible();
  await expect(print).toHaveAttribute('aria-selected','true');
  await page.keyboard.press('Tab');
  await expect(page.locator('#editor .cm-line')).toHaveText(['import tower;', 'print']);
});

test('returning to a file reuses the idle language worker with the edited project inputs', async ({page}) => {
  await page.addInitScript(() => {
    const workers = new Map(), post = Worker.prototype.postMessage;
    window.documentReplies = [];
    Worker.prototype.postMessage = function(request, ...args) {
      if (request?.method === 'document') {
        if (!workers.has(this)) workers.set(this, workers.size + 1);
        const receive = ({data}) => {
          if (data.id !== request.id) return;
          this.removeEventListener('message', receive);
          if (data.result) window.documentReplies.push({
            worker:workers.get(this), path:request.activePath, source:request.source, files:request.files,
          });
        };
        this.addEventListener('message', receive);
      }
      return post.call(this, request, ...args);
    };
  });
  await openEditor(page);
  const entry = await page.locator('#filename').innerText();
  await page.waitForFunction(path => window.documentReplies.some(r => r.path === path), entry);
  const first = await page.evaluate(() => window.documentReplies.at(-1));
  const other = 'independent.tower';
  page.once('dialog', dialog => dialog.accept(other));
  await page.locator('#new-file').click();
  await page.waitForFunction(path => window.documentReplies.some(r => r.path === path), other);
  const text = 'import tower; var x: i32 = 73;';
  await source(page, text);
  await page.waitForFunction(text => window.documentReplies.some(r => r.source === text), text);
  await selectDocument(page, entry);
  await page.waitForFunction(({entry, other, text}) => window.documentReplies.some(r =>
    r.path === entry && r.files.some(file => file.path === other && file.text === text)), {entry, other, text});
  const last = await page.evaluate(() => window.documentReplies.at(-1));
  expect(last.worker).toBe(first.worker);
  expect(last.source).toBe(first.source);
});
