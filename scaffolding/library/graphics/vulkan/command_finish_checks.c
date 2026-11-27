#include "frame_submit.h"
#ifdef TOWER_TEST_DRAW_VK_CHECK
#include <stdio.h>
#include <stdlib.h>
static VkResult checked(VkResult result, int line, const char *expression)
{
    if (result != VK_SUCCESS) {
        fprintf(stderr, "Vulkan error %d at line %d: %s\n", (int)result, line, expression);
        exit(1);
    }
    return result;
}
#define CHECK(call) checked((call), __LINE__, #call)
#else
#define CHECK(call) (call)
#endif

/* Preserve Draw's diagnostic spelling while binding directly to the Tower export. */
#define draw_vk_command_finish_v1 tower_vk_command_finish_v1
VkResult finish_from_c(VkQueue queue, VkCommandBuffer cmd)
{
    return CHECK(draw_vk_command_finish_v1(queue, cmd));
}

VkResult finish_raw(VkQueue queue, VkCommandBuffer cmd)
{
    VkResult result = CHECK(vkEndCommandBuffer(cmd));
    if (result != VK_SUCCESS)
        return result;
    VkSubmitInfo si = { .sType = VK_STRUCTURE_TYPE_SUBMIT_INFO,
                        .commandBufferCount = 1, .pCommandBuffers = &cmd };
    result = CHECK(vkQueueSubmit(queue, 1, &si, VK_NULL_HANDLE));
    if (result != VK_SUCCESS)
        return result;
    return CHECK(vkQueueWaitIdle(queue));
}
