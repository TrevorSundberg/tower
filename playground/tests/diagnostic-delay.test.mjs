import {test} from 'node:test';
import {DiagnosticDelay} from '../src/diagnostic-delay.mjs';
import {editorSuite} from './editor_suite.mjs';
import {copyText, guestString} from './guest_text.mjs';

let delay, clock, published, fired;
const run = editorSuite('diagnostic_delay', ['departure.expected'], {
  edit: (_, revision) => delay.edit(revision),
  update: (context, channel, text, revision) => delay.update(guestString(context, channel),
    text ? guestString(context, text) : null, revision),
  reveal: () => delay.reveal(),
  reset: (_, revision) => delay.reset(revision),
  advance: (_, ms) => clock.tick(ms),
  timers_fired: () => fired,
  publications: context => copyText(context, JSON.stringify(published)),
});

function check(t, selection) {
  return run(selection, () => {
    clock = t.mock.timers;
    clock.enable({apis:['setTimeout']});
    published = [];
    fired = 0;
    delay = new DiagnosticDelay((...event) => published.push(event), {
      setTimer: (fn, ms) => setTimeout(() => { fired++; fn(); }, ms),
    });
  });
}

test('typing resets the ten-second deadline and releases only the newest revision', t => check(t, 'deadline'));
test('cursor departure releases pending errors and future replies for the same revision', t => check(t, 'departure'));
test('successful results clear errors immediately and cancel their deferred replacement', t => check(t, 'clear'));
test('switching documents discards pending errors and idle timers', t => check(t, 'switch'));
