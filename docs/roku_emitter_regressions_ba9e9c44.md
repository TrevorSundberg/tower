# Playground Roku emitter regression migration

Host 1 tested public source `ba9e9c442af3ef945a4a8d477a2175233f95114f` for assignment `6a7d3731-b716-4558-8ebe-d5769f352aed`. Pages `8417c9ae4cd9accdf672b22d6676bd465c8a79d6` supplied the portable frontend, shared frontend and LLVM reactor. Its deployment manifest identifies `0da4e5137453044c9fff9eba262537608de31b6f` as their build source. The packet records the compressed LLVM digest and the executable digest separately. The initial pull encountered conflicts replaying unrelated local commits. Aborting it restored the shared checkout. The assignment used a separate local main at the assigned revision.

The published population test reads the original `backend_popcount.tower` directly. Both shipping frontends ran the full 256-iteration input and produced the same Foundation, BrightScript and two stdout bytes as the original. The portable simulator recorded 256 entries into the loop and one exit. All 13 portable Roku registrations passed. The eight-iteration measurements below describe the initial migration experiment. Qualification evidence is in receipt `481892c4-5c0a-4e3e-8aa1-23e1320e3da8`.

## What the registrations exercise

The pre-edit inventory in the packet lists every source, mode and original output. The seven regression groups supply eight of the thirteen registered Roku tests. The device-package writer and four integer corpus registrations complete the suite.

| Tower companion | Original inputs and oracle |
| --- | --- |
| Shared semantics, O0 and O2 | Each selection checks backend semantics and the functions, structs, memory, collections and match examples against their original 32-bit graph interpreter output. |
| Narrow integers | Both modes check narrow scalar arithmetic and narrow output against the interpreter. |
| Layout and foreign functions | Direct emission checks repeatability, comment inclusion and removal, interpreter output and live nodes. The 8-byte pointer profile, unsupported foreign function and incorrect platform_write signature must produce their respective emitter diagnoses. |
| Recursion and arguments | Forty arguments, recursive factorial, a simultaneous swap of two high unsigned values and a nine-byte UTF-8 platform write run in both modes against the interpreter. |
| Trap unwinding | The BrightScript entry catches division by zero, signed division overflow and checked conversion overflow in both modes. Falling through TowerRun reaches a throw outside the catch. |
| Scalar idioms | All ten O2 inputs and expected byte strings come from the existing corpus shared with the LLVM and driver suites. |
| Population count | O2 checks the small loop at byte, word and wide widths, replicated patterns and the six explicit full-width cases. The expected failure count is zero. |

The new owner and its companions are under `playground/tests/roku/fixtures/emitter`. Each original Node filter requests its suffix on `emitter.tower` through the qualified `selectedTestSteps` path. The probe compiles the tests, requires one declaration and executes it. The subject reactor retains the ordinary source, Foundation, target width, emitter and interpreter entry points. Tower requests canonical Foundation, selects LLVM O0 or O2, recompiles the returned Foundation and compares the simulator output and expected bytes with `fixture_equal`. The direct layout case uses the original compiled handle. Keeping the probe separate lets its layout test read the subject's live-node counter.

The existing Node harness validates generated code with BrighterScript and runs it in brs-node. The synchronous Tower test hands off the program and optional Main to Node. Node awaits the simulator between bounded interpreter steps, then copies stdout and its UTF-8 byte length into the same live test. The adapter releases subject handles on failure. The C emitter selections and the editor promise-turn tests supplied the transport and selection precedents. The original graph reference budget is two million steps. The compiler, runtime, Playground source worker and integer corpus have no source delta.

## Population bound

The original JavaScript attempted to replace a while condition that no longer occurs. The common program uses a counted for loop. At the assigned revision the original registration therefore simulated 256 iterations. The initial migration required the actual loop header before editing the bound on its private source copy. It keeps the remaining source bytes, including all six trailing verification calls. A separate old-harness run applied only the bound correction for the timing comparison. The shared exhaustive compiler fixture keeps its 256 iterations.

## Reproduction

Use the pinned Playground lockfile, put the portable product in `build/browser-wasi/tower.wasm` and decompress the release LLVM product to `build/browser-wasi-llvm/tower-llvm.wasm`. Run the suite and the trap filter from `playground`.

```sh
node --test --test-reporter=tap --test-concurrency=1 tests/roku/*.test.mjs
node --test --test-name-pattern='^runtime traps unwind' tests/roku/emitter.test.mjs
```

The evidence packet contains the pre-edit inventory, per-call byte records, full TAP, commands, measured host limits and a Git bundle. The disk test inventory uses the checkout's explicit Foundation and Bedrock paths because the packaged native resource subset omits backend/text. Native listing verifies discovery. The real Node registration provides the external compiler and simulator operations needed to execute each body.

## Results on host 1

Both original and migrated portable Node registrations passed 13/13 with zero skips. Each migrated regression selection found exactly one Tower test. The full runs submitted 39 programs to the simulator, including the three integer runtime checks. All 39 stdout byte strings and Main programs match. All three emitter refusals, all twenty graph reference outputs, repeated and stripped layout emissions and all six device-package files also match. For 35 of the 36 LLVM calls, target, optimization flag, input Foundation and reconstructed Foundation are byte-identical. The population-bound correction accounts for the remaining call and the single changed BrightScript program. Separate fresh-process layout selections returned 13,367 live nodes before and after on both source trees.

A deliberate same-length change to the trap Main printed `cought` instead of `caught`. The original Node name selected the divide-by-zero case and its Tower comparison failed in `emitter.tower` at byte 1223. Restoring the original Main passed the six trap executions. All eight native owner/suffix listings found the corresponding file. All ten assertion and helper modules passed the public native source-format check.

The existing desktop and emulated mobile Roku browser checks passed against the 115 manifest-verified static assets served on loopback. Each downloaded the displayed source, changed optimization, stripped comments and revoked the stale download. The first launch lacked libnspr4 on the library path. Adding the retained Chromium sysroot allowed both original tests to run. Physical-device execution remains open.

| Portable suite, one fresh Node process per run | Wall seconds | User + system seconds | Peak RSS KiB |
| --- | ---: | ---: | ---: |
| Original source, actual 256 iterations | 216.89 | 174.69 | 982,160 |
| Original harness with matched eight-iteration input | 107.13 | 64.02 | 980,476 |
| Migrated registrations with eight iterations | 108.36 | 66.71 | 1,088,176 |

Host 1 had two Intel Xeon Gold 6244 sockets, sixteen physical cores and 32 logical CPUs. The cgroup quota was 15.36 CPUs. Both matched trials used CPUs 0–3 on distinct physical cores, one libuv thread, one Node test at a time, Node 24.22.3, warm files and fresh production reactors. The cgroup recorded zero additional throttles during either matched trial. The migrated harness opens a separate assertion reactor and copies compiler text and stdout across its boundary. The matched sample added 1.23 s wall, 2.69 s CPU and 107,700 KiB peak RSS. These numbers measure one pair of simulator suite runs. The public Wasm products have no source sanitizer instrumentation.

A disposable copy of the migrated population test ran the original 256-iteration loop on the public shared frontend. Its input source, both Foundation stages, emitted BrightScript, Main and stdout matched the original portable run byte for byte. This preserves evidence for the full historical workload alongside the bounded registration.

The full migrated suite also passed 13/13 on the public shared frontend. Each of its eight assertion selections found one test. All 39 simulator rows, three diagnostics and six device files matched the portable results. This was a functional run using the ordinary four-slot subject and a single-slot assertion probe.
