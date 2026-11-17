// Profile real edits, highlighting and both runners. Start the static server first.
import {chromium, devices} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const url=process.env.TOWER_PROFILE_URL || 'http://127.0.0.1:4173/';
const report={url,at:new Date().toISOString(),units:'milliseconds',profiles:[]};
const program=n=>`var value: i32 = ${n};\nprint(value);`;
const browser=await chromium.launch();
try {
 for(const [name,options] of [['desktop',{viewport:{width:1440,height:1000}}],['mobile',{...devices['Pixel 7']}]]) {
  const context=await browser.newContext(options),page=await context.newPage();
  await context.addInitScript(source=>{
   localStorage.setItem('tower-playground-source-v1',source);
   const p=window.__performanceProbe={workers:[],runs:[],current:null};
   const WorkerBase=window.Worker;
   window.Worker=class extends WorkerBase {
    constructor(...args){super(...args);p.workers.push(String(args[0]));this.addEventListener('message',({data})=>{if(p.current&&data.timings)p.current[data.backend]={...data.timings};});}
   };
   window.addEventListener('DOMContentLoaded',()=>{
    p.current={start:0,domReady:performance.now(),kind:'cold',expected:'1\n'};
    new MutationObserver(()=>{
     const r=p.current;if(!r)return;
     const status=document.querySelector('#status')?.textContent || '';
     if(status.startsWith('Updating')||status.startsWith('Tower is parsing'))r.sawBusy=true;
     if(r.sawBusy&&r.highlight===undefined&&status.startsWith('Complete'))r.highlight=performance.now()-r.start;
     if(r.sawBusy&&r.instructions===undefined&&document.querySelector('#core-instructions')?.textContent)r.instructions=performance.now()-r.start;
     if(document.querySelector('#execution-status')?.textContent.includes('backends match')&&document.querySelector('#execution-output')?.textContent===r.expected){r.total=performance.now()-r.start;p.runs.push(r);p.current=null;}
    }).observe(document.body,{subtree:true,childList:true,characterData:true});
   });
  },program(1));
  await page.goto(url);await page.waitForFunction(()=>window.__performanceProbe.runs.length===1,null,{timeout:60000});
  let count=1;
  for(const [file,expected] of [['execution.tower','15\n16\n'],['functions.tower','720\n721\n'],['memory.tower','5\n84\n42\n']]) {
   await page.evaluate(({file,expected})=>{window.__performanceProbe.current={start:performance.now(),kind:'open',file,expected};},{file,expected});
   await page.locator('#example-kind').selectOption(file);
   await page.waitForFunction(count=>window.__performanceProbe.runs.length===count,++count,{timeout:60000});
  }
  for(let i=2;i<=6;i++){
   await page.locator('#editor').click({position:{x:80,y:20}});
   await page.getByRole('textbox',{name:'Tower source'}).press('ControlOrMeta+a');
   await page.evaluate(i=>{window.__performanceProbe.current={start:performance.now(),kind:'edit',expected:i+'\n'};},i);
   await page.keyboard.insertText(program(i));
   await page.waitForFunction(count=>window.__performanceProbe.runs.length===count,++count,{timeout:60000});
  }
  await page.locator('#auto-execute').uncheck();
  const typing=[];
  for(const fixture of ['memory.tower','foundation.tower']){
   await page.locator('#example-kind').selectOption(fixture);
   await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Complete'));
   await page.locator('#editor').click({position:{x:80,y:20}});
   await page.getByRole('textbox',{name:'Tower source'}).press('ControlOrMeta+End');
   await page.keyboard.insertText('\n// profile ');
   await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Complete'));
   for(let i=0;i<8;i++){
    await page.evaluate(()=>{window.__performanceProbe.current={start:performance.now(),kind:'typing'};});
    await page.keyboard.insertText(String.fromCharCode(97+i));
    await page.waitForFunction(()=>window.__performanceProbe.current?.highlight!==undefined);
    typing.push({fixture,...await page.evaluate(()=>{const r=window.__performanceProbe.current;window.__performanceProbe.current=null;return r;})});
   }
  }
  const measured=await page.evaluate(()=>window.__performanceProbe);
  report.profiles.push({name,...measured,typing});console.log(name,JSON.stringify(measured.runs.map(({kind,file,total,highlight,instructions,interpreter,llvm})=>({kind,file,total,highlight,instructions,interpreter,llvm}))));
  await context.close();
 }
}finally{await browser.close();}
await writeFile(process.argv[2]||'../build/execution-profile.json',JSON.stringify(report,null,2)+'\n');
