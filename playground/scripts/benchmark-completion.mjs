import {chromium, devices} from '@playwright/test';
import {writeFile} from 'node:fs/promises';

// Measure a real key event through the worker and the visible popup. The final
// sample is a task after requestAnimationFrame, a conservative paint boundary,
// not a claim to measure the monitor's physical presentation time.
const url = process.argv[2] || 'http://127.0.0.1:4173/';
const browser = await chromium.launch();
const report = {url, profiles:[]};
const settled = process.argv.includes('--settled');
try {
  for (const [name, options] of [['desktop',{viewport:{width:1440,height:1000}}],['mobile',devices['Pixel 7']]]) {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    await page.addInitScript(() => {
      localStorage.setItem('tower-auto-execute-v1','false');
      localStorage.setItem('tower-build-targets-v3',JSON.stringify({wasm:false,interpreter:true,fast:false}));
      const post = Worker.prototype.postMessage;
      Worker.prototype.postMessage = function(data,...rest) {
        if (data.method === 'complete') {
          const record = {sent:performance.now(), id:data.id};
          window.completionRequests.push(record);
          const receive = event => {
            if (event.data.id !== data.id) return;
            record.received = performance.now(); this.removeEventListener('message',receive);
          };
          this.addEventListener('message',receive);
        }
        return post.call(this,data,...rest);
      };
      window.completionRequests = [];
    });
    await page.goto(url);
    await page.locator('#status').filter({hasText:'Complete'}).waitFor({timeout:10000});
    const editor = page.getByRole('textbox',{name:'Tower source'});
    await editor.click(); await editor.press('ControlOrMeta+a');
    await page.keyboard.insertText('struct Point { x:i32; y:i32; } var point:Point; point');
    await editor.press('Escape');
    await page.waitForTimeout(400);
    const samples = [];
    for (let i=0;i<20;i++) {
      if(settled) {
        // Different declarations on every sample rule out replaying an old
        // answer. Give speculative work a normal pause before the dot.
        await editor.press('ControlOrMeta+a');
        await page.keyboard.insertText(`struct Point { x${i}:i32; y${i}:i32; } var point:Point; point`);
        await editor.press('Escape'); await page.waitForTimeout(150);
      }
      await page.evaluate(() => {
        window.completionRequests.length=0;
        window.completionPaint = new Promise((resolve,reject) => {
          const timeout=setTimeout(()=>reject(Error('Completion popup did not render')),5000);
          const target=document.querySelector('#editor');
          let start;
          target.addEventListener('keydown',function key(event) {
            if(event.key!=='.')return;
            start=performance.now();target.removeEventListener('keydown',key,true);
          },true);
          const observer=new MutationObserver(() => {
            const popup=target.querySelector('.cm-tooltip-autocomplete');
            if(start===undefined || !popup?.querySelector('[role=option]'))return;
            const dom=performance.now(); observer.disconnect();clearTimeout(timeout);
            requestAnimationFrame(() => setTimeout(() => resolve({
              domMs:dom-start, paintMs:performance.now()-start,
              requests:window.completionRequests.map(r=>({startMs:r.sent-start,workerRoundTripMs:r.received-r.sent})),
              labels:[...popup.querySelectorAll('.cm-completionLabel')].map(el=>el.textContent),
              visible:popup.getBoundingClientRect().height>0,
            }),0));
          });
          observer.observe(target,{childList:true,subtree:true});
        });
      });
      await page.keyboard.press('.');
      const sample = await page.evaluate(() => window.completionPaint);
      if (!sample.visible || sample.labels.join(',')!==(settled?`x${i},y${i}`:'x,y')) throw Error(JSON.stringify(sample));
      samples.push(sample);
      await page.keyboard.press('Escape'); await page.keyboard.press('Backspace');
    }
    const warm=samples.slice(1).map(s=>s.paintMs).sort((a,b)=>a-b);
    const summary={name,settled,first:samples[0],medianMs:warm[Math.floor(warm.length/2)],p95Ms:warm[Math.floor(warm.length*.95)],samples};
    report.profiles.push(summary);
    console.log(name,JSON.stringify({firstMs:summary.first.paintMs,medianMs:summary.medianMs,p95Ms:summary.p95Ms}));
    await context.close();
  }
} finally { await browser.close(); }
if(process.argv[3])await writeFile(process.argv[3],JSON.stringify(report,null,2)+'\n');
