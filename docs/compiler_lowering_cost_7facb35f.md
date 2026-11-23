# Lowering cost experiment: candidate rejected

B2 froze published `7facb35f0b3b63c57cb046523cc27af41816b3df`. One candidate
was implemented and checked: skip scratch-owner lookup in `sem_push_checked`
when the vector already has capacity. It improved large end-to-end compilation,
but did not establish a serial lowering improvement or small-control neutrality.
The candidate and temporary probes are preserved as artifacts and removed from
production source. This receipt ships no runtime change and claims no deployed
speedup. The accepted body/discovery/grain/generation evidence remains intact.

## Cost attribution and candidate

Source review: `semantic_lowering_kernel` snapshots a private context and scratch,
creates a function-ordinal prefix, transforms the body/signature, validates defer
depth, captures its result and disposes scratch. `sem_control_names` builds one
frozen hash table; `sem_find` already probes that hash index. A new reserved-name
index would duplicate existing work. `WorkArena` already has a private bump path;
only physical chunk/list growth acquires checked budget storage. There is no
justification here for another pool or uncharged allocation cache.

Temporary Tower probes used the existing world observer, private dispatch-ordinal
slots and post-join collection. They separated setup, prefix, transformation,
defer validation, disposal, naming, scratch allocation and list ownership/growth.
They performed no shared counter writes. Fine timing is intrusive: hundreds of
thousands of clock callbacks inflate transformation CPU substantially. Counts
identify work; final uninstrumented samples decide acceptance. Inclusive nested
phase times must not be added or treated as uninstrumented percentages.

For the unchanged4096-body dependency fixture, both widths perform4105 lowering
kernels,135194 generated-node operations,49165 generated-name calls,135237
scratch requests (3815284 requested bytes) and20500 list-growth operations.
The fixture is scalar-heavy; these are not representative aggregate/defer cost
measurements. Aggregate, alias and defer correctness are covered by the existing
body/query controls. Logical scratch requests are not physical malloc counts.

Fine-probe CPU totals at1/4 workers: setup2.01/2.23ms, prefix13.55/15.89ms,
disposal2.14/4.23ms. Naming122.28/131.26ms includes nested allocation/probe cost;
scratch allocation58.02/62.95ms and list growth9.43/14.64ms likewise include
observation overhead. Neither a repeated linear reserved-name scan nor context
construction explains the whole parallel amplification. The separate lifecycle
publication boundary remains negligible; total semantic stage publication is
about90ms in the existing coarse observer.

The concrete avoidable operation was372866 ownership searches, traversing
5159921/5168708 scratch-index nodes. Every append searched the private/borrowed
arena owners even when no buffer growth was required. The candidate moved this
existing-capacity operation ahead of the ownership search, after the original
error/null/overflow guards. Growth retained the same owner, checked reservation,
stable storage and error propagation. No alias or lease permission was inferred
from capacity. Searches fell to45086, with478212/475981 probes: about91% fewer
probes. Scratch request/growth counts stayed unchanged.

## Final acceptance samples

KinmenB, Docker CPU12–23/quota12/24GiB, six physical cores/twelve SMT lanes,
Linux x64, LLVM19.1.1, Release owned `/cache/native`, compiler jobs1/build jobs6.
Public bootstrap SHA256
`768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138`.
No sibling-cache overlap. This is partition evidence, not whole-host acceptance.

The existing generator supplies one unit with16 or4096 independent loop bodies
using `decltype`, plus imported type/comptime/generic/untaken-dependency controls.
Width8, identical input/resource bytes and flags, fresh worlds/warm filesystem,
one warmup and three counterbalanced paired samples. Timed compilation excludes
post-join reference execution, formatting and artifact writing. All observations
were off. Temporary fine probes were removed before these final samples.

Median wall/CPU seconds and peak RSS MiB:

| Bodies | Workers | Before wall/CPU/RSS | Candidate wall/CPU/RSS |
| --- | --- | --- | --- |
|16|1|0.444 /0.404 /172.7|0.451 /0.411 /172.7|
|16|4|0.530 /0.540 /175.3|0.538 /0.547 /175.8|
|4096|1|2.177 /2.130 /817.7|2.081 /2.042 /818.3|
|4096|4|2.038 /2.758 /819.4|2.013 /2.712 /819.7|

Large wall medians improve4.4%/1.2%, CPU4.1%/1.7%. Small wall medians increase
1.7%/1.3%. Small serial ranges overlap (before441–451ms, candidate446–456ms);
three samples do not establish statistical significance. Nevertheless both the
initial instrumented-capable comparison and the final clean comparison show
higher small-control medians, so small-path neutrality is unproven. Large serial
before samples span2.110–2.383s; candidate2.073–2.098s. All samples are retained.

Separate coarse lowering traces at1/4 workers: frontier339/391ms before,
339/366ms candidate; summed kernel CPU112/357ms before,120/327ms candidate.
Actual lowering peak remains1/4. Thus four-worker lowering still consumes about
2.7x serial kernel CPU, and this trace does not demonstrate a serial kernel gain.
Body-pipeline time527/328ms becomes500/326ms: some end-to-end gain occurs outside
the requested lowering kernel because the helper is shared. Admission, dispatch
width, grammar order and stage publication policy never changed.

Decision: reject this candidate against the requested combined small/large and
fast-serial acceptance; do not add a threshold or start another tuning round.
It removes real repeated work, but that is insufficient evidence for this narrow
lowering optimization. The unresolved producer is generated-node transformation
and its staged allocation/component access. Further attribution should distinguish
`sem_control_node`/`entity_stage_create_result`/component attachment costs from
allocator/budget contention. No particular contended lock is established here.

## Correctness, memory, failures and provenance

PASS: final candidate source/canonical bytes equal before/after and workers1/4.
Complete optimized x86_64-pc-linux-gnu objects match before/diagnostic-candidate
at1/4; the clean candidate's worker4 object matches that same reference. The
independent public-built/Clang-linked reference checks answer42 and body_0(36)=42.
Body smoke (aggregate/alias/defer and ordered errors/cycles) and backend IR pass
with the diagnostic candidate; the clean candidate additionally reruns query
smoke, nested admission/cancellation and focused scratch identity/allocation/
capacity faults. New temporary assertions retained existing
physical charges through borrowed-parent appends/join and forbade appending even
within capacity after a terminal error. The serial fault allocator is distinct
from real production-worker measurements and is not sanitizer evidence.

Retained bytes match exactly: small20280585/20277761 and large614414014/614411190
at1/4. Peak charged bytes remain about109.6MB/712.7MB, below1.25GiB, with10/20MiB
ledger storage separately. No byte saturation or physical-charge removal. Process
RSS includes allocator/LLVM/threads outside these charges. Total allocation-call
counts and a particular contention source remain unmeasured.

The first storage build found its existing target disabled; enabling
`TOWER_STORAGE_TESTS` in the owned cache recovered it, and only `scratch` was run.
An initial Windows-encoded reverse patch failed its dry check without modifying
source; the original-byte patch restored it successfully. Both artifacts/logs
remain. Production sources were restored and the owned targets rebuilt, preventing
the rejected binary from silently remaining the cache's current compiler profile.
The restored profile executable is byte-identical to the original before binary.

Evidence directory: `C:\Sandbox\build\codex_ecs_20261122\B2\lowering_7facb35f`,
with `/cache/b2_lowering_*` originals. It contains the candidate and fine-observer
patches, exact generated inputs, complete canonical/object outputs, commands,
hashes, binaries, intermediate/final samples and all failure/check/build logs.
Before executable SHA256:
`6db91eccec25334d0ddcf80699e88d96661d5dc41c966deb3935eff16c647dfc`.
Rejected final candidate:
`6dfeb2dcb1ab05df999c28362a5ad6d2607f1df8c8820719b061db8dd1fef154`.
No new syntax, public pin, runtime publication or integrated acceptance is claimed.
Full later-source/platform/browser/generation/sanitizer acceptance remains ROOT's.

Publication reconciliation preserves incoming5b9194e4 history. Only this receipt and
the journal differ from incoming main. Later semantic-statements/imported-alias
and other owner changes are not validated by the frozen7facb35f measurements;
the restored cache is explicitly that older measured source. No new runtime
build or deployment is claimed for the documentation-only reconciliation.
