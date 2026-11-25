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
  for(const id of ['core-instructions','fast-disassembly','llvm-before','llvm-after','wasm-disassembly']) {
    await page.locator('#'+id).scrollIntoViewIfNeeded();
    await expect(page.locator('#'+id+' .tw-keyword').first()).toBeVisible();
    expect((await outputText(page,id)).length).toBeGreaterThan(10);
  }
  expect(errors).toEqual([]);
});

test('source and Tower output use identical classes and colors for foundation tokens', async ({page},info) => {
  await page.goto('/'); await expect(page.locator('#status')).toContainText('Complete');
  await selectDocument(page, 'increment.tower');
  await expect(page.locator('#execution-status')).toContainText('backends match');
  const colors=[], evidence=[];
  for(const id of ['editor','core-instructions','fast-disassembly']) {
    const pane=page.locator('#'+id), text=await outputText(page,id);
    // Optimized Foundation can inline post_increment. Use a reconstructed
    // function declaration for the same three token roles in that pane.
    const pattern=id==='fast-disassembly' ? /^fn (\w+)\(\): (void) \{$/m : /^fn (post_increment)\(p: i32\*\): (i32) \{$/m;
    const header=text.match(pattern);
    expect(header,id+' function declaration').not.toBeNull();
    await pane.scrollIntoViewIfNeeded();
    await pane.locator('.cm-content').evaluate((el,anchor)=>{
      el.cmView.rootView.view.dispatch({selection:{anchor},scrollIntoView:true});
    },header.index);
    const line=pane.locator('.cm-line').filter({hasText:header[0]});
    const samples=[];
    for(const [token,kind] of [['fn','keyword'],[header[1],'identifier'],[header[2],'identifier']]) {
      // The return type is the final occurrence on the declaration line.
      const span=line.getByText(token,{exact:true}).last();
      await expect(span).toHaveClass(new RegExp('\\btw-'+kind+'\\b'));
      await expect(span).toBeVisible();
      const sample=await span.evaluate(el=>{
        const view=el.closest('.cm-content').cmView.rootView.view;
        const from=view.posAtDOM(el,0),to=view.posAtDOM(el,el.childNodes.length);
        return {text:el.textContent,from,to,classes:el.className,color:getComputedStyle(el).color,
          visible:view.visibleRanges.some(range=>range.from<=from && to<=range.to)};
      });
      const from=header.index+header[0].lastIndexOf(token);
      expect(sample).toMatchObject({text:token,from,to:from+token.length,visible:true});
      samples.push(sample);
    }
    const [keyword,name,type]=samples;
    expect(name.color).toBe(type.color);
    expect(keyword.color).not.toBe(type.color);
    colors.push([keyword.color,name.color,type.color]);
    evidence.push({id,declaration:header[0],samples});
  }
  expect(colors[1]).toEqual(colors[0]); expect(colors[2]).toEqual(colors[0]);
  await info.attach('foundation-token-spans',{body:JSON.stringify(evidence),contentType:'application/json'});
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
  // Native output can sit outside the horizontally scrolling result grid.
  // Replacing it there must not expand the DOM to the entire generated program.
  await page.evaluate(()=>{
    window.output.view.contentDOM.blur();
    window.output.parent.style.transform='translateX(200vw)';
    window.output.view.requestMeasure();
  });
  await expect.poll(()=>page.evaluate(()=>window.output.view.inView)).toBe(false);
  await page.evaluate(()=>window.output.setText(window.output.text.replace('%v0 = add i32 0, 42','%v0 = add i32 0, 200')));
  expect(await page.evaluate(()=>window.output.view.state.doc.toString().includes('%v0 = add i32 0, 200'))).toBe(true);
  expect(await page.locator('.cm-line').count()).toBeLessThan(200);
  await page.evaluate(()=>{window.output.parent.style.transform='';});
  await expect(page.locator('.cm-line').filter({hasText:'%v49999'})).toBeVisible();
  await expect(page.locator('.tw-keyword').filter({hasText:'add'}).last()).toBeVisible();
  await info.attach('output-rendering',{body:JSON.stringify({...result,renderedLines:await page.locator('.cm-line').count()}),contentType:'application/json'});
});
