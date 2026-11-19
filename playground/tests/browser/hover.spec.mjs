import {test,expect} from '@playwright/test';

async function source(page,text) {
  const editor=page.getByRole('textbox',{name:'Tower source'});
  await editor.click();await editor.press('ControlOrMeta+a');
  await page.keyboard.insertText(text);await editor.press('Escape');
  await page.mouse.move(0,0);
  return editor;
}

async function point(page,text,last=true) {
  return page.locator('#editor .cm-content').evaluate((editor,{text,last})=>{
    const nodes=[],walker=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT);
    while(walker.nextNode())nodes.push(walker.currentNode);
    if(last)nodes.reverse();
    for(const node of nodes) {
      const at=last?node.textContent.lastIndexOf(text):node.textContent.indexOf(text);
      if(at<0)continue;
      const range=document.createRange();range.setStart(node,at);range.setEnd(node,at+text.length);
      const box=range.getBoundingClientRect();return {x:box.x+box.width/2,y:box.y+box.height/2};
    }
    throw Error('Token not rendered: '+text);
  },{text,last});
}

async function ready(page,text) {
  await page.waitForFunction(text=>window.documentQueries.some(query=>query.source===text&&query.done),text);
}

test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{
    window.documentQueries=[];
    const post=Worker.prototype.postMessage;
    Worker.prototype.postMessage=function(data,...rest) {
      if(data.method==='document') {
        const query={source:data.source};window.documentQueries.push(query);
        const receive=event=>{if(event.data.id===data.id){query.done=true;this.removeEventListener('message',receive);}};
        this.addEventListener('message',receive);
      }
      return post.call(this,data,...rest);
    };
  });
  await page.goto('/');await expect(page.locator('#status')).toContainText('Complete');
  await page.locator('#auto-execute').uncheck();
});

test('cached mouse hover shows checked types and ECS metadata without a worker round trip',async({page},info)=>{
  const text='var value = 42;\nprint(value);';await source(page,text);await ready(page,text);
  const count=await page.evaluate(()=>window.documentQueries.length);
  const position=await point(page,'value');await page.mouse.move(position.x,position.y);
  const tip=page.locator('.tw-language-hover');await expect(tip).toBeVisible();
  await expect(tip.locator('code')).toHaveText('var value: i32');
  await expect(tip).toContainText('global variable');await expect(tip).toContainText('4 bytes');
  await expect(tip).toContainText(/entity \d+.*components/);await expect(tip).toContainText('Resolves to entity');
  expect(await page.evaluate(()=>window.documentQueries.length)).toBe(count);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'../build/hover-'+info.project.name+'.png'});
  await page.mouse.move(0,0);await expect(tip).toHaveCount(0);
});

test('member hover uses the resolved field and comments have no tooltip',async({page})=>{
  const text='struct P { x:i32; ready:bool; }\nvar p:P;\np.ready = true;\n// comment';
  await source(page,text);await ready(page,text);
  let position=await point(page,'ready');await page.mouse.move(position.x,position.y);
  const tip=page.locator('.tw-language-hover');await expect(tip.locator('code')).toHaveText('ready: bool');
  await expect(tip).toContainText('field offset 4');
  position=await point(page,'comment');await page.mouse.move(position.x,position.y);
  await expect(tip).toHaveCount(0);
});

test('editing dismisses hover and the next snapshot contains the new type',async({page})=>{
  let text='var value:i32 = 42;\nprint(value);';await source(page,text);await ready(page,text);
  let position=await point(page,'value');await page.mouse.move(position.x,position.y);
  await expect(page.locator('.tw-hover-signature')).toHaveText('var value: i32');
  text='var value:bool = true;\nprint(value);';await source(page,text);
  await expect(page.locator('.tw-language-hover')).toHaveCount(0);await ready(page,text);
  position=await point(page,'value');await page.mouse.move(position.x,position.y);
  await expect(page.locator('.tw-hover-signature')).toHaveText('var value: bool');
});

test('late document replies cannot show a tooltip from the previous source',async({page})=>{
  await page.route('**/language-worker.js',async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:await response.text()+'\nconst post=self.postMessage.bind(self);self.postMessage=data=>setTimeout(()=>post(data),500);'});
  });
  // Reload so the route also delays the first language worker.
  await page.reload();await expect(page.locator('#status')).toContainText('Complete');
  const old='var previous:i32 = 42;\nprint(previous);';await source(page,old);
  await page.waitForFunction(text=>window.documentQueries.some(query=>query.source===text),old);
  let position=await point(page,'previous');await page.mouse.move(position.x,position.y);
  const text='var current:bool = true;\nprint(current);';await source(page,text);await ready(page,text);
  position=await point(page,'current');await page.mouse.move(position.x,position.y);
  await expect(page.locator('.tw-hover-signature')).toHaveText('var current: bool');
  await expect(page.locator('.tw-language-hover')).not.toContainText('previous');
});

test('a slow background inspection yields the worker when typing needs completion',async({page})=>{
  await page.addInitScript(()=>{
    window.retiredWorkers=0;const terminate=Worker.prototype.terminate;
    Worker.prototype.terminate=function(){window.retiredWorkers++;return terminate.call(this);};
  });
  await page.route('**/language-worker.js',async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:await response.text()+'\nconst receive=self.onmessage;self.onmessage=event=>{if(event.data.method===\'document\')setTimeout(()=>receive(event),2500);else receive(event);};'});
  });
  await page.reload();await expect(page.locator('#status')).toContainText('Complete');
  const text='var value:i32 = 42;';await source(page,text);
  await page.waitForFunction(text=>window.documentQueries.some(query=>query.source===text&&!query.done),text);
  const retired=await page.evaluate(()=>window.retiredWorkers);
  await source(page,'pri');await page.keyboard.press('Control+Space');
  await expect(page.getByRole('option').filter({hasText:'print'})).toBeVisible();
  expect(await page.evaluate(()=>window.retiredWorkers)).toBeGreaterThan(retired);
});
