# Create a view of a bound Vulkan image

The Linux x86-64 C entry in [bound_image_view.h](bound_image_view.h) borrows
a live device, a compatible bound image and a complete subresource range.
The caller chooses the view type and format. Pass a separate writable,
initially null output slot.

```c
VkImageView view = VK_NULL_HANDLE;
VkResult result = tower_vk_create_bound_image_view_v1(
    device, image, view_type, format, &range, &view);
```

The helper copies all five range fields into a stack VkImageViewCreateInfo,
sets IMAGE_VIEW_CREATE_INFO, zero flags, null pNext and identity RGBA
mapping, and calls vkCreateImageView once with a null allocator. It gives
Vulkan a private output slot. VK_SUCCESS publishes the returned handle to
the caller. Any nonzero VkResult passes through unchanged and preserves the
caller slot, including when the loader overwrites its temporary.

The caller handles errors, submission and completion. After the last use
retires, destroy the view on the same device with a null allocator, then
destroy the image and free its memory. The helper retains no references
and makes no application allocations.

## Link on host 12

Run from the Tower root with the pinned Linux x86-64 development bootstrap
and Vulkan SDK sysroot from the rendering evidence packet.

```bash
source "$PRIOR/host.env"
v=scaffolding/library/graphics/vulkan
bootstrap/linux-x64/towerc --foundation scaffolding/foundation.tower --library --jobs 1 \
    "$v/bound_image_view.tower" -o bound.o
x86_64-linux-gnu-ld -shared --hash-style=both -z defs bound.o \
    "$TOWER_SDK_ROOT/usr/lib/x86_64-linux-gnu/libvulkan.so.1" \
    -soname libtower_bound_view.so -o libtower_bound_view.so
```

Link bound.o and Vulkan into the application, or link -ltower_bound_view
and supply its library directory at runtime. The object exports one entry
and imports vkCreateImageView. The header uses the SDK's handle, enum,
range and result types. The retained OSD test executable links this helper
alongside its existing region builder and upload recorder.

## Draw integration boundary

Draw confirmed bd203f60b00954acd3b0405720e40a24e94ef430, draw.c blob
c3e7800ae7e7431a3106e2503f7cda1d1a3c6bd2 and tower/vulkan_image.tower
blob 6cda46b30b78cd2fc7a6a16cb532b90e78443972. The replacement site is
the final create-info and call at Tower lines 107–116 or draw.c lines
2060–2065. Draw owns draw_vk_image_create_view, its image allocation and
binding, and its fatal error handling. Its owning constructor can pass
its selected type, format and range to this entry and handle the result
before transferring ownership to its caller.

Host 12 linked the public header from C and compared a raw SDK control,
the shared library and the direct object. Each lane checked all 36 calls,
covering the five OSD sources, a single-layer 2D array with nonzero bases,
a depth view, a cube and a 3D view. Four loader returns per shape checked
the signed result and a clobbered temporary. The successful input shapes
ran on a recording loader. Hardware coverage is the five compatible OSD
source views on the RTX 3090 with independent attachment views. The
[project journal](../../../../docs/temporal-opcode-research-journal.md#port-the-final-bound-image-view-operation)
records the hardware checks, timing and sanitizer coverage. Integration
into the Draw application remains with Draw.
