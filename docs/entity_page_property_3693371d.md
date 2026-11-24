# Seeded component-page reference regression

Source freeze `3693371d756bc715bba2d5301c0c7135ebb0a9ad`, tree `31be941d84c584ece69f285210bf104bf6eed622`; published A2 allocation-class buckets are included. No live draft or production source was changed.
Public/default compiler SHA256 `31a385c616b889987d68f8eb9714020f3928aac97591a1569f905ab706f52ed6`; no private override. KinmenB `tower_ecs_b1`, CPU0-11/24GiB, existing Release native cache, LLVM19, production allocation, build parallelism 2.
Only `scaffolding/tests/entity_page_property.tower` and its ordinary CMake fixture registration change executable test inputs. Existing concurrent-stage source and production dependencies match the freeze.
New fixture blob `b76362f11561bd1bb7c6ed416a3590a95f6e1166`, SHA256 `073d6a50939b1b0544b6746aaeb273039bc7dcc51aebcf1ea657caa0d7d1966b`; full source/binary hashes and depfiles are retained below.

The independent flat model stores expected membership, payload stamp/address and staged ownership per row/class; it never reads pool lists, buckets, free chains or slot membership.
Four classes include equal-size/different-kind payloads and two larger layouts. Dense capacities are measured from admitted pages: 64/64/64/51, so 65 rows cross every class boundary. Private stage policy 4 produces batches of 5 rows.
Each named seed fills the pages, makes full pages partial and re-adds, then performs two 260-action mixed add/remove/replace passes. Both stage publication and discard run each round, in seeded order; all surviving addresses remain checked after every mutation.
Public typed APIs are checked for successful creation/attachment/addition, absent removal Invalid, private-stage removal Busy, publication/discard and held-reference transfer.
Every verification compares all live payload values/tails, component presence/counts, untouched addresses, kind query/reference counts, target references, root containment and finalizer conservation against the flat model.
One per-seed denial warms a class's indexes, frees its only payload page, and reserves all remaining bytes of the original 8MiB cap. A new page must return Capacity without changing state or grants; releasing that temporary pressure permits retry at the same cap.
No physical allocator fault is claimed. The checked model itself uses budgeted work vectors; the deliberate pressure reservation is not physical heap residency.

|Seed|Checked operations|Payload lifetimes/finalizers|Retained bytes/grants before teardown|
|---|---:|---:|---:|
|1|1147|556|125738/99|
|314159|1150|557|125898/99|
|4294967291|1141|558|125834/99|

All 3438 operations/1671 payload lifetimes pass, including 3 Capacity refusals/retries and 6 publications/6 discards. Each trial ends with zero store entities/components, charged bytes, live grants and lanes, followed by successful disposal.
Charged peak is 8388608B for each seed because of intentional full-cap pressure; it must not be compared with RSS as physical page usage.
The unchanged `tower-entity-stage-concurrent-tests` passes its 160 two/four-thread outcome trials plus 4 stage-transition controls: 57792 finalizers, distinct real worker identities and simultaneous entry barrier, cancellation/drain/partial admission and final owner disposal. This is one existing concurrent control, not sequential fuzzing presented as race proof.
Original CTest registrations pass 2/2 with unchanged 30s guards; the final property executable also passes directly after adding only accounting output. Concurrent input/blob/binary equality reuses its completed result.
Property process validation: 0.01s wall, CPU below0.01s display precision,1664KiB peak RSS. Concurrent process reports 0.093947s CPU/3064KiB peak; CTest includes 0.14s wall/0.10s CPU/19632KiB wrapper high-water. Different memory scopes remain explicit.
Final property-only incremental build: 1.72s wall/1.20s CPU/252640KiB maximum descendant RSS; prior successful selected build 1.76/1.21/251456. Validation costs only: production performance is unchanged, with no speedup claim.
Five initial fixture compile failures are retained: reserved `token`, reserved `expected`, missing explicit work-vector type import, an incorrect stage-types import, and fixed-array foreach unsupported by the nominal collection protocol. Corrected identifiers/imports/derived counted iteration; no production error or assertion was bypassed.
An initial evidence-copy destination mistake is retained in `transport_note.txt`; explicit distinct destinations preserved the original logs. No failed runtime case, increased cap, skipped assertion or altered concurrent control.
Final property ELF SHA256 `1831c6a49f2564fc7cb332009e16a9b437c69576eb9c8f467a9d609e28aba057`; concurrent ELF `6636673b39b3f714d239731f9900390de3c62c738abaf3c77629d81dc2f2ec79`.
Raw commands, failed/passing logs, timing, source snapshots, binaries and depfiles: `build/ecs_b1/cache/page_property_3693371d/`; mirrored handoff `C:/Sandbox/build/codex_ecs_20261122/B1/page_property_3693371d/`.
Owned jobs drained; 96GiB free; protected todo unchanged. One cache, no other-owner file edits, parameter sweep, broad native/compiler/browser/generation/sanitizer/deployment operation.
This adds bounded reproducible reference coverage to current bucket storage. It does not establish exhaustive properties or thread safety; ROOT retains final integrated sanitizer/publication ownership.
