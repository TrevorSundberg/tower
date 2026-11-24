# First complete-artifact local deployment verification

The unchanged verifier ran and failed an exact Foundation-text assertion. This is an executed test failure, distinct from the earlier execution-service rejection. No new runtime is deployed.

Frozen UI/source `35c04415ca5a59e67ee0fef3ad5b082a27bccb98`, reactors `bd86046fa3c1c3ce76854bbc2330a8d0c04a02df`; tested static archive 94,406,232 bytes, SHA256 `84de801ad1cbe201d351fbdae989f486adb99d8643955d90f8c6ea49546ac2e5`. Manifest SHA256 `3336932b66e45aaaf94baa52e254b0b040b68f67d39d1269b2b9ebfc078883fe`. The later 40-byte component ABI is excluded.

ROOT inspected the earlier B2 rejected composite command: it combined recursive removal of prior output with preparation and verification. The service supplied only “blocked by policy”; the cause is not established. That command was not repeated. ROOT instead extracted source and assets into a new owned directory, preserved all earlier outputs, and ran the original verifier without any deletion or assertion/timeout changes.

`node playground/scripts/verify-local.mjs` used Node22.23.5, installed Playwright/Chromium1255, native Windows CPU8–15, 24 GiB OS-job limit and original600s guard. The source verifier/serve/package/lock files were byte-identical to the published versions. A junction reused installed dependencies; no package install or compiler build ran.

All104 deployed asset hashes match. Existing execution assertions reached the inference example with Graph/LLVM output `42\ntrue\n43\n42\n` and matching backends. The first failure is `verify-deployment.mjs:215`, expecting `var answer: integer_type(32, 1) = `; actual Foundation declares `var i32: type = integer_type(32, 1);` and uses `var answer: i32 = ...`. The following pointer assertion also expects an expanded representation, while actual text uses `i32*`.

No assertion was relaxed during this run. A1 owns the contract check and focused correction; later checks and other browser configurations remain unstarted. This failure does not establish a compiler semantic defect or a successful deployment check.

| Process-family result | Value |
| --- | ---: |
| Exit / whole guard hit | 1 / false |
| Wall / job CPU seconds | 19.509638 / 34.78125 |
| Sampled aggregate peak RSS bytes | 1,737,236,480 |
| Largest observed process peak RSS bytes | 1,094,201,344 |
| Peak job committed bytes | 1,782,202,368 |
| Total / remaining processes | 8 / 0 |

The existing Windows JobObject accounting wrapper was adapted only to launch the unchanged verifier in the fresh directory. It retains native handles, samples at20ms, bounds the owned process family and records each exit. RSS, committed memory and Wasm capacity are different measures. These are n1 validation costs, not before/after compiler performance.

Raw source/dist, preparation identity, original stderr/stdout, command wrapper and per-process measurements: `C:/Sandbox/build/codex_ecs_20261122/ROOT_verify_bd860_fresh`. All processes drained; no source/compiler/runtime change was made. The exact archive was also delivered to KinmenA and rehashed for A1 after its direct machine route failed.

Separately, ROOT copied and checked the complete new [d400 browser bundle](browser_component_abi_d40024c0.md): all24 files/163,932,187 bytes, manifest `a95efd167b409ce34c3b9b6903af7cf1a9c92d836c39992979983e8493445cf5`, source `d40024c07cdfc2f3a750053e439fc31bea1c1006`. Raw `ROOT_browser_inputs_d40024c0/ROOT_COPY_VERIFIED.json`; execution remains B2-attributed. That bundle still needs static assembly and complete deployment acceptance.

This receipt changes documentation only; new runtime performance/memory measurements for the documentation are inapplicable. Final instrumentation, new-layout public package, current static/hosted verification and measured useful-core/serial performance remain separate open gates.
