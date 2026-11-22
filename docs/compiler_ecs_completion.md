# Compiler ECS and threading completion campaign

Started 2026-11-22 at the user's request. This is an acceptance and ownership
plan, not completion evidence. Read the current
[handoff](compiler_ecs_threading_handoff.md), [services](compiler-services.md),
and the journal's later type-value continuation before interpreting old gaps.
The initial tracked inventory contains 1,011 `.tower` files; inventory alone
does not constitute their requested full audit.

| Lane | Host | Primary production and audit ownership |
| --- | --- | --- |
| A1 | KinmenA | Semantic lifecycle, query continuations, module capture/effect proofs; semantic files except type/generic families. |
| A2 | KinmenA | Shared library ECS storage, work graph/pool, compiler kernel/work scheduling, access/lifetime and locality. |
| B1 | KinmenB | Parser/LR, grammar, syntax, parse/AST relationships, formatting and transformations. |
| B2 | KinmenB | Frontend units/modules, backend units, host/services, explicit worlds, immutable import/revision reuse. |
| L1 | Local | Interpreters, execution sessions/packages, Foundation graph and staged execution ownership. |
| L2 | Local | Type definitions/objects, semantic type/generic families, ordinary constructor dependency publication. |
| D1 | SteamDeck | Test/fixture/example/project audit, missing acceptance cases and deterministic reference coverage. |
| D2 | SteamDeck | Tower tools/measurement/build audit, bounded memory and measured iteration bottlenecks. |

Each lane has an isolated `main` clone named `tower-agent-N`, a separate cache,
and an external task/status/inbox directory. Shared interfaces and unit manifests
require owner coordination. Lane-specific regression tests remain with the
implementation owner; D1 coordinates generic harness changes. Newly discovered
or initially unassigned files must receive an owner. The coordinator reconciles
coverage against the complete tracked inventory and reruns it after integration.

Acceptance requires file-level review receipts, findings and disposition, rather
than an estimated migration percentage. Independent eligible work must have
explicit dependency/readiness, world ownership, access and cancellation contracts;
ordered grammar, effects, interning and publication may remain serialized with a
reason. Dense pointer indexes are not evidence of packed payloads. Every storage
choice must be assessed against its actual access/lifetime patterns.

Every implementation change requires equivalent frozen-input before/after wall,
CPU, peak memory and relevant allocation/retention evidence, checked outputs,
fast serial execution and useful parallel scaling. Representative small/large
body, parser, import/unit and staged workloads must expose scheduling overhead,
idle time and critical paths. Comparable C-like compilation is an objective to
measure fairly, not an asserted outcome.

The final integrated gates are deterministic canonical output and diagnostics,
reference/differential and round-trip checks, alias/cycle/stale/cancellation and
real-overlap stress, supported memory/UB/thread instrumentation, public-bootstrap
closure, native/browser/compiler-generation checks, and exact hosted verification.
Unsupported instrumentation is a remaining coverage gap, never a passing result;
tests cannot prove absence of races in all possible executions.

Workers commit and rebase independently. The coordinator serializes publication
leases so each worker can validate the merged frozen source, preserve concurrent
receipts, atomically push `main` plus a fast-forward Pages commit, and verify the
served result. Source and build identities must remain reachable from published
`main`. Documentation-only publications reuse verified runtime bytes and their
original build identity. Failed checks and logs remain visible.

Implementation belongs in `.tower` using supported language constructs and shared
services. New syntax follows publish-before-adoption. Stronghold remains the
future safe environment over these contracts, without changing Foundation's raw
storage semantics in this campaign. No unrelated formatting sweep or todo edits
are authorized by this plan.
