# Bound-image view creation for Draw

Draw-confirmed C contract `draw-tower-bound-image-view/v1`. Draw source
`bd203f60b00954acd3b0405720e40a24e94ef430` calls `osd_create` →
`image_create_layers` → `image_create_view` → `image_allocate`.
Draw identified the final view operation in `draw.c` lines 2060–2065
(blob `c3e7800ae7e7431a3106e2503f7cda1d1a3c6bd2`) and in
`tower/vulkan_image.tower` lines 107–116 (blob
`6cda46b30b78cd2fc7a6a16cb532b90e78443972`). Its existing
`draw_vk_image_create_view` owns the image constructor, including export
ID, image allocation, memory accounting and binding. The new entry starts
after binding, with the existing image and its creating device.

```c
VkResult tower_vk_create_bound_image_view_v1(
    VkDevice device, VkImage image, VkImageViewType view_type, VkFormat format,
    const VkImageSubresourceRange *range, VkImageView *out);
```

The caller supplies compatible live device and image handles, a valid
borrowed range and a separate, writable, initially null output slot.
The implementation copies the explicit type, format and complete range
into a local `VkImageViewCreateInfo`. Use `VK_STRUCTURE_TYPE_IMAGE_VIEW_CREATE_INFO`,
null `pNext`, zero flags and identity swizzles in all four components.
Call `vkCreateImageView` once with a null allocator and a private handle
slot. On `VK_SUCCESS`, publish that handle to the caller. On any other
result, preserve the caller's output and return the signed driver result
unchanged. Test an error with a driver double that also writes the private
slot. This output-preservation rule is part of the library contract.

Draw supplies the range and view type independently. Its five OSD views
use COLOR, base mip and base array layer zero.

| OSD image | Type | Format | Mips | Layers |
| --- | --- | --- | ---: | ---: |
| Fonts | 2D array | R8_UNORM | 1 | 6 |
| Bitmap and inverted, each | 2D | R8G8B8A8_SRGB | 2 | 1 |
| Firmware | 2D array | R8G8B8A8_SRGB | 1 | 4 |
| Images | 2D array | R8G8B8A8_SRGB | 1 | 2 |

A positive serialized layer count of one still selects a 2D array in
Draw; a raw zero selects 2D with one actual layer. Other Draw callers
use cube-compatible images, explicit 3D views, depth aspects and
nonzero base mip levels. The caller chooses the compatible type, format
and range. Draw owns fatal diagnostics, descriptor references and
retirement. It destroys the view with the same device and null allocator
after the last submitted use, then destroys the image and releases its memory.

The Linux worker will compare raw C and C linked to the Tower provider
against a recording driver, then verify all five sampled images and their
retirement on its existing device.

## Draw acknowledgement

Draw independently fetched Tower `37eb17b43c6c8c152c43fd429b9f3cfee54af2d9`
and compared the contract against Draw `bd203f60b00954acd3b0405720e40a24e94ef430`.
It confirmed explicit type and range, including a one-layer array, one
null-allocator call with identity swizzles, success-only output publication
and exact signed driver status. Draw retains allocation, fatal diagnostics
and destruction. The tested Linux provider and device receipt follow below.

## Linux provider and hardware acceptance

The [Tower implementation](bound_image_view.tower) and [C header](bound_image_view.h)
were tested at `69d838e7d638812b71ef02a5bb06dd5662ed4059`. From the Tower root,
use the [object and shared-library link commands](bound_image_view.md#link-on-host-12).
The 1,040-byte object has SHA-256
`61fdd20166c5844906dfb3320bab3d7b36222268015c546de29a21bc312d0418`.
The 13,552-byte shared library has SHA-256
`ea76e706492cb7d449ce42d63f4fcf5e980e069cad0390ac47cede859e5e658f`.

In slot 12 job `793a7dca-648d-45bb-a52f-eb64469b3796`, the raw Vulkan SDK
caller, C linked to the object, and C linked to the shared library agreed on
all 36 recording cases. A further four-call test in each of the raw and
shared-library callers held the image, one-layer range, format and output
address fixed. Changing only the requested type produced a 2D or 2D-array
view as requested. In both cases a driver that wrote its private result before
returning signed −2 left the caller's output unchanged.

The Vulkan-selected RTX 3090 (API 1.3.289, NVIDIA 565.57.01) sampled all five
synthetic OSD images. Rendering compared the complete 103,158,144-byte guarded
capture against the retained reference, SHA-256
`140d8d6511a77daee97ebd377dfc34c9c90347cf084d0dd4516e5474315d143b`.
All five source views survived the 16 sampled readbacks. After the final
queue retirement, each view and then its image were destroyed on the creating
device before its memory was freed. Injected failure of the second view
published no handle. The caller released both bound images and the one
successfully created view. Normal hardware runs reported zero validation
warnings or errors.

Full hardware LeakSanitizer with synchronization validation enabled reported
4,187 bytes in 15 allocations on both the baseline and candidate. Ownership
is unresolved. Address-only checks passed, and the full leak check passed
with synchronization validation disabled. ThreadSanitizer stopped at startup
in five attempts. Draw's application integration and Win64 DLL execution
remain separate acceptance steps.

## Draw constructor adoption on Linux

Draw integrated this provider locally at
`a0ee83752c68f3fcff54f0128a71d8bcdc753b4b`. From the Draw root,
with the provider checked out at Tower `6b39d552b312a4d79436b49337cf3fff20b9b5cc`
and the bootstrap compiler from `a580e70af42e67d5309c4121737fa9e21652a9dd`,
Draw ran the following command.

```sh
DRAW_TOWER_BOUND_VIEW_ROOT="$provider_checkout" \
TOWERC="$bootstrap_checkout/bootstrap/linux-x64/towerc" \
bash tests/vulkan-image.sh
```

Draw reported exit 0. Its owning C and Tower constructors each ran 23
recording-driver scenarios through both the raw Vulkan call and the public
provider. Outputs matched across the 92 runs. In two additional controls,
the driver wrote a handle and returned signed −2. Both public output slots
remained null. For the five headers from Draw's texture pack, image creation,
binding, view creation and teardown yielded identical 45-line traces.
Draw's trace SHA-256 is
`e5db18d01d84e0601fab1a1b0b50720219e60aa3cf003db8fda992dbeed86e89`.

Draw job `7a36cecf-5020-480c-90a9-bbecaacecc2c` exercised two direct-driver
paths on the RTX 5060 Ti. Draw verified 529 evidence hashes and both active
packed texel streams. Neither executable linked the published `bound.o`.
Slot 10 job `447eb373-d35d-4ab3-8fa2-5ee2b481f96e` is queued to exercise
the published bound view first and then the combined create/bind/view/pack/HUD
path. The shipping linked hardware gate is open. Draw also exercised both
providers together in its [CPU constructor tests](https://github.com/TrevorSundberg/tower/blob/5dd53312b20bd063cd9d469dc1549d3720017a2b/scaffolding/library/graphics/vulkan/create_image_v1.md#draw-owning-constructors-on-linux).
