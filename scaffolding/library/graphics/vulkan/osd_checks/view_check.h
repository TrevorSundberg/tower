#pragma once
#include <vulkan/vulkan.h>

/* Test entry for the SDK control or the separately compiled external client. */
VkResult osd_check_view(VkDevice device, VkImage image, VkImageViewType type,
    VkFormat format, const VkImageSubresourceRange *range, VkImageView *out);
