import {readFile} from 'node:fs/promises';
import {importProject} from '../../src/project-archive.mjs';
export async function selectDocument(page, name) {
  // Project hydration continues after navigation's load event. An empty tree
  // during startup does not mean this file belongs to another example project.
  await page.locator('#file-tree button').first().waitFor({state:'visible'});
  const builtin = page.locator('#file-tree button').and(page.locator(`[data-path=".tower/${name}"]`));
  const path = await builtin.count() ? '.tower/' + name : name;
  const entry = page.locator('#file-tree button').and(page.locator(`[data-path="${path}"]`));
  if (await entry.count()) await entry.click();
  else await page.locator('#project-kind').selectOption('example:' + name.replace(/\.tower$/,''));
}
export async function savedProject(page) {
  return page.evaluate(() => new Promise((resolve,reject) => {
    const open = indexedDB.open('tower-projects',1);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result, request = db.transaction('projects').objectStore('projects').get(localStorage.getItem('tower-project-selected-v1'));
      request.onsuccess = () => {resolve(request.result); db.close();}; request.onerror = () => reject(request.error);
    };
  }));
}
export async function savedSource(page) { return (await savedProject(page))?.files[0].text; }
export async function downloadedProject(download) { return importProject(new Blob([await readFile(await download.path())])); }
