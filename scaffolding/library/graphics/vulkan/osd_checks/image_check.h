#pragma once
#include <vulkan/vulkan.h>

VkResult osd_check_image(VkDevice, const VkImageCreateInfo *, VkImage *);
