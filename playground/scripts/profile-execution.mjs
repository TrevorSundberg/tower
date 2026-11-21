// Browser/worker transport probe. All workloads use existing Tower sources.
// Run without concurrent builds/tests; CPU sampling is a separate experiment.
import {chromium, devices} from '@playwright/test';
import {readFile, writeFile} from 'node:fs/promises';
import {selectDocument} from '../tests/browser/project-helpers.mjs';

// Node inspector and ABI transport for isolated compiler CPU samples. Timing
// results from this mode include sampling overhead; use browser mode for latency.
if (process.env.TOWER_PROFILE_REACTOR) {
  const {Session} = await import('node:inspector');
  const {loadTower,runToEnd} = await import('../src/tower-host.mjs');
  const reactor = await readFile(process.env.TOWER_PROFILE_REACTOR);
  const builtins = Object.fromEntries(await Promise.all(['bedrock','foundation','tower'].map(async name =>
    [name,await readFile(new URL('../../scaffolding/'+name+'.tower',import.meta.url),'utf8')])));
  const source = await readFile(new URL('../../scaffolding/examples/functions.tower',import.meta.url),'utf8');
  const session = new Session(); session.connect();
  const post = (method,params={}) => new Promise((resolve,reject) =>
    session.post(method,params,(error,result)=>error?reject(error):resolve(result)));
  const phases = [];
  let tower;
  try {
    await post('Profiler.enable'); await post('Profiler.start');
    let at = performance.now();
    tower = await loadTower(reactor,undefined,builtins.foundation,undefined,builtins.bedrock,{tower:builtins.tower});
    phases.push({phase:'initialize',ms:performance.now()-at});
    for (const phase of ['cold','warm']) {
      at = performance.now();
      tower.configureModules({entry:'functions.tower',files:[{path:'functions.tower',text:source}],builtins,replaceBuiltins:true});
      phases.push({phase:phase+' configure',ms:performance.now()-at});
      at = performance.now();
      const parser = tower.create(source), parsed = runToEnd(tower,parser);
      phases.push({phase:phase+' parse',ms:performance.now()-at,status:parsed.end.status});
      at = performance.now(); tower.inspect(parser);
      phases.push({phase:phase+' inspect',ms:performance.now()-at});
      tower.destroy(parser);
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
    await writeFile(destination,JSON.stringify({reactor:process.env.TOWER_PROFILE_REACTOR,phases,sampling:true},null,2)+'\n');
    console.log(JSON.stringify(phases,null,2));
  } finally {tower?.close(); session.disconnect();}
  process.exit();
}

const url = process.env.TOWER_PROFILE_URL || 'http://127.0.0.1:4173/';
const destination = process.argv[2] || '../build/execution-profile.json';
const source = await readFile(new URL('../../scaffolding/examples/functions.tower', import.meta.url), 'utf8');
const timeout = Number(process.env.TOWER_PROFILE_TIMEOUT ?? 180000);
const repeats = Number(process.env.TOWER_PROFILE_REPEATS ?? 3);
const report = {url, at:new Date().toISOString(), units:'milliseconds', profiles:[],
  measurement:'Browser action to DOM result; frame markers are animation callbacks, not physical display latency.'};
report.manifest = await fetch(new URL('deployment-manifest.json',url)).then(response=>response.json());
const browser = await chromium.launch();
try {
  for (const [name, options] of [['desktop',{viewport:{width:1440,height:1000}}], ['mobile',devices['Pixel 7']]]) {
    if (process.env.TOWER_PROFILE_DEVICE && name !== process.env.TOWER_PROFILE_DEVICE) continue;
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
    await page.locator('#auto-execute').uncheck();
    for (let i=0;i<repeats;i++) {
      await editor.press('ControlOrMeta+End');
      await start('typing'); await page.keyboard.insertText(' '); await finish();
    }
    const measured = await page.evaluate(() => ({...window.__performanceProbe,
      isolated:crossOriginIsolated, resources:performance.getEntriesByType('resource').map(r=>r.toJSON()),
      measures:performance.getEntriesByType('measure').map(r=>r.toJSON())}));
    report.profiles.push({name,...measured,errors});
    await context.close();
    await writeFile(destination, JSON.stringify(report,null,2)+'\n');
  }
} finally {
  await writeFile(destination, JSON.stringify(report,null,2)+'\n');
  await browser.close();
}
