#pragma once
#include <vulkan/vulkan.h>

typedef VkBool32 OsdAllocationPlan(VkDevice device, VkImage image, const VkMemoryType *types,
        uint32_t count, VkMemoryPropertyFlags required, VkMemoryAllocateInfo *out);
OsdAllocationPlan osd_check_allocation;
