# entity_pages reconstruction: exact request fits the joined reactor

The retained 965691-byte Foundation request now succeeds on ROOT's complete
`a06ec4b1f9f44419882477bc1a55b6ed39e2200b` LLVM reactor without changing the
2 GiB guest ceiling. The 4675795-byte result is byte-identical to both preserved
and current native reconstruction. No additional production storage change was
needed: the joined B2 inline component index removes the measured dominant
avoidable allocation. This closes the isolated unoptimized wasm32 Foundation
request, **not** the complete semantic-port/package/execution test.

## Frozen identities and retained failures

| Boundary | Identity |
| --- | --- |
| Exact input, all requests | 965691B, SHA256 `fadb0568535010d954cafde4ce9559e5636829c81e181be66b14e27f187b08d5` |
| Exact successful output | 4675795B, SHA256 `5bfbd3be67f3b2b8f00fa3c5cc9e0bf1ea31f2c9a6b7c06e508d5c3b8d0792f1` |
| Old compiled reactor source | `25dddd0420258bc5174a3039293c447fd60ef367` |
| Old portable / LLVM SHA256 | `35379f42d09a199c1f2ff83327b861fcc50f65d0c70f57006ba5065adfd773fb` / `c1280ba15b9d529acf45f5165d83e47b7f233b2273a982767ec80ab87e63ecfa` |
| New compiled reactor source | `a06ec4b1f9f44419882477bc1a55b6ed39e2200b` |
| New portable / LLVM SHA256 | `f065757480f1b94ad4f181aadeb8e0a63bc06b781a546aed11ac12796a64a25d` / `8acbaf08545d0ce972f2de7db2a89fcfc7ef434f95f775feca06dde759107697` |
| Old native / isolated mounted resources | `4354581caeaf2bc71189617c04d48cdd45750f9e`, tree `852fe967cc7a3b2f13fe39530a170ca4fddae048`, plus optional observer/host accessor |
| Current native / isolated mounted resources | `a18d584e29b79267bc03d099e70e214e48017b36`, tree `604828158f8ac7d9acab878246e83d5ccbd2b3e0`, plus this observer/host accessor |

ROOT's original full selected test used mounted resources `ea606d329b` and the
25 reactor. Original Graph/Fast and canonical reparse/execution passed. The first
unoptimized LLVM request failed with `Memory`, `Cannot allocate semantic storage`,
offset2303454, file `.tower/tests/entity_pages.tower`; selected248.394s,
total249.392s, exit1, not timeout. The observed child CPU304.453125s and
peak2080923648B were not final metrics. Later phases were unstarted, and18
unrelated tests were exclusions. That receipt remains unchanged.

The isolated requests below use the **same bytes** through existing `loadLLVM`
and `compile(text,{emit:'foundation',optimize:false})`, default wasm32 target.
They use the loader's `input.tower` virtual entry, not ROOT's module filename,
and separately frozen resource sets. The new mounted production compiler source
is identical to a06; later differences are tests/package tooling/docs. The
ordinary Node transport reads the existing exported memory capacity through the
new read-only `memoryCapacityBytes()` accessor. Neither portable execution nor a
reactor rebuild is substituted for LLVM reconstruction.

| Isolated request | 25 failure | a06 success |
| --- | ---: | ---: |
| Actual Node PID |16828|20208|
| Whole Node command wall seconds |172.1796941|132.5450749|
| Compile-call interval seconds |171.6706151|132.0592068|
| Cumulative Node CPU at response seconds |238.765|195.452|
| CPU within compile-call interval seconds |238.063|194.844|
| Peak RSS at response KiB |2028912|1862976|
| RSS at response bytes |2077585408|1907617792|
| LLVM linear capacity before request bytes |41025536|37945344|
| LLVM linear capacity at response bytes |2147483648|1978990592|
| Actual process exit |1|0|

Node21.7.3 on KinmenA Windows11, CPU0–11, one actual Node process per isolated
request, no guest ceiling/heap override. CPU/RSS belong to that process, not a
`node --test` parent. Response measurements precede the final output-file write;
they are not claimed as process-exit resource counters. n1, sequential warm-host
observations; a failed request versus a completed request is not a matched
throughput speedup. The new request has168493056B linear-capacity headroom, not a
guarantee about larger inputs or repeated-session fragmentation.

The isolated25 failure is `Memory`, same message, offset3369064 in `input.tower`.
Both old offsets exceed the submitted input length and fit the larger generated
text; offsets alone identify neither the allocator nor the phase. Native phase
evidence below identifies the dominant live frontier. No Wasm allocation stack,
Wasm ledger census or separately measured LLVM heap total is available. Actual
2 GiB capacity saturation is established; individual allocator attribution is not.

## Native joined ownership census

Existing `backend_source_native` entry, Linux x64/LLVM19, public bootstrap
`768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`, Release,
production allocator, CPU0–11/24GiB container. Semantic target width4. Native
pointer/allocator sizes must not be treated as wasm32 bytes. The explicit24GiB
world budget covers existing checked owners, not foreign LLVM/libc, raw legacy
vectors or whole-process RSS. Its metadata is reported separately.

| Joined phase / category, bytes unless noted |4354581c|a18d584e|
| --- | ---: | ---: |
| Recheck parse entry, charged live |21018808|19952380|
| Recheck parse entry, entities |10243|10243|
| Recheck parse exit, charged live |2010416690|1653737331|
| Recheck parse exit, entities |2996271|2996271|
| Recheck semantic-dispose entry, charged live |3012608283|2718506011|
| Recheck semantic-dispose exit, charged live |2632926295|2338824023|
| Peak charged bytes |3020547282|2726445010|
| Retained ledger metadata before disposal |335544320|167772160|
| Final used bytes / grants / lanes |0 / 0 / 0|0 / 0 / 0|
| Semantic-dispose component heap indexes |407503880|62826976|
| Semantic-dispose descriptor/name pages |845386001|895960633|
| Semantic-dispose child heap indexes |302758144|302758144|
| Semantic-dispose table indexes |85096200|85096200|
| Semantic-dispose component payload pages |951174046|951174046|

At parse exit2994481 indexed entities have exactly one component. Their separate
index buffers change407249416B →0B; inline slots are now part of descriptors.
At semantic-dispose entry the corresponding2534389 singleton indexes save
344676904B, while larger descriptor pages cost50574632B. The net294102272B
exactly matches the reduction in peak charged storage. The ledger metadata also
halves. This quantifies B2's already-published producer improvement; this turn
does not duplicate or modify Entity layout.

The checked categories are disjoint physical allocations, not logical payload
sums. They intentionally do not claim a full ledger census: non-indexed kind
entities, additional semantic owners, scratch and foreign allocations remain
outside those category totals. `instance_indexes=0` for indexed nodes does not
mean kind-instance indexes do not exist. Assertions ensure category totals do
not exceed the live ledger and all histogram instances are represented.

Both source freezes have2995147 live ParserMatch components:167728232B payload,
46800 pages/2995200 slots,346273200B physical pages, approximately99.998% slot
occupancy. Foundation kind6 has449808 live components,154733952B payload,
31409 pages/1256360 slots,509799479B physical pages,35.80% slot occupancy.
Stable payload pages differ from dense pointer indexes; the latter are not
packed payload. Foundation page slack remains a measured limitation, not a
reason to relocate live payloads or add another policy experiment here.

`backend/source_session.tower::backend_source_import` already closes formatter,
imported program and original program before the standalone recheck. The
~20MB entry census corroborates that lifetime transition. The LLVM module still
has187 functions/10 declarations,2729 blocks and45621 instructions at that
point; no separate byte attribution to LLVM is inferred. Semantics disposal
releases379681988B on either freeze before program teardown. No redundant
original/imported graph retention or missing final ownership release was found.

## Focused validation and observer repair

Only `tower-backend-source-tests` was incrementally built, dependency-aware,
buildparallel2/compilerjobs1 (46.898s wall). Current executable SHA256
`0c8bdbb65f4979be4932dc5e3f291a34ac87235f1495c8a95073ff66a1c89d2a`;
source-provider object `0a33fbe22e011e093aa1ebb3c469c15e5d6533d5be2a5928f4b087ea8b2db11d`.
Actual commands, other linked-provider hashes and dependency hashes are retained.

| Current native check, one sample |Wall s|CPU s|Peak RSS KiB|
| --- | ---: | ---: | ---: |
| Small518B, workers1, census off |0.512544|0.442129|178988|
| Small518B, workers4, census off |0.582542|0.561881|182328|
| Exact large, workers1, census off |10.801937|10.698070|2933020|
| Exact large, workers4, census off |8.934812|11.883621|2945648|
| Small, workers1, census on |0.549218|0.473508|178468|
| Exact large, workers1, census on |11.198066|11.099400|2934484|

All six runs exit0, report resource0 and zero final owners. One/four-worker and
census/plain output comparisons are byte-identical. Small output58057B has
SHA256 `45f35d6fd27696d04461a44a0f22cdee93eecfe397d16c1b951147557607aca4`.
Large output also matches the successful Wasm result. Four workers cost more CPU;
n1 and no overlap trace do not establish general scaling. These runs check
reconstruction and semantic acceptance, not emitted-program execution.

The optional census originally allocated by maximum ParserMatch ID. The small
control contains sentinel4294967294 and failed its observer admission guard.
The repair uses the existing budgeted private work_vector for actual distinct
IDs:173/168 groups on small initial/recheck parses,161 on the large parses,
12288B vector capacity. It checks that group counts sum to all parser instances,
retains sparse IDs and frees the observer at each coordinator boundary. Physical
index reads recognize descriptor-owned inline slots; no invalid header read or
double charging. Production compiler logic is unchanged.

Preserved old-source large measurements: original census12.383916s wall,
12.292436s CPU/3339112KiB; corrected optional census13.150426s,
13.051164s/3338972KiB, same bytes/output/peak ledger. Extra category walks and
group lookup cost about6.2% in that n1 observation. Current census costs about
3.7% versus current plain large run. Observation is optional and excluded from
plain throughput evidence; no free measurement or compiler-speedup claim.

Earlier observer guard exit134 and explicit-foreach-borrow compile failure are
preserved. After all six current checks and comparisons passed, the shell's
metadata step exited1 because obsolete `semantics.o` no longer exists; a first
metadata-only command also lost `tr` quoting. Neither is a compiler/test failure.
The separate literal metadata script verifies actual `tower-compiler-semantics.o`
and dependencies with exit0. No completed measurement was repeated.

## Remaining acceptance and raw evidence

ROOT/L2 retain the complete selected test's remaining reconstructed execution,
optimized reconstruction, package/load and subsequent target gates. This turn
does not rerun or pass them, publish runtime assets, or supersede the separate
service-rejected instrumentation requirement. No allocator injection, sanitizer,
browser build, ceiling increase, cancellation-policy change or semantic assertion
relaxation occurred. No new frontend production fix is justified after the
joined storage improvement passes this exact request.

Raw evidence under `C:/Sandbox/build/codex_ecs_20261122/A2/`:

- `root_entity_pages_25dddd04`: ROOT exact source/error/log and child observations.
- `cache/logs/entity_pages_25dddd04_4354581c`: original/current-observer native
  logs, preserved executable, failed diagnostics and isolated25 request.
- `cache/logs/entity_pages_a06ec4b1_a18d584e`: exact input/output, a06 Wasm logs,
  direct process exit/wall receipt, native6 runs, link/provider/source identities,
  metadata failures/recovery, commands and resource blob map.

ROOT's immutable reactors, manifests and SOURCE.txt remain in
`root_release_a06ec4b1`; their source is reachable from published main. Later
source changes require explicit adoption, not movement of this frozen boundary.

Publication reconciliation merged complete upstream history through `e637ba38`
as `43a8f16d`. Incoming changes are Windows gate fixtures/registration and
documentation; no compiler/backend/library/host production producer changed
from the tested a18 freeze. All72 source-provider dependency hashes still match,
including this observer. Those new Windows tests were not run or adopted here.
The measured reactor/resource boundaries above remain unchanged.
