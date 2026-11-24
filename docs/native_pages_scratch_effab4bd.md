# Native pages: execution reparse within the existing 2 GiB world

Frozen published source `effab4bd4fdd3fc789a877de8c3cb170e1d6acf0`, tree `a4b5f1088f3cdfbe60eecd218b0505bce296d4d3`, plus the scoped scratch change below.
Public bootstrap SHA256 `eeb005717318086c145428edc3b6b784d4729df7ef0514c7329e0a18b76dda9c`; default dependency-aware build, no private override.
Exact [L1 failure](native_ecs_b862499b.md): 4,769,423 B/SHA256 `a4e1eaaf5503f4f8596afe49352e74078f349938029b26f536833a0a32b51b46`; no regenerated or smaller substitute.
Original canonical remains 983,366 B/SHA256 `47f43eaa4e547f5e83097c03597a22862b9d611b5ef73139fc748d650aca296c`. Both retained L1 files were hash-verified before work.
Host: Orchestral-Revng Linux x64, actual WSL15GiB, CPU4–7, one owned family,8GiB cgroup/no swap, existing l2_ecs_native cache; L1 heavy family was absent.
All target32,2GiB world,160MiB semantic component,100000000 fuel and180s request guards remain unchanged. No backend reconstruction/output edits.

Current baseline reproduced exact Capacity at expanded110976:5/offset2982286, then outer assertion exit134:18.99wall/10.52CPU seconds,2432904KiB peak child RSS; no host OOM/max events.
A temporary Tower GrammarObserver census reads only joined parse/disposal boundaries; no global allocation counter under workers and no additional budget allocation for the census.
Parsing retains3,078,687 entities/3,080,401 components and1,489,482,112 charged bytes. ParserMatch owns3,050,949 components:170,853,144 logical payload B,352,725,128 physical page B.
Descriptor/name pages919,782,401B, child indexes89,336,936B and table indexes67,897,464B dominate the other parse categories; logical payload is included in physical pages, not added again.
Semantic checking fails at peak2,147,483,609B:3,464,452 components,305,916 Foundation components; their105,235,104B payload occupies166,196,989B of pages.
The joined context's arena retains346,298,579B capacity for27,832,453B payload (8.04%); semantic disposal releases352,546,443B. Failure teardown reaches zero bytes/grants/lanes.
This is avoidable arena tail capacity, not a demonstrated duplicate imported graph, stale previous execution,2GiB Wasm ceiling or host OOM. Full parse entities remain authoritative and live.
`sem_declaration_kernel` transfers lexical scratch for body continuations; `sem_declaration_error`/`sem_body_publish` join it into compilation ownership. `sem_context_dispose` is the common retirement boundary.
Those lexical references cannot simply be freed on a worker join. The change lowers only `SemanticScratchChunkBytes` from4096 to1024 in [semantic_support](../scaffolding/compiler/semantic_support.tower).
Existing WorkArena still admits the complete physical chunk, preserves stable slices/alignment/oversized allocations, joins without allocation, retains first typed errors and drains before retirement.

The census candidate completes the entire unchanged input: Foundation458,167 components/157,609,448 logical B/238,638,673 page B; total3,633,266 components on3,078,766 entities.
Completed scratch is125,166,868B capacity/29,187,563B payload (23.32%): less capacity despite more completed work. This is not a same-completion peak-speed comparison with the failed baseline.
Peak charged through reparse/check, workers1/4:2,051,014,208/2,050,990,312; ledger metadata83,886,080B is reported separately. First compile returns resource0 and leaves1,878,856,973B before execution.
Graph and Fast both execute exact `0\n` at workers1/4, compare complete formatted Foundation bytes, and close with zero bytes/grants/lanes. No execution phase was skipped.
Temporary probes are preserved externally and removed from production. The clean provider rebuild is explicitly recorded; restoring an older source timestamp initially left the observer argument scan cached, so those earlier timings remain separately labeled.
Clean full request exits0:62.43wall/67.84CPU seconds/2447084KiB peak child RSS, all four Graph/Fast1/4 trials. These are validation costs; the incomplete baseline is not a speedup denominator.
Before ELF SHA256 `738f755e0e8afdb4f9ce7697a888b5899b50f46a19e54c7c929d70c1166e261f`; clean candidate `40adcffc388304b04a827968e07c32dbc53caa61e893cbd1dd93432cfaf09abf`.

Raw evidence E: `C:/Sandbox/build/codex_ecs_20261122/L2/pages_memory_effab4bd/`; [original handoff](../../build/codex_ecs_20261122/L1/native_ecs_b862499b/ROOT_handoff.txt) stays unchanged.
E contains exact input, SOURCE, source/cache/bootstrap manifests, before/probe/scratch/candidate_probe/clean binaries, scripts, outputs, actual exits, GNU child metrics, cgroup peaks/events and observer.patch/Tower probe source.
Two temporary probe build diagnostics (incompatible printf declaration, missing opaque-pointer cast) and the initial cached-observer timing boundary are retained; none count as passed checks.
Focused scratch ownership/denial/terminal-retry PASS (0.01wall/0.01CPU,51972KiB); query-smoke PASS (12.49wall/12.92CPU,375808KiB), including32/64 serial/threaded lazy dependencies and resumable readiness.
No new test framework, parser/storage representation, cap increase, early release, independent scheduler, optimization substitution, browser/reactor/generation/sanitizer/deployment work.
The later18 L1 pages phases remain unstarted; ROOT still owns their integrated adoption and actual Wasm/current package/release acceptance. Native RSS does not establish guest fit or universal race freedom.
Small pointer/effect controls32/64, each Graph/Fast1/4, all pass with byte-equal canonical/output: before wall1.07/1.13,CPU0.94/0.99,RSS187488/184976KiB; clean candidate1.07/1.10,0.95/0.96,187364/187424KiB (n1 each; no speedup claim).
Clean validation-family cgroup peak2478866432B, OOM/max events0. The2GiB limit is charged world storage, not whole-process RSS; temporary ledger/host overhead is not hidden.
Integration: code a6737f7a/full-history merge3e4c3681 adopts origin132f6c82. Compiler/backend/library production blobs match the tested candidate; incoming project tooling and A2 standalone query-denial fixture retain their own receipts.
New public bootstrap44ae8f73 rebuilt the three affected targets (46 actions,51.07wall/128.16CPU,897380KiB) and produced byte-identical execution ELF40adcffc. Exact full request again passes60.06wall/65.41CPU/2451624KiB;64-bit control, scratch and query-smoke pass; merged family peak2702393344B/OOM0. Raw merged_* files identify this adoption separately.
