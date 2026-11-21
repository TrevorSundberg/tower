import { outputText } from './output-text.mjs';
import {selectDocument, savedSource, revealDiagnostics} from './project-helpers.mjs';
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const grammar = ''; // Executable documents inherit the shared foundation module.
async function setSource(page, text) {
  const editor = page.getByRole('textbox', { name: 'Tower source' });
  // Click the visible editor viewport: the contenteditable spans the entire
  // document and its geometric center may be clipped on a short phone screen.
  await page.locator('#editor').click({ position: { x: 80, y: 20 } });
  await editor.press('ControlOrMeta+a'); await page.keyboard.insertText(text);
  await revealDiagnostics(page);
}
test.beforeEach(async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#status')).toContainText('Complete');
});

test('executes replacements and displays typed core instructions', async ({ page }, info) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await expect(page.locator('#auto-execute')).toBeChecked();
  await selectDocument(page, 'execution.tower');
  await expect(page.locator('#filename')).toHaveText('execution.tower');
  await expect(page.locator('#execution-status')).toContainText('Finished');
  await expect(page.locator('#execution-output')).toHaveText('15\n16\n');
  await expect.poll(()=>outputText(page,'core-instructions')).toContain('if finished {');
  await expect(page.locator('#execution-error')).toBeHidden();
  // Show executable source near the bottom, not just the editable core grammar.
  const editor = page.getByRole('textbox', { name: 'Tower source' });
  await editor.click(); await editor.press('ControlOrMeta+End');
  await page.screenshot({ path: `../build/playground-execution-${info.project.name}.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(errors).toEqual([]);
});

test('initializer inference shows explicit checked types and clear dependency errors', async ({page},info) => {
  await selectDocument(page, 'inference.tower');
  await expect(page.locator('#execution-status')).toHaveText('Finished \u00b7 backends match',{timeout:30000});
  await expect(page.locator('#execution-output')).toHaveText('42\ntrue\n43\n42\n');
  await expect(page.locator('#llvm-output')).toHaveText('42\ntrue\n43\n42\n');
  await expect(page.getByRole('textbox',{name:'Tower source'})).toContainText('var answer = add_one(41);');
  // Shared-node lowering may name intermediate values. The UI contract is
  // explicit inferred types; matching execution above checks their values.
  await expect.poll(()=>outputText(page,'core-instructions')).toContain('var answer: i32 =');
  await expect.poll(()=>outputText(page,'core-instructions')).toContain('var pointer: i32* =');
  await page.screenshot({path:`../build/inference-${info.project.name}.png`});
  await setSource(page,'var a = b;\nvar b = a;');
  await expect(page.locator('.tw-inline-error-message')).toContainText('initializer dependency cycle a -> b -> a');
  await page.screenshot({path:`../build/inference-cycle-${info.project.name}.png`});
  await setSource(page,'var answer = 42; print(answer);');
  await expect(page.locator('#execution-status')).toHaveText('Finished \u00b7 backends match');
  await expect(page.locator('.tw-inline-error')).toHaveCount(0);
  await expect(page.locator('#execution-output')).toHaveText('42\n');
});

test('replacement errors explain the required syntax inline and recover after correction', async ({ page }, info) => {
  const source = "parse Statement |= 'fart' $name:Identifier ';'\n    => replace { $name - $name; };\n\nvar value: i32 = 5;\nfart value;\nprint(value);";
  await setSource(page, source);
  await expect(page.locator('.tw-inline-error-message')).toContainText('Replacement for Statement must produce a valid Statement.');
  await expect(page.locator('.tw-inline-error-message')).toContainText('"$name - $name;" is not a valid Statement.');
  await expect(page.locator('.tw-error-range')).toHaveText('-');
  await expect(page.locator('.tw-inline-error-heading')).toHaveText(`Error${await page.locator('#filename').innerText()}:2:24`);
  await page.locator('#editor-error').click();
  expect(await page.locator('.tw-inline-error-card').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: `../build/playground-replacement-error-${info.project.name}.png` });
  await setSource(page, source.replace('$name - $name;', '$name = $name - $name;'));
  await expect(page.locator('.tw-inline-error')).toHaveCount(0);
  await expect(page.locator('#execution-output')).toHaveText('0\n');
  await expect(page.locator('#execution-status')).toHaveText('Finished \u00b7 backends match', { timeout: 30000 });
});

test('extra semicolons have concise context and increment demonstrates both returned values', async ({page},info) => {
  await setSource(page,'// Aliases share the same typed storage.\nvar alias: i32*;;');
  await expect(page.locator('.tw-inline-error-message')).toHaveText("Unexpected ';'. Expected a statement or grammar declaration.");
  await expect(page.locator('.tw-inline-error-heading')).toHaveText(`Error${await page.locator('#filename').innerText()}:2:17`);
  await expect(page.locator('.tw-error-range')).toHaveText(';');
  expect(await page.locator('.tw-inline-error-card').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  await page.locator('#editor').screenshot({path:`../build/extra-semicolon-${info.project.name}.png`});
  await setSource(page,'var answer: i32 = 42\nprint(answer);');
  await expect(page.locator('.tw-inline-error-message')).toContainText("Possible missing ';' before 'print'.");
  await expect(page.locator('.tw-error-point')).toHaveCount(1);
  await selectDocument(page, 'increment.tower');
  await expect(page.locator('#filename')).toHaveText('increment.tower');
  await expect(page.locator('#execution-status')).toHaveText('Finished \u00b7 backends match',{timeout:30000});
  await expect(page.locator('#execution-output')).toHaveText('5\n6\n7\n7\n9\n');
  await expect(page.locator('#llvm-output')).toHaveText('5\n6\n7\n7\n9\n');
  await expect(page.locator('.tw-inline-error')).toHaveCount(0);
  await expect.poll(()=>outputText(page,'core-instructions')).toContain(' + 1;');
  await expect.poll(()=>outputText(page,'llvm-after')).not.toContain('post_increment');
  await expect(page.locator('#tree')).toContainText('post_increment');
  await page.screenshot({path:`../build/increment-${info.project.name}.png`});
  const source=await savedSource(page); // CodeMirror renders only its viewport.
    expect(source).toContain('var after: i32 = ++value;');
    expect(source).toContain('var before: i32 = value++;');
    expect(source).not.toMatch(/\+\+ value|value \+\+/);
  await setSource(page,source+'\nvalue++;\nprint(value++);');
  await expect(page.locator('#execution-output')).toHaveText('5\n6\n7\n7\n9\n11\n');
  await expect(page.locator('#execution-status')).toHaveText('Finished \u00b7 backends match');
  await setSource(page,'fn forever(): i32 { loop {} } print(forever());');
  await expect.poll(()=>outputText(page,'core-instructions')).toContain('print(forever());');
  await expect(page.locator('#execution-status')).toContainText('Updating');
  await page.locator('#cancel-execution').click();
  await expect(page.locator('#execution-status')).toHaveText('Cancelled');
  await setSource(page,'print(42);');
  await expect(page.locator('#execution-status')).toHaveText('Finished \u00b7 backends match');
});

test('infinite execution stays responsive, cancels, and rejects results after edits', async ({ page }) => {
  await page.locator('#auto-execute').uncheck();
  await setSource(page, grammar + '\nloop { print(7); }');
  await page.locator('#execute').click();
  await expect(page.locator('#execution-status')).toHaveText('Updating…');
  await expect(page.locator('#execution-output')).toContainText('7');
  await page.getByRole('tab', { name: 'Active grammar' }).click();
  await expect(page.locator('#grammar-pane')).toBeVisible();
  await page.locator('#cancel-execution').click();
  await expect(page.locator('#execution-status')).toHaveText('Cancelled');
  await expect(page.locator('#execute')).toBeEnabled();
  await page.locator('#execute').click();
  await expect(page.locator('#execution-output')).toContainText('7');
  await setSource(page, grammar + '\nprint(42);');
  await expect(page.locator('#execution-status')).toHaveText('Cancelled by edit');
  await expect(page.locator('#execution-output')).toContainText('7');
  await expect(page.locator('#status')).toContainText('Complete');
  await page.locator('#execute').click();
  await expect(page.locator('#execution-status')).toContainText('Finished');
  await expect(page.locator('#execution-output')).toHaveText('42\n');
});

test('compile and runtime errors appear inline and clear after editing', async ({ page }, info) => {
  await page.locator('#auto-execute').uncheck();
  await setSource(page, grammar + '\nvar a: i32; var b: u32; a = b;');
  await page.locator('#execute').click();
  await expect(page.locator('#execution-status')).toContainText('Failed');
  await expect(page.locator('.tw-inline-error-message')).toContainText('Expected i32, got u32');
  await page.locator('#editor-error').click();
  await page.locator('#editor').screenshot({ path: `../build/playground-execution-error-${info.project.name}.png` });
  await setSource(page, grammar + '\nvar a: i32; a = 1 / 0;');
  await expect(page.locator('#execution-error')).toContainText('Expected i32, got u32');
  await page.locator('#execute').click();
  await expect(page.locator('.tw-inline-error-message')).toContainText('Division by zero');
  await setSource(page, grammar + '\nprint(1);');
  await expect(page.locator('.tw-inline-error')).toHaveCount(0);
  await page.locator('#execute').click();
  await expect(page.locator('#execution-output')).toHaveText('1\n');
});

test('cancellation also stops compilation and loading', async ({ page }) => {
  await page.locator('#auto-execute').uncheck();
  // Warm workers may already exist. Hold their request transport rather than
  // assuming a new script download occurs for every execution.
  await page.evaluate(() => {
    const post = Worker.prototype.postMessage, pending = [];
    Worker.prototype.postMessage = function(data,...args) {
      if (data.backend) pending.push(() => post.call(this,data,...args));
      else return post.call(this,data,...args);
    };
    window.releaseExecutionRequests = () => {
      Worker.prototype.postMessage = post;
      for (const send of pending) send();
    };
  });
  await page.locator('#execute').click();
  await expect(page.locator('#execution-status')).toHaveText('Updating…');
  await page.locator('#cancel-execution').click();
  await expect(page.locator('#execution-status')).toHaveText('Cancelled');
  await expect(page.locator('#execute')).toBeEnabled();
  await page.evaluate(() => window.releaseExecutionRequests());
  await setSource(page, grammar + '\nprint(2);');
  await page.locator('#execute').click();
  await expect(page.locator('#execution-output')).toHaveText('2\n');
});

test('auto execution follows edits, waits for valid syntax, and recovers from infinite programs', async ({ page }) => {
  await expect(page.locator('#auto-execute')).toBeChecked();
  await expect(page.locator('#execution-status')).toHaveText('Syntax only');
  await expect(page.locator('.tw-inline-error')).toHaveCount(0);
  await setSource(page, grammar + '\nprint(41);');
  await expect(page.locator('#execution-output')).toHaveText('41\n');
  // An unfinished edit must not execute an old program or report a semantic error.
  await setSource(page, grammar + '\nprint(');
  await expect(page.locator('#execution-status')).toHaveText('Waiting for valid source');
  await expect(page.locator('#execution-output')).toHaveText('41\n');
  await page.getByRole('textbox', { name: 'Tower source' }).press('ControlOrMeta+End');
  await page.keyboard.type('42);', { delay: 70 });
  await expect(page.locator('#execution-output')).toHaveText('42\n');
  await expect.poll(()=>savedSource(page)).toBe(grammar + '\nprint(42);');
  await setSource(page, grammar + '\nloop { print(7); }');
  await expect(page.locator('#execution-status')).toHaveText('Updating…');
  await expect(page.locator('#execution-output')).toContainText('7');
  await page.locator('#cancel-execution').click();
  await expect(page.locator('#execution-status')).toHaveText('Cancelled');
  // Re-inspection must not undo an explicit cancellation of this revision.
  await page.locator('#tokens').check();
  await page.locator('.document-root').click();
  await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('#execution-status')).toHaveText('Cancelled');
  await setSource(page, grammar + '\nprint(43);');
  await expect(page.locator('#execution-output')).toHaveText('43\n');
  await setSource(page, grammar + '\nloop {}');
  await expect(page.locator('#execution-status')).toHaveText('Updating…');
  await setSource(page, grammar + '\nprint(44);');
  await expect(page.locator('#execution-output')).toHaveText('44\n');
});

test('auto execution can be disabled, persisted and enabled again', async ({ page }) => {
  await page.locator('#auto-execute').uncheck();
  await setSource(page, grammar + '\nprint(12);');
  await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('#execution-output')).toHaveText('');
  await page.locator('#execute').click();
  await expect(page.locator('#execution-output')).toHaveText('12\n');
  await page.reload();
  await expect(page.locator('#auto-execute')).not.toBeChecked();
  await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('#execution-output')).toHaveText('');
  await page.locator('#auto-execute').check();
  await expect(page.locator('#execution-output')).toHaveText('12\n');
  await setSource(page, grammar + '\nvar a: i32; a = 1 / 0;');
  await expect(page.locator('.tw-inline-error-message')).toContainText('Division by zero');
  await setSource(page, grammar + '\nprint(13);');
  await expect(page.locator('#execution-output')).toHaveText('13\n');
  await expect(page.locator('.tw-inline-error')).toHaveCount(0);
});

test('workspace fits the viewport with output, instructions and errors', async ({ page }, info) => {
  await selectDocument(page, 'execution.tower');
  await expect(page.locator('#execution-output')).toHaveText('15\n16\n');
  const sizes = info.project.name === 'mobile' ? [[393,851],[360,640],[320,568]] : [[1440,900],[1280,720],[1024,600]];
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    const bounds = await page.evaluate(() => ({
      width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      panels: ['.app-header','.source-panel','.inspector-panel','.execution-panel','.statusbar','#execute'].map(selector => {
        const r = document.querySelector(selector).getBoundingClientRect();
        return { selector, x:r.x, y:r.y, right:r.right, bottom:r.bottom, height:r.height };
      }),
    }));
    expect(bounds.scrollWidth).toBeLessThanOrEqual(width);
    expect(bounds.scrollHeight).toBeLessThanOrEqual(height);
    for (const panel of bounds.panels) {
      expect(panel.x, panel.selector).toBeGreaterThanOrEqual(0);
      expect(panel.y, panel.selector).toBeGreaterThanOrEqual(0);
      expect(panel.right, panel.selector).toBeLessThanOrEqual(width + 1);
      expect(panel.bottom, panel.selector).toBeLessThanOrEqual(height + 1);
      expect(panel.height, panel.selector).toBeGreaterThan(15);
    }
    const editor = page.getByRole('textbox', { name: 'Tower source' });
    await page.locator('#editor').click({ position: { x: 80, y: 20 } });
    await editor.press('ControlOrMeta+End');
    await page.screenshot({ path: `../build/playground-compact-${width}x${height}.png` });
  }
  await setSource(page, grammar + '\nvar a: i32; a = true;');
  await expect(page.locator('.tw-inline-error-message')).toContainText('Expected i32');
  // Equal-width result columns scroll horizontally on narrow screens.
  await page.locator('#execution-error').scrollIntoViewIfNeeded();
  await expect(page.locator('#execution-error')).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
});

test('functions compile and execute off the UI thread with matching backends', async ({ page, request }, info) => {
  test.skip(!(await (await request.get('/capabilities.json')).json()).llvm);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  // Any accidental compilation/instantiation on the UI thread fails this test.
  await page.evaluate(() => {
    WebAssembly.compile = WebAssembly.instantiate = () => { throw new Error('WASM ran on the UI thread'); };
    window.__ticks = 0; setInterval(() => ++window.__ticks, 10);
  });
  await selectDocument(page, 'functions.tower');
  await expect(page.locator('#execution-status')).toHaveText('Finished · backends match', { timeout: 30000 });
  await expect(page.locator('#execution-output')).toHaveText('720\n721\n');
  await expect.poll(()=>outputText(page,'core-instructions')).toContain('fn factorial(n: i32): i32');
  await expect.poll(()=>outputText(page,'llvm-before')).toContain('alloca');
  await expect.poll(()=>outputText(page,'llvm-after')).toContain('define void @tower_main');
  await expect.poll(()=>outputText(page,'llvm-after')).not.toContain('alloca');
  await expect(page.locator('#llvm-output')).toHaveText('720\n721\n');
  await expect(page.locator('#steps')).toContainText('steps');
  await expect(page.locator('#timings')).toContainText('LLVM optimize');
  expect(await page.evaluate(() => window.__ticks)).toBeGreaterThan(5);
  expect(errors).toEqual([]);
  await page.locator('#editor').click({ position: { x: 80, y: 20 } });
  await page.getByRole('textbox', { name: 'Tower source' }).press('ControlOrMeta+End');
  await page.screenshot({ path: `../build/playground-functions-${info.project.name}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('projects and edits reuse idle execution workers with replaced environments', async ({ page, request }) => {
  test.skip(!(await (await request.get('/capabilities.json')).json()).llvm);
  await selectDocument(page, 'functions.tower');
  await expect(page.locator('#execution-status')).toContainText('backends match');
  const workers = page.workers().filter(worker => worker.url().includes('execution-worker'));
  expect(workers).toHaveLength(3);
  for (const worker of workers) await worker.evaluate(() => {
    self.__frontendMessages = [];
    const post = self.postMessage.bind(self);
    self.postMessage = (data,...args) => {
      if (data.foundation !== undefined) self.__frontendMessages.push({backend:data.backend,shared:data.timings.frontendShared === true});
      return post(data,...args);
    };
  });
  const requests = []; page.on('request', request => requests.push(request.url()));
  await selectDocument(page, 'memory.tower');
  await expect(page.locator('#execution-output')).toHaveText('5\n84\n42\n');
  await expect(page.locator('#execution-status')).toContainText('backends match');
  const nextWorkers = page.workers().filter(worker => worker.url().includes('execution-worker'));
  expect(nextWorkers).toEqual(workers);
  const frontends = (await Promise.all(workers.map(worker => worker.evaluate(() => self.__frontendMessages)))).flat();
  expect([...new Set(frontends.filter(item=>!item.shared).map(item=>item.backend))]).toEqual(['interpreter']);
  expect([...new Set(frontends.filter(item=>item.shared).map(item=>item.backend))].sort()).toEqual(['fast','llvm']);
  // Focus now prewarms the independent completion compiler. Finish a language
  // query before measuring execution-worker reuse, so its first load is excluded.
  await setSource(page,'pri');await page.keyboard.press('Control+Space');
  await expect(page.getByRole('option').filter({hasText:'print'})).toBeVisible();
  await page.keyboard.press('Escape');
  requests.length = 0;
  for (const value of [42, 43]) {
    await setSource(page, `var value: i32 = ${value}; print(value);`);
    await expect(page.locator('#llvm-output')).toHaveText(value + '\n');
    await expect(page.locator('#execution-status')).toContainText('backends match');
  }
  await page.getByRole('textbox',{name:'Tower source'}).press('ControlOrMeta+End');
  await page.keyboard.insertText('\n// ');
  await page.keyboard.type('keep warm compilers through this typing burst',{delay:70});
  await expect(page.locator('#execution-status')).toContainText('backends match');
  for (const id of ['execution-output','fast-output','llvm-output'])
    await expect(page.locator('#'+id)).toHaveText('43\n');
  expect(page.workers().filter(worker => worker.url().includes('execution-worker'))).toEqual(nextWorkers);
  expect(requests.filter(url => /tower(?:-llvm)?\.wasm/.test(url))).toEqual([]);
});

test('superseded compilation cannot execute while waiting for its UI permit',async({page})=>{
  await selectDocument(page,'functions.tower');
  await expect(page.locator('#execution-status')).toContainText('backends match');
  const workers=page.workers().filter(worker=>worker.url().includes('execution-worker'));
  for(const worker of workers) await worker.evaluate(()=>{
    const send=self.postMessage.bind(self);
    self.__readyIds=[]; self.__executedIds=[];
    self.postMessage=(data,...args)=>{
      if(data.phase?.startsWith('Executing'))self.__executedIds.push(data.id);
      if(data.ready){self.__readyIds.push(data.id);setTimeout(()=>send(data,...args),300);}
      else send(data,...args);
    };
  });
  const editor=page.getByRole('textbox',{name:'Tower source'});
  await editor.press('ControlOrMeta+End');await page.keyboard.insertText('\n// pending');
  for(const worker of workers) await expect.poll(()=>worker.evaluate(()=>self.__readyIds.length)).toBeGreaterThan(0);
  const obsolete=await Promise.all(workers.map(worker=>worker.evaluate(()=>self.__readyIds[0])));
  await page.keyboard.insertText(' newest');
  await expect(page.locator('#execution-status')).toContainText('backends match');
  expect(page.workers().filter(worker=>worker.url().includes('execution-worker'))).toEqual(workers);
  for(let i=0;i<workers.length;i++)expect(await workers[i].evaluate(()=>self.__executedIds)).not.toContain(obsolete[i]);
  for(const id of ['execution-output','fast-output','llvm-output'])await expect(page.locator('#'+id)).toHaveText('720\n721\n');
});

test('LLVM infinite execution cancels on edits and traps remain inline', async ({ page, request }) => {
  test.skip(!(await (await request.get('/capabilities.json')).json()).llvm);
  await setSource(page, grammar + '\nloop { print(7); }');
  await expect(page.locator('#execution-output')).toContainText('7', { timeout: 30000 });
  await page.getByRole('tab', { name: 'Active grammar' }).click();
  await expect(page.locator('#grammar-pane')).toBeVisible();
  await page.locator('#cancel-execution').click();
  await expect(page.locator('#execution-status')).toHaveText('Cancelled');
  await setSource(page, grammar + '\nvar a: i32; a = 1 / 0;');
  await expect(page.locator('.tw-inline-error-message')).toContainText('Division by zero', { timeout: 30000 });
  await setSource(page, grammar + '\nloop {}');
  await expect(page.locator('#llvm-phase')).toHaveText('Executing…', { timeout: 30000 });
  await setSource(page, grammar + '\nprint(42);');
  await expect(page.locator('#execution-output')).toHaveText('42\n', { timeout: 30000 });
  await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
  // An error's caret/widget must never become source when replacing the document.
  await expect.poll(()=>savedSource(page)).toBe(grammar + '\nprint(42);');
});

test('LLVM loading can be cancelled without obsolete results replacing a new run', async ({ page, request }) => {
  test.skip(!(await (await request.get('/capabilities.json')).json()).llvm);
  await page.locator('#auto-execute').uncheck();
  await page.locator('#build-targets summary').click();
  await page.locator('#target-wasm').uncheck();
  await page.locator('#build-targets summary').click();
  await setSource(page, grammar + '\nprint(12);');
  let release; const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/tower-llvm.wasm.gz', async route => { await gate; await route.continue().catch(() => {}); });
  await page.locator('#build-targets summary').click();
  await page.locator('#target-wasm').check();
  await page.locator('#execute').click();
  await expect(page.locator('#llvm-phase')).toHaveText('Loading…');
  await expect(page.locator('#execution-output')).toHaveText('12\n');
  await expect(page.locator('#interpreter-phase')).toBeHidden();
  await expect(page.locator('#cancel-execution')).toBeEnabled();
  await page.locator('#cancel-execution').click();
  await expect(page.locator('#execution-status')).toHaveText('Cancelled');
  release(); await page.unroute('**/tower-llvm.wasm.gz');
  await setSource(page, grammar + '\nprint(34);');
  await page.locator('#execute').click();
  await expect(page.locator('#execution-output')).toHaveText('34\n');
  await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
  await expect(page.locator('#llvm-output')).toHaveText('34\n');
  await expect(page.locator('#llvm-download')).toBeVisible();
});

test('LLVM warms on a syntax-only document and the first program reuses that worker',async({page,request})=>{
  test.skip(!(await (await request.get('/capabilities.json')).json()).llvm);
  const foundation=await (await request.get('/foundation.tower')).text();
  await page.addInitScript(source=>{
    localStorage.removeItem('tower-project-migrated-v1');localStorage.setItem('tower-playground-document-v1',JSON.stringify({source,filename:'foundation.tower',module:'foundation'}));
    localStorage.setItem('tower-auto-execute-v1','true');
  },foundation);
  await page.reload();
  await expect(page.locator('#execution-status')).toHaveText('Syntax only');
  await expect.poll(()=>page.evaluate(()=>performance.getEntriesByName('tower-llvm-warm').length)).toBe(1);
  await expect(page.locator('#llvm-output')).toBeEmpty();
  await expect.poll(()=>outputText(page,'core-instructions')).toBe('');
  const warmed=page.workers().find(worker=>worker.url().includes('execution-worker'));
  const requests=[];page.on('request',request=>requests.push(request.url()));
  await page.locator('#file-tree button[data-path="foundation.tower"]').click();
  await setSource(page, 'print(42);');
  await expect(page.locator('#execution-status')).toContainText('backends match');
  expect(page.workers()).toContain(warmed);
  // The Wasm worker is reused; the independent fast runner loads its LLVM
  // instance for the first time when there is an executable program.
  expect(requests.filter(url=>url.includes('tower-llvm.wasm'))).toHaveLength(1);
  await expect(page.locator('#timings [data-label="LLVM load"]')).toContainText('(cached)');
});

test('saved disabled Wasm is reenabled and warmed even for syntax-only source',async({page,request})=>{
  test.skip(!(await (await request.get('/capabilities.json')).json()).llvm);
  const source=await (await request.get('/foundation.tower')).text();
  await page.addInitScript(source=>{
    localStorage.removeItem('tower-project-migrated-v1');localStorage.setItem('tower-playground-document-v1',JSON.stringify({source,filename:'foundation.tower',module:'foundation'}));
    localStorage.setItem('tower-build-targets-v3',JSON.stringify({wasm:false,x86:false,arm:false}));
  },source);
  await page.reload();await expect(page.locator('#execution-status')).toHaveText('Syntax only');
  await expect(page.locator('#target-wasm')).toBeChecked();
  await expect(page.locator('#wasm-column')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>performance.getEntriesByName('tower-llvm-warm').length)).toBe(1);
  await expect(page.locator('#execution-status')).toHaveText('Syntax only');
  await expect(page.locator('#llvm-output')).toBeEmpty();
});
