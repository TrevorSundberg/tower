import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower,runToEnd} from './compiler-fixtures.mjs';
const read=path=>readFile(new URL('../../'+path,import.meta.url));
const tower=await loadTower(process.env.TOWER_TEST_WASM ? undefined : await read('build/browser-wasi/tower.wasm'),undefined,
  (await read('scaffolding/foundation.tower')).toString(),undefined,
  (await read('scaffolding/bedrock.tower')).toString());
function format(input){
  const handle=tower.create(input);
  try {
    const parsed=runToEnd(tower,handle);
    assert.equal(parsed.end.status,'done',parsed.end.error);
    const result=tower.format(handle);
    assert.equal(result.error,undefined);
    return result;
  } finally {tower.destroy(handle);}
}
function foundation(input){
  const handle=tower.compile(input);
  try {
    const result=tower.foundation(handle);
    assert.equal(result.error,undefined);
    assert.ok(result.source);
    return result;
  } finally {tower.destroyExecution(handle);}
}
test('formatter preserves exact UTF-8 source token mappings through comments and blank lines',()=>{
  const input='import foundation;\n// π\n var `é space`:i32=42;\n\nprint(`é space`); // final\n';
  const result=format(input);
  const original=Buffer.from(input), formatted=Buffer.from(result.source);
  assert.equal(result.source,'import foundation;\n// π\nvar `é space`: i32 = 42;\n\nprint(`é space`);\n// final\n');
  for(const span of result.spans){
    assert.deepEqual(formatted.subarray(span.begin,span.end),
      original.subarray(span.source,span.source+span.end-span.begin));
  }
  assert.deepEqual(format(input),result);
  assert.equal(format(result.source).source,result.source);
});
test('formatter round trips signed minima, unsigned maxima, pointer/array types and builtins',()=>{
  const input='import foundation; var lo:i64=-9223372036854775808;var hi:u64=18446744073709551615;'+
    'var a:i32[2];var p:i32*=&a[0];*p=1;var x:usize=sizeof(i32);x=alignof(i32);'+
    'p=alloc(i32,2);p=realloc(i32,p,3);fill(p,0,12);copy(p,p,12);free(p);';
  const result=foundation(input);
  assert.equal(foundation(result.source).source,result.source);
  assert.match(result.source,/-9223372036854775808/);
  assert.match(result.source,/18446744073709551615/);
  assert.deepEqual(foundation(input),result);
});
test('deterministic spacing trials preserve source and foundation round trips',()=>{
  let state=0x464d5421;
  const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state;};
  const gaps=[' ','  ','\t','\n','\n\n'];
  for(let trial=0;trial<100;trial++){
    const tokens=['var','x',':','i32','=','41',';','// retained\n','x','=','x','+','1',';','print','(','x',')',';'];
    const input='import foundation;\n'+tokens.map(t=>t+gaps[random()%gaps.length]).join('');
    const result=format(input);
    assert.equal(format(result.source).source,result.source);
    assert.equal(foundation(result.source).source,foundation(input).source);
  }
});
