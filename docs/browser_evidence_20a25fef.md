# Compact static browser evidence

- **Implemented:** the existing four static controls use a small Chromium/CDP fixture recording actual dedicated-worker target IDs, creation/change/destruction timestamps, initial/final target sets and staged output. It observes discovery events without pausing workers, intercepting messages or changing product flows. Original assertions/deadlines remain; missing retirement fails within30s.
- [Checks recipe](../playground/README.md) now disables full protocol debug and uses the ordinary line/JSON reporters plus linked lifecycle attachments. Preserve each report/attachment directory once; no intermediate uncompressed records archive is needed. Standard diagnostics, screenshots and `retain-on-failure` traces remain unfiltered.
- **Cause:** `DEBUG=pw:protocol` logged2713 `Network.getResponseBody` replies totaling335807672B; every decoded body matched an immutable served asset (including `/`→`index.html`). These bytes were required by Playwright's trace recorder, but their second serialization to console/JSON was not an ownership oracle. The JSON reporter alone copied355308351 stderr bytes. Old retirement collection consumed only Target metadata.
- Test-only OS/browser transport change; no compiler/runtime/toolchain/asset rebuild. Before checkout20a25fef; both arms use the exact3c static archive29a51993/manifest6810d9f0 and identical original test/config/server/tool bytes except this observer/output attachment. CPU12-23/quota12/24GiB/swap0; Node22.23.5/Playwright1.65.1/Chromium159 headless1255, one family at a time.
- One matched baseline/current run: **4/4 each**, zero skips/retries/unexpected failures, isolation/threaded loading/staged42/reload/portable fallback unchanged. Both observe64 actual dedicated workers, all retired; new metadata also asserts zero final targets. Both staged-output attachments equal `42\n`, SHA084c799c. Counts across whole tests are not useful-core overlap claims.

| Scope | Before | After |
|---|---:|---:|
| Four controls wall / child CPU s |29.191 /23.740|25.797 /14.524|
| Maximum process RSS KiB |2350744|384712|
| Same JSON summary extraction wall / CPU s |1.377 /1.438|0.025 /0.024|
| Summary extraction peak RSS KiB |1855484|47404|
| JSON + console bytes |362631391 +355334887|11825 +630|
| Retained test attachment bytes |45|220513|
| Report archive wall / CPU s |18.356 /18.340|0.006 /0.005|
| Report archive bytes |378664420|15213|

- Test + common summary + report archival wall48.923→25.828s; test CPU falls38.8%, test peak RSS83.6%. These are bounded observation/collection savings, **not compiler speedups**. One pair does not establish universal timing. File sizes measure retained output/archive bytes, not unmeasured block I/O or transient success-trace writes; separate payload-audit costs are excluded.
- Baseline also wrote717987840B intermediate tar. Current archival directly retains the small report/attachments once. Original r4 peer archive511MB additionally contains required generated binaries: those are preserved, not removed to inflate this reduction.
- **Negative control:** only an owned copy of shared Wasm was replaced with `not wasm\n`; one original desktop test exits1 at its unchanged90000ms assertion guard. Full `WebAssembly.compile(): expected magic word 00 61 73 6d, found 6e 6f 74 20 @+0`, status/assertion stack, screenshot, context and trace survive. Three actual workers retire, zero targets.97.489wall/1.090CPU/163840KiB; retained failure archive28075872B demonstrates that needed payloads remain available. The expected failed test is not labeled a positive pass.
- Separate strict shared cancellation/stale/retired-worker, canonical and generated-output artifacts retain their exact accepted3c identities; their producers/oracles were untouched and no matrix was rerun. This static fixture neither substitutes for those controls nor discards their raw outputs.
- Initial measurement launcher failed before tests because the profiler requires absolute executable paths; original exit1/log retained, then `/usr/bin/timeout` and `/usr/local/bin/node` used. A payload audit initially listed `/` separately; index.html hash identity resolved all12 such responses. No test assertion or guard was relaxed.
- Raw commands/source/tool/input hashes, payload-to-asset identities, full reports and IDs: `C:/Sandbox/build/codex_ecs_20261122/B2/browser_evidence_20a25fef` and `/cache/browser_evidence_20a25fef`. `measurements.json`, `SHA256SUMS`, before/after/negative `records.tar.gz` retain evidence; original huge JSON/logs remain in the owned Linux cache.
- After archive SHA90871d56; negative archivecee08365; baseline archive dda84607. Immutable r4 static29a51993/source78d1b5c1/peerD590BD1B/supplementCDC29D23 rehashed unchanged. No pin, Pages or release-asset mutation; zero live owned jobs. ROOT owns subsequent integrated adoption/publication.
