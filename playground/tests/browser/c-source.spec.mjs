import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {outputText} from './output-text.mjs';

test('C is optional, ordered, highlighted, downloadable and obeys shared options',async({page})=>{
  test.setTimeout(120000);
  await page.addInitScript(()=>{
    if(sessionStorage.getItem('c-test-initialized')) return;
    sessionStorage.setItem('c-test-initialized','1');
    localStorage.setItem('tower-build-targets-v3',JSON.stringify({wasm:true}));
    localStorage.setItem('tower-playground-source-v1','import tower;\n// a carried comment\nfn answer():i32 { return 42; } print(answer());');
  });
  await page.goto('/');
  await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
  await expect(page.locator('#execution-output')).toHaveJSProperty('textContent', '42\n');
  await expect(page.locator('#c-column')).toBeHidden();
  await page.locator('#build-targets summary').click();
  await expect(page.locator('#target-c')).not.toBeChecked();
  await page.locator('#optimize').uncheck();
  await page.locator('#target-c').check();
  await expect(page.locator('#c-download')).toHaveAttribute('href',/^blob:/,{timeout:60000});
  await expect.poll(()=>outputText(page,'c-disassembly')).toContain('a carried comment');
  await expect.poll(()=>outputText(page,'core-instructions')).toContain('a carried comment');
  const order=await page.locator('.execution-column').evaluateAll(nodes=>nodes.map(node=>node.id));
  expect(order.indexOf('c-column')).toBe(order.indexOf('llvm-optimized-column')+1);
  expect(order.indexOf('roku-column')).toBe(order.indexOf('c-column')+1);
  expect(order.indexOf('fast-disassembly-column')).toBe(order.indexOf('roku-column')+1);
  await expect(page.locator('#c-disassembly .tw-keyword').first()).toBeVisible();
  const download=page.waitForEvent('download');
  await page.locator('#c-download').click();
  const artifact=await download;
  expect(artifact.suggestedFilename()).toMatch(/-c\.c$/);
  const raw=await readFile(await artifact.path(),'utf8');
  expect(raw).toBe(await outputText(page,'c-disassembly'));
  expect(raw).toContain('int main(void)');
  expect(raw).toContain('#define TC_POINTER_BYTES 8');
  await page.locator('#build-targets summary').click();
  await page.locator('#optimize').check();
  await expect.poll(async()=>{
    const source=await outputText(page,'c-disassembly');
    return source.includes('int main(void)') && source!==raw;
  },{timeout:60000}).toBe(true);
  await expect(page.locator('#execution-status')).toContainText('backends match');
  await expect.poll(()=>outputText(page,'c-disassembly')).toContain('a carried comment');
  await page.locator('#preserve-comments').uncheck();
  await expect.poll(async()=>{
    const source=await outputText(page,'c-disassembly');
    return source.includes('int main(void)') && !source.includes('a carried comment');
  },{timeout:60000}).toBe(true);
  await expect.poll(()=>outputText(page,'core-instructions')).not.toContain('a carried comment');
  await expect.poll(()=>outputText(page,'fast-disassembly')).not.toContain('a carried comment');
  await expect(page.locator('#c-download')).toHaveAttribute('href',/^blob:/);
  await page.reload();
  await page.locator('#build-targets summary').click();
  await expect(page.locator('#target-c')).toBeChecked();
  await expect(page.locator('#preserve-comments')).not.toBeChecked();
});

test('increment comments survive C downloads and remain visible when scrolled into view',async({page})=>{
  test.setTimeout(120000);
  await page.addInitScript(()=>{
    localStorage.setItem('tower-build-targets-v3',JSON.stringify({wasm:true,c:true}));
    localStorage.setItem('tower-optimize-v1','false');
    localStorage.setItem('tower-comments-v1','true');
  });
  await page.goto('/');
  await page.locator('#project-kind').selectOption('example:increment');
  const note='5: the old value, then 6: the updated variable.';
  let previousC='';
  for(const optimize of [false,true]) {
    await page.locator('#build-targets summary').click();
    await page.locator('#optimize').setChecked(optimize);
    await page.locator('#build-targets summary').click();
    if(optimize) await expect.poll(()=>outputText(page,'c-disassembly'),{timeout:60000}).not.toBe(previousC);
    await expect.poll(()=>outputText(page,'c-disassembly'),{timeout:60000}).toContain(note);
    await expect(page.locator('#c-download')).toHaveAttribute('href',/^blob:/);
    const download=page.waitForEvent('download');
    await page.locator('#c-download').click();
    const c=await readFile(await (await download).path(),'utf8');
    previousC=c;
    expect(c).toBe(await outputText(page,'c-disassembly'));
    expect(c).toContain(note);
    expect(c).toContain('7: the new value, then 7: the updated variable.');
    await page.locator('#c-disassembly .cm-content').evaluate((element,note)=>{
      const view=element.cmView.rootView.view;
      view.dispatch({selection:{anchor:view.state.doc.toString().indexOf(note)},scrollIntoView:true});
    },note);
    const line=page.locator('#c-disassembly .cm-line').filter({hasText:note});
    await line.scrollIntoViewIfNeeded();
    await expect(line).toBeInViewport();
    await expect.poll(async()=>(await line.locator('.tw-comment').allTextContents()).join('')).toContain(note);
  }
});
