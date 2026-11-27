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
C boundary using borrowed stand-in handles. An application run on Draw's
full device profile remains an integration check.

The rendering manager rebuilt the DSO from the retained object, using GNU
ld 2.44 and the Debian Vulkan loader. The resulting DSO matched the
worker digest above. In a local SDK-header recording test the raw C and
dynamically linked C callers each forwarded sizes 1, 73, 67,108,864 and
4,294,967,369 with the expected handle identities, offsets, order and global
dependency. The manager compared the two compressed 64 MiB trial streams
and the small captured streams byte for byte with an independent repeating
payload and guard sequence. Draw application execution through this recorder
is pending.
