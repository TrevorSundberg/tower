import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower,runToEnd} from './compiler-fixtures.mjs';
const read=p=>readFile(new URL('../../'+p,import.meta.url));
const bedrock=(await read('scaffolding/bedrock.tower')).toString(), foundation=(await read('scaffolding/foundation.tower')).toString();
const tower=await loadTower(await read('build/browser-wasi/tower.wasm'),undefined,foundation,undefined,bedrock);
function parse(source,kind='') {
 const h=kind==='bedrock'?tower.createBedrock(source):tower.create(source);
 try{return {...runToEnd(tower,h),formatted:tower.format(h),snapshot:tower.inspect(h)};}finally{tower.destroy(h);}
}
test('pattern syntax is an overridable contextual token, including within Bedrock itself',()=>{
 const override='token GrammarPattern = /#[^#]+#/ when expected as pattern;';
 const source='import foundation;\n'+override+'token Number = #[0-9]+#;print(42);';
 assert.equal(parse(source).end.status,'done');
 const h=tower.compile(source);try{assert.equal(tower.execute(h).output,'42\n');}finally{tower.destroyExecution(h);}
 assert.equal(parse(override+'token Extra = #x+#;','bedrock').end.status,'done');
 assert.equal(parse(override+'token Extra = /x+/;','bedrock').end.status,'error');
 assert.equal(parse('token Extra = /x+/;','bedrock').end.status,'done','override did not mutate seed');
});
test('recursive templates use ordinary rules and token sets, preserving strings and trivia',()=>{
 const source="import foundation;\nparse GrammarTemplateItem = GrammarTemplate | [^'{' '}' '(' ')'] | GrammarCharacter;"+
 "parse GrammarTemplate = '(' GrammarTemplateItems ')';"+
 "parse Statement |= 'show' $v:CoreOperand ';' => replace ( /* braces } { */ print($v); );show 42;";
 const result=parse(source);assert.equal(result.end.status,'done',result.end.error);
 const h=tower.compile(source);try{assert.equal(tower.execute(h).output,'42\n');}finally{tower.destroyExecution(h);}
 assert.ok(result.events.some(e=>e.nodes.some(n=>n.label==='GrammarTemplateItems')));
});
test('generic contextual tokens stay inactive elsewhere and survive formatting',()=>{
 const declarations="import foundation;\ntoken Digit = /[0-9]+/ when expected as number;parse Special = 'special' Digit ';';parse Statement |= Special;";
 assert.equal(parse(declarations+'special 12;print(42);').end.status,'done');
 const first=parse(declarations);assert.equal(first.end.status,'done',first.end.error);
 assert.match(first.formatted.source,/when expected/);
 assert.equal(parse(first.formatted.source+'special 12;').end.status,'done');
 assert.equal(parse('import foundation;\nvar a: i32 = 8; var b: i32 = a / 2; var c: i32 = b / 2; print(c);').end.status,'done');
 assert.equal(parse('import foundation;\n@').end.status,'error','template fallback token must not leak into ordinary source');
});
