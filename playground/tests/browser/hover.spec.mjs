import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {savedSource} from './project-helpers.mjs';

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
  await page.goto(process.env.TOWER_HOVER_TEST_URL || '/');await expect(page.locator('#status')).toContainText('Complete');
  await page.locator('#auto-execute').uncheck();
});

test('cached mouse hover shows resolved types and declaration locations without debug metadata or a worker round trip',async({page},info)=>{
  const text='var value = 42;\nprint(value);';await source(page,text);await ready(page,text);
  const count=await page.evaluate(()=>window.documentQueries.length);
  const position=await point(page,'value');await page.mouse.move(position.x,position.y);
  const tip=page.locator('.tw-language-hover');await expect(tip).toBeVisible();
  await expect(tip.locator('code')).toHaveText('var value: i32');
  await expect(tip).toContainText('global variable');await expect(tip).toContainText('4 bytes');
  await expect(tip).toContainText('Type: i32');await expect(tip).toContainText('foreach.tower:1:1');
  await expect(tip).not.toContainText(/entity|components|Syntax|CoreLocation/);
  expect(await page.evaluate(()=>window.documentQueries.length)).toBe(count);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'../build/hover-'+info.project.name+'.png'});
  await page.mouse.move(0,0);await expect(tip).toHaveCount(0);
});

test('grammar hover follows each parsed part and shows referenced types without a hover-time worker query',async({page},info)=>{
  const text='// Increment a location.\nfn increment(p:i32*):i32 { var result = *p; return result; }\n// Match an assignable location.\nparse CoreCall |= $target:CoreLocation \'++\'\n    => replace { increment(&$target) };\nvar value:i32 = 2;\nprint(value++);';
  await source(page,text);await ready(page,text);
  const count=await page.evaluate(()=>window.documentQueries.length),tip=page.locator('.tw-language-hover');
  for(const [name,last,expected] of [
    ['target',false,'capture binding'],['CoreLocation',true,'grammar reference'],
    ['++',false,'literal token'],['increment',true,'fn increment(p: i32*): i32'],
    ['target',true,'capture substitution'],
  ]) {
    await page.mouse.move(0,0);const position=await point(page,name,last);await page.mouse.move(position.x,position.y);
    await expect(tip).toBeVisible();await expect(tip).toContainText(expected);
    await expect(tip).not.toContainText(/entity|components/);
    if(expected==='capture substitution') {
      await expect(tip).toContainText('Capture: $target:CoreLocation');
      await expect(tip).not.toContainText('Grammar category:');
      await expect(tip).not.toContainText('Type:');
    }
    if(expected==='grammar reference') {
      await expect(tip.locator('.tw-hover-definition')).toContainText('$name:Identifier');
      await page.screenshot({path:'../build/grammar-hover-'+info.project.name+'.png'});
    }
  }
  expect(await page.evaluate(()=>window.documentQueries.length)).toBe(count);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
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

test('keywords, operators and function braces use Tower services and one location spelling',async({page})=>{
  const text='fn increment(p:i32*):i32 {\n  var old:i32 = *p;\n  *p = old + 1;\n  return old;\n}';
  await source(page,text);await ready(page,text);
  await expect(page.locator('#position')).toHaveText('foreach.tower:5:2');
  const tip=page.locator('.tw-language-hover');
  for(const [lineText,token,description] of [
    ['fn increment','fn','Defines this function.'],
    ['var old','var','Declares a mutable variable.'],
    ['var old','=','Declares a mutable variable.'],
    ['var old','*','Reads the value stored at this pointer.'],
    ['*p =','*','Selects the pointed-to value to write.'],
    ['*p =','=','Stores the value on the right'],
    ['*p =','+','Type: i32'],
    ['return old','return','Returns this value'],
    ['}','}','The body of this function.'],
  ]) {
    const line=page.locator('#editor .cm-line').filter({hasText:lineText});
    await line.scrollIntoViewIfNeeded();
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const position=await line.evaluate((line,token)=>{
      let offset=line.textContent.indexOf(token);const walker=document.createTreeWalker(line,NodeFilter.SHOW_TEXT);
      while(walker.nextNode()) {
        const node=walker.currentNode;
        if(offset>=node.length){offset-=node.length;continue;}
        const range=document.createRange();range.setStart(node,offset);range.setEnd(node,offset+token.length);
        const box=range.getBoundingClientRect();return {x:box.x+box.width/2,y:box.y+box.height/2};
      }
    },token);
    await page.mouse.move(position.x,position.y);await expect(tip).toContainText(description);
    await expect(tip).not.toContainText(/Declared at|Defined in|Returns:|\nfunction\n/);
    if(['fn','return','}'].includes(token)) {
      await expect(tip).toContainText('fn increment(p: i32*): i32');
      await expect(tip).toContainText('Result: 4 bytes');
      await expect(tip).toContainText('foreach.tower:1:1');
    }
    await page.mouse.move(0,0);await expect(tip).toHaveCount(0);
  }
});

test('foreach imports, compact alternatives and syntax-only loop tokens have useful cached hovers',async({page},info)=>{
  const text=await readFile(new URL('../../../scaffolding/examples/foreach.tower',import.meta.url),'utf8');
  await source(page,text);await ready(page,text);
  const count=await page.evaluate(()=>window.documentQueries.length),tip=page.locator('.tw-language-hover');
  for(const [token,last,expected] of [
    ['foundation',false,'Module: foundation'],['Expression',false,'Identifier | Number'],
    ['for',false,'Matched rule: ForEach'],['item',false,'Capture: $Variable'],
    ['items',true,'Capture: $Expression'],['child',false,'Capture: $Variable'],
    ['children',true,'Capture: $Expression'],
  ]) {
    await page.mouse.move(0,0);
    const lineText=token==='foundation'?'import foundation':token==='Expression'?'parse Expression':
      token==='child'||token==='children'?'for (child in children)':'for (item in items)';
    await page.locator('#editor .cm-line').filter({hasText:lineText}).scrollIntoViewIfNeeded();
    // Scroll events deliberately dismiss hover. Let the programmatic scroll
    // finish before sending the mouse movement that this assertion exercises.
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    // Select source-use tokens without matching a grammar literal or a substring.
    const position=token==='for'||token==='item'||token==='child'
      ?await page.locator('#editor .cm-line').filter({hasText:token==='for'?'for (item in items)':`for (${token} in`}).evaluate((line,token)=>{
        const walker=document.createTreeWalker(line,NodeFilter.SHOW_TEXT);
        while(walker.nextNode()) {const node=walker.currentNode,at=node.textContent.indexOf(token);if(at<0)continue;
          const range=document.createRange();range.setStart(node,at);range.setEnd(node,at+token.length);
          const box=range.getBoundingClientRect();return {x:box.x+box.width/2,y:box.y+box.height/2};}
        throw Error('Token not rendered: '+token);
      },token):await point(page,token,last);
    await page.mouse.move(position.x,position.y);await expect(tip,`Hovering ${token}`).toBeVisible();
    await expect(tip).toContainText(expected);
    await expect(tip).not.toContainText(/active alternative|entity|components/);
    await expect(tip).not.toContainText(/matched syntax|captured syntax|C\+\+/);
    if(['item','items','child','children'].includes(token))await expect(tip).not.toContainText(/Matched rule:|Grammar category:/);
    if(token==='foundation')await expect(tip).not.toContainText('Grammar category');
    if(token==='Expression')await expect(tip.locator('.tw-hover-definition')).toHaveText('Identifier | Number');
    if(token==='items')await page.screenshot({path:`../build/foreach-hover-${info.project.name}.png`});
  }
  expect(await page.evaluate(()=>window.documentQueries.length)).toBe(count);
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

test('capture details combine aliases and retain a different nested matched rule',async({page})=>{
  const text="parse Inner = Identifier; parse Outer = Inner; parse Statement = 'use' $value:Outer ';'; use example;";
  await source(page,text);await ready(page,text);
  const position=await point(page,'example'),tip=page.locator('.tw-language-hover');
  await page.mouse.move(position.x,position.y);
  await expect(tip).toContainText('Capture: $value:Outer in Statement');
  await expect(tip).toContainText('Matched rule: Inner');
  await expect(tip).not.toContainText(/Grammar category:|matched syntax|captured syntax/);
});

test('saved foreach copies lose the retired explanation while preserving edits',async({page})=>{
  const text="// My own explanation.\n// This feature is defined here, not in the C++ parser.\nparse Kept = 'custom';\n";
  await source(page,text);await expect.poll(()=>savedSource(page)).toBe(text);
  await page.reload();await expect(page.locator('#status')).toContainText('Complete');
  await expect.poll(()=>savedSource(page)).toBe("// My own explanation.\nparse Kept = 'custom';\n");
  await expect(page.getByRole('textbox',{name:'Tower source'})).not.toContainText('C++');
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

test('preview follows the mouse and becomes opaque after dwelling on a moving symbol',async({page},info)=>{
  const text='\n\n\n\nvar movingSymbol:i32 = 42;\nprint(movingSymbol);';
  await source(page,text);await ready(page,text);
  await page.clock.install({time:new Date('2030-01-01T00:00:00Z')});
  await page.clock.pauseAt(new Date('2030-01-01T00:01:00Z'));
  const position=await point(page,'movingSymbol'),panel=page.locator('.tw-hover-panel');
  await page.mouse.move(position.x-10,position.y);await page.clock.runFor(32);
  await expect(panel).toHaveClass(/tw-hover-preview/);
  await expect(panel).toHaveCSS('pointer-events','none');await expect(panel).toHaveCSS('opacity','0.76');
  await page.screenshot({path:`../build/hover-dwell-preview-${info.project.name}.png`});
  const first=await panel.boundingBox();
  expect(await panel.evaluate(dom=>{
    const box=dom.getBoundingClientRect();return dom.contains(document.elementFromPoint(box.x+box.width/2,box.y+box.height/2));
  })).toBe(false);
  await page.clock.runFor(368);
  await page.mouse.move(position.x+10,position.y);await page.clock.runFor(32);
  const moved=await panel.boundingBox();
  // Horizontal viewport clamping can keep a wide mobile tooltip at the edge.
  if(first.x+first.width<await page.evaluate(()=>innerWidth-25))expect(moved.x).toBeGreaterThan(first.x);
  await page.clock.runFor(367);await expect(panel).toHaveClass(/tw-hover-preview/);
  await page.clock.runFor(1);await expect(panel).toHaveClass(/tw-hover-pinned/);
  await expect(panel).toHaveCSS('opacity','1');await expect(panel).toHaveCSS('pointer-events','auto');
  await page.screenshot({path:`../build/hover-dwell-pinned-${info.project.name}.png`});
  const pinned=await panel.boundingBox();
  await page.mouse.move(position.x-8,position.y);await page.clock.runFor(32);
  expect(await panel.boundingBox()).toEqual(pinned);
});

test('a pinned panel allows interaction and exactly a five pixel dismissal margin',async({page})=>{
  const text='\n\n\n\nvar stickySymbol:i32 = 42;\nprint(stickySymbol);';
  await source(page,text);await ready(page,text);
  const position=await point(page,'stickySymbol'),panel=page.locator('.tw-hover-panel');
  await page.mouse.move(position.x,position.y);await expect(panel).toHaveClass(/tw-hover-pinned/);
  const box=await panel.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await expect(panel).toBeVisible();
  expect(await panel.evaluate(dom=>{
    const box=dom.getBoundingClientRect();return dom.contains(document.elementFromPoint(box.x+box.width/2,box.y+box.height/2));
  })).toBe(true);
  await panel.locator('.tw-hover-signature').dblclick();await expect(panel).toBeVisible();
  expect(await page.evaluate(()=>getSelection().toString().length)).toBeGreaterThan(0);
  // Keep this boundary probe away from the original token, which also holds
  // the tooltip independently of the panel's margin on narrow screens.
  await page.mouse.move(box.x+box.width-8,box.y+box.height+4);await expect(panel).toBeVisible();
  await page.mouse.move(box.x+box.width-8,box.y+box.height+6);await expect(panel).toHaveCount(0);
});

test('above and below bubbles keep at least two pixels of grace around the pointer',async({page})=>{
  for(const above of [true,false]) {
    const text=above?'\n\n\n\nvar borderSymbol:i32 = 42;\nprint(borderSymbol);':
      'print(borderSymbol());\n'+'// Documentation for this function.\n'.repeat(10)+'fn borderSymbol():i32 { return 42; }';
    await source(page,text);await ready(page,text);
    await page.locator('#editor .cm-line').filter({hasText:above?'print(borderSymbol);':'print(borderSymbol());'}).scrollIntoViewIfNeeded();
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const position=await point(page,'borderSymbol',above),panel=page.locator('.tw-hover-panel');
    await page.mouse.move(position.x,position.y);await expect(panel).toHaveClass(/tw-hover-pinned/);
    const box=await panel.boundingBox();
    expect(box.y+box.height<=position.y).toBe(above);
    expect(position.x-(box.x-5)).toBeGreaterThanOrEqual(2);
    expect(box.x+box.width+5-position.x).toBeGreaterThanOrEqual(2);
    expect(position.y-(box.y-5)).toBeGreaterThanOrEqual(2);
    expect(box.y+box.height+5-position.y).toBeGreaterThanOrEqual(2);
    for(const [x,y] of [[-2,-2],[0,-2],[2,-2],[2,0],[2,2],[0,2],[-2,2],[-2,0]]) {
      await page.mouse.move(position.x+x,position.y+y);await expect(panel).toBeVisible();
    }
    expect(await panel.boundingBox()).toEqual(box);
    await page.mouse.move(0,0);await expect(panel).toHaveCount(0);
  }
});

test('another symbol inside the margin dims the border and replaces the pinned tooltip after continuous dwell',async({page},info)=>{
  const text='\n\n\n\nvar original:i32 = 1;\nvar target:i32 = 2;\nvar third:i32 = 3;\noriginal = target + third;';
  await source(page,text);await ready(page,text);
  await page.clock.install({time:new Date('2030-01-01T00:00:00Z')});
  await page.clock.pauseAt(new Date('2030-01-01T00:01:00Z'));
  const original=await point(page,'original'),target=await point(page,'target'),third=await point(page,'third');
  const panel=page.locator('.tw-hover-panel');
  await page.mouse.move(original.x,original.y+5);await page.clock.runFor(800);
  await expect(panel).toHaveClass(/tw-hover-pinned/);
  const box=await panel.boundingBox(),y=box.y+box.height+3;
  expect(Math.abs(y-target.y)).toBeLessThan(8);
  await page.mouse.move(target.x-3,y);await page.clock.runFor(400);
  await expect(panel).toHaveClass(/tw-hover-pending/);
  await expect(panel).toHaveCSS('border-top-color','rgb(47, 66, 72)');
  await expect(panel.locator('code')).toHaveText('var original: i32');
  await page.screenshot({path:`../build/hover-switch-pending-${info.project.name}.png`});
  // Another prospective symbol restarts the timer; returning to the panel cancels it.
  await page.mouse.move(third.x,y);await page.clock.runFor(400);
  await expect(panel.locator('code')).toHaveText('var original: i32');
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.clock.runFor(800);
  await expect(panel).not.toHaveClass(/tw-hover-pending/);
  await expect(panel).toHaveCSS('border-top-color','rgb(72, 101, 108)');
  await page.mouse.move(target.x-3,y);await page.clock.runFor(400);
  await page.mouse.move(target.x+3,y);await page.clock.runFor(399);
  await expect(panel.locator('code')).toHaveText('var original: i32');
  await page.clock.runFor(1);
  await expect(panel.locator('code')).toHaveText('var target: i32');
  await expect(panel).toHaveClass(/tw-hover-pinned/);await expect(panel).not.toHaveClass(/tw-hover-pending/);
  await expect(panel).toHaveCSS('opacity','1');
});

test('hover shows attached documentation and typed signatures, suppressing name-only syntax',async({page},info)=>{
  const text='// Doubles the input. <b>This is plain text.</b>\nfn twice(value:i32):i32 { var result = value + value; return result; }\nprint(twice(21));';
  await source(page,text);await ready(page,text);
  const position=await point(page,'twice'),tip=page.locator('.tw-language-hover');
  await page.mouse.move(position.x,position.y);
  await expect(tip.locator('code')).toHaveText('fn twice(value: i32): i32');
  await expect(tip).not.toContainText('Returns:');await expect(tip).not.toContainText('\nfunction\n');await expect(tip).toContainText('Result: 4 bytes');
  await expect(tip).toContainText('Doubles the input. <b>This is plain text.</b>');
  await expect(tip.locator('b')).toHaveCount(0);
  await expect(tip).not.toContainText(/entity|components|Syntax/);
  await tip.screenshot({path:`../build/ide-function-hover-${info.project.name}.png`});
  await page.keyboard.press('Escape');
  const keyword=await point(page,'return');await page.mouse.move(keyword.x,keyword.y);
  await expect(tip).toContainText('Returns this value from the function to its caller.');
  const broken='var unknown = missing;';await source(page,broken);await ready(page,broken);
  const missing=await point(page,'missing');await page.mouse.move(missing.x,missing.y);
  await expect(tip).toContainText('This code matches the pattern shown below.');await expect(tip).not.toContainText('Type:');
});

test('changing symbols restarts dwell and blank space or Escape dismisses the preview',async({page})=>{
  const text='var first:i32 = 1;\nvar second:bool = true;\nprint(first);\nprint(second);';
  await source(page,text);await ready(page,text);
  await page.clock.install({time:new Date('2030-01-01T00:00:00Z')});
  await page.clock.pauseAt(new Date('2030-01-01T00:01:00Z'));
  const first=await point(page,'first'),second=await point(page,'second'),panel=page.locator('.tw-hover-panel');
  await page.mouse.move(first.x,first.y);await page.clock.runFor(600);
  await page.mouse.move(second.x,second.y);await page.clock.runFor(200);
  await expect(panel).toHaveClass(/tw-hover-preview/);
  await expect(panel.locator('code')).toHaveText('var second: bool');
  await page.clock.runFor(599);await expect(panel).toHaveClass(/tw-hover-preview/);
  await page.clock.runFor(1);await expect(panel).toHaveClass(/tw-hover-pinned/);
  await page.keyboard.press('Escape');await expect(panel).toHaveCount(0);
  await page.mouse.move(first.x,first.y);await page.clock.runFor(32);await expect(panel).toBeVisible();
  const editor=await page.locator('#editor .cm-content').boundingBox();
  await page.mouse.move(editor.x+editor.width-2,first.y);await expect(panel).toHaveCount(0);
});

test('scrolling or editing closes a pinned panel and discards its dwell timer',async({page})=>{
  const text='var pinned:i32 = 1;\nprint(pinned);';await source(page,text);await ready(page,text);
  const position=await point(page,'pinned'),panel=page.locator('.tw-hover-panel');
  await page.mouse.move(position.x,position.y);await expect(panel).toHaveClass(/tw-hover-pinned/);
  await page.locator('#editor .cm-scroller').dispatchEvent('scroll');await expect(panel).toHaveCount(0);
  await page.mouse.move(position.x+1,position.y);await expect(panel).toHaveClass(/tw-hover-preview/);
  await page.keyboard.press('ArrowLeft');await expect(panel).toHaveCount(0);
  await page.waitForTimeout(850);await expect(panel).toHaveCount(0);
});
