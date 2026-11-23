# B2 independent review of D2's C fixture split

Reviewed source `7c8292875e41ab52a8410206c31d86b2e948e310`; implementation
`31bd0359f2689262d1d2c249e83bcd27e0c8fc62`, published through `70e77b60`.
**Accepted both remaining Tower paths; no concrete defect or code change found.**
This is independent source review, not a new runtime pass or C registration review.

| Path under scaffolding/tests | Exact unchanged Git blob |
| --- | --- |
| backend_void_returns_direct.tower | `2888e1865ea1c72ae685cc32c29e51591bb19ae6` |
| driver_differentials.tower | `2999eca92057c4bb241d485e98b1789cd4de9318` |
| backend_void_returns.tower (original reference) | `aede21168312abf95b10941e24c59376941e403d` |

The direct fixture retains exported/local `void*` forwarding, `void**` returns,
null/non-null identity, true-void notification and aliased load/store `42 -> 7`.
Independent effect arithmetic is two opaque calls + two depth calls + notify:
`2 + 20 + 100 = 122`; callback coverage adds one opaque call for `123`.
Its u32 effects stay representable; i32 failure codes1-6 are not unsigned sentinels.
Typed allocation supplies u32 storage; bits casts preserve pointer representation.
The void** borrows a live local slot; no pointer escapes or survives its owner.
Every post-allocation return frees through defer before the outer failure trap;
success prints exactly `0\n`. Shared wrong nonzero output cannot pass by agreement.

The original fixture is byte-identical: callback-valued return and indirect apply
remain LLVM coverage. The only differential-driver change adds its file with
mandatory graph oracle `0\n`, then raw/optimized native status/stdout equality.
File bytes/import are copied intact. Native-only selection is explicit; unmatched
filters fail `checks != 0`. Existing package/32/64, conversion, signed-min/max,
unsigned wrapping, division traps and pointer cases are unchanged, not skipped.
Native success comparisons omit stderr intentionally; package failure/dependency
paths retain exact diagnostics. Signed i64 statuses preserve signals/transport errors.
driver_check exits1; POSIX child alarm30s/waitpid and Windows timeout/drain remain.
Capture restores/closes descriptors; lexical buffers/arguments/results dispose.
Artifacts remain for diagnosis. Hard exit uses process cleanup, not a zero-owner census.

Read callers/registration in driver, driver_c_cases/validation, execution_rejection
and TowerDriver.cmake. C collection still rejects function values/indirect calls;
the registered negative emitter test retains exact diagnostic and checked input.
D1's C registration review stands; direct C16 and full callback LLVM2 are distinct.
Attributed D2 published evidence: merged C16/16, LLVM2/2; wall/CPU/RSSKiB
13.90/13.39/182800 and6.30/6.12/182916. Original unsupported-C exit1 remains FAILED.
Commands, artifacts and identities: journal's 2026-11-23 D2 direct-C entry and
`build/d2_ecs/void_return_c_ea606d32`; no B2 rerun/build/profile or wider-platform claim.
Review-only runtime profiling is inapplicable; later unrelated producers are excluded.
