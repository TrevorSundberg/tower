import { test } from 'node:test';
import assert from 'node:assert/strict';
import { StringStream } from '@codemirror/language';
import { outputParser } from '../src/output-syntax.mjs';

function tokens(syntax,text) {
  const parser=outputParser(syntax), state=parser.startState(), result=[];
  for(const line of text.split('\n')) {
    const stream=new StringStream(line,4,2);
    while(!stream.eol()) {
      stream.start=stream.pos;
      const tag=parser.token(stream,state);
      assert.ok(stream.pos>stream.start,'lexer must always advance');
      result.push([stream.current(),tag]);
    }
  }
  return result;
}
test('Tower output cannot fall back to an independent JavaScript keyword list',()=>{
  assert.throws(()=>outputParser('tower'), /shared compiler lexer/);
});
test('LLVM raw and optimized syntax includes SSA, metadata, labels and opcodes',()=>{
  const result=tokens('llvm','define i32 @main() {\nentry:\n %value = load i32, ptr @global, align 4 ; read\n ret i32 %value\n}');
  for(const item of [['define','keyword'],['@main','variableName'],['entry','labelName'],['load','keyword'],['ptr','typeName'],['ret','keyword']])
    assert.ok(result.some(token=>token[0]===item[0]&&token[1]===item[1]),item.join(':'));
});
for(const [syntax,text,opcode,register] of [
  ['x86','0x00001000  mov rax, qword ptr [rsp + 0x10]','mov','rax'],
  ['arm','0x00001000  ldr x0, [sp, #16]','ldr','x0'],
  ['wasm','0x00000100  i32.const 42','i32.const',null],
]) test(syntax+' disassembly highlights decoded instructions',()=>{
  const result=tokens(syntax,text);
  assert.equal(result.map(([text])=>text).join(''),text);
  assert.ok(result.some(([word,tag])=>word===opcode&&tag==='keyword'));
  if(register) assert.ok(result.some(([word,tag])=>word===register&&tag==='variableName.special'));
});
test('long and hostile display text remains literal and lexer always advances',()=>{
  const input='<img src=x onerror=alert(1)> '+ '"\\'.repeat(10000);
  assert.equal(tokens('llvm',input).map(([text])=>text).join(''),input);
});

test('C highlights types, preprocessing, comments and statements after semicolons',()=>{
  const result=tokens('c','#include <stdint.h>\n/* first\nsecond */ uint32_t value = 42; return value;');
  for(const item of [['#include','meta'],['uint32_t','typeName'],['return','keyword'],['42','number']])
    assert.ok(result.some(token=>token[0]===item[0]&&token[1]===item[1]),item.join(':'));
  assert.ok(result.some(([text,tag])=>text.includes('second')&&tag==='comment'));
});
test('prefixed x86 instructions are highlighted',()=>{
  const result=tokens('x86','0x00001000  rep stosq');
  for(const instruction of ['rep','stosq']) assert.ok(result.some(([word,tag])=>word===instruction&&tag==='keyword'));
});
