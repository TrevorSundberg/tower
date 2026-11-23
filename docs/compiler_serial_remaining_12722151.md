# Remaining serial frontend cost at 12722151

One bounded candidate was measured and rejected on 2026-11-23. Reversing the
initial serial lookahead worklist reduced repeated unions, but did not deliver
a useful end-to-end improvement. The original solver and all temporary profile
hooks were restored; the rebuilt compiler and both test runners match their
original binaries byte for byte. This receipt changes no runtime implementation.

## Exact boundary and method

Source `12722151cc16daab46bb328cdd2dd1626880f2c0`, tree
`3f7480e26a21a9d6614c4132a150ec62e8f41601`, includes published range union and
B2 grain changes. Own KinmenB `tower_ecs_b1`, CPU0-11/24GiB, native x64,
LLVM19.1.1 Release, public768a bootstrap, compiler jobs1/build jobs6. No private
bootstrap override, sibling cache, global cache or persistent grammar service.
Each timed CLI invocation is a fresh process with warm filesystem contents.

The existing 16/1000-function Tower and C fixture bytes were retained:
small Tower `5966271c7144afe728376214c0289d60c0e682be71a0c7f29da386f962ba9fd2`,
large Tower `583024d07c2c70a84e6c8cf5167d972fb44e8e2d0c6c74645bd4fb75da120639`.
Frozen resources and exact compiler inputs accompany the experiment. Production
unit: the frozen `compiler/parser_table.tower` and its ordinary import closure.

Original compiler SHA256:
`3fd9460b54b5eac604cc35d52a2a8ee4e5abe51b1c0294b04f371b68087c96f5`.
Rejected candidate SHA256:
`92da60bc1e1cbdc649e89b0981f777a7de7db4b42e50d8cc19b33d939b513f69`.
Complete inputs, executables, patches, phase hooks, raw timings, commands, object
files and test logs remain in `build/ecs_b1/cache/serial_remaining_1272`
(`/cache/serial_remaining_1272` in the owned container). The earlier f7e764ab
generation candidate and prior paired LR improvements retain their own identities.

## Attribution before the candidate

Uninstrumented existing CLI timers, one observation each, milliseconds:

| Phase | Small | Large | Production unit |
| --- | ---: | ---: | ---: |
| Baseline grammar/bootstrap preparation | 99.56 | 96.72 | 100.10 |
| Parse/check combined | 357.22 | 445.51 | 960.13 |
| Backend lowering | 0.94 | 4.92 | 9.52 |
| Backend optimization | 2.04 | 39.43 | 61.51 |
| Object emission | 1.48 | 1.62 | 37.66 |
| Total internal CLI timer | 473.22 | 613.87 | 1195.39 |

These compile to objects; external linking is separate. A checked small Tower
object/runtime link took0.08s wall/0.03CPU/74212KiB. The `--help` load/control
process took0.01s/0.01CPU/51032KiB and performs no grammar preparation. It bounds
that control's loader/argument work, not the full compilation's initialization.
The CLI remainder includes startup/resource handling and cleanup; it is not
silently assigned to parsing. Link/help controls ran after the restore build
finished, as retained file timestamps confirm.

Existing cold observer:155 version builds,123 structural tables,36 reuses;
289.15ms nested version build,220.44ms tables,137.94ms lookahead. Lookup is
sub-millisecond. The installed observer first builds60 baseline tables in30.20ms,
then the request still builds123 tables in212.28ms, including134.86ms lookahead.
Installing the baseline does not eliminate incremental per-file table work.
These are nested intervals, not additive costs or evidence that distinct lexical
grammar versions can safely share mutable tables.

Temporary Tower-only phase/counter hooks further identified range propagation
as the largest measured serial lookahead subphase. Across the small CLI's
disjoint-label graphs:70.66ms graph construction,118.03ms solving,18.05ms actions;
353408 edges were traversed815967 times, visiting25268148 incoming ranges.
Other instrumented table phases: FIRST5.04ms, states48.54ms, contexts6.06ms,
runtime tables31.68ms. Both small and large request183 tables including startup;
the production unit builds211. No duplicate-import shortcut was inferred from
those counts.

Separate temporary frontend boundaries measure final `semantic_compile` at
5.52ms small,72.42ms large and60.49ms production unit. Parse/import orchestration
is472.30/493.76/995.48ms in those instrumented runs and contains grammar work and
staged preparation. It is not pure token parsing, nor is the final semantic pass
all semantic work. Per-table logging/counters perturb these runs substantially:
instrumented small total700ms versus the earlier uninstrumented473ms. These
fine slices identify producers; they must not be summed with uninstrumented
timings or presented as a new end-to-end baseline.

## Single candidate and rejection

The serial solver originally pops the initial pending nodes in reverse insertion
order. A nine-line candidate reversed only that initial vector, allowing earlier
seed/dependency nodes to run while their destinations were still queued. Later
changes retained the existing allocation-free LIFO worklist. No owner, budget,
graph identity, grammar activation, worker scheduling or allocation API changed.

The instrumented small input fell to499857 traversals and19655975 incoming
ranges (39% and22% less work). Instrumented solve time nevertheless stayed near
120ms. The following uninstrumented, alternating n3 samples decide acceptance:

| Input / workers | Wall median before → candidate (s) | CPU median before → candidate (s) | Peak RSS median before → candidate (KiB) |
| --- | ---: | ---: | ---: |
| Small / 1 | 0.51 → 0.50 | 0.44 → 0.43 | 186812 → 186552 |
| Large / 1 | 0.68 → 0.69 | 0.60 → 0.62 | 237872 → 238668 |
| Small / 4 | 0.57 → 0.57 | 0.52 → 0.53 | 187832 → 188268 |
| Large / 4 | 0.74 → 0.74 | 0.71 → 0.71 | 240172 → 240248 |

Serial small wall samples were .59/.50/.51 before and .52/.50/.50 candidate;
serial large .68/.66/.69 versus .74/.66/.69. The noisy/regressing samples remain
in `times.csv`, not discarded. One production-unit control was1.23→1.22s,
.83→.82CPU,228404→229188KiB; it is not a paired speedup claim. Cold/installed
observer whole-process wall stayed .41/.49s in both versions.

Cold allocation calls2144035→2127214 (-0.8%); installed2562308→2544357.
Both retain1893528 charged bytes, peak58035248, separate ledger metadata5242880;
retained buffer counts36677 cold/48979 installed are unchanged. Both teardown
checks require zero grants and no leaked buffers. These ledger counters do not
cover every independent analysis/system allocation or impose a process RSS cap.

Clang19 controls used the same frozen C fixtures, native x64 `-O2 -fwrapv -c`,
then a separate checked link. Single small/large compilation observations:
.04/.09s wall, .02/.07CPU,98964/109800KiB; links .06/.06s. Both execute15/999.
These single controls, with raw logs, are distinct from ROOT's earlier n3 C
comparison. The large serial gap remains; a work-count reduction alone does not
meet the requested latency goal.

All24 matched Tower executions return exact15/999. All24 fixture objects and
both production-unit controls equal their frozen originals. Independent
150-grammar closure/state/action/control/probe oracle, storage denial/retry,
grammar equivalence, revision/cache/owner lifetime, parser,300 generated/500
arbitrary-byte regex cases and native serial/threaded LR controls pass. Canonical
observer output remains976 bytes, hash13832670361687071853. No broad platform,
browser, sanitizer or complete-generation matrix was repeated.

Temporary-source restoration initially preserved old timestamps, which could
leave instrumented objects in the dependency cache. This was caught before the
matched runs; affected inputs were touched and the dependency target rebuilt.
The failed setup and original logs remain. After rejecting the candidate,
another affected-provider rebuild reproduced the original compiler and both
test-runner bytes exactly, and the original source manifest verified. No
candidate or profiling hook ships, and the native cache is restored.

The finite next producer is `lr_propagation_solve_result`'s exact-range union
representation: even the rejected lower-traversal schedule still visits19.7M
range entries. A separately bounded attempt would need to reduce work per union
(for example an explicitly budgeted, graph-owned exact-range membership index),
with sparse-size bounds and conversion costs measured before adoption. This is
an unimplemented proposal, not another cache or an approved optimization. No
second candidate was attempted here; the ordinary solver remains published.
