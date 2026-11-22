import {test, expect} from '@playwright/test';
import {mkdir, writeFile} from 'node:fs/promises';
import {selectDocument} from './project-helpers.mjs';

// Browser-only instrumentation: record compositor frames and layout through an
// actual keystroke. The program under test is the bundled Tower structs example.
for (const action of ['edit','recompile']) test(`a numeric ${action} keeps the editor and output viewport stable`, async ({page}, info) => {
  test.setTimeout(60000);
  if (info.project.name === 'desktop') await page.setViewportSize({width:1280,height:800});
  const capture = process.env.TOWER_UI_CAPTURE ?? 'ui_stability';
  const directory = `../build/${capture}${action === 'recompile' ? '_recompile' : ''}_${info.project.name}`;
  await mkdir(directory, {recursive:true});
  await page.goto(process.env.TOWER_UI_URL ?? '/');
  await selectDocument(page, 'structs.tower');
  await expect(page.locator('#execution-output')).toHaveText('42\n22\n7\n');
  await expect(page.locator('#execute')).toBeEnabled();
  await expect(page.locator('#execution-status')).toContainText('Finished');
  await expect(page.locator('#project-storage')).toHaveText('Saved in browser');
  const editor = page.getByRole('textbox', {name:'Tower source'});
  await editor.press('ControlOrMeta+Home');
  const line = page.locator('#editor .cm-line').filter({hasText:'first: 20, second: 22'});
  await line.click();
  await editor.press('Home');
  for (let at = 0; at < '    first: 20'.length; at++) await editor.press('ArrowRight');
  await page.locator('#core-instructions .cm-scroller').evaluate(element => {element.scrollTop = 100;});
  await page.screenshot({path:`${directory}/before.png`});
  const protocol = await page.context().newCDPSession(page);
  const writes = [], frames = [];
  const maxFrames = 180;
  protocol.on('Page.screencastFrame', event => {
    const index = frames.length;
    if (index < maxFrames) {
      frames.push(event.metadata);
      writes.push(writeFile(`${directory}/frame_${String(index).padStart(3,'0')}.jpg`,Buffer.from(event.data,'base64')));
    }
    void protocol.send('Page.screencastFrameAck',{sessionId:event.sessionId});
  });
  await protocol.send('Page.startScreencast',{format:'jpeg',quality:85,everyNthFrame:1});
  await page.evaluate(() => {
    const selectors = ['#editor','.workspace','#execution-panel','.statusbar','#timings',
      '#interpreter-column h2','#fast-column h2','#wasm-column h2',
      '#core-instructions .cm-scroller','#editor .cm-scroller'];
    const probe = window.uiStability = {start:performance.now(),samples:[],active:true};
    const sample = () => {
      const boxes = Object.fromEntries(selectors.map(selector => {
        const element = document.querySelector(selector), rect = element.getBoundingClientRect();
        return [selector,{x:rect.x,y:rect.y,width:rect.width,height:rect.height,
          scrollTop:element.scrollTop,scrollHeight:element.scrollHeight,clientHeight:element.clientHeight,
          scrollbar:element.scrollHeight>element.clientHeight}];
      }));
      const text = Object.fromEntries(['status','execution-status','project-storage','interpreter-phase','fast-phase','llvm-phase']
        .map(id => [id,document.getElementById(id)?.textContent]));
      probe.samples.push({ms:performance.now()-probe.start,boxes,text});
      if (probe.active) requestAnimationFrame(sample);
    };
    sample();
  });
  let samples;
  try {
    if (action === 'edit') await page.keyboard.insertText('0');
    else await page.locator('#execute').click();
    await expect(page.locator('#execution-output')).toHaveText(action === 'edit' ? '222\n22\n7\n' : '42\n22\n7\n');
    await expect(page.locator('#execute')).toBeEnabled();
    await expect(page.locator('#project-storage')).toHaveText('Saved in browser');
    await page.screenshot({path:`${directory}/after.png`});
  } finally {
    samples = await page.evaluate(() => {window.uiStability.active=false; return window.uiStability.samples;});
    await protocol.send('Page.stopScreencast');
    await protocol.detach();
    await Promise.all(writes);
    await writeFile(`${directory}/frames.json`,JSON.stringify({frames,samples},null,2)+'\n');
  }
  for (const selector of ['#editor','.workspace','#execution-panel','.statusbar',
    '#interpreter-column h2','#fast-column h2','#wasm-column h2']) {
    for (const dimension of ['x','y','width','height']) {
      const values=samples.map(sample=>sample.boxes[selector][dimension]);
      expect.soft(Math.max(...values)-Math.min(...values),`${selector} ${dimension}`).toBeLessThanOrEqual(1);
    }
  }
  const output = samples.map(sample=>sample.boxes['#core-instructions .cm-scroller']);
  expect.soft(output.every(box=>box.scrollbar),'output scrollbar remains present').toBe(true);
  expect.soft(Math.max(...output.map(box=>box.scrollTop))-Math.min(...output.map(box=>box.scrollTop)),
    'output scroll position survives the edit').toBeLessThanOrEqual(1);
  expect.soft(new Set(samples.map(sample=>sample.text['execution-status'])).size,
    'one pending status and one finished status').toBeLessThanOrEqual(2);
});
