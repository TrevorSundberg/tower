#include "calls.h"

VkResult memory_allocate(VkDevice device, const VkMemoryAllocateInfo *plan, VkDeviceMemory *out) {
    return vkAllocateMemory(device, plan, NULL, out);
}

VkResult memory_bind(VkDevice device, VkImage image, VkDeviceMemory memory) {
    return vkBindImageMemory(device, image, memory, 0);
}
