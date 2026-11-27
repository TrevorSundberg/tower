# Staged Vulkan buffer upload recording v1

The native C entry implements Draw's staged recording at
`41d8b9badce3e6520d43b798c44cbb7e19b6d57c`, draw.c blob
`7b6ee8f42bbde29790364d3de73a5d75216cbf1d`. The rendering manager
supplied the source contract for `memory_barrier` at lines 1943–1952 and
`buffer_upload` at line 1954, staged lines 1970–1979. Tower implementation
`2ebc7ab2f` uses the existing VkBufferCopy, handle and vkCmdCopyBuffer
declarations. Include `buffer_upload_record.h` on Linux x86-64.

```c
void tower_vk_buffer_upload_record_v1(VkCommandBuffer cmd, VkBuffer staging,
                                      VkBuffer dst, VkDeviceSize size);
```

Pass each handle and the logical byte count by value. The primary must
be recording outside a render pass on a queue family supporting these
commands, with the Vulkan 1.3 synchronization2 feature enabled and the
required host synchronization. Supply valid buffers on its device with
bound memory, TRANSFER_SRC and TRANSFER_DST usage respectively, and
non-overlapping, in-bounds byte ranges `[0, size)`. Size must be positive.
An odd size is passed unchanged. Invalid inputs are outside the operation's
preconditions. There is no library refusal or status result.

| Order | Native Vulkan call and live arguments |
| --- | --- |
| 1 | `vkCmdCopyBuffer(cmd, staging, dst, 1, &region)`. The sole VkBufferCopy contains srcOffset 0, dstOffset 0 and the original VkDeviceSize. |
| 2 | `vkCmdPipelineBarrier2(cmd, &dependency)`. VkDependencyInfo contains DEPENDENCY_INFO, null pNext, flags 0, memoryBarrierCount 1 and a pointer to one global VkMemoryBarrier2. Both buffer and image counts are zero and both pointers are null. |
| Global scope | MEMORY_BARRIER_2, null pNext, TRANSFER (0x1000) / TRANSFER_WRITE (0x1000) to ALL_COMMANDS (0x10000) / MEMORY_READ (0x8000). These four masks are 64-bit. The global descriptor has no resource ranges or queue-family fields. |

The driver borrows the region during the first call and the dependency and
memory descriptors during the second. All are local to the recorder.
Draw owns the coherent staging memcpy, begin, device-local destination with
`usage | TRANSFER_DST`, command buffer, pool and bound memory. The staged
branch calls its unfenced same-queue finish and releases staging after
retirement. Its direct-mapped branch bypasses the recorder and finish.

The separate finish returns the first signed end, submit or idle result.
An idle failure after acceptance leaves retirement unknown. The caller
keeps resources live until it can establish completion or apply its device
failure policy. The asynchronous frame path has its own fence. [Finish contract](command_finish_v1.md)

## Build and link

From the Tower root on Linux x86-64, use the checked-in bootstrap and GNU ld.
Set `VULKAN_LOADER` to the full path to the target libvulkan.so.1.

```bash
v=scaffolding/library/graphics/vulkan
loader=${VULKAN_LOADER:?Set VULKAN_LOADER to the Linux x64 libvulkan.so.1}
out=$(mktemp -d)
bootstrap/linux-x64/towerc "$v/buffer_upload_record.tower" --library --jobs 1 \
    -o "$out/buffer_upload_record.o"
x86_64-linux-gnu-ld -shared --hash-style=both -z defs "$out/buffer_upload_record.o" \
    "$loader" -soname libtower_buffer_upload.so -o "$out/libtower_buffer_upload.so"
```

Link the C consumer with the object and Vulkan loader, or use
`-L"$out" -ltower_buffer_upload` and make the DSO available at runtime.
The object imports only vkCmdCopyBuffer and vkCmdPipelineBarrier2. Its
sole export is tower_vk_buffer_upload_record_v1. The existing queue and
finish library links independently. The packet's build.sh compiles the
same Vulkan-header C source as a raw control and as an external consumer.
It exercises both object and DSO linkage.

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| buffer_upload_record.o | 1152 | `345a7293e03e4263d5b7fb17b84027b42baf758956cbf91b9b3a78f8a9bd84e8` |
| libtower_buffer_upload.so | 13600 | `e1fd65c46aedd00e4f23df0d5f1c9e5303cc8a95b0981f976584801dd36a95eb` |

## Hardware evidence

Job `02f6d984-af93-43f1-ac69-b7eea816b045` includes a local source bundle
from `44f2cdf6`, inputs, object/DSO, raw captures, timing samples, traces
and sanitizer logs. From the extracted packet run:

```bash
sha256sum --quiet -c SHA256SUMS
LOCAL_TOWER=/tmp/finish-b820dd37/src REPLAY="$(mktemp -d)" bash replay.sh
```

The isolated test requested Vulkan 1.3, queried synchronization2 and
enabled it on the selected discrete GeForce RTX 3090, Vulkan 1.3.289,
driver 565.57.01, device UUID cd3d9791fe794e0b3ec29fc16b74d31c,
queue family/index 0/0. Memory flags were 6/1/6 for coherent staging,
device-local destination and coherent readback. The fixture adds TRANSFER_SRC
usage to the destination for observation. After upload finish a fresh
recording copies the entire destination to offset 4 in readback, then
uses a separate TRANSFER_WRITE to HOST_READ buffer barrier and retires
before the host checks or reuses storage.

| Logical upload | Retired trials per lane | Checked bytes per trial | SHA-256 of all guarded captures, raw and shared |
| --- | ---: | ---: | --- |
| 73 bytes | 64 | 88 | `464400b39d3b85b232fc092a41fa409846d7ad845e6383f5b69752514b98cdbe` |
| 64 MiB | 2 | 67108880 | `00ff1657355954087fdc48ca2cb3acc6d2bd6f0b487aaf58a081595342a4ac71` |

The first payload byte sequence is `(i*3+2) mod 256`, the second uses
seed 151. The first 73 bytes hash to
`47c0f4158f71478c2936c056cbbce361ebf548aa47776bccbd2238537c1de053`.
The destination suffix retains seven or eight 3c bytes, respectively.
Four a5 bytes guard each end of the mapped readback. An independent
Tower byte stream reproduced every byte. Raw and shared hardware runs
exited 0 with zero Khronos synchronization-validation warnings/errors.
The 73-byte direct-object consumer passed the same checks. Recording-only
checks additionally observed VkDeviceSize 4294967369 across the native
C boundary using borrowed stand-in handles. Draw's application used its
Vulkan 1.4 device profile in the [combined upload runs](#draw-hardware-results-for-the-combined-upload).

The rendering manager rebuilt the DSO from the retained object, using GNU
ld 2.44 and the Debian Vulkan loader. The resulting DSO matched the
worker digest above. In a local SDK-header recording test the raw C and
dynamically linked C callers each forwarded sizes 1, 73, 67,108,864 and
4,294,967,369 with the expected handle identities, offsets, order and global
dependency. The manager compared the two compressed 64 MiB trial streams
and the small captured streams byte for byte with an independent repeating
payload and guard sequence.

## Draw caller with both published entries

Draw reported local staged `buffer_upload` adoption at
`98c81d98e2dc017baee86ef7a24c017028ffd968`. It independently fetched
Tower `dadf38c072c6757277d4043cb358e3310af0d6a1` and rebuilt the
1,152-byte recorder object with the SHA-256 listed above. Using actual
Draw caller excerpts, it tested both recorder choices (raw C and Tower)
with both finish choices (raw C and the published Tower blocking finish).
Each of the four configurations passed the same 11 recording-loader cases.
Those covered the 73-byte copy and barrier masks, direct-mapped bypass,
the first signed error, and staging retention when retirement was unknown.
Draw's combined test ELF had SHA-256
`d22b6de3125a9311a8db633a0e69c47cf16cf43a86a4f077896914b13f9f5693`.

## Draw hardware results for the combined upload

Draw tested `78f3ce01689a95d8f6d4b903b8487caaa52c0cf2` with tests
`600f45da0b9df446bde74dd59765b6459d3c6329`, Tower recorder
`dadf38c072c6757277d4043cb358e3310af0d6a1` and blocking finish
`4b1f0af2bcfcbb9d8d7d86eae7fa885ffb1ed8e4`. Draw verified 703 file
digests for slot 10 job `3c86f4a7-4792-49b1-8548-bee768a5ec13`.
The archive SHA-256 was `85a5ac5771e0dd9ea998f7a85dcac7a576f86e81d77deeff57edcfe723da04cd`.
The tested Vulkan device was an RTX 5060 Ti, Vulkan 1.4.303, NVIDIA 570.169.

Draw checked 16 guarded readbacks across four recorder/finish combinations,
two payload sizes and two upload paths. The mapped path bypassed the
recorder. Staged uploads released staging after a successful wait-idle on
the submitting queue. The 73-byte payload used `(37*i+11) mod 256`. The
64 MiB payload was filled with hex `5a`. Each logical readback had 16
bytes of `c7` at either end.

| Guarded bytes | SHA-256 |
| ---: | --- |
| 105 | `6f83b083f799c51fa51ad8b60061eaefa615edb15ac1baeb5b055fa22c0d8335` |
| 67,108,896 | `b36df9bbdb0b7c344b42d721ead2b068c2d19537438273073d574a78db138968` |

Draw ran each of its four shipping executables with these arguments.
Each exited 0 and produced PPM SHA-256
`42c6fe3a6e638e17551cb10c267d48451b1d8ef0f9fb2835df85a2b3a606f57b`.

```sh
"$draw_exe" --gpu-check --offscreen --staged-uploads --validate --no-nuclear \
    --frames 3 --size 1280 800 --capture OUT.ppm
```

**Injected failures.** The cells below are OS process statuses.
Each column names the Vulkan call and its injected signed result.
The required fatal exit was 1 in every case.

| Recorder | Finish | Command end (−1) | Queue submit (−2) | Queue idle (−1) |
| --- | --- | ---: | ---: | ---: |
| Raw C | Raw C | 1 | 1 | 139 |
| Tower | Raw C | 139 | 1 | 139 |
| Raw C | Tower | 1 | 1 | 1 |
| Tower | Tower | 1 | 1 | 1 |

After each injected idle failure following an accepted submit, staging
remained live through a separate successful drain on the same queue.
These exits prompted Draw repair `97562fd0`, tested below.
The intermittent SIGSEGV has no established cause.

Rendering rehashed the retained recorder and finish objects, reproduced
both guarded digests and the shipping PPM digest from expected bytes,
and reran its local CPU recording checks. Draw verified the device
captures and process statuses. The earlier finish-only trial has its
own [Linux device and fault evidence](https://github.com/TrevorSundberg/tower/blob/e02ada10a19bb2ddeefc916e388f9cce63dee68f/scaffolding/library/graphics/vulkan/command_finish_v1.md#draw-linux-hardware-upload-and-fatal-exits).

## Draw Linux staged-upload recovery

Draw accepted the shipping staged-upload failure path at
`6a575cb85929d432932d7ecd61f1e57e0addae26`, tests
`f053a281d92f01b323d5d47c621f5b6777f9ac05`, with the Tower recorder and
finish providers identified above. Draw verified 1,237 archive entries and
the raw waitpid statuses for job `97562fd0-fd7d-418d-8dab-7995188b9079`.
The archive SHA-256 is `01e827037f7495252c4ccc3ed622be72e55d327ad733bc19b3be948f3468c3d7`.
Vulkan selected an RTX 5060 Ti (10de:2d04), API 1.4.303, NVIDIA 570.169.

Draw ran the shipping invocation above with an injected error at command
end (−1), queue submit (−2), or queue idle (−1). With capture enabled, 34
trials per failure across the four C/Tower recorder and finish combinations
gave 408 processes. Another 204 ran the C recorder without capture. All
612 emitted the expected signed error and exited normally with status 1
(raw wait word `0x0100`). Zero processes were signaled.

In the traced idle-failure case, NVIDIA accepted the unfenced submission.
Draw then waited again on the same queue. That recovery wait succeeded
before it unmapped or freed resources or destroyed the pool and device.
The independent single-fault injector had no exit hook. A CPU double covered
the case where both queue and device retirement remain unknown. Draw retained
both buffers and the context in that case. Real device loss remains untested.

Draw also checked eight guarded readbacks at 73 bytes and 64 MiB, both
raster PPMs against the `42c6fe3a` digest above, and both frozen scene and
camera pairs. The canonical render and core checks exited 0. Tower rendering
independently reconstructed both guarded reference digests and checked the
trial totals. Draw owns the device captures and waitpid evidence. This
acceptance covers the repaired Linux staged-upload caller. General scene
startup failures and Windows recovery require separate evidence.
