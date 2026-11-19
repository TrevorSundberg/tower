import {test, expect} from '@playwright/test';
import {selectDocument} from './project-helpers.mjs';

async function source(page, text) {
  const editor = page.locator('#editor .cm-content');
  await editor.focus(); await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.insertText(text);
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

test('late completion replies cannot replace suggestions for newer input', async ({page}) => {
  await page.route('**/language-worker.js', async route => {
    const response = await route.fetch();
    await route.fulfill({response, body:await response.text()+`\nconst originalPost = self.postMessage.bind(self); self.postMessage = data => setTimeout(() => originalPost(data), 600);`});
  });
  await source(page, 'pri'); await page.keyboard.press('Control+Space');
  await page.waitForTimeout(200); // Deliberately overlap a query with the edit.
  await source(page, 'var value: u'); await page.keyboard.press('Control+Space');
  await expect(page.locator('.cm-tooltip-autocomplete [role=option]').filter({hasText:'usize'})).toBeVisible();
  await expect(page.locator('.cm-tooltip-autocomplete [role=option]').filter({hasText:'print'})).toHaveCount(0);
});
