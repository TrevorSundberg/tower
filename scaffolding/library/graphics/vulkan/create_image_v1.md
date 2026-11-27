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
Draw's shipping view integration and hardware acceptance remain pending.
[Bound-image view build and device evidence](bound_image_view_v1.md#linux-provider-and-hardware-acceptance)
