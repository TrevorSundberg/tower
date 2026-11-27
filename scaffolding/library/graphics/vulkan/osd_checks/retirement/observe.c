/* The observing PE links these SDK calls directly to Wine Vulkan. Its local
 * vulkan-1 forwarder routes only the graphics DLL's three imports here. */
#include "../control.h"
#include <stdio.h>

void observe_view(VkDevice device, VkImageView view, const VkAllocationCallbacks *cb) {
    printf("dll_view %p %p %p\n", (void *)device, (void *)view, (void *)cb);
    vkDestroyImageView(device, view, cb);
}
void observe_image(VkDevice device, VkImage image, const VkAllocationCallbacks *cb) {
    printf("dll_image %p %p %p\n", (void *)device, (void *)image, (void *)cb);
    vkDestroyImage(device, image, cb);
}
void observe_memory(VkDevice device, VkDeviceMemory memory, const VkAllocationCallbacks *cb) {
    printf("dll_memory %p %p %p\n", (void *)device, (void *)memory, (void *)cb);
    vkFreeMemory(device, memory, cb);
}


VkResult observe_finish(VkQueue queue, VkCommandBuffer cmd) {
    VkResult result = perform_finish(queue, cmd);
    printf("finish queue=%p cmd=%p result=%d\n", (void *)queue, (void *)cmd, result);
    return result;
}
