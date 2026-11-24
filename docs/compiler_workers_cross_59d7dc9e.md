# T6 compiler workers and T7 cross-target adoption at59d

L1, 2026-11-24: unchanged complete T6 **8/8** followed by unchanged complete T7 **7/7**, each in a fresh Node process.
Both actual exits0; failures/skips/cancelled registrations0, no unstarted test or guard hit. No production/test source edit or build.
Compiled source: `59d7dc9e995b16c785b01f40f340374dc4c73d18`, ROOT's immutable32-file bundle,165218603B.
Mounted host/tests/resources separately frozen at `80e87b34d4f65257ed9409e23ec164ba37c9a9be`; future SCC/parse changes are excluded.
All32 installed and ROOT-original hashes/lengths verified before/after; existing matching installation reused without overwriting it.
All1357 mounted Tower resources/host modules unchanged after drain. Prior cross outputs preserved before the existing tests rewrote them.
Portable SHA256: `01bf3381b75626eee78b03e9652d8ee62c400614997d29863267ef7cc01c05b1`.
LLVM SHA256: `95fc948adc9b5b9a36d90d6e9ccd22aeb9be40dc8ca8dd78410c58bfe505690c`.
Cross SHA256: `207e0f214dfa619e97a48d8bd5b49e6d3bf3c2a66729254b75dc4386b1681061`.
Project SHA256: `dc825b46478e1895168296139b19ae6e96a0e941703e6b98670f3b1cca40196d`.
T6 uses the bundled project/LLVM plus cross for vectorization; T7 eagerly loads cross, mounted language resources and matching target packs.
Portable/shared/support members were verified, not all executed by these selectors; old25 acceptance and edited generations are not substituted.

Windows11/AMD Ryzen9 5900HX, existing Node22.23.5 x64, CPU0–3, 24GiB Windows job cap, one owned test file at a time.
Commands: `node --test --test-concurrency=1 --test-reporter=tap playground/tests/compiler-workers.test.mjs`, then the same flags with `playground/tests/cross-compilation.test.mjs`.
Original300s outer guards,30s missing-receipt guard and120s per-target deadlines retained; no generic artifact override, cap or assertion change.
`TOWER_TEST_PHASES=1` and separate fresh artifact directories; actual child CPU/RSS captured through retained process handles, not parent-only accounting.
T6 preserves full serial/2/4-worker object-byte equality and publication order, real interval overlap/peak assertions, generic/staged world isolation and borrowed iteration.
Cancellation publishes no partial objects, awaits child exits and recovers; earlier source errors interrupt an irrelevant missing later receipt without hitting its guard.
Exact retained enum diagnostic: `tests/batch-a.tower: Enum values require a named member or an explicit conversion`; serial/parallel equality remains asserted.
Native dense-kernel vectorization and baseline-Wasm policy pass. All18 phase receipts,52 object files and6 IR files retained; expected negative calls6/11/12/13/14 remain explicit.
T7 covers Wasm, Windows x64, Linux x64/ARM64 and macOS x64/ARM64: format magic, allocation ABI/disassembly, full repeated binary equality, library objects and linked callers.
Wasm executes literal output `5\n84\n42\n4\n41\n42\n` and library caller `42\n`; missing-runtime failure, recovery and unknown-target diagnostic pass.
These existing equality/literal assertions ran unchanged; output hashes below are provenance, not replacement assertions.

| File | Wall s | Job CPU s | Actual test child / CPU s / peak RSS bytes |
| --- | ---: | ---: | --- |
| T6 | 23.586937 | 68.453125 | PID17820 /68.375 /662642688 |
| T7 | 3.664023 | 8.968750 | PID30532 /8.875 /353316864 |
Parent PIDs20100/8232 are accounted separately; T6's small conhost helper is identified by process name despite the generic raw child label.
Sampled aggregate RSS709812224/381165568B is a lower bound; job peak commit1072168960/415842304B is a different measure. Both jobs finish with active processes0.
Phase CPU/maxRSS has compile-call scope, distinct from these whole-file costs. No new throughput claim, separate Wasm-capacity/live-grant census or race-freedom claim.
PE/ELF/Mach-O emission/linking is not execution on Windows/Linux/macOS target machines. No shared/browser, T8/T9, generation, instrumentation or hosted/deployment selection ran.
Raw TAP, actual exits/accounting,32-file and1357-file manifests,18 phase receipts,52 objects,6 IR files and12 cross executables (88 output artifacts):
`C:/Sandbox/build/codex_ecs_20261122/L1/t6_t7_59d7dc9e_80e87b34/`; previous outputs also retained there. ROOT owns final integrated publication.

Integration: receiptb02483dc joined complete891ef268 in6f295488. Incoming SCC/provider and execution-fixture edits are outside the frozen80e87b34/59d acceptance; selected host/tests and all32 installed inputs remain identical. No later-source compiler adoption or runtime rerun is claimed.
