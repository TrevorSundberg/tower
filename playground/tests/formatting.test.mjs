import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower,runToEnd} from '../src/tower-host.mjs';
const read=file=>readFile(new URL('../../'+file,import.meta.url));
const tower=await loadTower(await read('build/browser-wasi/tower.wasm'),undefined,
  (await read('scaffolding/foundation.tower')).toString(),undefined,(await read('scaffolding/bedrock.tower')).toString());
function format(source){
 const handle=tower.create(source);
 try{const parsed=runToEnd(tower,handle);assert.equal(parsed.end.status,'done',parsed.end.error);return tower.format(handle).source;}
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
test('every bundled Tower module, example and test equals its formatted source',async()=>{
 await import('../scripts/format-tower.mjs');
});
