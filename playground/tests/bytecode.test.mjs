import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {loadTower} from './compiler-fixtures.mjs';
const read=path=>readFile(new URL('../../'+path,import.meta.url));
const tower=await loadTower(await read('build/browser-wasi/tower.wasm'),undefined,(await read('scaffolding/foundation.tower')).toString());
const source='struct Pair { x: i32; y: i32; } fn sum(p: Pair*): i32 { var sum = p.x + p.y; return sum; } var pair: Pair; pair.x = 20; pair.y = 22; print(sum(&pair)); var text = "snow 雪"; print(text[5]); print(sizeof(usize));';
function finish(handle){let result,output='';do{result=tower.execute(handle,7);output+=result.output;}while(result.status==='executing');assert.equal(result.status,'done',result.error);return output;}
function checksum(bytes){const data=bytes.slice();let hash=14695981039346656037n;for(let i=0;i<data.length;i++){hash^=BigInt(i>=48&&i<56?0:data[i]);hash=BigInt.asUintN(64,hash*1099511628211n);}new DataView(data.buffer).setBigUint64(48,hash,true);return data;}
for(const width of [4,8])test('.towerbc v1 round trip, target layout and deterministic cache '+width,async()=>{
  const input=tower.compile(source,{pointerBytes:width});let loaded,round;
  try{
    const bytes=tower.bytecode(input), view=new DataView(bytes.buffer);
    assert.equal(new TextDecoder().decode(bytes.subarray(0,7)),'TOWERBC');
    assert.equal(view.getUint32(8,true),1);assert.equal(view.getUint32(12,true),2);assert.equal(view.getUint32(16,true),2);
    assert.equal(view.getUint32(20,true),width);
    loaded=tower.loadBytecode(bytes);
    const disassembly=tower.foundation(loaded).source;
    round=tower.compile(disassembly,{pointerBytes:width});
    assert.deepEqual(tower.bytecode(round),bytes,'foundation reconstruction reproduces the complete package');
    assert.equal(finish(loaded),finish(input));
    assert.equal(finish(round),`42\n233\n${width}\n`);
    await writeFile(new URL(`../../build/bytecode-cross-${width}.towerbc`,import.meta.url),bytes);
  }finally{for(const h of [input,loaded,round])if(h)tower.destroyExecution(h);}
});
test('untrusted packages validate bounds, versions, checksums and actual code before executing',()=>{
  const handle=tower.compile('print(42);'), bytes=tower.bytecode(handle);tower.destroyExecution(handle);
  for(const size of [0,7,55,bytes.length-1])assert.throws(()=>tower.loadBytecode(bytes.slice(0,size)),/length/);
  for(const [offset,value,pattern] of [[0,0,/magic/],[8,2,/container version/],[12,1,/semantics version/],[16,1,/cache version/],[20,16,/target layout/],[24,3,/profile/],[28,0xffffffff,/bounds/],[32,0xffffffff,/bounds/],[36,0xffffffff,/bounds/],[40,1,/bounds/],[44,1,/flags/]]){
    const bad=bytes.slice();new DataView(bad.buffer).setUint32(offset,value,true);assert.throws(()=>tower.loadBytecode(bad),pattern);
  }
  const bad=bytes.slice();bad[bad.length-1]^=1;
  assert.throws(()=>tower.loadBytecode(bad),/checksum/);
  assert.throws(()=>tower.loadBytecode(checksum(bad)),/cache disagrees/,'valid checksum cannot authorize incorrect instructions');
  const nodes=tower.exports.tw_live_nodes(),allocations=tower.exports.tw_live_allocations();
  for(let i=0;i<20;i++)assert.throws(()=>tower.loadBytecode(checksum(bad)),/cache disagrees/);
  assert.equal(tower.exports.tw_live_nodes(),nodes);assert.equal(tower.exports.tw_live_allocations(),allocations);
});

test('canonical packages preserve checked handles across custom grammar installation',async()=>{
  const foundation=(await read('scaffolding/foundation.tower')).toString();
  const customized=foundation.replace('import bedrock;', 'import bedrock;\ntoken Identifier = /[A-Za-z_][A-Za-z0-9_-]*/ as identifier;');
  tower.configure(customized);
  const handle=tower.compile('var player-name: i32 = 42; print(player-name);');
  let loaded;
  try{
    tower.useFast(handle);
    tower.configure(foundation);
    loaded=tower.loadBytecode(tower.bytecode(handle));
    assert.match(tower.foundation(loaded).source,/`player-name`/);
    assert.equal(finish(loaded),'42\n');
    assert.equal(finish(handle),'42\n');
  }finally{tower.configure(foundation);for(const h of [handle,loaded])if(h)tower.destroyExecution(h);}
});
