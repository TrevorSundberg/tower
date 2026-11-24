# Complete Linux x64 development generations at 59d7dc9e

All **38 actual binaries** match byte-for-byte across Gen1/2/3; all **54 payloads plus SHA256SUMS** match across Gen2/3. This is a development-bootstrap candidate, not a standalone production release or public-pin update.

| Identity | Exact value |
| --- | --- |
| Published source/build commit | `59d7dc9e995b16c785b01f40f340374dc4c73d18` |
| Source tree | `39daf612b240a06b7bff06b08a2585c138c830d5` |
| Public Gen1 predecessor | `768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138` |
| All three towerc executables | `eeb005717318086c145428edc3b6b784d4729df7ef0514c7329e0a18b76dda9c` |
| Delivered generation3.tar.gz | `eaf41e3214cec5ed7c01552373b197cf756ea0050bbcefaa8e6160fd8531cdc8` |
| Gen3 development.json | `e2e3766ae241bd4fc83142f0124dfc3295a501a7cb48aadc66f71e5c6b1776cb` |
| Gen2/3 SHA256SUMS | `b1cf9123fa40ebdff8306a4bd9c36edf1423b9fdfbc4d5df3963111d8ec5c645` |
| Published source archive | `93a82c480e613f0c0130ef0c76577e5fbf77bd9fb0ad07e1731a599809b5d540` |

Delivery: `C:/Sandbox/build/codex_ecs_20261122/A2/current_generation_59d7dc9e/generation3.tar.gz` (2,500,694 B); executable 2,294,024 B, mode0755. Archive includes the complete package, provenance, source/build manifests, commands and usage/limitations. The source archive and checksummed raw evidence accompany it.
Gen1 used `env -u TOWER_BOOTSTRAP_COMPILER TOWER_NATIVE_BUILD=.../gen1_build TOWER_BUILD_JOBS=4 bash playground/scripts/build-native.sh -DTOWER_COMPILER_JOBS=1`. Fresh Gen2/3 used the preceding complete verified package and the same `successor_build` path; Gen2's whole build was preserved before recreating that path. Each build completed all52 dependency actions; no compiler or resource inputs changed between generations.
Inventory derives 30 objects, one archive, three executables and four configure probes; membership remains the a18 candidate's38/54. Both hashes and actual `cmp` cover every member. Gen1's nine runtime IR ModuleID path comments differ from Gen2/3, with consequent checksum differences; complete diffs remain unmodified. Type prelude, Foundation syntax, work_gate and hosted runtimes are present.
The snapshot uses exact published LF blobs: 1,270 package provenance source entries, 1,348 broader build/bootstrap input hashes; source.patch is empty. The archived predecessor's observed0775 was corrected to0755 without byte changes. The absent LLVM submodule license was restored from the verified public payload, SHA `8d85c1057d742e597985c7d4e6320b015a9139385cff4cbae06ffc0ebe89afee`; no authored source patch entered the generations.

Strict original verification found one stale ParserNodes permission: `entity_register_stage_result`, used by `lr_first_work.tower:122` and `frontend_modules.tower:472`, supplied by `entities.tower:247`. Added only that exact per-unit name and one existing Tower admission regression (four target spellings plus truncation/suffix/wrong-unit/provider-unit rejection). All nine actual native symbol reports and the existing regression pass. No wildcard or unsupported-provider allowance was introduced.
This verifier-only repair was built through public768 **after** the frozen generations; it is separately recorded in `postfreeze_symbol_policy.patch` and hashes, not silently incorporated into the59d package provenance. Reviewed verifier SHA `8fa1b099d99cad2a4989cea954e6d2578c7f60f9e5a1052c2fbfc6786b59d9af`.
All75 existing host-verifier checks pass:16 per generation,16 relocated development checks,11 restricted-PATH checks including the required missing-Clang negative. The Windows-delivered archive was rehashed/extracted into a Linux path containing spaces; every package byte/mode matched, with original source/cache directories entirely absent from that container. Restricted standalone acceptance remains **unpassed**.
Existing16/1000-function controls produce objects identical to the saved checked references (`cdc5a6ec...fb407`, `ae9e824d...f4e08`; complete hashes retained), and hosted executables emit exactly `15\n` / `999\n`. No browser, instrumentation or unrelated regression matrix was run.
Preserved failed attempts: initial0775 mode assertion; Tower directory publication on Windowsv9fs (same inputs succeed on owned Linux volume); original missing-symbol policy; exported-main fixture incorrectly linked as an ordinary program (corrected existing library recipe); small control linked with freestanding runtime (corrected hosted runtime recipe). Their nonzero logs/statuses remain failures; successful recovery does not overwrite them.

Host: Windows11/KinmenA Ryzen AI MAX+395, Docker Ubuntu24.04.5/WSL2; LLVM/Clang19.1.1, CMake3.28.3, Ninja1.11.1. CPU0–11,24GiB Docker memory limit, outer4/compiler1; one heavy build at a time, network disabled. Warm filesystem/fresh processes, n1 per generation/consumer. Process profiler CPU includes waited children; RSS is a process/child high-water mark, not simultaneous summed RSS.

| Successful phase | Wall s | CPU s | Peak RSS KiB |
| --- | ---: | ---: | ---: |
| Gen1 / Gen2 / Gen3 build | 62.860 / 42.117 / 43.758 | 144.711 / 79.862 / 82.097 | 1,076,856 / 894,068 / 892,248 |
| Gen1 / Gen2 / Gen3 development verification | 4.455 / 4.335 / 4.436 | 4.098 / 3.997 / 4.086 | 179,132 / 179,308 / 179,412 |
| Relocated development + missing-Clang | 7.182 | 7.005 | 179,664 |
| Small / large control compilation | 0.359 / 0.476 | 0.351 / 0.470 | 173,928 / 200,780 |

Gen2/3 container peak2,024,505,344 B (includes charged cache), zero limit/OOM events; disk337.63GB before /336.99GB after, no cleanup. These are acceptance costs, not generation speedup/scaling claims. Original failed Gen1 container peak was not captured.
Matched successful Semantics report, n3 verifier samples: median before/after6.784/5.924ms wall,2.389/2.021ms CPU; maximum RSS1,636/1,652KiB. Both return0 with empty diagnostics. This allocation-free policy adds no parallel path; these tiny process measurements establish no compiler performance improvement. Compiler/runtime behavior is unchanged.
Raw roots: `A2/cache/generation_59d7dc9e/{logs,manifests,checks}` and delivered `{logs,generation_checks,relocation,reference_controls}`. `EVIDENCE_SHA256SUMS` covers delivery; full commands, tool/image hashes, input/output manifests and actual exits are retained. Four stashes and todo remain untouched; owned jobs drained.
Requires installed host LLVM/Clang and the documented dynamic dependencies. ROOT owns public pin, clean default adoption and final integrated/browser/release gates; later B1 or other source changes and the previously service-blocked instrumentation remain outside this frozen evidence.

Final integration: preserved complete `c934d02d` history through merge `56986420`. Incoming B1 SCC code independently includes the same exact registration allowance; retained its policy and regression, removing only A2's duplicate. Public-pin-built merged verifier `e0812bd8...bc8ddd6`, merged symbol regression and all nine frozen object reports pass; hashes/logs are separate sidecars. SCC, newer native fixtures/registrations and browser transport remain excluded from the59d candidate. No generation or target matrix repeated; ROOT decides adoption of those later inputs.
