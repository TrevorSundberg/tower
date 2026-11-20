import {StateEffect,StateField} from '@codemirror/state';
import {ViewPlugin,showTooltip,repositionTooltips,closeHoverTooltips} from '@codemirror/view';
import {DocumentQueries,languagePayload,hoverAt} from './language-queries.mjs';
import {compilerSelection,onCompilerSelection} from './compiler-selection.mjs';

const dwellTime=800,holdMargin=.25;
const contains=(rect,point,margin=0)=>point.x>=rect.left-rect.width*margin && point.x<=rect.right+rect.width*margin &&
  point.y>=rect.top-rect.height*margin && point.y<=rect.bottom+rect.height*margin;

function tooltipContent(entry) {
    const dom=document.createElement('div');dom.className='tw-language-hover';
    dom.setAttribute('role','tooltip');dom.dataset.entity=entry.entity;
    const signature=document.createElement('code');signature.className='tw-hover-signature';signature.textContent=entry.signature;
    dom.append(signature);
    const line=text=>{const row=document.createElement('div');row.textContent=text;dom.append(row);};
    line(entry.type?`${entry.kind} · ${entry.kind==='function'?'returns ':''}${entry.type}`:entry.kind);
    if(entry.size!==undefined)line(`${entry.kind==='function'?'Result: ':''}${entry.size} bytes · alignment ${entry.alignment}${entry.offset===undefined?'':` · field offset ${entry.offset}`}`);
    const details=document.createElement('div');details.className='tw-hover-node';
    details.textContent=`${entry.syntax || 'Syntax node'} · entity ${entry.entity} · ${entry.components} components`;
    details.title='Entity identifiers describe this query snapshot.';dom.append(details);
    if(entry.binding!==undefined && entry.binding!==entry.entity)line(`Resolves to entity ${entry.binding}`);
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
      else if(update.geometryChanged && this.current)this.current.rects=null;
    }
    reset() {clearTimeout(this.dwell);this.current=null;this.pending=null;}
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
        if(hover.dom && (hover.dom.contains(event.target) || contains(hover.dom.getBoundingClientRect(),this.pointer,holdMargin)) || this.overSymbol(hover,this.pointer))return;
        this.hide();
      }
      if(!this.view.contentDOM.contains(event.target)){this.hide();return;}
      if(hover && !hover.locked && this.overSymbol(hover,this.pointer)) {
        hover.anchor={...this.pointer};repositionTooltips(this.view);return;
      }
      this.inspect();
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
    render(entries) {
      const point=this.pointer,pos=this.view.posAtCoords(point);
      if(!entries || pos===null){this.hide();return;}
      // Hit-test the actual token rectangles, not the nearest caret in blank
      // space. The compiler still owns all symbol/type/range information.
      for(const side of [1,-1]) {
        const entry=hoverAt(entries,pos,side);
        if(!entry)continue;
        const rects=this.rects(entry);
        if(!rects.some(rect=>contains(rect,point)))continue;
        if(this.current?.entry===entry) {
          this.current.anchor={...point};repositionTooltips(this.view);return;
        }
        this.reset();
        const hover=this.current={entry,rects,anchor:{...point},locked:false,dom:null};
        const description={pos:entry.from,end:entry.to,above:true,clip:false,create:()=>{
          const dom=hover.dom=this.document.createElement('div');
          dom.className='tw-hover-panel tw-hover-preview';dom.append(tooltipContent(entry));
          return {dom,getCoords:()=>({left:hover.anchor.x,right:hover.anchor.x,top:hover.anchor.y-12,bottom:hover.anchor.y+18})};
        }};
        this.view.dispatch({effects:setHover.of(description)});
        // Dwell belongs to this source occurrence, not the last mouse event.
        this.dwell=setTimeout(()=>{
          if(this.current!==hover || !this.overSymbol(hover,this.pointer))return;
          hover.locked=true;hover.dom.classList.replace('tw-hover-preview','tw-hover-pinned');
        },dwellTime);
        return;
      }
      this.hide();
    }
    destroy() {
      this.destroyed=true;this.reset();clearTimeout(this.timer);this.unsubscribe();
      for(const remove of this.listeners)remove();
      currentDoc=null;value=null;documents.clear();
    }
  });
  return [hoverState,hover];
}
