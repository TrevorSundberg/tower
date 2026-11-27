#include "calls.h"

#ifdef IMAGE_MEMORY_PROVIDER_HEADER
#include IMAGE_MEMORY_PROVIDER_HEADER
#else
/* Contract 21e0d03b. Declarations allow a COFF compile before release. */
extern AllocateImageMemory tower_vk_allocate_memory_v1;
extern BindImageMemory tower_vk_bind_image_memory_zero_v1;
#endif
_Static_assert(_Generic(&tower_vk_allocate_memory_v1, AllocateImageMemory *: 1, default: 0),
               "allocation signature differs from the SDK contract");
_Static_assert(_Generic(&tower_vk_bind_image_memory_zero_v1, BindImageMemory *: 1, default: 0),
               "binding signature differs from the SDK contract");

VkResult memory_allocate(VkDevice device, const VkMemoryAllocateInfo *plan, VkDeviceMemory *out) {
    return tower_vk_allocate_memory_v1(device, plan, out);
}

VkResult memory_bind(VkDevice device, VkImage image, VkDeviceMemory memory) {
    return tower_vk_bind_image_memory_zero_v1(device, image, memory);
}
