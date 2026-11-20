import { outputText } from './output-text.mjs';
import {selectDocument, downloadedProject, revealDiagnostics} from './project-helpers.mjs';
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
test('modules show their source and grammar tree without executable instruction output', async ({page,request}, info) => {
  const bedrock = await (await request.get('/bedrock.tower')).text();
  await expect(page.locator('.builtin-badge')).toHaveCount(2);
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
  await selectDocument(page, 'foundation.tower');
  await expect(page.locator('#filename')).toHaveText('foundation.tower');
  await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('#execution-panel')).toBeVisible();
  await expect.poll(()=>outputText(page,'core-instructions')).toBe('');
  await expect(page.locator('#tree')).toContainText('CoreFunction');
  await page.locator('#execute').click();
  await expect(page.locator('#execution-status')).toHaveText('Finished \u00b7 backends match');
  await expect.poll(()=>outputText(page,'core-instructions')).toBe('');
  await expect(page.locator('#execution-output')).toBeEmpty();
  await expect(page.locator('#llvm-output')).toBeEmpty();
  await selectDocument(page, 'foreach.tower');
  await setSource(page, 'print(42);');
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
  expect(foundation).not.toMatch(/^(?:skip Whitespace|token Identifier)\b/m);
  await selectDocument(page, 'bedrock.tower');
  await setSource(page, bedrock.replace('[ \\t\\r\\n]+', '[ ~\\t\\r\\n]+').replace('[A-Za-z0-9_]*', '[A-Za-z0-9_-]*'));
  await expect(page.locator('#status')).toContainText('Complete');
  await selectDocument(page, 'foreach.tower');
  await setSource(page, 'var~player-name:~i32~=~42;print(~player-name);');
  await expect(page.locator('#execution-status')).toHaveText('Finished \u00b7 backends match');
  await expect(page.locator('#execution-output')).toHaveText('42\n');
  await expect(page.locator('#llvm-output')).toHaveText('42\n');
  await selectDocument(page, 'foundation.tower');
  await expect(page.locator('#status')).toContainText('Complete');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', {name:'Save',exact:true}).click();
  const saved = (await downloadedProject(await downloadPromise)).builtins.foundation;
  expect(saved).toBe(foundation);
  await page.getByRole('tab', { name: 'Active grammar' }).click();
  await expect(page.locator('#rules')).toContainText('GrammarAssignment');
  await page.screenshot({path:'../build/playground-shared-foundation-'+info.project.name+'.png'});
});
test('invalid bedrock stays editable, persists and restores without damaging foundation', async ({page,request}) => {
  const bedrock = await (await request.get('/bedrock.tower')).text();
  await selectDocument(page, 'bedrock.tower');
  await setSource(page,bedrock.replace('$name:Identifier','$wrong:Identifier'));
  await page.locator('#editor-error').click();
  await expect(page.locator('.tw-inline-error-message')).toContainText("must preserve capture 'name'");
  await selectDocument(page, 'foreach.tower');
  await expect(page.locator('#error-message')).toContainText('bedrock.tower');
  // Select the built-in while the reloaded project's async hydration is pending.
  await page.reload({waitUntil:'commit'});
  await selectDocument(page, 'bedrock.tower');
  await page.locator('#editor-error').click();
  await expect(page.locator('.tw-inline-error-message')).toContainText("must preserve capture 'name'");
  await page.getByRole('button',{name:'Restore',exact:true}).click();
  await expect(page.locator('#status')).toContainText('Complete');
  await selectDocument(page, 'foundation.tower');
  await expect(page.locator('#status')).toContainText('Complete');
});

test('Identifier edits immediately affect following declarations in every document', async ({page,request}, info) => {
  const bedrock = await (await request.get('/bedrock.tower')).text();
  for (const filename of ['bedrock.tower', 'foundation.tower', 'foreach.tower']) {
    await selectDocument(page, filename);
    const source = filename === 'bedrock.tower' ? bedrock.replace('[A-Za-z_][A-Za-z0-9_]*', 'ffff[A-Za-z_][A-Za-z0-9_]*')
      : 'token Identifier = /ffff[A-Za-z_][A-Za-z0-9_]*/ as identifier;\ntoken String = /[a-z]+/;';
    await setSource(page, source);
    await expect(page.locator('#status')).toContainText('Stopped');
    await page.locator('#editor-error').click();
    await expect(page.locator('.tw-inline-error-message')).toContainText('No token rule matches source');
    const line = source.slice(0, source.indexOf('token String')).split('\n').length;
    await expect(page.locator('.tw-inline-error-heading')).toHaveText(`Error${filename}:${line}:7`);
    await expect(page.locator('#execution-panel')).toBeVisible();
    if (filename === 'bedrock.tower') await page.screenshot({path:'../build/playground-bedrock-identifier-'+info.project.name+'.png'});
    await page.getByRole('button',{name:'Restore',exact:true}).click();
    await expect(page.locator('#status')).toContainText('Complete');
  }
});
