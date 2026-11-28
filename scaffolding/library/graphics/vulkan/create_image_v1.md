# Vulkan image creation for Draw

`draw-tower-create-image/v1` specifies the C entry requested by Draw at
`852d5de3736848ceed696bf617312f75f6dba488`. Draw identified the call in
`image_create_checked`, lines 2076–2084 of `draw.c` (blob
`ff998ac29d15e6ef8ed2c8d06a6a26c08ea6d027`), and its Tower equivalent
in `vulkan_image.tower`, lines 76–93. This record defines the interface
for the Linux implementation assigned to rendering slot 12.

```c
VkResult tower_vk_create_image_v1(
    VkDevice device, const VkImageCreateInfo *info, VkImage *out);
```

The caller supplies a live device, a valid descriptor and a separate
writable, initially null output slot. The descriptor and any storage it
references must stay live through the call. Forward the original descriptor
pointer to exactly one `vkCreateImage` on that device, with a null allocator
and a private handle slot initialized to null. On `VK_SUCCESS`, publish
the handle to the caller. On any other result, preserve the caller's slot
even if the driver writes its private slot. Return the original signed
`VkResult`. The function retains no caller storage.

## Draw ownership and descriptor choices

Draw queries format support using the actual format, type, tiling, usage and
flags. It checks nonzero dimensions, mip and layer limits, maximum extents and
the supported sample count before calling the provider. After success Draw
queries memory requirements, selects device-local memory, accounts for the
allocation and binds at offset zero. Draw owns diagnostics, view creation,
last-use synchronization, destruction and memory release.

| Draw caller | Descriptor supplied to the provider |
| --- | --- |
| OSD textures | 2D, depth 1, caller format and mip count, at least one actual layer, single sample, optimal tiling, exclusive sharing, undefined initial layout, sampled and transfer source/destination usage. |
| Cube-compatible texture | 2D with the cube-compatible flag. Draw supplies the image layers and chooses the view type later. A separate one-layer image may use a 2D-array view. |
| Shared and nuclear volumes | Shared assets can use a 3D image with the asset depth and one physical array layer. Nuclear storage volumes also use storage and transfer-source usage. |

## Acceptance

A recording Vulkan driver must observe the identical device and descriptor
address, including unchanged `pNext` and queue-family pointer/count. Compare
the raw SDK and externally linked C callers. Exercise success and a signed
failure after the driver has written its temporary handle. Check the caller's
descriptor, referenced data and guarded output after return.

For hardware acceptance, identify the Vulkan-selected device and driver,
bind the five OSD-shaped images, sample their subresources, compare guarded
bytes with the frozen reference and verify retirement before destruction.
The recording cases cover additional descriptor shapes. Draw owns the
independent application run with its shipped pack.

For the subsequent bound-view call, Draw independently rebuilt rendering
revision `6b39d552b312a4d79436b49337cf3fff20b9b5cc` and reproduced the
1,040-byte Linux object, SHA-256
`61fdd20166c5844906dfb3320bab3d7b36222268015c546de29a21bc312d0418`.
Draw's two owning constructors subsequently passed their CPU recording tests for bound views. Draw tracks the shipping application hardware run separately.
[Bound-image view build and device evidence](bound_image_view_v1.md#linux-provider-and-hardware-acceptance)

## Linux provider and external C link

The [Tower implementation](create_image.tower) and its [SDK header](create_image.h)
were built at `60b74c561c50ac30b649f99c52f763ad2b57867b`. From the
Tower root on the Linux x86-64 rendering host, with the job's
`inputs/host.env` sourced and an empty output directory in `OUT`:

```bash
v=scaffolding/library/graphics/vulkan
bootstrap/linux-x64/towerc --foundation scaffolding/foundation.tower --library --jobs 1 \
    "$v/create_image.tower" -o "$OUT/create.o"
x86_64-linux-gnu-ld -shared --hash-style=both -z defs "$OUT/create.o" \
    "$TOWER_SDK_ROOT/usr/lib/x86_64-linux-gnu/libvulkan.so.1" \
    -soname libtower_create_image.so -o "$OUT/libtower_create_image.so"
```

Include `create_image.h` in the C caller. Link `create.o` and Vulkan,
or link `-L"$OUT" -ltower_create_image` and make the DSO available to
the loader. The 952-byte object exports the confirmed entry and imports
only `vkCreateImage`. Its SHA-256 is
`9e870edce24bc9759319332a5fc643b4b0cc16cc35d7d04042a17d970e7c174c`.
The 13,536-byte DSO has SHA-256
`e7d7692869d4652c8f6a865b9b836b60a0916400788197e45dce8999470eabfd`.

At `6b66294b3feb60f531db8827791be41a4271b1a8` the SDK control, C linked
to the object, and C linked to the DSO each passed 16 recording calls.
The SDK supplied a 2D image with one layer, a cube-compatible 2D image
with six layers, a 3D storage volume with depth nine and one physical
layer, and a 2D image with four samples, concurrent sharing and a format
list. The recording driver checked device and descriptor pointer identity,
the descriptor bytes, the format-list node and its format array, and the
queue-family array. Each call wrote the private handle before returning
0, −1, −2 or synthetic +1. Only zero published the handle to the guarded
caller slot. The sampler's later view type is a separate caller input.

The retained Tower caller used the DSO for five OSD-shaped images and five
temporary attachments on the Vulkan-selected discrete RTX 3090,
UUID `cd3d9791fe794e0b3ec29fc16b74d31c`, API 1.3.289, NVIDIA 565.57.01.
All five bound image/view pairs survived 16 reads through their final queue
retirement. All 103,158,144 guarded bytes matched the frozen reference,
SHA-256 `140d8d6511a77daee97ebd377dfc34c9c90347cf084d0dd4516e5474315d143b`.
Failure at the second source returned signed −2 after the loader wrote its
slot. The ordinary caller reported the error, released staging and the first
image, and exited 1 before the second bind. Both paths reported zero Vulkan
validation warnings or errors. Draw owns the shipped application check.

Slot 12 job `793660b1-3055-4f07-b4d3-f382be98e200` includes the original
commits, bounded bundle and replay script. The [project journal](../../../../docs/temporal-opcode-research-journal.md#forward-the-callers-image-descriptor-before-allocation)
records measurements and sanitizer limits.

Two additional Linux device links ran the same retained fixture through
the SDK C caller. The test link redirected the image creation call site
to `fixture_issue_image`, compiled once against raw Vulkan and once
against the public shared library. Both C routes reproduced all
103,158,144 bytes and passed the binding, view and retirement checks.
The second-image clobbering OOM also passed on each route.

### Linux release verification

Rendering verified the worker bundle, 573 manifest entries and the object
and shared-library digests above. The optimized provider passes the original
device and descriptor directly to the Vulkan loader. The raw Vulkan C,
C/object and C/shared-library recording paths exercised 16 calls each.
The worker's four deliberate changes to the pointer, private slot or result
handling all failed their respective checks.

In both C device traces, the ten handles returned on success matched the
ten handles subsequently bound by the caller. Five were sampled source
images and five were temporary readback attachments. All five source views
were destroyed on the creating device after the last queue retirement,
followed by their images and bound memory. Rendering compared the full
guarded capture byte for byte against the earlier OSD reference. On injected
failure at the second source, only the first source reached binding, and
the process returned status 1. No real device loss was exercised.

The host address-only checks passed. With synchronization validation enabled,
the full GPU leak check reported 4,187 bytes in 15 allocations on both
baseline and candidate. Ownership remains unresolved. The CPU recording
paths each completed a TSan run. GPU TSan did not complete. Draw's shipping
application and Win64 DLL have separate acceptance runs.

## Draw owning constructors on Linux

Draw adopted the image-create entry at
`c026f0fd1539187538b4b8ceec41687587ea835c` using the provider at Tower
`07587159dbc5606b3e24d85fa6e3babfc2f9b6fe`. Draw independently rebuilt
the 952-byte object and reproduced its digest above. From the Draw root
with the pinned checkouts, Draw ran the following CPU test.

```sh
TOWERC="$bootstrap_checkout/bootstrap/linux-x64/towerc" \
DRAW_TOWER_CREATE_IMAGE_ROOT="$create_checkout" \
DRAW_TOWER_BOUND_VIEW_ROOT="$view_checkout" \
bash tests/vulkan-image.sh
```

The bootstrap was from `a580e70a`, create from `07587159`, and bound view
from `6b39d552`. Draw reported 200/200 expected exits and traces in the
optimized recording matrix, plus two view-failure controls. Both owning
constructors forwarded the borrowed image descriptor and nested storage.
When the create driver wrote a handle and returned −2, the linked owner
stayed empty and stopped before allocation. All eight combinations produced
the same 45 events for the five shipped texture headers. The trace SHA-256
was `e5db18d01d84e0601fab1a1b0b50720219e60aa3cf003db8fda992dbeed86e89`.

On an RTX 5060 Ti, Draw job `7a36cecf-5020-480c-90a9-bbecaacecc2c`
ran two direct-driver paths. Draw verified 529 evidence hashes and both
active texel streams against
`df14881703119d96e6def5700eafd7927d7b83c890bf3e85f77d4db11e679ac4`.
Those executables did not exercise the published bound-view object.
Draw queued job `447eb373-d35d-4ab3-8fa2-5ee2b481f96e` to exercise
the published bound-view provider first, then image creation, binding,
view creation, packed texel readback and HUD comparison with matched inputs.

## Draw object-linked hardware acceptance on Linux

Draw job `447eb373-d35d-4ab3-8fa2-5ee2b481f96e` tested runtime
`d46d9fe5503c43956cef18dac5b38e8a32e8a59b` and fixtures
`942cf1eecbf5a63043949e6c7e3485ed3935db2a` on `f377e943`. The worker
reconstructed the adoption because the earlier Draw manager commit was
unavailable on that worker. Draw identified both released Tower objects
in the run, create at `07587159` and bound view at `6b39d552`.
Rendering independently rehashed the retained objects as
`9e870edce24bc9759319332a5fc643b4b0cc16cc35d7d04042a17d970e7c174c` and
`61fdd20166c5844906dfb3320bab3d7b36222268015c546de29a21bc312d0418`.

Vulkan selected an RTX 5060 Ti (10de:2d04), API 1.4.303, NVIDIA 570.169.
Draw verified 1,263 entries in archive
`7404cbdefddd9eb1afa625965e750440b5e6768b20867ddd83c65e69cf009cef`.
Its C-owner executable was
`2d137b2124fb77f714fb33478e2f55c1e2ff84e1a5a9d540abf7ec62bf14b773`.
The combined executable was
`a2404976de38d356d3804930299f5e807cc9735fcb4dfe79ccbf2c8e1ca5eb6c`.
From the Draw root the following combined capture exited 0.

```sh
"$combined" --offscreen --validate --fixed-time 0 --day-hour 12 \
    --size 1280 800 --frames 4 --osd assets/osd/state.bin \
    --resize-test --no-hud --capture hud-combined.ppm
```

Draw reconstructed every active texture byte from its shipping input.
All three configurations matched the 27,541,504-byte payload SHA-256
`df14881703119d96e6def5700eafd7927d7b83c890bf3e85f77d4db11e679ac4`.
Including 364,544 guard and padding bytes, each capture matched
`bd512fc0888f77285f3fa422326f9923471e5d306b7242455fd13825d87bd76f`.
Frozen HUD, RGB and camera outputs agreed. Native canonical and core checks exited 0.

Draw also injected −2 before the second image creation reached the driver.

```sh
DRAW_TEST_FAIL_SECOND=1 LD_PRELOAD="$image_trace_so" "$combined" \
    --offscreen --osd-test assets/osd/state.bin --fixed-time 5 \
    --size 960 540 --frames 3 --validate --capture "$out"
```

The first atlas reached bind and view creation. The failed image had no
requirements query or bind. The trace contained no teardown of the first
atlas after the diagnostic. Of 41 process outcomes, 33 exited 1 and eight
received SIGSEGV. The fault occurred with Tower creation enabled and
disabled. Its cause remains open with Draw repair `f6abd0c0`. This
receipt covers object linkage. The eleven-entry shared library and
shipping preflight have their own device runs.

### Draw recovers a partially constructed OSD after second-image creation fails

Draw verified device job `f6abd0c0-af2e-443e-9fd0-54cd926b88e6` on worker
revision `f95981f817c078bf571473ab2630b83c958447aa`. It checked 3,242
manifest entries in archive
`ab3f06611bb2c5a8ac299ad12daea4f72e5ff16724cf514b258a7d289ee51981`.
The selected RTX 5060 Ti (10de:2d04) ran Vulkan 1.4.303, NVIDIA 570.169.
The observer injected signed −2 before the second 256×352 sRGB image
creation reached the driver. At that point three uploads had completed
their queue-idle waits. Draw owned the 25,165,824-byte first atlas and
three OSD buffers. The second staging buffer had never been submitted.

The repaired caller preserves the signed error, releases the unsubmitted
staging and completed owners, then shuts down the device. Draw retained
this invocation and raw wait status 256 (normal exit 1):

```sh
env DRAW_TEST_FAIL_SECOND=1 \
  LD_PRELOAD=/home/agent/work/447eb373/evidence/build/image-trace.so \
  /home/agent/work/f6abd0c0/ev/build/bound-control \
  --offscreen --osd-test assets/osd/state.bin --fixed-time 5 \
  --size 960 540 --frames 3 --validate \
  --capture /home/agent/work/f6abd0c0/ev/fault/after/fault.rgba
```

| Draw device trial | Earlier code | Repaired code |
| --- | --- | --- |
| Matched 72-process series per side | 15 SIGSEGV, 57 normal exit 1 | 72 normal exit 1 |
| Second sample, 45 processes per side | 12 SIGSEGV | 0 SIGSEGV |

Both injected full-scene arms exited 1. Six healthy arms passed canonical
and core checks and reproduced the guarded texels and HUD. Other fault
controls on the worker lineage still signaled in 4/16 query trials,
3/4 fenced-submit trials and 2/4 frame-reuse trials. The evidence supports
recovery from this second-create failure. The underlying cause of those
other process signals remains unresolved.

Draw integrated the repair locally at
`ad18ef06908ea1ffbd74d2a45a96f36a652794b9` and verified 512 owner
comparisons, two view-failure controls and the shipping packed CPU test.
The on-device result above belongs to `f95981f8`. Draw owns rollback,
completion and bookkeeping. The Tower creation entry retains its original
success-only output contract.
