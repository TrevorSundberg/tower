import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadTower,loadLLVM} from './compiler-fixtures.mjs';
const read=path=>readFile(new URL('../../'+path,import.meta.url));
const foundation=(await read('scaffolding/foundation.tower')).toString();
const tower=await loadTower(await read('build/browser-wasi/tower.wasm'),undefined,foundation);
const source='// original note\nfn answer():i32 { /* body note */ return 42; } print(answer()); // end note\n';

test('C consumes the same entities, preserves comments, strips on request and releases storage',()=>{
  const warm=tower.compile(source,{pointerBytes:8});
  tower.execute(warm,0); tower.foundation(warm); tower.cSource(warm); tower.destroyExecution(warm);
  const before=tower.exports.tw_live_nodes();
  const allocations=tower.exports.tw_live_allocations();
  for(let i=0;i<3;i++) {
    const h=tower.compile(source,{pointerBytes:8});
    try {
      assert.notEqual(tower.execute(h,0).status,'error');
      const canonical=tower.foundation(h).source;
      const round=tower.compile(canonical,{pointerBytes:8});
      try { assert.equal(tower.foundation(round).source,canonical); } finally { tower.destroyExecution(round); }
      for(const note of ['original note','body note','end note']) assert.ok(canonical.includes(note));
      const output=tower.cSource(h);
      assert.match(output,/int main\(void\)/);
      assert.match(output,/#define TC_POINTER_BYTES 8/);
      for(const note of ['original note','body note','end note']) assert.ok(output.includes(note));
      assert.ok(!tower.cSource(h,{comments:false}).includes('original note'));
      tower.stripComments(h);
      assert.ok(!tower.foundation(h).source.includes('original note'));
      assert.ok(!tower.cSource(h).includes('body note'));
    }finally{tower.destroyExecution(h);}
  }
  assert.equal(tower.exports.tw_live_nodes(),before);
  assert.equal(tower.exports.tw_live_allocations(),allocations);
});

test('LLVM optimization carries comments through compilable foundation and C',async()=>{
  const llvm=await loadLLVM(await read('build/browser-wasi-llvm/tower-llvm.wasm'),undefined,foundation);
  const h=tower.compile(source,{pointerBytes:8});
  try {
    for(const optimize of [false,true]) {
      const result=llvm.compile(tower.foundation(h).source,{emit:'foundation',optimize,target:'wasm64-unknown-unknown'});
      assert.equal(result.status,'compiled',result.error);
      const generated=tower.compile(result.foundation,{pointerBytes:8});
      try {
        assert.notEqual(tower.execute(generated,0).status,'error');
        for(const note of ['original note','body note','end note']) assert.ok(tower.cSource(generated).includes(note));
      }finally{tower.destroyExecution(generated);}
    }
  }finally{tower.destroyExecution(h);}
});

test('foreign C++ names diagnose instead of producing invalid C',()=>{
  const h=tower.compile('extern fn `cpp_name(void space::function())`():void; `cpp_name(void space::function())`();',{pointerBytes:8});
  try{assert.throws(()=>tower.cSource(h),/plain C identifier/);}finally{tower.destroyExecution(h);}
});

test('C ABI signatures retain signed parameters and return types',()=>{
  const h=tower.compile('export fn signed32(value:i32):i32 { return value; } export fn signed64(value:i64):i64 { return value; }',{pointerBytes:8});
  try {
    const text=tower.cSource(h);
    assert.match(text,/int32_t signed32\(int32_t v\d+\)/);
    assert.match(text,/int64_t signed64\(int64_t v\d+\)/);
  }finally{tower.destroyExecution(h);}
});
