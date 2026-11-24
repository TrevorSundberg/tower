# Independent fixture adoption and current generation evidence

ROOT source review, 2026-11-24. No production Tower edit or runtime rerun.

D2's d6f7031d closes the two durable constant-address test gaps recorded in
the earlier independent review: actual LLVM subtraction presence, and execution
of reconstructed output through registered producer prerequisites.
Reviewed blobs: backend_source_native `63575bd8346f70a3d784388f9640a311fb4a3369`,
BackendSource CMake `361c0549c81ed5bceb7cdf041a406841212b04eb`, Execution CMake
`de823b79a82c4b8a120af1c69d1e8fe48b666b2c`, test README
`3af23c8a8318021e84b5cef07784018dbee9ac19`.

Each width/worker import has a private output directory; matching fixture setup
is required even when selecting only an execution consumer. Failed setup cannot
pass dependent checks. Both width-specific equality checks require both producers;
read-only consumers may run concurrently after successful setup. Deferred native
execution registration preserves target configuration order. The actual-IR sub
guard supplements add/ptrtoint; the grouped constant-fold negative preserves the
arithmetic answer while independently exercising the missing-sub assertion.
No concrete defect found. Owner evidence remains attributed: 10 focused checks,
two standalone prerequisite checks, 16 Graph/Fast configurations plus four
standalone, eight prior rejection controls, ordinary zero owners. Deliberate
SIGABRT/134 proves the guard, not cleanup after abort. No ROOT execution repeated.

[L1's signed fixture and edited-generation receipt](signed_finish_browser_generations_59d7dc9e.md)
closes D1's a80a766f runtime gap: both widths pass, missing finalization rejects
before strlen, exact restored binary and both tests pass again. Both actual
edited browser generations use the predecessor, retain the changed diagnostic,
match all 24 objects/three reactors and drain all six workers. Recorded actual
Node cost is 168.070s wall, 471.391s CPU and 2,133,852,160B peak working set.

ROOT independently reviewed the required OS artifact-retention boundary in
compiler-build `155d2b60db0b3c196a693385861dcd40b800537d` and generation script
`d3315a53f4a6d81466ce8f3f635db207f9fc5738`: compileUnits joins/closes before
linking, optional onReactor awaits file retention before validation, errors
propagate, and candidate checks precede adoption. Default callback does no I/O.
Worker records count actual exits, and candidate execution handles close in
finally. No candidate acceptance or target checks are removed. This is narrow
source review, not injected callback-failure testing or a new performance claim.
The 8771 static package predates this host-only retention callback; it is not
silently relabeled as containing that later source.

ROOT changed documentation only; runtime profiling/memory testing is inapplicable.
Current native package/pin, final hosted release and service-blocked supported
instrumentation/local deployment verification remain separate open requirements.
