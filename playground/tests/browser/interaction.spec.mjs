import { outputText } from './output-text.mjs';
import {selectDocument, savedSource} from './project-helpers.mjs';
import {test,expect} from '@playwright/test';
async function edit(page,text){
 await page.locator('#editor').click({position:{x:80,y:20}});
 await page.getByRole('textbox',{name:'Tower source'}).press('ControlOrMeta+a');
 await page.keyboard.insertText(text);
}
test.beforeEach(async({page})=>{await page.goto('/');await expect(page.locator('#status')).toContainText('Complete');});

test('typing resets the quiet period and keeps errors until the replacement result',async({page})=>{
 await edit(page,'var value: i32 = true;');
 await expect(page.locator('#execution-status')).toContainText('backends match');
 await expect(page.locator('.tw-inline-error-message')).toContainText('Expected i32');
 await page.evaluate(()=>{
  window.__requests=[];window.__lastInput=0;
  document.querySelector('#editor').addEventListener('input',()=>{window.__lastInput=performance.now();},true);
  const post=Worker.prototype.postMessage;
  Worker.prototype.postMessage=function(data,...rest){window.__requests.push({method:data.method,backend:data.backend,afterInput:performance.now()-window.__lastInput});return post.call(this,data,...rest);};
 });
 await edit(page,'print(42); // ');
 await page.keyboard.type('abcdef',{delay:100});
 await expect(page.locator('.tw-inline-error-message')).toContainText('Expected i32');
 // Completion has its own shorter, independent query schedule. This contract
 // concerns diagnostic parsing and execution, which still wait for quiet input.
 expect(await page.evaluate(()=>window.__requests.filter(r=>r.method==='analyze'||r.backend))).toHaveLength(0);
 await expect(page.locator('#execution-output')).toHaveText('42\n');
 await expect(page.locator('#execution-status')).toContainText('backends match');
 await expect(page.locator('.tw-inline-error')).toHaveCount(0);
 const requests=await page.evaluate(()=>window.__requests.filter(r=>r.method==='analyze'||r.backend));
 expect(requests.filter(r=>r.method==='analyze')).toHaveLength(1);
 expect(requests.filter(r=>r.backend)).toHaveLength(3);
 expect(requests[0].afterInput).toBeGreaterThanOrEqual(190);
});

test('parse errors clear on successful analysis even while execution replies are held',async({page},info)=>{
 await edit(page,'print(42)\nvar answer: i32;');
 await expect(page.locator('.tw-inline-error-message')).toContainText("Missing ';' before 'var'.");
 await expect(page.locator('.tw-inline-error-heading')).toHaveText('ErrorLn 1, Col 10');
 await expect(page.locator('.tw-error-point')).toHaveCount(1);
 await page.locator('#editor').screenshot({path:`../build/diagnostics-semicolon-${info.project.name}.png`});
 await page.evaluate(()=>{
  const post=Worker.prototype.postMessage;
  Worker.prototype.postMessage=function(data,...args){if(data.backend)return;return post.call(this,data,...args);};
 });
 await edit(page,'print(42);\nvar answer: i32;');
 await expect(page.locator('#status')).toContainText('Complete');
 await expect(page.locator('#execution-status')).toContainText('Executing');
 await expect(page.locator('.tw-inline-error')).toHaveCount(0);
 await page.locator('#cancel-execution').click();
});

test('old semantic errors clear after compilation while a new infinite loop is still running',async({page})=>{
 await edit(page,'var value: i32 = true;');
 await expect(page.locator('.tw-inline-error-message')).toContainText('Expected i32');
 await edit(page,'loop { }');
 await expect.poll(()=>outputText(page,'core-instructions')).toContain('loop {');
 await expect(page.locator('#execution-status')).toContainText('Executing');
 await expect(page.locator('.tw-inline-error')).toHaveCount(0);
 await page.locator('#cancel-execution').click();
});

test('reload restores the selected document and its text together',async({page,request},info)=>{
 const source=await(await request.get('/execution.tower')).text();
 await selectDocument(page, 'execution.tower');
 await expect(page.locator('#execution-output')).toHaveText('15\n16\n');
 await edit(page,source+'\n// saved execution edit');
 await page.reload();
 await expect(page.locator('#status')).toContainText('Complete');
 await expect(page.locator('#filename')).toHaveText('execution.tower');
 expect(await savedSource(page)).toBe(source+'\n// saved execution edit');
 await page.screenshot({path:`../build/reload-execution-${info.project.name}.png`});
 await selectDocument(page, 'foundation.tower');
 await expect(page.locator('#status')).toContainText('Complete');
 await page.reload();
 await expect(page.locator('#filename')).toHaveText('foundation.tower');
 await expect(page.locator('#status')).toContainText('Complete');
 await selectDocument(page, 'execution.tower');
 await expect(page.locator('#execution-output')).toHaveText('15\n16\n');
 await page.locator('#restore').click();
 await expect.poll(()=>savedSource(page)).toBe(source);
});

test('legacy saved example text recovers its filename without discarding edits',async({page,request})=>{
 const source=await(await request.get('/execution.tower')).text();
 await page.addInitScript(source=>{localStorage.removeItem('tower-playground-document-v1');localStorage.removeItem('tower-project-migrated-v1');localStorage.setItem('tower-playground-source-v1',source);},source);
 await page.reload();
 await expect(page.locator('#execution-output')).toHaveText('15\n16\n');
 await expect(page.locator('#filename')).toHaveText('execution.tower');
});

test('timings follow pipeline order and label current-run cached loads; controls share gaps',async({page},info)=>{
 await edit(page,'print(42);');await expect(page.locator('#execution-status')).toContainText('backends match');
 const first=await page.locator('#timings [data-label="LLVM load"]').textContent();
 await edit(page,'print(43);');await expect(page.locator('#llvm-output')).toHaveText('43\n');
 await expect(page.locator('#execution-status')).toContainText('backends match');
 for(const name of ['Tower load','LLVM load']){
  const timing=page.locator(`#timings [data-label="${name}"]`);
  await expect(timing).toContainText('(cached)');
  expect(Number((await timing.textContent()).match(/([\d.]+) ms/)[1])).toBeLessThan(20);
 }
 // Preloading means even the first run can be cached. Two current measurements
 // can both round to 0.0 ms; do not require different display strings.
 expect(first).toContain('(cached)');
 const labels=await page.locator('#timings span').evaluateAll(items=>items.map(item=>item.dataset.label));
 expect(labels).toEqual(['Tower load','Tower compile','Instructions','Graph run','Fast prepare','Bytecode package','Fast run','LLVM load','LLVM parse','LLVM raw','LLVM optimize','LLVM emit','Link','LLVM disassembly','LLVM compile total','LLVM run']);
 const gaps=await page.locator('.execution-controls,.file-controls,.export-controls').evaluateAll(items=>items.map(item=>getComputedStyle(item).columnGap));
 expect(gaps).toEqual(['8px','8px','8px']);
 await page.screenshot({path:`../build/timings-controls-${info.project.name}.png`});
 if(info.project.name==='mobile'){
  await page.setViewportSize({width:320,height:568});
  expect(await page.locator('.execution-controls,.file-controls,.export-controls').evaluateAll(items=>items.map(item=>getComputedStyle(item).columnGap))).toEqual(['8px','8px','8px']);
 }
});
