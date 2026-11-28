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
32-byte result. The separate 24-byte fixture was verified at rendering
revision `9d4f7286`. These SDK clear callers retain the 20-byte loan.

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
| 24–31 | a5a5a5a5a5a5a5a5 |

The caller provides 32 bytes initialized to `a5`, an offset of 4, a writable
span of 20 bytes measured from that offset, and a row pitch of 12.
Source and destination allocations must be live and disjoint. Validate both
full active ranges before copying the first byte. The CPU control places
`01234567` and `abcdefgh` at source offsets 0 and 256 in 264 bytes.
The whole-buffer literal oracle detects a row swap or a copied padding byte.
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

Both Linux clear entry points and counted capture use the same completion
function. The raw clear calls `vkQueueSubmit(queue, 1, &submit, fence)`.
The external clear calls the public DSO entry
`tower_vk_queue_submit_one_v1(queue, &submit, fence)`. Each retains its own
fence and resources. A host or device out-of-memory submit permits immediate
cleanup. Any other submit error skips the unsignaled fence and drains the
submitting queue. A fence wait reporting device loss permits cleanup. Other
fence errors drain that same queue. Queue idle success or device loss permits
cleanup after the error. Any further drain error flushes both signed VkResults
and aborts before releasing the handles. Every failure skips the mapped
read and preserves the borrowed destination. [External clear build](graphics_so_linux.md#build-and-run-an-ordinary-tower-application-on-linux)

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
"$compiler" "$src" --library --jobs 1 --foundation "$PWD/scaffolding/foundation.tower" -o "$out/fixture.o"
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

## Host 12 evidence

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
above supplied the oracle. SHA-256 of `readback_oracle.tower` is
`eafff14f025e76b67a99b7f8e79a72fb89691d10034f496390b5e2fe4e456b66`.
The original fixture checksum and Draw revision remain open for the rendering
manager. The assignment archive contains raw stdout/stderr, exits, checksums,
capability dumps, failed attempts and the incremental Git bundle.
