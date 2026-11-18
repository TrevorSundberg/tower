import { outputText } from './output-text.mjs';
import {selectDocument} from './project-helpers.mjs';
import { test, expect } from '@playwright/test';
async function setSource(page, text) {
  await page.locator('#editor').click({ position: { x: 80, y: 20 } });
  await page.getByRole('textbox', { name: 'Tower source' }).press('ControlOrMeta+a');
  await page.keyboard.insertText(text);
}
test('struct milestone executes automatically in both workers and round-trips visibly', async ({ page }, info) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await expect(page.locator('#status')).toContainText('Complete');
  await selectDocument(page, 'structs.tower');
  await expect(page.locator('#filename')).toHaveText('structs.tower');
  await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
  await expect(page.locator('#execution-output')).toHaveText('42\n22\n7\n');
  await expect(page.locator('#llvm-output')).toHaveText('42\n22\n7\n');
  await expect.poll(()=>outputText(page,'core-instructions')).toContain('struct Pair {');
  await expect.poll(()=>outputText(page,'core-instructions')).toContain('pair.first = pair.first + pair.second;');
  await expect.poll(()=>outputText(page,'core-instructions')).toContain('var field: i32* = &pair.second;');
  await expect.poll(()=>outputText(page,'llvm-before')).toContain('tower.fn.accumulate');
  await expect.poll(()=>outputText(page,'llvm-after')).toContain('tower_main');
  await page.screenshot({ path: `../build/playground-structs-${info.project.name}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const canonical = await outputText(page,'core-instructions');
  await setSource(page, canonical);
  await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
  await expect(page.locator('#llvm-output')).toHaveText('42\n22\n7\n');
  expect(errors).toEqual([]);
});

test('field and pointer type mistakes are inline, compared, and recover on edits', async ({ page }, info) => {
  await page.goto('/'); await expect(page.locator('#status')).toContainText('Complete');
  const prefix = 'struct Pair { x: i32; y: i32; }\nvar pair: Pair;\npair.x = 42;\n';
  await setSource(page, prefix + 'pair.y = true;');
  await expect(page.locator('#execution-status')).toHaveText('Failed · backends match');
  await expect(page.locator('.tw-inline-error-message')).toContainText("Expected i32");
  await page.locator('#editor-error').click();
  await page.locator('#editor').screenshot({ path: `../build/playground-struct-error-${info.project.name}.png` });
  await setSource(page, prefix + 'pair.missing = 1;');
  await expect(page.locator('.tw-inline-error-message')).toContainText("Unknown field 'missing'");
  await setSource(page, 'struct Pair { x: i32; } var pair: Pair; var wrong: u32* = &pair.x;');
  await expect(page.locator('#execution-status')).toHaveText('Failed · backends match');
  await expect(page.locator('.tw-inline-error-message')).toContainText('Expected u32*');
  await setSource(page, prefix + 'print(pair.x);');
  await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
  await expect(page.locator('.tw-inline-error')).toHaveCount(0);
  await expect(page.locator('#llvm-output')).toHaveText('42\n');
});

test('an untouched saved baseline upgrades while a customized foundation stays in use', async ({ page, request }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('foundation-upgrade-test')) {
      localStorage.setItem('tower-playground-foundation-v1', 'old bundled module');
      localStorage.setItem('tower-playground-foundation-base-v1', 'old bundled module');
      localStorage.removeItem('tower-project-migrated-v1');localStorage.setItem('tower-playground-source-v1', 'struct S { x: i32; } var s: S; s.x = 42; print(s.x);');
      localStorage.setItem('foundation-upgrade-test', 'set');
    }
  });
  await page.goto('/');
  await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
  await expect(page.locator('#llvm-output')).toHaveText('42\n');
  const bundled = await (await request.get('/foundation.tower')).text();
  await page.evaluate(bundled => {
    localStorage.setItem('tower-playground-foundation-base-v1', bundled);
    localStorage.setItem('tower-playground-foundation-v1', bundled.replace("'struct'", "'record'"));
    localStorage.removeItem('tower-project-migrated-v1');localStorage.setItem('tower-playground-source-v1', 'record S { x: i32; } var s: S; s.x = 7; print(s.x);');
    localStorage.removeItem('tower-playground-document-v1'); // Exercise legacy source migration.
  }, bundled);
  // A pagehide persist would correctly save the open buffers; close this page
  // without navigating and test the stored revision in a new page instead.
  const reopened = await page.context().newPage(); await reopened.goto('/');
  await expect(reopened.locator('#execution-status')).toHaveText('Finished · backends match');
  await expect(reopened.locator('#llvm-output')).toHaveText('7\n');
  await reopened.close();
});
