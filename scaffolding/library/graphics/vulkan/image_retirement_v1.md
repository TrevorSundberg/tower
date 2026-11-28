# Destruction of retired Vulkan image handles

`draw-tower-retired-image/v1` covers the final three Vulkan calls in Draw
`9fc0c9beec514d161032be7337cc7dcacaee0ba2`, in `image_destroy` and
`draw_vk_image_destroy`. The [Tower implementation](image_retirement.tower)
and [public C header](image_retirement.h) are at
`5dea58767f60f2de8a76cd933ef3818ad494b375`.

```c
void tower_vk_destroy_retired_image_v1(VkDevice device, VkImageView ownedView,
                                       VkImage ownedImage, VkDeviceMemory ownedMemory);
```

Borrow the live creating device and transfer each non-null owned handle for
destruction. The entry calls `vkDestroyImageView`, `vkDestroyImage` and
`vkFreeMemory` in that order, skipping each null handle independently. Each
call uses the supplied device and a null allocator. Resources must have
been created with compatible allocator semantics. With all three handles
null the function returns without a loader call.

**Completion belongs to the caller.** All submitted uses must have finished.
Release dependent views before destroying their image. Pass memory only when
the caller can free that allocation, including any other bound resources.
The function neither waits nor returns a completion status. An outstanding
submit or failed wait does not authorize destruction.

Draw passes handle values from its live owner. After return it decrements
live bytes by the saved allocation size and its allocation count by one if
the original memory handle was non-null. It keeps peak counters and clears
the entire 64-byte image record. Draw separately destroys extra tree mip
views, keeps swapchain-owned image handles out of this operation and releases
offscreen aliases once through the color image owner. Draw reports that normal
resize and shutdown use a device-idle boundary and complete any subsequent
capture before destruction. Fault recovery stays with that owner.

## Build and recording check

From the Tower checkout, with a Linux x64 C compiler and Vulkan SDK headers:

```bash
set -eu
v=scaffolding/library/graphics/vulkan
tower=(bootstrap/linux-x64/towerc --foundation scaffolding/foundation.tower --library --jobs 1)
"${tower[@]}" "$v/image_retirement.tower" -o retired.o
"${tower[@]}" "$v/osd_checks/retired_image_cases.tower" -o cases.o
cc -std=c11 -Wall -Werror -c "$v/osd_checks/retired_image_client.c" -o client.o
cc cases.o client.o retired.o -o check-retired
./check-retired
```

To exercise a standalone shared provider, set `VULKAN_LOADER` to the absolute
path of the target's `libvulkan.so.1`. The recording executable exports the
three driver callbacks. An application uses the actual Vulkan loader.

```bash
ld.lld-19 -shared -z defs -soname libtower_retirement.so retired.o "$VULKAN_LOADER" -o libtower_retirement.so
cc -rdynamic cases.o client.o -L. -ltower_retirement -o check-shared
LD_LIBRARY_PATH="$PWD:$(dirname "$VULKAN_LOADER")" LD_DEBUG=bindings ./check-shared
"${tower[@]}" "$v/image_retirement.tower" --target x86_64-w64-windows-gnu -o retired.obj
```

Rendering compiled the separate SDK caller with TinyCC on Debian x64 and used
the published bootstrap (SHA-256 `7430bdb39f73b285687fedb2945d370eaf51d2cc2fa289e5e0041cc15ad1b896`).
Both recording executables exited 0 with empty stdout. Each exercised eight
nullable handle subsets and an all-null call after each. The fixture checks
device/child identity, a null allocator, exact order and call count. A mutated
provider that destroyed the image first exited 4 on mask 3 (view plus image).
Loader bindings resolved the public entry to the shared provider and its three
driver imports to the recording executable.

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| Linux x64 ELF object | 1,152 | `0c7dcd9d95ad0e29901df4c423164f9efaecc4a71e5bbc15bbc7704f773d220a` |
| Linux x64 DSO, LLD 19.1.7 | 2,848 | `86c7fa8ccfe5f70e57d979c31c62b7143ef4cdd9b7c2321f5f9988de2a5808eb` |
| GNU Win64 AMD64 COFF object | 781 | `bf3fa4e119e7a71469f1e6eb6739e63a88f147b516fd27adda2541efaf0d8b57` |

Draw separately exercised its two existing implementations across all eight
subsets, then called each again on the cleared owner. Its recording driver
observed the accounting change after the free and all 64 bytes cleared.
Draw reported the full-call trace SHA-256
`fd488c43641dff81ef9b18969b6fbf3c6b434a1f0ecfdd6b10113efad285bfea`.
These subsets exercise CPU call policy. Draw later checked the standalone provider from both Linux image owners.
[Draw recording and construction result](https://github.com/TrevorSundberg/tower/blob/de7e792d2eab23587494cbf637185024383d259b/scaffolding/library/graphics/vulkan/image_retirement_v1.md#draw-adoption-with-the-fifteen-entry-graphics-library)

The packaged Linux entry was tested on an RTX 3090 and Win64 ordinal 16 on
a Quadro RTX 6000 under Wine. Shipping Draw qualification of these packages
and physical Windows execution have their own acceptance checks.
[Linux package](graphics_so_linux.md)
[Win64 package](https://github.com/TrevorSundberg/tower/blob/8ac14905c24b806449243348591f7164e06d2d90/scaffolding/library/graphics/vulkan/graphics_dll_windows.md#retiring-an-owned-image-at-ordinal-16)
