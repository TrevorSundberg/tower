#ifndef TOWER_VULKAN_IMAGE_FORMAT_PREFLIGHT_H
#define TOWER_VULKAN_IMAGE_FORMAT_PREFLIGHT_H
#include <vulkan/vulkan.h>
#ifdef __cplusplus
extern "C" {
#endif

/* Borrow the device and descriptor. Supply distinct, writable outputs separate
 * from the inputs. VK_SUCCESS publishes the queried limits and capacity decision.
 * Every other result preserves both outputs. */
VkResult tower_vk_image_format_preflight_v1(VkPhysicalDevice physical,
    const VkImageCreateInfo *info, VkImageFormatProperties *properties, VkBool32 *supported);

#ifdef __cplusplus
}
#endif
#endif
