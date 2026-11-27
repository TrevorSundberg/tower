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

The Tower library candidate needs the following evidence before adoption.

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
this acknowledgment. Tower-side implementation and a Draw build linked to
that implementation are separate outstanding checks.
