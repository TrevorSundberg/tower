import {readFile,writeFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {loadTower,runToEnd} from '../src/tower-host.mjs';
const root=new URL('../../',import.meta.url);
const read=name=>readFile(new URL(name,root),'utf8');
const bedrock=await read('scaffolding/bedrock.tower'),foundation=await read('scaffolding/foundation.tower');
const tower=await loadTower(await readFile(new URL('build/browser-wasi/tower.wasm',root)),undefined,foundation,undefined,bedrock,{tower:await read('scaffolding/tower.tower')});
async function towerFiles(folder){
 const files=[];
 for(const entry of await readdir(new URL(folder+'/',root),{withFileTypes:true})){
  const path=folder+'/'+entry.name;
  if(entry.isDirectory())files.push(...await towerFiles(path));
  else if(entry.name.endsWith('.tower'))files.push(path);
 }
 return files.sort();
}
const files=await towerFiles('scaffolding');
const inputs=await Promise.all(files.map(async path=>({path,text:await read(path)})));
tower.configureModules({files:inputs});
function format(file,source){
 tower.configureModules({entry:file});
 const handle=file.endsWith('/bedrock.tower')?tower.createBedrock(source):file.endsWith('/foundation.tower')?tower.createFoundation(source):tower.create(source);
 try{const parsed=runToEnd(tower,handle);assert.equal(parsed.end.status,'done',file+': '+parsed.end.error);const formatted=tower.format(handle);assert.equal(formatted.error,undefined,file);return {source:formatted.source,parsed,snapshot:tower.inspect(handle)};}
 finally{tower.destroy(handle);}
}
for(const file of files){
 const source=await read(file),first=format(file,source),second=format(file,first.source);
 assert.equal(second.source,first.source,file+': formatting must be idempotent');
 assert.deepEqual(second.snapshot.rules,first.snapshot.rules,file+': formatting must preserve grammar rules');
 assert.deepEqual(second.snapshot.tokens,first.snapshot.tokens,file+': formatting must preserve lexical rules');
 assert.deepEqual(second.parsed.events.filter(e=>e.status==='statement').map(e=>e.nodes.map(n=>[n.label,n.production,n.role])),first.parsed.events.filter(e=>e.status==='statement').map(e=>e.nodes.map(n=>[n.label,n.production,n.role])),file+': formatting must preserve statement trees');
 if(process.argv.includes('--write')){if(first.source!==source)await writeFile(new URL(file,root),first.source);}
 else assert.equal(first.source,source,file+': run npm run format:tower');
 console.log(file);
}
