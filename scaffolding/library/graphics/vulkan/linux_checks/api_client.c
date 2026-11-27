// SDK transport for the single-executable ABI check. The handles name recording doubles.
#include "frame_submit.h"
#include "indexed_draw_c.h"
#include "shader_module_c.h"
#include "buffer_upload_record.h"
#include "osd_texture_upload_record.h"
#include "tight_color_regions.h"
#include "bound_image_view.h"
#include "create_image.h"
#include "image_format_preflight.h"
#include "color_frag.h"

extern void record_driver(void *state, uint8_t code);
extern void record_result(void *state, int32_t result);
extern int check_sdk(void);
static _Thread_local void *trace;

VKAPI_ATTR VkResult VKAPI_CALL vkCreateShaderModule(VkDevice d, const VkShaderModuleCreateInfo *i,
    const VkAllocationCallbacks *a, VkShaderModule *out) {
    record_driver(trace, 'M'); *out = (VkShaderModule)d; return VK_SUCCESS;
}
VKAPI_ATTR VkResult VKAPI_CALL vkGetPhysicalDeviceImageFormatProperties(VkPhysicalDevice d,
    VkFormat format, VkImageType type, VkImageTiling tiling, VkImageUsageFlags usage,
    VkImageCreateFlags flags, VkImageFormatProperties *out) {
    record_driver(trace, 'Q');
    *out = (VkImageFormatProperties){.maxExtent={1,1,1}, .maxMipLevels=1,
        .maxArrayLayers=1, .sampleCounts=VK_SAMPLE_COUNT_1_BIT, .maxResourceSize=4096};
    return VK_SUCCESS;
}
VKAPI_ATTR VkResult VKAPI_CALL vkCreateImage(VkDevice d, const VkImageCreateInfo *i,
    const VkAllocationCallbacks *a, VkImage *out) {
    record_driver(trace, 'C'); *out = (VkImage)d; return VK_SUCCESS;
}
VKAPI_ATTR VkResult VKAPI_CALL vkCreateImageView(VkDevice d, const VkImageViewCreateInfo *i,
    const VkAllocationCallbacks *a, VkImageView *out) {
    record_driver(trace, 'V'); *out = (VkImageView)d; return VK_SUCCESS;
}
VKAPI_ATTR VkResult VKAPI_CALL vkResetCommandBuffer(VkCommandBuffer c, VkCommandBufferResetFlags f) {
    record_driver(trace, 'R'); return VK_SUCCESS;
}
VKAPI_ATTR VkResult VKAPI_CALL vkBeginCommandBuffer(VkCommandBuffer c, const VkCommandBufferBeginInfo *i) {
    record_driver(trace, 'B'); return VK_SUCCESS;
}
VKAPI_ATTR VkResult VKAPI_CALL vkEndCommandBuffer(VkCommandBuffer c) {
    record_driver(trace, 'E'); return VK_SUCCESS;
}
VKAPI_ATTR VkResult VKAPI_CALL vkQueueSubmit(VkQueue q, uint32_t n, const VkSubmitInfo *i, VkFence f) {
    record_driver(trace, 'S'); return VK_SUCCESS;
}
VKAPI_ATTR VkResult VKAPI_CALL vkQueueWaitIdle(VkQueue q) {
    record_driver(trace, 'I'); return VK_SUCCESS;
}
VKAPI_ATTR void VKAPI_CALL vkCmdCopyBuffer(VkCommandBuffer c, VkBuffer s, VkBuffer d, uint32_t n, const VkBufferCopy *r) {
    record_driver(trace, 'T');
}
VKAPI_ATTR void VKAPI_CALL vkCmdCopyBufferToImage(VkCommandBuffer c, VkBuffer s, VkImage d,
    VkImageLayout l, uint32_t n, const VkBufferImageCopy *r) { record_driver(trace, 'U'); }
VKAPI_ATTR void VKAPI_CALL vkCmdPipelineBarrier2(VkCommandBuffer c, const VkDependencyInfo *i) { record_driver(trace, 'P'); }
static VKAPI_ATTR void VKAPI_CALL draw(VkCommandBuffer c, VkBuffer b, VkDeviceSize o,
    VkBuffer count, VkDeviceSize off, uint32_t max, uint32_t stride) { record_driver(trace, 'D'); }

int main(void) { return check_sdk(); }
void exercise_api(void *state) {
    trace = state;
    uintptr_t handles[6];
    VkDevice device = (VkDevice)&handles[0];
    VkQueue queue = (VkQueue)&handles[1];
    VkCommandBuffer cmd = (VkCommandBuffer)&handles[2];
    VkBuffer src = (VkBuffer)&handles[3], dst = (VkBuffer)&handles[4];
    VkShaderModule module = VK_NULL_HANDLE;
    int32_t status = -1;
    uint32_t called = tower_vk_try_create_shader_module(device, color_frag, sizeof color_frag / sizeof *color_frag, &module, &status);
    record_result(trace, called);
    record_result(trace, status);
    VkImageCreateInfo info = {.sType=VK_STRUCTURE_TYPE_IMAGE_CREATE_INFO, .imageType=VK_IMAGE_TYPE_2D,
        .format=VK_FORMAT_R8G8B8A8_UNORM, .extent={1,1,1}, .mipLevels=1, .arrayLayers=1,
        .samples=VK_SAMPLE_COUNT_1_BIT, .usage=VK_IMAGE_USAGE_TRANSFER_DST_BIT | VK_IMAGE_USAGE_SAMPLED_BIT};
    VkImageFormatProperties limits = {0};
    VkBool32 supported = VK_FALSE;
    record_result(trace, tower_vk_image_format_preflight_v1((VkPhysicalDevice)&handles[5], &info, &limits, &supported));
    record_result(trace, supported);
    record_result(trace, (int32_t)limits.maxResourceSize);
    VkImage image = VK_NULL_HANDLE;
    record_result(trace, tower_vk_create_image_v1(device, &info, &image));
    VkImageSubresourceRange range = {VK_IMAGE_ASPECT_COLOR_BIT, 0, 1, 0, 1};
    VkImageView view = VK_NULL_HANDLE;
    record_result(trace, tower_vk_create_bound_image_view_v1(device, image, VK_IMAGE_VIEW_TYPE_2D, info.format, &range, &view));
    record_result(trace, tower_vk_command_begin_v1(cmd));
    VkBufferImageCopy region;
    uint32_t count = tower_vk_build_tight_color_regions_v1(&region, 1, 1, 1, 1, 1, 4, 4);
    record_result(trace, count);
    tower_vk_osd_texture_upload_record_v1(cmd, src, image, 1, 1, count, &region);
    record_result(trace, 0); // Void return marker. Tower checks the observed calls.
    tower_vk_buffer_upload_record_v1(cmd, src, dst, 4);
    record_result(trace, 0);
    record_result(trace, tower_vk_record_indexed_indirect_count_v1(draw, cmd, src, 20, 0, dst, 4, 0, 1, 20));
    VkSubmitInfo batch;
    record_result(trace, tower_vk_command_end_for_submit_v1(&batch, &cmd, NULL, NULL, NULL));
    record_result(trace, tower_vk_queue_submit_one_v1(queue, &batch, VK_NULL_HANDLE));
    record_result(trace, tower_vk_command_finish_v1(queue, cmd));
    trace = NULL;
}
