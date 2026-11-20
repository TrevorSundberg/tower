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
  await expect(page.locator('#project-kind option')).toHaveCount(13);
  await expect(page.locator('#project-kind option[value="example:match"]')).toHaveCount(1);
  await expect(page.locator('#project-kind option[value="example:collections"]')).toHaveCount(1);
  await expect(page.locator('.builtin-badge')).toHaveCount(2);
  await expect(page.locator('.builtin-badge')).toHaveText(['library','library']);
  await prompt(page,'#new-project','Ocean');
  await edit(page,'import tower; import src.math; print(answer());');
  await prompt(page,'#new-file','src/math.tower');
  await edit(page,'import tower; fn answer(): i32 { return 42; }');
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
  await prompt(page,'#new-file','lib/bad.tower'); await edit(page,'import tower; var bad: i32 = true;');
  await page.locator('[data-path="main.tower"]').click(); await edit(page,'import tower; import lib.bad; print(42);'); await page.locator('#execute').click();
  await expect(page.locator('#error-message')).toContainText('lib/bad.tower');
  await expect(page.locator('.tw-inline-error')).toHaveCount(0);
});
test('file moves, rename and delete persist, and invalid paths keep the project intact',async({page}) => {
  await prompt(page,'#new-project','Files');
  await edit(page,'print(1);');
  await prompt(page,'#new-file','src/second.tower'); await edit(page,'print(2);');
  await page.locator('#move-file-up').click();
  await page.locator('#execute').click(); await expect(page.locator('#execution-output')).toHaveText('2\n');
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

test('import-only entry executes its closure and updates after a dependency edit',async({page}) => {
  await prompt(page,'#new-project','Imports');
  await edit(page,'import tower; import lib.effects;');
  await prompt(page,'#new-file','lib/effects.tower');
  await edit(page,'import tower; print(41);');
  await page.locator('#auto-execute').check();
  await expect(page.locator('#execution-output')).toHaveText('41\n');
  await expect(page.locator('#llvm-output')).toHaveText('41\n');
  await edit(page,'import tower; print(42);');
  await expect(page.locator('#execution-output')).toHaveText('42\n');
  await expect(page.locator('#llvm-output')).toHaveText('42\n');
  await page.locator('[data-path="main.tower"]').click();
  await expect(page.locator('#execution-output')).toHaveText('42\n');
  await expect(page.locator('#llvm-output')).toHaveText('42\n');
});

test('dotted imports share file identity and import names look different from keywords',async({page}) => {
  await prompt(page,'#new-project','Dotted imports');
  await edit(page,'import tower; import math.answer; import math.answer; print(answer());');
  await prompt(page,'#new-file','math/answer.tower');
  await edit(page,'import tower; print(7); fn answer(): i32 { return 42; }');
  await page.locator('#auto-execute').check();
  await expect(page.locator('#execution-output')).toHaveText('7\n42\n');
  await expect(page.locator('#llvm-output')).toHaveText('7\n42\n');
  await page.locator('[data-path="main.tower"]').click();
  const source = page.locator('#editor .cm-content');
  await expect(source.locator('.tw-identifier').filter({hasText:/^tower$/})).toHaveCount(1);
  await expect(source.locator('.tw-identifier').filter({hasText:/^math$/})).toHaveCount(1);
  await expect(source.locator('.tw-keyword').filter({hasText:/^import$/})).toHaveCount(3);
  await expect(source.locator('.tw-keyword,.tw-rule').filter({hasText:/^(tower|math|answer)$/})).toHaveCount(0);
  const colors = await source.evaluate(root => {
    const find = (selector,text) => [...root.querySelectorAll(selector)].find(el=>el.textContent===text);
    return [getComputedStyle(find('.tw-keyword','import')).color,getComputedStyle(find('.tw-identifier','tower')).color];
  });
  expect(colors[0]).not.toBe(colors[1]);
  await page.locator('[data-path="math/answer.tower"]').click();
  await edit(page,'import tower; print(8); fn answer(): i32 { return 43; }');
  await expect(page.locator('#execution-output')).toHaveText('8\n43\n');
  await expect(page.locator('#llvm-output')).toHaveText('8\n43\n');
});

test('module aliases isolate names and dependency edits update both backends',async({page}) => {
  await prompt(page,'#new-project','Module scopes');
  await edit(page,'import tower; import left.tools as left; import right.tools as right; print(left.answer()); print(right.answer());');
  await prompt(page,'#new-file','left/tools.tower');
  await edit(page,'import tower; fn answer(): i32 { return hidden(); } fn hidden(): i32 { return 20; }');
  await prompt(page,'#new-file','right/tools.tower');
  await edit(page,'import tower; fn answer(): i32 { return hidden(); } fn hidden(): i32 { return 22; }');
  await page.locator('#auto-execute').check();
  await expect(page.locator('#execution-output')).toHaveText('20\n22\n');
  await expect(page.locator('#llvm-output')).toHaveText('20\n22\n');
  await page.locator('[data-path="main.tower"]').click();
  await expect(page.locator('#editor .tw-keyword').filter({hasText:/^as$/})).toHaveCount(2);
  await expect(page.locator('#editor .tw-keyword,.tw-rule').filter({hasText:/^(left|right)$/})).toHaveCount(0);
  await page.locator('[data-path="left/tools.tower"]').click();
  await edit(page,'import tower; fn answer(): i32 { return hidden(); } fn hidden(): i32 { return 21; }');
  await expect(page.locator('#execution-output')).toHaveText('21\n22\n');
  await expect(page.locator('#llvm-output')).toHaveText('21\n22\n');
  await page.locator('[data-path="main.tower"]').click();
  await edit(page,'import tower; import left.tools as left; print(answer());');
  await expect(page.locator('#execution-status')).toContainText('Failed');
  await expect(page.locator('#execution-error')).toContainText("Unknown function 'answer'");
  await expect(page.locator('#execution-output')).not.toContainText('21');
});
