import {test, expect} from '@playwright/test';
import {newProject} from '../../src/projects.mjs';
import {exportProject} from '../../src/project-archive.mjs';
import {savedProject, downloadedProject} from './project-helpers.mjs';
async function edit(page,text) {
  const editor = page.getByRole('textbox',{name:'Tower source'});
  await editor.click(); await editor.press('ControlOrMeta+a'); await page.keyboard.insertText(text);
}
async function prompt(page,button,text) { page.once('dialog', d => d.accept(text)); await page.locator(button).click(); }
test.beforeEach(async({page}) => {
  await page.goto('/'); await expect(page.locator('#status')).toContainText('Complete');
  await page.locator('#auto-execute').uncheck();
});
test('projects own folders, built-ins, undo, links and execution state',async({page},info) => {
  await expect(page.locator('#example-kind')).toHaveCount(0);
  await expect(page.locator('#project-kind option')).toHaveCount(10);
  await expect(page.locator('.builtin-badge')).toHaveCount(2);
  await prompt(page,'#new-project','Ocean');
  await edit(page,'print(answer());');
  await prompt(page,'#new-file','src/math.tower');
  await edit(page,'fn answer(): i32 { return 42; }');
  await page.locator('#execute').click();
  await expect(page.locator('#execution-output')).toHaveText('42\n');
  await expect(page.locator('#llvm-output')).toHaveText('42\n');
  await page.locator('[data-path=".tower/bedrock.tower"]').click();
  await edit(page,'// Ocean built-in\n' + await (await page.request.get('/bedrock.tower')).text());
  await expect(page.locator('#project-storage')).toHaveText('Saved in browser');
  const ocean = await savedProject(page);
  await page.locator('#project-kind').selectOption('example:execution');
  await page.locator('[data-path=".tower/bedrock.tower"]').click();
  expect((await savedProject(page)).builtins.bedrock).not.toContain('Ocean built-in');
  await page.locator('#project-kind').selectOption(ocean.id);
  await expect(page.locator('#filename')).toHaveText('bedrock.tower');
  await page.locator('[data-path="src/math.tower"]').click();
  await expect(page.locator('#project-storage')).toHaveText('Saved in browser');
  await page.reload();
  await expect(page.locator('#filename')).toHaveText('src/math.tower');
  await expect(page.locator('#file-tree')).toContainText('math.tower');
  expect((await savedProject(page)).files.map(f=>f.path)).toEqual(['main.tower','src/math.tower']);
  await page.screenshot({path:`../build/projects-${info.project.name}.png`});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('whole project ZIP imports large files and exports every file and link input',async({page}) => {
  const builtins = {bedrock:await (await page.request.get('/bedrock.tower')).text(), foundation:await (await page.request.get('/foundation.tower')).text()};
  const project = newProject('Large',builtins,[{path:'main.tower',text:'print(7);'},{path:'assets/large.txt',text:'snow 雪\n'.repeat(900000)}]);
  project.links['sample.o'] = Uint8Array.of(1,2,255);
  await page.locator('#file').setInputFiles({name:'Large.zip',mimeType:'application/zip',buffer:Buffer.from(await exportProject(project).arrayBuffer())});
  await expect(page.locator('#project-kind option:checked')).toHaveText('Large');
  await expect(page.locator('#project-storage')).toHaveText('Saved in browser');
  expect((await savedProject(page)).files[1].text.length).toBe(project.files[1].text.length);
  await page.reload(); await expect(page.locator('#file-tree')).toContainText('large.txt');
  const pending = page.waitForEvent('download'); await page.locator('#save').click();
  const download = await pending; expect(download.suggestedFilename()).toBe('Large.zip');
  const exported = await downloadedProject(download);
  expect(exported.files).toEqual(project.files); expect(exported.links).toEqual(project.links);
});
test('switching projects cancels an infinite loop and discards stale output',async({page}) => {
  await edit(page,'loop {}'); await page.locator('#execute').click();
  await expect(page.locator('#core-instructions')).toContainText('loop');
  await page.locator('#project-kind').selectOption('example:execution');
  await expect(page.locator('#execution-output')).toBeEmpty();
  await page.locator('#execute').click(); await expect(page.locator('#execution-output')).toHaveText('15\n16\n');
});
test('errors in another project file are named without marking the active source',async({page}) => {
  await prompt(page,'#new-project','Errors');
  await prompt(page,'#new-file','lib/bad.tower'); await edit(page,'var bad: i32 = true;');
  await page.locator('[data-path="main.tower"]').click(); await page.locator('#execute').click();
  await expect(page.locator('#error-message')).toContainText('lib/bad.tower');
  await expect(page.locator('.tw-inline-error')).toHaveCount(0);
});
test('file moves, rename and delete persist, and invalid paths keep the project intact',async({page}) => {
  await prompt(page,'#new-project','Files');
  await edit(page,'print(1);');
  await prompt(page,'#new-file','src/second.tower'); await edit(page,'print(2);');
  await page.locator('#move-file-up').click();
  await page.locator('#execute').click(); await expect(page.locator('#execution-output')).toHaveText('2\n1\n');
  await prompt(page,'#rename-file','lib/second.tower');
  await expect(page.locator('#filename')).toHaveText('lib/second.tower');
  await prompt(page,'#new-file','../escape.tower');
  await expect(page.locator('#error-message')).toContainText('relative file path');
  expect((await savedProject(page)).files.map(f=>f.path)).toEqual(['lib/second.tower','main.tower']);
  page.once('dialog',d=>d.accept()); await page.locator('#delete-file').click();
  await expect(page.locator('#project-storage')).toHaveText('Saved in browser');
  await page.reload(); await expect(page.locator('#filename')).toHaveText('main.tower');
  expect((await savedProject(page)).files.map(f=>f.path)).toEqual(['main.tower']);
});
test('pending link-file reads cannot leak into a different project',async({page}) => {
  await page.evaluate(() => {
    const original = File.prototype.arrayBuffer;
    File.prototype.arrayBuffer = async function() { await new Promise(resolve=>window.releaseLink=resolve); return original.call(this); };
  });
  await page.locator('#link-input').setInputFiles({name:'sample.o',mimeType:'application/octet-stream',buffer:Buffer.from([1,2,3])});
  await page.locator('#project-kind').selectOption('example:execution');
  await page.evaluate(()=>window.releaseLink());
  await expect(page.locator('#link-files')).toHaveText('Link files');
  expect((await savedProject(page)).links).toEqual({});
});
test('storage errors are visible and project download remains available',async({page}) => {
  await page.evaluate(() => { IDBObjectStore.prototype.put = function() { throw new DOMException('Storage full','QuotaExceededError'); }; });
  await edit(page,'print(99);');
  await expect(page.locator('#project-storage')).toContainText('Not saved');
  const pending = page.waitForEvent('download'); await page.locator('#save').click();
  expect((await downloadedProject(await pending)).files[0].text).toBe('print(99);');
});
