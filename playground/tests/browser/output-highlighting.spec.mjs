import {selectDocument} from './project-helpers.mjs';
import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { outputText } from './output-text.mjs';

test('real compilation highlights foundation, both LLVM forms and Wasm',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await expect(page.locator('#status')).toContainText('Complete');
  await selectDocument(page, 'functions.tower');
  await expect(page.locator('#execution-status')).toContainText('backends match');
  for(const id of ['core-instructions','llvm-before','llvm-after','wasm-disassembly']) {
    await page.locator('#'+id).scrollIntoViewIfNeeded();
    await expect(page.locator('#'+id+' .tw-keyword').first()).toBeVisible();
    expect((await outputText(page,id)).length).toBeGreaterThan(10);
  }
  expect(errors).toEqual([]);
});

test('source and Tower output use identical classes and colors for foundation tokens', async ({page}) => {
  await page.goto('/'); await expect(page.locator('#status')).toContainText('Complete');
  await selectDocument(page, 'increment.tower');
  await expect(page.locator('#execution-status')).toContainText('backends match');
  for (const root of ['#editor','#core-instructions','#fast-disassembly']) {
    await expect(page.locator(root+' .tw-identifier').filter({hasText:/^post_increment$/}).first()).toBeAttached();
    await expect(page.locator(root+' .tw-identifier').filter({hasText:/^i32$/}).first()).toBeAttached();
  }
  const colors = await page.evaluate(() => ['#editor','#core-instructions','#fast-disassembly'].map(root => {
    const identifier = [...document.querySelectorAll(root+' .tw-identifier')].find(el=>el.textContent==='i32');
    const keyword = [...document.querySelectorAll(root+' .tw-keyword')].find(el=>el.textContent==='fn');
    return [getComputedStyle(identifier).color,getComputedStyle(keyword).color];
  }));
  expect(colors[1]).toEqual(colors[0]); expect(colors[2]).toEqual(colors[0]);
});

test('multi-megabyte output virtualizes, stays read-only, and highlights after scrolling',async({page},info)=>{
  const bundle=await build({stdin:{contents:`import { CodeOutput } from './src/code-output.mjs'; window.output=new CodeOutput(document.getElementById('large'),'llvm');`,resolveDir:fileURLToPath(new URL('../../',import.meta.url))},bundle:true,format:'esm',write:false});
  await page.route('**/output-fixture.js',route=>route.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text}));
  await page.route('**/highlight-fixture',route=>route.fulfill({contentType:'text/html',body:'<link rel="stylesheet" href="/style.css"><div id="large" aria-label="Large output" style="height:200px;flex:none"></div><script type="module" src="/output-fixture.js"></script>'}));
  await page.goto('/highlight-fixture');
  const result=await page.evaluate(()=>{
    const source='; <img src=x onerror=alert(1)>\n'+Array.from({length:50000},(_,i)=>`%v${i} = add i32 ${i}, 42 ; generated output\n`).join('');
    const start=performance.now();window.output.setText(source);
    return {ms:performance.now()-start,bytes:source.length};
  });
  expect(result.bytes).toBeGreaterThan(2_000_000);
  await expect(page.locator('.tw-comment').first()).toBeVisible();
  expect(await page.locator('.cm-line').count()).toBeLessThan(200);
  await expect(page.locator('img')).toHaveCount(0);
  await page.locator('.cm-content').focus();await page.keyboard.type('oops');
  expect(await page.evaluate(()=>window.output.view.state.doc.toString().includes('oops'))).toBe(false);
  await page.evaluate(()=>window.output.view.dispatch({selection:{anchor:window.output.view.state.doc.length},scrollIntoView:true}));
  await expect(page.locator('.cm-line').filter({hasText:'%v49999'})).toBeVisible();
  await expect(page.locator('.tw-keyword').filter({hasText:'add'}).last()).toBeVisible();
  expect(await page.locator('.cm-line').count()).toBeLessThan(200);
  await info.attach('output-rendering',{body:JSON.stringify({...result,renderedLines:await page.locator('.cm-line').count()}),contentType:'application/json'});
});
