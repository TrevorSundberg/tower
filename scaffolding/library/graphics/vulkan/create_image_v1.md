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
