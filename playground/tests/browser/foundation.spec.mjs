import { outputText } from './output-text.mjs';
import {selectDocument, revealDiagnostics} from './project-helpers.mjs';
import { test, expect } from '@playwright/test';
const withEmit = foundation => foundation + "\nparse Statement |= 'emit' $value:CoreOperand ';' => replace { print($value); };";
async function setSource(page, text) {
  await page.locator('#editor').click({ position: { x: 80, y: 20 } });
  await page.getByRole('textbox', { name: 'Tower source' }).press('ControlOrMeta+a');
  await page.keyboard.insertText(text);
  await revealDiagnostics(page);
}
test('editing the shared foundation changes parsing, highlights and both runners, and persists', async ({ page, request }, info) => {
  test.setTimeout(60000); // Several cold compiler loads plus a page reload.
  const foundation = await (await request.get('/foundation.tower')).text();
  await page.goto('/'); await expect(page.locator('#status')).toContainText('Complete');
  await setSource(page, 'var player-name: i32 = 42; emit player-name;');
  await selectDocument(page, 'foundation.tower');
  await expect(page.locator('#filename')).toHaveText('foundation.tower');
  await expect(page.locator('#rules')).toContainText('CoreFunction');
  await expect(page.locator('#execute')).toBeEnabled();
  const edited = withEmit(foundation.replace('import bedrock;', 'import bedrock;\ntoken Identifier = /[A-Za-z_][A-Za-z0-9_-]*/ as identifier;'));
  await setSource(page, edited);
  await expect(page.locator('#status')).toContainText('Complete');
  await page.getByRole('tab', { name: 'Active grammar' }).click();
  await expect(page.locator('#rules')).toContainText("'emit'");
  await page.screenshot({ path: `../build/playground-foundation-${info.project.name}.png` });
  await selectDocument(page, 'foreach.tower');
  await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
  await expect(page.locator('#execution-output')).toHaveText('42\n');
  await expect(page.locator('#llvm-output')).toHaveText('42\n');
  await expect(page.locator('.tw-keyword').filter({ hasText: /^emit$/ })).toHaveCount(1);
  await expect.poll(()=>outputText(page,'core-instructions')).toContain('print(`player-name`);');
  await page.reload();
  await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
  await selectDocument(page, 'foundation.tower');
  await expect(page.locator('#rules')).toContainText("'emit'");
  await page.locator('#restore').click();
  await expect(page.locator('#status')).toContainText('Complete');
  await selectDocument(page, 'foreach.tower');
  await expect(page.locator('#status')).toContainText('Stopped');
  await setSource(page, 'print(7);');
  await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
});

test('source and foundation keep independent undo histories', async ({ page, request }) => {
  const foundation = await (await request.get('/foundation.tower')).text();
  await page.goto('/'); await expect(page.locator('#status')).toContainText('Complete');
  await setSource(page, 'print(42);');
  await selectDocument(page, 'foundation.tower');
  await setSource(page, withEmit(foundation));
  await expect(page.locator('#status')).toContainText('Complete');
  await selectDocument(page, 'foreach.tower');
  await setSource(page, 'emit 43;');
  await page.getByRole('textbox', { name: 'Tower source' }).press('ControlOrMeta+z');
  await expect(page.getByRole('textbox', { name: 'Tower source' })).toHaveText('print(42);');
  await selectDocument(page, 'foundation.tower');
  await expect(page.locator('#rules')).toContainText("'emit'");
  await page.locator('#editor').click({ position: { x: 80, y: 20 } });
  await page.getByRole('textbox', { name: 'Tower source' }).press('ControlOrMeta+z');
  await expect(page.locator('#rules')).not.toContainText("'emit'");
  await expect(page.locator('#rules')).toContainText('CoreCall');
  await selectDocument(page, 'foreach.tower');
  await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
  await expect(page.locator('#llvm-output')).toHaveText('42\n');
});

test('invalid foundation stays editable and cannot silently run with stale definitions', async ({ page, request }) => {
  const foundation = await (await request.get('/foundation.tower')).text();
  await page.goto('/'); await expect(page.locator('#status')).toContainText('Complete');
  await selectDocument(page, 'foundation.tower');
  await setSource(page, foundation + '\ntoken Broken = /a*/;');
  await expect(page.locator('.tw-inline-error-message')).toContainText('empty input');
  await selectDocument(page, 'foreach.tower');
  await expect(page.locator('#diagnostic')).toContainText('foundation.tower');
  await expect(page.locator('#llvm-output')).toHaveText('');
  await selectDocument(page, 'foundation.tower');
  await page.locator('#restore').click();
  await expect(page.locator('#status')).toContainText('Complete');
  await selectDocument(page, 'foreach.tower');
  await setSource(page, 'print(9);');
  await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
});

test('a backend mismatch is reported automatically and does not survive an edit', async ({ page }) => {
  await page.route('**/execution-worker.js', async route => {
    const response = await route.fetch();
    const script = await response.text();
    await route.fulfill({ response, body: script + `\nconst send = self.postMessage.bind(self); self.restoreTestOutput = () => { self.postMessage = send; }; self.postMessage = data => { if (data.backend === 'llvm' && data.result?.status === 'done') data.result.output += 'mismatch'; send(data); };` });
  });
  await page.goto('/'); await expect(page.locator('#status')).toContainText('Complete');
  await setSource(page, 'print(42);');
  await expect(page.locator('#execution-status')).toHaveText('Backend mismatch · output');
  await expect(page.locator('#execution-output')).toHaveText('42\n');
  await expect(page.locator('#llvm-output')).toHaveText('42\nmismatch');
  await page.unroute('**/execution-worker.js');
  for (const worker of page.workers()) if (worker.url().includes('execution-worker')) await worker.evaluate(() => self.restoreTestOutput());
  await setSource(page, 'print(43);');
  await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
});
