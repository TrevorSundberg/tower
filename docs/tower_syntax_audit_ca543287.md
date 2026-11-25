# Two ways to simplify initialization in Tower

Use `var prefix: vector(u8) = default;` in the host's module-path check. It says when the vector becomes valid, removes an address-taking call, and produces the same Linux x64 object as the original. Keep the other matches as review leads. One nearby initialization helper establishes a success flag, and several runs of field assignments update live state.

## Frequency on the frozen source

Host 6 compared every path and Git blob in its retained 1,287-row census with the tree of `ca54328765c60d6e6d7d7941f03ad704f10e9537`. The table covers 446 authored files. The compiler row includes the entire directory so residual compiler sources outside the specialist audits are included. Examples are counted once. The evidence packet contains the path list, per-match file, first line and length, and the exact ripgrep queries in `census/counts-command.txt`.

| Frozen source | Files | Fresh vector followed by init | Runs of at least three field writes | Writes in those runs |
| --- | ---: | ---: | ---: | ---: |
| Five top-level scaffolding language and type definitions | 5 | 0 | 0 | 0 |
| Library | 40 | 0 | 37 | 129 |
| Host | 97 | 4 | 8 | 59 |
| Tools | 33 | 0 | 1 | 7 |
| Examples | 12 | 0 | 0 | 0 |
| Compiler | 259 | 48 | 194 | 826 |
| **Total** | **446** | **52** | **240** | **1,021** |

The first query requires a declaration of a simple vector type and, on the next line, a call to `vector_init` on that same local. It accepts an explicit matching element type. It found 24 distinct files. The second requires at least three consecutive single-line assignments to fields of the same simple receiver, including pointer receivers. It found 97 files. Both count lexical matches before any edit. They skip split expressions, other receiver forms and different spellings. A count conveys neither ownership nor permission to reset a destination.

The earlier audit counted 227 runs and 972 writes across 102 production files at `6fcad397`. Its directory set included backend code and its matcher had different criteria. Subtracting those counts would give a misleading migration estimate. [Historical inventory](research/tower-simplification-audit.md#after-default-initialization-2026-11-21)

## Two real sites

**Fresh local, implemented.** In `scaffolding/host/module_path.tower:11` the previous source read

```tower
var prefix: vector(u8);
vector_init(&prefix);
```

The replacement is

```tower
var prefix: vector(u8) = default;
```

The old helper performs exactly one whole-value reset. The vector has no allocation before the first push. The existing explicit disposal still releases any buffer after the loop. The first push, the order of filesystem queries and the early exit on an unmatched component all stay in their original positions. [Vector contract and helper](../scaffolding/library/vector.tower#L6) · [Path checker](../scaffolding/host/module_path.tower#L10)

**Three writes, reviewed only.** At `scaffolding/host/ide_tree.tower:115`, the caller has already reserved capacity and taken the next slot's address. The three lines initializing that slot are

```tower
item.node = node;
item.parent = parent;
item.role = role;
```

Their candidate spelling is

```tower
*item = { node: node, parent: parent, role: role };
```

Those are all three fields of `IdeTreeItem`. Each right-hand side is an existing parameter. A complete initializer checks the field set and preserves the written order. Keep the reserve before taking the slot address and the length increment after all its fields are ready. The candidate has source review only. [Record declaration](../scaffolding/host/ide_tree.tower#L14) · [Slot publication](../scaffolding/host/ide_tree.tower#L112) · [Tower named initialization](named-field-initialization.md)

**Two calls that look similar need different treatment.** At `scaffolding/host/driver_link_objects.tower:27`, `driver_arguments_init` sets `ok = true` after clearing the record. Removing the call leaves `ok` false, causing `driver_argument` to return before appending even the first argument. At `scaffolding/compiler/format_diagnostic.tower:163`, the three writes select the production and two flags. A replacement using `..default` would zero the caller's fourth field, `result`, whose address the formatter immediately uses. Preserve the partial update. [Argument caller](../scaffolding/host/driver_link_objects.tower#L27) · [Initialization and guard](../scaffolding/host/driver_support.tower#L41) · [Diagnostic record](../scaffolding/compiler/format_diagnostic_types.tower#L36) · [Formatter](../scaffolding/compiler/format_diagnostic.tower#L162)

## Reading the syntax across the project

- Start with the language imported by the file. Bedrock supplies declarations, Foundation combines its syntax with the type prelude, and Tower adds aggregate initialization and iteration. `types.tower:5` defines signed and unsigned integer construction in Foundation syntax. Its explicit widths and the target-width `usize` binding carry representation information. The Bedrock `examples/foreach.tower:3` lesson defines a grammar locally. Its loop is a parsing example. [Bedrock](../scaffolding/bedrock.tower#L1) · [Foundation syntax](../scaffolding/foundation_syntax.tower#L1) · [Foundation imports](../scaffolding/foundation.tower#L3) · [Standard types](../scaffolding/types.tower#L5) · [Tower rules](../scaffolding/tower.tower#L97) · [Grammar example](../scaffolding/examples/foreach.tower#L3)
- In tools, `tool_words_close` borrows each word by address and disposes its byte storage while the outer vector remains stable. It then disposes that vector. `tool_shell_words` registers the outer and word cleanups with lexical `defer`. Moving a reset above a successful `vector_push` in `tool_word_end` would lose the word's contents. The compiler's `source_comment_sort` likewise borrows a stable source while pushing into a different vector. In the collections example the two `while` loops must pop until empty. Replacing them with finite borrowed iteration would change consumption and stack order. [Tool words](../scaffolding/tools/tool_words.tower#L7) · [Compiler comment sorting](../scaffolding/compiler/source_comments.tower#L44) · [Collections example](../scaffolding/examples/collections.tower#L24) · [Borrowed iteration](borrowed-iteration.md)
- A typed callback makes the two link implementations readable at the call boundary. The Wasm callback takes one pointer argument, the native callback also takes the target string. Keep these signatures. In the templates example, `push(&values, 10)` and `pop(&values)` already infer the element type from the typed stack argument. Existing generic functions, explicit type arguments for ambiguous cases and contextual initialization express both audit candidates. There is no need for a generic syntax proposal here. [Link callbacks](../scaffolding/host/driver_link.tower#L35) · [Stack example](../scaffolding/examples/templates.tower#L31) · [Inference rules](generic-call-inference.md) · [Function values](function-values.md)

**How to read a missing field.** Go lets a keyed struct literal omit fields and gives them their zero values. In Rust, a trailing `..base` moves or copies unspecified fields from the indicated struct. Tower's trailing `..default` explicitly zeros the destination *before* it evaluates written fields. In the IDE slot, spelling all three fields avoids both a baseline reset and ambiguity for someone learning the type. [Go specification, struct literals](https://go.dev/ref/spec#Struct_literals) · [Rust Reference, functional update](https://doc.rust-lang.org/reference/expressions/struct-expr.html#functional-update-syntax) · [Tower evaluation order](named-field-initialization.md#named-field-initialization)

## Evidence carried forward

The eight lane journals supply the reasons to inspect each match. These are historical source and host receipts. All measurements below were made separately on host 6.

| Lane and original host | Constraint used in this decision |
| --- | --- |
| A1, KinmenA | Inference derives bindings from the operand types and preserves argument effects. [A1, line 60](compiler_ecs_audit_a1.md#L60) |
| A2, KinmenA | Vector growth invalidates element addresses. A fresh local, a live owner and a borrowed element have different lifetimes. [A2, line 57](compiler_ecs_audit_a2.md#L57) |
| B1, KinmenB | The earlier vector cleanup changed the helper body to a complete default reset. Its compiler-storage compilation receipt concerned that earlier change. [B1, line 254](compiler_ecs_audit_b1.md#L254) |
| B2, KinmenB | The path prefix is private and synchronous. Each platform supplies its own component check. [B2, line 267](compiler_ecs_audit_b2.md#L267) |
| L1, Local | Graph, fast and reconstructed execution were distinct checks in the earlier generic inference corpus. [L1, line 270](compiler_ecs_audit_L1.md#L270) |
| L2, Local | Real binding resolution distinguishes named functions and value callees during classification. [L2, line 327](compiler_ecs_audit_L2.md#L327) |
| D1, Steam Deck | The struct value fixture intentionally completes partial initialization before copying and exercises shallow pointer aliases. [D1, line 366](compiler_ecs_audit_d1.md#L366) |
| D2, Steam Deck | Build-tool arguments remain borrowed through the synchronous child call. Lexical cleanup follows that lifetime. [D2, line 50](compiler_ecs_audit_d2.md#L50) |

The temporal journal records the original checker and bootstrap work for exact call inference, contextual zero initialization, and named-field checking. The eight-session handoff identifies the original machines. [Inference](temporal-opcode-research-journal.md#L26100) · [Default](temporal-opcode-research-journal.md#L29681) · [Named fields](temporal-opcode-research-journal.md#L32669) · [Handoff](openhands_ecs_cloud_handoff_2026_11_24.md#L82)

## Checks on host 6

An independent main clone started at public `e06aa12e`. Both copies of each listed transport member and all three complete archives matched the manager manifest. The ordered bundle tips were `8b7878c8`, `d1dd5bf9` and `1c2cc042`. The host already retained the separately verified `6cd34c79` journal bundle supplying parent `a6d58c22`. The supplied helper reproduced all three manager commits, ending at tree `84e9315e2ab51330f004b8ec5f160029e6a2fd20`.

The compiler was the checked-in Linux x64 pin, SHA-256 `509557309b941160cdb55eb7ea407c1e329e6ebd8ef126340552e857208cf42f`, whose recorded source base is `902a358f`. The pin's full checksum list passed. The measured inputs were the frozen and edited host module. Both produced the same 1,760-byte object with `towerc scaffolding/host/module_path.tower --jobs 1 --library --emit object -o sample.o`. A separate `--jobs 4` check on CPUs 2–5 produced the same bytes in both arms.

The repository fixture compiles the actual path checker through its ordinary import. It accepts `CaseDir/Exact.tower` and rejects a wrong directory case, wrong basename case, wrong extension case, and an absent file. A Tower entry repeated all five checks 8,192 times per run on a real directory. Both arms returned 0 with empty stdout and stderr. When the only file was `CaseDir/exact.tower`, both returned 1 at the fixture's first assertion. The 2,424-byte fixture objects and the final 26,176-byte executables also matched byte-for-byte. [Fixture and exit codes](../scaffolding/tests/module_paths.tower#L6)

The host exposed 12 logical CPUs on an Intel Xeon E5-2680 v4. The effective cpuset was 0–11 with quota 1,152,000 µs per 100,000 µs (11.52 CPUs). Each timed command used CPU 3. The compiler emitted native Linux x64 objects using its default optimization and checked-in resources. Clang 19.1.7 linked the fixture with the packaged host runtime IR and the real POSIX/Linux component checks. Each phase ran serially in the order before/after/after/before, twice. File and directory pages were warm, with a fresh process on every sample and no persistent compiler build cache. CPU seconds sum user and system time. RSS is the highest per-process peak across four samples.

| Work per sample | Mean wall seconds, before → after | Mean CPU seconds, before → after | Max RSS KiB, before → after |
| --- | ---: | ---: | ---: |
| Compile the host module | 0.4140 → 0.4145 | 0.4133 → 0.4140 | 142,752 → 143,116 |
| Run 40,960 path assertions | 0.5233 → 0.5338 | 0.5228 → 0.5328 | 1,516 → 1,512 |

The runtime timings vary even for identical executables. The decision rests on readability and the object comparison. In a separate DHAT run per compile, cumulative heap bytes were 325,129,064 → 324,664,180 and peak live bytes were 71,400,493 → 71,400,427. Both compilers had 151,102 bytes in 2,460 blocks at process end. DHAT reported incomplete debug mappings for the pin, so these are whole-process totals. In separate Memcheck runs both executables made 180,224 allocations and frees, with 2,421,358,592 cumulative bytes including libc directory enumeration, zero live bytes at exit and zero reported errors.

The candidate also passed the fixture with address/leak and thread instrumentation on all five linked LLVM modules, including the runtime. Execution here is synchronous. The four-job check establishes output equivalence only. Cold caches, broad compiler builds, browser/Jenkins, other target OSes, source-language UBSan, OOM injection and parallel scaling are outside the measured arms. The maintained procedure explains the instrumentation boundary. [Tower sanitizer checks](compiler_sanitizer_checks.md#actual-tower-object-instrumentation)
