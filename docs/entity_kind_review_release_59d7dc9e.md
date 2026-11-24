# Sparse kind layout review and joined59d artifacts

ROOT independently reviewed A1 implementation8471cf97 at published
`59d7dc9e995b16c785b01f40f340374dc4c73d18`, including its26 changed Tower
paths and the composed B2 child-storage boundary. No concrete defect found.
Exact blob/diff map: `C:/Sandbox/build/codex_ecs_20261122/ROOT_kind_review_59d7dc9e`.

Canonical kind identity stays its world-owned Entity. Immutable EntityLayout
uses stable checked raw storage in store.buffers, avoiding recursive registration.
Admission precedes pointer/flag publication; duplicate matching registration under
a view is allocation-free. Registered kinds cannot be leased; private nodes cannot
register. Component type references, queued holds and deferred view reclamation
preserve metadata through finalizers. Kind reclaim frees layout after components;
private-stage discard reads retained type metadata but does not own a layout.
Changed compiler_work/generic/module/frontend/LR/semantic callers preserve typed
Memory/Capacity errors and prior cleanup. Legacy bool/null/abort boundaries remain
fail-fast; this is not a redesign of every legacy error API.
Physical buffer pages include sparse slots once; the fault census also handles
unpooled owners and preserves the merged inline-child exclusion. Observer layout
page totals are a subset of descriptor pages, and40 indexed kinds is not all kinds.
New denial/retry/duplicate-under-view/self-kind controls are source-reviewed.
Owner seven CTests/query/resource/grammar/locality and full-reference large cmp
remain attributed execution evidence. Profile fingerprints are not full-byte diffs.
Isolated26.49MB peak savings and combined553344143B profile peak are different
boundaries; neither is added to earlier child/page savings or called race proof.

ROOT rebuilt all normal/LLVM/cross/shared artifacts with public768/no override,
WASI34/LLVM1e57, CPU8-15, build4/compiler1 and one cache owner. All phases exit0,
frozen input hashes match after each, no warning/error log matches.

| Phase | Wall s | CPU s | Peak RSS KiB |
| --- | ---: | ---: | ---: |
| Portable |52.89|79.77|1105956|
| LLVM/cross |83.97|147.55|1106432|
| Shared |46.38|71.26|1106436|

Immutable32-file bundle165218603B: `ROOT_browser_inputs_59d7dc9e`;
logs/source/artifact hashes: `ROOT_release_59d7dc9e`, both under the same Windows
evidence root. All32 transferred hashes verified on KinmenB; local originals retained.
These are build costs, not comparative throughput. Documentation profiling is inapplicable.
d962 complete entity_pages/T9/shared acceptance remains its own source boundary.
59d ownership/browser-generation/static-package adoption and native full generations
are running. D1's separate signed-fixture text-termination fix awaits L1 validation.
No public bootstrap pin/new hosted runtime/current instrumentation pass is claimed.
