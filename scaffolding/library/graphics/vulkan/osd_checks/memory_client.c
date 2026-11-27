#include "../image_memory.h"

VkResult osd_allocate_memory(VkDevice device, const VkMemoryAllocateInfo *info, VkDeviceMemory *out) {
#ifdef OSD_RAW_SDK
    VkDeviceMemory memory = VK_NULL_HANDLE;
    VkResult r = vkAllocateMemory(device, info, NULL, &memory);
    if (r == VK_SUCCESS) *out = memory;
    return r;
#else
    return tower_vk_allocate_memory_v1(device, info, out);
#endif
}

VkResult osd_bind_memory(VkDevice device, VkImage image, VkDeviceMemory memory) {
#ifdef OSD_RAW_SDK
    return vkBindImageMemory(device, image, memory, 0);
#else
    return tower_vk_bind_image_memory_zero_v1(device, image, memory);
#endif
}
