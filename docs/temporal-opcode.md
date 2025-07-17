# Temporal-Opcode Concept

Temporal-opcode is the idea that we can undo and redo changes made by a language opcode; go back in time and fast forward. In a typical undo/redo stack, when we undo back to a point and make a different change, that typically wipes out the redo future. However, temporal-opcode differs in that it rigorously tracks all load/store/operation dependencies in a way that we can know only exactly what was affected by changing the past, making fast forwarding take zero time if the change didn't affect the future. Similar to the butterfly effect, but with dependency tracking to minimize the changes that the butterfly wings could affect.

A requirement of temporal-opcode is that all instructions are well defined and determanistic, there is no undefined behavior allowed.

Also to note, this feature may not be always turned on as it potentially has performance implications, but to support the Tower compiler's minimal rebuild feature, the compiler itself (when written in Tower) would enable this feature to intstrument the opcode.


## Reads / Loads

```ts
// Initial memory starting at 0: [3, 5, 9]
// Equivalent of (3 + 5) * 9 = 72 with loads
let a = *0;     // read the value 3
let b = *1;     // read the value 5
let c = a + b;  // 3 + 5 = 8
let d = *2;     // read the value 9
let e = c * d;  // 8 * 9 = 72
```

Now if we go back to the start of the program and modify address 2 to be 6 instead of 9, observe that if we saved each result, `a,b,c` remain the same and we only need to redo the calculations for `d,e`:
```ts
// Modified memory starting at 0: [3, 5, 6]
// Equivalent of (3 + 5) * 6 = 48 with loads
let d = *2;     // read the value 6
let e = c * d;  // 8 * 6 = 48
```


## Writes / Stores

In order to faciliate writes to memory, we actually need each byte to have a version. This is similar to Static Single Assignmment (SSA) form where each change to a variable has a unique version. To illustrate why, lets look at this example where the initial memory is slightly different than above but a write makes it the same:

```ts
// Initial memory starting at 0: [3, 5, 2]
// Equivalent of (3 + 5) * 9 = 72 with loads
let a = *0;     // read the value 3
let b = *1;     // read the value 5
let c = a + b;  // 3 + 5 = 8
*2 = 9;         // change address 2 value 2 to 9, memory is [3, 5, 9] same as above
let d = *2;     // read the value 9
let e = c * d;  // 8 * 9 = 72
```

However, when we go back and attempt to change initial memory like before, the result should be the same because of the write/store operation which changed 2 to 9.

```ts
// Initial memory starting at 0: [3, 5, 6]
// Equivalent of (3 + 5) * 9 = 72 with loads
let a = *0;     // read the value 3
let b = *1;     // read the value 5
let c = a + b;  // 3 + 5 = 8
*2 = 9;         // change address 2 value 6 to 9, memory is [3, 5, 9] same as above
let d = *2;     // read the value 9
let e = c * d;  // 8 * 9 = 72, same result
```

Ideally we should know that we do not need to redo ANY calculations, and in fact we can by using SSA style versioning on memory. If we write each memory value with a subscript `_0` meaning version 0, lets visualize this again:

```ts
// Initial memory starting at 0: [3_0, 5_0, 6_0]
// Equivalent of (3 + 5) * 9 = 72 with loads
let a = *0;     // read the value 3_0
let b = *1;     // read the value 5_0
let c = a + b;  // 3 + 5 = 8
*2 = 9;         // change address 2 value 6_0 to 9_1, memory is [3_0, 5_0, 9_1], observe version change
let d = *2;     // read the value 9_1
let e = c * d;  // 8 * 9 = 72, same result
```

The fundamental reason we didn't need to redo any calculations is because there are no dependencies on 6_0! Value `d` is dependent upon `9_1`, not simply just on address 2.


## Dependency Tracking

We are able to achieve everything above through dependency tracking. Though this sounds horribly non-performant and in the future there will be many documented optimizations to make this much quicker, the idea is that once we execute any opcode, we mark what dependencies that opcode has on both memory (for load/store or read/write) as well as dependency upon the value of other opcodes.

In the previous examples we used the `let` with incrementing letter variable names, but note that in SSA form you cannot re-assign any of these values, they are all fundamentally unique and constant upon completion. You could imagine this as if somewhere we're storing the result of each opcode and which values it dependended upon previously. However, SSA form allows us to eliminate a lot of that because we know it's determanistic and each value is unique.

Dependency tracking could look something like:

```ts
// Initial memory starting at 0: [3_0, 5_0, 6_0]
// Equivalent of (3 + 5) * 9 = 72 with loads
a depends on address 0 version 0 value 3 [3_0]
b depends on address 1 version 0 value 5 [5_0]
c depends on a and b value 8
d depends on address 2 version 1 value 9 [9_1]
e depends on c and d value 72
```

## Rewinding & Modification

With proper dependency tracking and saving results of calculations, it becomes clear that we can rewind to any part of our program. In our previous examples we always rewound to the beginning of the program and made a change. Lets look at an example where we rewind to a part in the middle and make a change, observing future effects.

```ts
// Initial memory starting at 0: [3_0, 5_0, 9_0, 1_0]
// Equivalent of (3 + 5) * (9 + 1) = 80 with loads
let a = *0;     // read the value 3_0
let b = *1;     // read the value 5_0
let c = a + b;  // 3 + 5 = 8
let d = *2;     // read the value 9_0
let e = *3;     // read the value 1_0
let f = d + e;  // 9 + 1 = 10
let g = c * f;  // 8 * 10 = 80
```

After the first execution we have the dependency graph:

```ts
// Initial memory starting at 0: [3_0, 5_0, 9_0, 1_0]
// Equivalent of (3 + 5) * (9 + 1) = 80 with loads
a depends on address 0 version 0 value 3 [3_0]
b depends on address 1 version 0 value 5 [5_0]
c depends on a and b value 8
d depends on address 2 version 0 value 9 [9_0]
e depends on address 3 version 0 value 1 [1_0]
f depends on d and e value 10
g depends on c and f value 80
```

Lets rewind to right after `let c` and change address 3 from value 1 to 2. It's as if we are inserting the instruction `*3 = 2;` which modifies `1_0` to be `2_1`. Even though this change comes BEFORE `let d`, we don't need to redo `d` as it has no dependency on the change we made. We only need to redo `e,f,g`:

```ts
// Modified memory starting at 0: [3_0, 5_0, 9_0, 2_0]
// Equivalent of (3 + 5) * (9 + 2) = 88 with loads
let e = *3;     // read the value 2_1
let f = d + e;  // 9 + 2 = 11
let g = c * f;  // 8 * 11 = 88
```

## Independence

As in the above example, the calculation for `d` did not need to be redone. Extrapolating this to larger amounts of code, the basic idea is that if calculations are entirely independent of previous values, they do NOT need to be redone. This is a consequence of having an opcode level dependency graph. If we added another term to the end such as `(3 + 5) * (9 + 1) * (3 + 7)`, even with the change from `(9 + 1)` to `(9 + 2)`, it should be clear that the operations for `(3 + 7)` do not need to be redone, however the final result WOULd need to be recalculated.


## Time Point Merging / Equivalence

Another observation we can make is that even if values had changed in the past, if they end up computing out to the same values, then fundamentally we can avoid reruninning calculations in the future.

If we changed `(3 + 5) * (9 + 1) = 80` and flipped the first arguments to `(5 + 3) * (9 + 1) = 80`, the result is the same. Whilst we need to re-run the calculation for `5 + 3` (especially if it was a non-communative operator like division), since the result is still 8, the `8 * (9 + 1) = 80` operations do not need to re-run. Lets observe the previous example:

```ts
// Initial memory starting at 0: [3_0, 5_0, 9_0, 1_0]
// Equivalent of (3 + 5) * (9 + 1) = 80 with loads
let a = *0;     // read the value 3_0
let b = *1;     // read the value 5_0
let c = a + b;  // 3 + 5 = 8
let d = *2;     // read the value 9_0
let e = *3;     // read the value 1_0
let f = d + e;  // 9 + 1 = 10
let g = c * f;  // 8 * 10 = 80
```

After the first execution we have the dependency graph:

```ts
// Initial memory starting at 0: [3_0, 5_0, 9_0, 1_0]
// Equivalent of (3 + 5) * (9 + 1) = 80 with loads
a depends on address 0 version 0 value 3 [3_0]
b depends on address 1 version 0 value 5 [5_0]
c depends on a and b value 8
d depends on address 2 version 0 value 9 [9_0]
e depends on address 3 version 0 value 1 [1_0]
f depends on d and e value 10
g depends on c and f value 80
```

Now lets rewind back and modify memory so that we flip the first two values 3 and 5, incrementing the version too:


```ts
// Initial memory starting at 0: [5_1, 3_1, 9_0, 1_0]
// Equivalent of (5 + 3) * (9 + 1) = 80 with loads
let a = *0;     // read the value 5_1
let b = *1;     // read the value 3_1
let c = a + b;  // 5 + 3 = 8
```

```ts
// Initial memory starting at 0: [5_1, 3_1, 9_0, 1_0]
// Equivalent of (5 + 3) * (9 + 1) = 80 with loads
a depends on address 0 version 0 value 3 [3_0]
b depends on address 1 version 0 value 5 [5_0]
c depends on a and b value 8 // can stop here
```

With realizing that the value `c` is equivalent in our dependency graph, we can observe that we had to redo calculation for `a,b,c`, but after that point all values remain the same and we can skip to the end.


## Globals and Malloc

As the saying goes `globals are bad`, and in the case of temporal-opode it's just as true because it creates a huge amount of dependencies upon a single value that could possibly change, causing cascading future changes (butterfly effect again).

For the most part, it's possible to imagine a standard library and a world where the core of the language uses almost no globals, or if it does those globals remain constant for the duration of the program avoiding cascading changes.

However one unsolved piece of this puzzle is `malloc`, which is effectively a global allocator. Imagine this example:

```ts
let a = malloc(1); // could be address 0
let b = malloc(1); // could be address 1
```

If we rewound to just after `let a` and inserted another call to `malloc`, unfortunately because of it's global nature it affects the value of `let b`, we may get a different address returned.

```ts
let a = malloc(1); // could be address 0
let x = malloc(1); // could be address 1, affecting the future
let b = malloc(1); // could be address 2
```

I very much like the libc implementation `musl`, which is widely used now in WASM programs to implement the standard library including a malloc style allocator. It has been a goal of mine to allow Tower programmers to implement their own allocators much like native programmers do in C. However when it comes to partitioning memory, we may need a level of indirection here to solve this problem.

We could have a built in fundamental malloc for Tower that always returns predictable addresses:

```ts
let a = malloc(1); // could be address 0
let x = malloc(1); // could be address 2, order preserved
let b = malloc(1); // could be address 1
```

How the user might implement this function themselves has been a puzzle that I've been attempting to wrap my brain around, still unsolved.


## Read Only External Calls (Time, Immutable File IO, etc)

Read only calls such as getting the current time become tricky as they are non-determanistic. File IO and similar calls may also change because the underlying file is not tracked by Tower and changing the bytes of the file could have affected the program "in the past", especially when rewinding and fast forwarding/redoing calculations.

The current approach I am leaning towards is to treat them as if they are constant and do not change, we only resample them when code re-runs that may have called those APIs

This is similar to React. If a React component samples time when it is built, then the value of time remains constant and unless it's passed in as an explicit dependency, it remains frozen until a dependency changes and causes a rebuild.


## Write/Side Effect External Calls (File IO Writes, Networking, etc)

When it comes to external calls that make modifications, such as writing to a file, it may be necessary to effectively provide an "undoable" version of that call, so that if it's determined that we need to redo calculations we have to fundamentally make a write to a file that undoes any write we did before.

In networking, that would absolutely not be possible. My guess is that networking and similar is just not a undoable/redoable operation, and maybe some external calls can be marked in that way.


## Notes

I get a feeling these are similar issues that functional languages have with "monads", but I haven't explored that deeply yet. It's also useful to think about temporal-opcode as if it's a transform that turns the entire codebase into pure functions due to memory versioning.


