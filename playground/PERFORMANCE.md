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
is the previously published bundle (runtime source `8e09a3c`); the candidate includes
upstream `d2d5633` and this change. Mobile is Pixel 7 emulation on the same computer,
not a physical phone. Warm rows are medians of three actions; cold rows are one
fresh browser context per bundle and include the isolation-service-worker reload.
All times are milliseconds from the action to its observed DOM result. “Complete”
includes every selected execution/backend output, including LLVM optimization.

| Desktop action | Highlight before → after | Graph result before → after | Complete before → after |
| --- | ---: | ---: | ---: |
| Cold navigation | 2465.8 → 2020.6 | 6253.6 → 5344.1 | 6706.6 → 5828.4 |
| New project, already warm | 2643.7 → 50.9 | 6311.4 → 72.5 | 7092.6 → 114.0 |
| Switch existing project | 2638.2 → 69.4 | 6301.8 → 111.2 | 7371.7 → 347.1 |
| Edit with automatic execution | 252.2 → 46.9 | 285.1 → 285.7 | 454.7 → 490.2 |
| Execute unchanged source | — | 54.1 → 53.0 | 125.7 → 122.3 |
| Type with automatic execution off | 234.7 → 37.6 | — | — |

The first Foundation instructions on new projects fell from 6311.1 to 71.7 ms;
existing-project switches fell from 6301.3 to 110.6 ms. Warm edit execution did
**not** improve in this run; its debounce and backend work still determine completion.

| Mobile emulation action | Highlight before → after | Graph result before → after | Complete before → after |
| --- | ---: | ---: | ---: |
| Cold navigation | 2386.3 → 2041.8 | 5275.9 → 4332.8 | 5930.1 → 4923.8 |
| New project, already warm | 2600.5 → 54.1 | 5552.0 → 71.3 | 6152.4 → 105.8 |
| Switch existing project | 2668.8 → 66.2 | 5667.1 → 100.1 | 6413.3 → 271.1 |
| Edit with automatic execution | 246.3 → 60.2 | 278.3 → 266.1 | 413.8 → 444.7 |
| Execute unchanged source | — | 50.0 → 50.0 | 109.8 → 108.0 |
| Type with automatic execution off | 243.5 → 37.6 | — | — |

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
The local comparison reports are `build/latency-local-before.json` and
`build/latency-local-after.json`; these generated artifacts are ignored.

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
