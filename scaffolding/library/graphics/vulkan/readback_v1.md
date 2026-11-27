# draw-tower-rgba8/v1 on Vulkan

Tower base `a580e70af42e67d5309c4121737fa9e21652a9dd`. The CPU copy and
oracle are at `3dd5f11f`, the backend at `dc3c135a`, and the executable
fixture at `f6b850ab`. This slice belongs to Tower rendering. Draw owns its
C implementation. Its source revision was unavailable to this Tower-only
worker and remains a dependency for a cross-project comparison.

The rendering review verified this synchronous Linux x64 reference on an RTX
3090 with a 20-byte destination span. Draw's C oracle at
`36f61b4b312e41846742985bab4884f99f2c62ed` lends 24 bytes from the same
offset. Both layouts have the same 16 active bytes and the same guarded
32-byte result. Host 12 replayed the 24-byte loan on the RTX 3090 and
llvmpipe before and after adopting synchronous queue retirement.

## Byte layout exercised by this fixture

Clear one 2×2, single-sample, single-layer `R8G8B8A8_UNORM` attachment
with linear values (17/255, 34/255, 51/255, 1). Store the attachment.
There are zero draws. Each row contains two consecutive RGBA texels.

| Caller bytes, inclusive | Expected hex |
| --- | --- |
| 0–3 | a5a5a5a5 |
| 4–11 | 112233ff112233ff |
| 12–15 | a5a5a5a5 |
| 16–23 | 112233ff112233ff |
| 24–27 (second row padding) | a5a5a5a5 |
| 28–31 (trailing guard) | a5a5a5a5 |

The caller provides 32 bytes initialized to `a5`, an offset of 4, a writable
span of 24 bytes measured from that offset, and a row pitch of 12.
Source and destination allocations must be live and disjoint. Validate both
full active ranges before copying the first byte. The CPU control places
`01234567` and `abcdefgh` at source offsets 0 and 256 in 264 bytes.
The CPU marker also runs with an exact-fit span of 20. The whole-buffer
literal oracle detects a row swap or a copied padding byte.
A destination pitch of 7, span of 19, or source length of 263 must fail with
all 32 bytes preserved.

The Linux x86-64 backend requires core Vulkan 1.3 with dynamic rendering.
The fixture takes a physical-device index, checks the image format and
sample count, and opens a graphics queue on that device. It prints the
selected device's UUID, type, vendor/device IDs, API, driver and queue.
The caller of `vk_readback_clear` owns the live device and exclusive use of
the queue. The backend creates the image, memory, view, staging buffer,
command pool and fence per invocation.

One primary command buffer transitions the image from undefined to
color-attachment optimal, begins and ends rendering with CLEAR/STORE, then
transitions to transfer-source optimal with a color-write to transfer-read
dependency. A tightly packed image-to-buffer copy and a transfer-write to
host-read buffer barrier follow. The backend submits once and waits on its
fence. It maps the whole staging allocation and invalidates that whole range
when its memory lacks HOST_COHERENT. It copies eight bytes per row into the
caller span, unmaps, destroys the objects and releases their memory.

### Synchronous submission and failure

Both native fixtures borrow the device, queue, primary command buffer and
fresh unsignaled fence through `vk_submit_and_wait`. Keep the queue externally
synchronized and all referenced objects live through return. The helper submits
the command buffer once. It prints the caller's submission message after
successful submit and reports a signaled fence after successful wait.

| Vulkan outcome | Lifetime and caller result |
| --- | --- |
| Submit and fence wait succeed | The caller can map the staging memory, apply the visibility requirements, copy the bytes, and release its objects. |
| Submit returns host or device OOM | The batch left resources unaffected. Return failure and release. |
| Device loss or another indeterminate result from submit | Treat the command as potentially pending. Drain the submitted queue and report failure. |
| Fence wait reports device loss | Return failure and release. The wait establishes retirement for lifetime purposes. |
| Other fence wait error | Report the error and drain the submitted queue. |
| Recovery returns success or device loss | Return failure without consuming the staging data. The caller may release. |
| Other recovery error | Report the original and drain results, flush the diagnostic and abort with the objects live. |

The queue drain covers outstanding work on that queue. Host 12 held another
queue pending on a timeline semaphore through recovery, checked both fences,
then released the second queue. Only the fence-wait error was injected.
See [queue host synchronization](https://docs.vulkan.org/refpages/latest/refpages/source/vkQueueWaitIdle.html),
[submit failure guarantees](https://docs.vulkan.org/refpages/latest/refpages/source/vkQueueSubmit.html)
and [device loss](https://docs.vulkan.org/spec/latest/chapters/devsandqueues.html#devsandqueues-lost-device).

## Build and run

Use the pinned Linux x64 compiler and its adjacent resources. On a Debian
multiarch host the command below uses LLVM 19 tools, glibc development startup
objects, libatomic, the Vulkan loader, a 1.3-capable ICD, and the Khronos
validation layer with debug utils and synchronization validation. Run from the
Tower root in Bash. For an extracted SDK, set `TOWER_SDK_ROOT`, `PATH`,
`LD_LIBRARY_PATH`, and `VK_LAYER_PATH` to its corresponding locations.
`VK_ICD_FILENAMES` can pin one ICD. Physical index 0 selects the first device
exposed under that configuration.

```bash
set -euo pipefail
compiler=bootstrap/linux-x64/towerc
runtime=bootstrap/linux-x64/share/tower/runtime-host-linux-x64.ll
src=scaffolding/library/graphics/vulkan/readback_fixture.tower
sdk=${TOWER_SDK_ROOT:-/}
lib="$sdk/usr/lib/x86_64-linux-gnu"
out=$(mktemp -d)
(cd bootstrap/linux-x64 && sha256sum --check --status SHA256SUMS)
"$compiler" "$src" --library --jobs 1 -o "$out/fixture.o"
opt-19 -passes=internalize,globaldce \
  -internalize-public-api-list=tower_allocate,tower_deallocate,tower_strict_float_binary,tower_strict_float_from_integer,tower_trap \
  "$runtime" -o "$out/runtime.bc"
llc-19 -relocation-model=pic -filetype=obj "$out/runtime.bc" -o "$out/runtime.o"
"$compiler" --link-executable "$out/fixture.o" --link "$out/runtime.o" \
  --link "$lib/libvulkan.so.1" --link "$lib/libatomic.so.1" \
  --sysroot "$sdk" -o "$out/readback_fixture"
"$out/readback_fixture" 0
```

LLVM selects the required entry points and their dependencies from the pinned
host runtime. Tower supplies the application entry and links the executable.
The fixture exits 0 only after both CPU and Vulkan checks pass. An unavailable
device or required validation layer exits 1. An invalid index argument exits 2.

## Host 12 evidence for the original 20-byte run

The executable produced the following results on the assigned host. Each run
used its own explicitly selected ICD, physical device 0, queue family 0 and
queue 0. The hardware run used the installed NVIDIA ICD manifest after
providing its missing EGL dispatch library in a private SDK.

| Observation | Hardware | Software reference |
| --- | --- | --- |
| Selected device | NVIDIA GeForce RTX 3090, discrete, 10de:2204 | Mesa llvmpipe, CPU, LLVM 15.0.6 |
| Device UUID | cd3d9791fe794e0b3ec29fc16b74d31c | 6d65736132322e332e36000000000000 |
| Device API / driver | 1.3.289 / NVIDIA 565.57.01 | 1.3.230 / Mesa 22.3.6 |
| Completion / visibility | Fence signaled, coherent flags 6 | Fence signaled, coherent flags 15 |
| Returned rows 0 and 1 | 112233ff112233ff each | 112233ff112233ff each |
| Guards / validation warnings and errors / exit | Intact / 0 / 0 | Intact / 0 / 0 |

Both runs produced tight active SHA-256
`f02bfdb41309299de61af6a7613ead6e48ee54f0a5bcdab58078f87cf5baeb88`.
The hardware exposes only coherent host-visible memory types. Execution on
noncoherent memory and the device-loss path remain open. The address-only
sanitizer run passed. LeakSanitizer reported 3,511 bytes in eight allocations
with validation-layer allocation stacks. Explicitly freeing the command buffer
or resetting the pool did not change the leak report. ThreadSanitizer failed
at startup because the container denied its personality request. The repository
has no native Tower UBSan profile. This assignment collected no timings.

The original compiler-manager fixture was unavailable in the authorized Tower
ref trees, including main, gh-pages, the two bootstrap/linker tags and the
indexed-indirect rendering ref advertised during validation. The byte contract
above supplied the oracle. SHA-256 of the original `readback_oracle.tower` was
`eafff14f025e76b67a99b7f8e79a72fb89691d10034f496390b5e2fe4e456b66`.
The original fixture checksum and Draw revision remain open for the rendering
manager. The assignment archive contains raw stdout/stderr, exits, checksums,
capability dumps, failed attempts and the incremental Git bundle.

## 24-byte hardware replay

With the same selected device and driver, the active digest matched the
20-byte run. All 32 bytes hashed to
`19e6f721a40fd19ec72a3985f0a91989fb4c3faa85f7b207088a80922303d374`.
The span oracle at `f0183813` hashes to
`b74c48a8da072dcd235efbcb06b2fe64f6f9ce588957e3b67d7fa7d1a5465e44`.
The counted runner has its own [producer, raster oracle and command](counted_draw.md).
Packet `c6689824-b5c5-42c0-a0c5-edcc01f9bddd` includes both real runs,
the CPU-only failure controls, child-process diagnostics, two-queue probe,
sanitizer logs, measurements and exact commands.
