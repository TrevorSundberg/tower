import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compilerThreads} from '../src/compiler-threads.mjs';
import {TowerWASI} from '../src/wasi-host.mjs';

let bytes;
try { bytes = await readFile(process.env.TOWER_TEST_WORK_WASM ?? 'build/browser-wasi-threads/tower-work-tests.wasm'); }
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
 const {loadTower, generatedSource} = await import('./compiler-fixtures.mjs');
 const compiler = await readFile('build/browser-wasi-threads/tower.wasm');
 const foundation = await readFile('scaffolding/foundation.tower', 'utf8');
 const delayedLayout = await readFile('scaffolding/tests/decltype_layout.tower', 'utf8');
 const genericHeaders = await readFile('scaffolding/tests/decltype_generic_headers.tower', 'utf8');
 const aggregateTypes = await readFile('scaffolding/tests/decltype_aggregate.tower', 'utf8');
 const bodyContinuation = await readFile('scaffolding/tests/body_continuation.tower', 'utf8');
 const lazyBodies = await readFile('scaffolding/tests/decltype_lazy_body.tower', 'utf8');
 const lazyBodyBudget = await readFile('scaffolding/tests/generic_body_lazy.tower', 'utf8');
 const demandedBodyBudget = await readFile('scaffolding/tests/semantic_invalid/generic_body_demanded.tower', 'utf8');
 const expressionTypes = await readFile('scaffolding/tests/decltype_expressions.tower', 'utf8');
 const declarationContinuations = await readFile('scaffolding/tests/declaration_continuations.tower', 'utf8');
 const declarationInference = await readFile('scaffolding/tests/declaration_inference.tower', 'utf8');
 const declarationOperands = await readFile('scaffolding/tests/declaration_operands.tower', 'utf8');
 const enumExpressions = await readFile('scaffolding/tests/enum_expressions.tower', 'utf8');
 const defaults = await readFile('scaffolding/tests/default_initialization.tower', 'utf8');
 const namedInitialization = await readFile('scaffolding/tests/named_initialization.tower', 'utf8');
 const structValues = await readFile('scaffolding/tests/struct_values.tower', 'utf8');
 const knownBindings = await readFile('scaffolding/tests/known_bindings.tower', 'utf8');
 const computedTypeArguments = await readFile('scaffolding/tests/computed_type_arguments.tower', 'utf8');
 let stress;
 const dependencyCanonical = new Map();
 let windowCanonical;
 let genericCycleDiagnostic;
 let genericBodyBudgetDiagnostic;
 let operatorCycleDiagnostic;
 const continuationDiagnostics = new Map();
 const canonical = new Map();
 const moduleCanonical = new Map();
 let iterationCanonical;
 const genericCanonical = new Map();
 for (const capacity of [1,2,4,8]) {
  const tower = await loadTower(compiler, undefined, foundation, undefined, undefined, {threads:{capacity}});
  try {
   if (!stress) {
    stress = {};
    for (const name of ['workers', 'generic_workers', 'window', 'type_fields'])
     stress[name] = await generatedSource(tower, `scaffolding/tests/stress/${name}.tower`);
   }
   const {workers:source, generic_workers:genericSource, window:windowSource, type_fields:typeFields} = stress;
   assert.equal(tower.exports.lr_work_tests(), 0, `LR tables and ECS cleanup at ${capacity} workers`);
   for (const width of [4,8]) {
    assert.equal(tower.exports.semantic_world_tests(width), 0, `World budgets and shared kernels at ${capacity} workers, width ${width}`);
   }
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
   const invalid = tower.compile(await readFile('scaffolding/tests/semantic_invalid/worker_body_errors.tower','utf8'));
   try {
    const result = tower.execute(invalid);
    assert.equal(result.status, 'error');
    assert.match(result.error, /unknownFirst/);
    assert.doesNotMatch(result.error, /unknownSecond/);
   } finally { tower.destroyExecution(invalid); }
   for (const name of ['worker_suffix_error','worker_prefix_error']) {
    const broken = tower.compile(await readFile(`scaffolding/tests/semantic_invalid/${name}.tower`,'utf8'));
    try {
     const result=tower.execute(broken);
     assert.equal(result.status,'error');
     assert.match(result.error,/unknownFirst/);
     assert.doesNotMatch(result.error,/unknownSecond/);
    } finally { tower.destroyExecution(broken); }
   }
   for (const firstFails of [false,true]) {
    const broken = tower.compile(await readFile(`scaffolding/tests/semantic_invalid/worker_${firstFails ? 'first' : 'later'}_error.tower`,'utf8'));
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
   const iteration = tower.compile(await readFile('scaffolding/tests/worker_iteration.tower','utf8'));
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
   const genericInvalid = tower.compile(await readFile('scaffolding/tests/semantic_invalid/worker_generic_errors.tower','utf8'));
   try {
    const result = tower.execute(genericInvalid);
    assert.equal(result.status, 'error');
    assert.match(result.error, /unknownFirst/);
    assert.doesNotMatch(result.error, /unknownSecond/);
   } finally { tower.destroyExecution(genericInvalid); }
   const typeInvalid = tower.compile(await readFile('scaffolding/tests/semantic_invalid/worker_type_errors.tower','utf8'));
   try {
    const result = tower.execute(typeInvalid);
    assert.equal(result.status, 'error');
    assert.match(result.error, /Unknown type 'MissingFirst'/);
    assert.doesNotMatch(result.error, /MissingSecond/);
   } finally { tower.destroyExecution(typeInvalid); }
   const leafInvalid = tower.compile(await readFile('scaffolding/tests/semantic_invalid/worker_leaf_errors.tower','utf8'));
   try {
    const result = tower.execute(leafInvalid);
    assert.equal(result.status, 'error');
    assert.match(result.error, /Unknown local 'unknownFirst'/);
    assert.doesNotMatch(result.error, /unknownSecond/);
   } finally { tower.destroyExecution(leafInvalid); }
   const leafCycle = tower.compile(await readFile('scaffolding/tests/semantic_invalid/decltype_cycle.tower','utf8'));
   try {
    const result = tower.execute(leafCycle);
    assert.equal(result.status, 'error');
    assert.match(result.error, /initializer dependency cycle first -> second -> first/);
   } finally { tower.destroyExecution(leafCycle); }
   for (const name of [
    'comptime_generic_selected', 'worker_generic_mismatch', 'inference_alias_invalid',
    'declaration_index_cycle', 'worker_index_errors',
   ]) {
    const source=await readFile(`scaffolding/tests/semantic_invalid/${name}.tower`,'utf8');
    const handle=tower.compile(source);
    try {
     const result=tower.execute(handle);
     assert.equal(result.status,'error');
     assert.match(result.error,/Division by zero|Expected (i32|u64), got bool|Type constructors currently support a struct and return|initializer dependency cycle first -> second -> first|An index must be an integer/);
     const diagnostic={error:result.error,offset:result.errorOffset};
     if (!continuationDiagnostics.has(source)) continuationDiagnostics.set(source,diagnostic);
     assert.deepEqual(diagnostic,continuationDiagnostics.get(source),`declaration continuation errors at ${capacity} workers`);
    } finally { tower.destroyExecution(handle); }
   }
   const fieldsInvalid = tower.compile(await readFile('scaffolding/tests/semantic_invalid/worker_field_errors.tower','utf8'));
   try {
    const result = tower.execute(fieldsInvalid);
    assert.equal(result.status, 'error');
    assert.match(result.error, /duplicate field 'first'/);
    assert.doesNotMatch(result.error, /duplicate field 'second'/);
   } finally { tower.destroyExecution(fieldsInvalid); }
   for (const fixture of [delayedLayout, genericHeaders, typeFields, aggregateTypes, bodyContinuation, lazyBodies, lazyBodyBudget, expressionTypes, declarationContinuations, declarationInference, declarationOperands, enumExpressions, defaults, namedInitialization, structValues, knownBindings, computedTypeArguments])
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
   const operatorCycle=tower.compile(await readFile('scaffolding/tests/semantic_invalid/worker_operator_cycle.tower','utf8'));
   try {
    const result=tower.execute(operatorCycle);
    assert.equal(result.status,'error');
    assert.match(result.error,/initializer dependency cycle left -> right -> left/);
    operatorCycleDiagnostic ??= result.error;
    assert.equal(result.error,operatorCycleDiagnostic,`operator cycle at ${capacity} workers`);
   } finally { tower.destroyExecution(operatorCycle); }
   const bodyBudget=tower.compile(demandedBodyBudget);
   try {
    const result=tower.execute(bodyBudget);
    assert.equal(result.status,'error');
    assert.match(result.error,/Template expansion exceeds 65536 nodes/);
    assert.equal(result.output,'');
    genericBodyBudgetDiagnostic ??= result.error;
    assert.equal(result.error,genericBodyBudgetDiagnostic,`clone budget at ${capacity} workers`);
   } finally { tower.destroyExecution(bodyBudget); }
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
    {path:'left.tower', text:await readFile('scaffolding/tests/worker_modules/left.tower','utf8')},
    {path:'right.tower', text:await readFile('scaffolding/tests/worker_modules/right.tower','utf8')},
   ]});
   const modules = await readFile('scaffolding/tests/worker_modules/main.tower','utf8');
   for (const pointerBytes of [4,8]) for (let fast=0; fast<2; fast++) {
    const handle=tower.compile(modules,{pointerBytes});
    try {
     if (fast) tower.useFast(handle);
     let result, output='';
     do { result=tower.execute(handle,10000); output+=result.output; } while(result.status==='executing');
     assert.equal(result.status,'done',result.error);
     assert.equal(output,'9\n10\n9\n17\n8\n16\n');
     const text=tower.foundation(handle).source;
     assert.doesNotMatch(text,/missing_import_body/);
     if (!moduleCanonical.has(pointerBytes)) moduleCanonical.set(pointerBytes,text);
     assert.equal(text,moduleCanonical.get(pointerBytes),`imported queries: workers=${capacity}, width=${pointerBytes}, fast=${fast}`);
    } finally { tower.destroyExecution(handle); }
   }
  } finally { tower.close(); }
  assert.throws(() => tower.compile('print(1);'), /compiler is closed/);
  assert.doesNotThrow(() => tower.destroyExecution(0));
 }
});
