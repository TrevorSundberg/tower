import assert from 'node:assert/strict';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {newProject} from '../src/projects.mjs';
import {exportProject} from '../src/project-archive.mjs';
import {targets} from '../src/targets.mjs';
import {selectDocument, savedProject, downloadedProject, revealDiagnostics} from '../tests/browser/project-helpers.mjs';
import {outputText} from '../tests/browser/output-text.mjs';
import {createHash} from 'node:crypto';
import {chromium, devices, expect} from '@playwright/test';

const base = new URL(process.argv[2] || 'http://127.0.0.1:4173/');
if (!base.pathname.endsWith('/')) throw new Error('Deployment URL must end in /');
const output = new URL('../../build/deployment-verification/', import.meta.url);
await mkdir(output, {recursive:true});
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const report = {url:base.href, assets:[], browsers:[]};
const manifest = JSON.parse(await readFile(new URL('../dist/deployment-manifest.json', import.meta.url), 'utf8'));
// .nojekyll is a hosting marker; GitHub Pages does not serve dotfiles.
const assets = ['deployment-manifest.json', ...Object.keys(manifest.assets).filter(name => name !== '.nojekyll')];
for (const name of assets) {
  const response = await fetch(new URL(name, base));
  assert.equal(response.status, 200, name);
  const remote = Buffer.from(await response.arrayBuffer());
  const local = await readFile(new URL('../dist/' + name, import.meta.url));
  if (name !== 'deployment-manifest.json') assert.equal(digest(local), manifest.assets[name], name + ' local manifest');
  assert.equal(digest(remote), digest(local), name + ' must match the tested local build');
  if (name.endsWith('.wasm')) assert.match(response.headers.get('content-type'), /application\/wasm/);
  report.assets.push({name,bytes:remote.length,sha256:digest(remote)});
}
console.log(`All ${assets.length} deployed assets match the local build.`);
const foundation = await readFile(new URL('../dist/foundation.tower', import.meta.url), 'utf8');
const bedrock = await readFile(new URL('../dist/bedrock.tower', import.meta.url), 'utf8');
const legacy = await readFile(new URL('../tests/fixtures/foundation_legacy.tower', import.meta.url), 'utf8');
const program = '// deployment C comment\nfn answer(): i32 { return state.value; }\nvar state: Later;\nstate.value = add(20, 22);\nvar result: i32 = answer();\nprint(result);\nstruct Later { value: i32; }\nfn add(a: i32, b: i32): i32 { var sum: i32 = a + b; return sum; }';
const browser = await chromium.launch();
try {
  for (const [name, options] of [
    ['desktop',{...devices['Desktop Chrome'],viewport:{width:1440,height:1000}}],
    ['mobile',{...devices['Pixel 7'],viewport:{width:393,height:851}}],
  ]) {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await context.addInitScript(({foundation,legacy,program}) => {
      if (localStorage.getItem('deployment-check')) return;
      localStorage.setItem('tower-playground-foundation-v1', legacy);
      localStorage.setItem('tower-playground-foundation-base-v1', foundation);
      localStorage.setItem('tower-playground-source-v1', program);
      localStorage.setItem('tower-build-targets-v3', JSON.stringify({wasm:true}));
      localStorage.setItem('deployment-check', '1');
    }, {foundation,legacy,program});
    await page.goto(base.href);
    await expect(page.locator('#execution-status')).toHaveText('Finished \u00b7 backends match',{timeout:60000});
    await expect(page.locator('#execution-output')).toHaveText('42\n');
    await expect(page.locator('#llvm-output')).toHaveText('42\n');
    await expect(page.locator('#fast-output')).toHaveText('42\n');
    await expect.poll(()=>outputText(page,'core-instructions')).toContain('fn answer');
    await page.locator('#build-targets summary').click();
    await expect(page.locator('#target-c')).not.toBeChecked();
    await page.locator('#optimize').uncheck();
    await page.locator('#target-c').check();
    await expect(page.locator('#c-download')).toHaveAttribute('href',/^blob:/,{timeout:60000});
    await expect.poll(()=>outputText(page,'c-disassembly')).toContain('deployment C comment');
    await expect(page.locator('#c-disassembly .tw-keyword').first()).toBeVisible();
    const paneOrder=await page.locator('.execution-column').evaluateAll(nodes=>nodes.map(node=>node.id));
    assert.equal(paneOrder.indexOf('c-column'),paneOrder.indexOf('llvm-optimized-column')+1);
    assert.equal(paneOrder.indexOf('roku-column'),paneOrder.indexOf('c-column')+1);
    assert.equal(paneOrder.indexOf('fast-disassembly-column'),paneOrder.indexOf('roku-column')+1);
    const cDownload=page.waitForEvent('download'); await page.locator('#c-download').click();
    const cArtifact=await cDownload, rawC=await readFile(await cArtifact.path(),'utf8');
    assert.match(rawC,/int main\(void\)/);
    assert.match(cArtifact.suggestedFilename(),/\.c$/);
    await writeFile(new URL(name+'-c-raw.c',output),rawC);
    await page.screenshot({path:new URL(name+'-c-source.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
    await page.locator('#build-targets summary').click();
    await page.locator('#optimize').check();
    // Clearing the old pane also differs from rawC. Wait for a complete new
    // result, including cold hosted worker/compiler loading, before downloading.
    await expect.poll(async()=>{
      const source=await outputText(page,'c-disassembly');
      return source.includes('int main(void)') && source!==rawC;
    },{timeout:60000}).toBe(true);
    await expect.poll(()=>outputText(page,'c-disassembly'),{timeout:60000}).toContain('deployment C comment');
    await expect(page.locator('#c-download')).toHaveAttribute('href',/^blob:/,{timeout:60000});
    const optimizedC=await page.locator('#c-download').evaluate(link=>fetch(link.href).then(response=>response.text()));
    assert.equal(optimizedC,await outputText(page,'c-disassembly'));
    await writeFile(new URL(name+'-c-optimized.c',output),optimizedC);
    await page.locator('#target-roku').check();
    await expect(page.locator('#roku-download')).toHaveAttribute('href',/^blob:/,{timeout:60000});
    const rokuSource=await page.locator('#roku-download').evaluate(link=>fetch(link.href).then(response=>response.text()));
    assert.match(rokuSource,/function TowerRun\(/);
    assert.match(rokuSource,/deployment C comment/);
    assert.match(rokuSource,/32-bit byte addresses/);
    await writeFile(new URL(name+'-roku.brs',output),rokuSource);
    await page.locator('#preserve-comments').uncheck();
    await expect.poll(async()=>{
      const source=await outputText(page,'c-disassembly');
      return source.includes('int main(void)') && !source.includes('deployment C comment');
    },{timeout:60000}).toBe(true);
    await expect(page.locator('#c-download')).toHaveAttribute('href',/^blob:/,{timeout:60000});
    assert.ok(!(await outputText(page,'c-disassembly')).includes('deployment C comment'));
    await expect.poll(async()=>{
      const source=await outputText(page,'roku-disassembly');
      return source.includes('function TowerRun(') && !source.includes('deployment C comment');
    },{timeout:60000}).toBe(true);
    await expect.poll(()=>outputText(page,'core-instructions')).not.toContain('deployment C comment');
    await page.locator('#preserve-comments').check();
    await page.locator('#target-c').uncheck();
    await page.locator('#target-roku').uncheck();
    await page.locator('#build-targets summary').click();
    await expect(page.locator('#execution-status')).toHaveText('Finished · backends match',{timeout:60000});
    await expect.poll(()=>outputText(page,'fast-disassembly')).toContain('label(');
    const bytecodeDownload = page.waitForEvent('download'); await page.locator('#fast-download').click();
    const bytecodeArtifact = await bytecodeDownload;
    assert.match(bytecodeArtifact.suggestedFilename(), /\.towerbc$/);
    const bytecodeBytes = await readFile(await bytecodeArtifact.path());
    assert.equal(bytecodeBytes.subarray(0,7).toString(),'TOWERBC');
    assert.equal(bytecodeBytes.readUInt32LE(8),1);
    assert.equal(bytecodeBytes.readUInt32LE(12),2);
    assert.equal(bytecodeBytes.readUInt32LE(16),2);
    assert.equal(bytecodeBytes.readUInt32LE(24),1);
    await expect.poll(()=>outputText(page,'llvm-before')).toContain('define');
    await expect.poll(()=>outputText(page,'llvm-after')).toContain('define');
    await page.screenshot({path:new URL(name+'-execution.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
    await expect(page.locator('#example-kind')).toHaveCount(0);
    await expect(page.locator('.builtin-badge')).toHaveCount(2);
    await expect(page.locator('.builtin-badge')).toHaveText(['library','library']);
    await selectDocument(page, 'foundation.tower');
    await expect(page.locator('#status')).toContainText('Complete');
    await expect(page.locator('#execution-panel')).toBeVisible();
    await expect.poll(()=>outputText(page,'core-instructions')).toBe('');
    await expect(page.getByRole('textbox',{name:'Tower source'})).not.toContainText('skip Whitespace');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button',{name:'Save',exact:true}).click();
    const saved = await downloadedProject(await downloadPromise);
    assert.equal(saved.builtins.foundation, foundation);
    assert.equal(await page.evaluate(()=>localStorage.getItem('tower-playground-foundation-v1')),legacy);
    await page.screenshot({path:new URL(name+'-foundation.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
    await selectDocument(page, 'bedrock.tower');
    await expect(page.locator('#status')).toContainText('Complete');
    await expect(page.locator('#execution-panel')).toBeVisible();
    await expect.poll(()=>outputText(page,'core-instructions')).toBe('');
    await expect(page.locator('#tree')).toContainText('Whitespace');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight),true);
    await page.locator('#editor').click({position:{x:80,y:20}});
    await page.getByRole('textbox',{name:'Tower source'}).press('ControlOrMeta+a');
    await page.keyboard.insertText(bedrock.replace('[A-Za-z_][A-Za-z0-9_]*', 'ffff[A-Za-z_][A-Za-z0-9_]*'));
    await revealDiagnostics(page);
    await expect(page.locator('#status')).toContainText('Stopped');
    await page.locator('#editor-error').click();
    await expect(page.locator('.tw-inline-error-message')).toContainText('No token rule matches source');
    await expect(page.locator('.has-bubble-outline')).toBeVisible();
    const badLine = bedrock.slice(0,bedrock.indexOf('token String')).split('\n').length;
    await expect(page.locator('.tw-inline-error-heading')).toHaveText(`Error${await page.locator('#filename').innerText()}:${badLine}:7`);
    await page.screenshot({path:new URL(name+'-bedrock-identifier.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
    await page.getByRole('button',{name:'Restore',exact:true}).click();
    await expect(page.locator('#status')).toContainText('Complete');
    await page.reload();
    await expect(page.locator('#filename')).toHaveText('bedrock.tower');
    await expect(page.locator('#status')).toContainText('Complete');
    await expect(page.locator('#execution-panel')).toBeVisible();
    assert.equal((await savedProject(page)).builtins.foundation,foundation);
    await selectDocument(page, 'foreach.tower');
    await expect(page.locator('#status')).toContainText('Complete');
    await expect(page.getByRole('button',{name:'Example',exact:true})).toHaveCount(0);
    await page.locator('#editor').click({position:{x:80,y:20}});
    await page.getByRole('textbox',{name:'Tower source'}).press('ControlOrMeta+a');
    await page.keyboard.insertText("parse Statement |= '';\n");
    await revealDiagnostics(page);
    await expect(page.locator('.tw-inline-error-message')).toHaveText('Token literal is empty. Expected at least one character between the quotes.');
    await expect(page.locator('.tw-error-range')).toHaveText("''");
    await page.screenshot({path:new URL(name+'-empty-literal.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
    await page.locator('#editor').click({position:{x:80,y:20}});
    await page.getByRole('textbox',{name:'Tower source'}).press('ControlOrMeta+a');
    await page.keyboard.insertText('print(42)\nvar answer: i32;');
    await revealDiagnostics(page);
    await expect(page.locator('.tw-inline-error-message')).toContainText("Missing ';' before 'var'.");
    await expect(page.locator('.tw-inline-error-message')).toContainText('foundation.tower:');
    await expect(page.locator('.tw-inline-error-heading')).toHaveText(`Error${await page.locator('#filename').innerText()}:1:10`);
    await expect(page.locator('.tw-error-point')).toHaveCount(1);
    await page.screenshot({path:new URL(name+'-missing-semicolon.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
    await page.getByRole('button',{name:'Restore',exact:true}).click();
    await expect(page.locator('#status')).toContainText('Complete');
    await expect(page.locator('.tw-inline-error')).toHaveCount(0);
    await page.locator('#editor').click({position:{x:80,y:20}});
    await page.getByRole('textbox',{name:'Tower source'}).press('ControlOrMeta+a');
    await page.keyboard.insertText('var alias: i32*;;');
    await revealDiagnostics(page);
    await expect(page.locator('.tw-inline-error-message')).toHaveText("Unexpected ';'. Expected a statement or grammar declaration.");
    await expect(page.locator('.tw-error-range')).toHaveText(';');
    await page.screenshot({path:new URL(name+'-extra-semicolon.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
    await selectDocument(page, 'increment.tower');
    await expect(page.locator('#execution-status')).toContainText('backends match',{timeout:60000});
    await expect(page.locator('#execution-output')).toHaveText('5\n6\n7\n7\n9\n');
    await expect(page.locator('#llvm-output')).toHaveText('5\n6\n7\n7\n9\n');
    await expect.poll(()=>outputText(page,'core-instructions')).toContain(' = &value;');
    await expect.poll(()=>outputText(page,'core-instructions')).toContain(' + 1;');
    await expect.poll(()=>outputText(page,'llvm-after')).not.toContain('post_increment');
    await expect(page.locator('.tw-inline-error')).toHaveCount(0);
    await page.screenshot({path:new URL(name+'-increment.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
    await selectDocument(page, 'inference.tower');
    await expect(page.locator('#execution-status')).toContainText('backends match',{timeout:60000});
    await expect(page.locator('#execution-output')).toHaveText('42\ntrue\n43\n42\n');
    await expect(page.locator('#llvm-output')).toHaveText('42\ntrue\n43\n42\n');
    await expect.poll(()=>outputText(page,'core-instructions')).toContain('var answer: i32 = ');
    await expect.poll(()=>outputText(page,'core-instructions')).toContain(' = add_one(41);');
    await expect.poll(()=>outputText(page,'core-instructions')).toContain('var pointer: i32* = ');
    await expect.poll(()=>outputText(page,'core-instructions')).toContain(' = &answer;');
    await page.screenshot({path:new URL(name+'-inference.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
    await selectDocument(page, 'templates.tower');
    await expect(page.locator('#execution-output')).toHaveText('20\n10\n',{timeout:60000});
    await expect(page.locator('#llvm-output')).toHaveText('20\n10\n',{timeout:60000});
    await expect(page.locator('#execution-status')).toContainText('backends match',{timeout:60000});
    await expect.poll(()=>outputText(page,'core-instructions')).toContain('struct `buffer(i32, 4)`');
    await page.screenshot({path:new URL(name+'-templates.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
    await selectDocument(page, 'execution.tower');
    await expect(page.locator('#execution-status')).toContainText('backends match',{timeout:60000});
    await page.reload();
    await expect(page.locator('#filename')).toHaveText('execution.tower');
    await expect(page.locator('#execution-output')).toHaveText('15\n16\n',{timeout:60000});
    await expect(page.locator('#execution-status')).toContainText('backends match',{timeout:60000});
    await selectDocument(page, 'memory.tower');
    await expect(page.locator('#execution-status')).toContainText('backends match',{timeout:60000});
    await page.locator('#execute').click();
    await expect(page.locator('#execution-status')).toContainText('backends match',{timeout:60000});
    for (const label of ['Tower load','LLVM load']) {
      const timing=page.locator(`#timings [data-label="${label}"]`);
      await expect(timing).toContainText('(cached)');
      assert.ok(Number((await timing.textContent()).match(/([\d.]+) ms/)[1])<20);
    }
    const project = newProject('Deployment project', {bedrock,foundation}, [
      {path:'main.tower',text:'import foundation; import lib.answer as left; import other.answer as right; import lib.answer as again; var total: i32 = left.answer() + right.answer(); print(total);'},
      {path:'lib/answer.tower',text:'import foundation; fn answer(): i32 { return 20; }'},
      {path:'other/answer.tower',text:'import foundation; fn answer(): i32 { return 22; }'},
      {path:'assets/notes.txt',text:'Project archive verification'},
    ]);
    await page.locator('#file').setInputFiles({name:'deployment.zip',mimeType:'application/zip',buffer:Buffer.from(await exportProject(project).arrayBuffer())});
    // Import hydrates asynchronously; the previous project's completed status
    // can remain visible until the new project starts compiling.
    await expect(page.locator('#project-kind option:checked')).toHaveText('Deployment project',{timeout:60000});
    await expect(page.locator('#execution-output')).toHaveText('42\n',{timeout:60000});
    await expect(page.locator('#execution-status')).toContainText('backends match',{timeout:60000});
    await expect(page.locator('#project-storage')).toHaveText('Saved in browser');
    await expect(page.locator('#editor .tw-identifier').filter({hasText:/^foundation$/})).toHaveCount(1);
    await expect(page.locator('#editor .tw-identifier').filter({hasText:/^lib$/})).toHaveCount(2);
    await expect(page.locator('#editor .tw-keyword').filter({hasText:/^as$/})).toHaveCount(3);
    await expect(page.locator('#editor .tw-keyword,#editor .tw-rule').filter({hasText:/^(foundation|lib|answer)$/})).toHaveCount(0);
    await page.reload();
    await expect(page.locator('#project-kind option:checked')).toHaveText('Deployment project');
    await expect(page.locator('#execution-status')).toContainText('backends match',{timeout:60000});
    assert.deepEqual((await savedProject(page)).files, project.files);
    const projectDownload = page.waitForEvent('download');
    await page.locator('#save').click();
    assert.deepEqual((await downloadedProject(await projectDownload)).files, project.files);
    await selectDocument(page,'memory.tower');
    await expect(page.locator('#execution-status')).toContainText('backends match',{timeout:60000});
    await page.locator('#auto-execute').uncheck();
    await page.locator('#build-targets summary').click();
    await page.locator('#target-wasm').uncheck();
    for (const key of Object.keys(targets).filter(key=>key!=='wasm')) await page.locator('#target-'+key).check();
    await page.locator('#build-targets summary').click();
    await page.locator('#auto-execute').check();
    await expect(page.locator('#mac-arm-downloads a')).toHaveCount(1,{timeout:120000});
    await expect(page.locator('#wasm-column')).toBeHidden();
    await expect(page.locator('#execution-output')).toHaveText('5\n84\n42\n');
    const widths=await page.locator('.execution-column:visible').evaluateAll(items=>items.map(x=>x.getBoundingClientRect().width));
    assert.ok(Math.max(...widths)-Math.min(...widths)<2);
    for(const [key,target] of Object.entries(targets).filter(([key])=>key!=='wasm')){
      await expect.poll(()=>outputText(page,key+'-disassembly')).toContain('ret');
      await expect(page.locator('#'+key+'-column h2')).toHaveText(target.label+' disassembly');
      await page.locator('#'+key+'-disassembly').scrollIntoViewIfNeeded();
      await expect(page.locator('#'+key+'-disassembly .tw-keyword').first()).toBeVisible();
      const download=page.waitForEvent('download');await page.locator('#'+key+'-downloads').getByRole('link',{name:target.label,exact:true}).click();
      await(await download).saveAs(new URL(name+'-'+key+'.'+target.extension,output).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
    }
    await page.screenshot({path:new URL(name+'-native-targets.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
    await expect(page.locator('#core-instructions .tw-identifier').first()).toBeAttached();
    await page.locator('#auto-execute').uncheck();
    const editor = page.locator('#editor .cm-content');
    await editor.focus(); await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.insertText('pri'); await page.keyboard.press('Control+Space');
    await expect(page.locator('.cm-tooltip-autocomplete [role=option]').filter({hasText:'print'})).toBeVisible();
    await page.keyboard.press('Tab'); await expect(editor.locator('.cm-line')).toHaveText('print');
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.insertText('struct Point { x: i32; y: i32; } var point: Point; point.');
    await page.keyboard.press('Control+Space');
    await expect(page.locator('.cm-tooltip-autocomplete [role=option]')).toHaveCount(2);
    await page.screenshot({path:new URL(name+'-completion.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
    await page.keyboard.press('Escape');
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.insertText('var value: i32 = 1; print(va');
    await page.keyboard.press('Control+Space');
    const contextualOptions = page.locator('.cm-tooltip-autocomplete [role=option]');
    await expect(contextualOptions).toHaveCount(1);
    await expect(contextualOptions).toContainText('value');
    await expect(contextualOptions).not.toContainText('active grammar');
    await page.screenshot({path:new URL(name+'-context-completion.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
    await page.keyboard.press('Escape');
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.insertText('var value: i32 = 1; var valid: bool = true; fn check(flag: bool): void {} check(va');
    await page.keyboard.press('Control+Space');
    await expect(contextualOptions).toHaveCount(1);
    await expect(contextualOptions).toContainText('valid');
    await page.keyboard.press('Escape');await page.keyboard.press('ControlOrMeta+a');
    // Selecting all reveals the preceding fixture's pending error. Start from
    // valid source to distinguish a new hidden error from that retained one.
    await page.keyboard.insertText('print(42);');
    await expect(page.locator('#status')).toContainText('Complete');
    await expect(page.locator('#editor-error')).toBeHidden();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.insertText('print(42)');
    await expect(page.locator('#status')).toContainText('Stopped');
    await expect(page.locator('#editor-error')).toBeHidden();
    await expect(page.locator('.tw-inline-error')).toHaveCount(0);
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('.tw-inline-error-message')).toContainText("Missing ';'");
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.insertText('struct Point { instant:i32; } var point:Point; point');
    await page.keyboard.press('Escape');await page.waitForTimeout(200);
    await page.keyboard.press('.');
    await expect(page.locator('.cm-completionLabel')).toHaveText(['instant']);
    await page.locator('#project-kind').selectOption('tower:compiler');
    await expect(page.locator('#compiler-controls')).toBeVisible();
    await expect(page.locator('#status')).toContainText('Complete',{timeout:65000});
    await expect(page.locator('#editor .cm-content')).toContainText('Continue adding ports');
    await expect(page.locator('#editor .cm-content')).toContainText('import tower resolves the project file tower.tower');
    await expect(page.locator('button[data-path="tower.tower"]')).toBeVisible();
    await expect(page.locator('button[data-path=".tower/tower.tower"]')).toHaveCount(0);
    assert.ok(await page.locator('#file-tree').evaluate(el=>el.clientHeight > 40));
    await page.locator('#rebuild-compiler').click();
    await expect(page.locator('#cancel-compiler-build')).toBeEnabled();
    await page.locator('#cancel-compiler-build').click();
    await expect(page.locator('#compiler-build-status')).toHaveText('Compiler build cancelled');
    await expect(page.locator('#active-compiler')).toHaveText('Original compiler');
    await page.screenshot({path:new URL(name+'-compiler-project.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
    assert.deepEqual(errors, []);
    report.browsers.push({name,output:'42\n',incrementOutput:'5\n6\n7\n7\n9\n',extraSemicolonDiagnostic:true,forwardModuleBindings:true,multiFileProject:true,projectArchive:true,migration:true,uniformExecutionUI:true,incrementalBedrock:true,emptyLiteralDiagnostic:true,restore:true,reload:true,nativeTargets:Object.entries(targets).filter(([key])=>key!=='wasm').map(([,target])=>target.label),equalColumns:true,errors});
    console.log(name + ': backends agree; forward module bindings, editable grammar, persistence, native builds/downloads and equal columns verified.');
    report.browsers.at(-1).completion = true;
    report.browsers.at(-1).contextualCompletion = true;
    report.browsers.at(-1).typedCompletion = true;
    report.browsers.at(-1).sharedTowerHighlighting = true;
    report.browsers.at(-1).deferredDiagnostics = true;
    report.browsers.at(-1).preparedDotCompletion = true;
    report.browsers.at(-1).compilerProject = true;

    report.browsers.at(-1).cSource = {optional:true,order:true,download:true,highlighting:true,optimization:true,commentStripping:true};
    console.log(name + ': Tower/Wasm parser/type completion, Tab acceptance, struct fields and compiler-based output highlighting verified.');
    await context.close();
    const detectionContext = await browser.newContext(options);
    await detectionContext.addInitScript(({mobile})=>{
      localStorage.setItem('tower-build-targets-v1',JSON.stringify({wasm:true,x86:true}));
      localStorage.setItem('tower-build-targets-v2',JSON.stringify({wasm:true,windows:true,linux:true,'linux-arm':true,mac:true,'mac-arm':true}));
      Object.defineProperty(navigator,'userAgentData',{value:{platform:mobile?'Android':'Windows',
        getHighEntropyValues:async()=>({architecture:mobile?'arm':'x86',bitness:'64'})}});
    },{mobile:name==='mobile'});
    const detectionPage=await detectionContext.newPage();
    detectionPage.on('pageerror',error=>errors.push(error.message));
    await detectionPage.goto(base.href);
    // This is a fresh browser context with a cold compiler download, like the
    // initial page above; it needs the same startup budget.
    await expect(detectionPage.locator('#status')).toContainText('Complete',{timeout:60000});
    await detectionPage.locator('#build-targets summary').click();
    const detectedKey=name==='mobile'?'wasm':'windows';
    await expect(detectionPage.locator('#target-options input:checked')).toHaveCount(detectedKey==='wasm'?3:4);
    await expect(detectionPage.locator('#target-wasm')).toBeChecked();
    await expect(detectionPage.locator('#wasm-column')).toBeVisible();
    await expect(detectionPage.locator('#target-'+detectedKey)).toBeChecked();
    await expect(detectionPage.locator('#target-default')).toHaveCount(0);
    if(name==='mobile') await expect(detectionPage.locator('#target-options')).not.toContainText('(detected)');
    else await expect(detectionPage.locator('#target-label-windows')).toContainText('Windows x64 (detected)');
    await detectionPage.screenshot({path:new URL(name+'-target-default.png',output).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
    assert.deepEqual(errors,[]);
    report.browsers.at(-1).defaultTargets=[...new Set(['interpreter','fast','wasm',detectedKey])];
    report.browsers.at(-1).legacySelectionsIgnored=true;
    await detectionContext.close();
    console.log(name+': legacy selections ignored; Wasm plus detected target defaults and detection marker verified.');
  }
  if (process.platform === 'linux' && ['x64','arm64'].includes(process.arch)) {
    // Use Chromium's real Linux signals as well as the emulated platform cases.
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto(base.href);
      await expect(page.locator('#status')).toContainText('Complete',{timeout:60000});
      const key = process.arch === 'arm64' ? 'linux-arm' : 'linux';
      await expect(page.locator('#target-options input:checked')).toHaveCount(4);
      await expect(page.locator('#target-wasm')).toBeChecked();
      await expect(page.locator('#target-'+key)).toBeChecked();
      report.host = {platform:process.platform, architecture:process.arch, defaultTargets:['wasm',key]};
      console.log('Real Linux browser: Wasm and ' + targets[key].label + ' selected by default.');
    } finally { await context.close(); }
  }
} catch (error) {
  const failures=[];
  for (const context of browser.contexts()) for (const page of context.pages()) {
    failures.push({url:page.url(),status:await page.locator('#execution-status').textContent().catch(()=>null),
      errors:await page.locator('.runner-error').allTextContents(),
      diagnostic:await page.locator('#error-message').textContent().catch(()=>null)});
  }
  await writeFile(new URL('failure.json',output),JSON.stringify(failures,null,2)+'\n');
  throw error;
} finally { await browser.close(); }
await writeFile(new URL('report.json',output),JSON.stringify(report,null,2)+'\n');
