# Parser trace fault oracle: pooled owners and real denial

Test-only repair of `Measured parser trace toggle cleanup`; parser/recognizer/grammar production code is unchanged. The original `parser` selector now passes, alongside focused trace/regex checks and an independently failing retained-marker negative.
Freeze `c934d02de7709ecf236c4dbe2a1ca9ea6f92fb20`, tree `98e3815e87a41bf0d9f89e2a901b36ab18cb7160`. KinmenB Linux x64/Clang19, CPU0-11/24GiB, one native cache, buildjobs6/compilerjobs1, public768 predecessor, no private override. Jobs drained before edits;116GiB initially free.
Before frontend runner SHA256 `8662609b7a6ff0f72a7d9dc99a59a62bc9d3f093013ff854f909bd13a9696edc`; repaired runner `9995d7330505304445545dcc2323a0d6e16f5d4d3e0eadd31c910f50ad2131c6`. Public bootstrap SHA256 `768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`. Complete source/binary/producer hashes are retained.

The unchanged selector reproduced the exact assertion and SIGABRT/status134. Its ordinary parser integration printed success first. Prior before/after SCC failure logs remain untouched; reproducing both binaries never established that this gate was acceptable.
`parser_set_debug_trace` creates a related entity, attaches it under `parser.trace`, then releases its temporary reference; disable detaches/releases the owning relationship. Creation/attach failures return false; no parser preparation path was edited.
Entity descriptors and names now occupy live slots in the world's `EntityStore.buffers` pages; the child index is inline or retained. The single-owner instrumentation still correctly counts physical compiler-buffer calls, but it cannot count slot reuse. Warmup leaves reusable slots, so a subsequent successful enable performs **zero** physical allocations.
The old `allocations != 0 && parser_set_debug_trace(false)` short-circuits: it never calls disable when the first operand is false. Thus its cleanup diagnostic misidentifies a stale physical-allocation assumption, not an observed trace-disable defect. New observation confirms `allocations=0`, `removed=1`, baseline6 live pooled slots.

The replacement oracle snapshots store entity count, live descriptor/name slots, physical buffers, owner references and ordered children. It verifies one named marker with parent/reference ownership, repeated enable, allocation-free disable and exact return to baseline. This is a coordinator-only read of declared Entity/page types, not a hidden-header cast or modified allocation counter.
To force real Memory denial, it derives a finite bound from actual free page slots and preallocates an explicit WorkBuffer of held entity pointers. With physical allocation denied, it consumes13 reusable descriptor slots; the next checked entity creation returns `WorkBudgetError.Memory`. Trace enable then attempts one physical allocation, returns false and publishes nothing. Removing denial permits retry; disable retires the new page/marker. Releasing fillers and scratch leaves zero new entities/slots/buffers.
The legacy registry remains owned by the host; zero means fixture ownership returned to its measured baseline, not destruction of the default world. No global cap, counter reset, forced success, skip or capacity increase. The temporary WorkBuffer uses the existing store budget binding; this legacy store is standalone.
An independent missing-cleanup control retains the marker, disables trace, and observes an unattached live entity that child count/physical buffers alone miss. The normal test requires detection. `parser-trace-leak-negative` deliberately expects that leaked state to be clean, **after** releasing the injected reference and restoring the setting; it aborts with the exact expected message/status134. A different failure message or zero exit fails the external control.

Public768 dependency-aware build compiled only `tower-frontend-tests.o` and linked its runner. Three prerequisite diagnostics were preserved: mismatched opaque/typed entity declaration, mismatched existing `dprintf` declaration, and the SCC fixture's indirect `LRTokenEnd` import. Foreign declarations now match the existing test ABI; one explicit `.compiler.lr_types` import repairs that fixture dependency without changing the SCC algorithm.

| Focused process | Result | Wall / CPU s | Peak RSS KiB |
| --- | --- | ---: | ---: |
| Original `parser` | expected reproduction: abort134 | .03 / .01 |50716|
| Repaired `parser` | pass, including subsequent parser faults | .04 / .02 |53904|
| `parser-trace` | pass, normal/Memory/recovery/zero new owners | .02 / .01 |51048|
| `regex` | pass | .04 / .02 |53104|
| `parser-trace-leak-negative` | expected abort134, exact diagnostic | .02 / .01 |48788|

Successful fixture build16.40wall/11.94CPU/679200KiB. These are validation costs, not a runtime speed comparison: the original selector aborts before completing. Production source is unchanged; towerc/native-worker/profile executables compare byte-for-byte with the accepted SCC artifacts. No150-grammar/SCC/CLI/performance matrix rerun or timing claim.
Raw evidence: `C:/Sandbox/tower-agent-1/build/ecs_b1/cache/parser_trace_c934d02d`: `source.txt/source.sha256`, before fixture/runner/log/time/status, all failed compile logs/patches, repaired runner/hash, parser/trace/regex/negative logs/times, `negative.status`, producer hashes. Command transport: `build/ecs_b1/parser_trace_check.sh`; project logic is Tower.
The failure-injection runner is serial and uses its existing instrumented allocator/portable host transport. It is not a thread sanitizer or real-worker-overlap test. Full generation/reactor/browser/sanitizer/hosted publication remain ROOT-owned; no public pin or runtime deployment changed.
