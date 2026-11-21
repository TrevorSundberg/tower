import {test, expect} from '@playwright/test';

test('the static playground establishes isolation and loads the threaded compiler', async ({page}) => {
  test.setTimeout(120000);
  const errors = [];
  const requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  await page.goto('/');
  await expect(page.locator('#status')).toContainText('Complete', {timeout:90000});
  expect(await page.evaluate(() => crossOriginIsolated)).toBe(true);
  expect(requests.some(url => url.endsWith('/tower-threads.wasm'))).toBe(true);
  await expect.poll(() => page.workers().filter(worker => worker.url().endsWith('/compiler-thread-worker.js')).length).toBeGreaterThan(1);
  expect(errors).toEqual([]);
  await page.locator('#auto-execute').uncheck();
  await page.locator('#build-targets summary').click();
  await page.locator('#target-wasm').uncheck();
  await page.locator('#build-targets summary').click();
  const editor = page.getByRole('textbox', {name:'Tower source'});
  await page.locator('#editor').click({position:{x:80, y:20}});
  await editor.press('ControlOrMeta+a');
  await page.keyboard.insertText('import tower; fn twice(n:i32):decltype(n) { return n * 2; } var answer = comptime(twice(21)); print(answer);');
  await page.locator('#execute').click();
  await expect(page.locator('#execution-output')).toHaveText('42\n', {timeout:60000});
  await page.reload();
  await expect(page.locator('#status')).toContainText('Complete', {timeout:90000});
  expect(await page.evaluate(() => crossOriginIsolated)).toBe(true);
  expect(errors).toEqual([]);
});

test('blocking isolation retains the portable compiler', async ({browser, baseURL}) => {
  test.setTimeout(120000);
  const context = await browser.newContext({serviceWorkers:'block'});
  try {
    const page = await context.newPage();
    const requests = [];
    page.on('request', request => requests.push(request.url()));
    await page.goto(baseURL);
    await expect(page.locator('#status')).toContainText('Complete', {timeout:90000});
    expect(await page.evaluate(() => crossOriginIsolated)).toBe(false);
    expect(requests.some(url => url.endsWith('/tower.wasm'))).toBe(true);
    expect(requests.some(url => url.endsWith('/tower-threads.wasm'))).toBe(false);
    expect(page.workers().filter(worker => worker.url().endsWith('/compiler-thread-worker.js'))).toHaveLength(0);
  } finally { await context.close(); }
});
