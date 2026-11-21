# Shared frontend and direct package preparation — 2026-11-21

The graph, fast and LLVM execution branches now share the first successful
frontend's canonical Foundation text and source locations for the current request.
They retain independent compiler/guest state. Different native target layouts
still compile separately. Revision checks discard obsolete replies, execution
still requires the UI permit, and a failed producer releases waiting branches
through their normal diagnostic path. No mutable ECS graph crosses a worker.

LLVM's already formatted Foundation can now enter Tower package preparation
directly. Tower checks those exact bytes, builds the derived cache, validates the
envelope and matches the cache before publishing an independently owned execution
session. This removes the intervening compile/format/reparse. Handle-based package
snapshots and untrusted package loading retain their existing independent checks;
older editable compiler generations use the checked compatibility path.

The shared-memory host mutex now records contention and only notifies waiters
when necessary. Memory-size refresh, failure checks, blocking waits and exclusive
allocator ownership remain. Tower's allocator wrapper also skips `free(null)`.
The threaded runtime remains enabled, with its ECS/work-graph policy unchanged.

## Controlled before/after comparison

Three alternating-order pairs, each with fresh desktop and Pixel 7 emulation
browser processes, ten warm actions per pair/device. Both frontend variants use
main `717b25b`; the candidate adds the changes above. Both sites retain identical
published LLVM/native binaries and other assets. This isolates the patch from
concurrent compiler development. No builds, tests or sampling overlapped timings.
Windows/Ryzen 9 5900HX, Chromium 159.0.8154.6; loopback with warm OS file cache,
not WAN or physical-phone measurements. Cold has three observations and warm has
30 per action/device. All 660 observed actions completed with expected backend
results and no page errors. Medians in milliseconds:

| Result | Desktop before → after | Mobile emulation before → after |
| --- | ---: | ---: |
| Cold highlight | 1569.6 → 1330.1 | 1487.6 → 1213.8 |
| Cold first instructions | 3915.3 → 2325.0 | 3042.3 → 2071.8 |
| Cold graph result | 3919.5 → 2328.7 | 3046.1 → 2076.2 |
| Cold all outputs | 4405.2 → 2899.4 | 3538.7 → 2661.3 |
| Warm Execute, all outputs | 99.9 → 71.2 | 91.7 → 67.0 |
| New project, graph result | 74.4 → 86.8 | 69.8 → 70.2 |
| New project, all outputs | 112.6 → 101.2 | 98.6 → 86.5 |
| Memory edit, highlight | 45.8 → 36.9 | 50.7 → 37.4 |
| Memory edit, graph result | 122.4 → 66.1 | 97.5 → 66.9 |
| Memory edit, all outputs | 228.3 → 120.3 | 201.6 → 135.3 |
| Structs 20/200 edit, graph result | 87.5 → 47.1 | 63.6 → 43.4 |
| Structs 20/200 edit, all outputs | 173.4 → 123.8 | 143.9 → 126.3 |
| Structs syntax-only edit, highlight | 27.1 → 26.7 | 28.0 → 27.3 |

Cold completion falls 34% desktop / 25% mobile; Memory edit completion falls
47% / 33%. This is not a claim that every metric improves: desktop's new-project
graph result arrives 12 ms later at the median despite earlier instructions and
earlier full completion. Syntax-only warm latency is essentially unchanged.

Desktop Memory frontend compilation falls from 53.0 to 12.8 ms in the graph
worker; fast/LLVM workers reuse its Foundation. Fast reconstruction plus packaging
was 35.2 + 43.5 ms; direct preparation is 24.3 ms, with a 0.2 ms cached canonical
runtime lookup. These overlapping phase medians are not an additive end-to-end
model, nor do the combined changes isolate each change's individual contribution.

Evidence: `build/pipeline_pair_{1..3}_{before,after}.json`. Reproduce with
`scripts/profile-execution.mjs`, `TOWER_PROFILE_REPEATS=10` and the frozen site's
`TOWER_PROFILE_URL`. Tower package fixtures cover both widths, byte-for-byte
equivalence, independent execution after original-session destruction, invalid
input/profile/layout and steady lifetime counts. Existing cache-tampering tests,
real shared-memory overlap/growth/failure tests and 1/2/4/8-worker determinism pass.
Browser transport checks confirm one producer and two Foundation consumers, warm
worker retention, stale permit rejection and cancellation/recovery on both devices.

## Rebuilt release and output viewport

The rebuilt release also exposed an independent UI bottleneck: replacing a whole
offscreen CodeMirror document mapped its viewport onto the entire native output.
Desktop Structs edits rendered all 3,564 disassembly lines and delayed already
compiled results. Main-thread sampling identified DOM synchronization and forced
layout through scroll snapshots. Offscreen output now resets the derived view
state and restores its scroll anchor; the same 92,798-character document renders
36 lines. Its complete text remains immediately available for copying and
inspection. Visible panes retain their existing update path.

The final uninstrumented confirmation uses freshly rebuilt native/portable/
threaded/LLVM/cross assets from snapshot `797f54a` and the final UI, with no
concurrent builds/tests. Public build inputs can be reconstructed from `7425a14`
plus `git diff 8c05a96 033efb3 -- scaffolding`; the editable recipe contains the
exact compiled sources. Later experimental-linker/tooling changes on main are
not included in those runtime bytes. A fresh public-bootstrap native successor
after rebasing to `dc3a7ed` also builds and executes both interpreters correctly.

One fresh browser per device, ten repetitions per warm action; milliseconds:

| Complete output | Desktop | Mobile emulation |
| --- | ---: | ---: |
| Cold, single observation | 3092.5 | 2658.1 |
| Warm Execute, median | 74.0 | 67.3 |
| New project, median | 108.3 | 86.8 |
| Memory edit, median | 135.6 | 110.7 |
| Structs 20/200 edit, median | 115.1 | 68.9 |

This is an integration confirmation, not a replacement for the controlled paired
comparison. All 110 actions completed with expected outputs and no page errors.
Evidence: `build/pipeline_viewport_profile.json`. The preceding release probe
(`pipeline_publish_profile.json`) caught the desktop offscreen regression at
246.5 ms median. `TOWER_PROFILE_BROWSER_CPU=1` records a separate main-thread
profile around value edits; instrumented runs are marked and excluded from
latency comparisons. Output document and rendered-line counts accompany reports.

Release checks pass: 79 runtime/LLVM/package checks, eight threaded package/worker
checks, two edited browser compiler generations, four final worker-reuse/permit
checks, and ten output/viewport checks across desktop and mobile. The latter
include actual numeric-edit/recompile frame captures, preserved scroll/geometry,
and replacement of a multi-megabyte offscreen document with bounded rendered DOM.

# Cold and warm profiling passes — 2026-11-21

The published threaded browser path still spends seconds before its first result.
Small warm edits are much quicker, but the portable serial comparison exposes
substantial shared-memory/worker overhead. This is a diagnostic comparison, not
a change to production threading or the ECS/dependency-graph architecture.

## Inputs and method

Frozen Pages deployment `c4ae217`, manifest source `780276a`, UI `c9521cf` and
runtime build `85c8a13` (equivalent retained public compiler sources `2776318`).
Every copied asset was verified against its manifest. The newer body-frontier
batching on main `5ca3c3d` is **not** in these measured runtime bytes.
Windows, Ryzen 9 5900HX, Node 21.7.3, Chromium 159.0.8154.6. Pixel 7 emulation
uses this same computer. Desktop also selects the Windows native backend;
mobile does not, so their totals are different configurations.

Five passes produced 50 observations per repeated action per device. Cold
means a fresh browser process/context and app/Wasm state on loopback, with a
warm OS file cache. It includes the isolation service-worker reload, not WAN
download latency. The initial mobile passes followed desktop in the same process;
five separate mobile processes replaced those cold observations. The profiler
now launches a fresh process for each device automatically. No builds, tests or
CPU sampling ran alongside browser timings. Action-to-DOM times include browser
automation delivery; animation callbacks do not measure physical display latency.

## Cold startup

Five observations each; milliseconds, median (observed minimum–maximum).
The sample is too small to estimate a cold-start percentile.

| Result | Desktop | Mobile emulation, isolated process |
| --- | ---: | ---: |
| Highlight | 1531.6 (1521.6–1546.8) | 1459.3 (1429.4–1514.8) |
| First Foundation instructions | 3856.5 (3811.2–3965.8) | 2914.1 (2827.0–3064.3) |
| Graph result | 3861.0 (3817.3–3969.8) | 2917.4 (2830.0–3067.8) |
| LLVM/Wasm result | 4042.6 (3993.9–4133.7) | 3028.1 (2984.2–3137.2) |
| All selected outputs | 4372.8 (4319.0–4466.7) | 3433.1 (3328.5–3621.3) |

Desktop parser work is 900 ms median. Each independent graph/fast/LLVM worker
then spends about 693 ms loading its frontend and 1.60 seconds compiling Tower.
LLVM compilation itself is about 125 ms; the fast worker's additional LLVM load
is 436 ms. These overlapping worker phases must not be added as serial costs.

## Warm actions

50 observations per row/device. Milliseconds, median / empirical p95 (sorted
sample index floor(0.95*n), zero based); these are local benchmark tails, not
production latency guarantees. Memory edits append a short comment; value edits
alternate `pair.first = 20` and `200` in Structs and check changed output.

| Action/result | Desktop | Mobile emulation |
| --- | ---: | ---: |
| Execute unchanged Functions, complete | 100.4 / 120.1 | 89.0 / 108.4 |
| New project, highlight | 52.5 / 110.1 | 52.9 / 109.1 |
| New project, complete | 113.1 / 174.6 | 94.4 / 153.7 |
| Memory edit, highlight | 46.1 / 57.6 | 54.2 / 86.0 |
| Memory edit, graph result | 119.5 / 143.7 | 118.4 / 149.7 |
| Memory edit, complete | 232.0 / 274.8 | 234.5 / 287.8 |
| Structs value edit, highlight | 33.3 / 39.4 | 31.8 / 40.0 |
| Structs value edit, first instructions | 72.0 / 88.7 | 56.6 / 79.7 |
| Structs value edit, graph result | 79.5 / 110.9 | 71.7 / 103.4 |
| Structs value edit, complete | 163.0 / 187.9 | 153.0 / 183.5 |
| Structs whitespace, auto execution off, highlight | 28.0 / 31.0 | 27.9 / 31.9 |

The parser and all three execution workers survived all warm actions in every
pass; desktop's native target worker also survived. All 550 observed actions
completed without page errors. Project switching remains workload dependent:
the first switch to Execution (its own grammar declarations) took 751 ms desktop
and 626 ms mobile to complete, versus 176/152 ms for Functions, 274/239 ms for
Memory and 141/145 ms for Structs (five observations per project). These first
visits do not establish fully warmed grammar-switch latency.

For desktop Memory edits the fast worker spends 58 ms compiling Tower, 31 ms
optimizing through LLVM, 36 ms reconstructing Foundation and 44 ms preparing the
checked package. LLVM/Wasm output arrives at 142 ms median, before fast output
at 232 ms. Structs has less work: about 34, 6, 16 and 19 ms respectively. Runtime
loading is already cached; repeated frontend/package work remains significant.

## Paired portable/shared-memory comparison

Three alternating-order desktop pairs, fresh processes, ten warm actions per
pair. A second frozen site changes only `capabilities.json` to select the existing
portable serial reactor; its manifest records that override. UI, examples and
LLVM bytes are identical. This compares complete runtime variants, including
their allocators and host transport, not just a scheduler worker-count setting.

| Desktop result, median ms | Portable serial | Published threaded |
| --- | ---: | ---: |
| Cold highlight (3 samples) | 1095.4 | 1591.9 |
| Cold graph result (3 samples) | 1895.7 | 3914.7 |
| Cold complete (3 samples) | 2289.6 | 4411.1 |
| Warm Execute complete (30 samples) | 61.8 | 101.5 |
| Warm Memory edit complete (30 samples) | 112.2 | 237.4 |
| Warm Structs value edit complete (30 samples) | 124.7 | 165.3 |

In these pairs cold frontend load is 108 versus 678 ms, and graph-worker Tower
compile is 635 versus 1628 ms. Warm Memory Tower compilation is 7.4 versus
56.3 ms; package preparation is 16.6 versus 42.5 ms. All requested outputs match.
This supports reducing small-job overhead and allocation traffic while retaining
worker isolation, access contracts and deterministic publication. It does not
establish how the variants compare on large parallel compiler workloads.

## Separate CPU and larger-unit probes

Eight Node inspector captures cover Functions, Memory, Structs and Execution
with each published frontend reactor. Three additional warm-only Memory captures
sample the first retained-parser reset plus recompile, after initialization/cold
work. Of 219 coordinator samples, 85 (39%) land in `work_host_heap_enter/leave`;
another 31 are in the memory `buffer` getter. This is sample attribution, not
39% of end-to-end wall time, and does not include child-worker CPU. Published
reactors are stripped, so remaining numeric Wasm frames cannot safely be assigned
Tower names. Parser reset now mirrors the UI's retained handle; the older
create/destroy probe measured new-session work and is excluded here.

The existing LLVM ABI profiler also compiled frozen Tower inputs to deterministic
object bytes, with sampling after timing. Functions: six warmups, 16 measurements,
9.92 ms median / 13.64 ms maximum. ECS `units/compiler_entities.tower`: two
warmups, eight measurements, 3341 ms median / 3613 ms maximum, including 2080 ms
frontend, 103 ms LLVM lowering, 744 ms optimization and 372 ms emission medians.
Module configuration is excluded; compile/output transport is included. This
larger-unit result is distinct from editor response time and the threaded frontend.

The next performance work should prioritize the shared-heap ABI traffic and
worker startup/admission cost for small jobs, avoid redundant frontend work across
backends, and reduce checked package reconstruction without weakening validation.
Large compiler-unit frontend work needs its own profiling alongside those changes.
Keep immutable shared inputs, world ownership, ECS nodes and dependency scheduling;
the measurements do not justify abandoning the threading work.

## Reproduction and retained evidence

From `playground`, set `TOWER_PROFILE_URL` to the frozen site's origin,
`TOWER_PROFILE_REPEATS=10`, then run
`node scripts/profile-execution.mjs ../build/cold_warm_pass_1.json`.
`TOWER_PROFILE_DEVICE=desktop` or `mobile` selects one device. Zero repeats
retains cold startup and project visits. The new semantic edit case uses the
existing Tower Structs fixture; JavaScript is limited to browser/ABI transport.

For CPU captures set `TOWER_PROFILE_ASSETS` to that snapshot's `dist`,
`TOWER_PROFILE_REACTOR` to its `tower.wasm` or `tower-threads.wasm`, and
`TOWER_PROFILE_SOURCE` to the example filename. Optional
`TOWER_PROFILE_CPU_PHASE=warm` excludes initialization/cold work from sampling.
For LLVM, use `node scripts/profile-compiler.mjs <reactor> <report>` with the same
assets directory; `TOWER_PROFILE_CASE=compiler_entities` selects the larger unit.
The profiler now reads the served recipe/examples and current underscore unit
names instead of mixing stale local build inputs with a measured reactor.

Ignored local evidence: `build/cold_warm_pass_{1..5}.json`,
`cold_mobile_isolated_{1..5}.json`, `cold_warm_pair_{1..3}_{serial,threads}.json`,
`cold_warm_cpu_{tower,tower-threads}_{functions,memory,structs,execution}.json`,
`cold_warm_warm_cpu_{1..3}.json`, `cold_warm_{llvm,entities}_cpu.json` and companion
`.cpuprofile` files. Final transport validation: `cold_warm_final_transport.json`
(both devices, fresh processes, ten completed observations, no page errors).
These changes update profiling transport/documentation only; publication reuses
the verified runtime assets and preserves their original build identity.

# Warm edit execution — 2026-11-21

Automatic execution no longer waits for a fixed 200 ms typing pause. Parsing
starts on the next animation frame; compilation workers finish their current
request and retain only the latest pending edit. A UI permission message lets
only the current revision start execution. Explicit cancellation still terminates
workers immediately. During automatic edits, an executing worker gets one UI
task to deliver a queued completion before termination, preserving warm workers
without leaving an infinite program running.

The fast interpreter now keeps the canonical session created while preparing its
package instead of discarding it and reconstructing the same Foundation again.
Tower checks the complete package and execution cache against that session;
loading an external package still reconstructs and validates it independently.
Formatting derives component identities from the owning world. ECS ownership,
dependency scheduling and compiler worker policy remain intact.

## End-to-end measurements

Windows, Ryzen 9 5900HX, Node 21.7.3, Playwright 1.65.1 Chromium; Pixel 7 emulation
uses the same computer, not physical phone hardware. Both bundles ran from the
same local origin without concurrent builds or tests. These are medians of seven
small trailing-comment edits to the Memory example with automatic execution on.
Times run from editor input to the observed DOM result; completion includes all
selected outputs, including LLVM/native compilation and the optimized fast
interpreter package. Baseline source is `5fdee25`; published build source is
`b24847b`, including the integrated known-input and ready-query threading changes.

| Configuration | Highlight before → after | First instructions before → after | Graph result before → after | Complete before → after |
| --- | ---: | ---: | ---: | ---: |
| Desktop | 43.2 → 45.1 ms | 256.5 → 116.7 ms | 257.5 → 140.6 ms | 407.0 → 242.5 ms |
| Mobile emulation | 64.3 → 56.7 ms | 242.4 → 114.2 ms | 249.8 → 122.2 ms | 390.7 → 251.2 ms |

Full-output latency fell 40% and 36%, respectively. Highlight timing did not
materially improve. These small samples do not establish tail latency or costs
for large semantic edits. Source parsing and independent backend compilation
still perform work on each edit; this is not incremental semantic compilation.

Run the existing profiler from `playground` with `TOWER_PROFILE_REPEATS=7`:
`node scripts/profile-execution.mjs ../build/warm-edit-integrated-profile.json`.
The ignored before/after reports are `build/warm-edit-before.json` and
`build/warm-edit-integrated-profile.json`. Earlier `warm-edit-after.json` and
`warm-edit-release-profile.json` measured intermediate queue/source checkpoints
and are superseded by these numbers.

Browser checks cover semantic edits, a continuous 44-character typing burst,
retention of all three warm execution workers without reactor downloads,
obsolete-revision execution rejection, explicit cancellation and recovery from
infinite programs. Tower package fixtures cover both pointer widths, independent
session ownership, full-loader equivalence, invalid inputs and lifetime counts.
Fresh public-bootstrap native builds, shared-memory workers at 1/2/4/8 workers,
two matching editable compiler generations, package tampering rejection and
desktop/mobile deployment flows pass. See the project journal for exact commands,
the initial completion-race failure and publication integration checks.

The following section records the previous project-switch milestone. Its retained
execution debounce and warm-edit limitations are superseded by this change.

# Project switching and cold startup — 2026-11-21

The regression was reproducible after downloads and execution had warmed up:
switching projects discarded the parser and idle execution workers. Every switch
then rebuilt their grammar/compiler state. Edits also waited 200 ms before parsing
and terminated an unfinished parser request, defeating the existing latest-edit
queue. Idle workers now survive project switches, complete source capabilities
replace the previous project's inputs, and highlighting starts on the next frame.
Execution retains its separate 200 ms typing debounce. Active cancellation still
terminates the affected workers and their nested compiler workers.

CPU profiles also identified sorted insertion into LR closure sets and repeatedly
scanning a closure for each outgoing symbol. Tower now uses private hash indexes
while constructing a closure, sorts once before publication, and scatters items
into outgoing kernels in one traversal. The shared ECS graph, worker ownership,
dependency scheduling and deterministic publication remain authoritative.

## End-to-end measurements

Windows, Ryzen 9 5900HX, Node 21.7.3, Playwright 1.65.1 Chromium. Both bundles were
served from the same local origin, without concurrent builds or tests. The baseline
is the previously published bundle (runtime source `8e09a3c`); the final candidate
was built at `2f6ce16` (published as `736f8f1` after a documentation-only rebase),
including upstream `7d50641`, its published bootstrap/source migration and this
change. Mobile is Pixel 7 emulation on the same computer,
not a physical phone. Warm rows are medians of three actions; cold rows are one
fresh browser context per bundle and include the isolation-service-worker reload.
All times are milliseconds from the action to its observed DOM result. “Complete”
includes every selected execution/backend output, including LLVM optimization.

| Desktop action | Highlight before → after | Graph result before → after | Complete before → after |
| --- | ---: | ---: | ---: |
| Cold navigation | 2465.8 → 1507.1 | 6253.6 → 3796.9 | 6706.6 → 4333.6 |
| New project, already warm | 2643.7 → 53.0 | 6311.4 → 83.8 | 7092.6 → 127.4 |
| Switch existing project | 2638.2 → 68.8 | 6301.8 → 118.2 | 7371.7 → 321.0 |
| Edit with automatic execution | 252.2 → 48.9 | 285.1 → 281.0 | 454.7 → 485.1 |
| Execute unchanged source | — | 54.1 → 53.7 | 125.7 → 119.5 |
| Type with automatic execution off | 234.7 → 46.6 | — | — |

The first Foundation instructions on new projects fell from 6311.1 to 83.2 ms;
existing-project switches fell from 6301.3 to 117.6 ms. Warm edit execution did
**not** improve in this run; its debounce and backend work still determine completion.

| Mobile emulation action | Highlight before → after | Graph result before → after | Complete before → after |
| --- | ---: | ---: | ---: |
| Cold navigation | 2386.3 → 1533.3 | 5275.9 → 3024.2 | 5930.1 → 3467.2 |
| New project, already warm | 2600.5 → 53.1 | 5552.0 → 68.9 | 6152.4 → 93.8 |
| Switch existing project | 2668.8 → 47.4 | 5667.1 → 79.5 | 6413.3 → 194.1 |
| Edit with automatic execution | 246.3 → 38.2 | 278.3 → 253.6 | 413.8 → 420.2 |
| Execute unchanged source | — | 50.0 → 58.8 | 109.8 → 99.7 |
| Type with automatic execution off | 243.5 → 31.7 | — | — |

Desktop and mobile select different native targets; compare before/after within
each configuration. Cold startup still takes seconds: parser, graph execution and
LLVM workers independently initialize frontend state. Sharing prepared work across
those boundaries remains future work. These samples do not establish WAN download
latency, physical display latency, or a statistical cold-start percentile.

## Reproduction and CPU evidence

Build and serve the complete bundle using the README entry points, then run
`node scripts/profile-execution.mjs ../build/execution-profile.json` from
`playground`. Optional `TOWER_PROFILE_URL`, `TOWER_PROFILE_DEVICE` (`desktop` or
`mobile`) and `TOWER_PROFILE_REPEATS` select the origin, device and repeat count.
The report captures worker lifetimes, transport phases, parser duration, first
instructions, graph/fast/Wasm results, animation-frame markers, resource timing
and the deployment manifest. Existing Tower examples supply the workloads.
The final local comparison reports are `build/latency-local-before.json` and
`build/latency-rebased-profile.json`. The intermediate `latency-local-after.json`
predates the upstream source migration. These generated artifacts are ignored.

Set `TOWER_PROFILE_REACTOR` to a reactor path for a separate Node inspector CPU
sample. It writes phase timings and a `.cpuprofile`. With the same upstream
compiler, before/after the LR changes, sampled cold parse fell from 1782 to 1047 ms,
subsequent cold compile from 677 to 351 ms, and a warm new-session parse from 649
to 333 ms. These timings include profiler overhead and are not the browser table.
The original `memmove`/sorted-insertion hotspot is removed. Independent native LR
oracle tests compare exact closures, transitions and tables, including randomized
grammars, failure cleanup and reopening a sorted closure. Real LR worker tests
check overlap, ownership and serial equivalence.

The historical profile below describes an earlier implementation and workload;
its smaller timings are not directly comparable to today's full compiler pipeline.

# Live editing profile — 2026-11-16

The original edit path waited 450 ms after the last keystroke, cleared the
inspector/highlighting immediately, and discarded an in-flight worker on the
next edit. Each analysis also rebuilt the bootstrap grammar and all six grammar
revisions even when only a comment or identifier changed.

The updated path schedules analysis on the next animation frame. One request
runs at a time, with only the latest pending edit retained. Generation checks
reject obsolete replies. The same WASM worker and native session stay alive;
`syntax_reset` starts parsing from revision zero while retaining up to 16
validated compiled grammars in an LRU cache. The cache key is the complete
structural grammar. It includes literal text, captures, alternatives and
repetition, so changed syntax cannot accidentally reuse an incompatible table.

Existing highlight ranges map through edits until their replacements arrive.
The previous tree stays visible with its source-selection controls disabled
while stale. Source persistence is debounced separately from parsing. IME
composition postpones automatic analysis.

## Measurements

Windows, Node 21.7.3, Chromium through Playwright 1.65.1. Mobile measurements use
Pixel 7 emulation on the same computer, not physical phone hardware. Browser
samples type into the real editor and run the actual bundled WASM worker.
Twenty isolated edits were measured per browser configuration. Milliseconds:

| Measurement | Before median / p95 | After median / p95 |
| --- | ---: | ---: |
| Desktop: editor text change → result DOM update | 476.6 / 486.3 | 16.8 / 19.6 |
| Mobile emulation: text change → result DOM update | 478.4 / 486.5 | 17.4 / 19.1 |
| Desktop: worker parsing and snapshot | 16.2 / 18.8 | 1.0 / 1.5 |
| Mobile emulation: worker parsing and snapshot | 17.7 / 22.3 | 1.1 / 1.8 |
| Desktop: text change → next animation frame after update | 481.1 / 496.8 | 31.1 / 33.5 |
| Mobile emulation: text change → next animation frame after update | 483.4 / 500.0 | 32.1 / 33.2 |

The continuous 44-character typing burst produced one result after typing
stopped before the change, and 44 updates throughout the burst afterward.
The optimized run used one worker throughout and rebuilt zero grammar tables
for ordinary edits (seven cache hits, including the bootstrap table).

Separate Node/WASM phase timings include C ABI calls and JSON serialization /
decoding. After five warm-up iterations, twenty measured runs gave:

| Workload | Before median / p95 | After median / p95 |
| --- | ---: | ---: |
| Bundled example, full parse/inspect cycle | 24.89 / 28.27 | 1.29 / 2.64 |
| Example plus 500 loops, full parse/inspect cycle | 65.67 / 76.50 | 43.32 / 47.66 |

Before caching, bootstrap creation and declaration processing accounted for
roughly 24 ms of the example's 25 ms cycle. With caching, the larger document is
dominated by statement parsing/tree serialization (about 38 ms), followed by
highlight inspection (about 4 ms).

These numbers describe this machine and these workloads. The animation-frame
measurement is not a physical display-latency measurement. Parsing still reads
the whole document and creates fresh trees; it does not yet perform temporal
repair or incremental tree reuse. New structural grammars still require table
construction. The separate LLVM experiment is not part of the live typing path.

## Reproduce and verify

Build the modules and bundle as described in [README.md](README.md), then keep
`npm run serve` running and execute `npm run profile`. The profiler writes
`build/playground-profile.json`; pass another path after `--` to retain a run.
The before/after runs from this change are in
`build/playground-profile-before.json` and `build/playground-profile-after.json`.

All 10 WASM tests and 12 browser checks passed. Regression coverage checks that
continuous typing produces updates before the burst ends; delayed responses
coalesce to the latest source without replacing the worker; reset still starts
at grammar zero; and cached parsing matches fresh parsing after keyword changes,
Unicode edits, conflicts, recovery and cache eviction. Native AddressSanitizer
also passed the reset/eviction lifetime checks.

## Follow-up: source-defined tokens

After replacing the fixed application lexer with Tower token/skip declarations,
the same profiler measured 17.2 ms desktop and 18.1 ms mobile-emulation median
edit-to-result DOM latency (p95 20.5 / 20.1 ms). Worker parsing took 1.3 / 1.4 ms
median. Both continuous typing runs produced all 44 updates with one warm worker.
The full Node/WASM example cycle was 1.56 ms median; the 500-loop case was 52.81 ms.
Loading WASM and compiling the runtime lexical seed took about 51 ms once, outside
the steady-state edit path. These results are retained in
`build/playground-profile-tokens.json`; they use the original foreach workload
with the new token engine, not the larger token-declaration example.

## Follow-up: deterministic construct lookahead (2026-11-16)

Removed the EOF probe that copied and simulated the whole parser stack before
each token. Construct tables propagate FIRST(start) as boundary lookaheads and
reject conflicting actions. Parsing uses ordinary table actions, safe default
reductions and at most one unshifted lookahead. It never retries a shifted
continuation or explores alternative parses. Grammar changes discard uncommitted
lookahead and resume from the accepted construct's end.

Generated repetitions now concatenate arena-linked child forests in constant
time and flatten each fragment once when constructing a real node. Capture
overrides are lazy wrappers, preserving named children without repeatedly
copying lists. Browser tree serialization obtains member names by child index,
avoiding a linear sibling search for every child. Disabled step tracing also
avoids formatting action descriptions.

For a fixed grammar, LR actions and tree construction have amortized O(1) work
per token, O(n) total work and O(n) tree/forest storage. This does not claim O(1)
per character for the entire pipeline: compiling changed grammars has a separate
cost, and the existing lexer tests individual token patterns and can scan ahead.

Native counters cover sizes 256, 512, 1,024 and 2,048. Nested input used 773,
1,541, 3,077 and 6,149 action decisions; repetitions in either recursion direction
used 515, 1,027, 2,051 and 4,099. Tests also bound popped frames and forest visits,
so a single action cannot hide repeated traversal of an accumulated child list.

The supplementary warm WASM benchmark includes parsing, tree serialization and
JSON decoding, excluding reset and grammar declarations. Local medians:

| Shape / size | Before | After |
| --- | ---: | ---: |
| Nested, 512 levels | 11.87 ms | 5.25 ms |
| Nested, 2,048 levels | 79.21 ms | 23.10 ms |
| Repetition, 512 items | 8.81 ms | 2.67 ms |
| Repetition, 2,048 items | 95.28 ms | 9.77 ms |

These wall times are illustrative and affected by machine load; operation counts
provide the deterministic scaling check. Run `node scripts/profile-parser.mjs`
from `playground`, optionally passing an old WASM path for comparison. Results
are written to `build/playground-parser-scaling.json`. The local before module is
`build/tower-before-lookahead.wasm`.

## Tree replacements

Replacement templates are compiled with grammar revisions and retained in the
existing bounded cache. Ordinary invocations construct trees without lexing or
parsing their replacement text again. Expansion uses an explicit work stack;
already-expanded captures are moved on their final use and copied only for
additional uses. A 400-level identity chain is covered by a test requiring zero
generated/copied result nodes. Temporary expansion bookkeeping still allocates.

The bundled replacement example has 15 declarations and four statements. A local
run measured about 281 ms for its first parse and 2.66 ms median (4.60 ms maximum)
for warm invocation edits, including reset, expansion, JSON and inspection. The
warm runs rebuilt no grammars and recorded 16 cache hits. This is compiler/host
time, not browser input-to-paint latency. Editing grammar or template definitions
can require more work; source positions currently participate in template keys.

Run `node scripts/profile-replacements.mjs` from `playground` to reproduce and
write `build/replacements-profile.json`. Expansion has additional work and output
costs beyond LR recognition, with explicit limits for recursive/growing output.
This is the reference expander; replacement-chain shortcut composition is not
implemented yet.

## Typed core execution example

The executable example has 21 declarations and needs 22 cached grammar versions
including its baseline. The previous 16-entry capacity would evict earlier
versions on every full reparse. Capacity is now bounded at 32; a regression test
requires zero table builds after changing the example's loop comparison constant.
Larger documents can still exceed this bound; general incremental compilation
and cache policy improvements remain separate work.

A local 2026-11-16 WASM/host measurement (reset, full parse/expansion, JSON and
inspection) recorded 316 ms cold, 7.75 ms warm median and 9.95 ms warm maximum over
11 measured edits after warm-up, with 22 hits and zero grammar builds. Raw values
are in `build/execution-profile.json`. These timings do not measure browser
input-to-paint latency; source edits affecting grammar/templates can rebuild tables.

Execution uses a separate worker and fresh instance per run. Its initial parse
and type check may be cold. The machine runs 10,000-instruction slices, batches
output approximately every 50 ms and limits total output to 64 KiB. Editing or
cancelling terminates the whole worker, including a synchronous compilation in
progress. Desktop/mobile browser checks exercise infinite printing loops,
editing, cancellation, restarting, and inline compile/runtime errors.

Auto execution now schedules a fresh worker after a successful complete parse
and a 120 ms quiet period. Edits immediately terminate the old execution worker;
parser caching stays warm independently. This coalesces short typing bursts,
but execution compilation still incurs a fresh parse/type check. The timing
above describes live parsing, not total edit-to-execution latency.

## 2026-11-17: worker reuse and trailing typing debounce

The worker-lifetime and 120 ms scheduling descriptions above are historical.
Completed backend workers now retain their compiler state; each execution still
gets fresh program memory. Active cancellation terminates a worker, while the
parser worker retains its separate grammar cache.

Typing now has one 200 ms trailing debounce before analysis and automatic
execution, reset by every edit. Opening files and explicit Execute remain
immediate. Errors and previous results stay visible until replacements arrive.
The typing profiler includes this intentional wait and checks the final update
after a continuous burst. The execution profiler detects a new instructions DOM
update rather than treating retained instructions as a completed new compile.
The initial 250 ms choice has been shortened to 200 ms at the user's request.
Parse errors clear after analysis, semantic/runtime errors after compilation;
neither waits for program execution to finish. See the journal for measurements.

Runtime load timings measure each current request. Reusing an installed runtime
is labeled `(cached)` even if the measured lookup rounds to 0.0 ms; the display
does not retain a cold-load measurement as a substitute for this work. Detailed
LLVM phases and their aggregate compile total are shown separately. Each backend
is ordered by its pipeline; the backend workers run in parallel.
