import {test, expect} from './worker-lifecycle.mjs';
import {outputText} from './output-text.mjs';
import {savedProject, selectDocument} from './project-helpers.mjs';

for (const [width, serviceWorkers] of [[1, 'block'], [4, 'allow']]) {
  test('Tests project uses the selected modules in the editor at width ' + width, async ({browser, baseURL}, info) => {
    test.setTimeout(180000);
    const context = await browser.newContext({serviceWorkers});
    const page = await context.newPage();
    try {
      await page.addInitScript(() => {
        localStorage.setItem('tower-auto-execute-v1', 'false');
        localStorage.setItem('tower-build-targets-v3', '{"wasm":true}');
      });
      await page.goto(baseURL);
      await page.locator('#project-kind').selectOption('example:tests');
      expect(await page.evaluate(() => crossOriginIsolated)).toBe(width === 4);
      const status = page.locator('#execution-status');
      const run = async (button, expected) => {
        await page.locator(button).click();
        await expect(status).toHaveText(expected, {timeout:45000});
      };
      const select = name => selectDocument(page, name);
      const edit = async (from, to) => {
        const text = await outputText(page, 'editor');
        expect(text).toContain(from);
        const editor = page.getByRole('textbox', {name:'Tower source'});
        await editor.click(); await editor.press('ControlOrMeta+a');
        await page.keyboard.insertText(text.replace(from, to));
      };
      const rename = async name => {
        page.once('dialog', dialog => dialog.accept(name));
        await page.locator('#rename-file').click();
        await expect(page.locator('#filename')).toHaveText(name);
      };
      await page.locator('#build-targets summary').click();
      await page.locator('#target-wasm').uncheck();
      await page.locator('#target-fast').uncheck();
      await page.locator('#build-targets summary').click();
      await run('#execute', 'Finished');
      await expect(page.locator('#execution-output')).toHaveJSProperty('textContent', '42\n');
      await run('#run-tests', '2 tests passed');
      const worker = page.workers().find(worker => worker.url().endsWith('/execution-worker.js'));
      expect(worker).toBeDefined();
      await select('score.tower');
      await run('#run-tests', '2 tests passed');
      await select('score_test.tower');
      await run('#run-tests', '1 test passed');
      await edit('per_player == 21', 'per_player == 22');
      await select('main.tower');
      await run('#run-tests', /Tests failed.*Expected 21 points per player/);
      const location = page.locator('#test-location');
      await expect(location).toHaveText('score_test.tower:10:5');
      await location.click();
      await expect(page.locator('#filename')).toHaveText('score_test.tower');
      const selection = await page.locator('#editor .cm-content').evaluate(element => {
        const {doc, selection} = element.cmView.rootView.view.state;
        const {from, to} = selection.main;
        return {line:doc.lineAt(from).number, column:from - doc.lineAt(from).from + 1, text:doc.sliceString(from,to)};
      });
      expect(selection).toMatchObject({line:10, column:5});
      expect(selection.text).toMatch(/^a/);
      await edit('per_player == 22', 'per_player == 21');
      await run('#run-tests', '1 test passed');
      expect(page.workers()).toContain(worker);
      await rename('score_spec.tower');
      await select('score.tower');
      await run('#run-tests', '1 test passed');
      await page.getByText('Test settings', {exact:true}).click();
      await page.locator('#test-suffix').fill('_spec.tower');
      await run('#run-tests', '2 tests passed');
      await select('score_spec.tower');
      await run('#run-tests', '1 test passed');
      await select('test_points.tower');
      await rename('missing.tower');
      await select('main.tower');
      await run('#execute', 'Finished');
      await expect(page.locator('#execution-output')).toHaveJSProperty('textContent', '42\n');
      await run('#run-tests', /Tests failed.*test_points/);
      await select('missing.tower');
      await rename('test_points.tower');
      await select('main.tower');
      await run('#run-tests', '2 tests passed');
      expect(page.workers()).toContain(worker);
      // Cancel from the page before its queued worker reply can be delivered.
      await page.evaluate(() => {
        document.getElementById('run-tests').click();
        document.getElementById('cancel-execution').click();
      });
      await expect(status).toHaveText('Cancelled');
      await run('#run-tests', '2 tests passed');
      await expect.poll(async () => (await savedProject(page))?.testSuffix).toBe('_spec.tower');
      await page.reload();
      await expect(page.locator('#project-kind')).toHaveValue('example:tests');
      await expect(page.locator('#test-suffix')).toHaveValue('_spec.tower');
      await run('#run-tests', '2 tests passed');
    } finally {
      await info.attach('editor state', {body:JSON.stringify(await page.locator('body').innerText()), contentType:'text/plain'});
      await context.close();
    }
  });
}
