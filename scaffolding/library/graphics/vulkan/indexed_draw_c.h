#ifndef TOWER_VULKAN_INDEXED_DRAW_C_H
#define TOWER_VULKAN_INDEXED_DRAW_C_H

#include <vulkan/vulkan_core.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Linux x86-64 and Windows x64. Resolve draw once on the live device with
 * drawIndirectCount enabled. Record into its recording primary command buffer,
 * inside a compatible render scope with the graphics pipeline and index buffer
 * bound. Draw uses uint16 indices. The caller checks device features/limits,
 * indirect buffer usage and synchronization with producers.
 *
 * Pass each VkBuffer's full size in bytes and an offset from its start.
 * The handles may be identical. Even with max_draws == 0, count_offset must
 * address a complete aligned count word, command_offset must be aligned and
 * at most command_bytes, and stride must be a multiple of four and >= 20.
 *
 * Returns 1 after calling draw exactly once, or 0 on local refusal. The caller
 * owns submission, completion and the lifetime of all in-flight resources.
 */
uint32_t tower_vk_record_indexed_indirect_count_v1(PFN_vkCmdDrawIndexedIndirectCount draw,
    VkCommandBuffer cmd, VkBuffer commands, VkDeviceSize command_bytes, VkDeviceSize command_offset,
    VkBuffer count, VkDeviceSize count_bytes, VkDeviceSize count_offset, uint32_t max_draws, uint32_t stride);

#ifdef __cplusplus
}
#endif
#endif
