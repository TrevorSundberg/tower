import {selectDocument, downloadedProject, revealDiagnostics, savedSource} from './project-helpers.mjs';
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const numberToken = "[number] token Number = /[0-9]+/;\n";
const base = numberToken + "parse Variable = Identifier;\nparse Expression = Identifier | Number;\nparse Statement = Expression ';';\n";
const loop = "parse ForEach = 'for' '(' $Variable 'in' $Expression ')' '{' $Statement* '}';\nparse Statement |= ForEach;\n";
async function setSource(page, text) {
  const editor = page.getByRole('textbox', { name: 'Tower source' });
  await editor.click();
  // Use editor key bindings: Android CodeMirror defers DOM-only selections,
  // which makes contenteditable.fill an unreliable way to replace its model.
  await editor.press('ControlOrMeta+a');
  await page.keyboard.insertText(text);
  await revealDiagnostics(page);
}

async function checkLessonNumber(page, filename, source, declaration) {
  await expect(page.locator('#filename')).toHaveText(filename);
  await expect.poll(() => savedSource(page)).toBe(source);
  const offset = source.indexOf(declaration);
  expect(offset).toBeGreaterThanOrEqual(0);
  const start = Buffer.byteLength(source.slice(0, offset));
  const end = start + Buffer.byteLength(declaration);
  const roots = page.locator('.document-children > li');
  await expect(roots.first().locator(':scope > details > summary')).toHaveAttribute('title', 'ImportDeclaration | bytes [0, 15)');
  const token = roots.nth(1).locator(':scope > details > summary');
  await expect(token).toHaveAttribute('title', `GrammarTokenDeclaration | bytes [${start}, ${end})`);
  await token.click();
  await expect(page.locator('#editor .tw-selected')).toHaveText(declaration.split('\n'));
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#status')).toContainText('Complete');
});

test('slow parsing has no deadline and can be cancelled or superseded', async ({page}) => {
  test.setTimeout(45000);
  await page.locator('#auto-execute').uncheck();
  const parser = () => page.workers().find(worker => new URL(worker.url()).pathname.endsWith('/worker.js'));
  async function delayMarkedRequests(worker) {
    await worker.evaluate(() => {
      const analyze = self.onmessage;
      self.onmessage = async event => {
        if (event.data.source?.startsWith('// slow-parser-fixture')) {
          self.lastSlowSource = event.data.source;
          await new Promise(resolve => setTimeout(resolve, 11500));
        }
        return analyze(event);
      };
    });
  }
  const first = parser();
  await delayMarkedRequests(first);
  const program = value => `import foundation;\nprint(${value});`;
  const slow = value => `// slow-parser-fixture\n${program(value)}`;
  await setSource(page, slow(1));
  await expect(page.locator('#status')).toContainText('Tower is parsing');
  await expect(page.locator('#status')).toContainText('Complete', {timeout:20000});

  await setSource(page, slow(2));
  await expect(page.locator('#status')).toContainText('Tower is parsing');
  await expect.poll(() => first.evaluate(() => self.lastSlowSource)).toBe(slow(2));
  const closed = first.waitForEvent('close');
  await page.locator('#cancel-execution').click();
  await expect(page.locator('#status')).toHaveText('Parsing cancelled');
  await closed;
  await setSource(page, program(0));
  await expect(page.locator('#status')).toContainText('Complete');
  const next = parser();
  await delayMarkedRequests(next);
  await setSource(page, slow(3));
  await expect(page.locator('#status')).toContainText('Tower is parsing');
  await expect.poll(() => next.evaluate(() => self.lastSlowSource)).toBe(slow(3));
  await setSource(page, program(4));
  // The old reply is discarded, then the latest edit uses the same warm worker.
  await expect(page.locator('#status')).toContainText('Complete', {timeout:20000});
  await expect(page.locator('#tree .node-preview')).toHaveText('print(4);');
  expect(parser()).toBe(next);
  await expect.poll(() => savedSource(page)).toBe(program(4));
});

test('whole-document tree selects roots, nested nodes and replacements', async ({ page }, info) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const lesson = await readFile(new URL('../../../scaffolding/examples/foreach.tower', import.meta.url), 'utf8');
  await expect(page.locator('.document-children > li')).toHaveCount(10);
  await checkLessonNumber(page, 'foreach.tower', lesson, '[number]\ntoken Number = /[0-9]+/;');
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
  await selectDocument(page, 'replacements.tower');
  await expect(page.locator('.document-children > li')).toHaveCount(21);
  const replacements = await readFile(new URL('../../../scaffolding/examples/replacements.tower', import.meta.url), 'utf8');
  await checkLessonNumber(page, 'replacements.tower', replacements, numberToken.trimEnd());
  // Open lazy subtrees to expose previews at their actual replacement roots.
  const expand = async () => { for (let i = 0; i < 12; ++i) { await page.locator('#tree details').evaluateAll(items => items.forEach(item => item.open = true)); await page.waitForTimeout(10); } };
  await expand();
  await expect(page.locator('.expanded-code')).toHaveCount(8);
  await expect(page.locator('.expanded-code').nth(0)).toHaveText('2 * 3 + 1');
  await expect(page.locator('.expanded-code').nth(1)).toHaveText('4 + 1');
  await expect(page.locator('.expanded-code').nth(3)).toHaveText('item + 1');
  await expect(page.locator('.expanded-code').nth(6)).toHaveText('7 + 1');
  await expect(page.locator('.expanded-code').nth(7)).toHaveText('7 + 1');
  const foreach = page.locator('.document-children > li').filter({has:page.locator('.node-preview', {hasText:'foreach (item in items)'})});
  const replacement = foreach.locator('button.replacement').first();
  await replacement.click();
  const template = ' loop ($item in $collection) $body ';
  const definition = Buffer.from(replacements).indexOf(template);
  expect(definition).toBeGreaterThanOrEqual(0);
  await expect(page.locator('#node-info')).toContainText(`definition bytes [${definition}, ${definition + Buffer.byteLength(template)})`);
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
  await expect(page.locator('#revision')).toHaveText('Revision 4');
  await expect(page.locator('.expanded-code')).toHaveCount(0);
});

test('shared prefixes parse live and ambiguous boundaries show inline conflicts', async ({ page, request }, info) => {
  const example = await (await request.get('/foreach.tower')).text();
  const edited = example.replace('parse Statement |= ForEach;', "parse Statement |= ForEach | 'for';");
  await setSource(page, edited);
  await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('.document-children > li')).toHaveCount(10);
  await checkLessonNumber(page, 'foreach.tower', edited, '[number]\ntoken Number = /[0-9]+/;');
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
  await setSource(page, "// 雪🚀\nparse Statement = '';\n");
  await expect(page.locator('.tw-inline-error-message')).toHaveText('Token literal is empty. Expected at least one character between the quotes.');
  await expect(page.locator('.tw-error-range')).toHaveText("''");
  await expect(page.locator('.tw-inline-error-heading')).toHaveText('Errorforeach.tower:2:19');
  await page.getByRole('button', {name:'Go to error at foreach.tower:2:19'}).click();
  await expect(page.locator('.tw-inline-error')).toBeInViewport();
  await page.screenshot({path:`../build/playground-empty-literal-${info.project.name}.png`});
  await setSource(page, base + "parse Statement |= Expression ';';");
  await expect(page.getByRole('alert')).toContainText('Grammar conflict');
  await expect(page.locator('#revision')).toHaveText('Revision 4');
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
  expect(download.suggestedFilename()).toBe('ForEach.zip');
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
  await expect(page.locator('.tw-error-line .tw-error-range')).toHaveText(')');
  await expect(page.locator('.tw-inline-error-heading')).toHaveText(`Error${await page.locator('#filename').innerText()}:9:9`);
  await expect(page.locator('.tw-inline-error-message')).toContainText("Unexpected ')'. Expected ';'.");
  await expect(page.locator('#diagnostic')).toBeHidden();
  await expect(page.getByRole('textbox', { name: 'Tower source' })).toBeFocused();
  await page.getByRole('button', { name: 'Go to error at foreach.tower:9:9' }).click();
  const marker = page.locator('#editor .tw-error-gutter .tw-error-marker:visible');
  await expect(marker).toBeInViewport();
  // Go to error can scroll between browser calls. Read all three boxes in one layout.
  const { line, card, mark } = await marker.evaluate(element => {
    const editor = element.closest('#editor');
    return {
      line: editor.querySelector('.tw-error-line').getBoundingClientRect().toJSON(),
      card: editor.querySelector('.tw-inline-error').getBoundingClientRect().toJSON(),
      mark: element.getBoundingClientRect().toJSON(),
    };
  });
  expect(card.top).toBeGreaterThanOrEqual(line.bottom - 1);
  expect(mark.top).toBeGreaterThanOrEqual(line.top);
  expect(mark.bottom).toBeLessThanOrEqual(line.bottom);
  expect(await page.locator('.cm-scroller').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.screenshot({ path: `../build/playground-error-${info.project.name}.png`, fullPage: true });
  await page.locator('#editor').screenshot({ path: `../build/playground-error-editor-${info.project.name}.png` });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  const download = await downloadPromise;
  expect((await downloadedProject(download)).files[0].text).toBe(source);
  await setSource(page, source.replace('item)', 'item;'));
  await expect(page.locator('#status')).toContainText('Complete');
  await expect(marker).toHaveCount(0);
  await expect(page.locator('.tw-inline-error')).toHaveCount(0);
  await expect(page.locator('.tw-error-range')).toHaveCount(0);
  await expect(page.locator('#editor-error')).toBeHidden();
  expect(errors).toEqual([]);
});

test('inline Unicode and end-of-input locations stay visible until fresh diagnostics arrive', async ({ page }, info) => {
  const grammar = "// 雪🚀\n" + numberToken + "parse Statement = Number ';';\n";
  await setSource(page, grammar + '🚀;');
  await expect(page.locator('.tw-inline-error-message')).toHaveText('No token rule matches source. Expected a statement or grammar declaration.');
  await expect(page.locator('.tw-error-range')).toHaveText('🚀');
  await expect(page.locator('.tw-inline-error-heading')).toHaveText(`Error${await page.locator('#filename').innerText()}:4:1`);
  const incomplete = grammar + '42';
  await setSource(page, incomplete);
  await expect(page.locator('.tw-inline-error-message')).toContainText("Missing ';' before end of input.");
  await expect(page.locator('.tw-inline-error-message')).not.toContainText('at byte');
  await expect(page.locator('.tw-inline-error-heading')).toHaveText(`Error${await page.locator('#filename').innerText()}:4:3`);
  await expect(page.locator('.tw-error-range')).toHaveCount(0);
  await expect(page.locator('.tw-error-point')).toHaveCount(1);
  await page.locator('#editor').screenshot({ path: `../build/playground-error-eof-${info.project.name}.png` });
  await page.workers().find(worker => new URL(worker.url()).pathname.endsWith('/worker.js')).evaluate(() => {
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
  await expect(page.locator('.tw-inline-error-heading')).toHaveText(`Error${await page.locator('#filename').innerText()}:4:3`);
  await expect(page.locator('.tw-error-point')).toHaveCount(1);

});

test('the error shortcut reveals errors outside the editor viewport', async ({ page }) => {
  await setSource(page, "// A rejected declaration keeps its source location.\ntoken Identifier = /[a-z]*/;\n" + '// more source\n'.repeat(100));
  await expect(page.locator('#status')).toContainText('Stopped');
  await expect(page.locator('#editor-error')).toHaveText('Error · foreach.tower:2:1');
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
  await selectDocument(page, 'functions.tower');
  await expect(page.locator('#status')).toContainText('Complete');
  await page.getByRole('button', { name: 'Execute', exact: true }).click();
  await expect(page.locator('#execution-status')).toContainText('Finished · backends match', { timeout: 30000 });
  await expect(page.locator('#execution-output')).toHaveText('720\n721\n');
  await expect(page.locator('#llvm-download')).toBeVisible();
  await expect(page.locator('#llvm-download')).toHaveAttribute('download', 'functions-wasm.wasm');
});

test('continuous typing updates highlighting and reuses the WASM worker and grammar tables', async ({ page }) => {
  const workers = []; page.on('worker', worker => { if (new URL(worker.url()).pathname.endsWith('/worker.js')) workers.push(worker); });
  const worker = page.workers().find(worker => new URL(worker.url()).pathname.endsWith('/worker.js'));
  const editor = page.getByRole('textbox', { name: 'Tower source' });
  await editor.click(); await editor.press('ControlOrMeta+End');
  await page.keyboard.insertText('\n// typing ');
  await expect(page.locator('#status')).toContainText('Complete');
  await worker.evaluate(() => {
    const send = self.postMessage.bind(self);
    self.__grammarBuilds = [];
    self.postMessage = (data, ...args) => {
      self.__grammarBuilds.push(data.result?.snapshot.grammarBuilds);
      return send(data, ...args);
    };
  });
  // Give each batch one editor frame. A real worker reply can then paint that
  // revision before the next key invalidates it, even on a busy test host.
  await page.clock.install();
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 1000)));
  const comment = editor.locator('.cm-line').last().locator('.tw-comment');
  let expected = '// typing ';
  for (const keys of ['updates throughout', ' a continuous burst', ' of typing']) {
    await page.keyboard.type(keys);
    await page.clock.runFor(16);
    expected += keys;
    await expect(comment).toHaveText(expected);
  }
  await expect(page.locator('#status')).toContainText('Complete');
  expect(workers).toHaveLength(0);
  expect(await worker.evaluate(() => self.__grammarBuilds)).toEqual([0, 0, 0]);
});

test('edits during a slow response coalesce and cannot display an obsolete parse', async ({ page }) => {
  const workers = []; page.on('worker', worker => { if (new URL(worker.url()).pathname.endsWith('/worker.js')) workers.push(worker); });
  const worker = page.workers().find(worker => new URL(worker.url()).pathname.endsWith('/worker.js'));
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
  await selectDocument(page, 'tokens.tower');
  await expect(page.locator('#status')).toContainText('Complete · 11 grammar revisions');
  await page.getByRole('textbox',{name:'Tower source'}).press('ControlOrMeta+End');
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
  await expect(page.locator('[data-path=".tower/foundation.tower"]')).toHaveCount(0);
  await selectDocument(page, 'bedrock.tower');
  await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('#filename')).toHaveText('bedrock.tower');
  await expect(page.locator('#rules')).toContainText('GrammarSequence');
});
