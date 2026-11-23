# Type values

Tower can carry a type as an ordinary opaque value, select it in a function,
return it, and evaluate that function when a static type is required:

```tower
import tower;

fn choose_type(small: bool): type {
    var result: type = i32;
    if small { result = u8; }
    return result;
}

var Small: type = choose_type(true);

fn example(): usize {
    var selected = choose_type(false);
    var value: selected;
    return sizeof(decltype(value));
}
print(example()); // 4
```

The function uses the ordinary interpreter and dependency graph. Its local
`result` is mutable. The caller's `selected` must be proved immutable and
compile-time available before it can determine `value`'s static layout. A later
write or address escape prevents that use. This is the same capture contract as
[computed integer type arguments](computed-type-arguments.md), including ordered
module initialization, checked lexical prefixes, helper bodies and query cycles.
Runtime type values cannot change the layout of existing static storage.

Ordinary type names are values in expression position unless a value binding
shadows them. `type_value(T)` explicitly forms a type value; `type_type()` is the
canonical Foundation spelling of the type of those values. Copies, assignment,
internal calls/returns, aggregate fields, `==` and `!=` are supported. Equality
uses the existing type identity rules: transparent aliases compare equal, while
separate nominal struct declarations remain distinct. Arithmetic, numeric casts,
printing a private type number, and a bare zero `default` for a type value are
rejected. Initialize a type value with an actual type.

Pointer suffixes remain type spelling: `return T*;` is not a value expression.
Use `return type_value(T*);` to return that descriptor, or
`return pointer_type(T);` for ordinary staged construction. Both can define a
type-producing alias used in an explicit specialization. Generic deduction does
not invert these calls: with `p: pointer(T)`, pass `indirect(i64, &value)`.
A structural parameter `p: T*` supports `indirect(&value)`. This is the existing
[inference subset](generic-call-inference.md), not runtime type construction.

Typed declaration attributes and staged aggregate results can contain type
values. These remain metadata until a particular protocol consumer defines and
validates their meaning; an annotation does not itself change arithmetic/layout.

There are still two compatibility distinctions. Module-level `var Name: type`
declares a transparent static alias, while a local declaration supplies ordinary
type-valued storage. A parameter written `T: type` remains a specialization
parameter; use `value: type_type()` for an ordinary value parameter carrying a
type. Existing restricted straight-return/nominal type constructors retain their
early identity publication. General bodies with control flow execute normally.
Unifying those constructor paths and staging policies is further work.

Known numeric forwarding into nominal construction is supported. For example,
`fn wrapped(T: type, size: usize): type { return buffer(T, size); }` used as
`wrapped(i32, 2)` retains the identity of `buffer(i32, 2)`. A chain of single-return
calls to an existing static constructor binds its source-declared integer
parameters through the ordinary integer-argument queries before its body is
cloned. Nested generic forwarding uses the same canonical specialization cache.
This restores the original numeric constructor contract. Numeric-only ordinary
wrappers still check their bodies without a bound call extent; forwarding such
a formal into nominal construction remains unsupported.

General bodies and ordinary callees still execute normally; non-integer or
dependent parameter signatures keep that path. This bounded known-call case
does not make nominal layout dynamic: a runtime-unknown argument, a mutable
capture, or a capture initializer reading a later module initializer cannot
supply its extent. Preparing an immutable binding does not reorder ordinary
module initialization. Ordinary
`array_type(T, size)` construction remains available through staged execution
and does not substitute for a nominal buffer identity.

The portable graph interpreter, cached interpreter, and LLVM native/Wasm output
support type values. Each execution/module uses its own disposable identity
index; no host address or index becomes the public identity of a type. Current
opaque storage occupies four bytes with four-byte alignment, independently of
target pointer width. Canonical Foundation stores `type_value(...)` with the
actual descriptor and nominal binding. Staged captures reconstruct references
in their consuming invocation. Type values introduced `.towerbc` semantics
version 8; see the [current package contract](../playground/README.md) for later
versions. Loading rejects incompatible caches and verifies reconstructed
Foundation before execution.

LLVM machine output can optimize type indexes internally. Its scalar return path
cannot reconstruct their type identities, so CLI and browser Foundation/bytecode
requests retain the checked canonical graph with optimization profile 0 when its
runtime roots reach type values. Module effects and exported functions are roots;
bound calls and function references admit private functions. Unused private type
helpers do not force this profile. This read-only query leaves the complete
canonical graph intact. It does not serialize lowered indexes as integer types.
Direct LLVM-to-Foundation import diagnoses this unsupported reconstruction.

Type-valued foreign/exported parameters and returns are rejected, including
metatypes nested in records, arrays, pointer payloads and callback signatures.
The descriptor scan follows recursive records once and checks function results
and parameters. There is no supported foreign representation contract for these
private indexes. The C/BrightScript source emitters diagnose type values as
unsupported. General reflected layouts and the complete source-defined
type/operation protocol remain milestones before fixed vectors.

The current source successor adds ordinary executed representation constructors:
`integer_type`, `float_type`, `pointer_type` and `array_type`. Their operands use
the ordinary interpreter, including mutable locals and executed control flow.
An evaluation-owned component suspends the interpreter on the shared work graph;
the coordinator validates the request and publishes its type identity. Array
layout requests use that same graph. Untaken branches make no construction
request. Numeric widths, signedness, array bounds and element legality remain
checked; this does not make arbitrary layouts or dynamic function signatures
available.

Construction currently requires compile-stage capability. Reaching one at runtime
evaluates its operands in order, preserving earlier effects and operand failures,
then reports the missing capability. It is not silently constant-folded. Static
signature and nominal identity forms retain their existing preparation, with
ordinary callee bindings taking precedence. The frozen `6aa8ffb` successor passes
the complete type suite. Later matched capture integration closes the historical
aggregate failures: compiler `30fd58bd` passes aggregate stages and the defined
initializer-order oracle across graph, cache and native execution. Those are
source-specific receipts in the journal, not validation of subsequent changes.
Final coherent validation, public pin and deployment remain pending in the L2
audit. The published bootstrap does not gain a capability merely because these
source changes are present.

The Tower fixture is `scaffolding/tests/type_object_values.tower`. The `types`
execution suite checks both interpreter engines, target pointer widths 4/8,
canonical Foundation reconstruction, worker counts 1/2/4/8, captures, shadowing,
and rejected mutable/representation uses. The browser LLVM fixture uses the same
Tower source. Publication and exact bootstrap validation receipts are recorded
in the implementation journal; source adoption must wait for the complete pin.
