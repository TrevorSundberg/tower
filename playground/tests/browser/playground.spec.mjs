import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const base = "parse Variable = Identifier;\nparse Expression = Identifier | Number;\nparse Statement = Expression ';';\n";
const loop = "parse ForEach = 'for' '(' $Variable 'in' $Expression ')' '{' $Statement* '}';\nparse Statement |= ForEach;\n";
async function setSource(page, text) {
  const editor = page.getByRole('textbox', { name: 'Tower source' });
  await editor.click();
  // Use editor key bindings: Android CodeMirror defers DOM-only selections,
  // which makes contenteditable.fill an unreliable way to replace its model.
  await editor.press('ControlOrMeta+a');
  await page.keyboard.insertText(text);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#status')).toContainText('Complete');
});

test('whole-document tree selects roots, nested nodes and replacements', async ({ page }, info) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await expect(page.locator('.document-children > li')).toHaveCount(8);
  await expect(page.locator('.document-root')).toHaveText('Document');
  await expect(page.locator('#timeline, #run, #step, #reset')).toHaveCount(0);
  const variable = page.locator('#tree button').filter({ hasText: '$Variable' }).first();
  await variable.click();
  await expect(page.locator('.tw-selected')).toHaveText('item');
  await page.getByRole('tab', { name: 'Active grammar' }).click();
  await expect(page.locator('#keywords')).toContainText('foreach');
  await page.getByRole('tab', { name: 'Parse tree' }).click();
  const last = page.locator('.document-children > li').last().locator(':scope > details > summary');
  await last.click();
  await expect(page.locator('.tw-selected')).toContainText('foreach');
  await page.locator('#example-kind').selectOption('replacements.tower');
  await expect(page.locator('.document-children > li')).toHaveCount(19);
  const root = i => page.locator('.document-children > li').nth(i).locator(':scope > details > summary');
  // Open lazy subtrees to expose previews at their actual replacement roots.
  const expand = async () => { for (let i = 0; i < 12; ++i) { await page.locator('#tree details').evaluateAll(items => items.forEach(item => item.open = true)); await page.waitForTimeout(10); } };
  await expand();
  await expect(page.locator('.expanded-code')).toHaveCount(8);
  await expect(page.locator('.expanded-code').nth(0)).toHaveText('2 * 3 + 1');
  await expect(page.locator('.expanded-code').nth(1)).toHaveText('4 + 1');
  await expect(page.locator('.expanded-code').nth(3)).toHaveText('item + 1');
  await expect(page.locator('.expanded-code').nth(6)).toHaveText('7 + 1');
  await expect(page.locator('.expanded-code').nth(7)).toHaveText('7 + 1');
  const replacement = page.locator('.document-children > li').nth(17).locator('button.replacement').first();
  await replacement.click();
  await expect(page.locator('#node-info')).toContainText('definition bytes');
  await expect(page.locator('.tw-selected').first()).toContainText('foreach');
  await page.locator('#tokens').check(); await expand();
  await expect(page.locator('.expanded-code')).toHaveCount(8);
  await page.locator('#tree-pane').evaluate(element => { element.scrollTop = 0; });
  await page.screenshot({ path: `../build/playground-document-${info.project.name}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(errors).toEqual([]);
  await setSource(page, base + "parse Expression |= 'bad' => replace { $missing };\nbad;");
  await expect(page.locator('.tw-inline-error-message')).toContainText('Unknown replacement capture');
  await expect(page.locator('#node-info')).not.toContainText('definition bytes');
  await expect(page.locator('#revision')).toHaveText('Revision 3');
  await expect(page.locator('.expanded-code')).toHaveCount(0);
});

test('shared prefixes parse live and ambiguous boundaries show inline conflicts', async ({ page, request }, info) => {
  const example = await (await request.get('/foreach.tower')).text();
  await setSource(page, example.replace('parse Statement |= ForEach;', "parse Statement |= ForEach | 'for';"));
  await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('.document-children > li')).toHaveCount(8);
  await expect(page.locator('.tw-inline-error')).toHaveCount(0);
  await expect(page.locator('#tree')).toContainText('ForEach');
  await expect(page.getByText('Define the syntax. Then use it.', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'How to explore' })).toHaveCount(0);
  await setSource(page, "parse Statement = 'x';\nparse Statement |= 'x' 'x';");
  await expect(page.locator('.tw-inline-error-message')).toContainText('shift/reduce');
  await expect(page.locator('#revision')).toHaveText('Revision 1');
  await page.locator('#editor-error').click();
  await page.locator('#editor').screenshot({ path: `../build/playground-conflict-${info.project.name}.png` });
});

test('live edit installs new keywords; comments and quoted strings keep their classification', async ({ page }) => {
  const source = base + 'for;\n' + loop + 'for(item in items){}\n' +
    "parse ForEach = 'walk' '(' $Variable 'in' $Expression ')' '{' $Statement* '}';\n" + 'for;forest;walk(entry in entries){}';
  await setSource(page, source);
  await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('.cm-content .tw-keyword').filter({ hasText: /^walk$/ })).toHaveCount(1);
  await expect(page.locator('.cm-content .tw-keyword').filter({ hasText: /^for$/ })).toHaveCount(1);
  await expect(page.locator('.cm-content .tw-identifier').filter({ hasText: /^for$/ })).toHaveCount(2);
  await expect(page.locator('.cm-content .tw-identifier').filter({ hasText: /^forest$/ })).toHaveCount(1);
  await page.getByRole('tab', { name: 'Active grammar' }).click();
  await expect(page.locator('#keywords code').filter({ hasText: /^walk$/ })).toHaveCount(1);
  await expect(page.locator('#keywords code').filter({ hasText: /^for$/ })).toHaveCount(0);
  await setSource(page, '// 🚀 café\nparse Statement = String \';\';\n"雪🚀 ; // }";');
  await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('.tw-comment')).toHaveText('// 🚀 café');
  await expect(page.locator('.tw-string').filter({ hasText: '雪' })).toHaveText('"雪🚀 ; // }"');
});
test('diagnostics, corrected input, local persistence and source download work', async ({ page }, info) => {
  await setSource(page, "parse Statement |= '';\n");
  await expect(page.locator('.tw-inline-error-message')).toHaveText('Token literal is empty. Expected at least one character between the quotes.');
  await expect(page.locator('.tw-error-range')).toHaveText("''");
  await page.locator('#editor-error').click();
  await expect(page.locator('.tw-inline-error')).toBeInViewport();
  await page.screenshot({path:`../build/playground-empty-literal-${info.project.name}.png`});
  await setSource(page, base + "parse Statement |= Expression ';';");
  await expect(page.getByRole('alert')).toContainText('Grammar conflict');
  await expect(page.locator('#revision')).toHaveText('Revision 3');
  await page.locator('#editor-error').click();
  await expect(page.locator('.tw-inline-error')).toBeVisible();
  expect(await page.locator('.tw-inline-error-card').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.locator('#editor').screenshot({ path: `../build/playground-error-conflict-${info.project.name}.png` });
  await setSource(page, base + '123;');
  await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.getByRole('alert')).toBeHidden();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('foreach.tower');
  await page.reload();
  await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.getByRole('button', { name: 'Example', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Restore', exact: true }).click();
  await expect(page.locator('#status')).toContainText('Complete');
});

test('inline errors mark the source and preserve the saved document', async ({ page }, info) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const source = base + loop + '\nfor (item in items) {\n    item)\n}\n';
  await setSource(page, source);
  await expect(page.locator('#status')).toContainText('Stopped');
  await expect(page.locator('.tw-error-range')).toHaveText(')');
  await expect(page.locator('.tw-inline-error-heading')).toHaveText('ErrorLn 8, Col 9');
  await expect(page.locator('.tw-inline-error-message')).toContainText('Unexpected');
  await expect(page.locator('#diagnostic')).toBeHidden();
  await expect(page.getByRole('textbox', { name: 'Tower source' })).toBeFocused();
  await page.getByRole('button', { name: 'Go to error on line 8' }).click();
  const line = await page.locator('.tw-error-line').boundingBox();
  const card = await page.locator('.tw-inline-error').boundingBox();
  expect(card.y).toBeGreaterThanOrEqual(line.y + line.height - 1);
  const marker = page.locator('.tw-error-marker:visible').last();
  const mark = await marker.boundingBox();
  expect(mark.y).toBeGreaterThanOrEqual(line.y);
  expect(mark.y + mark.height).toBeLessThanOrEqual(line.y + line.height);
  expect(await page.locator('.cm-scroller').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.screenshot({ path: `../build/playground-error-${info.project.name}.png`, fullPage: true });
  await page.locator('#editor').screenshot({ path: `../build/playground-error-editor-${info.project.name}.png` });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  const download = await downloadPromise;
  expect(await readFile(await download.path(), 'utf8')).toBe(source);
  await setSource(page, source.replace('item)', 'item;'));
  await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('.tw-inline-error')).toHaveCount(0);
  await expect(page.locator('.tw-error-range')).toHaveCount(0);
  await expect(page.locator('#editor-error')).toBeHidden();
  expect(errors).toEqual([]);
});

test('inline Unicode and end-of-input locations stay visible until fresh diagnostics arrive', async ({ page }, info) => {
  await setSource(page, "// 雪🚀\nparse Statement = Number ';';\n🚀;");
  await expect(page.locator('.tw-error-range')).toHaveText('🚀');
  await expect(page.locator('.tw-inline-error-heading')).toHaveText('ErrorLn 3, Col 1');
  const incomplete = "// 雪🚀\nparse Statement = Number ';';\n42";
  await setSource(page, incomplete);
  await expect(page.locator('.tw-inline-error-message')).toContainText('end of input');
  await expect(page.locator('.tw-inline-error-message')).not.toContainText('at byte');
  await expect(page.locator('.tw-inline-error-heading')).toHaveText('ErrorLn 3, Col 3');
  await expect(page.locator('.tw-error-range')).toHaveCount(0);
  await expect(page.locator('.tw-error-point')).toHaveCount(1);
  await page.locator('#editor').screenshot({ path: `../build/playground-error-eof-${info.project.name}.png` });
  await page.workers()[0].evaluate(() => {
    const send = self.postMessage.bind(self);
    self.postMessage = (data, ...args) => setTimeout(() => send(data, ...args), 1000);
  });
  await page.keyboard.insertText(';');
  await expect(page.locator('#status')).toContainText('Tower is parsing');
  await expect(page.locator('.tw-inline-error')).toHaveCount(1);
  await expect(page.locator('.tw-error-point')).toHaveCount(1);
  await expect(page.locator('#editor-error')).toBeVisible();
  await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('.tw-inline-error')).toHaveCount(0);
  await expect(page.locator('.tw-error-point')).toHaveCount(0);
  await expect(page.locator('#editor-error')).toBeHidden();
  await setSource(page, incomplete + '\n');
  // The missing semicolon belongs after the last token, before trailing trivia.
  await expect(page.locator('.tw-inline-error-heading')).toHaveText('ErrorLn 3, Col 3');
  await expect(page.locator('.tw-error-point')).toHaveCount(1);

});

test('the error shortcut reveals errors outside the editor viewport', async ({ page }) => {
  await setSource(page, "// A rejected declaration keeps its source location.\ntoken Identifier = /[a-z]*/;\n" + '// more source\n'.repeat(100));
  await expect(page.locator('#status')).toContainText('Stopped');
  await expect(page.locator('#editor-error')).toHaveText('Error · Ln 2');
  expect(await page.locator('.cm-scroller').evaluate(el => el.scrollTop)).toBeGreaterThan(500);
  await page.locator('#editor-error').click();
  await expect(page.locator('.tw-inline-error-message')).toContainText('must not match empty input');
  await expect(page.locator('.tw-error-range')).toHaveText('token');
  await expect(page.getByRole('textbox', { name: 'Tower source' })).toBeFocused();
  await expect(page.locator('.tw-inline-error')).toBeInViewport();
  await expect(page.locator('.tw-error-range')).toBeInViewport();
});

test('LLVM compiles the current program into a downloadable executable', async ({ page, request }) => {
  const capabilities = await (await request.get('/capabilities.json')).json();
  test.skip(!capabilities.llvm, 'Optional LLVM module has not been built');
  await expect(page.locator('details#compiler-check')).toHaveCount(0);
  await page.locator('#auto-execute').uncheck();
  await page.locator('#example-kind').selectOption('functions.tower');
  await expect(page.locator('#status')).toContainText('Complete');
  await page.getByRole('button', { name: 'Execute', exact: true }).click();
  await expect(page.locator('#execution-status')).toContainText('Finished · backends match', { timeout: 30000 });
  await expect(page.locator('#execution-output')).toHaveText('720\n721\n');
  await expect(page.locator('#llvm-download')).toBeVisible();
  await expect(page.locator('#llvm-download')).toHaveAttribute('download', 'tower-program.wasm');
});

test('continuous typing coalesces into one update and reuses the WASM worker and grammar tables', async ({ page }) => {
  const workers = []; page.on('worker', worker => workers.push(worker));
  const worker = page.workers()[0];
  await worker.evaluate(() => {
    const send = self.postMessage.bind(self);
    self.__editReplies = [];
    self.postMessage = (data, ...args) => {
      self.__editReplies.push({ offset: data.result?.snapshot.offset, builds: data.result?.snapshot.grammarBuilds });
      return send(data, ...args);
    };
  });
  const editor = page.getByRole('textbox', { name: 'Tower source' });
  await editor.click(); await editor.press('ControlOrMeta+End');
  await page.keyboard.insertText('\n// typing ');
  await expect(page.locator('#status')).toContainText('Complete');
  await worker.evaluate(() => { self.__editReplies=[]; });
  await page.evaluate(() => {
    window.__liveUpdates = 0;
    new MutationObserver(() => {
      if (document.querySelector('#status').textContent.startsWith('Complete')) window.__liveUpdates++;
    }).observe(document.querySelector('#status'), { childList: true });
  });
  await page.keyboard.type('updates throughout a continuous burst of typing', { delay: 15 });
  expect(await page.evaluate(() => window.__liveUpdates)).toBe(0);
  await expect(page.locator('#status')).toContainText('Complete');
  expect(workers).toHaveLength(0);
  const replies = await worker.evaluate(() => self.__editReplies);
  expect(replies).toHaveLength(1);
  expect(replies.every(reply => reply.builds === 0)).toBe(true);
});

test('edits during a slow response coalesce and cannot display an obsolete parse', async ({ page }) => {
  const workers = []; page.on('worker', worker => workers.push(worker));
  const worker = page.workers()[0];
  await worker.evaluate(() => {
    const send = self.postMessage.bind(self);
    self.__editReplies = [];
    self.postMessage = (data, ...args) => {
      self.__editReplies.push({ offset: data.result?.snapshot.offset, builds: data.result?.snapshot.grammarBuilds });
      setTimeout(() => send(data, ...args), 300);
    };
  });
  const editor = page.getByRole('textbox', { name: 'Tower source' });
  await editor.click(); await editor.press('ControlOrMeta+End');
  await page.keyboard.insertText('\n// first');
  await expect(page.locator('#status')).toContainText('Tower is parsing');
  await page.keyboard.insertText(' second');
  await page.keyboard.insertText(' newest');
  await expect(page.locator('#status')).toContainText('Complete');
  expect(workers).toHaveLength(0);
  const replies = await worker.evaluate(() => self.__editReplies);
  expect(replies).toHaveLength(2);
  expect(replies[1].offset - replies[0].offset).toBe(' second newest'.length);
  expect(replies.every(reply => reply.builds === 0)).toBe(true);

});

test('editable token rules update parsing, highlighting and the grammar inspector', async ({ page, request }, info) => {
  await page.getByRole('combobox', { name: 'Editor document' }).selectOption('tokens.tower');
  await expect(page.locator('#status')).toContainText('Complete · 10 grammar revisions');
  await expect(page.locator('.tw-identifier').filter({ hasText: /^player-name$/ })).toHaveCount(1);
  await expect(page.locator('.tw-number').filter({ hasText: /^3\.14$/ })).toHaveCount(1);
  await page.getByRole('tab', { name: 'Active grammar' }).click();
  await expect(page.locator('#token-rules')).toContainText('@[A-Za-z_][A-Za-z_0-9]*');
  await expect(page.locator('#token-rules')).toContainText('skip HashComment');
  const example = await (await request.get('/tokens.tower')).text();
  await setSource(page, example.replaceAll('0x', '0y'));
  await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('#token-rules')).toContainText('0y[0-9A-Fa-f]+');
  await setSource(page, 'token Identifier = /[a-z]*/;');
  await expect(page.getByRole('alert')).toContainText('must not match empty input');
  await expect(page.locator('#revision')).toHaveText('Revision 0');
  await page.getByRole('button', { name: 'Restore', exact: true }).click();
  await expect(page.locator('#status')).toContainText('Complete');
  await page.screenshot({ path: `../build/playground-tokens-${info.project.name}.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.locator('#example-kind').selectOption('foundation.tower');
  await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('#filename')).toHaveText('foundation.tower');
  await expect(page.locator('#rules')).toContainText('CoreFunction');
});
