#include <vulkan/vulkan.h>

/* Recording loader transport. Each calling test thread installs its own PFN. */
static _Thread_local PFN_vkCreateImageView observe;
void osd_observe_view(PFN_vkCreateImageView callback) { observe = callback; }

VKAPI_ATTR VkResult VKAPI_CALL vkCreateImageView(VkDevice device, const VkImageViewCreateInfo *info,
    const VkAllocationCallbacks *allocator, VkImageView *out) {
    return observe(device, info, allocator, out);
}
