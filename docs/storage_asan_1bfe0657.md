# Linux x64 storage ASan acceptance — 2026-11-24

Frozen published source `1bfe0657fbba2a39075b23df89a73d54ba11c11d`, tree `0fd99bd68619abf7fbe518e63b11a8cc43549baf`; includes the 40-byte EntityComponent ABI.
Default public compiler SHA256 `31a385c616b889987d68f8eb9714020f3928aac97591a1569f905ab706f52ed6`; resolved with `TOWER_BOOTSTRAP_COMPILER` unset, no private predecessor.
No compiler, provider, fixture or instrumentation-policy changes. Source/import/build hashes remained identical before and after the family; later inputs are outside this receipt.
Environment: Orchestral-Revng WSL, Ubuntu24, Linux6.18.33.2, Clang/LLVM19.1.1, CMake3.28.3/Ninja1.11.1; fresh exclusive cache `/root/.cache/tower/l1_storage_asan_1bfe0657`.
CPU0–3, outer jobs2/compiler jobs1; systemd scope `MemoryMax=4G`, `MemorySwapMax=0`, `AllowedCPUs=0-3`; virtual-address limit unlimited. Host has 15,697MiB RAM and swap, but owned scopes cannot swap.
Public bootstrap entry followed by existing native CMake configuration: `TOWER_NATIVE=ON`, `TOWER_SANITIZER=address`, `TOWER_WORK_TESTS=ON`, Linux Clang19/LLVM19, Release. Exact commands are retained below.
Smallest ready/control dependency build first (9 actions), then one 14-target dependency build (46 actions); no compiler/vendor/generation/browser rebuild.

## Sensitivity and actual instrumentation

First private probe link exited1: `undefined reference to main`; a top-level `tower_main` probe was incorrectly paired with the library-only guest object. No probe executed at that failure.
Corrected only the owned OS recipe to build existing `guest-host-linux-x64.ll`, instrument it with the same Tower tool, compile it, then link the executable runtime. Original link log/status retained; no source or security change.
Unchanged `sanitizer_memory_probe.tower` then exited1 with `AddressSanitizer: heap-buffer-overflow`, `WRITE of size 1`, exactly after an eight-byte allocation; normal `tower-work-ready-tests` exited0 with literal `0\n` and empty stderr.
Both controls preceded the ownership selection. The historical race-probe missing-buffer-provider limitation is separate and remains unexecuted here.
Actual 14-executable link closure contains **17 distinct instrumented Tower objects**: 14 fixtures, guest-work runtime, arena linkage provider and separately linked Linux worker provider (not the historical 16-object closure).
Matched actual link commands to original/instrumented LLVM and object hashes; every object has `sanitize_address` IR and actual ASan memory-access/initialization references; all executables define `__asan_init`.
All five concurrent executables export `work_thread_entry`; three additional control-only objects are instrumented too. Build-host tools are uninstrumented and are not linked into tested executables.
Tower `instrument_llvm` SHA256 `2ae3dab3bf8ff7d8327a1c9783cde1226b0190534077f3e5d3f295e40f14fa12`; linked LLVM19 compiler-rt ASan archive `1050d83b513bef5d532f1a7ddca8fdb3760aa9af99228ced681ee8140ce8b600`.

## Executed scope and costs

**26 selected / 26 executed / 26 passed / 0 unstarted**, all raw exit0 and empty stderr, with `ASAN_OPTIONS=detect_leaks=1:halt_on_error=1` and unchanged 30s process guards.
Entity accounting cap/profile; stage-result normal/queued; stage-concurrent ×3; component-budget ×3; component-layout; page-reuse; stage-reentrant; attach-leases.
Work buffer; buffer-shared ×3; arena; arena-shared ×3; arena-linkage; budget-shared ×3. Queued stage stress retains its 65,536 ×8 input; all fixture counts, budgets and assertions unchanged.
Concurrent cases use production allocation, real pthread/barrier checks and distinct worker identities. No serial fault-injection run is offered as overlap evidence.
Existing assertions check cancellation/publication/finalizers, leases/pins, partial admission, retained handoff and final zero world/components/budget grants. Stage-concurrent reports 57,792 finalizers each repetition.
Accounting retains Capacity rejection at the 2,256B store budget; current physical/charged peak is 42,982B with zero omitted bytes, and final world/ledger zero. These are fixture ledger values, not RSS or ASan shadow capacity.
Ready dependency build: 5.93s wall /7.21s CPU /196,664KiB peak child RSS; executable-entry dependency: 1.50s /1.07s /196,656KiB; ownership build: 32.26s /52.92s /278,012KiB.
Negative control: 0.02s wall /0.00s CPU /5,832KiB; ready positive: 0.02s /0.01s /10,672KiB. Twenty-six case totals: 1.35s wall /1.84s CPU, maximum 101,032KiB RSS (GNU time precision).
Separate cgroup peaks: initial preparation529,641,472B; corrected sensitivity285,401,088B; ownership build703,029,248B; ownership execution103,608,320B. All memory max/OOM events zero; owned work drained.
These are instrumented acceptance costs, not a production before/after speedup or universal race-freedom claim. Physical ASan does not generally poison individual retired slots inside a still-live pool allocation.
Source-language UBSan, TSan sensitivity/current races, other hosts and integrated semantic-compiler/query coverage remain separate; this receipt closes only the selected Linux storage family.

Raw commands, original failure, source/depfile/IR/object/executable hashes, link/nm proof and all case outputs/status/time logs: `C:/Sandbox/build/codex_ecs_20261122/L1/storage_asan_1bfe0657` (`sensitivity*.sh`, `build.sh`, `instrumentation_proof.sh`, `run.sh`, `logs/`, `cases/`, `evidence/`).
SHA256 manifests: source `475e842b368bf8b61efb1aeebb170d4d1a3e242bd2e75595daea4bb50614c4cb`; 14 executables `26c5ffc2509a0e0bc35e3ddd7f33e6ea0b5fb35f64e7ce4de1ef67002c3970a2`; actual linked objects/IR `fb88c8fde72cb53921b51d816cf3d1916196ebfc8089eeae9073b4f0c07278b7`.
ROOT retains final adoption/publication; no public pin or hosted artifact changed.
