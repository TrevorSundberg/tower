# Independent constructor-error and component-property review

Freeze `fca5df987eee9d272d75bbe23659bf102054ba00`, tree `cb518fbb6c5d5b77917066dd557533977d413481`; published files only, no B1 working tree.
Constructor implementation `3f1e515f`/publication `ad0b5e67` and property implementation `2bd4bed67`/publication `58307a16` are ancestors; the reviewed changed files match those implementations exactly.
Disposition: no concrete producer or test/oracle defect found in this scope; no executable input changed and no redundant runtime suite run.

| Reviewed primary path | Exact Git blob |
|---|---|
| `scaffolding/library/compiler_work.tower` | `63c1aadfd3f508e16d20f329cca829e0bbcca6e5` |
| `scaffolding/tests/work_constructor_faults.tower` | `7a416bcd777de6fc983a4739306bd265a2920673` |
| `scaffolding/tests/entity_page_property.tower` | `b76362f11561bd1bb7c6ed416a3590a95f6e1166` |
| `cmake/TowerWorkTests.cmake` | `f4e7bfb451373a4f2434952f8fe460ca1f60c222` |
| `cmake/TowerWorkPolicyTests.cmake` | `0e3ad3d63b76a0f9052a2936ca15b95c1a522490` |

`compiler_work_create_result:60–126` captures each checked entity result before cleanup; failed owner creation cannot proceed to kind creation, and failed unit creation cannot reach attachment/components.
`entity_attach_result:794` completes reservations before transferring containment. Releasing the constructor's local node reference therefore frees a failed unattached node, or leaves the successful parent's reference live for component attachment; no dangling-node use follows failure.
Store/kind/component failures keep their own result; zero task/join handles stop before further graph calls. `work_resource:185` preserves the first typed buffer error; the helper snapshots it before `work_dispose` clears the graph, falling back to Invalid only without a resource cause. No shared EntityStore/global latch is consulted.
`compiler_work_close:32` disposes graph, owner subtree, kind and empty store, then copies the enclosing allocation receipt before freeing it. Output is assigned only after complete construction; lifecycle-zero unit payloads cannot invoke an unexpected finalizer.
Invalid remains malformed/overflow/shape admission, Capacity remains initialized-cap/remaining-byte denial, and Memory remains physical allocation failure, traced through work graph/buffer/budget and entity result APIs.
The original eight-unit fault trial remains. The added trial reads the valid back-pointer of a live Entity payload and copies its real page capacity before closing the probe; owner + kind + that many unit descriptors necessarily cross a page boundary without a layout constant.
Each bounded 512-attempt sweep restores injection before teardown, requires exact Memory/null output on failure and stops at first success, checking physical buffer baseline and zero charged bytes/live grants/lanes. It does not claim that all 512 attempts execute.

The property oracle is a flat row × kind matrix of expected presence, stamp and initially admitted address, independent of buckets, free-slot chains or actual page membership. Producer geometry selects inputs only, never expected values or success codes.
Three literal seeds use wrapping u64 recurrence/high 32 bits; the sequence is reproducible for the same source/profile/geometry. Four nominal kinds include equal-layout distinct identities plus two larger payloads. Measured maximum capacity + 1 rows crosses every dense class; staged batches likewise exceed their actual capacity.
Add/remove/replace results are checked before model transitions. Existing adds preserve the prior model/value; absent removal must be Invalid. The verifier checks every surviving address/value/tail, membership/count, kind index/reference count, target references, root containment and finalizer conservation after mutations.
Temporary cell pointers never span model-vector growth. The two mixed rounds have explicit finite bounds; both publish and discard run each round regardless of seeded order. Fixed arrays use supported derived counted iteration, with small named operations rather than a second allocator implementation.
Staged payload references are queued and held before validation. Publication transfers the stage's row reference into containment without another retain; discard finalizers release only held payload ownership. Stage destruction precedes resetting the handle; discarded row pointers are never dereferenced afterward, and published rows are detached before model truncation.
The pressure control warms then retires one class page, reserves the original ledger's remaining bytes, requires null/Capacity with unchanged grants and logical state, releases pressure, and retries successfully at the same cap. It tests budget denial, not physical allocator failure or reference-counter exhaustion.
Root release must finalize every admitted lifetime and leave the target at one reference; subsequent target/kind/store/model disposal checks zero entities/components/bytes/grants/lanes. No owned counter is zeroed to satisfy these assertions; the 8MiB charged peak includes synthetic pressure and is not RSS.
One new ordinary Linux-x64 CTest (`tower-entity-page-property-tests`, 30s, no skip/pass-regex override) uses the existing production runtime; trap maps to exit1. Constructor faults remain a separate 30s serial fault-allocator target. Existing registrations are preserved, with no duplicate property entry.

B1-attributed [constructor evidence](work_constructor_results_b478b68c.md): original cap3360 wanted Capacity/actual Memory failure retained; five corrected caps, 18 malformed calls, two fault sweeps, serial/four admission and checked42 controls pass. Matched n1 serial/four wall1.28→1.26/.62→.62s is not a speedup claim.
B1-attributed [property evidence](entity_page_property_3693371d.md): 3438 operations/1671 finalizers, three denial/retries, six publications/six discards; dense64/64/64/51 and stage4 capacities. Property .01s wall/<.01s CPU/1664KiB RSS; prior five fixture compile failures remain failures in its receipt.
The separate unchanged concurrent fixture checks distinct worker identities and an entry/release barrier for 160 two/four-worker trials plus four transfer controls (57792 finalizers); its .093947s CPU/3064KiB RSS is owner evidence, not D2 execution or sequential-property race proof.
Raw freeze, both patches and 24 exact source/recipe/receipt blobs: `build/d2_ecs/constructor_property_peer_fca5df98/{freeze.txt,constructor.patch,property.patch,blobs.txt,paths.txt}`. Necessary callees include entities/stage, graph/buffer/budget/vector, allocator/trap and existing runtime recipes; no full storage re-audit.
Source-only review: runtime wall/CPU/RSS profiling inapplicable; no build, heavy lock, sanitizer, browser/generation/deployment or performance claim. ROOT and active owners retain integrated adoption; later changes are outside this freeze. Todo preserved; no external blocker.
