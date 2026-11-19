import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CompletionQueries} from '../src/completion-queries.mjs';

function fixture() {
  const calls=[];
  const queries=new CompletionQueries({request(key,payload) {
    let resolve;const promise=new Promise(done=>resolve=done);
    const request={promise,resolve,cancel(){request.canceled=true;resolve(null);}};
    calls.push({key,payload,request});return request;
  }});
  const payload={method:'complete',source:'point.',cursor:6,activePath:'main.tower',compilerRevision:0,library:'.tower',
    foundation:'foundation',bedrock:'bedrock',builtins:{tower:'tower'},files:[{path:'lib.tower',text:'struct Point { x:i32; }'}]};
  return {queries,calls,payload};
}
test('an exact prediction shares a ready or in-flight Tower response without another request',async()=>{
  for(const ready of [false,true]) {
    const {queries,calls,payload}=fixture();queries.predict(payload);
    const answer={options:[{label:'x'}]};if(ready)calls[0].request.resolve(answer);
    queries.retain(structuredClone(payload));
    const query=queries.query(structuredClone(payload));
    if(!ready)calls[0].request.resolve(answer);
    assert.equal(await query.promise,answer);assert.equal(calls.length,1);
  }
});
test('source, cursor, file, grammar and imported source edits all invalidate predictions',()=>{
  for(const change of [p=>p.source+=' ',p=>p.cursor--,p=>p.activePath='other.tower',
    p=>p.foundation+=' ',p=>p.bedrock+=' ',p=>p.builtins.tower+=' ',p=>p.files[0].text+=' ',p=>p.compilerRevision++,p=>p.library='.']) {
    const {queries,calls,payload}=fixture();queries.predict(payload);
    const next=structuredClone(payload);change(next);queries.query(next);
    assert.equal(calls.length,2);assert.equal(calls[0].request.canceled,true);
  }
});
test('predictions are bounded to one query and an intervening edit cancels it',()=>{
  const {queries,calls,payload}=fixture();queries.predict(payload);queries.predict(payload);
  assert.equal(calls.length,1);
  queries.predict({...payload,cursor:0});assert.equal(calls[0].request.canceled,true);
  queries.retain(payload);assert.equal(calls[1].request.canceled,true);
});
test('speculation cannot coalesce away a foreground query queued during startup',()=>{
  const {queries,calls,payload}=fixture();
  queries.query({...payload,source:'point',cursor:5});queries.predict(payload);
  assert.deepEqual(calls.map(call=>call.key),['complete','prediction']);
  assert.equal(calls[0].request.canceled,undefined);
});
