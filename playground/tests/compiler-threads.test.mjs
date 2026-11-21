import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compilerThreads} from '../src/compiler-threads.mjs';
import {TowerWASI} from '../src/wasi-host.mjs';

let bytes;
try { bytes = await readFile('build/browser-wasi-threads/tower-work-tests.wasm'); }
catch (error) {
 if (error.code !== 'ENOENT' || process.env.TOWER_REQUIRE_THREADS === '1') throw error;
}

test('the Tower pool overlaps four distinct Wasm threads and reuses their jobs', {skip:!bytes, timeout:30000}, async () => {
 const module = await WebAssembly.compile(bytes);
 const transport = await compilerThreads(module);
 try {
  const wasi = new TowerWASI();
  const instance = await WebAssembly.instantiate(module, {
   env:transport.env, wasi:transport.wasi, wasi_snapshot_preview1:wasi.wasiImport,
  });
  transport.attach(instance); wasi.initialize(instance);
  // The Tower fixture holds all four workers behind one barrier. Queue width
  // alone cannot pass it. Repeat the complete pool lifecycle in one host too.
  for (let repeat = 0; repeat < 128; repeat++) {
   assert.equal(instance.exports.main(), 0, `pool lifecycle ${repeat}`);
  }
 } finally { transport.close(); }
});

test('a worker trap interrupts a blocked coordinator through shared failure state', {skip:!bytes, timeout:10000}, async () => {
 const module = await WebAssembly.compile(bytes);
 const transport = await compilerThreads(module, {workerURL:new URL('./compiler-failure-worker.mjs', import.meta.url)});
 try {
  const wasi = new TowerWASI();
  const instance = await WebAssembly.instantiate(module, {
   env:transport.env, wasi:transport.wasi, wasi_snapshot_preview1:wasi.wasiImport,
  });
  transport.attach(instance); wasi.initialize(instance);
  assert.throws(() => instance.exports.main(), /Injected compiler worker failure/);
  assert.equal(transport.failed(), true);
 } finally { transport.close(); }
});

test('declaration, body checking, lowering and staging are deterministic at 1/2/4/8 workers', {skip:!bytes, timeout:120000}, async () => {
 const {loadTower} = await import('./compiler-fixtures.mjs');
 const compiler = await readFile('build/browser-wasi-threads/tower.wasm');
 const foundation = await readFile('scaffolding/foundation.tower', 'utf8');
 const delayedLayout = await readFile('scaffolding/tests/decltype_layout.tower', 'utf8');
 const genericHeaders = await readFile('scaffolding/tests/decltype_generic_headers.tower', 'utf8');
 const aggregateTypes = await readFile('scaffolding/tests/decltype_aggregate.tower', 'utf8');
 const bodyContinuation = await readFile('scaffolding/tests/body_continuation.tower', 'utf8');
 const typeFields = (await readFile('scaffolding/tests/decltype_type_fields.tower', 'utf8')).replace('var seed12:u64=0;',
  Array.from({length:244},(_,i)=>`var seed${i+12}:decltype(seed${i+13});`).join('\n')+'\nvar seed256:u64=0;');
 const dependencyCanonical = new Map();
 let windowCanonical;
 const windowFunctions = Array.from({length:260},(_,i)=>
  `fn window${i}():i32 { var value=identity(${i}); return value+1; }`);
 const windowSource = 'import tower; fn identity(T:type,value:T):T { return value; }\n'
  + windowFunctions.join('\n') + '\nvar total:i32=0;\n'
  + windowFunctions.map((_,i)=>`total+=window${i}();`).join('\n') + '\nprint(total);';
 let genericCycleDiagnostic;
 const functions = Array.from({length:16}, (_, i) => `
fn f${i}(value: decltype(seed)): decltype(value) {
 var state: Shared;
 state.value = value;
 var address = &state.value;
 var result: decltype(address[0]) = address[0];
 var bonus: u64 = comptime(1 + 2);
 result += bonus;
 { defer { result += comptime(3); } }
 defer { result += bonus; }
 for(var j: u64 = 0; j < 3; j++) { result += j + ${i}; }
 if comptime(true) { return result; }
}`);
 const typedFunctions = Array.from({length:16}, (_,i) => `
fn typed${i}(value:Shared*, extra:u64):decltype(value.value) { return value.value + extra + ${i}; }`);
 const leaves = Array.from({length:16}, (_,i) => `var leaf${i} = -(${i}); var copy${i} = leaf${i};`);
 const records = Array.from({length:16}, (_,i) => `struct Record${i} { value:decltype(seed); next:Record${i}*; }`);
 const source = 'import tower;\nstruct Shared { value: u64; }\nfn identity(T:type, value:T):T { return value; }\n' + records.join('\n') + functions.join('\n') + typedFunctions.join('\n') +
  '\nvar seed: u64 = 0;\nvar `control value 1.0`: u64 = 7;\n' +
  'var inferredType: decltype(identity(seed));\n' +
  'var total = comptime(identity(' + functions.map((_,i) => `f${i}(0)`).join(' + ') + '));\n' +
  'print(total); print(`control value 1.0`);' +
  'print(comptime(comptime(10) + comptime(comptime(20) + 12)));' +
  'print(comptime(false ? comptime(1 / 0) : comptime(42)));' +
  'print(comptime(false && comptime(1 / 0 == 0)) ? 1 : 0);' +
  'var typed:Shared; typed.value=1; print(' + typedFunctions.map((_,i)=>`typed${i}(&typed,0)`).join('+') + ');' +
  leaves.join('\n') + '\nprint(' + leaves.map((_,i)=>`copy${i}`).join('+') + ');' +
  'var smallest = -2147483648; var copied = smallest; var exact:decltype(copied)=copied; print(exact);';
 const canonical = new Map();
 const moduleCanonical = new Map();
 let iterationCanonical;
 const genericCanonical = new Map();
 const genericFunctions = Array.from({length:16}, (_, i) => `
fn generic${i}(T:type, value:T):T {
 var result:decltype(value) = value;
 result += comptime(convert(T,3));
 { defer { result += comptime(convert(T,2)); } }
 for(var j:usize=0;j<3;j++) { result += convert(T,j+${i}); }
 return result;
}`);
 const genericSource = `import tower;
fn box(T:type):type { struct Item { value:T; } return Item; }
fn measure(T:type):usize { return sizeof(T); }
fn record_value(T:type, value:T*):u64 { return value.value; }
${genericFunctions.join('\n')}
var record:box(u64); record.value=73;
// These root calls create array types after the initial layout barrier.
// Their consumers must publish layouts before later leaf bodies run in workers.
print(measure(u32[7])); print(measure(u32[9]));
print(comptime(${genericFunctions.map((_,i)=>`generic${i}(u64,1)`).join('+')}));
print(comptime(${genericFunctions.map((_,i)=>`generic${i}(i32,1)`).join('+')}));
print(record_value(&record));`;
 for (const capacity of [1,2,4,8]) {
  const tower = await loadTower(compiler, undefined, foundation, undefined, undefined, {threads:{capacity}});
  try {
   assert.equal(tower.exports.lr_work_tests(), 0, `LR tables and ECS cleanup at ${capacity} workers`);
   for (const pointerBytes of [4,8]) for (let repeat = 0; repeat < 2; repeat++) {
    const handle = tower.compile(source, {pointerBytes});
    try {
     if (repeat) tower.useFast(handle);
     let output = '', result;
     do { result = tower.execute(handle, 10000); output += result.output; } while (result.status === 'executing');
     assert.equal(result.status, 'done', result.error);
     assert.equal(output, '504\n7\n42\n42\n0\n136\n-120\n-2147483648\n');
     const text = tower.foundation(handle).source;
     if (!canonical.has(pointerBytes)) canonical.set(pointerBytes, text);
     assert.equal(text, canonical.get(pointerBytes), `workers=${capacity}, width=${pointerBytes}, repeat=${repeat}`);
    } finally { tower.destroyExecution(handle); }
   }
   const invalid = tower.compile('import tower; fn earlier():i32 { return unknownFirst; } fn later():i32 { return unknownSecond; }');
   try {
    const result = tower.execute(invalid);
    assert.equal(result.status, 'error');
    assert.match(result.error, /unknownFirst/);
    assert.doesNotMatch(result.error, /unknownSecond/);
   } finally { tower.destroyExecution(invalid); }
   for (const prefixFailure of [false,true]) {
    const broken = tower.compile(`import tower;
fn identity(T:type,value:T):T { return value; }
fn first():i32 {
 defer { var cleanup:i32=comptime(3); }
 var value=identity(${prefixFailure ? 'unknownFirst' : '1'});
 return ${prefixFailure ? 'value' : 'unknownFirst'};
}
fn later():i32 { var value=identity(unknownSecond); return value; }`);
    try {
     const result=tower.execute(broken);
     assert.equal(result.status,'error');
     assert.match(result.error,/unknownFirst/);
     assert.doesNotMatch(result.error,/unknownSecond/);
    } finally { tower.destroyExecution(broken); }
   }
   for (const firstFails of [false,true]) {
    const broken = tower.compile(`import tower;
fn identity(T:type,value:T):T { return value; }
fn first():i32 { var value=identity(1); return ${firstFails ? 'unknownFirst' : 'value'}; }
fn later():i32 { return identity(unknownSecond); }`);
    try {
     const result=tower.execute(broken);
     assert.equal(result.status,'error');
     assert.match(result.error,firstFails ? /unknownFirst/ : /unknownSecond/);
     if (firstFails) assert.doesNotMatch(result.error,/unknownSecond/);
    } finally { tower.destroyExecution(broken); }
   }
   const window = tower.compile(windowSource);
   try {
    let result, output='';
    do { result=tower.execute(window,100000); output+=result.output; } while(result.status==='executing');
    assert.equal(result.status,'done',result.error);
    assert.equal(output,'33930\n');
    const source=tower.foundation(window).source;
    windowCanonical ??= source;
    assert.equal(source,windowCanonical,`body preparation windows at ${capacity} workers`);
   } finally { tower.destroyExecution(window); }
   // The body alone has no written generic call or parameterized local type.
   // foreach still instantiates its implicit nominal protocol functions.
   const iteration = tower.compile(`import tower; import library.vector;
fn plain():u64 { return 7; }
fn first(values:vector(u64)*):u64 {
 var total:u64=0; foreach(var item in values) { total += item + comptime(2); } return total;
}
fn second(values:vector(u64)*):u64 {
 var total:u64=0; foreach(var item in values) { total += item + comptime(2); } return total;
}
var values:vector(u64); vector_init(&values); defer vector_dispose(&values);
vector_push(&values,20); vector_push(&values,22);
print(first(&values)); print(second(&values)); print(plain());`);
   try {
    let result, output = '';
    do { result = tower.execute(iteration, 10000); output += result.output; } while (result.status === 'executing');
    assert.equal(result.status, 'done', result.error);
    assert.equal(output, '46\n46\n7\n');
    const text = tower.foundation(iteration).source;
    iterationCanonical ??= text;
    assert.equal(text, iterationCanonical, `implicit protocol publication at ${capacity} workers`);
   } finally { tower.destroyExecution(iteration); }
   for (const pointerBytes of [4,8]) for (let fast = 0; fast < 2; fast++) {
    const handle = tower.compile(genericSource, {pointerBytes});
    try {
     if (fast) tower.useFast(handle);
     let result, output = '';
     do { result = tower.execute(handle, 10000); output += result.output; } while (result.status === 'executing');
     assert.equal(result.status, 'done', result.error);
     assert.equal(output, '28\n36\n504\n504\n73\n');
     const text = tower.foundation(handle).source;
     if (!genericCanonical.has(pointerBytes)) genericCanonical.set(pointerBytes, text);
     assert.equal(text, genericCanonical.get(pointerBytes), `generic bodies: workers=${capacity}, width=${pointerBytes}, fast=${fast}`);
    } finally { tower.destroyExecution(handle); }
   }
   const genericInvalid = tower.compile(`import tower;
fn badFirst(T:type, value:T):T { return unknownFirst; }
fn badSecond(T:type, value:T):T { return unknownSecond; }
print(badFirst(1)); print(badSecond(2));`);
   try {
    const result = tower.execute(genericInvalid);
    assert.equal(result.status, 'error');
    assert.match(result.error, /unknownFirst/);
    assert.doesNotMatch(result.error, /unknownSecond/);
   } finally { tower.destroyExecution(genericInvalid); }
   const typeInvalid = tower.compile(`import tower;
fn badFirst(value:MissingFirst):void {}
fn badSecond(value:MissingSecond):void {}`);
   try {
    const result = tower.execute(typeInvalid);
    assert.equal(result.status, 'error');
    assert.match(result.error, /Unknown type 'MissingFirst'/);
    assert.doesNotMatch(result.error, /MissingSecond/);
   } finally { tower.destroyExecution(typeInvalid); }
   const leafInvalid = tower.compile('import tower; var first=unknownFirst; var second=unknownSecond;');
   try {
    const result = tower.execute(leafInvalid);
    assert.equal(result.status, 'error');
    assert.match(result.error, /Unknown local 'unknownFirst'/);
    assert.doesNotMatch(result.error, /unknownSecond/);
   } finally { tower.destroyExecution(leafInvalid); }
   const leafCycle = tower.compile('import tower; var first:decltype(second); var second:decltype(first);');
   try {
    const result = tower.execute(leafCycle);
    assert.equal(result.status, 'error');
    assert.match(result.error, /initializer dependency cycle first -> second -> first/);
   } finally { tower.destroyExecution(leafCycle); }
   const fieldsInvalid = tower.compile('import tower; struct First { first:i32; first:u64; } struct Second { second:i32; second:u64; }');
   try {
    const result = tower.execute(fieldsInvalid);
    assert.equal(result.status, 'error');
    assert.match(result.error, /duplicate field 'first'/);
    assert.doesNotMatch(result.error, /duplicate field 'second'/);
   } finally { tower.destroyExecution(fieldsInvalid); }
   for (const fixture of [delayedLayout, genericHeaders, typeFields, aggregateTypes, bodyContinuation])
   for (const pointerBytes of [4,8]) for (let fast=0; fast<2; fast++) {
    const handle=tower.compile(fixture,{pointerBytes});
    try {
     if (fast) tower.useFast(handle);
     let result, output='';
     do { result=tower.execute(handle,10000); output+=result.output; } while(result.status==='executing');
     assert.equal(result.status,'done',result.error);
     assert.equal(output,'0\n',`delayed layout: workers=${capacity}, width=${pointerBytes}, fast=${fast}`);
     const key = fixture + pointerBytes;
     const text = tower.foundation(handle).source;
     if (!dependencyCanonical.has(key)) dependencyCanonical.set(key, text);
     assert.equal(text, dependencyCanonical.get(key), `generic/layout dependencies: workers=${capacity}, width=${pointerBytes}, fast=${fast}`);
    } finally { tower.destroyExecution(handle); }
   }
   const genericCycle=tower.compile(await readFile('scaffolding/tests/semantic_invalid/decltype_generic_header_cycle.tower','utf8'));
   try {
    const result=tower.execute(genericCycle);
    assert.equal(result.status,'error');
    assert.match(result.error,/initializer dependency cycle/);
    genericCycleDiagnostic ??= result.error;
    assert.equal(result.error, genericCycleDiagnostic, `signature cycle at ${capacity} workers`);
   } finally { tower.destroyExecution(genericCycle); }
   const layoutCycle=tower.compile(await readFile('scaffolding/tests/semantic_invalid/decltype_layout_cycle.tower','utf8'));
   try {
    const result=tower.execute(layoutCycle);
    assert.equal(result.status,'error');
    assert.match(result.error,/Recursive by-value layout: Recursive -> Recursive/);
   } finally { tower.destroyExecution(layoutCycle); }
   const typeCycle=tower.compile(await readFile('scaffolding/tests/semantic_invalid/decltype_type_field_cycle.tower','utf8'));
   try {
    const result=tower.execute(typeCycle);
    assert.equal(result.status,'error');
    assert.match(result.error,/initializer dependency cycle/);
   } finally { tower.destroyExecution(typeCycle); }
   tower.configureModules({entry:'main.tower', files:[
    {path:'left.tower', text:'import tower; var seed:u64=3; var marker:u32=11; struct Item { value:decltype(seed); next:Item*; } fn read(T:type,item:T*):decltype(item.value) { return item.value; } fn box(T:type):type { struct Box { value:T; stamp:decltype(marker); } return Box; }'},
    {path:'right.tower', text:'import tower; var seed:u64=7; var marker:u64=13; struct Item { value:decltype(seed); next:Item*; } fn box(T:type):type { struct Box { value:T; stamp:decltype(marker); } return Box; }'},
   ]});
   const modules = `import tower; import left as l; import right as r;
struct Pair { first:decltype(l.seed); second:decltype(r.seed); }
var from_left=l.seed; var from_right=r.seed;
var pair:Pair; pair.first=from_left; pair.second=from_right;
// Parameter l hides the module alias. This needs the record's field/layout
// dependencies, so admission must use the signature's actual lexical scope.
fn shadow(l:r.Item*):decltype(l.value) { return l.value; }
var returned:decltype(l.read(&item));
var item:r.Item; item.value=9; print(shadow(&item)); print(pair.first+pair.second);
var left_box:l.box(u32); var right_box:r.box(u64);
left_box.value=1; left_box.stamp=l.marker; right_box.value=2; right_box.stamp=r.marker;
print(sizeof(l.box(u32))); print(sizeof(r.box(u64)));`;
   for (const pointerBytes of [4,8]) for (let fast=0; fast<2; fast++) {
    const handle=tower.compile(modules,{pointerBytes});
    try {
     if (fast) tower.useFast(handle);
     let result, output='';
     do { result=tower.execute(handle,10000); output+=result.output; } while(result.status==='executing');
     assert.equal(result.status,'done',result.error);
     assert.equal(output,'9\n10\n8\n16\n');
     const text=tower.foundation(handle).source;
     if (!moduleCanonical.has(pointerBytes)) moduleCanonical.set(pointerBytes,text);
     assert.equal(text,moduleCanonical.get(pointerBytes),`imported queries: workers=${capacity}, width=${pointerBytes}, fast=${fast}`);
    } finally { tower.destroyExecution(handle); }
   }
  } finally { tower.close(); }
  assert.throws(() => tower.compile('print(1);'), /compiler is closed/);
  assert.doesNotThrow(() => tower.destroyExecution(0));
 }
});
