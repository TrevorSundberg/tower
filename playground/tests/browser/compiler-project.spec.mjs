import {test, expect} from '@playwright/test';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {savedProject} from './project-helpers.mjs';
import {outputText} from './output-text.mjs';
async function edit(page,text) {
  const editor = page.getByRole('textbox',{name:'Tower source'});
  await page.locator('#editor').click({position:{x:80,y:20}});
  await editor.press('ControlOrMeta+a'); await page.keyboard.insertText(text);
}
async function hoverValue(page) {
  const position=await page.getByRole('textbox',{name:'Tower source'}).evaluate(editor=>{
    const walker=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT);let node;
    while(walker.nextNode())if(walker.currentNode.textContent.includes('value'))node=walker.currentNode;
    const at=node.textContent.lastIndexOf('value'),range=document.createRange();
    range.setStart(node,at);range.setEnd(node,at+5);const box=range.getBoundingClientRect();
    return {x:box.x+box.width/2,y:box.y+box.height/2};
  });
  await page.mouse.move(position.x,position.y);
}
test('compiler sources, migration comments, cancellation and persistence are available',async({page},info) => {
  // The compiler-project parse assertion allows 65 seconds before the remaining
  // cancellation/persistence checks; it must fit inside the whole-test budget.
  test.setTimeout(120000);
  await page.goto('/'); await expect(page.locator('#status')).toContainText('Complete');
  await page.locator('#project-kind').selectOption('tower:compiler');
  await expect(page.locator('#compiler-controls')).toBeVisible();
  await expect(page.locator('#filename')).toHaveText('units/compiler_parser_nodes.tower');
  await expect(page.getByRole('textbox',{name:'Tower source'})).toContainText('import tower resolves the project file tower.tower');
  await expect(page.locator('button[data-path="tower.tower"]')).toBeVisible();
  await expect(page.locator('button[data-path=".tower/tower.tower"]')).toHaveCount(0);
  await expect(page.locator('#file-tree')).toContainText('frontend_modules.tower');
  await expect(page.locator('#status')).toContainText('Complete',{timeout:65000});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator('#file-tree').evaluate(el=>el.clientHeight)).toBeGreaterThan(40);
  await page.locator('button[data-path="units/compiler_parser_nodes.tower"]').click();
  await page.screenshot({path:'../build/compiler-workbench/workbench-'+info.project.name+'.png'});
  await page.locator('#rebuild-compiler').click();
  await expect(page.locator('#cancel-compiler-build')).toBeEnabled();
  await expect(page.locator('#compiler-build-status')).toContainText('Compiling',{timeout:30000});
  // Cancelling the coordinator must also stop its nested compiler workers.
  const cdp = await page.context().newCDPSession(page);
  const {targetInfo} = await cdp.send('Target.getTargetInfo');
  const buildWorkers = async () => (await cdp.send('Target.getTargets')).targetInfos.filter(target =>
    target.browserContextId === targetInfo.browserContextId && target.type === 'worker' && target.url.endsWith('/compiler-build-worker.js')).length;
  await expect.poll(buildWorkers).toBeGreaterThan(1);
  await page.locator('#cancel-compiler-build').click();
  await expect(page.locator('#compiler-build-status')).toHaveText('Compiler build cancelled');
  await expect.poll(buildWorkers).toBe(0);
  await cdp.detach();
  await expect(page.locator('#active-compiler')).toHaveText('Original compiler');
  await page.locator('#auto-rebuild-compiler').uncheck();
  const project = await savedProject(page);
  const file = project.files.find(f=>f.path===project.active);
  await edit(page,'// saved browser edit\n'+file.text);
  await expect(page.locator('#project-storage')).toHaveText('Saved in browser');
  await page.reload();
  await expect(page.getByRole('textbox',{name:'Tower source'})).toContainText('saved browser edit');
  await expect(page.locator('#active-compiler')).toHaveText('Original compiler');
  await page.locator('#auto-rebuild-compiler').uncheck();
  await page.locator('#restore').click();
  await expect(page.getByRole('textbox',{name:'Tower source'})).not.toContainText('saved browser edit');
});

test('browser rebuild activates edited compiler behavior and reset recovers the original',async({page},info) => {
  test.skip(info.project.name !== 'desktop','Full successor builds also run through the portable host test; mobile checks UI/cancellation.');
  test.setTimeout(600000);
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/'); await expect(page.locator('#status')).toContainText('Complete');
  await page.locator('#project-kind').selectOption('tower:compiler');
  await page.locator('#auto-rebuild-compiler').uncheck();
  await page.locator('details[data-path="compiler"] > summary').click();
  const valuesPath = 'compiler/semantic_values.tower';
  await page.locator(`button[data-path="${valuesPath}"]`).click();
  const editDiagnostic = text => text.replace('null requires a pointer or function type','Workbench says: null requires a pointer or function type');
  const root = new URL('../../../',import.meta.url);
  const recipeDir = process.env.TOWER_TEST_COMPILER_PROJECT || 'playground/dist/compiler';
  const recipeFile = new URL(`${recipeDir.replace(/\/$/, '')}/project.json`, root);
  const recipe = JSON.parse(await readFile(recipeFile, 'utf8'));
  const expected = recipe.files.map(({path,text}) => ({path,text:path === valuesPath ? editDiagnostic(text) : text}));
  const project = await savedProject(page);
  await edit(page,editDiagnostic(project.files.find(f=>f.path===valuesPath).text));
  // Observe only the next rebuild coordinator. Its ownership handshake and
  // transfer list pass through the same native postMessage as the build.
  await page.evaluate(() => {
    const RealWorker = window.Worker;
    window.Worker = class extends RealWorker {
      constructor(url, options) {
        super(url, options);
        if (new URL(url, document.baseURI).href !== new URL('./compiler-build-worker.js', document.baseURI).href) return;
        window.Worker = RealWorker;
        const post = this.postMessage.bind(this);
        this.postMessage = (message, ...args) => {
          post(message, ...args);
          if (Array.isArray(message?.files)) {
            window.postedCompilerFiles = message.files.map(({path,text}) => ({path,text}));
            delete this.postMessage;
          }
        };
      }
    };
  });
  await page.locator('#auto-rebuild-compiler').check();
  const submission = await page.waitForFunction(() => window.postedCompilerFiles, null, {timeout:30000});
  const actual = await submission.jsonValue();
  const digest = files => createHash('sha256').update(JSON.stringify(files)).digest('hex');
  const summary = files => ({paths:files.length, sha256:digest(files)});
  const receipt = {expected:summary(expected), actual:summary(actual)};
  if (receipt.expected.sha256 !== receipt.actual.sha256) {
    const index = expected.findIndex((f,i) => f.path !== actual[i]?.path || f.text !== actual[i]?.text);
    const at = index === -1 ? expected.length : index;
    receipt.firstDifference = {index:at, expectedPath:expected[at]?.path, actualPath:actual[at]?.path,
      field:expected[at]?.path === actual[at]?.path ? 'text' : 'path'};
  }
  await info.attach('compiler-build-submission',{body:JSON.stringify(receipt),contentType:'application/json'});
  expect(receipt.actual, `Posted compiler sources: ${JSON.stringify(receipt)}`).toEqual(receipt.expected);
  await expect(page.locator('#compiler-build-status')).toContainText(/generation 1 active|Build failed:/,{timeout:540000});
  await expect(page.locator('#compiler-build-status')).toContainText('generation 1 active');
  await expect(page.locator('#active-compiler')).toHaveText('Compiler generation 1');
  await page.locator('#project-kind').selectOption('example:execution');
  await page.locator('#auto-execute').uncheck();
  await edit(page,'import tower; var value:i32 = 42; print(value);');await hoverValue(page);
  await expect(page.locator('.tw-hover-signature')).toHaveText('var value: i32');
  await edit(page,'import tower;\n// rebuilt C note\nprint(42);');
  await page.locator('#build-targets summary').click();
  await page.locator('#target-c').check();
  await page.locator('#build-targets summary').click();
  await page.locator('#execute').click();
  await expect(page.locator('#c-download')).toHaveAttribute('href',/^blob:/,{timeout:60000});
  await expect.poll(()=>outputText(page,'c-disassembly')).toContain('rebuilt C note');
  await expect(page.locator('#execution-status')).toContainText('backends match');
  await page.locator('#build-targets summary').click();
  await page.locator('#target-c').uncheck();
  await page.locator('#build-targets summary').click();
  await edit(page,'import tower; var value: i32 = null;'); await page.locator('#execute').click();
  await expect(page.locator('#execution-error')).toContainText('Workbench says: null requires a pointer or function type');
  await page.locator('#project-kind').selectOption('tower:compiler');
  await page.locator('#auto-rebuild-compiler').uncheck();
  expect((await savedProject(page)).files.find(f=>f.path==='compiler/semantic_values.tower').text).toContain('Workbench says');
  await page.locator('details[data-path="units"] > summary').click();
  await page.locator('button[data-path="units/compiler_interpreter.tower"]').click();
  await edit(page,'import missing_compiler_source;');
  await page.locator('#rebuild-compiler').click();
  await expect(page.locator('#compiler-build-status')).toContainText('Build failed:',{timeout:30000});
  await expect(page.locator('#active-compiler')).toHaveText('Compiler generation 1');
  await page.locator('#reset-compiler').click();
  await expect(page.locator('#active-compiler')).toHaveText('Original compiler');
  await expect(page.getByRole('textbox',{name:'Tower source'})).toContainText('missing_compiler_source');
  await page.locator('#project-kind').selectOption('example:execution');
  await page.locator('#execute').click();
  await expect(page.locator('#execution-error')).toContainText('null requires a pointer or function type');
  await expect(page.locator('#execution-error')).not.toContainText('Workbench says');
  await edit(page,'import tower; var value:bool = true; print(value);');await hoverValue(page);
  await expect(page.locator('.tw-hover-signature')).toHaveText('var value: bool');
  expect(errors).toEqual([]);
});

test('editable compiler reuses a converged object set and rejects a new shadowing import',async({page},info) => {
  test.skip(info.project.name !== 'desktop','Full compiler generation runs on desktop.');
  test.setTimeout(1200000);
  await page.goto('/');
  await expect(page.locator('#status')).toContainText('Complete');
  const receipt = await page.evaluate(async () => {
    const recipe = await fetch('./compiler/project.json').then(r => r.json());
    const build = async (request,retained) => {
      const worker = new Worker('./compiler-build-worker.js',{type:'module'});
      try {
        const reply = new Promise((resolve,reject) => {
          worker.onerror = event => reject(new Error(event.message));
          worker.onmessageerror = () => reject(new Error('Cannot read compiler Build reply'));
          worker.onmessage = ({data}) => { if (data.id === 1 && !data.phase) resolve(data); };
        });
        const buffers = retained?.objects.map(o => o.buffer) ?? [];
        worker.postMessage({id:1,files:recipe.files,...request,retained},buffers);
        if (buffers.some(b => b.byteLength)) throw new Error('Build did not take object ownership');
        return await reply;
      } finally { worker.terminate(); }
    };
    // Older direct callers omit the selection to request the shipped compiler.
    const cold = await build({});
    if (cold.error) throw new Error(cold.error);
    const stockLLVM = cold.packagedGeneratorHash;
    const successor = (result,revision) => ({compiler:{...result.modules,revision},stockLLVM});
    let result = await build(successor(cold,1));
    if (result.error) throw new Error(result.error);
    const misses = result.stats.timings.length;
    const warm = [];
    for (const revision of [2,3]) {
      if (!result.retained) throw new Error('Missing converged compiler objects');
      result = await build(successor(result,revision),result.retained);
      if (result.error) throw new Error(result.error);
      warm.push({hits:result.stats.objectHits,compiles:result.stats.timings.length,hashes:result.hashes});
    }
    const shadow = {path:'units/tower.tower',text:'import missing_shadow_dependency;'};
    const failed = await build({...successor(result,4),files:[...recipe.files,shadow]},result.retained);
    return {units:recipe.units.length,stockLLVM,hashes:cold.hashes,misses,warm,
      error:failed.error,published:!!(failed.retained || failed.modules)};
  });
  expect(receipt.stockLLVM).toBe(receipt.hashes.llvm);
  expect(receipt.misses).toBe(receipt.units);
  for (const generation of receipt.warm) {
    expect(generation).toEqual({hits:receipt.units,compiles:0,hashes:receipt.hashes});
  }
  expect(receipt.error).toContain('missing_shadow_dependency');
  expect(receipt.published).toBe(false);
});
