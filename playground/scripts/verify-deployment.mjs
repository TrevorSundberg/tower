import assert from 'node:assert/strict';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium, devices, expect} from '@playwright/test';

const base = new URL(process.argv[2] || 'http://127.0.0.1:4173/');
if (!base.pathname.endsWith('/')) throw new Error('Deployment URL must end in /');
const output = new URL('../../build/deployment-verification/', import.meta.url);
await mkdir(output, {recursive:true});
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const report = {url:base.href, assets:[], browsers:[]};
for (const name of ['index.html','app.js','worker.js','execution-worker.js','style.css',
  'bedrock.tower','foundation.tower','tower.wasm','tower-llvm.wasm','capabilities.json']) {
  const response = await fetch(new URL(name, base));
  assert.equal(response.status, 200, name);
  const remote = Buffer.from(await response.arrayBuffer());
  const local = await readFile(new URL('../dist/' + name, import.meta.url));
  assert.equal(digest(remote), digest(local), name + ' must match the tested local build');
  if (name.endsWith('.wasm')) assert.match(response.headers.get('content-type'), /application\/wasm/);
  report.assets.push({name,bytes:remote.length,sha256:digest(remote)});
}
console.log('All 10 deployed assets match the local build.');
const foundation = await readFile(new URL('../dist/foundation.tower', import.meta.url), 'utf8');
const bedrock = await readFile(new URL('../dist/bedrock.tower', import.meta.url), 'utf8');
const legacy = await readFile(new URL('../tests/fixtures/foundation-legacy.tower', import.meta.url), 'utf8');
const program = 'fn add(a: i32, b: i32): i32 { var result: i32 = a + b; return result; }\nvar answer: i32 = add(20, 22);\nprint answer;';
const browser = await chromium.launch();
try {
  for (const [name, options] of [
    ['desktop',{...devices['Desktop Chrome'],viewport:{width:1440,height:1000}}],
    ['mobile',{...devices['Pixel 7'],viewport:{width:393,height:851}}],
  ]) {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await context.addInitScript(({foundation,legacy,program}) => {
      if (localStorage.getItem('deployment-check')) return;
      localStorage.setItem('tower-playground-foundation-v1', legacy);
      localStorage.setItem('tower-playground-foundation-base-v1', foundation);
      localStorage.setItem('tower-playground-source-v1', program);
      localStorage.setItem('deployment-check', '1');
    }, {foundation,legacy,program});
    await page.goto(base.href);
    await expect(page.locator('#execution-status')).toHaveText('Finished \u00b7 backends match',{timeout:60000});
    await expect(page.locator('#execution-output')).toHaveText('42\n');
    await expect(page.locator('#llvm-output')).toHaveText('42\n');
    await expect(page.locator('#llvm-before')).toContainText('define');
    await expect(page.locator('#llvm-after')).toContainText('define');
    await page.screenshot({path:new URL(name+'-execution.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
    expect((await page.locator('#example-kind option').allTextContents()).slice(0,3)).toEqual(['Bedrock','Foundation','ForEach']);
    await page.locator('#example-kind').selectOption('foundation.tower');
    await expect(page.locator('#status')).toContainText('Complete');
    await expect(page.locator('#execution-panel')).toBeVisible();
    await expect(page.locator('#core-instructions')).toBeEmpty();
    await expect(page.getByRole('textbox',{name:'Tower source'})).not.toContainText('skip Whitespace');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button',{name:'Save',exact:true}).click();
    let saved = '';
    for await (const chunk of await (await downloadPromise).createReadStream()) saved += chunk.toString();
    assert.equal(saved, foundation);
    assert.equal(await page.evaluate(()=>localStorage.getItem('tower-playground-foundation-before-inheritance-v1')),legacy);
    await page.screenshot({path:new URL(name+'-foundation.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
    await page.locator('#example-kind').selectOption('bedrock.tower');
    await expect(page.locator('#status')).toContainText('Complete');
    await expect(page.locator('#execution-panel')).toBeVisible();
    await expect(page.locator('#core-instructions')).toBeEmpty();
    await expect(page.locator('#tree')).toContainText('Whitespace');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight),true);
    await page.locator('#editor').click({position:{x:80,y:20}});
    await page.getByRole('textbox',{name:'Tower source'}).press('ControlOrMeta+a');
    await page.keyboard.insertText(bedrock.replace('[A-Za-z_][A-Za-z0-9_]*', 'ffff[A-Za-z_][A-Za-z0-9_]*'));
    await expect(page.locator('#status')).toContainText('Stopped');
    await page.locator('#editor-error').click();
    await expect(page.locator('.tw-inline-error-message')).toContainText('Unknown token');
    const badLine = bedrock.slice(0,bedrock.indexOf('token String')).split('\n').length;
    await expect(page.locator('.tw-inline-error-heading')).toHaveText(`ErrorLn ${badLine}, Col 7`);
    await page.screenshot({path:new URL(name+'-bedrock-identifier.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
    await page.getByRole('button',{name:'Restore',exact:true}).click();
    await expect(page.locator('#status')).toContainText('Complete');
    await page.reload();
    await expect(page.locator('#execution-status')).toHaveText('Finished \u00b7 backends match',{timeout:60000});
    await expect(page.locator('#execution-panel')).toBeVisible();
    assert.equal(await page.evaluate(()=>localStorage.getItem('tower-playground-foundation-v1')),foundation);
    await expect(page.getByRole('button',{name:'Example',exact:true})).toHaveCount(0);
    await page.locator('#editor').click({position:{x:80,y:20}});
    await page.getByRole('textbox',{name:'Tower source'}).press('ControlOrMeta+a');
    await page.keyboard.insertText("parse Statement |= '';\n");
    await expect(page.locator('.tw-inline-error-message')).toHaveText('Token literal is empty. Expected at least one character between the quotes.');
    await expect(page.locator('.tw-error-range')).toHaveText("''");
    await page.screenshot({path:new URL(name+'-empty-literal.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
    await page.getByRole('button',{name:'Restore',exact:true}).click();
    await expect(page.locator('#status')).toContainText('Complete');
    await expect(page.locator('.tw-inline-error')).toHaveCount(0);
    assert.deepEqual(errors, []);
    report.browsers.push({name,output:'42\n',migration:true,uniformExecutionUI:true,incrementalBedrock:true,emptyLiteralDiagnostic:true,restore:true,reload:true,errors});
    console.log(name + ': backends agree; incremental Bedrock, empty-token diagnostics, Restore and persisted Foundation work.');
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(new URL('report.json',output),JSON.stringify(report,null,2)+'\n');
