import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {selectFoundation} from '../src/foundation-storage.mjs';
import {guestString} from './guest_text.mjs';
import {moduleText, selectedCases} from './module_case_host.mjs';

const fixtures = new Map([
  ...['foundation', 'bedrock', 'foundation_syntax'].map(name => [name, '../../scaffolding/' + name + '.tower']),
  ['legacy', './fixtures/foundation_legacy.tower'],
  ...['full_preamble', 'edited_lexer', 'lexical_overrides'].map(name => [name, './foundation_storage_cases/inputs/' + name + '.tower']),
].map(([name, path]) => [name, readFileSync(new URL(path, import.meta.url), 'utf8')]));

let pending, result;
async function settle() {
  try { await pending; }
  finally { pending = undefined; }
}
const check = selectedCases('foundation_storage_cases', {
  storage_source: (ctx, name) => moduleText(ctx, fixtures.get(guestString(ctx, name))),
  storage_start(ctx, bundled, saved, baseline, bedrock) {
    if (pending) throw new Error('A Foundation selection is still pending');
    const text = pointer => pointer ? guestString(ctx, pointer) : null;
    const args = [text(bundled), text(saved), text(baseline)];
    if (bedrock) args.push({bedrock:text(bedrock)});
    pending = selectFoundation(...args).then(value => { result = value; });
  },
  storage_pending: () => Boolean(pending),
  storage_result: ctx => moduleText(ctx, result),
}, settle);

async function run(name) {
  try { await check(name, 2048); }
  finally {
    try { await settle(); }
    finally { result = undefined; }
  }
}

test('the old lexer shown in the editor upgrades even when a newer baseline was already saved', () => run('session_old_lexer'));
test('upgrading an old full Foundation removes inherited defaults and preserves custom grammar', () => run('session_full_grammar'));
test('custom lexical edits survive upgrading the legacy lexer-only module', () => run('session_lexical_edits'));
test('bundled updates replace untouched defaults and preserve edited or unrecognized modules', () => run('session_defaults'));
