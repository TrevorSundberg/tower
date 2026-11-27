#include "frame_submit.h"

/* The fatal-check build exercises Draw's C call sites on the offscreen fixture. */
#ifdef TOWER_TEST_DRAW_VK_CHECK
#include <stdio.h>
#include <stdlib.h>
static VkResult draw_check(VkResult result, int line, const char *operation)
{
    if (result != VK_SUCCESS) {
        fprintf(stderr, "Vulkan error %d at line %d: %s\n", (int)result, line, operation);
        exit(1);
    }
    return result;
}
#define CHECK(call) draw_check((call), __LINE__, #call)
#else
#define CHECK(call) (call)
#endif

VkResult begin_from_c(VkCommandBuffer cmd)
{
    return CHECK(tower_vk_command_begin_v1(cmd));
}

VkResult begin_raw(VkCommandBuffer cmd)
{
    VkResult result = CHECK(vkResetCommandBuffer(cmd, 0));
    if (result != VK_SUCCESS)
        return result;
    VkCommandBufferBeginInfo info = { .sType = VK_STRUCTURE_TYPE_COMMAND_BUFFER_BEGIN_INFO,
                                      .flags = VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT };
    return CHECK(vkBeginCommandBuffer(cmd, &info));
}

int begin_info_matches(const VkCommandBufferBeginInfo *info)
{
    return info->sType == VK_STRUCTURE_TYPE_COMMAND_BUFFER_BEGIN_INFO && info->pNext == NULL
        && info->flags == VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT && info->pInheritanceInfo == NULL;
}

int begin_layout_matches(const VkCommandBufferBeginInfo *info, size_t size,
                         const void *tag, const void *next, const void *flags,
                         const void *inheritance)
{
    return sizeof(*info) == size && &info->sType == tag && &info->pNext == next
        && &info->flags == flags && &info->pInheritanceInfo == inheritance;
}
