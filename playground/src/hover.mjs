import {ViewPlugin,hoverTooltip,closeHoverTooltips} from '@codemirror/view';
import {DocumentQueries,languagePayload,hoverAt} from './language-queries.mjs';
import {compilerSelection,onCompilerSelection} from './compiler-selection.mjs';

function tooltip(entry) {
  return {pos:entry.from,end:entry.to,above:true,create() {
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
    return {dom};
  }};
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
  const prepare=ViewPlugin.fromClass(class {
    constructor(view) {
      this.view=view;this.schedule();
      this.unsubscribe=onCompilerSelection(()=>{
        currentDoc=null;documents.clear();this.schedule();
        queueMicrotask(()=>{if(!this.destroyed)view.dispatch({effects:closeHoverTooltips});});
      });
    }
    schedule() {clearTimeout(this.timer);this.timer=setTimeout(()=>query(this.view),150);}
    update(update) {
      if(update.docChanged) {currentDoc=null;value=null;documents.clear();this.schedule();}
    }
    destroy() {this.destroyed=true;clearTimeout(this.timer);this.unsubscribe();currentDoc=null;value=null;documents.clear();}
  });
  const hover=hoverTooltip((view,position,side)=>{
    const doc=view.state.doc,revision=compilerSelection().revision,width=configuration().pointerBytes??4;
    const render=entries=>{
      if(!entries || doc!==view.state.doc || revision!==compilerSelection().revision || width!==(configuration().pointerBytes??4))return null;
      const entry=hoverAt(entries,position,side);return entry?tooltip(entry):null;
    };
    const result=query(view);
    return result?.then?result.then(render):render(result);
  },{
    // CodeMirror interprets zero as its 300 ms default. One millisecond is its
    // smallest usable trigger; a ready index involves no worker round trip.
    hoverTime:1,hideOnChange:true,
  });
  return [prepare,hover];
}
