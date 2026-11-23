# Reuse completed lifecycle registration

Kept: reuse the existing `LifecycleLowered` graph admission receipt in
`sem_lower_register`. `sem_phase_begin` registers both producer sets before
creating that join for the frozen ordinary functions. Later bounded waves need
readiness checks, not another full signature/registration scan. Standalone pumps
keep scanning newly available bodies. No new cache, scheduler or mutable worker
metadata; leases, source order, private scratch and publication are unchanged.

Freeze `68345ada29308dfe8334693f6178c6105dde3936`, tree
`167281ed96f2a8406d5504992db4d20aa18fa210`; only the five-line guard differs.
Before ELF SHA256 `76728e7b583e8ecb386ad4753739dd40fa3a8c339ce801d2a38f9bc1a72354d0`;
candidate `ccaeaccff251067824aba6c55a62cd58f8434b8c881d9396534d0af70edaeeda`.
Public768 bootstrap, existing Release native cache, WSL Orchestral-Revng,
CPU4–7, one process at a time, production allocator, unchanged1.25GiB unit
budget. Frozen resources are separate from compiled providers. Dependency-aware
baseline refresh8 actions/17.18s; candidate semantic provider+two links3/32.15s.

Existing uniform16/4096 dependency inputs and full Foundation bytes retain the
hashes in the joined cabc2062 receipt. Sixteen counterbalanced timed runs (n2 per
shape/width/binary), no warmup/discarded samples. Frontend wall/CPU seconds and
process high-water MiB through compilation, before → candidate:

|Bodies/workers|Wall|CPU|Peak MiB|
|---|---:|---:|---:|
|16/1|0.6634 → 0.6791|0.5468 → 0.5645|161.54 → 161.54|
|16/4|0.7168 → 0.6981|0.6419 → 0.6312|165.64 → 165.26|
|4096/1|2.9251 → 2.5943|2.7908 → 2.5080|717.18 → 717.13|
|4096/4|2.4318 → 2.3388|3.0701 → 2.9710|723.03 → 723.27|

Separate coarse samples (one per shape/worker/binary) measure lowering serial/four
wall371.93/412.84 →329.29/326.45ms, coordinator CPU370.74/393.96 →331.08/313.38ms.
Small lowering0.44/0.48 →0.48/0.52ms. Small serial whole-frontend midpoint rises
2.36% (paired +26.6/+4.7ms); small neutrality is not statistically established.
Large sampled wall improves11.31%/3.82%; these shared-host n2 results are not a
universal speedup claim. Phase timings are inclusive and not additive. The large
lowering improvement supports this bounded removal; the small phase increase
is0.04ms, with overlapping total sample ranges and no material memory change.
Whole-process wall/CPU midpoints (format/check/write/teardown included): small1
0.710/0.570 →0.725/0.590s; small4 0.765/0.670 →0.745/0.655s; large1
3.265/3.090 →2.940/2.810s; large4 2.780/3.385 →2.690/3.280s.

All24 timed/coarse runs exit0: full source/canonical bytes match across binaries
and workers; existing independent answer42/body_0(36)=42 checks pass. Real
semantic dispatch records four distinct threads/peak4,312 waves,4105 lowering
jobs, unchanged. Retained bytes small1/4=18,325,751/18,322,927 and
large1/4=521,374,245/521,371,421 exactly match; joined lanes0. Live returned-program
grants17,119/17,120 and432,301/432,302 are released by the checked close path:
world disposal and budget disposal succeed after drain (zero live grants),
not a new total-allocation census. Charged peaks98.3/603.7MB; ledger10/40MiB
separate. ELF size unchanged2,341,664B. No allocation instrumentation used.
Query/type/control-smoke all exit0:3.31/167.29/37.44s, CPU3.76/153.87/32.98s,
peak348060/338192/248520KiB. Type/control selectors include body continuation
and canonical reparse; query includes lifecycle admission, cancellation, failure
ordering and required/optional staging. Do not run body-smoke again. Their
shared body fixture is intrinsic selector overlap, not additional unique cases.
No runtime/test failure; initial read-only path/WSL quoting errors are retained
in turn history and corrected. No previous failed optimization was restored.
Useful-core completion, current browser/generations and sanitizer/release gates
remain ROOT-owned; no8-worker expansion, importer edit or deployment.
Raw binaries, patches, immutable resources, commands, full outputs, every time/log
and source manifests: `C:/Sandbox/build/codex_ecs_20261122/L2/lowering_prepare_68345ada`.

Publication: implementation `b3caffd3`, complete-history merge `c164429e` adopts
`26f99a40`. Incoming changes are browser abort handling, shared codec and peer receipts;
all selected native providers, callers, registrations and resources are unchanged.
Reuse the exact checked binary and evidence; unimported codec/browser fixtures are excluded,
not relabeled tested. Original and frozen-input hashes reverify; owned work drained.
