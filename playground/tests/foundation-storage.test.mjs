import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectFoundation } from '../src/foundation-storage.mjs';
import { readFile } from 'node:fs/promises';
const legacy = await readFile(new URL('./fixtures/foundation_legacy.tower', import.meta.url), 'utf8');
const foundation = await readFile(new URL('../../scaffolding/foundation.tower', import.meta.url), 'utf8');
const bedrock = await readFile(new URL('../../scaffolding/bedrock.tower', import.meta.url), 'utf8');

test('the old lexer shown in the editor upgrades even when a newer baseline was already saved', async () => {
  for (const baseline of [null, 'old bundled module', foundation]) {
    assert.equal(await selectFoundation(foundation, legacy, baseline, { bedrock }), foundation);
  }
});

test('upgrading an old full Foundation removes inherited defaults and preserves custom grammar', async () => {
  const lexical = bedrock.split('\n').filter(line => /^(?:skip|token) /.test(line)).join('\n');
  const header = legacy.split('\n').slice(0, 2).join('\n');
  const grammar = foundation.slice(foundation.indexOf('parse CoreType')).replace("'print'", "'emit'");
  const saved = header + '\n' + lexical + '\ntoken Number = /[0-9]+/ as number;\n// my grammar\n' + grammar;
  const customBedrock = bedrock.replace('[A-Za-z0-9_]*', '[A-Za-z0-9_-]*');
  const upgraded = await selectFoundation(foundation, saved.replaceAll('\n', '\r\n'), foundation, {bedrock:customBedrock});
  assert.doesNotMatch(upgraded, /^(?:skip (?:Whitespace|LineComment|BlockComment)|token (?:Identifier|String))\b/m);
  assert.ok(upgraded.includes('// my grammar\n' + grammar));
  assert.ok(upgraded.includes('token Number = /[0-9]+/ as number;'));
  assert.equal(await selectFoundation(foundation, upgraded, foundation, {bedrock:customBedrock}), upgraded);
});

test('custom lexical edits survive upgrading the legacy lexer-only module', async () => {
  const saved = legacy.replace('token Identifier = /[A-Za-z_][A-Za-z0-9_]*/', 'token Identifier = /@[a-z]+/')
    .replace('token Number = /[0-9]+/', 'token Number = /[0-9]+(\\.[0-9]+)?/') + '// custom lexer\n';
  const upgraded = await selectFoundation(foundation, saved, foundation, {bedrock});
  assert.ok(upgraded.includes('token Identifier = /@[a-z]+/ as identifier;'));
  assert.ok(upgraded.includes('token Number = /[0-9]+(\\.[0-9]+)?/ as number;'));
  assert.ok(upgraded.includes('// custom lexer'));
  assert.ok(upgraded.includes('parse CoreFunction'));
  assert.doesNotMatch(upgraded, /^skip (?:Whitespace|LineComment|BlockComment)\b/m);
});
test('bundled updates replace untouched defaults and preserve edited or unrecognized modules', async () => {
  assert.equal(await selectFoundation('new module', null, null), 'new module');
  assert.equal(await selectFoundation('new module', 'old module', 'old module'), 'new module');
  assert.equal(await selectFoundation('new module', 'custom module', 'old module'), 'custom module');
  assert.equal(await selectFoundation('new module', 'unknown old module', null), 'unknown old module');
  assert.equal(await selectFoundation('new module', '', null), '');
  assert.equal(await selectFoundation('new module', 'old\r\nmodule', 'old\nmodule'), 'new module');
});
