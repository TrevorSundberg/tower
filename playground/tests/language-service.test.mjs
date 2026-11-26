import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pageService} from './fixtures/page_service.mjs';

test('foreground completion runs before queued document preparation on the same worker', async t => {
  const {service, workers} = pageService(t);
  const warm = service.request('warm', {method:'warm'});
  const document = service.request('document', {method:'document'});
  const completion = service.request('complete', {method:'complete'});
  const [worker] = workers;
  assert.deepEqual(worker.posted.map(request => request.method), ['warm']);
  worker.reply(worker.posted[0].id, null);
  await warm.promise;
  assert.equal(worker.posted[1].method, 'complete');
  worker.reply(worker.posted[1].id, {options:[]});
  assert.deepEqual(await completion.promise, {options:[]});
  assert.equal(worker.posted[2].method, 'document');
  worker.reply(worker.posted[2].id, {entries:[]});
  assert.deepEqual(await document.promise, {entries:[]});
  assert.equal(worker.posted.length, 3);
  assert.equal(workers.length, 1);
});

test('a long document inspection yields its worker to foreground completion', async t => {
  const {service, workers} = pageService(t);
  const document = service.request('document', {method:'document'});
  const completion = service.request('complete', {method:'complete'});
  assert.equal(await document.promise, null);
  assert.equal(workers[0].terminated, true);
  assert.equal(workers.length, 2);
  const [request] = workers[1].posted;
  assert.equal(request.method, 'complete');
  workers[0].reply(request.id, {options:['stale']});
  workers[1].reply(request.id, {options:['current']});
  assert.deepEqual(await completion.promise, {options:['current']});
});

test('an invalidated document stops its synchronous work before the next snapshot', async t => {
  const {service, workers} = pageService(t);
  const old = service.request('document', {method:'document', source:'old'});
  old.cancel();
  assert.equal(await old.promise, null);
  assert.equal(workers[0].terminated, true);
  const next = service.request('document', {method:'document', source:'new'});
  const [request] = workers[1].posted;
  assert.equal(request.source, 'new');
  workers[0].reply(request.id, {entries:['old']});
  workers[1].reply(request.id, {entries:['new']});
  assert.deepEqual(await next.promise, {entries:['new']});
});
