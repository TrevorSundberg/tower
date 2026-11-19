import {compilerSelection} from './compiler-selection.mjs';
import {byteOffsets} from './offsets.mjs';

// Shared direct-query input identity for completion and document inspection.
// No protocol server, source parser, symbol table or type resolver lives here.
const encoder=new TextEncoder();
export function languagePayload(configuration,source,method,position=0) {
  const config=configuration();
  return {...config,compilerRevision:compilerSelection().revision,method,source,
    cursor:encoder.encode(source.slice(0,position)).length,builtins:{...config.builtins},
    files:config.files?.filter(file=>file.path.endsWith('.tower')).map(file=>({path:file.path,text:file.path===config.activePath?source:file.text}))};
}

export function hoverIndex(source,result) {
  const offsets=byteOffsets(source);
  const entries=(result?.entries??[]).map(entry=>({...entry,from:offsets[entry.from],to:offsets[entry.to]}))
    .filter(entry=>Number.isInteger(entry.from)&&Number.isInteger(entry.to)&&entry.from<entry.to)
    .sort((a,b)=>a.from-b.from || b.to-a.to);
  let end=0;
  return entries.map(entry=>{end=Math.max(end,entry.to);return {...entry,maxEnd:end};});
}

// Interval lookup only. Tower already selected the bound entity, type,
// signature and syntax hierarchy for every entry, including generated nodes.
export function hoverAt(entries,position,side=1) {
  if(side<0)position--;
  let lo=0,hi=entries.length;
  while(lo<hi){const mid=(lo+hi)>>>1;if(entries[mid].from<=position)lo=mid+1;else hi=mid;}
  let best=null;
  for(let i=lo-1;i>=0&&entries[i].maxEnd>position;i--) {
    const entry=entries[i];
    if(entry.to>position && (!best || entry.to-entry.from<best.to-best.from))best=entry;
  }
  return best;
}

export class DocumentQueries {
  constructor(service) {this.service=service;this.current=null;}
  request(payload) {
    const key=JSON.stringify(payload);
    if(this.current?.key===key)return this.current.value??this.current.promise;
    this.clear();
    const request=this.service.request('document',payload);
    const current={key,request};this.current=current;
    current.promise=request.promise.then(result=>{
      if(this.current!==current)return null;
      if(!result){this.current=null;return null;}
      return current.value=hoverIndex(payload.source,result);
    },()=>{if(this.current===current)this.current=null;return null;});
    return current.promise;
  }
  clear() {this.current?.request.cancel();this.current=null;}
}
