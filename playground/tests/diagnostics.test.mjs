import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower,runToEnd} from '../src/tower-host.mjs';
const read=name=>readFile(new URL('../../'+name,import.meta.url));
const tower=await loadTower(await read('build/browser-wasi/tower.wasm'),undefined,
  (await read('scaffolding/foundation.tower')).toString(),undefined,(await read('scaffolding/bedrock.tower')).toString());
function parse(source){const h=tower.create(source);try{return runToEnd(tower,h).end;}finally{tower.destroy(h);}}
function error(source){const end=parse(source);assert.equal(end.status,'error');assert.doesNotMatch(end.error,/\bat byte\b|\bstate\s*\(|\bstate \d|shift to state|repeat\(\d|capture\(\d/);return end;}

test('missing delimiters are inferred from the active grammar and point at the insertion gap',()=>{
 for(const [source,literal,offset] of [
  ['print(42)\nvar answer: i32;',"';'",9],
  ['var answer: i32 = 42\nprint(answer);',"';'",20],
  ['print(42)',"';'",9],
  ['print(42;',"')'",8],
  ['var answer i32;',"':'",10],
  ['print(42) // comment\nvar answer: i32;',"';'",9],
 ]) {const result=error(source);assert.ok(result.error.startsWith('Missing '+literal),result.error);assert.equal(result.errorOffset,offset);assert.equal(result.errorLength,0);assert.match(result.error,/foundation\.tower, line \d+, column \d+/);}
});

test('user grammar literals, including keywords, participate without compiler annotations',()=>{
 const grammar="parse Statement = 'say' Number 'done';\n";
 const source=grammar+'say 42\nsay 43 done';
 const result=error(source);
 assert.match(result.error,/Missing 'done' before 'say'/);
 assert.match(result.error,/Statement = 'say' Number 'done' \(this file, line 1,/);
 assert.equal(result.errorOffset,grammar.length+6);
 assert.equal(parse(grammar+'say 42 done\nsay 43 done').status,'done');
 const required="parse Statement = 'if' Identifier 'then' Identifier ';';\nif condition result;";
 assert.match(error(required).error,/Missing 'then' before 'result'/);
});

test('ambiguous or unsuccessful repairs report valid alternatives without claiming a fix',()=>{
 const ambiguous=error("parse Statement = 'a' ',' 'b' | 'a' ':' 'b'; a b");
 assert.match(ambiguous.error,/Unexpected 'b'\. Expected ',' or ':'/);
 assert.equal(ambiguous.errorLength,undefined);
 assert.doesNotMatch(error("parse Statement = 'a' ';' 'b'; a x;").error,/Missing/);
 const multiple=error('print(42\nvar x: i32;');
 assert.doesNotMatch(multiple.error,/Missing/); // Needs both ')' and ';'.
 assert.match(error('var').error,/Expected Identifier/); // Never invent a name.
});

test('conflicts describe both choices, rule definitions and source locations',()=>{
 const shift=error("parse Statement = 'x' | 'x' 'x';");
 assert.match(shift.error,/Grammar conflict \(shift\/reduce\) on 'x'/);
 assert.match(shift.error,/continue Statement = 'x' 'x'/);
 assert.match(shift.error,/finish Statement = 'x'/);
 assert.equal((shift.error.match(/this file, line 1, column/g)||[]).length,2);
 const reduce=error("parse A = Number;\nparse B = Number;\nparse Statement = A ';' | B ';';");
 assert.match(reduce.error,/reduce\/reduce/);
 assert.match(reduce.error,/A = Number \(this file, line 1,/);
 assert.match(reduce.error,/B = Number \(this file, line 2,/);
});

test('cached grammar diagnostics use current source locations after comments move rules',()=>{
 const rule="parse Statement = 'say' Number ';';\nsay 42";
 const handle=tower.create(rule);
 try{
  assert.match(runToEnd(tower,handle).end.error,/this file, line 1,/);
  tower.reset(handle,'// moved\n\n'+rule);
  assert.match(runToEnd(tower,handle).end.error,/this file, line 3,/);
  assert.ok(tower.inspect(handle).grammarCacheHits>0);
 }finally{tower.destroy(handle);}
});

test('contextual lexer rules use the speculative parser state without altering the source',()=>{
 const grammar="token Word = /[a-z]+/ when expected; parse Statement = 'say' Number 'then' Word ';';\n";
 const source=grammar+'say 42 message;';
 assert.match(error(source).error,/Missing 'then'/);
 assert.equal(parse(source.replace('42 message','42 then message')).status,'done');
});

test('large expected sets and deep invalid input fall back without a definite repair or parser internals',()=>{
 const alternatives=Array.from({length:80},(_,i)=>`'choice${i}' 'body'`).join(' | ');
 const broad=error('parse Statement = '+alternatives+'; body');
 assert.doesNotMatch(broad.error,/Missing/);
 assert.match(broad.error,/Expected a valid continuation such as/);
 const deep=error("parse Value = '(' Value ')' | Number;parse Statement = Value ';';"+'('.repeat(4200)+'42;');
 assert.doesNotMatch(deep.error,/Missing/);
});
