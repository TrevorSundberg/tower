#ifndef TOWER_VULKAN_TIGHT_COLOR_REGIONS_H
#define TOWER_VULKAN_TIGHT_COLOR_REGIONS_H
#include <vulkan/vulkan.h>
#ifdef __cplusplus
extern "C" {
#endif

/* Borrow capacity writable records. Return the number written, or zero with
 * the destination untouched. Offsets are bytes from this texture's payload
 * start. Spare payload bytes and unused output slots are permitted. */
uint32_t tower_vk_build_tight_color_regions_v1(VkBufferImageCopy *out, uint32_t capacity,
    uint32_t width, uint32_t height, uint32_t actual_layers, uint32_t mip_count,
    uint32_t bytes_per_texel, VkDeviceSize available_bytes);

#ifdef __cplusplus
}
#endif
#endif
