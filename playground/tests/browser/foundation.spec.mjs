import { outputText } from './output-text.mjs';
import {selectDocument, revealDiagnostics, savedProject} from './project-helpers.mjs';
import { test, expect } from '@playwright/test';
const withEmit = foundation => foundation + "\nparse Statement |= 'emit' $value:CoreOperand ';' => replace { print($value); };";
async function setSource(page, text) {
  await page.locator('#editor').click({ position: { x: 80, y: 20 } });
  await page.getByRole('textbox', { name: 'Tower source' }).press('ControlOrMeta+a');
  await page.keyboard.insertText(text);
  await revealDiagnostics(page);
}
const program = statements => 'import foundation;\n' + statements;
async function openIncrement(page) {
  await page.goto('/');
  await expect(page.locator('#status')).toContainText('Complete');
  await page.locator('#project-kind').selectOption('example:increment');
  await expect(page.locator('#filename')).toHaveText('increment.tower');
  await expect(page.locator('#file-tree button[data-path=".tower/foundation.tower"]')).toBeVisible();
}
async function openFoundation(page) {
  await page.locator('#file-tree button[data-path=".tower/foundation.tower"]').click();
  await expect(page.locator('#filename')).toHaveText('foundation.tower');
}
async function expectOutput(page, value) {
  await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
  for (const id of ['execution-output', 'fast-output', 'llvm-output'])
    await expect(page.locator('#' + id)).toHaveJSProperty('textContent', value);
}
test('editing the shared foundation changes parsing, highlights and both runners, and persists', async ({ page, request }, info) => {
  test.setTimeout(60000); // Several cold compiler loads plus a page reload.
  const foundation = await (await request.get('/foundation.tower')).text();
  await openIncrement(page);
  await openFoundation(page);
  await expect.poll(() => outputText(page, 'editor')).toBe(foundation);
  await expect(page.locator('#rules')).toContainText('CoreFunction');
  await expect(page.locator('#execute')).toBeEnabled();
  const edited = withEmit(foundation + '\n[identifier] token Identifier = /[A-Za-z_][A-Za-z0-9_-]*/;');
  await setSource(page, edited);
  await expect(page.locator('#status')).toContainText('Complete');
  await page.getByRole('tab', { name: 'Active grammar' }).click();
  await expect(page.locator('#rules')).toContainText("'emit'");
  await page.screenshot({ path: `../build/playground-foundation-${info.project.name}.png` });
  await selectDocument(page, 'increment.tower');
  await setSource(page, program('var player-name: i32 = 42; emit player-name;'));
  await expectOutput(page, '42\n');
  await expect(page.locator('#editor .tw-keyword').filter({ hasText: /^emit$/ })).toHaveCount(1);
  await expect.poll(()=>outputText(page,'core-instructions')).toContain('print(`player-name`);');
  await expect.poll(async () => (await savedProject(page)).builtins.foundation).toBe(edited);
  await page.reload();
  await expectOutput(page, '42\n');
  await openFoundation(page);
  await expect(page.locator('#rules')).toContainText("'emit'");
  await expect.poll(() => outputText(page, 'editor')).toBe(edited);
  await page.locator('#restore').click();
  await expect.poll(() => outputText(page, 'editor')).toBe(foundation);
  await expect(page.locator('#status')).toContainText('Complete');
  await selectDocument(page, 'increment.tower');
  await expect(page.locator('#status')).toContainText('Stopped');
  await setSource(page, program('print(7);'));
  await expectOutput(page, '7\n');
});

test('source and foundation keep independent undo histories', async ({ page, request }) => {
  const foundation = await (await request.get('/foundation.tower')).text();
  await openIncrement(page);
  await setSource(page, program('print(42);'));
  await openFoundation(page);
  await setSource(page, withEmit(foundation));
  await expect(page.locator('#status')).toContainText('Complete');
  await selectDocument(page, 'increment.tower');
  await setSource(page, program('emit 43;'));
  await expectOutput(page, '43\n');
  await page.getByRole('textbox', { name: 'Tower source' }).press('ControlOrMeta+z');
  await expect.poll(() => outputText(page, 'editor')).toBe(program('print(42);'));
  await openFoundation(page);
  await expect(page.locator('#rules')).toContainText("'emit'");
  await page.locator('#editor').click({ position: { x: 80, y: 20 } });
  await page.getByRole('textbox', { name: 'Tower source' }).press('ControlOrMeta+z');
  await expect.poll(() => outputText(page, 'editor')).toBe(foundation);
  await expect(page.locator('#rules')).not.toContainText("'emit'");
  await expect(page.locator('#rules')).toContainText('CoreCall');
  await selectDocument(page, 'increment.tower');
  await expectOutput(page, '42\n');
});

test('invalid foundation stays editable and cannot silently run with stale definitions', async ({ page, request }) => {
  const foundation = await (await request.get('/foundation.tower')).text();
  await openIncrement(page);
  await setSource(page, program('print(9);'));
  await expectOutput(page, '9\n');
  await openFoundation(page);
  const broken = foundation + '\ntoken Broken = /a*/;';
  await setSource(page, broken);
  await expect(page.locator('.tw-inline-error-message')).toContainText('empty input');
  await selectDocument(page, 'increment.tower');
  await expect(page.locator('#diagnostic')).toContainText('foundation.tower');
  for (const id of ['execution-output', 'fast-output', 'llvm-output'])
    await expect(page.locator('#' + id)).toBeEmpty();
  await openFoundation(page);
  await expect.poll(() => outputText(page, 'editor')).toBe(broken);
  await page.locator('#restore').click();
  await expect.poll(() => outputText(page, 'editor')).toBe(foundation);
  await expect(page.locator('#status')).toContainText('Complete');
  await selectDocument(page, 'increment.tower');
  await expectOutput(page, '9\n');
});

test('a backend mismatch is reported automatically and does not survive an edit', async ({ page }) => {
  // The isolation service worker can fetch this script on the page's behalf.
  await page.context().route('**/execution-worker.js', async route => {
    const response = await route.fetch();
    const script = await response.text();
    await route.fulfill({ response, body: script + `\nconst send = self.postMessage.bind(self); self.restoreTestOutput = () => { self.postMessage = send; }; self.postMessage = data => { if (data.backend === 'llvm' && data.result?.status === 'done') data.result.output += 'mismatch'; send(data); };` });
  });
  await page.goto('/'); await expect(page.locator('#status')).toContainText('Complete');
  await setSource(page, program('print(42);'));
  await expect(page.locator('#execution-status')).toHaveText('Backend mismatch · output');
  await expect(page.locator('#execution-output')).toHaveText('42\n');
  await expect(page.locator('#llvm-output')).toHaveText('42\nmismatch');
  await page.context().unroute('**/execution-worker.js');
  for (const worker of page.workers()) if (worker.url().includes('execution-worker')) await worker.evaluate(() => self.restoreTestOutput());
  await setSource(page, program('print(43);'));
  await expectOutput(page, '43\n');
});
