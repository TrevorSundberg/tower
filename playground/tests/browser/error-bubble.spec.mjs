import {savedSource} from './project-helpers.mjs';
import {test,expect} from '@playwright/test';

test('error bubble connects to the marked text at both corners, across wide and wrapped tokens',async({page},info)=>{
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  if(info.project.name==='mobile')await page.setViewportSize({width:390,height:844});
  await page.goto('/'); await expect(page.locator('#status')).toContainText('Complete');
  const columns=await page.locator('.cm-line').first().evaluate(line=>{
    const style=getComputedStyle(line), canvas=document.createElement('canvas'), context=canvas.getContext('2d');
    context.font=style.font;
    return Math.floor((line.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight))/context.measureText('M').width);
  });
  for(const [name,text] of [
    ['left','bad'],
    ['right',' '.repeat(Math.max(0,columns-3))+'bad'],
    ['wide',' '.repeat(Math.max(0,Math.floor(columns/3)))+'invalid_name_wide'],
    ['wrapped','x'.repeat(columns+9)],
  ]){
    const source="parse Statement = Number ';';\n"+text;
    await page.locator('#editor').click({position:{x:80,y:20}});
    await page.getByRole('textbox',{name:'Tower source'}).press('ControlOrMeta+a');
    await page.keyboard.insertText(source);
    await expect(page.locator('#status')).toContainText('Stopped');
    await page.locator('#editor-error').click();
    await expect(page.locator('.has-bubble-outline')).toBeVisible();
    await expect.poll(async()=>page.locator('.tw-error-bubble path').getAttribute('d')).toContain('Q');
    // Sample the actual rendered outline, independent of its path command order.
    const geometry=await page.locator('.tw-inline-error').evaluate(box=>{
      const svg=box.querySelector('svg'), path=svg.querySelector('path'), rect=svg.getBoundingClientRect();
      const card=box.querySelector('.tw-inline-error-card').getBoundingClientRect();
      const points=[],middle=[];
      const tipY=path.getBBox().y, midY=(card.top-rect.top+.5+tipY)/2;
      for(let distance=0;distance<path.getTotalLength();distance+=.5){
        const p=path.getPointAtLength(distance);
        if(p.y<tipY+.1)points.push(p.x+rect.left);
        if(Math.abs(p.y-midY)<.35)middle.push(p.x+rect.left);
      }
      const marks=[...document.querySelectorAll('.tw-error-range')].flatMap(mark=>[...mark.getClientRects()]);
      const lastTop=Math.max(...marks.map(mark=>mark.top)), row=marks.filter(mark=>Math.abs(mark.top-lastTop)<2);
      return {tipY,tipLeft:Math.min(...points),tipRight:Math.max(...points),midLeft:Math.min(...middle),midRight:Math.max(...middle),
        textLeft:Math.min(...row.map(mark=>mark.left)),textRight:Math.max(...row.map(mark=>mark.right)),
        cardLeft:card.left,cardRight:card.right,fill:getComputedStyle(svg).fill,stroke:getComputedStyle(svg).stroke,
        cardFill:getComputedStyle(box.querySelector('.tw-inline-error-card')).backgroundColor};
    });
    expect(Math.abs(geometry.tipLeft-geometry.textLeft),name).toBeLessThan(1.5);
    expect(Math.abs(geometry.tipRight-geometry.textRight),name).toBeLessThan(1.5);
    expect(geometry.tipY).toBe(3.5); // A clear gap below the squiggle, including the half-pixel border.
    if(name==='left'){
      expect(geometry.textLeft).toBeLessThan(geometry.cardLeft+5);
      expect(Math.abs(geometry.tipLeft-geometry.midLeft)).toBeLessThan(.6);
    }
    if(name==='right'){
      expect(geometry.textRight).toBeGreaterThan(geometry.cardRight-5);
      expect(Math.abs(geometry.tipRight-geometry.midRight)).toBeLessThan(.6);
    }
    expect(geometry.fill).toBe('rgb(48, 35, 34)');
    expect(geometry.stroke).toBe('rgb(119, 80, 71)');
    expect(geometry.cardFill).toBe('rgba(0, 0, 0, 0)');
    await expect.poll(()=>savedSource(page)).toBe(source);
    await page.locator('#editor').screenshot({path:`../build/error-bubble-${name}-${info.project.name}.png`});
  }
  expect(errors).toEqual([]);
});
