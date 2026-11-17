import { test, expect } from '@playwright/test';
async function setSource(page, text) {
  await page.locator('#editor').click({ position: { x: 80, y: 20 } });
  await page.getByRole('textbox', { name: 'Tower source' }).press('ControlOrMeta+a');
  await page.keyboard.insertText(text);
}
test('editing the shared foundation changes parsing, highlights and both runners, and persists', async ({ page, request }, info) => {
  const foundation = await (await request.get('/foundation.tower')).text();
  await page.goto('/'); await expect(page.locator('#status')).toContainText('Complete');
  await setSource(page, 'var player-name: i32 = 42; emit player-name;');
  await page.locator('#example-kind').selectOption('foundation.tower');
  await expect(page.locator('#filename')).toHaveText('foundation.tower');
  await expect(page.locator('#rules')).toContainText('CoreFunction');
  await expect(page.locator('#execute')).toBeEnabled();
  const edited = 'token Identifier = /[A-Za-z_][A-Za-z0-9_-]*/ as identifier;\n' + foundation.replace("'print'", "'emit'");
  await setSource(page, edited);
  await expect(page.locator('#status')).toContainText('Complete');
  await page.getByRole('tab', { name: 'Active grammar' }).click();
  await expect(page.locator('#rules')).toContainText("'emit'");
  await page.screenshot({ path: `../build/playground-foundation-${info.project.name}.png` });
  await page.locator('#example-kind').selectOption('foreach.tower');
  await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
  await expect(page.locator('#execution-output')).toHaveText('42\n');
  await expect(page.locator('#llvm-output')).toHaveText('42\n');
  await expect(page.locator('.tw-keyword').filter({ hasText: /^emit$/ })).toHaveCount(1);
  await expect(page.locator('#core-instructions')).toContainText('print `player-name`;');
  await page.reload();
  await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
  await page.locator('#example-kind').selectOption('foundation.tower');
  await expect(page.locator('#rules')).toContainText("'emit'");
  await page.locator('#restore').click();
  await expect(page.locator('#status')).toContainText('Complete');
  await page.locator('#example-kind').selectOption('foreach.tower');
  await expect(page.locator('#status')).toContainText('Stopped');
  await setSource(page, 'print 7;');
  await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
});

test('source and foundation keep independent undo histories', async ({ page, request }) => {
  const foundation = await (await request.get('/foundation.tower')).text();
  await page.goto('/'); await expect(page.locator('#status')).toContainText('Complete');
  await setSource(page, 'print 42;');
  await page.locator('#example-kind').selectOption('foundation.tower');
  await setSource(page, foundation.replace("'print'", "'emit'"));
  await expect(page.locator('#status')).toContainText('Complete');
  await page.locator('#example-kind').selectOption('foreach.tower');
  await setSource(page, 'emit 43;');
  await page.getByRole('textbox', { name: 'Tower source' }).press('ControlOrMeta+z');
  await expect(page.getByRole('textbox', { name: 'Tower source' })).toHaveText('print 42;');
  await page.locator('#example-kind').selectOption('foundation.tower');
  await expect(page.locator('#rules')).toContainText("'emit'");
  await page.locator('#editor').click({ position: { x: 80, y: 20 } });
  await page.getByRole('textbox', { name: 'Tower source' }).press('ControlOrMeta+z');
  await expect(page.locator('#rules')).toContainText("'print'");
  await page.locator('#example-kind').selectOption('foreach.tower');
  await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
  await expect(page.locator('#llvm-output')).toHaveText('42\n');
});

test('invalid foundation stays editable and cannot silently run with stale definitions', async ({ page, request }) => {
  const foundation = await (await request.get('/foundation.tower')).text();
  await page.goto('/'); await expect(page.locator('#status')).toContainText('Complete');
  await page.locator('#example-kind').selectOption('foundation.tower');
  await setSource(page, foundation + '\ntoken Broken = /a*/;');
  await expect(page.locator('.tw-inline-error-message')).toContainText('empty input');
  await page.locator('#example-kind').selectOption('foreach.tower');
  await expect(page.locator('#diagnostic')).toContainText('foundation.tower');
  await expect(page.locator('#llvm-output')).toHaveText('');
  await page.locator('#example-kind').selectOption('foundation.tower');
  await page.locator('#restore').click();
  await expect(page.locator('#status')).toContainText('Complete');
  await page.locator('#example-kind').selectOption('foreach.tower');
  await setSource(page, 'print 9;');
  await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
});

test('a backend mismatch is reported automatically and does not survive an edit', async ({ page }) => {
  await page.route('**/execution-worker.js', async route => {
    const response = await route.fetch();
    const script = await response.text();
    await route.fulfill({ response, body: script + `\nconst send = self.postMessage.bind(self); self.postMessage = data => { if (data.backend === 'llvm' && data.result?.status === 'done') data.result.output += 'mismatch'; send(data); };` });
  });
  await page.goto('/'); await expect(page.locator('#status')).toContainText('Complete');
  await setSource(page, 'print 42;');
  await expect(page.locator('#execution-status')).toHaveText('Backend mismatch · output');
  await expect(page.locator('#execution-output')).toHaveText('42\n');
  await expect(page.locator('#llvm-output')).toHaveText('42\nmismatch');
  await page.unroute('**/execution-worker.js');
  await setSource(page, 'print 43;');
  await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
});
