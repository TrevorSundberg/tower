import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DiagnosticDelay} from '../src/diagnostic-delay.mjs';

function fixture() {
  let now=0, id=0; const timers=new Map(), published=[];
  const delay=new DiagnosticDelay((...event)=>published.push(event),{
    setTimer(fn,ms) {timers.set(++id,{at:now+ms,fn});return id;},
    clearTimer(id) {timers.delete(id);},
  });
  return {delay,published,advance(ms) {
    now+=ms;
    for(const [id,timer] of timers)if(timer.at<=now){timers.delete(id);timer.fn();}
  }};
}
test('typing resets the ten-second deadline and releases only the newest revision',()=>{
  const {delay,published,advance}=fixture();
  delay.edit(1);delay.update('editor','first',1);advance(9999);
  assert.deepEqual(published,[]);
  delay.edit(2);delay.update('editor','stale',1);delay.update('editor','second',2);
  advance(9999);assert.deepEqual(published,[]);
  advance(1);assert.deepEqual(published,[['editor','second']]);
  delay.update('editor','late current result',2);
  assert.equal(published.at(-1)[1],'late current result');
});
test('cursor departure releases pending errors and future replies for the same revision',()=>{
  const {delay,published}=fixture();
  delay.edit(1);delay.update('editor','parse',1);delay.update('output','runtime',1);
  delay.reveal();delay.update('native','compile',1);
  assert.deepEqual(published,[['editor','parse'],['output','runtime'],['native','compile']]);
});
test('successful results clear errors immediately and cancel their deferred replacement',()=>{
  const {delay,published,advance}=fixture();
  delay.edit(1);delay.update('editor','error',1);delay.update('editor',null,1);
  assert.deepEqual(published,[['editor',null]]);
  advance(10000);assert.equal(published.length,1);
});
test('switching documents discards pending errors and idle timers',()=>{
  const {delay,published,advance}=fixture();
  delay.edit(1);delay.update('editor','old file',1);delay.reset(2);
  delay.update('editor','late old file',1);advance(10000);
  assert.deepEqual(published,[]);
  delay.update('editor','new file',2);assert.deepEqual(published,[['editor','new file']]);
});
