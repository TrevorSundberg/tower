import {test} from 'node:test';
import {editorSuite} from './editor_suite.mjs';
import {guestString} from './guest_text.mjs';
import {pageService} from './fixtures/page_service.mjs';

let page, calls, values, pending;
const json = (ctx, text) => JSON.parse(guestString(ctx, text));
const keep = value => values.push(value) - 1;
const enumerable = (value, key) => Object.prototype.propertyIsEnumerable.call(value, key);

const run = editorSuite('language_service', [], {
  request(ctx, key, payload) {
    const handle = page.service.request(guestString(ctx, key), json(ctx, payload));
    const call = {handle, done:false};
    call.delivery = handle.promise.then(value => { call.value = value; call.done = true; },
      error => { call.error = error; call.done = true; });
    return calls.push(call) - 1;
  },
  cancel: (_, call) => calls[call].handle.cancel(),
  delivered(_, index) {
    const call = calls[index];
    pending = call.delivery;
    if ('error' in call) throw call.error;
    return call.done;
  },
  result: (_, call) => keep(calls[call].value),
  worker_count: () => page.workers.length,
  terminated: (_, worker) => page.workers[worker].terminated === true,
  post_count: (_, worker) => page.workers[worker].posted.length,
  posted_id: (_, worker, index) => page.workers[worker].posted[index].id,
  posted_field: (ctx, worker, index, key) => keep(page.workers[worker].posted[index]?.[guestString(ctx, key)]),
  reply: (ctx, worker, id, payload) => page.workers[worker].reply(id, json(ctx, payload)),

  is_null: (_, id) => values[id] === null,
  plain_record: (_, id) => Object.prototype.toString.call(values[id]) === '[object Object]' &&
    Object.getPrototypeOf(values[id]) === Object.prototype,
  plain_array: (_, id) => Array.isArray(values[id]) && Object.getPrototypeOf(values[id]) === Array.prototype,
  array_length: (_, id) => values[id].length,
  field_count: (_, id) => Reflect.ownKeys(values[id]).filter(key => enumerable(values[id], key)).length,
  field(ctx, id, name) {
    const key = guestString(ctx, name);
    return keep(enumerable(values[id], key) ? values[id][key] : undefined);
  },
  string_length: (_, id) => typeof values[id] === 'string' ? values[id].length : -1,
  code_unit: (_, id, index) => values[id].charCodeAt(index),
}, () => pending);

async function check(t, name) {
  try {
    await run(name, () => {
      page = pageService(t);
      calls = [];
      values = [];
    });
  } finally { page = calls = values = pending = undefined; }
}

test('foreground completion runs before queued document preparation on the same worker', t => check(t, 'order'));
test('a long document inspection yields its worker to foreground completion', t => check(t, 'preempt'));
test('an invalidated document stops its synchronous work before the next snapshot', t => check(t, 'cancel'));
