import {StateEffect,StateField} from '@codemirror/state';
import {ViewPlugin,showTooltip,repositionTooltips,closeHoverTooltips} from '@codemirror/view';
import {DocumentQueries,languagePayload,hoverAt,hasHoverDetails} from './language-queries.mjs';
import {compilerSelection,onCompilerSelection} from './compiler-selection.mjs';

const dwellTime=800,holdMargin=5;
const contains=(rect,point,margin=0)=>point.x>=rect.left-margin && point.x<=rect.right+margin &&
  point.y>=rect.top-margin && point.y<=rect.bottom+margin;

function tooltipContent(entry,doc) {
    const dom=document.createElement('div');dom.className='tw-language-hover';
    dom.setAttribute('role','tooltip');
    if(entry.signature?.trim()!==doc.sliceString(entry.from,entry.to).trim()) {
      const signature=document.createElement('code');signature.className='tw-hover-signature';signature.textContent=entry.signature;
      dom.append(signature);
    }
    const line=text=>{const row=document.createElement('div');row.textContent=text;dom.append(row);};
    if(entry.kind && entry.kind!=='syntax')line(entry.kind);
    if(entry.description)line(entry.description);
    if(entry.capture)line(`Capture: $${entry.capture}`);
    if(entry.category)line(`Grammar category: ${entry.category}`);
    if(entry.replacementCategory)line(`Replacement produces: ${entry.replacementCategory}`);
    if(entry.replacementAlternatives>1)line(`Shared by ${entry.replacementAlternatives} alternatives; syntax preview uses the first compiled alternative.`);
    if(entry.alternatives!==undefined)line(`${entry.alternatives} active ${entry.alternatives===1?'alternative':'alternatives'}`);
    if(entry.definition) {
      const definition=document.createElement('code');definition.className='tw-hover-definition';
      definition.textContent=entry.definition;dom.append(definition);
    }
    if(entry.resolution)line(entry.resolution);
    if(entry.definedIn)line(`Defined in ${entry.definedIn}${entry.definitionLine?`:${entry.definitionLine}`:''}`);
    const functionType=entry.kind?.startsWith('function');
    if(entry.type)line(`${functionType?'Returns':'Type'}: ${entry.type}`);
    if(entry.size!==undefined && entry.type!=='void')line(`${functionType?'Result: ':''}${entry.size} bytes · alignment ${entry.alignment}${entry.offset===undefined?'':` · field offset ${entry.offset}`}`);
    if(Number.isInteger(entry.declarationFrom) && entry.declarationFrom<=doc.length) {
      const location=doc.lineAt(entry.declarationFrom);
      line(`Declared at line ${location.number}, column ${entry.declarationFrom-location.from+1}`);
    }
    if(entry.documentation) {
      const documentation=document.createElement('div');documentation.className='tw-hover-documentation';
      documentation.textContent=entry.documentation;dom.append(documentation);
    }
    return dom;
}

export function towerHover(service,configuration) {
  const documents=new DocumentQueries(service);
  let currentDoc=null,currentRevision=-1,currentWidth=0,value=null;
  function query(view) {
    const revision=compilerSelection().revision;
    const width=configuration().pointerBytes??4;
    if(currentDoc===view.state.doc && currentRevision===revision && currentWidth===width && value!==null)return value;
    currentDoc=view.state.doc;currentRevision=revision;currentWidth=width;
    value=documents.request(languagePayload(configuration,currentDoc.toString(),'document'));
    if(value?.then) {
      const pending=value;
      value.then(result=>{if(value===pending)value=result;});
    }
    return value;
  }
  const setHover=StateEffect.define();
  const hoverState=StateField.define({
    create:()=>null,
    update(value,tr) {
      if(tr.docChanged || tr.selection || tr.effects.includes(closeHoverTooltips))value=null;
      for(const effect of tr.effects)if(effect.is(setHover))value=effect.value;
      return value;
    },
    provide:field=>showTooltip.from(field),
  });
  const hover=ViewPlugin.fromClass(class {
    constructor(view) {
      this.view=view;this.document=view.dom.ownerDocument;this.window=this.document.defaultView;
      this.current=null;this.pending=null;this.pointer=null;this.listeners=[];this.schedule();
      this.listen(this.document,'mousemove',event=>this.move(event));
      this.listen(this.document,'mousedown',event=>{
        if(!this.current?.locked || !this.current.dom?.contains(event.target))this.hide();
      });
      this.listen(this.document,'keydown',event=>{if(event.key==='Escape')this.hide();});
      this.listen(this.document,'scroll',event=>{if(!this.current?.dom?.contains(event.target))this.hide();});
      this.listen(this.document,'mouseout',event=>{if(!event.relatedTarget)this.hide();});
      this.listen(this.window,'blur',event=>{if(event.target===this.window)this.hide();});
      this.listen(this.window,'resize',()=>this.hide());
      this.listen(this.document,'visibilitychange',()=>{if(this.document.hidden)this.hide();});
      this.unsubscribe=onCompilerSelection(()=>{
        currentDoc=null;value=null;documents.clear();this.schedule();
        this.reset();queueMicrotask(()=>{if(!this.destroyed)this.hide();});
      });
    }
    listen(target,type,handler) {
      target.addEventListener(type,handler,{capture:true,passive:true});
      this.listeners.push(()=>target.removeEventListener(type,handler,true));
    }
    schedule() {clearTimeout(this.timer);this.timer=setTimeout(()=>query(this.view),150);}
    update(update) {
      if(update.docChanged){currentDoc=null;value=null;documents.clear();this.schedule();}
      if(update.docChanged || update.selectionSet || update.startState.field(hoverState) && !update.state.field(hoverState)){this.reset();}
      else if(update.geometryChanged) {
        if(this.current)this.current.rects=null;
        if(this.retarget)this.retarget.rects=null;
      }
    }
    cancelSwitch() {
      clearTimeout(this.switchTimer);this.retarget=null;this.current?.dom?.classList.remove('tw-hover-pending');
    }
    reset() {clearTimeout(this.dwell);this.cancelSwitch();this.current=null;this.pending=null;}
    hide() {
      this.reset();
      if(this.view.state.field(hoverState))this.view.dispatch({effects:setHover.of(null)});
    }
    rects(entry) {
      const from=this.view.domAtPos(entry.from),to=this.view.domAtPos(entry.to),range=this.document.createRange();
      range.setStart(from.node,from.offset);range.setEnd(to.node,to.offset);
      return [...range.getClientRects()];
    }
    overSymbol(hover,point) {
      hover.rects??=this.rects(hover.entry);
      return hover.rects.some(rect=>contains(rect,point));
    }
    move(event) {
      this.pointer={x:event.clientX,y:event.clientY};
      if(event.buttons && !this.current?.locked){this.hide();return;}
      const hover=this.current;
      if(hover?.locked) {
        if(hover.dom?.contains(event.target)){this.cancelSwitch();return;}
        if(hover.dom && contains(hover.dom.getBoundingClientRect(),this.pointer,holdMargin) || this.overSymbol(hover,this.pointer)) {
          this.considerSwitch(event.target);return;
        }
        this.hide();
      }
      if(!this.view.contentDOM.contains(event.target)){this.hide();return;}
      if(hover && !hover.locked && this.overSymbol(hover,this.pointer)) {
        hover.anchor={...this.pointer};repositionTooltips(this.view);return;
      }
      this.inspect();
    }
    considerSwitch(target) {
      if(!this.view.contentDOM.contains(target)){this.cancelSwitch();return;}
      if(this.retarget && this.overSymbol(this.retarget,this.pointer)) {
        this.retarget.anchor={...this.pointer};return;
      }
      this.cancelSwitch();
      const entries=query(this.view),next=entries?.then?null:this.hit(entries);
      if(!next || next.entry===this.current.entry)return;
      const previous=this.current;
      this.retarget=next;previous.dom.classList.add('tw-hover-pending');
      this.switchTimer=setTimeout(()=>{
        if(this.current!==previous || this.retarget!==next || !this.overSymbol(next,this.pointer))return;
        if(!this.view.contentDOM.contains(this.document.elementFromPoint(this.pointer.x,this.pointer.y))){this.cancelSwitch();return;}
        this.show(next,true);
      },dwellTime);
    }
    inspect() {
      const doc=this.view.state.doc,revision=compilerSelection().revision,width=configuration().pointerBytes??4;
      const result=query(this.view);
      if(!result?.then){this.render(result);return;}
      if(this.pending?.result===result)return;
      this.hide();const pending=this.pending={result};
      result.then(entries=>{
        if(this.destroyed || this.pending!==pending || doc!==this.view.state.doc || revision!==compilerSelection().revision || width!==(configuration().pointerBytes??4))return;
        this.pending=null;
        const target=this.document.elementFromPoint(this.pointer.x,this.pointer.y);
        if(this.view.contentDOM.contains(target))this.render(entries);
      });
    }
    hit(entries) {
      const point=this.pointer,pos=this.view.posAtCoords(point);
      if(!entries || pos===null)return null;
      // Hit-test the actual token rectangles, not the nearest caret in blank
      // space. The compiler still owns all symbol/type/range information.
      for(const side of [1,-1]) {
        const entry=hoverAt(entries,pos,side);
        if(!entry || !hasHoverDetails(entry,this.view.state.doc.sliceString(entry.from,entry.to)))continue;
        const rects=this.rects(entry);
        if(!rects.some(rect=>contains(rect,point)))continue;
        return {entry,rects,anchor:{...point}};
      }
      return null;
    }
    render(entries) {
      const next=this.hit(entries);
      if(!next){this.hide();return;}
      if(this.current?.entry===next.entry) {
        this.current.anchor=next.anchor;repositionTooltips(this.view);return;
      }
      this.show(next,false);
    }
    show(next,locked) {
        this.reset();
        const {entry}=next,hover=this.current={...next,locked,dom:null};
        const description={pos:entry.from,end:entry.to,above:true,clip:false,create:()=>{
          const dom=hover.dom=this.document.createElement('div');
          dom.className=`tw-hover-panel ${locked?'tw-hover-pinned':'tw-hover-preview'}`;
          dom.append(tooltipContent(entry,this.view.state.doc));
          return {dom,getCoords:()=>({left:hover.anchor.x,right:hover.anchor.x,top:hover.anchor.y-12,bottom:hover.anchor.y+18})};
        }};
        this.view.dispatch({effects:setHover.of(description)});
        if(locked)return;
        // Dwell belongs to this source occurrence, not the last mouse event.
        this.dwell=setTimeout(()=>{
          if(this.current!==hover || !this.overSymbol(hover,this.pointer))return;
          hover.locked=true;hover.dom.classList.replace('tw-hover-preview','tw-hover-pinned');
        },dwellTime);
    }
    destroy() {
      this.destroyed=true;this.reset();clearTimeout(this.timer);this.unsubscribe();
      for(const remove of this.listeners)remove();
      currentDoc=null;value=null;documents.clear();
    }
  });
  return [hoverState,hover];
}
