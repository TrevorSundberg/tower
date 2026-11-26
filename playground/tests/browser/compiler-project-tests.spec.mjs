import {test, expect} from './worker-lifecycle.mjs';

test('Run tests uses the selected compiler file and leaves Rebuild idle', async ({page, baseURL}) => {
  test.setTimeout(90000);
  const builds = [];
  page.on('worker', worker => {
    if (worker.url().endsWith('/compiler-build-worker.js')) builds.push(worker.url());
  });
  await page.goto(baseURL);
  await page.locator('#project-kind').selectOption('tower:compiler');
  const folder = page.locator('.file-folder[data-path="compiler"]');
  if (!await folder.evaluate(element => element.open)) await folder.locator(':scope > summary').click();
  const owner = 'compiler/generic_body_types.tower';
  const companion = 'compiler/generic_body_types_test.tower';
  const select = path => page.locator('#file-tree button[data-path="' + path + '"]').click();
  const run = async expected => {
    await page.locator('#run-tests').click();
    await expect(page.locator('#execution-status')).toHaveText(expected, {timeout:45000});
  };
  await select(owner);
  await expect(page.locator('#execute')).toHaveText('Rebuild compiler');
  await expect(page.locator('#auto-rebuild-compiler')).toBeChecked();
  await run('1 test passed');
  await select(companion);
  await run('1 test passed');
  await select(owner);
  await page.getByText('Test settings', {exact:true}).click();
  await page.locator('#test-suffix').fill('_spec.tower');
  await run('No tests found');
  await page.locator('#test-suffix').fill('');
  await select(companion);
  // Catch a pending edit timer and a new timer accidentally armed by selecting
  // the owner after cancellation. Keep the actions in one browser event turn.
  await page.evaluate(owner => {
    const view = document.querySelector('#editor .cm-content').cmView.rootView.view;
    view.dispatch({changes:{from:view.state.doc.length, insert:'\n'}});
    document.getElementById('run-tests').click();
    document.getElementById('cancel-execution').click();
    document.querySelector('#file-tree button[data-path="' + owner + '"]').click();
  }, owner);
  await run('1 test passed');
  // Wait past the editor's one-second rebuild debounce.
  await page.waitForTimeout(1200);
  expect(builds).toEqual([]);
});
