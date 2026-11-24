# Independent ROOT review of the eight-bucket page index

Source review at `3e29944ba5`; no introduced defect found in the inspected delta.
This is independent source evidence, not a rerun of owner performance or sanitizers.

| Reviewed path | Git blob |
| --- | --- |
| scaffolding/compiler/world.tower | 58bc2e726bf4438e48d070504960898fe3f7717a |
| scaffolding/library/entities.tower | 97207c86e8670ed4ce20037246dbb8a78c8665ac |
| scaffolding/library/entity_types.tower | 594b3c7ff1627396baf4369f167173d5cc92ab90 |
| scaffolding/tests/entity_page_reuse.tower | 81f5fab4963164b297d825e3c3dd6f3b886e93a6 |

Bucket selection uses stable type identity and stride, followed by exact collision
comparison. Attachment and detachment use the same key. The per-class list order
is preserved without hit promotion; full pages are absent from partial lists.
Transfer traverses the complete owned chain and detaches private bucket links
before destroying private pools. Last-live release removes both links before
freeing the page. Payload addresses remain stable.

Store/stage charges derive from actual sizes. World disposal checks all physically
owned component pages, which is stronger than checking only a partial-page head.
The repository search found no surviving old storage/buffers/pool.first consumer;
the partial-page IDE census visits all bucket heads.

The focused fixture checks collisions, full/partial transitions, exhaustion of
already paid slots, transfers and final ownership. Its bucket-aware assertions
are not an independent flat model; B1 subsequently supplied that distinct model
and its [ordinary/peer](constructor_property_peer_fca5df98.md) and
[ASan](entity_page_property_asan_c9a639b0.md) evidence. Their execution remains
attributed to those owners.

The [owner measurement](entity_page_buckets_c8555971.md) records reduced search
and the small-four tradeoff at its own freeze. The [joined measurement](compiler_combined_performance_73cc82ab.md)
does not add separately measured gains. Neither review nor pointer-column indexing
establishes packed payload SoA or universal race freedom. No source changes or
new runtime/profile operations were necessary for this review.
