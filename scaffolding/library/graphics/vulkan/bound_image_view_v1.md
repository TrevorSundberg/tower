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
and destruction. The tested provider and device receipt are pending.
