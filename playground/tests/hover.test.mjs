import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower} from './compiler-fixtures.mjs';
import {DocumentQueries,hoverAt,hoverIndex,hasHoverDetails} from '../src/language-queries.mjs';
const read=name=>readFile(new URL('../../'+name,import.meta.url));
const tower=await loadTower(await read('build/browser-wasi/tower.wasm'),undefined,
  (await read('scaffolding/foundation.tower')).toString(),undefined,(await read('scaffolding/bedrock.tower')).toString());
function inspect(source,options={}) {
  tower.configureModules({entry:options.entry??'input.tower',files:options.files??[]});
  const result=tower.inspectDocument(source,options);assert.equal(result.error,undefined);
  return hoverIndex(source,result);
}
function at(source,needle,options) {return hoverAt(inspect(source,options),source.lastIndexOf(needle)+1);}

test('hover resolves lexical shadowing, parameters and inferred locals on shared entities',()=>{
  const source='var value: bool = true; fn demo(value:i32):i32 { var local = value; return local; } print(value);';
  const entries=inspect(source);
  const parameter=hoverAt(entries,source.indexOf('= value;')+3);
  assert.equal(parameter.signature,'value: i32');assert.equal(parameter.kind,'parameter');
  assert.equal(at(source,'local;').signature,'var local: i32');
  const global=at(source,'value);');assert.equal(global.type,'bool');assert.equal(global.kind,'global variable');
  assert.ok(global.entity>0);assert.ok(global.binding>0);assert.notEqual(global.entity,global.binding);
  assert.equal(global.syntax,'CoreLocation');assert.ok(global.components>=2);
});
test('function names and calls share canonical typed signatures',()=>{
  const source='fn add(a:i32,b:i32):i32 { var sum = a + b; return sum; } print(add(1,2));';
  assert.equal(at(source,'add(1').signature,'fn add(a: i32, b: i32): i32');
  assert.equal(at(source,'i32 {').signature,'i32');
});
test('members, pointer receivers, nominal types and layouts come from checked fields',()=>{
  const source='struct Point { first:i32; ready:bool; } var p:Point; var pointer = &p; pointer.ready = true; print(pointer.ready);';
  const field=at(source,'ready);');assert.equal(field.signature,'ready: bool');assert.equal(field.kind,'field');
  assert.equal(field.offset,4);assert.equal(field.size,1);
  assert.equal(at(source,'pointer.ready);').type,'Point*');
  assert.equal(at(source,'Point;').kind,'type');
});
test('imports contribute real bindings without leaking their source ranges',()=>{
  const source='import tower; import "helper"; var result = answer(); print(result);';
  const entries=inspect(source,{files:[{path:'helper.tower',text:'import tower; fn answer():i32 { return 42; }'}]});
  const call=hoverAt(entries,source.indexOf('answer')+2);
  assert.equal(call.signature,'fn answer(): i32');assert.equal(call.declaration,undefined);
  assert.equal(hoverAt(entries,source.lastIndexOf('result')+2).type,'i32');
  assert.ok(entries.every(entry=>entry.to<=source.length));
});

test('dotted import segments retain their own source entities during hover inspection',()=>{
  const source='import tower; import helpers.answer; import "helpers/answer"; print(answer());';
  const entries=inspect(source,{files:[{path:'helpers/answer.tower',text:'import tower; fn answer():i32 { return 42; }'}]});
  const segments=['tower','helpers','answer'].map(name=>hoverAt(entries,source.indexOf(name)+1));
  assert.deepEqual(segments.map(entry=>entry.signature),['tower','helpers','answer']);
  assert.equal(new Set(segments.map(entry=>entry.entity)).size,3);
  for (const entry of segments) {
    assert.ok(entry.entity>0&&entry.components>0);
    assert.equal(source.slice(entry.from,entry.to),entry.signature);
    assert.equal(entry.type,undefined);
  }
  assert.equal(hoverAt(entries,source.lastIndexOf('answer')+1).signature,'fn answer(): i32');
});

test('enum member declarations and accesses use their nominal type and canonical spelling',()=>{
  const source='enum State:u32 { Idle = 0, Busy = 4 } var state:State = State.Busy;';
  const entries=inspect(source),member=hoverAt(entries,source.lastIndexOf('Busy')+1);
  assert.equal(member.signature,'State.Busy');assert.equal(member.kind,'enum member');
  assert.equal(member.type,'State');assert.equal(member.size,4);
  assert.equal(hoverAt(entries,source.indexOf('Busy')+1).signature,'State.Busy');
});
test('hover layouts use the explicit target pointer width',()=>{
  const source='var pointer:i32*;';
  assert.equal(at(source,'pointer', {pointerBytes:4}).size,4);
  assert.equal(at(source,'pointer', {pointerBytes:8}).size,8);
  assert.throws(()=>tower.inspectDocument(source,{pointerBytes:3}),/Invalid/);
  assert.throws(()=>tower.inspectDocument('var x:i32;\0print(x);'),/Invalid/);
});
test('Unicode ranges use UTF-8 transport and UTF-16 editor offsets; comments stay empty',()=>{
  const source='// 雪🚀\nvar `雪`:i32 = 42; print(`雪`);';
  const entries=inspect(source),entry=hoverAt(entries,source.lastIndexOf('雪'));
  assert.equal(entry.signature,'var `雪`: i32');assert.equal(entry.type,'i32');
  assert.equal(source.slice(entry.from,entry.to),'`雪`');
  assert.equal(hoverAt(entries,source.indexOf('🚀')),null);
});
test('incomplete suffixes retain checked earlier declarations and edits never reuse old types',()=>{
  const source='var answer:i32 = 42; print(answer); var unfinished:';
  assert.equal(at(source,'answer);').type,'i32');
  assert.equal(at('var answer:bool = true; print(answer);','answer);').type,'bool');
  const broken='var answer:i32 = true; print(answer);';
  assert.ok(inspect(broken).every(entry=>entry.type===undefined));
});
test('grammar files expose syntax/entity metadata under their own baseline',()=>{
  for(const editingModule of ['bedrock','foundation']) {
    const entries=inspect("parse Example = Identifier ';';",{editingModule});
    assert.ok(entries.length);assert.ok(entries.every(entry=>entry.entity>0&&entry.components>0));
  }
});
test('document queries release their temporary shared entities after repeated inspection',()=>{
  const source='// Point documentation\nstruct Point { x:i32; }\n// Instance documentation\nvar p:Point; print(p.x);';inspect(source);
  const nodes=tower.exports.tw_live_nodes(),allocations=tower.exports.tw_live_allocations();
  for(let i=0;i<30;i++)inspect(source);
  assert.equal(tower.exports.tw_live_nodes(),nodes);assert.equal(tower.exports.tw_live_allocations(),allocations);
});

test('hover documentation shares attached comments for local and imported bindings',()=>{
  const source='// Adds a value.\n// Keeps the original.\nfn increment(value:i32):i32 { var result = value + 1; return result; }\nprint(increment(41));';
  assert.equal(at(source,'increment(41').documentation,'Adds a value.\nKeeps the original.');
  assert.equal(hoverAt(inspect(source),source.indexOf('increment')+1).documentation,'Adds a value.\nKeeps the original.');
  const imported='import tower; import "helper"; print(answer());';
  const options={files:[{path:'helper.tower',text:'import tower;\n// The imported answer.\nfn answer():i32 { return 42; }'}]};
  assert.equal(at(imported,'answer()',options).documentation,'The imported answer.');
});

test('the templates example exposes push documentation at the declaration and resolved calls',async()=>{
  const source=(await read('scaffolding/examples/templates.tower')).toString();
  const entries=inspect(source),declaration=hoverAt(entries,source.indexOf('push(')+1),call=hoverAt(entries,source.lastIndexOf('push(')+1);
  for(const entry of [declaration,call])assert.match(entry.documentation??'',/This small example assumes there is space to push and a value to pop/);
  assert.match(call.signature,/i32/);
});

test('presentation hides bare syntax tokens and converts declaration offsets after Unicode',()=>{
  const source='// 雪🚀\nvar value = 42;\nprint(value);';
  const entry=at(source,'value);');assert.equal(entry.declarationFrom,source.indexOf('var value'));
  assert.equal(entry.documentation,'雪🚀');
  assert.equal(hasHoverDetails(entry,'value'),true);
  for(const text of ['var',';','unknown'])assert.equal(hasHoverDetails({kind:'syntax',signature:text},text),false);
  assert.equal(hasHoverDetails({kind:'type',signature:'i32',type:'i32'},'i32'),true);
});
test('the presentation index selects the smallest containing range and respects token edges',()=>{
  const entries=hoverIndex('abcdef',{entries:[{from:0,to:6,signature:'outer'},{from:2,to:4,signature:'inner'}]});
  assert.equal(hoverAt(entries,3).signature,'inner');assert.equal(hoverAt(entries,4).signature,'outer');
  assert.equal(hoverAt(entries,4,-1).signature,'inner');assert.equal(hoverAt(entries,6),null);
});
test('document cache shares work and rejects replies from old inputs',async()=>{
  const calls=[];const cache=new DocumentQueries({request(key,payload){let resolve;const promise=new Promise(done=>resolve=done);const request={promise,cancel(){request.canceled=true;}};calls.push({key,payload,resolve,request});return request;}});
  const a={source:'x',compilerRevision:0},b={source:'y',compilerRevision:0};
  const first=cache.request(a);assert.equal(cache.request(a),first);
  const second=cache.request(b);assert.equal(calls[0].request.canceled,true);
  calls[0].resolve({entries:[{from:0,to:1,signature:'old'}]});assert.equal(await first,null);
  calls[1].resolve({entries:[{from:0,to:1,signature:'new'}]});const ready=await second;
  assert.equal(cache.request(b),ready);assert.equal(ready[0].signature,'new');
  cache.request({...b,compilerRevision:1});assert.equal(calls.length,3);cache.clear();
});

test('a canceled document request can be retried for the same snapshot',async()=>{
  let count=0;
  const cache=new DocumentQueries({request(){count++;return {promise:Promise.resolve(null),cancel(){}};}});
  assert.equal(await cache.request({source:'x'}),null);
  assert.equal(await cache.request({source:'x'}),null);assert.equal(count,2);
});
