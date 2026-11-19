import {chromium,devices} from '@playwright/test';
import {writeFile} from 'node:fs/promises';

// A real mouse event through tooltip DOM insertion and a task after animation
// frame. This is a conservative browser paint boundary, not monitor timing.
const url=process.argv[2]||'http://127.0.0.1:4173/';
const browser=await chromium.launch(),report={url,profiles:[]};
try {
  for(const [name,options] of [['desktop',{viewport:{width:1440,height:1000}}],['mobile',devices['Pixel 7']]]) {
    const context=await browser.newContext(options),page=await context.newPage();
    await page.addInitScript(()=>{
      localStorage.setItem('tower-auto-execute-v1','false');
      localStorage.setItem('tower-build-targets-v3',JSON.stringify({wasm:false,interpreter:true,fast:false}));
      window.documentQueries=[];const post=Worker.prototype.postMessage;
      Worker.prototype.postMessage=function(data,...rest) {
        if(data.method==='document') {
          const query={source:data.source,sent:performance.now()};window.documentQueries.push(query);
          const receive=event=>{if(event.data.id===data.id){query.received=performance.now();this.removeEventListener('message',receive);}};
          this.addEventListener('message',receive);
        }
        return post.call(this,data,...rest);
      };
    });
    await page.goto(url);await page.locator('#status').filter({hasText:'Complete'}).waitFor();
    const editor=page.getByRole('textbox',{name:'Tower source'}),samples=[];
    for(let i=0;i<20;i++) {
      const source=`var value${i}:i32 = ${i};\nprint(value${i});`;
      await editor.click();await editor.press('ControlOrMeta+a');await page.keyboard.insertText(source);await editor.press('Escape');
      await page.mouse.move(0,0);
      await page.waitForFunction(source=>window.documentQueries.some(query=>query.source===source&&query.received),source);
      const position=await editor.evaluate((element,name)=>{
        const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);let match;
        while(walker.nextNode())if(walker.currentNode.textContent.includes(name))match=walker.currentNode;
        const range=document.createRange(),at=match.textContent.indexOf(name);range.setStart(match,at);range.setEnd(match,at+name.length);
        const box=range.getBoundingClientRect();return {x:box.x+box.width/2,y:box.y+box.height/2};
      },`value${i}`);
      await page.evaluate(()=>{
        window.hoverPaint=new Promise((resolve,reject)=>{
          const timeout=setTimeout(()=>reject(Error('Hover did not render')),5000),target=document.querySelector('#editor');
          const count=window.documentQueries.length;let start;
          target.addEventListener('mousemove',()=>{start=performance.now();},{once:true,capture:true});
          const observer=new MutationObserver(()=>{
            const tip=document.querySelector('.tw-language-hover');if(start===undefined||!tip)return;
            const dom=performance.now();observer.disconnect();clearTimeout(timeout);
            requestAnimationFrame(()=>setTimeout(()=>resolve({domMs:dom-start,paintMs:performance.now()-start,
              requests:window.documentQueries.length-count,signature:tip.querySelector('code').textContent,
              visible:tip.getBoundingClientRect().height>0}),0));
          });observer.observe(document.body,{childList:true,subtree:true});
        });
      });
      await page.mouse.move(position.x,position.y);const sample=await page.evaluate(()=>window.hoverPaint);
      if(!sample.visible||sample.signature!==`var value${i}: i32`||sample.requests)throw Error(JSON.stringify(sample));
      samples.push(sample);
    }
    const percentile=(key,p)=>samples.map(s=>s[key]).sort((a,b)=>a-b)[Math.min(samples.length-1,Math.floor(samples.length*p))];
    const summary={name,medianDomMs:percentile('domMs',.5),medianPaintMs:percentile('paintMs',.5),p95PaintMs:percentile('paintMs',.95)};
    console.log(JSON.stringify(summary));report.profiles.push({...summary,samples});await context.close();
  }
} finally {await browser.close();}
if(process.argv[3])await writeFile(process.argv[3],JSON.stringify(report,null,2)+'\n');
