import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower} from './compiler-fixtures.mjs';
import {DocumentQueries,hoverAt,hoverIndex,hasHoverDetails} from '../src/language-queries.mjs';
const read=name=>readFile(new URL('../../'+name,import.meta.url));
const tower=await loadTower(await read('build/browser-wasi/tower.wasm'),undefined,
  (await read('scaffolding/foundation.tower')).toString(),undefined,(await read('scaffolding/bedrock.tower')).toString());
function inspect(source,options={}) {
  tower.configureModules({entry:options.entry??'input.tower',files:options.files??[]});
  const result=tower.inspectDocument(source,options);assert.equal(result.error,undefined);
  return hoverIndex(source,result);
}
function at(source,needle,options) {return hoverAt(inspect(source,options),source.lastIndexOf(needle)+1);}

test('hover resolves lexical shadowing, parameters and inferred locals on shared entities',()=>{
  const source='var value: bool = true; fn demo(value:i32):i32 { var local = value; return local; } print(value);';
  const entries=inspect(source);
  const parameter=hoverAt(entries,source.indexOf('= value;')+3);
  assert.equal(parameter.signature,'value: i32');assert.equal(parameter.kind,'parameter');
  assert.match(parameter.description,/Each call supplies a value/);
  assert.equal(at(source,'local;').signature,'var local: i32');
  const global=at(source,'value);');assert.equal(global.type,'bool');assert.equal(global.kind,'global variable');
  assert.match(global.description,/change it later by assigning a new value/);
  assert.ok(global.entity>0);assert.ok(global.binding>0);assert.notEqual(global.entity,global.binding);
  assert.equal(global.syntax,'CoreLocation');assert.ok(global.components>=2);
});
test('function names and calls share canonical typed signatures',()=>{
  const source='fn add(a:i32,b:i32):i32 { var sum = a + b; return sum; } print(add(1,2)); fn idle():void { return; } fn answer():i32 { return 42; } fn sink(value:i32):void { return; } fn address():void* { return null; }';
  assert.equal(at(source,'add(1').signature,'fn add(a: i32, b: i32): i32');
  assert.equal(at(source,'i32 {').signature,'i32');
  const entries=inspect(source),definition=name=>hoverAt(entries,source.indexOf('fn '+name)+3);
  assert.match(definition('add').description,/Parameters are the named inputs/);
  assert.match(definition('add').description,/sends a result back/);
  assert.match(definition('idle').description,/no inputs.*without returning a value/);
  assert.match(definition('answer').description,/no inputs.*sends a result back/);
  assert.match(definition('sink').description,/named inputs.*without returning a value/);
  assert.match(definition('address').description,/sends a result back/);
  assert.doesNotMatch(definition('address').description,/without returning a value/);
});

test('generic entity lookup covers every source position in checked statements',()=>{
  const source='fn advance(p:i32*):i32 {\n var old:i32 = *p;\n *p = old + 1;\n return old;\n}\nvar value:i32 = 1;\nprint(advance(&value));';
  const entries=inspect(source,{entry:'advance.tower'});
  for(const match of source.matchAll(/\S/g))assert.ok(hasHoverDetails(hoverAt(entries,match.index)),`Missing metadata at ${match.index}: ${match[0]}`);
  const get=(text,offset=0)=>hoverAt(entries,source.indexOf(text)+offset);
  assert.match(get('var old').description,/change it later by assigning a new value/);
  assert.equal(get('var old').type,'i32');
  assert.equal(get('= *p').entity,get('var old').entity);
  assert.equal(get('= *p').description,get('var old').description);
  assert.match(get('= old').description,/previous value is overwritten/);
  assert.equal(get('= old').type,'i32');
  assert.equal(get('*p;').kind,'pointer dereference');assert.equal(get('*p;').type,'i32');
  assert.match(get('*p =').description,/changes the value at that address/);
  for(const text of ['return old','}']) {
    const entry=get(text);assert.equal(entry.signature,'fn advance(p: i32*): i32');
    assert.equal(entry.declarationFile,'advance.tower');assert.equal(entry.declarationLine,1);assert.equal(entry.declarationColumn,1);
  }
  assert.match(get('}').description,/statements run when this function is called/);
});

test('component presentation is independent of custom keyword and delimiter spellings',()=>{
  const source=`parse CoreDeclare = 'let' $name:Identifier ':' $type:CoreType ':=' $value:CoreValue '!';
parse CoreAssign = $target:CoreTarget ':=' $value:CoreValue '!';
parse CoreReturn = 'give' $value:CoreOperand? '!';
parse CoreFunction = 'procedure' $name:Identifier '[' $params:CoreParameters? ']' '->' $type:CoreType $body:CoreBlock;
procedure advance[] -> i32 {
  let counter:i32 := 1!
  counter := counter + 1!
  give counter!
}`;
  const entries=inspect(source,{entry:'custom.tower'}),start=source.indexOf('procedure advance');
  const get=(text,offset=0)=>hoverAt(entries,source.indexOf(text,start)+offset);
  for(let offset=start;offset<source.length;offset++)if(/\S/.test(source[offset]))assert.ok(hasHoverDetails(hoverAt(entries,offset)),`Missing metadata at ${offset}: ${source[offset]}`);
  const declaration=get('let counter');
  for(const [text,offset] of [['let counter',4],[':= 1',0],['1!',1]]) {
    const entry=get(text,offset);assert.equal(entry.entity,declaration.entity);assert.equal(entry.signature,'var counter: i32');assert.equal(entry.type,'i32');
  }
  assert.match(get(':= counter').description,/previous value is overwritten/);assert.equal(get(':= counter').type,'i32');
  for(const text of ['procedure','[',']','->','{','}','give']) {
    const entry=get(text);assert.equal(entry.signature,'fn advance(): i32');assert.equal(entry.declarationFile,'custom.tower');assert.equal(entry.declarationLine,5);
  }
  assert.equal(get('{').entity,get('}').entity);
  assert.equal(get('{').description,get('}').description);
});

test('control flow punctuation uses structural descriptions without invented value types',()=>{
  const source='fn repeat():void { var ready:bool = true; loop { if ready { break; } else { continue; } } return; } repeat();';
  const entries=inspect(source);
  for(const text of ['loop','if','break','else','continue']) {
    const entry=hoverAt(entries,source.indexOf(text));assert.ok(entry.description,text);assert.equal(entry.type,undefined,text);
  }
  for(const entry of entries)assert.ok(hasHoverDetails(entry),source.slice(entry.from,entry.to));
});

test('uninstantiated function definitions retain symbolic signatures and parameter bindings',()=>{
  const source='fn unused(T:type,value:T):T { print(1); return value; }';
  const entries=inspect(source);
  for(const entry of entries)assert.ok(hasHoverDetails(entry),source.slice(entry.from,entry.to));
  const definition=hoverAt(entries,source.indexOf('unused'));
  assert.equal(definition.signature,'fn unused(T: type, value: T): T');
  assert.equal(definition.kind,'function template');assert.equal(definition.size,undefined);
  const value=hoverAt(entries,source.lastIndexOf('value'));
  assert.equal(value.signature,'value: T');assert.equal(value.type,'T');
  assert.equal(value.size,undefined);assert.equal(value.declarationColumn,18);
});

test('multiple specializations never replace the symbolic definition with the first instance',()=>{
  const source='fn identity(T:type,value:T):T { return value; } print(identity(i32,1)); print(identity(bool,true));';
  const entries=inspect(source);
  const name=hoverAt(entries,source.indexOf('identity'));
  assert.equal(name.kind,'function template');assert.equal(name.signature,'fn identity(T: type, value: T): T');
  for(const token of ['{','return','value;','}']) {
    const entry=hoverAt(entries,source.indexOf(token));assert.ok(hasHoverDetails(entry));assert.equal(entry.type,'T',token);assert.equal(entry.size,undefined,token);assert.equal(entry.matchedRule,undefined,token);
  }
  const first=hoverAt(entries,source.indexOf('identity(i32'));
  const second=hoverAt(entries,source.indexOf('identity(bool'));
  assert.equal(first.type,'i32');assert.equal(second.type,'bool');
});

test('type functions expose source bindings, dependent fields and docs before any instance exists',()=>{
  const source='// Makes a fixed-size buffer.\nfn buffer(T: type, size: usize): type {\n  struct Result {\n    // The stored elements.\n    data: T[size];\n  }\n  return Result;\n}';
  const entries=inspect(source,{entry:'templates.tower'}),get=needle=>hoverAt(entries,source.indexOf(needle));
  const definition=get('buffer(');assert.equal(definition.signature,'fn buffer(T: type, size: usize): type');
  assert.equal(definition.kind,'type function');assert.equal(definition.documentation,'Makes a fixed-size buffer.');
  assert.equal(definition.declarationFile,'templates.tower');assert.equal(definition.declarationLine,2);
  const type=get('T[size]'),size=get('size]'),field=get('data:');
  assert.equal(type.kind,'type parameter');assert.equal(type.signature,'T: type');
  assert.equal(type.binding,get('T: type').binding);
  assert.equal(size.kind,'compile-time parameter');assert.equal(size.type,'usize');assert.equal(size.size,4);
  assert.equal(size.binding,get('size:').binding);
  assert.equal(field.signature,'data: T[size]');assert.equal(field.type,'T[size]');assert.equal(field.size,undefined);
  assert.equal(field.documentation,'The stored elements.');assert.match(field.resolution,/arguments/);
  const returned=hoverAt(entries,source.lastIndexOf('Result'));
  assert.equal(returned.signature,'struct Result { data: T[size]; }');
  assert.equal(returned.binding,get('Result {').binding);assert.equal(returned.size,undefined);
  for(const entry of entries)assert.ok(hasHoverDetails(entry),source.slice(entry.from,entry.to));
});

test('dependent annotations preserve nested type applications, pointers, lexical shadowing and target widths',()=>{
  const source='fn example(T:type, value:T):void { var first:T = value; { var value:bool = true; print(value); } print(value); }\nfn box(T:type, size:usize):type { struct Result { items:T*[size]; } return Result; }';
  const entries=inspect(source),get=needle=>hoverAt(entries,source.indexOf(needle));
  assert.equal(get('value); }').type,'bool');assert.equal(get('value); }\n').type,'T');
  assert.equal(get('first:T').type,'T');assert.equal(get('first:T').size,undefined);
  assert.equal(get('items:').type,'T*[size]');
  const wide=inspect(source,{pointerBytes:8});
  assert.equal(hoverAt(wide,source.indexOf('size:')).size,8);
  const nested='fn box(T:type):type { struct Result { field:T; } return Result; } fn wrap(T:type):type { struct Result { field:box(T)*; } return Result; }';
  assert.equal(at(nested,'field:box').signature,'field: box(T)*');
  const counted='fn buffer(T:type,size:usize):type { struct Result { data:T[size]; } return Result; } fn wrap(T:type,size:usize):type { struct Result { nested:buffer(T,size); } return Result; }';
  assert.equal(at(counted,'size);').kind,'compile-time parameter');
});

test('generic information follows semantic captures under renamed declaration syntax',()=>{
  const source="parse CoreFunction = 'procedure' $name:Identifier '[' $params:CoreParameters? ']' '->' $type:CoreType $body:CoreBlock;\nprocedure unused[T:type,value:T]->T { return value; }";
  const entries=inspect(source),definition=hoverAt(entries,source.indexOf('unused'));
  assert.equal(definition.signature,'fn unused(T: type, value: T): T');assert.equal(definition.kind,'function template');
  assert.equal(hoverAt(entries,source.lastIndexOf('value')).signature,'value: T');
});

test('type function uses retain distinct concrete field layouts alongside the symbolic definition',()=>{
  const source='fn buffer(T:type,size:usize):type { struct Result { data:T[size]; } return Result; } var a:buffer(i32,4); var b:buffer(bool,2); print(sizeof(buffer(i32,4)));';
  const entries=inspect(source),get=needle=>hoverAt(entries,source.indexOf(needle));
  assert.equal(get('buffer(T').kind,'type function');assert.equal(get('data:').type,'T[size]');
  assert.equal(get('data:').size,undefined);
  assert.equal(get('a:buffer').type,'buffer(i32, 4)');assert.equal(get('a:buffer').size,16);
  assert.equal(get('b:buffer').type,'buffer(bool, 2)');assert.equal(get('b:buffer').size,2);
});

test('template member paths and operators have their own resolved or symbolic types',async()=>{
  const example=(await read('scaffolding/examples/templates.tower')).toString();
  for(const source of [example,example+'\nmissing();']) {
  const entries=inspect(source,{entry:'templates.tower'});
  const start=source.indexOf('fn pop('),get=(text,offset=0)=>hoverAt(entries,source.indexOf(text,start)+offset);
  const count=get('values.count =',7);
  assert.equal(count.kind,'field');assert.equal(count.signature,'count: usize');assert.equal(count.type,'usize');assert.equal(count.size,4);
  assert.equal(count.declarationLine,14);assert.equal(count.resolution,undefined);
  const subtract=get(' - ',1);
  assert.equal(subtract.kind,'binary operation');assert.equal(subtract.signature,'values.count - 1');assert.equal(subtract.type,'usize');
  assert.equal(get(' = ',1).kind,'assignment');assert.equal(get(' = ',1).type,'usize');
  assert.equal(get('storage.data').type,'buffer(T, 4)');
  assert.equal(get('data[values').signature,'data: T[4]');assert.equal(get('data[values').type,'T[4]');
  const element=get('[values.count]');assert.equal(element.kind,'indexed element');assert.equal(element.type,'T');assert.equal(element.size,undefined);
  for(const entry of [count,subtract,element])assert.notEqual(entry.kind,'function template');
  }
});

test('symbolic field substitution follows forward constructors, renamed parameters, docs and inferred locals',()=>{
  const source=`fn demo(U:type,p:wrap(U)*):U { var next = p.storage.count - 1; var empty = p.storage.count == 0; return p.storage.data[next]; }
fn wrap(Item:type):type { struct R { storage:bucket(Item,4); } return R; }
fn bucket(Element:type,n:usize):type { struct R { // Stored elements.
data:Element[n]; count:usize; } return R; }`;
  const entries=inspect(source),get=(text,offset=0)=>hoverAt(entries,source.indexOf(text)+offset);
  assert.equal(get('storage.count').type,'bucket(U, 4)');
  assert.equal(get('count -').type,'usize');
  assert.equal(get('data[next]').type,'U[4]');assert.equal(get('data[next]').documentation,'Stored elements.');
  assert.equal(get('[next]').type,'U');
  assert.equal(get('next =').signature,'var next: usize');assert.equal(get('next]').type,'usize');
  assert.equal(get('empty =').signature,'var empty: bool');assert.equal(get('==').type,'bool');
});

test('dependent inspection does not guess conditional record shapes or accept invalid concrete operators',()=>{
  const conditional='fn choice(T:type):type { struct A { count:usize; } struct B { count:bool; } if true { return A; } return B; } fn use(T:type,p:choice(T)*):void { print(p.count); }';
  assert.equal(at(conditional,'count);').kind,'member access');assert.equal(at(conditional,'count);').type,undefined);
  const pointer='fn box(T:type):type { struct R { count:usize; } return R; } fn use(T:type,p:box(T)**):void { print(p.count); }';
  assert.equal(at(pointer,'count);').type,undefined);
  for(const [type,number] of [['bool','1'],['u8','256']]) {
    const source=`fn box(T:type):type { struct R { count:${type}; } return R; } fn use(T:type,p:box(T)*):void { var value = p.count + ${number}; }`;
    const entry=hoverAt(inspect(source),source.indexOf(' + ')+1);
    assert.equal(entry.kind,'binary operation');assert.equal(entry.type,undefined);assert.equal(entry.size,undefined);
  }
});

test('template field queries preserve imported declaration ownership and target widths',()=>{
  const source="import tower; import 'helper'; fn demo(T:type,p:box(T)*):usize { return p.count; }";
  const options={entry:'main.tower',pointerBytes:8,files:[{path:'helper.tower',text:'import tower; fn box(E:type):type { struct R {\n// Number of stored entries.\ncount:usize; value:E; } return R; }'}]};
  const field=hoverAt(inspect(source,options),source.indexOf('p.count')+2);
  assert.equal(field.kind,'field');assert.equal(field.type,'usize');assert.equal(field.size,8);
  assert.equal(field.declarationFile,'helper.tower');assert.equal(field.documentation,'Number of stored entries.');
});

test('template pointer stores use their element type and do not treat arrays as pointers',()=>{
  const source='fn demo(T:type,p:i32*,q:T*,items:i32[4]):void { *p = 1; *q = *q; var item = *p; var invalid = *items; }';
  const entries=inspect(source),get=(text,offset=0)=>hoverAt(entries,source.indexOf(text)+offset);
  assert.equal(get('*p =').type,'i32');assert.equal(get('*p =',3).type,'i32');
  assert.equal(get('*q =').type,'T');assert.equal(get('*q =',3).type,'T');
  assert.equal(get('*p;').type,'i32');assert.equal(get('item =').type,'i32');
  assert.equal(get('*items;').type,undefined);
});
test('members, pointer receivers, nominal types and layouts come from checked fields',()=>{
  const source='struct Point { first:i32; ready:bool; } var p:Point; var pointer = &p; pointer.ready = true; print(pointer.ready);';
  const field=at(source,'ready);');assert.equal(field.signature,'ready: bool');assert.equal(field.kind,'field');
  assert.equal(field.offset,4);assert.equal(field.size,1);
  assert.match(field.description,/Each value of that struct has its own copy/);
  assert.equal(at(source,'pointer.ready);').type,'Point*');
  assert.equal(at(source,'Point;').kind,'type');
});
test('imports contribute real bindings without leaking their source ranges',()=>{
  const source='import tower; import "helper"; var result = answer(); print(result);';
  const entries=inspect(source,{files:[{path:'helper.tower',text:'import tower; fn answer():i32 { return 42; }'}]});
  const call=hoverAt(entries,source.indexOf('answer')+2);
  assert.equal(call.signature,'fn answer(): i32');assert.equal(call.declaration,undefined);
  assert.equal(call.declarationFile,'helper.tower');assert.equal(call.declarationLine,1);assert.equal(call.declarationColumn,15);
  assert.equal(hoverAt(entries,source.lastIndexOf('result')+2).type,'i32');
  assert.ok(entries.every(entry=>entry.to<=source.length));
});

test('dotted import segments retain their own source entities during hover inspection',()=>{
  const source='import tower; import helpers.answer; import "helpers/answer"; print(answer());';
  const entries=inspect(source,{files:[{path:'helpers/answer.tower',text:'import tower; fn answer():i32 { return 42; }'}]});
  const segments=['tower','helpers','answer'].map(name=>hoverAt(entries,source.indexOf(name)+1));
  assert.deepEqual(segments.map(entry=>entry.signature),['tower','helpers','answer']);
  assert.equal(new Set(segments.map(entry=>entry.entity)).size,3);
  for (const entry of segments) {
    assert.ok(entry.entity>0&&entry.components>0);
    assert.equal(source.slice(entry.from,entry.to),entry.signature);
    assert.equal(entry.type,undefined);
  }
  assert.equal(hoverAt(entries,source.lastIndexOf('answer')+1).signature,'fn answer(): i32');
});

test('enum member declarations and accesses use their nominal type and canonical spelling',()=>{
  const source='enum State:u32 { Idle = 0, Busy = 4 } var state:State = State.Busy;';
  const entries=inspect(source),member=hoverAt(entries,source.lastIndexOf('Busy')+1);
  assert.equal(member.signature,'State.Busy');assert.equal(member.kind,'enum member');
  assert.equal(member.type,'State');assert.equal(member.size,4);
  assert.equal(hoverAt(entries,source.indexOf('Busy')+1).signature,'State.Busy');
});
test('hover layouts use the explicit target pointer width',()=>{
  const source='var pointer:i32*;';
  assert.equal(at(source,'pointer', {pointerBytes:4}).size,4);
  assert.equal(at(source,'pointer', {pointerBytes:8}).size,8);
  assert.throws(()=>tower.inspectDocument(source,{pointerBytes:3}),/Invalid/);
  assert.throws(()=>tower.inspectDocument('var x:i32;\0print(x);'),/Invalid/);
});
test('Unicode ranges use UTF-8 transport and UTF-16 editor offsets; comments stay empty',()=>{
  const source='// 雪🚀\nvar `雪`:i32 = 42; print(`雪`);';
  const entries=inspect(source),entry=hoverAt(entries,source.lastIndexOf('雪'));
  assert.equal(entry.signature,'var `雪`: i32');assert.equal(entry.type,'i32');
  assert.equal(source.slice(entry.from,entry.to),'`雪`');
  assert.equal(hoverAt(entries,source.indexOf('🚀')),null);
});
test('incomplete suffixes retain checked earlier declarations and edits never reuse old types',()=>{
  const source='var answer:i32 = 42; print(answer); var unfinished:';
  assert.equal(at(source,'answer);').type,'i32');
  assert.equal(at('var answer:bool = true; print(answer);','answer);').type,'bool');
  const broken='var answer:i32 = true; print(answer);';
  assert.ok(inspect(broken).every(entry=>entry.type===undefined));
});
test('grammar files expose syntax/entity metadata under their own baseline',()=>{
  for(const editingModule of ['bedrock','foundation']) {
    const entries=inspect("parse Example = Identifier ';';",{editingModule});
    assert.ok(entries.length);assert.ok(entries.every(entry=>entry.entity>0&&entry.components>0));
  }
});

test('increment grammar hovers distinguish rule references, capture binding, literals and parsed replacement nodes',async()=>{
  const source=(await read('scaffolding/examples/increment.tower')).toString(),entries=inspect(source);
  const get=(needle,offset=1)=>hoverAt(entries,source.indexOf(needle)+offset);
  const capture=get('$target:CoreLocation');
  assert.equal(capture.kind,'capture binding');assert.equal(capture.capture,'target');
  assert.equal(capture.category,'CoreLocation');assert.equal(capture.type,undefined);
  const reference=get('$target:CoreLocation',10);
  assert.equal(reference.kind,'grammar reference');assert.match(reference.definition,/\$name:Identifier/);
  assert.ok(reference.alternatives>=3);assert.match(reference.definedIn,/foundation/);
  assert.equal(get("'++'").kind,'literal token');
  const rule=get('parse CoreCall',7);assert.equal(rule.kind,'parse rule');assert.ok(rule.alternatives>=2);
  assert.match(rule.documentation,/CoreLocation matches variables/);
  assert.match(get('parse CoreCall',1).documentation,/CoreLocation matches variables/);
  assert.doesNotMatch(rule.signature,/=>|\/\//);
  assert.equal(get('|=').kind,'grammar assignment');assert.match(get('|=').description,/Adds another way/);
  const call=get('replace { post_increment',12);
  assert.equal(call.signature,'fn post_increment(p: i32*): i32');assert.equal(call.type,'i32');
  assert.equal(call.replacementCategory,'CoreCall');
  assert.equal(get('&$target').kind,'capture substitution');
  assert.equal(get('&$target',0).kind,'address of');
  const hole=get('&$target',2);assert.equal(hole.capture,'target');assert.equal(hole.category,'CoreLocation');
  assert.equal(hole.type,undefined);assert.match(hole.description,/after substitution/);
  assert.ok(entries.filter(entry=>entry.description).every(entry=>entry.kind!=='grammar'));
});

test('grammar hovers cover token/skip metadata, repetitions, exclusions and alternatives in both bootstrap modes',()=>{
  const source="// Word documentation\ntoken Word = /[a-z]+/ when expected as string;\nskip Space = /[ ]+/;\nparse Example = $word:Word? '!'* Word+ | [^'{' '}'];";
  for(const editingModule of ['bedrock','foundation']) {
    const entries=inspect(source,{editingModule}),get=(needle,offset=0)=>hoverAt(entries,source.indexOf(needle)+offset);
    assert.equal(get('Word =').kind,'token declaration');assert.equal(get('Word =').documentation,'Word documentation');
    assert.equal(get('/[a-z]+/',3).kind,'lexical pattern');
    assert.equal(get('when',1).kind,'contextual token');
    assert.equal(get('string',1).kind,'highlight style');assert.match(get('string',1).description,/not declare a semantic type/);
    assert.equal(get('Space',1).kind,'skip declaration');
    for(const [needle,description] of [['?',/zero or one/],['*',/zero or more/],['Word+',/one or more/]]) {
      const entry=get(needle,needle==='Word+'?4:0);assert.equal(entry.kind,'repetition');assert.match(entry.description,description);
    }
    assert.equal(get("'!'",1).kind,'literal token');
    assert.equal(get('[^',1).kind,'token exclusion set');
    assert.equal(get("'{'",1).kind,'excluded token');
    assert.equal(get('|',0).kind,'alternative separator');
    const reference=get('$word:Word',7);assert.equal(reference.kind,'grammar reference');
    assert.equal(reference.definition,'token Word = /[a-z]+/');assert.equal(reference.documentation,'Word documentation');
  }
});

test('grammar reference snapshots preserve overrides, append order, pending rules and comment ownership',()=>{
  const source="// First\nparse Item = 'first';\nparse Before = Item;\n// Second\nparse Item = 'second';\nparse Middle = Item;\nparse Item |= 'third';\nparse After = Item;\nparse Pending = Future;\nparse Future = 'later';";
  const entries=inspect(source),get=needle=>hoverAt(entries,source.indexOf(needle)+needle.length-2);
  assert.equal(get('Before = Item;').definition,"'first'");assert.equal(get('Before = Item;').documentation,'First');
  assert.equal(get('Middle = Item;').definition,"'second'");assert.equal(get('Middle = Item;').documentation,'Second');
  assert.equal(get('After = Item;').definition,"'second' | 'third'");assert.equal(get('After = Item;').alternatives,2);
  const pending=get('Pending = Future;');assert.match(pending.resolution,/Not resolved at this declaration/);
  assert.equal(pending.definition,undefined);
});

test('nested replacement trees retain capture identity and distinguish blocks, calls and control flow',()=>{
  const source="fn sink(x:i32):void { print(x); }\nparse Statement |= 'twice' $value:CoreOperand ';' => replace { { sink($value); if true { sink($value); } } };\ntwice 3;";
  const entries=inspect(source),get=needle=>hoverAt(entries,source.indexOf(needle)+1);
  assert.equal(get('sink($value)').signature,'fn sink(x: i32): void');
  assert.equal(get('if true').kind,'replacement conditional');
  const holes=entries.filter(entry=>entry.kind==='capture substitution');
  assert.equal(holes.length,2);assert.ok(holes.every(entry=>entry.capture==='value'&&entry.category==='CoreOperand'&&!entry.type));
  const templateStart=source.indexOf('replace {')+9,templateEnd=source.lastIndexOf('};');
  const body=entries.filter(entry=>entry.from>=templateStart&&entry.to<=templateEnd);
  assert.ok(body.length>10);assert.ok(body.every(entry=>entry.description));
  const nodes=tower.exports.tw_live_nodes(),allocations=tower.exports.tw_live_allocations();
  for(let i=0;i<15;i++)inspect(source);
  assert.equal(tower.exports.tw_live_nodes(),nodes);assert.equal(tower.exports.tw_live_allocations(),allocations);
});

test('whole Bedrock and Foundation trees have meaningful grammar entries and valid ranges',async()=>{
  for(const editingModule of ['bedrock','foundation']) {
    const source=(await read(`scaffolding/${editingModule}.tower`)).toString(),entries=inspect(source,{editingModule});
    assert.ok(entries.length>300);
    for(const entry of entries) {
      assert.ok(entry.from>=0&&entry.to<=source.length&&entry.to>entry.from);
      assert.ok(entry.description,`${editingModule}: ${source.slice(entry.from,entry.to)} (${entry.syntax})`);
      assert.notEqual(entry.kind,'grammar');assert.notEqual(entry.kind,'syntax');
    }
  }
});

test('imports describe modules without mislabelling path segments as grammar categories',()=>{
  const source='import foundation;';
  for(const entry of inspect(source)) {
    assert.equal(entry.kind,'module import');assert.equal(entry.module,'foundation');
    assert.equal(entry.category,undefined);assert.equal(entry.alternatives,undefined);
  }
});

test('syntax-only foreach bodies inspect actual matched rules and captures across later overrides',async()=>{
  const source=(await read('scaffolding/examples/foreach.tower')).toString();
  const entries=inspect(source,{entry:'foreach.tower'});
  const body=source.indexOf('for (item'),end=source.indexOf('// Change the spelling');
  const tokens=entries.filter(entry=>entry.from>=body&&entry.to<end);
  assert.ok(tokens.length>=20);
  for(const entry of tokens) {
    assert.ok(entry.description,source.slice(entry.from,entry.to));
    assert.ok(entry.definition,source.slice(entry.from,entry.to));
    assert.equal(entry.type,undefined);
    assert.equal(hasHoverDetails(entry,source.slice(entry.from,entry.to)),true);
  }
  const get=needle=>hoverAt(entries,source.indexOf(needle,body)+1);
  const loop=get('for (item');assert.equal(loop.matchedRule,'ForEach');
  assert.match(loop.definition,/^'for'/);assert.equal(loop.documentation,undefined);
  assert.equal(loop.definedIn,'foreach.tower');
  for(const [needle,capture] of [['item in','Variable'],['items)','Expression'],['child in','Variable'],['children)','Expression']]) {
    const entry=get(needle);assert.equal(entry.kind,'captured syntax');
    assert.equal(entry.capture,capture);assert.equal(entry.category,capture);
    assert.equal(entry.capturedBy,'ForEach');assert.equal(entry.definition,'Identifier');
  }
  const later=get('foreach (entry');assert.match(later.definition,/^'foreach'/);
  assert.notEqual(later.definition,loop.definition);
  const nodes=tower.exports.tw_live_nodes(),allocations=tower.exports.tw_live_allocations();
  for(let i=0;i<15;i++)inspect(source,{entry:'foreach.tower'});
  assert.equal(tower.exports.tw_live_nodes(),nodes);assert.equal(tower.exports.tw_live_allocations(),allocations);
});

test('custom syntax follows named terminal captures and the actual selected alternative in imported rules',()=>{
  const grammar="import foundation; parse Value = Number | Identifier; // Bind a syntactic name and value.\nparse Statement = 'bind' $name:Identifier '=' $value:Value ';';";
  const source='import "grammar"; bind result = 42; bind other = result;';
  const entries=inspect(source,{files:[{path:'grammar.tower',text:grammar}]}),get=needle=>hoverAt(entries,source.indexOf(needle)+1);
  const name=get('result =');assert.equal(name.capture,'name');assert.equal(name.category,'Identifier');
  assert.equal(name.capturedBy,'Statement');assert.equal(name.type,undefined);
  assert.match(name.documentation,/Bind a syntactic name/);
  const number=get('42;');assert.equal(number.capture,'value');assert.equal(number.matchedRule,'Value');
  assert.equal(number.definition,'Number');assert.equal(number.definedIn,'grammar.tower');
  const identifier=get('result;');assert.equal(identifier.definition,'Identifier');assert.equal(identifier.type,undefined);
});

test('shared replacements show every possible capture category rather than claiming the first applies to all',()=>{
  const source="parse Statement |= 'one' $x:Number ';' | 'two' $x:CoreOperand ';' => replace { print($x); }; one 2; two 3;";
  const entry=at(source,'$x);');
  assert.equal(entry.kind,'capture substitution');assert.equal(entry.category,'Number | CoreOperand');
  assert.equal(entry.replacementAlternatives,2);assert.equal(entry.type,undefined);
});

test('templates become inspectable when later declarations activate their rules',()=>{
  const source="fn sink(x:i32):void { print(x); } parse Later = 'later' $value:CoreOperand ';' => replace { sink($value); }; parse Statement |= Later; later 4;";
  const entries=inspect(source),call=hoverAt(entries,source.indexOf('sink($value)')+1);
  assert.equal(call.signature,'fn sink(x: i32): void');assert.equal(call.replacementCategory,'Statement');
  assert.equal(at(source,'$value);').kind,'capture substitution');
  const pending="parse Unused = 'unused' $value:CoreOperand ';' => replace { print($value); };";
  assert.equal(at(pending,'$value);').kind,'replacement template');
});

test('generated functions, declarations and return nodes have their own template roles',async()=>{
  const source=(await read('scaffolding/tower.tower')).toString(),entries=inspect(source);
  for(const [needle,kind] of [['fn $name','replacement function'],['var result','replacement declaration'],['return result','replacement return']]) {
    const entry=hoverAt(entries,source.indexOf(needle)+1);assert.equal(entry.kind,kind);assert.ok(entry.description);
  }
});
test('document queries release their temporary shared entities after repeated inspection',()=>{
  const source='// Point documentation\nstruct Point { x:i32; }\n// Instance documentation\nvar p:Point; print(p.x);\n// A parameterized container.\nfn box(T:type):type { struct R { value:T; count:usize; } return R; } var b:box(i32); fn advance(T:type,p:box(T)*):usize { var next = p.count + 1; return next; }';
  for(const text of [source,source+'\nmissing();']) {
    inspect(text);
    const nodes=tower.exports.tw_live_nodes(),allocations=tower.exports.tw_live_allocations();
    for(let i=0;i<30;i++)inspect(text);
    assert.equal(tower.exports.tw_live_nodes(),nodes);assert.equal(tower.exports.tw_live_allocations(),allocations);
  }
});

test('hover documentation shares attached comments for local and imported bindings',()=>{
  const source='// Adds a value.\n// Keeps the original.\nfn increment(value:i32):i32 { var result = value + 1; return result; }\nprint(increment(41));';
  assert.equal(at(source,'increment(41').documentation,'Adds a value.\nKeeps the original.');
  assert.equal(hoverAt(inspect(source),source.indexOf('increment')+1).documentation,'Adds a value.\nKeeps the original.');
  const imported='import tower; import "helper"; print(answer());';
  const options={files:[{path:'helper.tower',text:'import tower;\n// The imported answer.\nfn answer():i32 { return 42; }'}]};
  assert.equal(at(imported,'answer()',options).documentation,'The imported answer.');
});

test('the templates example exposes push documentation at the declaration and resolved calls',async()=>{
  const source=(await read('scaffolding/examples/templates.tower')).toString();
  const entries=inspect(source),declaration=hoverAt(entries,source.indexOf('push(')+1),call=hoverAt(entries,source.lastIndexOf('push(')+1);
  for(const entry of [declaration,call])assert.match(entry.documentation??'',/This small example assumes there is space to push and a value to pop/);
  assert.match(call.signature,/i32/);
});

test('the bundled Templates definitions retain symbolic hovers despite semantic errors elsewhere',async()=>{
  const example=(await read('scaffolding/examples/templates.tower')).toString();
  for(const source of [example,example+'\nmissing();',example+'\nvar invalid:buffer(i32,0);',example.replace('var values:', 'var broken:bool = 42;\nvar values:')]) {
    const entries=inspect(source,{entry:'templates.tower'});
    const get=needle=>hoverAt(entries,source.indexOf(needle));
    const buffer=get('buffer('),field=get('data:');
    assert.equal(buffer.kind,'type function');assert.equal(buffer.signature,'fn buffer(T: type, size: usize): type');
    assert.equal(buffer.matchedRule,undefined);assert.equal(buffer.declarationFile,'templates.tower');
    assert.match(buffer.documentation,/Type and integer arguments/);
    assert.equal(field.type,'T[size]');assert.equal(field.size,undefined);
    assert.equal(get('T[size]').kind,'type parameter');
    assert.equal(get('size]').kind,'compile-time parameter');assert.equal(get('size]').type,'usize');
    assert.equal(get('size]').size,source===example?4:undefined);
    assert.equal(get('push(').kind,'function template');assert.match(get('push(').documentation,/space to push/);
    const handle=tower.compile(source);
    try {
      const result=tower.execute(handle,100000);
      assert.equal(result.status,source===example?'done':'error');
      if(source.includes('missing();')) {
        assert.match(result.error,/Unknown function 'missing'/);
        assert.equal(hoverAt(entries,source.lastIndexOf('missing')).type,undefined);
      }
    } finally { tower.destroyExecution(handle); }
  }
});

test('failed document checks never expose unfinished named-type layouts through generic metadata',()=>{
  for(const field of ['missing:Missing','cycle:Broken']) {
    const source=`struct Broken { ${field}; } fn demo(T:type,value:Broken):void {}`;
    const value=at(source,'value:');
    assert.equal(value.signature,'value: Broken');assert.equal(value.type,'Broken');
    assert.equal(value.size,undefined);assert.equal(value.alignment,undefined);
    assert.equal(value.matchedRule,undefined);
  }
});

test('presentation hides bare syntax tokens and converts declaration offsets after Unicode',()=>{
  const source='// 雪🚀\nvar value = 42;\nprint(value);';
  const entry=at(source,'value);');assert.equal(entry.declarationFrom,source.indexOf('var value'));
  assert.equal(entry.documentation,'雪🚀');
  assert.equal(hasHoverDetails(entry,'value'),true);
  for(const text of ['var',';','unknown'])assert.equal(hasHoverDetails({kind:'syntax',signature:text},text),false);
  assert.equal(hasHoverDetails({kind:'type',signature:'i32',type:'i32'},'i32'),true);
});
test('the presentation index selects the smallest containing range and respects token edges',()=>{
  const entries=hoverIndex('abcdef',{entries:[{from:0,to:6,signature:'outer'},{from:2,to:4,signature:'inner'}]});
  assert.equal(hoverAt(entries,3).signature,'inner');assert.equal(hoverAt(entries,4).signature,'outer');
  assert.equal(hoverAt(entries,4,-1).signature,'inner');assert.equal(hoverAt(entries,6),null);
});
test('document cache shares work and rejects replies from old inputs',async()=>{
  const calls=[];const cache=new DocumentQueries({request(key,payload){let resolve;const promise=new Promise(done=>resolve=done);const request={promise,cancel(){request.canceled=true;}};calls.push({key,payload,resolve,request});return request;}});
  const a={source:'x',compilerRevision:0},b={source:'y',compilerRevision:0};
  const first=cache.request(a);assert.equal(cache.request(a),first);
  const second=cache.request(b);assert.equal(calls[0].request.canceled,true);
  calls[0].resolve({entries:[{from:0,to:1,signature:'old'}]});assert.equal(await first,null);
  calls[1].resolve({entries:[{from:0,to:1,signature:'new'}]});const ready=await second;
  assert.equal(cache.request(b),ready);assert.equal(ready[0].signature,'new');
  cache.request({...b,compilerRevision:1});assert.equal(calls.length,3);cache.clear();
});

test('a canceled document request can be retried for the same snapshot',async()=>{
  let count=0;
  const cache=new DocumentQueries({request(){count++;return {promise:Promise.resolve(null),cancel(){}};}});
  assert.equal(await cache.request({source:'x'}),null);
  assert.equal(await cache.request({source:'x'}),null);assert.equal(count,2);
});
