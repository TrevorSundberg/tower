import { outputText } from './output-text.mjs';
import {selectDocument, savedSource, revealDiagnostics} from './project-helpers.mjs';
import {test,expect} from '@playwright/test';
async function edit(page,text){
 await page.locator('#editor').click({position:{x:80,y:20}});
 await page.getByRole('textbox',{name:'Tower source'}).press('ControlOrMeta+a');
 await page.keyboard.insertText(text);
}
test.beforeEach(async({page})=>{await page.goto('/');await expect(page.locator('#status')).toContainText('Complete');});

const badType = 'import tower;\nvar value: i32 = true;';
// Foundation's call statement has a required semicolon at this insertion point.
const missingSemicolon = 'import foundation;\nprint(42)\nvar answer: i32;';
const corrected = missingSemicolon.replace('print(42)', 'print(42);');
const typeDiagnostic = 'Expected i32, got bool; use an explicit conversion';
const semicolonDiagnostic = "Missing ';' before 'var'.";

async function showTypeError(page) {
 await edit(page, badType);
 await revealDiagnostics(page);
 await expect(page.locator('#execution-status')).toHaveText('Failed · backends match');
 await expect(page.locator('.tw-inline-error-message')).toHaveText(typeDiagnostic);
 await expect(page.locator('.tw-error-range')).toHaveText('true');
 await expect(page.locator('.tw-inline-error-heading')).toHaveText('Errorforeach.tower:2:18');
}

// Hold real inbound replies for this source and run ID. The frontend produces
// Foundation before the page dispatches the Fast and LLVM requests.
async function holdFrontendReplies(page, source) {
 await page.evaluate(source => {
  const post = Worker.prototype.postMessage;
  Worker.prototype.postMessage = function(request, ...args) {
   if (request.backend === 'interpreter' && request.files?.[0]?.text === source) {
    Worker.prototype.postMessage = post;
    const held = [];
    const receive = this.onmessage;
    this.onmessage = event => {
     if (event.data.id !== request.id) return receive.call(this, event);
     held.push(event);
     if (event.data.ready) window.releaseFrontend = () => {
      this.onmessage = receive;
      for (const reply of held) receive.call(this, reply);
     };
    };
   }
   return post.call(this, request, ...args);
  };
 }, source);
}

test('typing resets the quiet period and keeps errors until the replacement result',async({page})=>{
 await showTypeError(page);
 await page.clock.install();
 await page.clock.pauseAt(new Date(Date.now()+1000));
 // Analysis continues while typing. Only presentation of a new error waits
 // ten seconds from the last edit. The mapped previous error remains visible.
 await edit(page, missingSemicolon + ' //');
 await page.clock.fastForward(9000);
 await expect(page.locator('#status')).toContainText('Stopped');
 await page.keyboard.insertText('a');
 await page.clock.fastForward(9999);
 await expect(page.locator('#status')).toContainText('Stopped');
 await expect(page.locator('.tw-inline-error-message')).toContainText(typeDiagnostic);
 await page.clock.fastForward(1);
 await expect(page.locator('.tw-inline-error-message')).toContainText(semicolonDiagnostic);
 await page.clock.resume();
 await edit(page, corrected);
 await expect(page.locator('#execution-output')).toHaveText('42\n');
 await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
 await expect(page.locator('.tw-inline-error')).toHaveCount(0);
});

test('parse errors clear on successful analysis even while execution replies are held',async({page},info)=>{
 await edit(page, missingSemicolon);
 await revealDiagnostics(page);
 await expect(page.locator('.tw-inline-error-message')).toContainText(semicolonDiagnostic);
 await expect(page.locator('.tw-inline-error-heading')).toHaveText(`Error${await page.locator('#filename').innerText()}:2:10`);
 await expect(page.locator('.tw-error-point')).toHaveCount(1);
 await page.locator('#editor').screenshot({path:`../build/diagnostics-semicolon-${info.project.name}.png`});
 await holdFrontendReplies(page, corrected);
 await edit(page, corrected);
 await page.waitForFunction(() => !!window.releaseFrontend);
 await expect(page.locator('#status')).toContainText('Complete');
 await expect(page.locator('#execution-status')).toHaveText('Updating…');
 await expect(page.locator('.tw-inline-error')).toHaveCount(0);
 await page.evaluate(() => window.releaseFrontend());
 await expect(page.locator('#execution-output')).toHaveText('42\n');
 await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
});

test('old semantic errors clear after compilation while a new infinite loop is still running',async({page})=>{
 await showTypeError(page);
 const loop = 'import tower;\nprint(17); loop { }';
 await holdFrontendReplies(page, loop);
 await edit(page, loop);
 await page.waitForFunction(() => !!window.releaseFrontend);
 await expect(page.locator('#status')).toContainText('Complete');
 await expect(page.locator('.tw-inline-error-message')).toContainText(typeDiagnostic);
 await page.evaluate(() => window.releaseFrontend());
 try {
  await expect.poll(()=>outputText(page,'core-instructions')).toContain('loop {');
  await expect(page.locator('#execution-output')).toHaveText('17\n');
  await expect(page.locator('#execution-status')).toHaveText('Updating…');
  await expect(page.locator('.tw-inline-error')).toHaveCount(0);
 } finally {
  await page.locator('#cancel-execution').click();
 }
 await expect(page.locator('#execution-status')).toHaveText('Cancelled');
 await expect(page.locator('#execution-panel')).toHaveAttribute('aria-busy','false');
 await edit(page, corrected);
 await expect(page.locator('#execution-output')).toHaveText('42\n');
 await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
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
 await edit(page,'import tower; print(42);');
 await expect(page.locator('#llvm-output')).toHaveText('42\n');
 await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
 await expect(page.locator('#timings [data-label="LLVM load"]')).toContainText('(cached)');

 const next = 'import tower; print(43);';
 // Compare the display with the worker measurements for the 43 run. Reusing
 // a compiler can take any duration, including one that rounds to 0.0 ms.
 await page.evaluate(source => {
  window.currentLoads = {};
  const post = Worker.prototype.postMessage;
  Worker.prototype.postMessage = function(request, ...args) {
   if (request.files?.[0]?.text === source && ['interpreter','llvm'].includes(request.backend)) {
    const receive = ({data}) => {
     if (data.id !== request.id || data.result?.status !== 'done') return;
     this.removeEventListener('message', receive);
     const field = request.backend === 'llvm' ? 'llvmLoad' : 'load';
     window.currentLoads[request.backend] = {ms:data.timings[field], cached:data.timings[field+'Cached']};
    };
    this.addEventListener('message', receive);
   }
   return post.call(this, request, ...args);
  };
 }, next);
 await edit(page,next);
 await expect(page.locator('#llvm-output')).toHaveText('43\n');
 await expect(page.locator('#execution-status')).toHaveText('Finished · backends match');
 const loads = await page.evaluate(() => window.currentLoads);
 for (const [backend,label] of [['interpreter','Tower load'],['llvm','LLVM load']]) {
  expect(loads[backend].cached).toBe(true);
  expect(loads[backend].ms).toBeGreaterThanOrEqual(0);
  await expect(page.locator(`#timings [data-label="${label}"]`)).toHaveText(`${label} ${loads[backend].ms.toFixed(1)} ms (cached)`);
 }
 const labels=await page.locator('#timings span').evaluateAll(items=>items.map(item=>item.dataset.label));
 expect(labels).toEqual(['Tower load','Tower compile','Instructions','Graph run','Fast LLVM','Fast reconstruction','Fast prepare','Bytecode package','Fast run','LLVM load','LLVM parse','LLVM raw','LLVM optimize','LLVM emit','Link','LLVM disassembly','LLVM compile total','LLVM run']);
 await expect(page.locator('#timings')).toBeHidden();
 const editorBox=await page.locator('#editor').boundingBox();
 await page.locator('#timing-details > summary').click();
 await expect(page.locator('#timings')).toBeVisible();
 expect(await page.locator('#editor').boundingBox()).toEqual(editorBox);
 const gaps=await page.locator('.execution-controls,.file-controls,.export-controls').evaluateAll(items=>items.map(item=>getComputedStyle(item).columnGap));
 expect(gaps).toEqual(['8px','8px','8px']);
 await page.screenshot({path:`../build/timings-controls-${info.project.name}.png`});
 if(info.project.name==='mobile'){
  await page.setViewportSize({width:320,height:568});
  expect(await page.locator('.execution-controls,.file-controls,.export-controls').evaluateAll(items=>items.map(item=>getComputedStyle(item).columnGap))).toEqual(['8px','8px','8px']);
 }
});
