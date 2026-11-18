import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const grammar = ''; // Executable documents inherit the shared foundation module.
async function setSource(page, text) {
  const editor = page.getByRole('textbox', { name: 'Tower source' });
  // Click the visible editor viewport: the contenteditable spans the entire
  // document and its geometric center may be clipped on a short phone screen.
  await page.locator('#editor').click({ position: { x: 80, y: 20 } });
  await editor.press('ControlOrMeta+a'); await page.keyboard.insertText(text);
}
test.beforeEach(async ({ page }) => {
  await page.goto('/'); await expect(page.locator('#status')).toContainText('Complete');
});

test('executes replacements and displays typed core instructions', async ({ page }, info) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await expect(page.locator('#auto-execute')).toBeChecked();
  await page.locator('#example-kind').selectOption('execution.tower');
  await expect(page.locator('#filename')).toHaveText('execution.tower');
  await expect(page.locator('#execution-status')).toContainText('Finished');
  await expect(page.locator('#execution-output')).toHaveText('15\n16\n');
  await expect(page.locator('#core-instructions')).toContainText('if finished {');
  await expect(page.locator('#execution-error')).toBeHidden();
  // Show executable source near the bottom, not just the editable core grammar.
  const editor = page.getByRole('textbox', { name: 'Tower source' });
  await editor.click(); await editor.press('ControlOrMeta+End');
  await page.screenshot({ path: `../build/playground-execution-${info.project.name}.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(errors).toEqual([]);
});

test('replacement errors explain the required syntax inline and recover after correction', async ({ page }, info) => {
  const source = "parse Statement |= 'fart' $name:Identifier ';'\n    => replace { $name - $name; };\n\nvar value: i32 = 5;\nfart value;\nprint(value);";
  await setSource(page, source);
  await expect(page.locator('.tw-inline-error-message')).toContainText('Replacement for Statement must produce a valid Statement.');
  await expect(page.locator('.tw-inline-error-message')).toContainText('"$name - $name;" is not a valid Statement.');
  await expect(page.locator('.tw-error-range')).toHaveText('-');
  await expect(page.locator('.tw-inline-error-heading')).toHaveText('ErrorLn 2, Col 24');
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
  await expect(page.locator('.tw-inline-error-heading')).toHaveText('ErrorLn 2, Col 17');
  await expect(page.locator('.tw-error-range')).toHaveText(';');
  expect(await page.locator('.tw-inline-error-card').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  await page.locator('#editor').screenshot({path:`../build/extra-semicolon-${info.project.name}.png`});
  await setSource(page,'var answer: i32 = 42\nprint(answer);');
  await expect(page.locator('.tw-inline-error-message')).toContainText("Possible missing ';' before 'print'.");
  await expect(page.locator('.tw-error-point')).toHaveCount(1);
  await page.locator('#example-kind').selectOption('increment.tower');
  await expect(page.locator('#filename')).toHaveText('increment.tower');
  await expect(page.locator('#execution-status')).toHaveText('Finished \u00b7 backends match',{timeout:30000});
  await expect(page.locator('#execution-output')).toHaveText('5\n6\n7\n7\n9\n');
  await expect(page.locator('#llvm-output')).toHaveText('5\n6\n7\n7\n9\n');
  await expect(page.locator('.tw-inline-error')).toHaveCount(0);
  await expect(page.locator('#core-instructions')).toContainText('post_increment(&value)');
  await expect(page.locator('#llvm-after')).not.toContainText('post_increment');
  await expect(page.locator('#tree')).toContainText('post_increment');
  await page.screenshot({path:`../build/increment-${info.project.name}.png`});
  const source=await page.getByRole('textbox',{name:'Tower source'}).innerText();
    expect(source).toContain('var after: i32 = ++value;');
    expect(source).toContain('var before: i32 = value++;');
    expect(source).not.toMatch(/\+\+ value|value \+\+/);
  await setSource(page,source+'\nvalue++;\nprint(value++);');
  await expect(page.locator('#execution-output')).toHaveText('5\n6\n7\n7\n9\n11\n');
  await expect(page.locator('#execution-status')).toHaveText('Finished \u00b7 backends match');
  await setSource(page,'fn forever(): i32 { loop {} } print(forever());');
  await expect(page.locator('#core-instructions')).toContainText('print(forever());');
  await expect(page.locator('#execution-status')).toContainText('Executing');
  await page.locator('#cancel-execution').click();
  await expect(page.locator('#execution-status')).toHaveText('Cancelled');
  await setSource(page,'print(42);');
  await expect(page.locator('#execution-status')).toHaveText('Finished \u00b7 backends match');
});

test('infinite execution stays responsive, cancels, and rejects results after edits', async ({ page }) => {
  await page.locator('#auto-execute').uncheck();
  await setSource(page, grammar + '\nloop { print(7); }');
  await page.locator('#execute').click();
  await expect(page.locator('#execution-status')).toHaveText('Executing…');
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
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/execution-worker.js', async route => { await gate; await route.continue().catch(() => {}); });
  await page.locator('#execute').click();
  await expect(page.locator('#execution-status')).toHaveText('Executing…');
  await page.locator('#cancel-execution').click();
  await expect(page.locator('#execution-status')).toHaveText('Cancelled');
  await expect(page.locator('#execute')).toBeEnabled();
  release();
  await setSource(page, grammar + '\nprint(2);');
  await page.unroute('**/execution-worker.js');
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
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('tower-playground-document-v1')).source)).toBe(grammar + '\nprint(42);');
  await setSource(page, grammar + '\nloop { print(7); }');
  await expect(page.locator('#execution-status')).toHaveText('Executing…');
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
  await expect(page.locator('#execution-status')).toHaveText('Executing…');
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
  await page.locator('#example-kind').selectOption('execution.tower');
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
  await page.locator('#example-kind').selectOption('functions.tower');
  await expect(page.locator('#execution-status')).toHaveText('Finished · backends match', { timeout: 30000 });
  await expect(page.locator('#execution-output')).toHaveText('720\n721\n');
  await expect(page.locator('#core-instructions')).toContainText('fn factorial(n: i32): i32');
  await expect(page.locator('#llvm-before')).toContainText('alloca');
  await expect(page.locator('#llvm-after')).toContainText('define void @tower_main');
  await expect(page.locator('#llvm-after')).not.toContainText('alloca');
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

test('completed execution workers stay warm across files and edits without retaining program memory', async ({ page, request }) => {
  test.skip(!(await (await request.get('/capabilities.json')).json()).llvm);
  await page.locator('#example-kind').selectOption('functions.tower');
  await expect(page.locator('#execution-status')).toContainText('backends match');
  const workers = page.workers().filter(worker => worker.url().includes('execution-worker'));
  expect(workers).toHaveLength(2);
  const requests = []; page.on('request', request => requests.push(request.url()));
  await page.locator('#example-kind').selectOption('memory.tower');
  await expect(page.locator('#execution-output')).toHaveText('5\n84\n42\n');
  await expect(page.locator('#execution-status')).toContainText('backends match');
  for (const value of [42, 43]) {
    await setSource(page, `var value: i32 = ${value}; print(value);`);
    await expect(page.locator('#llvm-output')).toHaveText(value + '\n');
    await expect(page.locator('#execution-status')).toContainText('backends match');
  }
  expect(page.workers().filter(worker => worker.url().includes('execution-worker'))).toEqual(workers);
  expect(requests.filter(url => /tower(?:-llvm)?\.wasm/.test(url))).toEqual([]);
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
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('tower-playground-document-v1')).source)).toBe(grammar + '\nprint(42);');
});

test('LLVM loading can be cancelled without obsolete results replacing a new run', async ({ page, request }) => {
  test.skip(!(await (await request.get('/capabilities.json')).json()).llvm);
  await page.locator('#auto-execute').uncheck();
  await setSource(page, grammar + '\nprint(12);');
  let release; const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/tower-llvm.wasm.gz', async route => { await gate; await route.continue().catch(() => {}); });
  await page.locator('#execute').click();
  await expect(page.locator('#llvm-phase')).toHaveText('Loading LLVM…');
  await expect(page.locator('#execution-output')).toHaveText('12\n');
  await expect(page.locator('#interpreter-phase')).toHaveText('Finished');
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
