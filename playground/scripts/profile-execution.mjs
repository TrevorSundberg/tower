// Browser/worker transport probe. All workloads use existing Tower sources.
// Run without concurrent builds/tests; CPU sampling is a separate experiment.
import {chromium, devices} from '@playwright/test';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {selectDocument} from '../tests/browser/project-helpers.mjs';

// Node inspector and ABI transport for isolated compiler CPU samples. Timing
// results from this mode include sampling overhead; use browser mode for latency.
if (process.env.TOWER_PROFILE_REACTOR) {
  const {Session} = await import('node:inspector');
  const {loadTower,runToEnd} = await import('../src/tower-host.mjs');
  const reactor = await readFile(process.env.TOWER_PROFILE_REACTOR);
  const assets = resolve(process.env.TOWER_PROFILE_ASSETS ?? fileURLToPath(new URL('../dist/',import.meta.url)));
  const builtins = Object.fromEntries(await Promise.all(['bedrock','foundation','tower'].map(async name =>
    [name,await readFile(join(assets,name+'.tower'),'utf8')])));
  const sourceName = process.env.TOWER_PROFILE_SOURCE ?? 'functions.tower';
  const source = await readFile(join(assets,sourceName),'utf8');
  const samplingPhase = process.env.TOWER_PROFILE_CPU_PHASE ?? 'all';
  if (!['all','warm'].includes(samplingPhase)) throw new Error('CPU phase must be all or warm');
  const session = new Session(); session.connect();
  const post = (method,params={}) => new Promise((resolve,reject) =>
    session.post(method,params,(error,result)=>error?reject(error):resolve(result)));
  const phases = [];
  let tower, parser;
  try {
    await post('Profiler.enable');
    if (samplingPhase === 'all') await post('Profiler.start');
    let at = performance.now();
    tower = await loadTower(reactor,undefined,builtins.foundation,undefined,builtins.bedrock,{tower:builtins.tower});
    phases.push({phase:'initialize',ms:performance.now()-at});
    for (const phase of ['cold','warm']) {
      if (samplingPhase === 'warm' && phase === 'warm') await post('Profiler.start');
      at = performance.now();
      tower.configureModules({entry:sourceName,files:[{path:sourceName,text:source}],builtins,replaceBuiltins:true});
      phases.push({phase:phase+' configure',ms:performance.now()-at});
      at = performance.now();
      if (parser) tower.reset(parser,source);
      else parser = tower.create(source);
      const parsed = runToEnd(tower,parser);
      phases.push({phase:phase+' parse',ms:performance.now()-at,status:parsed.end.status});
      at = performance.now(); tower.inspect(parser);
      phases.push({phase:phase+' inspect',ms:performance.now()-at});
      at = performance.now(); const execution = tower.compile(source);
      phases.push({phase:phase+' compile',ms:performance.now()-at});
      at = performance.now(); tower.foundation(execution);
      phases.push({phase:phase+' foundation',ms:performance.now()-at});
      at = performance.now(); const result = tower.execute(execution,10000);
      phases.push({phase:phase+' graph',ms:performance.now()-at,status:result.status,output:result.output});
      tower.destroyExecution(execution);
    }
    const {profile} = await post('Profiler.stop');
    const destination = process.argv[2] || '../build/execution-cpu.json';
    await writeFile(destination+'.cpuprofile',JSON.stringify(profile));
    await writeFile(destination,JSON.stringify({reactor:process.env.TOWER_PROFILE_REACTOR,
      reactorHash:createHash('sha256').update(reactor).digest('hex'),assets,sourceName,phases,sampling:true,samplingPhase,
      measurement:'Retained parser reset; compile follows parsing in the same instance. Threaded profiles sample the coordinator only.'},null,2)+'\n');
    console.log(JSON.stringify(phases,null,2));
  } finally {if (parser) tower.destroy(parser); tower?.close(); session.disconnect();}
  process.exit();
}

const url = process.env.TOWER_PROFILE_URL || 'http://127.0.0.1:4173/';
const destination = process.argv[2] || '../build/execution-profile.json';
const source = await fetch(new URL('functions.tower',url)).then(response=>{
  if (!response.ok) throw new Error('Cannot load the served profiling workload');
  return response.text();
});
const timeout = Number(process.env.TOWER_PROFILE_TIMEOUT ?? 180000);
const repeats = Number(process.env.TOWER_PROFILE_REPEATS ?? 3);
const report = {url, at:new Date().toISOString(), units:'milliseconds', profiles:[],
  browserCpuSampling:!!process.env.TOWER_PROFILE_BROWSER_CPU,
  measurement:'Browser action to DOM result; frame markers are animation callbacks, not physical display latency.'};
report.manifest = await fetch(new URL('deployment-manifest.json',url)).then(response=>response.json());
let browser;
try {
  for (const [name, options] of [['desktop',{viewport:{width:1440,height:1000}}], ['mobile',devices['Pixel 7']]]) {
    if (process.env.TOWER_PROFILE_DEVICE && name !== process.env.TOWER_PROFILE_DEVICE) continue;
    // A new context alone can inherit process-level Wasm compilation caches.
    browser = await chromium.launch();
    report.browserVersion = browser.version();
    const context = await browser.newContext(options), page = await context.newPage();
    page.setDefaultTimeout(timeout);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await context.addInitScript(source => {
      localStorage.setItem('tower-playground-source-v1',source);
      const navigationKey = 'tower-latency-navigation';
      const firstNavigation = Number(sessionStorage.getItem(navigationKey) ?? performance.timeOrigin);
      sessionStorage.setItem(navigationKey,String(firstNavigation));
      const p = window.__performanceProbe = {workers:[], messages:[], runs:[], current:null};
      const WorkerBase = window.Worker;
      window.Worker = class extends WorkerBase {
        constructor(...args) {
          super(...args);
          this.probe = {id:p.workers.length, url:String(args[0]), start:performance.now()};
          p.workers.push(this.probe);
          this.addEventListener('message', ({data}) => {
            const at = performance.now();
            p.messages.push({worker:this.probe.id, at, direction:'receive', id:data.id,
              backend:data.backend ?? data.target, phase:data.phase, timings:data.timings, error:data.error,
              status:data.result?.status ?? data.result?.end?.status, parse:data.result?.ms,
              foundation:data.foundation !== undefined, warm:data.warm});
            const r = p.current;
            if (!r) return;
            if (data.timings) r[data.backend ?? data.target ?? 'native'] = {...data.timings};
            if (data.result?.ms !== undefined) r.parse = data.result.ms;
            if (data.foundation !== undefined && r.foundationMessage === undefined) r.foundationMessage = at-r.start;
          });
        }
        postMessage(data,...args) {
          p.messages.push({worker:this.probe.id, at:performance.now(), direction:'send',
            id:data.id, backend:data.backend, method:data.method, command:data.command});
          return super.postMessage(data,...args);
        }
        terminate() { this.probe.terminated = performance.now(); return super.terminate(); }
      };
      window.addEventListener('DOMContentLoaded', () => {
        p.current = {start:firstNavigation-performance.timeOrigin, domReady:performance.now(), kind:'cold', expected:'720\n721\n'};
        new MutationObserver(mutations => {
          const r = p.current;
          if (!r) return;
          const status = document.querySelector('#status')?.textContent || '';
          if (/^(Updating|Tower is parsing)/.test(status)) r.sawBusy = true;
          if (r.highlight === undefined && r.sawBusy && status.startsWith('Complete')) {
            r.highlight = performance.now()-r.start;
            requestAnimationFrame(() => {r.highlightFrame = performance.now()-r.start;});
          }
          const instructions = document.querySelector('#core-instructions');
          if (r.foundationMessage !== undefined && r.instructions === undefined && instructions?.textContent) {
            r.instructions = performance.now()-r.start;
            requestAnimationFrame(() => {r.instructionsFrame = performance.now()-r.start;});
          }
          for (const [key,id] of [['graphResult','execution-output'],['fastResult','fast-output'],['wasmResult','llvm-output']]) {
            const element = document.getElementById(id);
            if (r[key] === undefined && r.foundationMessage !== undefined && element?.textContent === r.expected &&
                mutations.some(m => element.contains(m.target))) r[key] = performance.now()-r.start;
          }
          const done = r.kind === 'typing' ? r.highlight !== undefined :
            document.querySelector('#execution-status')?.textContent.startsWith('Finished') &&
            !document.querySelector('#execute')?.disabled && r.foundationMessage !== undefined &&
            document.querySelector('#execution-output')?.textContent === r.expected;
          if (done) {r.total=performance.now()-r.start; p.runs.push(r); p.current=null;}
        }).observe(document.body,{subtree:true,childList:true,characterData:true});
      });
    }, source);
    let count = 0;
    const finish = async () => {
      try {await page.waitForFunction(count => window.__performanceProbe?.runs.length === count, ++count, {timeout});}
      catch (error) {
        report.failure = {name, error:error.message, state:await page.evaluate(() => ({
          probe:window.__performanceProbe, status:document.querySelector('#status')?.textContent,
          execution:document.querySelector('#execution-status')?.textContent,
          errors:[...document.querySelectorAll('.runner-error')].map(e=>e.textContent)}))};
        throw error;
      }
      console.log(name, JSON.stringify(await page.evaluate(() => window.__performanceProbe.runs.at(-1))));
    };
    const start = (kind, expected, extra={}) => page.evaluate(({kind,expected,extra}) => {
      window.__performanceProbe.current = {start:performance.now(),kind,expected,...extra};
    }, {kind,expected,extra});
    await page.goto(url); await finish();
    for (let i=0;i<repeats;i++) {
      await start('execute','720\n721\n'); await page.locator('#execute').click(); await finish();
    }
    for (let i=0;i<repeats;i++) {
      page.once('dialog',dialog=>dialog.accept('Latency '+i));
      await start('new-project','42\n'); await page.locator('#new-project').click(); await finish();
    }
    for (const [file,expected] of [['execution.tower','15\n16\n'],['functions.tower','720\n721\n'],['memory.tower','5\n84\n42\n']]) {
      await start('project',expected,{file}); await selectDocument(page,file); await finish();
    }
    const editor = page.getByRole('textbox',{name:'Tower source'});
    for (let i=0;i<repeats;i++) {
      await editor.press('ControlOrMeta+End');
      await start('edit','5\n84\n42\n'); await page.keyboard.insertText('\n// latency'); await finish();
    }
    await start('project','42\n22\n7\n',{file:'structs.tower'});
    await selectDocument(page,'structs.tower'); await finish();
    // Optional main-thread sampling is a separate diagnostic run, never part
    // of the uninstrumented before/after latency comparison.
    const cpu = process.env.TOWER_PROFILE_BROWSER_CPU ? await context.newCDPSession(page) : undefined;
    if (cpu) { await cpu.send('Profiler.enable'); await cpu.send('Profiler.start'); }
    for (let i=0;i<repeats;i++) {
      await editor.press('ControlOrMeta+Home');
      await page.locator('#editor .cm-line').filter({hasText:/^\s*pair\.first = (20|200);$/}).click();
      await editor.press('End'); await editor.press('ArrowLeft');
      await start('value-edit',i % 2 ? '42\n22\n7\n' : '222\n22\n7\n',{file:'structs.tower'});
      if (i % 2) await editor.press('Backspace'); else await page.keyboard.insertText('0');
      await finish();
    }
    if (cpu) {
      const {profile} = await cpu.send('Profiler.stop');
      await writeFile(destination + '.' + name + '.cpuprofile', JSON.stringify(profile));
      await cpu.detach();
    }
    await page.locator('#auto-execute').uncheck();
    for (let i=0;i<repeats;i++) {
      await editor.press('ControlOrMeta+End');
      await start('typing',undefined,{file:'structs.tower'}); await page.keyboard.insertText(' '); await finish();
    }
    const measured = await page.evaluate(() => ({...window.__performanceProbe,
      outputs:[...document.querySelectorAll('.code-output')].map(element=>({id:element.id,
        characters:element.querySelector('.cm-content')?.cmView?.rootView?.view.state.doc.length ?? 0,
        renderedLines:element.querySelectorAll('.cm-line').length})),
      isolated:crossOriginIsolated, resources:performance.getEntriesByType('resource').map(r=>r.toJSON()),
      measures:performance.getEntriesByType('measure').map(r=>r.toJSON())}));
    report.profiles.push({name,...measured,errors});
    await context.close();
    await browser.close(); browser = undefined;
    await writeFile(destination, JSON.stringify(report,null,2)+'\n');
  }
} finally {
  await writeFile(destination, JSON.stringify(report,null,2)+'\n');
  await browser?.close();
}
