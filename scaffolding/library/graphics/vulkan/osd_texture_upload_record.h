#ifndef TOWER_VULKAN_OSD_TEXTURE_UPLOAD_RECORD_H
#define TOWER_VULKAN_OSD_TEXTURE_UPLOAD_RECORD_H
#include <vulkan/vulkan.h>
#ifdef __cplusplus
extern "C" {
#endif
/* Borrow a recording graphics primary, coherent staging and a new color image.
 * Pass actual (positive) layer/mip counts and all layer-major copy regions.
 * Regions need only survive this call. Vulkan resources live through retirement. */
void tower_vk_osd_texture_upload_record_v1(VkCommandBuffer cmd, VkBuffer staging, VkImage image,
                                         uint32_t layers, uint32_t mips, uint32_t count,
                                         const VkBufferImageCopy *regions);
#ifdef __cplusplus
}
#endif
#endif
