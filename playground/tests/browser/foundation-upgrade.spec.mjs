import {outputText} from './output-text.mjs';
import {selectDocument, savedProject, downloadedProject, revealDiagnostics} from './project-helpers.mjs';
import {test, expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const legacy = await readFile(new URL('../fixtures/foundation_legacy.tower', import.meta.url), 'utf8');

async function seedLegacy(page, saved, baseline, source) {
  await page.addInitScript(({saved, baseline, source}) => {
    if (localStorage.getItem('legacy-upgrade-seeded')) return;
    localStorage.setItem('tower-playground-foundation-v1', saved);
    // Reproduce the old UI writing a new baseline beside the old document.
    localStorage.setItem('tower-playground-foundation-base-v1', baseline);
    localStorage.setItem('tower-playground-source-v1', source);
    localStorage.setItem('legacy-upgrade-seeded', '1');
  }, {saved, baseline, source});
}

test('the screenshot-era saved Foundation upgrades in the editor, persists and executes', async ({page,request}, info) => {
  const foundation = await (await request.get('/foundation.tower')).text();
  const source = 'print(42);';
  await seedLegacy(page, legacy, foundation, source);
  await page.goto('/');
  await expect(page.locator('#filename')).toHaveText('scratch.tower');
  await expect(page.locator('#status')).toContainText('Stopped');
  await expect.poll(() => outputText(page, 'editor')).toBe(source);
  const recovered = await savedProject(page);
  expect(recovered.name).toBe('Recovered workspace');
  expect(recovered.files).toEqual([{path:'scratch.tower', text:source}]);
  expect(recovered.builtins.foundation).toBe(foundation);
  // Migration preserves the user's source. Import its executable grammar in the editor.
  const editor = page.getByRole('textbox', {name:'Tower source'});
  await editor.press('ControlOrMeta+Home');
  await page.keyboard.insertText('import foundation;\n');
  await revealDiagnostics(page);
  await expect(page.locator('#execution-status')).toHaveText('Finished \u00b7 backends match');
  await expect(page.locator('#execution-output')).toHaveText('42\n');
  await expect(page.locator('#llvm-output')).toHaveText('42\n');
  await selectDocument(page, 'foundation.tower');
  await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('#execution-panel')).toBeVisible();
  await expect.poll(()=>outputText(page,'core-instructions')).toBe('');
  await expect.poll(() => outputText(page, 'editor')).toBe(foundation);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button',{name:'Save',exact:true}).click();
  const saved = (await downloadedProject(await downloadPromise)).builtins.foundation;
  expect(saved).toBe(foundation);
  expect(await page.evaluate(() => localStorage.getItem('tower-playground-foundation-v1'))).toBe(legacy);
  expect((await savedProject(page)).builtins.foundation).toBe(foundation);
  await page.screenshot({path:'../build/playground-foundation-upgraded-'+info.project.name+'.png'});
  await page.reload();
  await expect(page.locator('#filename')).toHaveText('foundation.tower');
  await expect(page.locator('#status')).toContainText('Complete');
  await expect.poll(() => outputText(page, 'editor')).toBe(foundation);
  await selectDocument(page, 'scratch.tower');
  await expect(page.locator('#execution-status')).toHaveText('Finished \u00b7 backends match');
  await expect(page.locator('#execution-output')).toHaveText('42\n');
  await expect(page.locator('#llvm-output')).toHaveText('42\n');
});

test('migration preserves an unrecognized customized Foundation across reload', async ({page, request}) => {
  const foundation = await (await request.get('/foundation.tower')).text();
  const custom = '// My grammar\n' + foundation + "\nparse Statement |= 'say' $value:CoreOperand ';' => replace { print($value); };";
  await seedLegacy(page, custom, foundation, 'import foundation;\nsay 17;');
  await page.goto('/');
  for (const visit of ['initial', 'reload']) {
    if (visit === 'reload') await page.reload();
    await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
    await expect(page.locator('#execution-output')).toHaveText('17\n');
    await expect(page.locator('#llvm-output')).toHaveText('17\n');
    expect((await savedProject(page)).builtins.foundation).toBe(custom);
  }
  await selectDocument(page, 'foundation.tower');
  await expect.poll(() => outputText(page, 'editor')).toBe(custom);
});
