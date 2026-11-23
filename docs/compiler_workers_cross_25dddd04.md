# T6 compiler workers and T7 cross-target acceptance

The unchanged complete worker file passed **8/8** registrations; the unchanged
cross-target file then passed **7/7**. Each ran in its own fresh Node process with
actual exit0, no skips, failures, cancellations or unstarted registrations. No
compiler/reactor build, production edit or wider matrix was performed.

Compiled source is `25dddd0420258bc5174a3039293c447fd60ef367`, from ROOT's immutable
32-file `ROOT_browser_inputs_25dddd04` bundle. Mounted host/tests are separately
frozen at `0fe314efe1b8d740a1be3fa829124e92d2cf1f6c`. The reactors exclude A2's later
`125efb11` module-body repair even though the mounted registry includes that source.
This receipt does not relabel the reactors as current-main compiler binaries.

| Bundle member | SHA256 |
| --- | --- |
| Portable | `35379f42d09a199c1f2ff83327b861fcc50f65d0c70f57006ba5065adfd773fb` |
| LLVM | `c1280ba15b9d529acf45f5165d83e47b7f233b2273a982767ec80ab87e63ecfa` |
| Cross | `2be6f98bfa84742aa8e1a4c498a45c2a8bc415e350d300b634c91a448e9565a2` |
| Compiler project | `b2f9154b233f1c4fcf6f1197c9a0b86161c6c12efb5e34a63ac04f6c55fc9e01` |

All32 manifest byte counts/hashes were checked before copying their `build/` paths
into L1's ignored defaults and again after testing, including ROOT's originals.
No prior destination files existed; the preservation manifest records zero
replacements. ROOT's snapshot/cache was untouched. T6 receives the LLVM module
and frozen project resources in each worker; its vectorization case loads cross.
T7 eagerly loads cross and matching target packs, using mounted language/fixture
resources. Portable/shared/support members were verified and installed, not all
executed by these two selectors. Generic artifact environment overrides were absent.

Windows11 build26200, Ryzen9 5900HX, existing Node22.23.5 x64, CPU0-3. Exact commands
from the clone root, each with a finite300-second outer guard and unchanged internal
deadlines, `TOWER_TEST_PHASES=1` and a fresh `TOWER_TEST_ARTIFACTS` directory:

```text
node --test --test-concurrency=1 --test-reporter=tap playground/tests/compiler-workers.test.mjs
node --test --test-concurrency=1 --test-reporter=tap playground/tests/cross-compilation.test.mjs
```

T6 retains serial/2/4-worker object-byte equality, publication order, real interval
overlap and peak4, generic/staged world isolation, cancellation/child exits and
recovery, source-first diagnostics with no partial objects, interruption when a
later receipt never arrives, native vectorization versus baseline Wasm, and borrowed
iteration. Its18 phase records plus object/IR outputs are preserved. Work handles
and pools close through the existing finally paths; no owned Node jobs remain.

T7 covers Wasm, Windows x64, Linux x64/ARM64 and macOS x64/ARM64, exact format magic,
allocation ABI/disassembly, repeat-byte identity, library objects and linked callers.
Wasm executes reference output `5/84/42/4/41/42` and the library caller42. The seventh
case preserves missing-runtime linker error, successful recovery and unknown-target
diagnostic. PE/ELF/Mach-O emission/linking is not execution on those native hosts.

| Checked run | Wall s | Observed process-tree CPU s | Node test-child peak KiB |
| --- | ---: | ---: | ---: |
| T6, 8 registrations | 26.990 | 83.063 | 684600 |
| T7, 7 registrations | 3.489 | 8.734 | 346544 |

The Windows wrapper retained handles for the Node parent and actual test child;
worker-thread CPU belongs to that child (82.891s/8.641s). Tree CPU also includes the
small conhost helper, identified by command despite its generic child label in raw
metrics. Sampled summed working-set peaks727724/376336KiB are lower bounds, not
exact aggregate RSS peaks. Phase JSON CPU/RSS has separate compileUnits scope and
is not substituted for whole-file cost. These are validation costs, not speedup or
scaling claims; production is unchanged.

The first T6 attempt completed8/8 assertions, but its PowerShell receipt writer
failed summing dictionary metrics before persisting Node's actual exit. Its TAP,
phase artifacts and wrapper failure are retained. T7 stayed unstarted. Only the
receipt wrapper was corrected; T6 was repeated once with fresh outputs, capturing
exit0 before serialization, then T7 ran once. No test assertion/source was changed.

Evidence is external at `L1/logs/t6_t7_25dddd04`: manifest/source identities,
`t6_checked`/`t7` TAP/actual exits/process metrics, original failure,18 checked
phase receipts,52 objects,6 IR files and12 cross executables (88 files including
phase receipts). All1332 mounted input hashes matched after execution.
Mounted manifest SHA256 `b0ce15337e4a112226f9260aaa73e2395fdd53d4fe1491cc97809d0887de32f3`;
bundle manifest `07fc9d08a413e0e0a9a15af2ce9797f78df4788a218ab16e91aa03f1a5b32b87`;
output manifest `2cabf84af158bcb024b44ef819142ab29f27614417c5b99638e3e249e595bc4d`.
Historical eac/b797/c95 receipts remain separate. ROOT owns final integrated release.
