import {after, test} from 'node:test';
import {editorSuite} from './editor_suite.mjs';
import {guestString} from './guest_text.mjs';
import {moduleHost, moduleText} from './module_case_host.mjs';
import {DocumentQueries, hoverAt, hoverIndex, hasHoverDetails} from '../src/language-queries.mjs';

const tower = await moduleHost();
after(() => tower.close());
const json = (ctx, pointer) => JSON.parse(guestString(ctx, pointer));
let source, entries, entry;
let cache, calls, snapshots, values, deliveries;

function handle(value) {
  const index = values.indexOf(value);
  return index < 0 ? values.push(value) - 1 : index;
}

const run = editorSuite('hover_queries', ['inputs/unicode.tower', 'inputs/documentation.tower'], {
  inspect_exception(ctx, text, afterNul, options) {
    const input = guestString(ctx, text) + (afterNul ? '\0' + guestString(ctx, afterNul) : '');
    const configuration = options ? json(ctx, options) : undefined;
    try { tower.inspectDocument(input, configuration); }
    catch (error) { return moduleText(ctx, error.message); }
    return moduleText(ctx, '');
  },
  inspect_source(ctx, text) {
    source = guestString(ctx, text);
    tower.configureModules({entry:'input.tower', files:[]});
    const result = tower.inspectDocument(source);
    entries = hoverIndex(source, result);
    return result.error === undefined ? 0 : moduleText(ctx, result.error);
  },
  index_reply(ctx, text, reply) {
    source = guestString(ctx, text);
    entries = hoverIndex(source, json(ctx, reply));
  },
  select_hover(_ctx, position) { entry = hoverAt(entries, position); },
  select_hover_side(_ctx, position, side) { entry = hoverAt(entries, position, side); },
  hover_is_null: () => entry === null,
  hover_text: (ctx, field) => moduleText(ctx, entry[guestString(ctx, field)]),
  hover_offset: (ctx, field) => entry[guestString(ctx, field)],
  hover_slice: ctx => moduleText(ctx, source.slice(entry.from, entry.to)),
  selected_details: (ctx, token) => hasHoverDetails(entry, guestString(ctx, token)),
  token_details: (ctx, record, token) => hasHoverDetails(json(ctx, record), guestString(ctx, token)),

  open_cache(_ctx, immediateNullReply) {
    calls = [];
    snapshots = [];
    values = [null];
    deliveries = new Map();
    cache = new DocumentQueries({request() {
      let resolve;
      const promise = immediateNullReply ? Promise.resolve(null) : new Promise(done => { resolve = done; });
      const call = {promise, resolve, canceled:false, cancel() { this.canceled = true; }};
      calls.push(call);
      return call;
    }});
  },
  snapshot: (ctx, payload) => snapshots.push(json(ctx, payload)) - 1,
  request_document: (_ctx, input) => handle(cache.request(snapshots[input])),
  is_promise: (_ctx, id) => values[id] instanceof Promise,
  request_count: () => calls.length,
  canceled: (_ctx, index) => calls[index].canceled,
  resolve_call(ctx, index, reply) { calls[index].resolve(json(ctx, reply)); },
  delivered(_ctx, id) {
    if (!deliveries.has(id)) {
      const delivery = {done:false};
      deliveries.set(id, delivery);
      values[id].then(value => Object.assign(delivery, {done:true, value}),
        error => Object.assign(delivery, {done:true, error}));
    }
    return deliveries.get(id).done;
  },
  delivered_value(_ctx, id) {
    const delivery = deliveries.get(id);
    if ('error' in delivery) throw delivery.error;
    return handle(delivery.value);
  },
  reply_signature: (ctx, id, index) => moduleText(ctx, values[id][index].signature),
  clear_cache() { cache.clear(); },
});

function check(selection) {
  return run(selection, () => { source = entries = entry = cache = calls = snapshots = values = deliveries = undefined; });
}

test('invalid document requests become host exceptions', () => check('invalid'));
test('Unicode ranges use UTF-8 transport and UTF-16 editor offsets; comments stay empty', () => check('unicode'));
test('presentation hides bare syntax tokens and converts declaration offsets after Unicode', () => check('presentation'));
test('the presentation index selects the smallest containing range and respects token edges', () => check('edges'));
test('document cache shares work and rejects replies from old inputs', () => check('cache'));
test('a canceled document request can be retried for the same snapshot', () => check('retry'));
