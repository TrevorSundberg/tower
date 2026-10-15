# The original temporal-opcode examples, in the minimal C-like API

These examples translate [the original proposal](../temporal-opcode.md), using
the [minimal typed API](temporal-c-api.md). No new temporal operations are added.

## Reading the examples

Each numbered example is a **separate session with a fresh default history**.
Its global arrays and output variables are initialized once and stay alive.
Ordinary application functions execute with temporal tracking enabled; their
calls, memory accesses and temporary values are automatically tracked.

The session listings show three runtime phases: input submission, application
execution, and a later correction at a quiescent boundary. Phase comments are
explanatory, not new language keywords. They do not turn an arbitrary straight-line
tracked `main` into a safe self-editing continuation. That continuation feature
has not been specified or implemented. In these examples the controller requests
repair while the application is paused, then inspects the corrected memory.

These are proposed compiler-aware C-like listings, not compilable standard-C
translation units. Assume `uint32_t`, `assert`, and the opaque API types are
available. No explicit history object, create/destroy call, `temporal_call`,
source-byte pointer, or byte-count argument appears in application code.

All arithmetic values here fit in 32 bits. The tests execute opcode-equivalent
versions, not a native C compiler. Descriptions of which calculations can be
reused express dependency behavior; they do not claim zero bookkeeping cost.

## 1. Reads / Loads: 72 becomes 48

The original computation is `(3 + 5) * 9`. We change the input event supplying
`9` to supply `6` instead.

Ordinary application code:

```c
uint32_t m[3] = {3, 5, 9};
uint32_t result = 0;

void calculate(void) {
    uint32_t a = m[0];
    uint32_t b = m[1];
    uint32_t c = a + b;
    uint32_t d = m[2];
    uint32_t e = c * d;
    result = e;
}
```

Session:

```c
// Input phase: give the third input an editable event identity.
Write<uint32_t> third_input = temporal_write(&m[2], 9);

// Application execution: an ordinary call, automatically tracked.
calculate();

// Controller observes the completed execution.
assert(result == 72);

// Later correction phase: replace that earlier input, not a present-day store.
Edit edit = temporal_edit();
temporal_replace(edit, third_input, 6);
RepairStatus status = temporal_repair(edit);

assert(status == TEMPORAL_OK);
assert(m[2] == 6);
assert(result == 48);
```

`a`, `b`, and `c` retain their values. `d` changes from 9 to 6, and `e` changes
from 72 to 48. The stored output follows `e`. There is no second call to
`calculate()` in the correction phase: repair updates its retained execution.

The baseline already contained 9; recording a write of the same 9 establishes
the specific externally editable event. This is not a requirement to wrap every
program assignment in `temporal_write`.

## 2. Writes / Stores: an intervening overwrite keeps the answer at 72

This is the original example where the program itself overwrites the third
cell with 9 before reading it.

Ordinary application code:

```c
uint32_t m[3] = {3, 5, 2};
uint32_t result = 0;

void calculate(void) {
    uint32_t a = m[0];
    uint32_t b = m[1];
    uint32_t c = a + b;

    m[2] = 9;                       // Ordinary automatically tracked store.

    uint32_t d = m[2];
    uint32_t e = c * d;
    result = e;
}
```

Session:

```c
// Input phase.
Write<uint32_t> third_input = temporal_write(&m[2], 2);

// Application execution.
calculate();

// Completed observation.
assert(m[2] == 9);
assert(result == 72);

// Later correction phase.
Edit edit = temporal_edit();
temporal_replace(edit, third_input, 6);
RepairStatus status = temporal_repair(edit);

assert(status == TEMPORAL_OK);
assert(m[2] == 9);                   // NOT 6: the later ordinary store wins.
assert(result == 72);
```

The historical input becomes 6, but `d` still reads the **later store of 9**.
No arithmetic result needs to change. Memory dependency identity includes the
historical producer, not only the address `&m[2]`.

This also covers the proposal's “Dependency Tracking” example. `c` depends on
`a` and `b`, and `e` depends on `c` and `d`, even if those values exist only as
temporaries/registers. No source-visible memory address is needed for them.

## 3. Rewinding & Modification: insert after the first sum, 80 becomes 88

Here there is no existing external write to replace. Instead, introduce a new
store at the gap immediately after computing `c`.

Ordinary application code:

```c
uint32_t m[4] = {3, 5, 9, 1};
uint32_t result = 0;

void calculate(void) {
    uint32_t a = m[0];
    uint32_t b = m[1];
    uint32_t c = a + b;

    temporal_mark("after_sum");

    uint32_t d = m[2];
    uint32_t e = m[3];
    uint32_t f = d + e;
    uint32_t g = c * f;
    result = g;
}
```

Session:

```c
// Application execution; the initial array is already part of the history.
calculate();

// Completed observation.
assert(result == 80);

// Later correction phase.
Point point = temporal_point("after_sum", 0);
Edit edit = temporal_edit();
Write<uint32_t> inserted = temporal_store_at(edit, point, &m[3], 2);
RepairStatus status = temporal_repair(edit);

assert(status == TEMPORAL_OK);
assert(m[3] == 2);
assert(result == 88);
```

The corrected execution means:

```c
uint32_t c = a + b;
// Historical insertion at the mark:
m[3] = 2;
uint32_t d = m[2];
uint32_t e = m[3];
```

`d` remains 9. `e`, `f`, and `g` change to 2, 11, and 88. The compiler/runtime
must preserve the mark's historical ordering: an optimization cannot move a
distinguishable load across it and thereby change the meaning of this edit.
This is a semantic requirement, not necessarily a hardware memory fence.

`inserted` is a persistent Write handle. It can be replaced or removed in a later
edit batch. The old `point` token, by contrast, becomes stale after successful
publication; obtain a new Point before making another insertion.

## 4. Independence: an unrelated factor remains reusable

This expands the proposal's `(3 + 5) * (9 + 1) * (3 + 7)` example. The extra
factor reads separate cells, so the runtime tracks its dependencies without
knowing what any number means.

Ordinary application code:

```c
uint32_t m[6] = {3, 5, 9, 1, 3, 7};
uint32_t result = 0;

void calculate(void) {
    uint32_t a = m[0];
    uint32_t b = m[1];
    uint32_t c = a + b;               // 8

    temporal_mark("after_sum");

    uint32_t d = m[2];
    uint32_t e = m[3];
    uint32_t f = d + e;               // 10

    uint32_t h = m[4];
    uint32_t i = m[5];
    uint32_t j = h + i;               // Independent factor: 10

    uint32_t k = c * f;               // 80
    result = k * j;                   // 800
}
```

Session:

```c
// Application execution.
calculate();

// Completed observation.
assert(result == 800);

// Later correction phase.
Point point = temporal_point("after_sum", 0);
Edit edit = temporal_edit();
Write<uint32_t> inserted = temporal_store_at(edit, point, &m[3], 2);
RepairStatus status = temporal_repair(edit);

assert(status == TEMPORAL_OK);
assert(result == 880);               // (3 + 5) * (9 + 2) * (3 + 7)
```

`h`, `i`, and `j` keep the same values. They execute **after** the historical
edit point but are not dependent on its changed bytes. Temporal position alone
does not require recomputing a value. The changing middle factor and final
multiplications do need updated values.

## 5. Time Point Merging / Equivalence: swap the inputs, keep 80

Both input changes are staged together. The sum becomes `5 + 3`, still 8.

Ordinary application code:

```c
uint32_t m[4] = {3, 5, 9, 1};
uint32_t result = 0;

void calculate(void) {
    uint32_t a = m[0];
    uint32_t b = m[1];
    uint32_t c = a + b;
    uint32_t d = m[2];
    uint32_t e = m[3];
    uint32_t f = d + e;
    uint32_t g = c * f;
    result = g;
}
```

Session:

```c
// Input phase.
Write<uint32_t> first_input  = temporal_write(&m[0], 3);
Write<uint32_t> second_input = temporal_write(&m[1], 5);

// Application execution.
calculate();

// Completed observation.
assert(result == 80);

// Later correction phase: one batch, one repair.
Edit edit = temporal_edit();
temporal_replace(edit, first_input, 5);
temporal_replace(edit, second_input, 3);
RepairStatus status = temporal_repair(edit);

assert(status == TEMPORAL_OK);
assert(m[0] == 5);
assert(m[1] == 3);
assert(result == 80);
```

The loaded values `a` and `b` change and their sum is checked again. Because `c`
is still 8, its consumer `g` can keep its previously computed result. The runtime
still updates whatever dependency metadata is required; “same result” does not
permit forgetting which inputs produced it.

## 6. Important contrast: inserting after a load does not rewrite that temporary

This is deliberately almost Example 3, but the mark is **after** loading `e`.

Ordinary application code:

```c
uint32_t m[4] = {3, 5, 9, 1};
uint32_t result = 0;

void calculate(void) {
    uint32_t a = m[0];
    uint32_t b = m[1];
    uint32_t c = a + b;
    uint32_t d = m[2];
    uint32_t e = m[3];                // Already read the historical 1.

    temporal_mark("after_load");

    uint32_t f = d + e;
    uint32_t g = c * f;
    result = g;
}
```

Session:

```c
// Application execution.
calculate();
assert(result == 80);

// Later correction phase.
Point point = temporal_point("after_load", 0);
Edit edit = temporal_edit();
Write<uint32_t> inserted = temporal_store_at(edit, point, &m[3], 2);
RepairStatus status = temporal_repair(edit);

assert(status == TEMPORAL_OK);
assert(m[3] == 2);                    // The memory store happened.
assert(result == 80);                 // But e still came from the earlier 1.
```

This is not a failure to track temporaries. It is precisely their historical
meaning: `e` is the value produced by a particular load, not a live alias that
changes whenever somebody later stores to the same address.

## 7. Two writes to one address are two different editable events

This extra example makes the meaning of `Write<T>` concrete.

Ordinary application code:

```c
uint32_t m[3] = {3, 5, 0};
uint32_t first_result = 0;
uint32_t second_result = 0;

uint32_t calculate(void) {
    uint32_t a = m[0];
    uint32_t b = m[1];
    uint32_t c = a + b;
    uint32_t d = m[2];
    return c * d;
}
```

Session:

```c
// Input phase, then first application execution.
Write<uint32_t> earlier = temporal_write(&m[2], 9);
first_result = calculate();           // The assignment is also tracked.

// Next input phase, then second application execution.
Write<uint32_t> later = temporal_write(&m[2], 6);
second_result = calculate();          // Another tracked assignment.

// Completed observations.
assert(first_result == 72);
assert(second_result == 48);

// Later correction phase: amend ONLY the earlier event.
Edit edit = temporal_edit();
temporal_replace(edit, earlier, 3);
RepairStatus status = temporal_repair(edit);

assert(status == TEMPORAL_OK);
assert(first_result == 24);           // (3 + 5) * 3
assert(second_result == 48);          // Still reads the later store of 6.
assert(m[2] == 6);                    // Latest store still wins.
```

The output assignments are part of the retained application executions. If they
were instead copies made by an untracked observer, those copies would remain
unchanged; only the retained invocation results and tracked memory would update.

## What about the remaining sections of the original document?

- **Globals:** global placement does not itself introduce dependencies on all
  global data. The examples above deliberately use global arrays. Actual byte
  reads, writes and operand flow determine coupling. A shared mutable allocator
  counter can create broad coupling because many operations access that counter.
- **Malloc:** changing an allocator's earlier execution can legitimately change
  later returned addresses and their consumers. Stable allocation identities are
  an optional policy requiring more machinery. These fixed-lifetime examples do
  not prove allocation/free/address-reuse semantics, and `temporal_store_at` does
  not insert an arbitrary `malloc` call.
- **Time and read-only I/O:** a known sampled value can be submitted using the
  existing typed `temporal_write`. The runtime must still specify newly executed
  external observations; selective repair cannot resample wall-clock time
  arbitrarily while claiming the same historical inputs.
- **File/network writes:** repairing tracked bytes does not retract physical
  effects. Those integrations need explicit effect/publication semantics. No
  unsupported undo API is invented here.

## Verification

Run all retained validation, including these seven examples:

```powershell
node docs/research/temporal-validation-all.mjs
```

The direct fixtures are in
[temporal-original-examples-validation.mjs](temporal-original-examples-validation.mjs).
They compare final bytes, byte-producer identities, dynamic instruction traces,
marks and results against independently executed full replay. They also check
which arithmetic/load result-cache entries change or remain reusable.

The typed API model still reconstructs memory and scans the dynamic trace. A
cache hit in these fixtures is **not** a measurement of dependency-proportional
runtime cost. The earlier fixed-instruction dirty-queue experiment validates a
different scheduling property. Neither substitutes for native compiler lowering
or its performance tests.
