# Foreign grammar package repair — independent D2 source review

Frozen published main `b862499b73349b241e7e384d17a1dcab8a8c0800`; implementation `ffd45987`, publication `1072141e` are ancestors. No changed-scope drift since implementation.
Disposition: no concrete defect found in the import removal, isolated fixtures or verifier delta; this closes their independent source-review gap, not package/release acceptance.

| Reviewed path | Exact Git blob | Disposition |
| --- | --- | --- |
| `scaffolding/backend/foreign_grammar.tower` | `a214b66c9caf82c16453b5e7938382279999232d` | Entire grammar reviewed; only unused reader import removed. |
| `scaffolding/tools/verify_compiler.tower` | `18c6a54e180bb98a6e90d578d37b63f9d31e93bf` | Copy callers, checks and failure/cleanup paths reviewed. |
| `scaffolding/tests/distribution_foreign.tower` | `6d0efe90c7390601ca501e6432709d01a2f707f0` | Imported surface grammar, independent literal result42. |
| `scaffolding/tests/distribution_foreign_library.tower` | `43996d0173da48d78d4b343761fe7de5ac949342` | Imports and two exports only; no executable top-level statements. |
| `scaffolding/tests/backend_foreign_calls.tower` | `92f9c429f4735060ec65a596f2b28ed55991fe22` | Unchanged independently quoted extern/call names exercise emitted ABI. |

Every grammar reference is a local `Foreign*` rule or inherited `Core*` rule from Tower/Foundation; identifier/contextual attributes use shared grammar-attribute classification. No declaration, capture or activation invokes reader helpers.
`syntax_reader_name` uses shared span/identifier decoding; `foreign_symbol`/`foreign_api` independently import the actual reader/mangler closure. Removing the grammar import does not remove backend name processing or change C/C++ name policy.
CMake/browser resource recipes deliberately copy foreign_grammar alone. Bootstrap packaging collects adjacent share resources and hashes them; neither caller secretly supplies the missing reader closure.
The verifier copies seven explicit fixture filenames into a newly created directory; it copies no language/grammar helper and supplies no resource override. CLI fallback resolves `<executable>/share/tower` after the isolated source directory.
Both grammar fixtures therefore exercise the package import, not the historical inline grammar. The executable computes `(20+1)*2`; the library exports those operations and the separate quoted caller independently requires exact `42\n`.
Graph and Fast run the executable fixture; native library emission/link/execution checks the quoted caller. Repeated ordinary object generation still removes/recreates and compares hashes, and previous diagnostic/option/library/executable checks remain.
Derived check counts agree with the receipt: eight initial checks + three object repetitions + two libraries =13; expected-missing-Clang adds one=14, development adds five link/build checks + three executions=21.
Missing-Clang mode explicitly denies restricted standalone-release acceptance. Fresh output-directory admission prevents stale products; clean environment/PATH is process isolation, not an OS filesystem sandbox.
`verification_run` still requires an exited process with the exact code, bounded readable logs and byte-exact requested stdout; diagnostics retain the numeric source-column check. Launch/signal/timeout errors cannot satisfy expected exit1.
GNU timeout remains180s with1s kill grace; synchronous process waiting/reaping, deferred buffers/path frees and file-close handling are unchanged. Failed logs/directories are retained intentionally; no asynchronous owner or recursive cleanup is added.

[L1's owner receipt](foreign_grammar_package_bdb0ed38.md), not a D2 rerun:21/21 development and14/14 expected-missing-Clang checks; Graph/Fast/native42, exports `_ZN15foreign_fixture9incrementEi` and `foreign_twice`.
Attributed Linux x64 Ubuntu24/LLVM19 CPU0–3/24GiB cost:35 checks,13.83s wall/14.45s CPU/189688KiB peak waited-child RSS; verifier SHA256 `fcba6fb767f948de7c4ea1f08c747d022fd8b16eb21283821c88b6767d9d5f1c`.
Original package remains a recorded exit1 at foreign_interpret after six passes: `foreign_grammar.tower:2:23: Cannot read imported module: foreign_reader`;1.69s/1.74s/177356KiB.
Withdrawing only the overlay grammar records exit1 there: `foreign.tower:2:32: Cannot read imported module: backend/foreign_grammar`;1.62s/1.68s/177260KiB. These are attributed external negative controls, not new verifier expected-failure registrations.
The draft whole-program-as-library rejection and ROOT's earlier mixed-root failed reference remain failed; the library-only/independent-caller evidence does not relabel either attempt.
Public/private executable remains SHA256 `eeb005717318086c145428edc3b6b784d4729df7ef0514c7329e0a18b76dda9c`; patched resource `a976b1ed9c0f92b0d29c9fd266001f2bfc3ec647e17eb69aaa769796e5eb3dd1` is a private overlay.
Independently hashed checked-in public resource is still `d5ba839e6ffc54e1128f9a067e68d0c08a2c53722fe78315990f8d2bb807f470`; development manifest remains `e2e3766ae241bd4fc83142f0124dfc3295a501a7cb48aadc66f71e5c6b1776cb`. Copied overlay provenance describes original bytes; its external delta manifest is not public adoption.
Browser recipes consume the repaired authored grammar, but no newly built/served browser resource or public repin is established here; those remain ROOT-owned. Other ABI/standalone/deployment acceptance is outside this review.
Raw D2 frozen blobs (including necessary caller/resource/process contracts), diff and hashes: `build/d2_ecs/foreign_package_peer_b862499b/`; L1 runtime logs: `C:/Sandbox/build/codex_ecs_20261122/L1/foreign_resource_bdb0ed38/` (attributed, not reread remotely).
Documentation/source review only: runtime wall/CPU/RSS profiling is inapplicable; no build, execution, heavy lock, instrumentation or deployment verification performed. Disk126GiB/RAM9.7GiB available at entry; no owned active job.
