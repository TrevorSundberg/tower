# draw-tower-command-begin/v1

Draw confirmed this mapping at `draw.c:1841` in
`30b66f597b33c6f88964779f0ab1b87e847dc839`. Draw's
`draw_vk_command_begin_v1` and the reusable Tower entry each take one
primary command buffer handle by value and return a signed `VkResult`.
Tower implements the entry in `command_begin.tower` with an `i32` result.
The header accepts ordinary Vulkan C types.

```c
#include "frame_submit.h"

VkResult tower_vk_command_begin_v1(VkCommandBuffer cmd);
```

## Before and after the call

The caller owns a live non-pending primary from a pool created with
`VK_COMMAND_POOL_CREATE_RESET_COMMAND_BUFFER_BIT`. It synchronizes host
access to the buffer and pool and establishes completion of every
submission using the primary. The function resets that buffer exactly
once with flags zero. Only successful reset reaches begin. Its local
`VkCommandBufferBeginInfo` has `sType = 42`, null `pNext`,
`flags = VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT` (1), and null
`pInheritanceInfo`. All host storage used by the operation is local
to the call.

| Vulkan outcome | Loader trace | Returned result | Caller consequence |
| --- | --- | --- | --- |
| Reset fails | R | Exact reset result | Stop before recording. |
| Reset succeeds, begin fails | RB | Exact begin result | Reset already succeeded. Stop before recording. |
| Both succeed | RB | VK_SUCCESS | Record one submission's work on this primary. |

Draw's raw C path checks each Vulkan expression. Its Tower-enabled C path
checks the single helper expression. Draw's fatal diagnostic format is
`Vulkan error %d at line %d: %s`, with exit 1. Identical signed results
can come from either Vulkan operation. The trace distinguishes them in
tests. The return value alone carries no failed-operation tag.

Draw waits for the prior frame before reuse. An out-of-date acquire
returns before fence reset and begin. After an accepted acquire the render
caller resets its fence before calling begin. The guarded-clear caller
resets its fence after end, before submit. Upload/prewarm callers can
retire work synchronously. Acquisition, fence operations, external queue
synchronization, end, submit, frame history, presentation and destruction
stay with their respective callers. A frame that fails before submit
cannot wait for its reset fence to signal for that frame. Fresh buffers
in the one-shot Tower fixtures retain direct begin with flags zero from a
pool with flags zero. [End and submit lifetime](command_end_v1.md)

## Linking from C on Linux x86-64

From the Tower root, set `vulkan_loader` to the SDK's absolute loader path.
The following builds a standalone C-linkable begin object and a DSO with
all three frame operations. Applications that already have the verified
end/submit object can reuse it.

```sh
v=scaffolding/library/graphics/vulkan
bootstrap/linux-x64/towerc "$v/command_begin.tower" --library --jobs 1 -o command_begin.o
bootstrap/linux-x64/towerc "$v/command_end.tower" --library --jobs 1 -o command_end.o
x86_64-linux-gnu-ld --hash-style=both -shared -z defs command_begin.o command_end.o "${vulkan_loader:?}" \
    -soname libtower_frame_submit.so -o libtower_frame_submit.so
```

| Product | SHA-256 on host 12 |
| --- | --- |
| command_begin.o | `4c8e8e1da85e03cf270fda962a6d8c0b8146c3db86409edc82adfb378908f75f` |
| command_end.o | `e6cb394beffaf44bce041603f58af6c29bf934e0edd8d408d56cd16857a9c5d1` |
| libtower_frame_submit.so | `289df8122bdf427a0be737c8da5f4d38772767dc03a0ece38b237affe867dd2c` |

The begin object defines `tower_vk_command_begin_v1` and imports
`vkResetCommandBuffer` and `vkBeginCommandBuffer`. The DSO also defines
`tower_vk_command_end_for_submit_v1` and `tower_vk_queue_submit_one_v1`
and imports `vkEndCommandBuffer` and `vkQueueSubmit`. Draw reproduced both object hashes and the DSO hash above on GNU ld
2.44. With these inputs, `--hash-style=both` produced both ELF symbol hash
tables. With `--hash-style=gnu`, the DSO SHA-256 was
`6d6860991e9e83b02f8f3918c46833b3773881f071ee1f5b89131fc0a9e06341`.
Rendering verified both hash tables and the loader dependency
`libvulkan.so.1` in the retained host 12 DSO.

Draw verified dynamic resolution to the byte-matched DSO and passed 31/31
recording cases, six signed begin injections and nine injections through
Draw's existing blocking finish. The latter establish the [finish contract](command_finish_v1.md)
for the next Tower entry. Slot 10 subsequently reported linked Vulkan
end/submit runs; Draw requested the matching archive. Draw's application
run against this begin provider is pending.

## Clean repeat and observed results

From the extracted host 12 receipt for assignment
`e576d09c-c639-4b78-aafb-bd90e2144800`, run the following with the local
SDK and a checkout containing `09769704`.

```sh
REPLAY=$(mktemp -d) LOCAL_TOWER=/tmp/end-confirmed-74b8/clean bash replay.sh
```

The clean repeat verifies input hashes, builds the Linux objects and
DSO, and runs the isolated recording loader, gated binary-semaphore case,
one-shot controls and the reusable offscreen caller. The latter runs as:

```sh
./counted_fixture reuse-core13 shaders/produce.comp.spv shaders/triangle.vert.spv shaders/color.frag.spv
```

On the discrete RTX 3090 (PCI 10de:2204, Vulkan 1.3.289, NVIDIA
565.57.01), three frames used the same pool, primary and fence. The
initial begin used flags zero. Each successful fence wait and signaled
status preceded the next fence reset, command reset and one-time begin.
Each frame supplied two 24-byte GPU count/indirect records and two
32-byte guarded captures. Count zero yielded four `112233ff` pixels.
Count one yielded four `4080bfff` pixels. Their staging positions swapped
in frame two. The ordinary Tower, raw Vulkan C and C-through-DSO callers
matched every byte, including guards, with zero synchronization-validation
warnings or errors.

The recording loader exercised zero, −1 and −4 results, including the
same error at either call. The C header check compared all begin-info
member addresses and values. Injected reset/begin failures on frame two
returned −1 without a second submit. All six hardware cases that
returned to the owner for teardown exited 1 with zero validation
warnings/errors. Four fatal recording cases exited 1. Raw C identified
the particular Vulkan expression. The DSO caller identified its single
helper expression for both faults.

In a separate immediate-exit experiment with a live device, one C-through-
DSO reset fault printed the correct diagnostic and then exited 139. All
12 subsequent raw/shared trials (three per stage and path) exited 1.
With the ASan runtime preloaded, shutdown signals also appeared in the raw
Vulkan C path. One such faulting PC was inside the executable range
previously mapped for NVIDIA's eglcore library. The same process loader
log records unloading that library. The cause remains unverified. The
replay checks the diagnostic,
the recorded operations and the actual process exit independently.
Displayed WSI, real device loss, noncoherent readback and Draw execution
of this begin object remain unverified.

### Immediate-exit process evidence

The original C-through-DSO process ran in
`/tmp/begin-confirmed-e576/integrated`, with the SDK, ICD and layer settings
listed in the receipt's `host.env`. The recorded command was:

```sh
timeout -k 2 15 env LD_PRELOAD=/tmp/begin-confirmed-e576/integrated/probe.so \
  TOWER_REUSE_FAULT=reset ./fatal-shared reuse-core13 \
  shaders/produce.comp.spv shaders/triangle.vert.spv shaders/color.frag.spv
```

Frame 0 reached the driver for begin, end, submit and fence wait. The hook
then verified the fence was signaled. On frame 1 the driver reset the fence.
The hook for `vkResetCommandBuffer(cmd, 0)` returned −1 before forwarding.
Frame 1 stopped before begin and submit. The fatal C check printed
`Vulkan error -1 at line 22: tower_vk_command_begin_v1(cmd)`. The shell
logged a segmentation fault and exit 139. The receipt has no raw waitpid
status, stack, PC or faulting module for this process. The exact invocation,
trace and exit are in `immediate-exit/first-run.log`,
`immediate-exit/audit-shared-reset.log` and its sibling `.exit` file.
`lifecycle_probe.tower` identifies which calls the hook forwarded.

Two separate raw C processes ran with ASan preloaded and exited 1. PID
44253 recorded a read SEGV in the reset-fault trial. Its packet lacks a
same-process module attribution. PID 44440 recorded a SEGV in a begin-fault
trial after a successful driver command reset. Its loader trace places its
PC at offset `0xa01960` of `libnvidia-eglcore.so.565.57.01` and records
destruction of that library's link map. Its build ID was
`fa9b77a0b814a164957de2524b78e8d47350f106`. The receipt retains the trace
and address arithmetic in `shutdown-libraries/` and `shutdown-location.txt`.
The immediate-exit cause remains unresolved. Draw's guarded-clear failure
injected −4 at queue submit in a separate application run.

## Frozen raw and linked baseline comparison

The two host 12 executables were built from Tower
`06d47a5d287d4f44e71b5b61a15841f18938b113`. The baseline uses
`begin_raw` from `command_begin_checks.c`. The candidate uses
`begin_from_c` from the same file, which calls the exported
`tower_vk_command_begin_v1` in the adjacent shared library. Both link
the same counted fixture with its local begin definition removed.

| Receipt-relative path | Role |
| --- | --- |
| `pair/bin/raw` | Raw Vulkan C baseline executable |
| `pair/bin/shared` | C caller of the externally linked Tower candidate |
| `pair/bin/libtower_frame_submit.so` | DSO loaded by that caller |
| `bin/command_begin.o` | Standalone C-linkable Tower begin object |
| `pair/run/raw.log`, `pair/run/shared.log` | Same-process device identity, Vulkan trace, guarded bytes and validation for each lane |
| `pair/run/signed.log` | Observed signed results and R/RB traces using the recording loader |

From the extracted receipt, repeat the frozen pair on host 12 with:

```sh
PAIR_RESULTS=$(mktemp -d) bash pair/repeat.sh
```

The command hashes the raw result before launching the candidate and
rechecks it afterwards. Each trace must retain the same handles within
its process. Comparing across processes normalizes only the handle
values. The 12 count and guarded-buffer records are also compared
verbatim. The observed bytes had the same SHA-256 in both runs,
`ecabdc019adb56baf35e5cb30b8f787d22e735ace137710bb762ba0bb9d2e3da`
for the three-frame text extract. Each process reported zero validation
warnings or errors.
