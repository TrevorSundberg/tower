import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadTower, runToEnd } from '../src/tower-host.mjs';
const foundation = await readFile(new URL('../../scaffolding/foundation.tower', import.meta.url), 'utf8');
const bedrock = await readFile(new URL('../../scaffolding/bedrock.tower', import.meta.url), 'utf8');
const tower = await loadTower(await readFile(new URL('../../build/browser-wasi/tower.wasm', import.meta.url)), undefined, foundation, undefined, bedrock);
function inspect(source, kind = '') {
  const handle = kind === 'bedrock' ? tower.createBedrock(source) : kind === 'foundation' ? tower.createFoundation(source) : tower.create(source);
  try { const result = runToEnd(tower, handle); return { ...result, formatted: tower.format(handle), snapshot: tower.inspect(handle) }; }
  finally { tower.destroy(handle); }
}
function restore() { tower.configureBedrock(bedrock); tower.configure(foundation); }

test('foundation inherits bedrock without redeclaring any of its definitions', () => {
  assert.doesNotMatch(bedrock, /\b__/);
  const inherited = inspect(foundation, 'foundation');
  const defined = inspect(bedrock, 'bedrock');
  assert.equal(inherited.end.status, 'done', inherited.end.error);
  assert.equal(defined.end.status, 'done', defined.end.error);
  const bedrockNames = new Set([...defined.snapshot.tokens, ...defined.snapshot.rules].map(item => item.name));
  for (const declaration of inherited.events) {
    const name = declaration.nodes.find(node => node.parent === 0 && node.role === 'name');
    assert.ok(name, 'a declaration must expose its name capture');
    assert.ok(!bedrockNames.has(name.label), `Foundation redeclares Bedrock's ${name.label}`);
  }
  for (const token of defined.snapshot.tokens) {
    assert.deepEqual(inherited.snapshot.tokens.find(t => t.name === token.name), token);
  }
  assert.ok(inherited.snapshot.rules.some(rule => rule.name === 'GrammarAssignment'));
});

test('shared bedrock whitespace, comments and identifiers affect declarations and ordinary code', () => {
  const edited = bedrock.replace('[ \\t\\r\\n]+', '[ ~\\t\\r\\n]+')
    .replace('[A-Za-z0-9_]*', '[A-Za-z0-9_-]*')
    .replace('skip LineComment = /', 'skip LineComment = /#[^\\r\\n]*|');
  try {
    tower.configureBedrock(edited); tower.configure(foundation);
    const source = 'parse~extra-rule~=~Number;\n# shared comment\nvar~player-name:~i32~=~42;print~player-name;';
    const result = inspect(source);
    assert.equal(result.end.status, 'done', result.end.error);
    assert.ok(result.snapshot.highlights.some(t => t.kind === 'comment' && source.slice(t.start, t.end) === '# shared comment'));
    const execution = tower.compile(source);
    try { assert.equal(tower.execute(execution).output, '42\n'); } finally { tower.destroyExecution(execution); }
    assert.equal(inspect(edited.replace('parse GrammarDeclaration', 'parse~GrammarDeclaration'), 'bedrock').end.status, 'done');
  } finally { restore(); }
});

test('shared grammar rules can be referenced, extended and replaced without a reserved prefix', () => {
  for (const source of [
    "parse Statement = 'assignment' GrammarAssignment ';';assignment =;assignment |=;",
    "parse GrammarSuffix |= '!';parse Value = Number;parse Statement = Value ';';42;",
    "parse GrammarAssignment = '=' | '|=';parse Statement = Number ';';42;",
    "parse __repeat0 = Number;parse Statement = __repeat0* ';';1 2;",
    "parse `document(0)` = Number;parse Statement = `document(0)` ';';42;",
    "parse Statement = 'atom' GrammarAtom ';';atom 'literal';atom $name:Identifier;"
  ]) {
    const result = inspect(source);
    assert.equal(result.end.status, 'done', result.end.error);
  }
});

test('local overrides preserve inherited bindings in other sessions and canonical grammar names round trip', () => {
  const pinned = tower.create('var x: i32 = 1;print x;');
  try {
    const source = "skip Whitespace = /[ ~\\t\\r\\n]+/;parse `rule name` = Number;parse Statement = `rule name` ';';";
    const result = inspect(source);
    assert.equal(result.end.status, 'done', result.end.error);
    assert.equal(inspect(result.formatted.source + '~42;').end.status, 'done');
    assert.equal(inspect('~print 1;').end.status, 'error');
    assert.equal(runToEnd(tower, pinned).end.status, 'done');
  } finally { tower.destroy(pinned); }
});

test('quoted capture names use shared Identifier decoding and survive template formatting', () => {
  const source = "parse Value = Number;parse Statement = Value ';';" +
    "parse Value |= 'keep' '(' $`captured value`:Number ')' => replace { $`captured value` };";
  const first = inspect(source);
  assert.equal(first.end.status, 'done', first.end.error);
  const second = inspect(first.formatted.source);
  assert.equal(second.end.status, 'done', second.end.error);
  assert.equal(second.formatted.source, first.formatted.source);
  const use = inspect(second.formatted.source + 'keep(42);');
  assert.equal(use.end.status, 'done', use.end.error);
  assert.ok(use.events.at(-1).nodes.some(node => node.label === '42'));
});

test('bedrock is the common formatter output of the native grammar entities and round trips', () => {
  assert.equal(bedrock, tower.bedrockSeed());
  const first = inspect(bedrock, 'bedrock');
  assert.equal(first.end.status, 'done', first.end.error);
  assert.equal(first.formatted.source, bedrock);
  assert.deepEqual(first.events.slice(0, 4).map(event => event.nodes[0].semantic), ['skip', 'skip', 'skip', 'token']);
  const declaration = first.events.find(event => event.nodes[0].semantic === 'parse');
  assert.ok(declaration.nodes.some(node => node.semantic === 'alternative' && node.production !== null));
  assert.ok(declaration.nodes.some(node => node.semantic === 'term' && node.production !== null));
  const second = inspect(first.formatted.source, 'bedrock');
  assert.deepEqual(second.snapshot.rules, first.snapshot.rules);
  assert.deepEqual(second.snapshot.tokens, first.snapshot.tokens);
});

test('foundation declaration formatting preserves grammar and is stable', () => {
  const first = inspect(foundation, 'foundation');
  assert.equal(first.end.status, 'done', first.end.error);
  assert.ok(first.formatted.source.includes('parse CoreFunction'));
  const second = inspect(first.formatted.source, 'foundation');
  assert.equal(second.end.status, 'done', second.end.error);
  assert.equal(second.formatted.source, first.formatted.source);
  assert.deepEqual(second.snapshot.rules, first.snapshot.rules);
  assert.deepEqual(second.snapshot.tokens, first.snapshot.tokens);
  assert.ok(first.formatted.spans.every(span => span.source >= 0 && span.source < Buffer.byteLength(foundation)));
});

test('formatting retains declaration order, replace versus extend, holes and comments', () => {
  const source = "// before\nparse Expression = Identifier | Number;\nparse Statement = Expression ';';\n" +
    "parse Expression |= 'one' => replace { /* template */ 1 };\n" +
    "parse /* inside */ Expression = Identifier | Number;\n" +
    "parse Expression |= 'two' => replace { 2 };\n// after\n";
  const first = inspect(source);
  assert.equal(first.end.status, 'done', first.end.error);
  const formatted = first.formatted.source;
  for (const comment of ['// before', '/* template */', '/* inside */', '// after']) assert.equal(formatted.split(comment).length, 2);
  assert.equal((formatted.match(/parse Expression = /g) ?? []).length, 2);
  assert.equal((formatted.match(/parse Expression \|=/g) ?? []).length, 2);
  const second = inspect(formatted);
  assert.equal(second.end.status, 'done', second.end.error);
  assert.equal(second.formatted.source, formatted);
  assert.deepEqual(second.snapshot.rules, first.snapshot.rules);
  const use = inspect(formatted + 'two;');
  assert.equal(use.end.status, 'done', use.end.error);
  assert.ok(use.events.at(-1).nodes.some(node => node.label === '2'));
  assert.match(use.formatted.error, /grammar declaration document/);
});

test('bedrock keyword edits affect following declarations, foundation and source without mutating the seed', () => {
  const edited = bedrock.replace("'parse'", "'rule'").replace("'token'", "'lex'").replace("'skip'", "'ignore'")
    .replace(/^parse (?!GrammarDeclaration\b)/gm, 'rule ');
  const pinned = tower.create('print 7;');
  try {
    tower.configureBedrock(edited);
    assert.equal(inspect(edited, 'bedrock').end.status, 'done');
    assert.throws(() => tower.configure(foundation), /Foundation may contain only/);
    const adapted = foundation.replace(/^parse /gm, 'rule ').replace(/^token /gm, 'lex ').replace(/^skip /gm, 'ignore ');
    tower.configure(adapted);
    const result = inspect("rule Statement |= 'show' $value:CoreOperand ';' => replace { print $value; };show 42;");
    assert.equal(result.end.status, 'done', result.end.error);
    assert.ok(result.events.at(-1).nodes.some(node => node.label === 'CorePrint'));
    const exec = tower.compile("rule Statement |= 'show' $value:CoreOperand ';' => replace { print $value; };show 42;");
    try { assert.equal(tower.execute(exec).output, '42\n'); } finally { tower.destroyExecution(exec); }
    // The pinned session keeps its old declaration grammar even across reset.
    tower.reset(pinned, "parse Extra = Number;print 7;");
    assert.equal(runToEnd(tower, pinned).end.status, 'done');
    assert.notEqual(inspect(edited.replace(/^parse /gm, 'rule '), 'bedrock').end.status, 'done');
    assert.equal(tower.bedrockSeed(), bedrock);
  } finally { tower.destroy(pinned); restore(); }
});

test('bedrock name tokens affect its following grammar names and downstream source', () => {
  const edited = bedrock.replace('[A-Za-z_][A-Za-z0-9_]*', '[A-Za-z_][A-Za-z0-9_-]*');
  try {
    tower.configureBedrock(edited); tower.configure(foundation);
    assert.equal(inspect('parse extra-rule = Number;').end.status, 'done');
    assert.equal(inspect(edited + 'parse extra-rule = Identifier;', 'bedrock').end.status, 'done');
  } finally { restore(); }
});

test('every file installs token, trivia and declaration-reader edits at the same boundary', () => {
  for (const kind of ['bedrock', 'foundation', '']) {
    const identifier = 'token Identifier = /ffff[A-Za-z_][A-Za-z0-9_]*/ as identifier;';
    const source = identifier + '\ntoken String = /[a-z]+/;';
    const result = inspect(source, kind);
    assert.equal(result.events.length, 1, kind);
    assert.equal(result.end.status, 'error', kind);
    assert.equal(result.end.revision, 1, kind);
    assert.equal(result.end.errorOffset, source.indexOf('String'), kind);
    assert.equal(result.snapshot.tokens.find(t => t.name === 'Identifier').pattern, 'ffff[A-Za-z_][A-Za-z0-9_]*');
    assert.equal(inspect('skip Whitespace = /[ ~\\t\\r\\n]+/;parse~Extra~=~Identifier;', kind).end.status, 'done', kind);
    const strings = 'token String = /~[^~]*~/ as string;';
    assert.equal(inspect(strings + "parse Extra = 'x';", kind).end.status, 'error', kind);
    assert.equal(inspect(strings + 'parse Extra = ~x~;', kind).end.status, 'done', kind);
  }
});

test('bedrock installation is atomic, validates semantic captures and is idempotent', () => {
  const invalid = bedrock.replace('$name:Identifier', '$wrong:Identifier');
  assert.throws(() => tower.configureBedrock(invalid), /must preserve capture 'name'/);
  assert.equal(inspect('print 1;').end.status, 'done');
  const nodes = tower.exports.tw_live_nodes(), allocations = tower.exports.tw_live_allocations();
  tower.configureBedrock(bedrock); tower.configureBedrock(bedrock);
  assert.equal(tower.exports.tw_live_nodes(), nodes);
  assert.equal(tower.exports.tw_live_allocations(), allocations);
  const handle = tower.createBedrock(bedrock);
  try {
    assert.equal(runToEnd(tower, handle).end.status, 'done');
    tower.reset(handle, invalid); assert.equal(runToEnd(tower, handle).end.status, 'error');
    assert.match(tower.format(handle).error, /valid grammar/);
    tower.reset(handle, bedrock); assert.equal(runToEnd(tower, handle).end.status, 'done');
  } finally { tower.destroy(handle); }
  assert.equal(tower.exports.tw_live_nodes(), nodes);
  assert.equal(tower.exports.tw_live_allocations(), allocations);
});
