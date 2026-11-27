#pragma once
#include <vulkan/vulkan.h>

/* Private to the SDK qualification PEs. */
VkResult osd_check_preflight(VkPhysicalDevice, const VkImageCreateInfo *,
                             VkImageFormatProperties *, VkBool32 *);
void osd_observe_query(PFN_vkGetPhysicalDeviceImageFormatProperties);
