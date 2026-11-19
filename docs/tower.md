# The Tower language layer

Use `import tower;` for the language above Foundation. Compiler code can use the
same layer. The [development plan](tower-language-plan.md) distinguishes the
implemented features below from upcoming enums, expression syntax, compile-time
execution, result types and ownership rules.

## Match and loops

```tower
import tower;

fn classify(value: i32): i32 {
    match value {
        -1 => { return 10; }
        0 | 1 => { return 20; }
        _ => { return 30; }
    }
}

var value = 0;
while value < 4 {
    print(classify(value));
    value = value + 1;
}
```

`match` is currently a statement over integers or bool. Evaluate the subject
exactly once, then execute one arm. Patterns are integer/boolean literals;
`|` groups alternatives. Duplicate and out-of-range patterns are errors.
The final `_` arm is required, including for bool. Commas after braced arms are
optional. There are no guards, bindings, ranges, enum patterns or match expressions
yet. Patterns cannot call named-value functions or arbitrary code.

Every body requires braces and introduces a lexical scope. A match is not a loop:
`break` and `continue` inside an arm apply to an enclosing loop. `while` tests its
bool condition before each iteration; `continue` retests it. Numeric conditions
are not implicitly converted to bool. Conditions/subjects use current Foundation
values (one binary operation or an operand, including nested calls), not general
expression precedence yet.

These constructs lower to existing Foundation operations. Canonical Foundation
contains generated locals, blocks, comparisons, ifs and loops; no backend opcode
or separate interpreter is required. Generated locals avoid all source spellings,
including quoted names. Lowering validates the existing 128-level Foundation
block limit, so a very large or deeply nested match can hit that limit sooner
than its surface braces suggest. The additional arm-count ceiling is 128.

`match` and `while` are keywords in the imported Tower grammar. Existing bindings
with those names may be written as quoted identifiers, such as `` `match` ``.
Foundation alone does not import these keywords or control-flow rules.

## Collection basics

```tower
import tower;
import 'library/queue';

var work: queue(i32);
queue_init(i32, &work);
var stored = queue_push(i32, &work, 42);
if stored {
    var value: i32;
    while queue_pop(i32, &work, &value) { print(value); }
}
queue_dispose(i32, &work);
```

`library/vector`, `library/stack` and `library/queue` use ordinary Tower type
constructors with explicit type arguments. Stack is a vector policy sharing its
storage type. Queue is a growing ring buffer preserving FIFO order when wrapping
or growing. Push/pop support scalar and pointer elements; aggregate ownership,
destructors, general iterators and templated foreach are later milestones.

Initialize before use and dispose afterward. Push/reserve return bool; failure
preserves the existing collection. Pop returns false for an empty collection or
null output and preserves both collection and output. A successful pop requires
valid output storage outside the remaining live elements. Output pointers and
collection structs are raw Foundation pointers/storage, not checked handles.

`vector_move`, `stack_move` and `queue_move` explicitly replace the destination's
storage, transfer the source storage, and reset the source to empty. Self-move is
a no-op. Distinct operands must already be initialized independent owners.
Element pointers are borrowed values: disposing a collection does not free
pointees. Growth invalidates borrowed element addresses. No implicit copy, move,
element destruction, garbage collection or exceptions are introduced.

Recoverable errors will use ordinary `result(T, E)` values after tagged payload,
aggregate-return and ownership contracts exist. The proposed `try` sugar will be
normal branching and early return with specified cleanup. It is not implemented
by the current boolean collection API.

The playground has **Match** and **Collections** examples. Imported library files
appear in the builtin tree and can be opened or edited there.

## Validation fixtures

`scaffolding/tests/language-control.tower` and `language-collections.tower` contain
the functional assertions as failure codes. Success prints `42` then `0` for the
control fixture, and `0` for collections. The existing browser test adapter runs
them on the graph and fast interpreters at both pointer widths, round-trips
canonical Foundation, and executes browser LLVM output. Negative semantic and
syntax fixtures cover malformed control flow, types, duplicate patterns and scope.
Syntax-invalid fixtures are deliberately excluded from the source formatter.
