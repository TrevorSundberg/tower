import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower,runToEnd} from './compiler-fixtures.mjs';
const read=file=>readFile(new URL('../../'+file,import.meta.url));
const tower=await loadTower(await read('build/browser-wasi/tower.wasm'),undefined,
  (await read('scaffolding/foundation.tower')).toString(),undefined,(await read('scaffolding/bedrock.tower')).toString());
function format(source){
 const handle=tower.create(source);
 try{const parsed=runToEnd(tower,handle);assert.equal(parsed.end.status,'done',parsed.end.error);const formatted=tower.format(handle);assert.equal(formatted.error,undefined);return formatted.source;}
 finally{tower.destroy(handle);}
}
test('source and foundation formatting share declaration spacing and indentation',()=>{
 const source='  var x:i32=1; print(x);   struct Pair{value:i32;} fn answer(p:Pair*):i32{return p.value;} var p:Pair;var q:Pair*=&p;p.value=answer(q);';
 const formatted=format(source);
 assert.equal(formatted,'var x: i32 = 1;\nprint(x);\n\nstruct Pair {\n    value: i32;\n}\n\nfn answer(p: Pair*): i32 {\n    return p.value;\n}\n\nvar p: Pair;\nvar q: Pair* = &p;\np.value = answer(q);\n');
 assert.equal(format(formatted),formatted);
 const executable=tower.compile(formatted);
 try{assert.equal(tower.foundation(executable).source,formatted);}finally{tower.destroyExecution(executable);}
});
test('comments, strings and replacement invocations retain their original meaning',()=>{
 const source='// first\nparse Statement |= \'show\' $x:CoreOperand \';\' => replace { print($x); };\nshow 42; // inline\nfn f():void { /* body */ print(1); } // after\n';
 const formatted=format(source);
 assert.match(formatted,/show 42;\n/);
 for(const comment of ['// first','// inline','/* body */','// after'])assert.equal(formatted.split(comment).length,2);
 assert.equal(format(formatted),formatted);
 const literal='var text: u8* = "{ ; } // literal";\n';
 assert.equal(format(literal),literal);
});
test('formatting refuses a layout that changes custom lexical meaning',()=>{
 const source="skip Whitespace = /~+/;parse~Statement~=~'x''y'';';x~y;";
 const handle=tower.create(source);
 try{assert.equal(runToEnd(tower,handle).end.status,'done');assert.match(tower.format(handle).error,/would change the parsed source/);}
 finally{tower.destroy(handle);}
});

test('custom prefix and postfix operators attach to their operand, including increment',async()=>{
 const example=(await read('scaffolding/examples/increment.tower')).toString();
 const definitions=(await read('scaffolding/tests/increment_builtin.tower')).toString();
 const source=definitions+`\nvar value:i32=5; ++ value; value ++;
var before:i32=value ++; var after:i32=++ value;
print(value ++); print(++ value);
var sum:i32=value ++ + ++ value;
var array:i32[2]; var index:i32=0; array[index ++] ++;
struct S{field:i32;} var s:S; ++ s.field; s.field ++;
++ /* keep */ value; value /* keep too */ ++;`;
 const formatted=format(source);
 for(const statement of ['++value;', 'value++;', 'var before: i32 = value++;',
  'var after: i32 = ++value;', 'print(value++);', 'print(++value);',
  'var sum: i32 = value++ + ++value;', 'array[index++]++;', '++s.field;', 's.field++;'])
  assert.ok(formatted.includes(statement),statement+'\n'+formatted);
 assert.ok(formatted.includes('++ /* keep */'));
 assert.ok(formatted.includes('value /* keep too */'));
 assert.equal(format(formatted),formatted);
 assert.equal(format(example),example);
});

test('affix spacing follows rule shape, keeps infix spacing and separates adjacent operators',()=>{
 const grammar=`parse Prefix = '~~' Identifier;
parse NestedPrefix = '~~' Prefix;
parse Statement |= 'prefix' NestedPrefix ';' | 'postfix' Identifier '!!' ';';
parse CoreCall |= $target:CoreLocation '!!' => replace { post(&$target) };
parse CoreCall |= '~~' $target:CoreLocation => replace { pre(&$target) };
parse CoreCall |= $a:CoreLocation '%%' $b:CoreLocation => replace { combine($a, $b) };
`;
 const formatted=format(grammar+'prefix ~~ ~~ x;\nvar a:i32=~~ x; var b:i32=x !!; var c:i32=x%%y;');
 assert.ok(formatted.includes('prefix ~~ ~~x;'));
 assert.ok(formatted.includes('var a: i32 = ~~x;'));
 assert.ok(formatted.includes('var b: i32 = x!!;'));
 assert.ok(formatted.includes('var c: i32 = x %% y;'));
 assert.equal(format(formatted),formatted);
});
