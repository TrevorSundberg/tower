# Hosted r4 acceptance — release input not delivered

**Blocked on the required release descriptor; no hosted run started.** This is an external publication/input dependency, not a browser/compiler failure or a service-policy rejection.
Preflight main `6496eb01581a43516e398dc9849bc6c0eda61ae6`; its complete tracked playground tree equals accepted verifier/helper source `f1821d42c3c6f75c51bec945fb03e7a8512b1b86`. The [previous03e procedure](hosted_acceptance_03e344d2.md) remains applicable, but its runtime result is not reused for r4.
Verifier SHA256 `14effd6dcf083cb08652bf212db4796f42a8a87fa24853409f976cf9d6d11107`; original600s whole-run and assertion/compiler deadlines unchanged. Existing Playwright1.65.1 package and dependencies image `ab6292a9f1c285bd386bb14928b1308a597747794fe4697061f4061da34d64b2` are present.
Retained Chromium1255 archive verified:119911406B, SHA256 `9acab0d6296062bca3c363cdf655f89c7c5838176c0d1e4570743ad776adf3ab`. No extraction, installation, browser/toolchain/compiler build or native/sanitizer rerun was performed. Fresh executable/runtime verification remains pending with the hosted run.
One existing `wait_release_input.ps1 -Path C:/Sandbox/build/codex_ecs_20261122/hosted_release_20261124_r4.json -Kind hosted-release -TimeoutSeconds 3600` began in PID41880 at16:13:21UTC and exited1 at its original deadline. Helper SHA256 `956b41b4f1dbf43448f799a33b60110bb1e64da57eaf732fed47b034cdf9305a`.
Exact failure: `Required release input not published by deadline: C:/Sandbox/build/codex_ecs_20261122/hosted_release_20261124_r4.json`. Post-exit observation17:13:47.9666151UTC confirms path absent and waiter retired.
A tool-connection gRPC timeout replaced the exec runtime during the wait. The original OS waiter survived; its PID/command and original session were recovered. No replacement waiter, deadline extension or previously rejected operation was attempted.

| Requested acceptance | Actual outcome |
|---|---|
| Descriptor/source/Pages/archive/HTTPS identity gate | missing descriptor; not executed |
| Full asset membership/hashes, desktop/mobile/real Linux, redirects/certificate checks | all unstarted |
| Hosted runs / passes / runtime failures / skips |0 /0 /0 /0; no acceptance claim |
| Browser/process family wall/CPU/RSS | not applicable; no family launched |

ROOT's actual published identities, exact tested static/source/input paths and expected manifest remain required before the unchanged full verifier can run. No speculative hosted request, old03e substitution, independent Pages push, DNS/security change or asset modification occurred.
All owned work is drained; the native container contains only its preexisting idle sleep. Disk free328197181440B, todo and prior native/hosted evidence unchanged. Documentation-only reconciliation does not change this frozen preflight boundary.
RAW: **`C:/Sandbox/build/codex_ecs_20261122/A1/hosted_release_r4/`** — preflight source/tree-diff/tool identity, exact `wait_result.json`, waiter error and terminal process inventory. ROOT owns the missing atomic release/input; the full r4 hosted milestone remains pending.
