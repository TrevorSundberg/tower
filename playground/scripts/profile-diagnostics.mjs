// Warm parser error cost, with an optional previous tower.wasm for comparison.
import {readFile,writeFile} from 'node:fs/promises';
import {loadTower,runToEnd} from '../src/tower-host.mjs';
const root=new URL('../../',import.meta.url);
const read=name=>readFile(new URL(name,root));
const foundation=(await read('scaffolding/foundation.tower')).toString();
const bedrock=(await read('scaffolding/bedrock.tower')).toString();
const versions=[['after',await read('build/browser-wasi/tower.wasm')]];
if(process.argv[2])versions.unshift(['before',await readFile(process.argv[2])]);
const report={method:'Median/p95 of 40 warm reset+parse+JSON requests after 8 warmups; milliseconds. Includes source metadata and grammar cache lookup.',versions:{}};
for(const [name,bytes] of versions){
 const tower=await loadTower(bytes,undefined,foundation,undefined,bedrock), results=report.versions[name]={};
 for(const [shape,source] of [
  ['valid','var answer: i32 = 42;\nprint(answer);'],
  ['semicolon','print(42)\nvar answer: i32;'],
  ['number-followed-by-call','var answer: i32 = 42\nprint(answer);'],
  ['user-keyword',"parse Statement = 'say' Number 'done';\nsay 42\nsay 43 done"],
  ['ambiguous',"parse Statement = 'a' ',' 'b' | 'a' ':' 'b'; a b"],
  ['deep-invalid',"parse Value = '(' Value ')' | Number;parse Statement = Value ';';"+'('.repeat(2048)+'42;'],
 ]){
  const handle=tower.create(source), samples=[];
  try{for(let i=0;i<48;i++){
   const start=performance.now();tower.reset(handle,source);const {end}=runToEnd(tower,handle);const elapsed=performance.now()-start;
   if(end.status!==(shape==='valid'?'done':'error'))throw new Error(end.error||'Expected error');
   if(i>=8)samples.push(elapsed);
  }}finally{tower.destroy(handle);}
  samples.sort((a,b)=>a-b);results[shape]={medianMs:+samples[20].toFixed(3),p95Ms:+samples[38].toFixed(3)};
 }
}
await writeFile(new URL('build/diagnostics-profile.json',root),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
