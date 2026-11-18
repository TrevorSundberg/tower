import {test, expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const legacy = await readFile(new URL('../fixtures/foundation-legacy.tower', import.meta.url), 'utf8');

test('the screenshot-era saved Foundation upgrades in the editor, persists and executes', async ({page,request}, info) => {
  const foundation = await (await request.get('/foundation.tower')).text();
  await page.addInitScript(({legacy,foundation}) => {
    if (localStorage.getItem('legacy-upgrade-seeded')) return;
    localStorage.setItem('tower-playground-foundation-v1', legacy);
    // Reproduce the old UI writing a new baseline beside the old document.
    localStorage.setItem('tower-playground-foundation-base-v1', foundation);
    localStorage.setItem('tower-playground-source-v1', 'print(42);');
    localStorage.setItem('legacy-upgrade-seeded', '1');
  }, {legacy,foundation});
  await page.goto('/');
  await expect(page.locator('#execution-status')).toHaveText('Finished \u00b7 backends match');
  await expect(page.locator('#execution-output')).toHaveText('42\n');
  await expect(page.locator('#llvm-output')).toHaveText('42\n');
  await page.locator('#example-kind').selectOption('foundation.tower');
  await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.locator('#execution-panel')).toBeVisible();
  await expect(page.locator('#core-instructions')).toBeEmpty();
  await expect(page.getByRole('textbox',{name:'Tower source'})).not.toContainText('skip Whitespace');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button',{name:'Save',exact:true}).click();
  let saved = '';
  for await (const chunk of await (await downloadPromise).createReadStream()) saved += chunk.toString();
  expect(saved).toBe(foundation);
  expect(await page.evaluate(() => localStorage.getItem('tower-playground-foundation-before-inheritance-v1'))).toBe(legacy);
  expect(await page.evaluate(() => localStorage.getItem('tower-playground-foundation-v1'))).toBe(foundation);
  await page.screenshot({path:'../build/playground-foundation-upgraded-'+info.project.name+'.png'});
  await page.reload();
  await expect(page.locator('#example-kind')).toHaveValue('foundation.tower');
  await expect(page.locator('#status')).toContainText('Complete');
  await expect(page.getByRole('textbox',{name:'Tower source'})).not.toContainText('skip Whitespace');
  await page.locator('#example-kind').selectOption('scratch.tower');
  await expect(page.locator('#execution-status')).toHaveText('Finished \u00b7 backends match');
});
