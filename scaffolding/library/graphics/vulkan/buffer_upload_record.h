#ifndef TOWER_VULKAN_BUFFER_UPLOAD_RECORD_H
#define TOWER_VULKAN_BUFFER_UPLOAD_RECORD_H
#include <vulkan/vulkan.h>
#ifdef __cplusplus
extern "C" {
#endif

/* Requires a recording transfer-capable primary outside a render pass, with
 * synchronization2 enabled. Borrow two valid, non-overlapping transfer ranges
 * [0, size) with size > 0. Keep their resources live through retirement. */
void tower_vk_buffer_upload_record_v1(VkCommandBuffer cmd, VkBuffer staging,
                                      VkBuffer dst, VkDeviceSize size);

#ifdef __cplusplus
}
#endif
#endif
