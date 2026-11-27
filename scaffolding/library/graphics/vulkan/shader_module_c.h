#ifndef TOWER_VULKAN_SHADER_MODULE_C_H
#define TOWER_VULKAN_SHADER_MODULE_C_H

#include <stddef.h>
#include <stdint.h>
#include <vulkan/vulkan_core.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Linux x86-64 SysV ABI. Borrow a live logical device and word_count
 * aligned, readable, device-valid SPIR-V words. Initialize *out to
 * VK_NULL_HANDLE and provide an initialized int32_t for vk_result.
 * Both slots must be aligned, writable, distinct from all other live
 * inputs, and exclusively accessible through return.
 *
 * A return of 1 means vkCreateShaderModule ran. *vk_result holds its
 * exact signed VkResult. Only 1 with VK_SUCCESS transfers *out. Destroy
 * it once with vkDestroyShaderModule(device, *out, NULL) before releasing
 * the same logical device. The caller can release words upon return.
 *
 * Local refusal returns 0 and writes 0 to a valid separate result slot.
 * A null, misaligned, or overlapping result slot receives no write.
 * Overlap is checked against the claimed word range and the output slot.
 * All failures preserve *out, including refusal of an occupied slot.
 */
uint32_t tower_vk_try_create_shader_module(VkDevice device, const uint32_t *words,
    size_t word_count, VkShaderModule *out, int32_t *vk_result);

#ifdef __cplusplus
}
#endif
#endif
