import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower} from './compiler-fixtures.mjs';
import {DocumentQueries,hoverAt,hoverIndex,hasHoverDetails} from '../src/language-queries.mjs';
const read=name=>readFile(new URL('../../'+name,import.meta.url));
const tower=await loadTower(await read('build/browser-wasi/tower.wasm'),undefined,
  (await read('scaffolding/foundation.tower')).toString(),undefined,(await read('scaffolding/bedrock.tower')).toString());
function inspect(source) {
  tower.configureModules({entry:'input.tower',files:[]});
  const result=tower.inspectDocument(source);assert.equal(result.error,undefined);
  return hoverIndex(source,result);
}
function at(source,needle) {return hoverAt(inspect(source),source.lastIndexOf(needle)+1);}

// Semantic fixtures and assertions run through npm test:ide in Tower.
test('invalid document requests become host exceptions',()=>{
  assert.throws(()=>tower.inspectDocument('import foundation; var pointer:i32*;',{pointerBytes:3}),/Invalid/);
  assert.throws(()=>tower.inspectDocument('import foundation; var x:i32;\0print(x);'),/Invalid/);
});

test('Unicode ranges use UTF-8 transport and UTF-16 editor offsets; comments stay empty',()=>{
  const source='import foundation;\n// 雪🚀\nvar `雪`:i32 = 42; print(`雪`);';
  const entries=inspect(source),entry=hoverAt(entries,source.lastIndexOf('雪'));
  assert.equal(entry.signature,'var `雪`: i32');assert.equal(entry.type,'i32');
  assert.equal(source.slice(entry.from,entry.to),'`雪`');
  assert.equal(hoverAt(entries,source.indexOf('🚀')),null);
});

test('presentation hides bare syntax tokens and converts declaration offsets after Unicode',()=>{
  const source='import foundation;\n// 雪🚀\nvar value = 42;\nprint(value);';
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
