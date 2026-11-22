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

The portable graph interpreter, cached interpreter, and LLVM native/Wasm output
support type values. Each execution/module uses its own disposable identity
index; no host address or index becomes the public identity of a type. Current
opaque storage occupies four bytes with four-byte alignment, independently of
target pointer width. Canonical Foundation stores `type_value(...)` with the
actual descriptor and nominal binding. Staged captures reconstruct references
in their consuming invocation. `.towerbc` semantic profile 8 invalidates older
caches and verifies reconstructed Foundation before execution.

Direct type-valued foreign/exported parameters and returns, including direct
pointers to type values, are rejected. There is no supported cross-module or
foreign representation contract for these private indexes; enclosing raw memory
and callback ABIs must not be used to transfer them. The C/BrightScript source
emitters diagnose type values as unsupported. This checkpoint does not implement
general reflected layouts, dynamically executed representation constructors such
as `integer_type(local_width, 1)`, or the complete source-defined type/operation
protocol. Those remain milestones before fixed vectors.

The Tower fixture is `scaffolding/tests/type_object_values.tower`. The `types`
execution suite checks both interpreter engines, target pointer widths 4/8,
canonical Foundation reconstruction, worker counts 1/2/4/8, captures, shadowing,
and rejected mutable/representation uses. The browser LLVM fixture uses the same
Tower source. Publication and exact bootstrap validation receipts are recorded
in the implementation journal; source adoption must wait for the complete pin.
