import {test} from 'node:test';
import {CompletionQueries} from '../src/completion-queries.mjs';
import {editorSuite} from './editor_suite.mjs';
import {copyText, guestString} from './guest_text.mjs';
import {pageService} from './fixtures/page_service.mjs';

const json = (context, pointer) => JSON.parse(guestString(context, pointer));
const edited = (context, pointer) => Object.assign(structuredClone(payload), json(context, pointer));
let page, queries, calls, payload;
const byId = id => {
  const call = calls.find(call => call.task.id === id);
  if (!call) throw new Error('Unknown language request ' + id);
  return call;
};
function request(key, payload) {
  const {service} = page;
  const handle = service.request(key, payload);
  const task = service.queued.get(key) ?? service.active;
  const call = {task, handle, delivered:false};
  calls.push(call);
  handle.promise.then(value => Object.assign(call, {delivered:true, value}),
    error => { call.error = error; });
  return handle;
}
const run = editorSuite('completion_queries', ['payload.json'], {
  open_queries(context, base) {
    payload = json(context, base);
    // Retire pending work before installing the next independent prediction.
    page.service.stop();
    calls = [];
    queries = new CompletionQueries({request});
  },
  predict: (context, patch) => queries.predict(edited(context, patch)),
  retain_prediction: (context, patch) => queries.retain(edited(context, patch)),
  query(context, patch) {
    const handle = queries.query(edited(context, patch));
    return calls.find(call => call.handle === handle)?.task.id ?? -1;
  },
  request_count: () => calls.length,
  request_id: (_, index) => calls[index].task.id,
  request_key: (context, id) => copyText(context, byId(id).task.key),
  canceled: (_, id) => byId(id).task.canceled === true,
  delivered(_, id) {
    const call = byId(id);
    if (call.error) throw call.error;
    return call.delivered;
  },
  received_null: (_, id) => byId(id).value === null,
  reply(context, id, text) {
    const call = byId(id);
    call.answer = json(context, text);
    page.workers.at(-1).reply(id, call.answer);
  },
  received_reply: (_, id, sender) => byId(id).value === byId(sender).answer,
  start_request(context, key, text) {
    request(guestString(context, key), json(context, text));
    return calls.at(-1).task.id;
  },
  posted_id: () => page.workers.at(-1).posted.at(-1).id,
});

async function check(t, selection) {
  // Open the simulated page after reactor startup (a threaded compiler uses
  // the native Node Worker transport outside the page).
  const setup = () => {
    page = pageService(t);
  };
  try { await run(selection, setup); }
  finally { calls = queries = page = undefined; }
}

test('an exact prediction shares a ready or in-flight Tower response without another request', t => check(t, 'exact'));
test('source, cursor, file, grammar and imported source edits all invalidate predictions', t => check(t, 'edits'));
test('predictions are bounded to one query and an intervening edit cancels it', t => check(t, 'bounded'));
test('speculation cannot coalesce away a foreground query queued during startup', t => check(t, 'startup'));
