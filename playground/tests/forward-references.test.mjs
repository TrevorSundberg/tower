import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower,runToEnd} from '../src/tower-host.mjs';
import {loadLLVM,executeWasm} from '../src/llvm-host.mjs';
const read=p=>readFile(new URL('../../'+p,import.meta.url));
const foundation=(await read('scaffolding/foundation.tower')).toString();
const tower=await loadTower(await read('build/browser-wasi/tower.wasm'),undefined,foundation);
const llvm=await loadLLVM(await read('build/browser-wasi-llvm/tower-llvm.wasm'),undefined,foundation);
function parse(source){const h=tower.create(source);try{return runToEnd(tower,h);}finally{tower.destroy(h);}}
test('forward rule and token dependencies resolve before root activation',()=>{
 for(const source of [
  "parse A = B;parse B = 'hello';parse Statement |= A;hello",
  "parse A = B;parse B = C;parse C = 'hello';parse Statement |= A;hello",
  "parse A = Later;token Later = /@hello/;parse Statement |= A;@hello",
  "parse A = 'start' B;parse B = A | 'end';parse Statement |= A;start start end",
  "parse A = B;parse A = 'ready';parse Statement |= A;ready",
 ]) {const r=parse(source);assert.equal(r.end.status,'done',r.end.error);}
 assert.match(foundation,/CoreCallArgument = CoreOperand \| CorePointerArgument/);
});
test('incomplete active grammars fail at activation; unresolved module references fail at EOF',()=>{
 const h=tower.create("parse A = B;parse Statement |= A;");
 try{
  assert.equal(tower.step(h).status,'declaration');
  const r=tower.step(h);assert.equal(r.status,'error');assert.match(r.error,/Cannot activate incomplete grammar: Statement -> A -> B/);
  assert.equal(tower.inspect(h).revision,1);
 }finally{tower.destroy(h);}
 const end=parse("parse A = B;").end;assert.equal(end.status,'error');assert.match(end.error,/end of module: A -> B/);
 const reader=parse("parse GrammarDeclaration = 'rule' $name:Identifier $op:GrammarAssignment $alternatives:GrammarAlternatives $replacement:GrammarReplacement Missing ';';").end;
 assert.match(reader.error,/Cannot activate incomplete grammar: GrammarDeclaration -> Missing/);
 // An unresolved optional branch still matters to recognition/conflict analysis.
 assert.match(parse("parse A = B? 'x';parse Statement |= A;").end.error,/incomplete grammar/);
});
test('forward rules follow declaration grammar changes without prescanning or changing pinned sessions',()=>{
 const source="parse A = B;parse GrammarDeclaration = 'rule' $name:Identifier $op:GrammarAssignment $alternatives:GrammarAlternatives $replacement:GrammarReplacement ';';"+
 "rule B = 'hello';rule Statement |= A;hello";
 assert.equal(parse(source).end.status,'done');
 assert.equal(parse('print(42);').end.status,'done');
 assert.match(parse("parse A = B;parse B = 'x' | 'x';parse Statement |= A;").end.error,/Grammar conflict/);
});
test('module functions, types and variables resolve forward, preserving initialization order and local scopes',async()=>{
 const source=`fn read_later(): i32 { return later; }
fn read_field(): i32 { return value.left; }
fn read_index(): i32 { return entries[1]; }
 later = 41;
 var later: i32;
 var value: Pair;
 value.left = read_later(); value.right = 1;
 var result: i32 = add(value.left, value.right); print(result);
 struct Pair { left: i32; right: i32; }
 fn add(a: i32, b: i32): i32 { var later: i32 = a + b; return later; }
 print(later);
 later = 8; result = read_later(); print(result);
var observed: i32 = read_later(); later = 9; print(observed);
var field: i32 = read_field(); print(field);
var entries: i32[2]; entries[1] = 73;
var indexed: i32 = read_index(); print(indexed);`;
 const h=tower.compile(source);let text;
 try {const r=tower.execute(h);assert.equal(r.status,'done',r.error);assert.equal(r.output,'42\n41\n8\n8\n41\n73\n');text=tower.foundation(h).source;}finally{tower.destroyExecution(h);}
 for(const input of [source,text]){
  const c=llvm.compile(input);assert.equal(c.status,'compiled',c.error);assert.equal((await executeWasm(c)).output,'42\n41\n8\n8\n41\n73\n');
 }
 for(const bad of ['var x: i32;var x: i32;','fn bad(): i32 { return later; var later: i32 = 1; }']){
  const h=tower.compile(bad);try{assert.equal(tower.execute(h).status,'error');}finally{tower.destroyExecution(h);}
 }
});
