import { outputText } from './output-text.mjs';
import {selectDocument, downloadedProject, revealDiagnostics, savedProject} from './project-helpers.mjs';
import { test, expect } from '@playwright/test';
async function setSource(page, text) {
  await page.locator('#editor').click({ position: { x: 80, y: 20 } });
  await page.getByRole('textbox', { name: 'Tower source' }).press('ControlOrMeta+a');
  await page.keyboard.insertText(text);
  await revealDiagnostics(page);
}
async function downloadSource(page, filename) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', {name:'Save',exact:true}).click();
  const download = await pending;
  return (await downloadedProject(download)).builtins[filename.replace('.tower','')];
}
test.beforeEach(async ({page}) => {
  await page.goto('/'); await expect(page.locator('#status')).toContainText('Complete');
});
test('Bedrock and Foundation show their own source and distinguish syntax from execution', async ({page,request}, info) => {
  const bedrock = await (await request.get('/bedrock.tower')).text();
  const foundation = await (await request.get('/foundation.tower')).text();
  await expect(page.locator('#file-tree button').filter({has:page.locator('.builtin-badge')}))
    .toHaveAttribute('data-path', '.tower/bedrock.tower');
  await selectDocument(page, 'bedrock.tower');
  await expect(page.locator('#filename')).toHaveText('bedrock.tower');
  await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('#execution-status')).toHaveText('Syntax only');
  await expect(page.locator('#execution-panel')).toBeVisible();
  await expect.poll(()=>outputText(page,'core-instructions')).toBe('');
  await expect(page.locator('#tree')).toContainText('GrammarDeclaration');
  await expect(page.locator('#execute')).toBeEnabled();
  expect(await downloadSource(page, 'bedrock.tower')).toBe(bedrock);
  await page.screenshot({path:'../build/playground-bedrock-'+info.project.name+'.png'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  await selectDocument(page, 'foreach.tower');
  await setSource(page, 'import foundation;\nprint(42);');
  const foundationFile = page.locator('#file-tree button[data-path=".tower/foundation.tower"]');
  await foundationFile.click();
  await expect(page.locator('#filename')).toHaveText('foundation.tower');
  await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('#execution-panel')).toBeVisible();
  await expect.poll(()=>outputText(page,'core-instructions')).toBe('');
  expect(await downloadSource(page, 'foundation.tower')).toBe(foundation);
  await expect(page.locator('#tree')).toContainText('import foundation_syntax');
  await expect(page.locator('#tree')).toContainText('import types');
  await page.locator('#execute').click();
  await expect(page.locator('#execution-status')).toHaveText('Finished \u00b7 backends match');
  await expect.poll(()=>outputText(page,'core-instructions')).toContain('import foundation_syntax;');
  await expect(page.locator('#execution-output')).toBeEmpty();
  await expect(page.locator('#llvm-output')).toBeEmpty();
  await selectDocument(page, 'foreach.tower');
  await expect(page.locator('#execution-panel')).toBeVisible();
  await expect(page.locator('#execution-status')).toHaveText('Finished \u00b7 backends match');
  await expect.poll(()=>outputText(page,'core-instructions')).toContain('print(42);');
  await expect(page.locator('#execution-output')).toHaveText('42\n');
  await expect(page.locator('#llvm-output')).toHaveText('42\n');
  await selectDocument(page, 'bedrock.tower');
  await expect(page.locator('#execution-panel')).toBeVisible();
  for (const id of ['core-instructions','llvm-before','llvm-after','execution-output','llvm-output'])
    await expect.poll(()=>['core-instructions','llvm-before','llvm-after'].includes(id) ? outputText(page,id) : page.locator('#'+id).textContent()).toBe('');
});
async function openIncrement(page) {
  await page.locator('#project-kind').selectOption('example:increment');
  await expect(page.locator('#filename')).toHaveText('increment.tower');
  await expect(page.locator('#file-tree [data-path=".tower/foundation.tower"]')).toBeVisible();
}
async function openFile(page, path) {
  await page.locator(`#file-tree button[data-path="${path}"]`).click();
  await expect(page.locator('#filename')).toHaveText(path.replace(/^\.tower\//, ''));
}
async function expectOutput(page, text) {
  await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
  for (const id of ['execution-output','fast-output','llvm-output'])
    await expect(page.locator('#' + id)).toHaveJSProperty('textContent', text);
}
test('editing bedrock updates its next declarations and downstream modules while undo histories remain independent', async ({page,request}) => {
  const bedrock = await (await request.get('/bedrock.tower')).text();
  const foundation = await (await request.get('/foundation.tower')).text();
  await selectDocument(page, 'bedrock.tower');
  const edited = bedrock.replace("'parse'", "'rule'").replace(/^parse (?!GrammarDeclaration\b)/gm, 'rule ');
  await setSource(page,edited);
  await expect(page.locator('#status')).toContainText('Complete');
  expect(await downloadSource(page, 'bedrock.tower')).toBe(edited);
  await selectDocument(page, 'foundation.tower');
  await page.locator('#editor-error').click();
  await expect(page.locator('.tw-inline-error-message')).toContainText('Foundation may contain only');
  await setSource(page,foundation.replace(/^parse /gm,'rule '));
  await expect(page.locator('#status')).toContainText('Complete');
  await selectDocument(page, 'foreach.tower');
  await setSource(page,"rule Statement |= 'show' $value:CoreOperand ';' => replace { print($value); };show 42;");
  await expect(page.locator('#execution-status')).toHaveText('Finished \u00b7 backends match',{timeout:30000});
  await expect(page.locator('#execution-output')).toHaveText('42\n');
  await expect(page.locator('#llvm-output')).toHaveText('42\n');
  await selectDocument(page, 'bedrock.tower');
  await page.getByRole('textbox',{name:'Tower source'}).press('ControlOrMeta+z');
  expect(await downloadSource(page, 'bedrock.tower')).toBe(bedrock);
  await selectDocument(page, 'foundation.tower');
  await page.locator('#editor-error').click();
  await expect(page.locator('.tw-inline-error-message')).toContainText('Foundation may contain only');
  await page.getByRole('textbox',{name:'Tower source'}).press('ControlOrMeta+z');
  await expect(page.locator('#status')).toContainText('Complete');
  await selectDocument(page, 'bedrock.tower');
  await expect(page.locator('#status')).toContainText('Complete');
});

test('one bedrock whitespace and identifier definition drives foundation and both execution workers', async ({page,request}, info) => {
  const bedrock = await (await request.get('/bedrock.tower')).text();
  const foundation = await (await request.get('/foundation.tower')).text();
  expect(foundation).not.toMatch(/(?:skip Whitespace|token Identifier)\b/);
  await openIncrement(page);
  await openFile(page, '.tower/bedrock.tower');
  const edited = bedrock.replace('[ \\t\\r\\n]+', '[ ~\\t\\r\\n]+').replace('[A-Za-z0-9_]*', '[A-Za-z0-9_-]*');
  await setSource(page, edited);
  await expect(page.locator('#status')).toContainText('Complete');
  await openFile(page, 'increment.tower');
  await setSource(page, 'import foundation;\nvar~player-name:~i32~=~42;print(~player-name);');
  await expectOutput(page, '42\n');
  await openFile(page, '.tower/foundation.tower');
  await expect(page.locator('#status')).toContainText('Complete');
  expect(await downloadSource(page, 'foundation.tower')).toBe(foundation);
  await page.getByRole('tab', { name: 'Active grammar' }).click();
  await expect(page.locator('#rules')).toContainText('GrammarAssignment');
  await expect(page.locator('#token-rules')).toContainText('[ ~\\t\\r\\n]+');
  await expect(page.locator('#token-rules')).toContainText('[A-Za-z0-9_-]*');
  await page.screenshot({path:'../build/playground-shared-foundation-'+info.project.name+'.png'});
});

test('invalid bedrock stays editable, persists and restores without damaging foundation', async ({page,request}) => {
  const bedrock = await (await request.get('/bedrock.tower')).text();
  const foundation = await (await request.get('/foundation.tower')).text();
  const guest = 'import foundation;\nprint(29);';
  const broken = bedrock.replace("parse Attribute = '[' $name:", "parse Attribute = '[' $wrong:");
  const diagnostic = "Malformed bedrock tree: missing capture 'name'";
  await openIncrement(page);
  await setSource(page, guest);
  await expectOutput(page, '29\n');
  await openFile(page, '.tower/bedrock.tower');
  await setSource(page, broken);
  await page.locator('#editor-error').click();
  await expect(page.locator('.tw-inline-error-message')).toHaveText(diagnostic);
  await openFile(page, 'increment.tower');
  await expect(page.locator('#error-message')).toContainText('bedrock.tower: ' + diagnostic);
  for (const id of ['execution-output','fast-output','llvm-output']) await expect(page.locator('#'+id)).toBeEmpty();
  await expect.poll(async () => (await savedProject(page)).active).toBe('increment.tower');
  await page.reload({waitUntil:'commit'});
  await expect(page.locator('#error-message')).toContainText('bedrock.tower: ' + diagnostic);
  for (const id of ['execution-output','fast-output','llvm-output']) await expect(page.locator('#'+id)).toBeEmpty();
  const saved = await savedProject(page);
  expect(saved.builtins.bedrock).toBe(broken);
  expect(saved.builtins.foundation).toBe(foundation);
  expect(saved.files).toEqual([{path:'increment.tower',text:guest}]);
  await openFile(page, '.tower/bedrock.tower');
  await expect.poll(() => outputText(page, 'editor')).toBe(broken);
  await page.locator('#editor-error').click();
  await expect(page.locator('.tw-inline-error-message')).toHaveText(diagnostic);
  await page.getByRole('button',{name:'Restore',exact:true}).click();
  await expect.poll(() => outputText(page, 'editor')).toBe(bedrock);
  await expect(page.locator('#status')).toContainText('Complete');
  await openFile(page, '.tower/foundation.tower');
  await expect(page.locator('#status')).toContainText('Complete');
  await openFile(page, 'increment.tower');
  await expectOutput(page, '29\n');
});

test('Identifier edits immediately affect following declarations in every document', async ({page,request}, info) => {
  await openIncrement(page);
  for (const path of ['.tower/bedrock.tower', '.tower/foundation.tower', 'increment.tower']) {
    await openFile(page, path);
    const filename = path.replace(/^\.tower\//, '');
    const original = await (await request.get('/' + filename)).text();
    const isBedrock = filename === 'bedrock.tower';
    const source = isBedrock ? original.replace('[A-Za-z_][A-Za-z0-9_]*', 'ffff[A-Za-z_][A-Za-z0-9_]*')
      : (filename === 'foundation.tower' ? original : 'import foundation;') + '\n[identifier] token Identifier = /ffff[A-Za-z_][A-Za-z0-9_]*/;\ntoken String = /[a-z]+/;';
    await setSource(page, source);
    await expect(page.locator('#status')).toContainText('Stopped');
    await page.locator('#editor-error').click();
    await expect(page.locator('.tw-inline-error-message')).toContainText('No token rule matches source');
    // Bedrock's next declaration starts with the attribute [string]. The
    // other documents first use the changed Identifier for the name String.
    const marker = isBedrock ? '[string] token String' : 'token String =';
    const start = source.lastIndexOf(marker);
    expect(start).toBeGreaterThan(-1);
    const offset = start + (isBedrock ? '['.length : 'token '.length);
    const lines = source.slice(0, offset).split('\n');
    await expect(page.locator('.tw-inline-error-heading')).toHaveText(`Error${filename}:${lines.length}:${lines.at(-1).length + 1}`);
    await expect(page.locator('#execution-panel')).toBeVisible();
    if (isBedrock) await page.screenshot({path:'../build/playground-bedrock-identifier-'+info.project.name+'.png'});
    await page.getByRole('button',{name:'Restore',exact:true}).click();
    await expect.poll(() => outputText(page, 'editor')).toBe(original);
    await expect(page.locator('#status')).toContainText('Complete');
  }
});
