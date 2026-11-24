# A1 frozen bd860 local deployment acceptance

2026-11-24; session `01a2046f-fec2-7cd1-bdc9-0a0c6127c6f7`. Complete original local verifier **PASS**, exit0, no guard expiry or stderr.
Clone freeze `2bdb843e347afb076a548063b08acfc210bb6554`; verifier copied from published `7c9b67568db2fd571f0b44cd3482618a45f82d1a`, unchanged at freeze.
Static UI source `35c04415ca5a59e67ee0fef3ad5b082a27bccb98`; reactor source `bd86046fa3c1c3ce76854bbc2330a8d0c04a02df`. Mounted source does not update these compiled providers.
Input `C:/Sandbox/build/codex_ecs_20261122/ROOT_static_bd86046f_35c04415.tar.gz`: 94,406,232B, SHA256 `84de801ad1cbe201d351fbdae989f486adb99d8643955d90f8c6ea49546ac2e5`.
Manifest SHA256 `3336932b66e45aaaf94baa52e254b0b040b68f67d39d1269b2b9ebfc078883fe`; all **104 deployed assets** match. Extracted dist contains105 files/105,745,567B including manifest.
Verifier SHA256 `14effd6dcf083cb08652bf212db4796f42a8a87fa24853409f976cf9d6d11107`; source, all asset membership/bytes/hashes and frozen tool hashes unchanged after execution.

New owned root `C:/Sandbox/build/codex_ecs_20261122/A1/deployment_bd860_2bdb843e/` (RAW below); source archive extracted to `workspace`, exact assets to `workspace/playground/dist`.
Installed dependencies reused through a node_modules junction; no asset/compiler/vendor rebuild, deletion, SDK/package installation or security change.
Windows native Node21.7.3 satisfies installed Playwright1.65.1's Node>=20 contract; differs explicitly from ROOT's Node22.23.5. Chromium159.0.8154.6/headless revision1255 matches its installed browser descriptor.
Node SHA256 `37901cb69f7de95891b5e5cead529393a18dc8886a7bb4c6c36e35ac955c70fa`; headless executable `b23921f57bcff971495917b208b63df393788525120c6ce23a79c1e3e1583114`; remaining identities in `tools.before.json`.
Command in workspace: `node playground/scripts/verify-local.mjs`, launched through the existing Windows JobObject meter (`measure_verifier.ps1`).
Unchanged600s outer guard, original5s assertions and existing per-response deadlines; CPU12-23 (`0xFFF000`),24GiB job cap,20ms process-family sampling.

| Result/cost (one complete validation) | Observed |
| --- | ---: |
| Desktop/mobile configurations; page errors | 2 passed; 0 |
| Wall / inherited job CPU | 56.604115s / 118.093750s |
| Sampled aggregate peak working set | 2,409,459,712B |
| Largest observed individual peak working set | 1,642,704,896B |
| Peak job committed memory | 2,576,076,800B |
| Accounted process starts / terminal active processes | 14 / 0 |

Both configurations pass exact backend outputs, forward modules, editable grammar, persistence, formatting/error behavior, completion/Tab/struct fields, compiler highlighting, downloads/native artifact checks, column layout and target-default detection.
Original compiler-build cancellation and page lifecycle controls remain; job accounting confirms actual process-family retirement after completion, beyond merely requesting page/browser close. It is not a per-worker race-freedom proof.
Inference checks retain exact signed32 `i32` declaration, `answer: i32`, `pointer: i32*`, `add_one(41)`, `&answer` and Graph/LLVM `42\ntrue\n43\n42\n`; no further assertion change was necessary.
The conditional real-Linux host branch is inapplicable on Windows, not newly passed. No full compiler generation, separate four-test UI suite, sanitizer or newer40-byte component-ABI artifact acceptance is claimed.
Costs are n1 validation costs, not throughput: ROOT's earlier19.510s assertion failure stopped sooner and is not a speedup denominator. Sampled aggregate RSS can double-count shared pages; it is neither Wasm capacity nor an allocation/retention census.
Preserved [ROOT original assertion failure](deployment_verifier_bd86046f.md) and [A1 prior unavailable-archive receipt](deployment_alias_assertions_5e981919.md) remain historical. This transferred archive closes that prerequisite and the frozen local verifier gate.
Raw outputs: `RAW/verify_local.out`, `.err`, `.measure.json`; full browser/download/screenshots/report under `RAW/workspace/build/deployment-verification/`.
Freeze/provenance: `RAW/identity.json`, `assets.before.json`, `tools.before.json`, `browser.version.txt`, `after_checks.txt`, source archive and measurement transport retained; no cleanup.
No production/test edit this turn; documentation-only runtime profiling is inapplicable beyond the recorded requested validation. No owned child jobs remain; approximately312GiB free; todo unchanged.
Local acceptance only: ROOT owns final static/current-ABI adoption, hosted deployment and release verification.
