import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LanguageService} from '../src/language-service.mjs';

test('foreground completion runs before queued document preparation on the same worker',async()=>{
  const previous=globalThis.Worker,posted=[];
  globalThis.Worker=class {
    postMessage(message){posted.push(message);}
    terminate(){}
  };
  const service=new LanguageService();
  try {
    const warm=service.request('warm',{method:'warm'});
    const document=service.request('document',{method:'document'});
    const completion=service.request('complete',{method:'complete'});
    service.worker.onmessage({data:{id:posted[0].id,result:null}});await warm.promise;
    assert.equal(posted[1].method,'complete');
    service.worker.onmessage({data:{id:posted[1].id,result:{options:[]}}});await completion.promise;
    assert.equal(posted[2].method,'document');
    service.worker.onmessage({data:{id:posted[2].id,result:{entries:[]}}});await document.promise;
    assert.equal(posted.length,3);
  } finally {service.stop();globalThis.Worker=previous;}
});

test('a long document inspection yields its worker to foreground completion',async()=>{
  const previous=globalThis.Worker,workers=[];
  globalThis.Worker=class {
    constructor(){this.posted=[];workers.push(this);}
    postMessage(message){this.posted.push(message);}
    terminate(){this.terminated=true;}
  };
  const service=new LanguageService();
  try {
    const document=service.request('document',{method:'document'});
    const completion=service.request('complete',{method:'complete'});
    assert.equal(await document.promise,null);
    assert.equal(workers[0].terminated,true);assert.equal(workers.length,2);
    const message=workers[1].posted[0];assert.equal(message.method,'complete');
    workers[1].onmessage({data:{id:message.id,result:{options:[]}}});
    assert.deepEqual(await completion.promise,{options:[]});
  } finally {service.stop();globalThis.Worker=previous;}
});
