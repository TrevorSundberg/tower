# draw-tower-frame-submit/v1

Draw and Tower rendering agreed on this native library boundary for
Draw's `render_frame` at `30b66f597b33c6f88964779f0ab1b87e847dc839`.
The Tower source base is `2bf097e076107ad57d04cb307462fa45258132a6`.
Draw already implements its asynchronous forwarding call in
`tower/vulkan_commands.tower` as `draw_vk_command_submit_v1`. This
contract sets the acceptance criteria for a reusable Tower equivalent.

## Library operation

Accept a borrowed, externally synchronized queue, a pointer to one prepared
`VkSubmitInfo` and the caller's fence. Call
`vkQueueSubmit(queue, 1, info, fence)` exactly once and return its signed
`VkResult` unchanged. The caller supplies an executable primary command
buffer and a valid descriptor. The library borrows the descriptor and its
host pointer arrays, including the stage mask, through the call. It retains
no host addresses. It neither ends recording nor changes the caller's fence.
The operation introduces no host wait, queue drain, presentation or cleanup.

| Draw path | Command buffers | Wait | Signal |
| --- | --- | --- | --- |
| Offscreen | One primary | None | None |
| Display | One primary | Binary `acquired` at `VK_PIPELINE_STAGE_ALL_COMMANDS_BIT` (0x10000) | Binary `presentReady[imageIndex]` |

A successful return permits the caller to commit frame history and proceed
to presentation. GPU completion is a later event. Keep submitted objects
live through their last use. Read staging or reuse the command buffer only
after its frame fence completes, with the required host memory visibility.
Presentation semaphore reuse follows the acquired swapchain image's
lifecycle. A graphics fence alone does not establish presentation completion.

## Caller order at the Draw revision

1. Draw waits for its one reusable frame fence before reusing the primary
   command buffer. Some uniform and cloud-history preparation precedes acquire.
2. `OUT_OF_DATE` on acquire requests resize and returns before fence reset,
   recording, submission or frame-history commit. `SUBOPTIMAL` marks resize
   and proceeds. Only a returned frame advances the outer frame counters.
3. After accepted acquire, Draw resets the fence **before** command begin.
   It ends recording, prepares the descriptor, then submits. Its separate
   guarded-clear caller resets its fence **after** command end.
4. On successful submit, Draw sets `previousFrame` and `temporalValid` and
   increments `temporalIndex` before presenting. Out-of-date or suboptimal
   present requests resize after that commit. Capture waits before host
   read. Ordinary reuse waits at the next frame entry.
5. A nonzero submit result reaches Draw's fatal diagnostic before history
   advancement or present. The reset fence cannot authorize reuse. Never wait
   for that failed submission to signal it. Raw result forwarding gives the
   caller no permission to release resources of a potentially pending submit.

Tower's existing synchronous readback operation owns a different caller
policy. It reads only after fence success and handles ambiguous retirement
on the submitted queue. [Synchronous completion and failure](readback_v1.md#synchronous-submission-and-failure)

## Evidence and acceptance

Draw reported worker receipt `0802577c-6a4f-4455-8028-52ffbf830192` on its
Vulkan-selected RTX 5060 Ti, PCI 10de:2d04, driver 570.169, API 1.4.303.
Its manager checked 1,849 ordered C/Tower events. The three-frame run was
**offscreen**. Eight frames submitted in nine acquire attempts when one
acquire was forced out of date before fence reset. A separate fixture
exercised real Vulkan semaphores and fences. The displayed presentation path
has source-review coverage. The Draw archive SHA-256 reported by its manager
is `625a12f02632d88c97180238e5fbefec53978f88cd1ab06615dead61e6009f2c`.

The injected `VK_ERROR_DEVICE_LOST` (-4) came from the **guarded-clear**
caller. The interposer returned before invoking the driver on submissions
with a non-null fence. Neither caller waited on that fence. With validation,
Tower exited 1 and C sometimes exited 139 after the diagnostic, including
under the older C control. The cause remains open. Draw has no actual device
loss or failed wait following a real submit in that run.

The agreed conformance checks for the Tower operation follow.

- At the ordinary native caller boundary, compare raw Vulkan and Tower calls
  for both descriptor shapes. Check exactly one submit, queue and fence
  identities, all counts, pointer and stage-mask values, and exact signed
  success and failure results. Detect any unexpected wait, reset, end,
  second submit or host-array mutation.
- On a hardware-selected device, return to the host with a deliberately
  pending submission. Let an independent host action release the work and
  verify completion before reading the result. Exercise binary wait and
  signal separately from actual presentation. Preserve all guarded pixel
  bytes for the offscreen readback differential.
- Run the existing synchronous clear, counted raster and failure controls
  if they share the new primitive. Record source and binary identities,
  exact invocations, selected adapter and driver, validation messages,
  raw outputs and exits. Keep faults injected before submission, failures
  after successful submission, and actual device loss separately attributed.

Draw owns its acquire, resize, fence reset, resource selection, history and
presentation code. Its source review topic was unpublished at the time of
this acknowledgment. At contract acceptance, Tower implementation and a Draw build linked to
that implementation were separate outstanding checks.

## Linux x86-64 implementation and conformance

Include `frame_submit.h` with the standard Vulkan headers. The Tower module
`frame_submit.tower` exports the C symbol `tower_vk_queue_submit_one_v1`.

```c
VkResult tower_vk_queue_submit_one_v1(VkQueue queue, const VkSubmitInfo *info, VkFence fence);
```

Implementation `a2c1560fabf79a98ddcfb839660c33cb2af2cb09` imports
`vkQueueSubmit` from the Vulkan loader. The standalone ELF shared object
has exactly that one import and one export. Tower uses `VkQueueHandle*`,
`VkSubmitInfo*`, `VkFenceHandle*` and an `i32` result. The existing
`vk_submit_and_wait` helper calls the export before applying its synchronous
retirement policy. Draw's measured caller locations are `draw.c:6898`
(`render_frame`) and `draw.c:1862/1874` (command end and submit).

### Link from Draw on Linux x86-64

From the Tower root, compile the source with the pinned Linux bootstrap.
The resulting object can join the application's existing C link with
`-lvulkan`. To reproduce the standalone library, set `vulkan_loader` to
the full path to the Linux x64 SDK's `libvulkan.so.1`. Use the same GNU
linker and SDK as the host 12 receipt for a byte-for-byte comparison.

```sh
v=scaffolding/library/graphics/vulkan
bootstrap/linux-x64/towerc "$v/frame_submit.tower" --library --jobs 1 -o frame_submit.o
x86_64-linux-gnu-ld -shared -z defs frame_submit.o "${vulkan_loader:?}" \
    -soname libtower_frame_submit.so -o libtower_frame_submit.so
```

The worker object SHA-256 was
`8f95a079c561f3ea7b3111f3beffbc3a037ef976ef6f2cd4c145d664813008cd`,
and the DSO SHA-256 was
`3362adc9b78c69490f73799ceb5442d211d68ba2739be434b8d668c99337f951`.
Include `frame_submit.h` at the C call site and pass the prepared descriptor
and original fence. A return of `VK_SUCCESS` means submission succeeded.
Use the fence separately at the caller's read or reuse point.

Receipt `1c0ecea2-1128-48e2-ad91-065fce8a468d` includes `replay.sh`,
a focused Git bundle based on `163976c1`, and hashed inputs and captures.
With the extracted receipt as the working directory and the registered Tower
reader configured, replay on the documented host using:

```bash
REPLAY="$(mktemp -d)" bash ./replay.sh
```

The script builds the direct and integrated Linux executables and runs these
commands from their respective build directories with the NVIDIA ICD selected:

```bash
./readback_fixture 0
./counted_fixture counted-core13 shaders/produce.comp.spv shaders/triangle.vert.spv shaders/color.frag.spv
./recording
timeout -k 2 15 ./gate raw
timeout -k 2 15 ./gate shared
```

The last three commands use the conformance build. `recording` compares a raw
Tower call, a separately linked Tower caller and a Vulkan-header C caller
through the shared object. For zero waits/signals and one binary wait/signal,
the stub verified one call, original queue, fence and descriptor identities,
and identical bytes in the descriptor, extension, handle slots, stage and
value arrays on entry and after return. Both success and injected −4 reached
the caller unchanged. Injection bypassed the driver.

| Check on RTX 3090, PCI 10de:2204, NVIDIA 565.57.01, Vulkan 1.3.289 | Required and observed result |
| --- | --- |
| Clear / counted, direct and integrated | Exit 0, one driver submit, its original fence signaled, zero Khronos validation warnings/errors with synchronization checks enabled. |
| Clear and counted zero | Four `112233ff` pixels. Counted one returned four `4080bfff`. The two GPU count words were 0 and 1, each followed by the little-endian indexed command (3, 1, 0, 0, 0). Every byte matched the prior receipt. |
| CPU / staging layout | 32 caller bytes, offset 4, span 24, row pitch 12. Padding and guards stayed `a5`. The CPU oracle accepted the 24-byte and minimum 20-byte loans and refused the short pitch, span and source. [Readback contract and oracle provenance](readback_v1.md) |
| Host-gated binary submit, raw and shared | A timeline-gated producer signaled a real binary acquired semaphore. The subject waited at ALL_COMMANDS, recorded a GPU event and signaled a second binary semaphore. After normal return the subject fence was VK_NOT_READY. Only then did the host signal the timeline and wait for the subject and consumer fences. The event was set. Both modes exited 0 with zero validation warnings/errors. |
| Existing synchronous failure controls | Positive ownership matrix 0. Standalone terminal child 134. In both ordinary callers, submit OOM 1, recoverable fence-wait fault after real submit 1, injected terminal drain failure 134 before teardown. |

The loader borrows host storage through return. The caller retains the queue
submission's device objects until retirement, including the final consumer of
each binary semaphore. An unsuccessful raw return cannot authorize a staging
read, frame-history commit, fence reuse or blanket release. Submit OOM leaves
the referenced state unaffected. An indeterminate or device-lost submit
requires the caller's retirement policy. Hardware coverage here is offscreen.
Displayed WSI, Draw linked to this export, real device loss, Windows and
Draw's intermittent validated-C exit 139 remain outside the observed results.
