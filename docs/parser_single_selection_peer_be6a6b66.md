# Independent single-selection scanner review

ROOT reviewed A1's2b39093c delta after importing completebe6a6b66 history.
No concrete defect found; review is source-only, without another runtime matrix.
Production syntax_scan blob `09d97401af460a7d31106f0144c2197242ac7526`;
fixture `6d3e0a3fc47ae42bcc593ffbfe34138fd4837281`;
frontend_session_scan `77e863af8b375fcba5d4a98a62a08f7e78f28922`;
lr_work test provider `9048c0283a1b9be9fb3ff165c270109f4a78b338`;
joined frontend_main `d757e157d87d03c263bee6658e7bfec04fda1828`.
Necessary callees: syntax_lexer `858b10f7536d289361c1e40596aeb051dc9f2fe1`
and syntax_highlights `4129968e7c5a63052bcaa0eaba22a159b800b9b4`.

scan_skip_choice returns true only after ordinary lexicon_choose has initialized
the complete stack-local choice at the current cursor. Consumption occurs before
any grammar/LR-state transition. No retained cache, heap allocation, shared owner
or cross-call lifetime is introduced. Trivia highlights happen before the final
selection; the production callback appends highlight records without changing the
lexicon/runtime. Its existing fatal allocation policy is unchanged.
EOF returns before reading an uninitialized choice. Declaration/bootstrap paths
return false and perform ordinary selection afterward. An unmatched choice retains
the same UTF8/error fallback. Replacement captures do not consume the saved choice;
their node ownership and error disposal remain on the original path. Checks count
actual contextual lookups, so avoiding a repeated lookup legitimately reduces them.

The18 token/node controls use three trivia inputs and three modes. The split
skip/choose reference shares the lexer, so it is not an independent lexer proof;
literal alpha length, exact spans/end, node metadata and expected lookup counts
also constrain the result. Existing grammar-equivalence/resource/reuse controls
retain override, malformed-rule, capture and lifetime coverage at owner identities.
[Owner measurement](parser_single_selection_d62d1333.md): n2 single4096 wall gains
4.25% serial/3.52% four; small serial1.54%, small-four0.92% slower. Complete canonical
and independent CLI object/output comparisons pass; retained bytes/grants match.
These are pre-SCC paired measurements, with separate merged checks, not combined
current-source scaling or a new Wasm/hosted claim.

KinmenA's normal push exhausted retries with GitHub DNS failures. ROOT transferred
Git bundle SHA256 `e80ec306798f32ace55b1451387a654927383cc75208eb5cc6983d9796b5cc73`,
verified all four prerequisites and preserved every commit throughbe6a6b66. ROOT
merged the independent lowering-rejection receipt and atomically publishede3958206
with unchanged Pages6f142bef; hosted manifest identity was verified at01:03:31UTC.
No force push, lost work, compiler rerun or service-policy workaround occurred.
The source-bound historical DNS blocker is resolved by this publication receipt.
Documentation-only review has no runtime profiling requirement; later integrated
artifacts and blocked final instrumentation/verifier requirements remain separate.
