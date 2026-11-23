# Real compiler component occupancy

A2, 2026-11-23. Published input `9d9329db3606cbe74c544271ad4b9bb1912a0eec`,
plus the optional profile and target in this commit. This closes the bounded
real-workload measurement requested by [the synthetic locality receipt](compiler_ecs_locality_d5b65afe.md).
It does not close current compiler instrumentation, browser or release gates.

**Decision:** retain stable payloads and dense pointer indexes on these inputs.
The synthetic one-survivor-per-page pattern is not the material retained-memory
problem here. The measurable gap is partially filled private-stage pages for
`SemanticDeclaration`, followed by retained index/ledger capacity. A small page
policy experiment is justified; authoritative payload compaction is not. No
production storage, compiler, scheduler or ownership policy changed.

## Method and exact boundary

`tower-frontend-storage-profile RESOURCE_ROOT BODIES WORKERS observe|plain` uses
the existing production compiler providers and allocator. Each process creates
a fresh world with a synchronized 2 GiB WorkBudget installed before creation;
it installs Bedrock/Foundation, compiles ordinary Tower, checks execution and
Foundation output, then disposes the program, module environment, grammar cache,
world and budget in ownership order. Worker counts are 1 and 4; the source has
8 or 512 independent loop bodies and an imported helper with ordinary generic
calls, `decltype`, type construction, executed `comptime` dependencies and an
untaken unresolved generic body. Inputs reuse `dependency_unit_helpers_source`.
Both `answer()` and `body_0(36)` independently return 42. Every body is compiled
and included in the canonical output; the profile does not execute all 512 bodies.

Census calls run only at explicit coordinator boundaries. They require no views,
no pending table reservations or running grammar workers, and zero borrowed
worker lanes. A private kind-pointer vector visits actual table columns and
existing registered kinds. Per-kind published instance counts must equal pooled
live slots plus individually owned payloads; their sum must equal the store's
component count. Every owned payload page must be accounted exactly once. No
worker writes observer state. `plain` returns before allocating or traversing
the census. The observer's raw vector capacity is reported separately (at most
512 B here); stack and libc output buffers are outside the world ledger.

Samples are after grammar setup, compilation **including semantic-context
cleanup**, program release, module retirement and grammar reset. These are real
retained states, not per-kind peaks inside a running dispatch. The shared budget
records its separate high-water mark. Empty pages can disappear between samples;
`used_slots-live_slots` counts holes only in pages still owned at that boundary,
not all historical deallocations. No copied payload snapshot is constructed.

Host: KinmenA, Windows 11/WSL2 Linux x64 `6.18.54.1`, Ryzen AI MAX+ 395,
16 cores/32 threads. Container `tower_build:latest`, network none, CPU0-11,
24 GiB; A2's existing `/cache/native`, Release, native x86_64, LLVM/Clang19.1.1,
public compiler `768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`,
compiler jobs1/Ninja jobs2, no sanitizer or allocator instrumentation. Filesystem
caches may be warm; worlds are always fresh. Other lanes retain their assigned
CPUs; this is not a host-wide quiet/no-contention claim.

One dependency-aware profile target rebuilt the affected closure. Failures remain
in the receipt: the process wrapper rejected relative `cmake` before compilation
(exit1/errno13); absolute `/usr/bin/cmake` then completed the providers but rejected
the profile's missing direct `vector` import (exit1, 66.376 wall/105.526 CPU s,
1,062,880 KiB). Fixing imports required only profile object/link, 3.860/2.411 s,
257,736 KiB. After the initial census identified partial pages, adding used-slot
counts/layout reporting rebuilt only that same object/link, 4.442/2.782 s,
283,188 KiB. No provider or policy changed between the two successful binaries.

Twelve initial ordinary processes passed (four censuses, eight plain samples,
two repetitions with reversed worker order). Eight final processes passed (four
censuses and four plain samples with used-slot reporting). All 20 preserve the
same source and canonical checksum/length receipts, reference answers and zero
final byte/lane grants. Final throughput below is n=1 per cell; earlier n=2
samples are retained as a separate comparable check, not pooled across binaries.
There is no unrun check labeled passed and no sanitizer operation was retried.

Raw commands, logs, statuses, dependency files, object identities and timings:
`C:/Sandbox/build/codex_ecs_20261122/A2/cache/logs/compiler_occupancy_9d9329db`.

| Identity | SHA256 |
| --- | --- |
| Final Tower profile | `40189226fec3ce006cbfc80e24debde894e75e10d034f02c2d804298ac2933d3` |
| Final profile executable | `7b754ecf7cc4a8be61892964e45f9b10244ed0cf7607940d9430a2204c67a6d5` |
| Final profile object | `cb489f1b2693fc5428d29e8f5a5941f68748dfe257c2e310e9af8f9fd7c264ff` |
| 375 source/tool/build-input manifest | `1620876028d3c459c4202c4a32b7e71b79bfae830a8e460e6ccc0e186b2eb861` |
| 24 actual linked object manifest | `728c1d74cbaf04ba0426eb5b5d37baec2f3fec024b920c23ae9668c726790e40` |
| Memory archive/host transport object manifest | `309711277497392aa7a64252be8fc3c425c26ece13edd4d3d2adeedf06737731` |

Ninja's explicit input list alone had only 24 source/tool paths; the receipt
also expands the actual objects' compiler depfiles. The legacy storage and LLVM
registry boundary objects have no individual `.o.d`; their actual object hashes,
existing build commands and explicit source inputs remain recorded. No missing
depfile is represented as a successful full provider-source check. No private
compiler or candidate syntax was substituted.

The runtime checksums are FNV-1a64, not cryptographic proof of byte equality:

| Bodies | Source checksum | Import checksum | Foundation checksum | Foundation bytes |
| ---: | ---: | ---: | ---: | ---: |
| 8 | 10240961210026777659 | 9841053087281335157 | 14243253176332855356 | 13848 |
| 512 | 4884758298134443419 | 9841053087281335157 | 2835124221996493538 | 754804 |

The checked-in generator, body count and frozen resource hashes specify the
inputs. Serial/four-worker and observer/plain checksum/length comparisons agree;
this is not a new complete canonical-roundtrip or generation acceptance claim.

## Retention at real boundaries

Serial 512-body sample, bytes. The four-worker sample has identical component,
page, descriptor and index counts; other ledger bytes differ by 2,824 B.

| Boundary | Entities / components | Live payload | Payload pages / bytes | Descriptor page bytes | Table row/column bytes | Kind-index bytes | Other charged bytes | Total charged |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Grammar installed | 5378 / 6137 | 512984 | 119 / 1059681 | 2203665 | 160056 | 442992 | 1270872 | 5137266 |
| Compile joined | 91361 / 111285 | 18704040 | 2996 / 37913492 | 27247369 | 4776960 | 2424032 | 21463720 | 93825573 |
| Program released | 15476 / 17570 | 1362224 | 307 / 2629637 | 5298893 | 3642808 | 2311672 | 5228976 | 19111986 |
| Modules released | 5378 / 6137 | 512984 | 119 / 1059681 | 2203665 | 2199864 | 2311096 | 1270872 | 9045178 |
| Grammar cache cleared | 7 / 0 | 0 | 0 / 0 | 8638 | 0 | 2311096 | 2656 | 2322390 |
| World disposed | 0 / 0 | 0 | 0 / 0 | 0 | 0 | 0 | 0 | 0 |

The 8-body compiled state has 17,777 entities/20,565 components, 1,886,568 B
live payload and 4,567,529 B payload pages; total charged 18,964,834 B. After
program release both sizes retain the same live component population. Larger
table/kind capacities account for the remaining difference. After module release,
the large world retains 3,907,912 B more index capacity than the initial grammar
baseline. After grammar reset, 2,311,096 of 2,322,390 B is empty kind-instance
index capacity; world disposal releases it.

Large compile peak charge is 184,234,758 B serial /184,184,470 B with four workers;
small peak is about 108.30 MB. Separate budget-ledger metadata grows to 10,485,760 B
small /20,971,520 B large and remains allocated after grants reach zero. The final
`work_budget_dispose` releases it. It must not be added to live payload, hidden
in a process cap, or mistaken for outstanding grants.

At large compilation, descriptor pools contain 6,727 pages, 128,196 reserved
slots, 122,634 ever-used slots and 120,719 live slots. Entity descriptors alone
have 16,810,424 logical bytes, a subset of those physical owners. Table columns
reserve 316,516 **pointers**. Other charged bytes include independently owned
relationship/component indexes and compiler buffers/arenas; this is a remainder,
not an invented per-subsystem attribution. Raw client vectors, source/observer
storage, allocator-private bookkeeping, stacks, loaded libraries and foreign
allocations are separate from these ECS subtotals. Whole-process peak RSS is not
the world ledger. No individually allocated oversized component occurred here.

## Which kinds are sparse?

Compiled state; live/used means current live slots / ever-used slots in surviving
pages. All kinds are in raw CSV; these dominate payload or retained slack.

| Kind / bodies | Payload size | Live / used | Reserved slots / pages | Occupancy | Live payload B | Physical page B |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| ParserMatch /8 | 56 | 15554 /15566 | 15680 /245 | 99.20% | 871024 | 1812755 |
| Foundation /8 | 344 | 781 /781 | 2840 /71 | 27.50% | 268664 | 1152401 |
| SemanticDeclaration /8 | 912 | 80 /80 | 192 /12 | 41.67% | 72960 | 188628 |
| ParserMatch /512 | 56 | 68474 /68486 | 68608 /1072 | 99.80% | 3834544 | 7931728 |
| Syntax /512 | 232 | 2321 /2322 | 2352 /42 | 98.68% | 538472 | 687078 |
| Foundation /512 | 344 | 32029 /32029 | 44160 /1104 | 72.53% | 11017976 | 17919024 |
| SemanticDeclaration /512 | 912 | 2096 /2096 | 9264 /579 | 22.63% | 1911552 | 9101301 |

Dynamic kind IDs are local identities (declaration215242 in the serial large
sample,216286 with four workers), not a global registry. The profile reports raw
IDs and existing compiler-kind names; it does not classify types by size. The
declaration identification uses the real `sem_declaration_state_result` producer
and the compiled factory's 0x390-byte registration/initialization, plus the
profile's ordinary `sizeof(SemanticDeclaration)==912` layout report. The first
static-symbol read used the unmangled name and warned that it was missing; the
existing symbol table supplied `tower.fn.sem_declaration_state_result`. This is
artifact inspection, not another runtime probe or rebuilt provider.

Large totals: 133,915 payload slots, 112,476 ever used, 111,285 live: 1,191 holes
and 21,439 never-used slots remain. All 20 one-live-slot pages together request
236,300 B, only 0.252% of the live world ledger. A singleton 32-byte dynamic kind
does retain 5,863 B (183.219x), but this is one small, never-filled page, not a
material 183x whole-compiler survivor pattern. The 606 pages at <=25% occupancy
retain 9,275,482 B; declaration pages account for 512 of them. Foundation and
declaration live==used proves their retained slack is **unused initial capacity**
at this boundary, not holes left by deleting other payloads.

`EntityTable.columns` and each kind's `instances` store `EntityComponent*`, then
load `.data`. A Foundation value has 344 B payload in a 352 B stable stride with
a separate 48 B component descriptor. A declaration uses 920 B stride plus 48 B
descriptor; sixteen slots request 15,719 B per page. Adjacent payload addresses
are not a packed344/912-byte array. Pinned views still provide no alias guarantee.

## Plain throughput and bounded recommendation

Final binary, observer disabled, n=1 per cell. Compile excludes baseline setup,
reference execution, formatting and disposal; process includes them. Units are
milliseconds wall/CPU, peak RSS KiB. Earlier n=2 process ranges are separate.

| Bodies / workers | Compile wall / CPU | Process wall / CPU | Peak RSS | Earlier n=2 process wall range |
| --- | ---: | ---: | ---: | ---: |
| 8 /1 | 372.653 /342.029 | 515.782 /456.137 | 177040 | 498.709-508.671 |
| 8 /4 | 435.357 /453.706 | 579.540 /572.524 | 179648 | 579.134-590.431 |
| 512 /1 | 498.210 /468.957 | 678.341 /620.960 | 255596 | 681.928-683.216 |
| 512 /4 | 537.093 /626.502 | 724.463 /788.995 | 257524 | 735.165-740.304 |

Four workers lose on these short, grammar-heavy inputs and use more CPU. The
native transport is real; this observer does not count simultaneous kernels or
ready/idle intervals and makes no new overlap/speedup claim. B2 owns that distinct
attribution. No changed runtime code needs a claimed before/after speedup: only
an optional, excluded-from-default-build profile is added. Earlier/current plain
samples establish the ordinary baseline without intrusive census work.

Foundation is the largest retained payload kind, not a proven CPU-hotness rank.
Packing a complete copied Foundation snapshot would **add** 11,017,976 B before
allocation/index/build costs, while preserving the original stable owners. Its
typed size/stride and the prior indexed-vs-copy experiment do not establish enough
real repeated scans to amortize that copy. `sem_get`/flow and declaration-query
consumers retain stable payload references; moving them would require a different
borrow contract. No such policy is adopted.

The bounded next experiment is an optional **four-slot stage-page limit for the
declaration kind**, set by its existing world/coordinator before dispatch, through
the common entity storage policy. Producer: `semantic_declarations.tower::
sem_declaration_state_result`; allocator: `entities.tower::entity_component_allocate`
and `entity_storage_allocate`; consumers: declaration/body query continuations.
`sem_declaration_dispose` clears scratch but keeps the attached records until
program release. That lifetime is visible here; removing them earlier needs a
separate proof that generic/inspection and resumable consumers no longer borrow
them. It is not an automatic cleanup fix.

Four slots predict 4,103 B/page versus 15,719 B for sixteen. On the 512 current
quarter-full pages, the static per-page difference is 11,616 B, about5.95 MB
before the extra headers/grants needed for fuller allocation streams. This is an
estimate, **not measured savings**. Replay these exact sources/live identities
with 16/4 policies, count pages/grants and peak replacement bytes, preserve stage
private pools, addresses, joins/leases/queued references and first errors, and
compare disabled-observer wall/CPU/RSS plus normal teardown. Full-page workloads
may pay more allocation/ledger overhead. Do not globally lower the page policy,
merge worker allocators or introduce authoritative packed storage from this data.

The old sanitizer stash remains untouched; unsupported coverage and the rejected
current-source sanitizer gate remain open. ROOT owns subsequent affected-source
adoption and release. This receipt is real compiler occupancy evidence and a
specific measured architectural trade-off, not overall compiler completion.

## Affected merged-source adoption

Review/measurement commit `e9fd7aa5` was followed by the required pull. Normal
fast-forward-only divergence was resolved by merge
`aa4bbc53b6c2b7174b7b48ed23e0d42f681696cd`, preserving published `1a5241cb` and
both independent README additions. Incoming B2 WorkPool observation fields and
compiler/L2 callers changed actual dependencies, so hash-only adoption would not
suffice. The same dependency-aware target rebuilt21 affected actions using the
same public pin, 66.588 wall/91.469 CPU s, peak1,069,040 KiB. No other suite ran.

Eight affected plain/observed cases (8/512 bodies x1/4 workers) passed at this
merged input, including checksums/reference values, complete kind/page census,
no outstanding view/lease/worker ownership, and zero final grants. The profile
source is still40189226; all per-kind live/used/page/slot/physical-byte counts
above remain identical. Serial charged totals/peaks are16 B higher, matching the
larger world-owned WorkPool descriptor; e.g. large joined93,825,589 B,
cache-cleared2,322,406 B, disposed0. Original9d timings/identities stay original.

| Merged identity | SHA256 |
| --- | --- |
| Executable | `05df504275a84e6a09d40ac49723dd5d22e40bcae30599f9b1cec31ee3e49d49` |
| Profile object | `8f70f51289b1f80e1c0667b9bd4f6267f2090c5cd06d1452c71906f3a050ac3b` |
| Expanded imported source manifest | `e3fd92e8c3d9a0f4a4fa5bba166a1e22fd08b6bf41f3c8407a6ff557d147a9f0` |
| Actual link-object manifest | `7d99223f158d625b3e58788a33b518baaa492d8663d99f1676e4076b684b8bc3` |
| Memory/transport manifest | `f1d424e46694304b5a1e1cbf60ab0b42540369296854e9330db4ab58fca441c2` |

Merged disabled-observer n=1, milliseconds wall/CPU, whole-process RSS KiB:

| Bodies / workers | Compile wall / CPU | Process wall / CPU | Process peak RSS |
| --- | ---: | ---: | ---: |
| 8 /1 | 366.188 /337.425 | 498.800 /442.137 | 176556 |
| 8 /4 | 442.834 /459.056 | 585.933 /576.861 | 178876 |
| 512 /1 | 505.794 /476.377 | 679.171 /622.207 | 255564 |
| 512 /4 | 600.862 /696.712 | 809.990 /881.147 | 257660 |

The merged large four-worker sample is higher than the original plain sample;
retain it, rather than claiming neutral overhead or attributing a single sample
to one incoming change. Serial and four-worker counts/outputs still agree, and
both boundaries favor serial on this workload. B2/ROOT own further scheduling
attribution. All owned jobs drained; no additional performance campaign,
instrumentation, generation, browser check or deployment occurred. Twenty-eight
ordinary processes across the original/final/merged observer boundaries passed;
these are not twenty-eight independent samples of one identical binary.
