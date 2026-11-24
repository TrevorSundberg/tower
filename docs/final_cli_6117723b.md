# Final native candidate CLI cost and size — source6117723b

- ROOT `native_candidate_20261124_r2.json` arrived through the supplied quiet artifact wait. Candidate source `6117723b22b019e48938927ad22ce3ea8f643c63`, tree `69baf4529875dce04645e80af1a877aac85eb0e0`, is published and includes D1 reset/expansion repair150d4462. No intermediate/compiler/vendor build, generation, sanitizer, observer or40-run scaling repeat.
- Immutable local delivery `C:/Sandbox/build/codex_ecs_20261122/ROOT_native_final_611/generation3.tar.gz`: **2818813B**, SHA256 `8a02287234966b39c166e7e9f9ff8bcadd5ac8e3fa0a28138b078c8015f1e4cc`. Source snapshot SHA256 `e78e950cb35285a1eecb2f0beaa84d18f5ddae55f51dcb11465729d0b8f6a6a6`, Git tar commit611 verified; actual1290 provenance source files match both recorded SHA256 and published Git blobs, using LF archive bytes rather than checkout newline conversion.
- Fresh owned extraction: all57 payload hashes/sizes match `SHA256SUMS` and development metadata, with exact membership/no extra payload files; executable0755. Development JSON SHA256 `faba6eb45610fa8fb90fc6c2a98927138e6552042a7c546bcff25ad92be66c11` verified. Metadata records Release/LLVM19.1.1 and explicit complete Gen2 predecessor04ae for Gen3; no private predecessor is adopted publicly here.
- Candidate CLI SHA256 `04ae22d0e73e3674e43895ea2d1efc13da8b7a6b4704df5815369490e6fcfc47`; before is the retained ordinary73cc CLI `dd944af028ef81296feaad9b2418b9cca0da53c0b7d37a06ba930d3c80e0d67f`, not the older0f922/c855 arm. Both copied privately, checksummed before/after, with all original archives/arms unchanged; neither executable references ASan/TSan/UBSan hooks.
- Same Orchestral-Revng WSL2 Ryzen9 5900HX/Clang19.1.1 host; actual CPU0–3 affinity (four logical/two physical), MemoryMax4294967296B, swap0, unlimited virtual address space. One compile process at a time; jobs1/4 are compiler worker requests, not concurrent benchmark processes. Fresh processes; shared host/no frequency isolation/no discarded warmups.
- Retained exact16/1000-function Tower/C sources and independent15/999 expected files/reference objects reused. Before/current resource-directory names have equal length; all five transitive language resource files byte-match. Remaining package resource hashes/path differences retained, not normalized. Same independent reference runtime object for all Tower outputs; host/library/runtime build sources are Git-equal73cc→611.
- **20 selected/executed/completed compiles and native controls,0 failed/skipped/unstarted:**16 Tower (two shapes×jobs1/4×two arms×n2) plus4 Clang (two shapes×n2). Shape/arm/jobs ordering counterbalanced. All16 complete Tower object files match the preserved reference bytes; all20 linked programs print exactly15 or999 newline and exit0. Link/execution stderr empty; Tower compile stderr contains only requested timing records.
- Commands unchanged: Tower `--jobs N --emit object --timings --target x86_64-unknown-linux-gnu --bedrock ... --foundation ...`; Clang `-std=c11 -m64 -O2 -fwrapv -c`. Original compile180s/native20s guards retained. Correct C-only link recipe reused; no Tower runtime attached to C `main`. Clang controls freshly rerun because affinity changed from the prior twelve-CPU cohort; historical timing is not substituted.

| Functions/jobs | Before→candidate mean wall s | Before→candidate mean CPU s | Before→candidate max RSS KiB | Fresh Clang n2 wall/CPU/max RSS KiB |
|---|---:|---:|---:|---|
|16/1|.485→.410|.430→.400|171756→171816|.025/.020/99560|
|16/4|.455→.435|.470→.455|175784→175612|same C control|
|1000/1|.605→.595|.595→.580|191240→191280|.105/.100/110184|
|1000/4|.635→.625|.660→.650|197704→197524|same C control|

- All samples retained. Small serial before range .400–.570s versus candidate .410/.410; the first baseline reports42 major faults, .14s system CPU and .570s wall versus its .4245s internal total. This startup/I/O observation dominates the apparent mean gain; no causal speedup attribution or additive claim. Large serial ranges .600–.610→.590–.600; four-worker .630–.640→.620–.630. n2/shared-host evidence is not a performance promise.
- No material candidate runtime/memory regression observed. Serial peak changes are only+60/+40KiB; four-worker peaks decrease172/180KiB. Four workers still cost wall/CPU on these small fixed-function controls; this does not replace the accepted dependency scaling measurement. No speculative optimization or repair needed.
- Twenty compile processes total8.75wall/8.72CPU seconds, max197704KiB RSS; links/executions excluded from those costs. Whole run cgroup peak344125440B, max/OOM events0/swap0. Process RSS and cgroup charges have different accounting scopes; no new live-grant census was added.
- Every synchronous compiler/native child exited and was reaped; owned unit inactive/dead/MainPID0. Existing driver/request teardown completes on successful return. This CLI gate is not a new sanitizer or allocation/race proof; [exact-source focused ASan ownership](final_asan_6117723b.md) remains separately attributed.

| Exact size scope | Before | Candidate |
|---|---:|---:|
|Ordinary Linux x64 executable|2299216B|2299272B (+56)|
|46 Tower +9 generated runtime resources|8974935B|8974989B (+54)|
|Executable + required55 resources|11274151B|11274261B (+110)|
|Complete57 payloads, including LLVM license|No matching packaged baseline retained|11289402B|
|Platform directory including SHA256SUMS|Baseline is unbundled above|58 files/11295222B|
|Whole delivered archive expanded regular files / raw tar / gzip|No fabricated compressed baseline|211 files/13353457B /13527040B /2818813B|

- The complete delivery includes provenance/evidence outside platform payloads. Raw resource/ModuleID/path differences remain recorded. Linked system LLVM is128938904B and other dynamic requirements are listed separately; this is a development compiler, not a standalone portable release. New temporary object/executable outputs total495264B; no temporary compiler build or Wasm-capacity claim.
- ROOT's manifest identifies a separate symbol-validator policy repair outside the frozen candidate source; it is not silently included in this compiler identity. A2's39-binary/generation/package77 checks remain owner evidence, not rerun/counts claimed by this CLI check. ROOT owns candidate pin, clean default adoption and hosted release.
- Raw `C:/Sandbox/build/codex_ecs_20261122/L1/final_cli_r2/`: supplied manifest, commands,20 exit/timing/native-output/object-hash sets, original timing samples/ranges, package membership/modes,57 payload and1290 source checks, `summary.csv`, `sizes.csv`, cgroup/retirement records. Both arms, extraction and outputs in `/root/.cache/tower/l1_candidate_cli_r2/`;87GiB Windows/921GiB WSL free. Archive/toolchain/inputs/arms verified unchanged after execution; no source/test change, pin or deployment.
