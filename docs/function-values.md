# Function values

`function(Result, Parameters...)` is a nullable, noncapturing function value.
`function(void)` takes no arguments and returns no value. Function names and
`&name` produce the same value; `&variable` addresses storage holding that value.

```tower
import tower;

fn increment(value: i32): i32 { return value + 1; }
fn apply(callback: function(i32, i32), value: i32): i32 {
    return callback(value);
}

var callback = increment;
print(apply(callback, 41));
var fallback: function(i32, i32) = null;
fallback ??= increment;
print(fallback(41));
```

Function values work in locals, fields, arrays, parameters and results. Signatures
must match exactly for ordinary assignments and calls; there are no implicit
numeric promotions or captured environments. `==` and `!=` compare identities.
`default` is null, and `??`/`??=` provide lazy fallbacks. Calling null traps.
Use comparisons or descriptive names for output; printing a function directly is
rejected. Foundation retains its existing separate value/function namespaces: a
noncallable variable does not hide a named function in call position. A callable
binding takes precedence.

The callee is evaluated once, before arguments, which run left to right. Changing
the callback in an argument does not change the already selected callee. Tower
also supports `choose(true)(41)`, `(callback)(41)` and `(*slot)(41)`. Canonical
Foundation uses bound references and ordinary local calls after expression lifting.
Struct arguments/results retain their existing independent shallow-copy semantics;
their internal pointer/result-parameter lowering also applies to callback signatures.

Compile-time calls use the ordinary interpreter and dependency graph. Immutable,
eligible function bindings can be inferred at compile time, and `comptime(...)`
can return a function. The result retains a bound declaration reference; it never
serializes an interpreter number or host code address. Representation-changing
function casts cannot be evaluated at compile time. Other effect, initialization,
capability and runtime-capture restrictions remain the same as ordinary staging.

Function values have the selected target's pointer size/alignment. Native LLVM
uses code pointers; Wasm uses its function table. The portable interpreter uses a
private deterministic reference table, with entity handles kept outside guest
memory and the execution cache. These representations are not interchangeable
numeric addresses. Module functions live for the loaded program's lifetime.
Portable storage/interchange is canonical Foundation; `.towerbc` semantics/cache
version 5 reconstructs and verifies that Foundation before running its cache.

At runtime, explicit equal-width `bits` casts support low-level representation
round trips through integers or raw pointers. They do not make an incompatible
callee valid. Calls require a live function with a compatible target ABI:
parameter count, pointer class, scalar width and floating/integer register class
must agree. The interpreter diagnoses invalid references/signatures; native raw
invalid-address calls do not acquire a mandatory safety guarantee. Ordinary typed
calls remain exact even where low-level integer signedness has the same ABI bits.
Prefer typed callback storage and avoid representation casts in application code.

Extern/export callback boundaries use the target's ordinary C calling convention,
including narrow integer extension attributes. A foreign function with a different
convention needs a Tower wrapper before taking its value. Cross-object callbacks
and returned function values need no module initializer to register addresses.
External aggregate-by-value ABI classification, variadic callbacks, capturing
closures and generic-function address deduction remain separate work. The C and
BrightScript source emitters diagnose function values as unsupported; use LLVM
native/Wasm or the portable interpreter. JavaScript host callback adaptation is
separate from linking Tower callback code into a Wasm module.

Implementation and tests live in Tower, using the existing ECS body/declaration
workers, signature publication barrier and shared interpreter operations. Run
`tower-execution-tests <scaffolding-root> functions` for graph/cache agreement,
32/64-bit layouts, staging, round trips and 1/2/4/8-worker determinism. The
`function_foreign_provider.tower` and `function_foreign_client.tower` fixtures
exercise separately compiled callback boundaries.
