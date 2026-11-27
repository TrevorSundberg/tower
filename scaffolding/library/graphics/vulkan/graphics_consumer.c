/* External Windows x64 SDK example. color_frag.h is generated from
 * counted_shaders/color.frag with glslangValidator --vn color_frag. */
#include <stdio.h>
#include <stdlib.h>
#include "frame_submit.h"
#include "shader_module_c.h"
#include "color_frag.h"

static void check(const char *operation, VkResult result)
{
    if (result != VK_SUCCESS) {
        fprintf(stderr, "%s returned %d\n", operation, (int)result);
        exit(EXIT_FAILURE);
    }
}

int main(void)
{
    VkApplicationInfo app = { .sType = VK_STRUCTURE_TYPE_APPLICATION_INFO,
        .apiVersion = VK_API_VERSION_1_1 };
    VkInstanceCreateInfo instance_info = { .sType = VK_STRUCTURE_TYPE_INSTANCE_CREATE_INFO,
        .pApplicationInfo = &app };
    VkInstance instance;
    check("vkCreateInstance", vkCreateInstance(&instance_info, NULL, &instance));

    /* This small sample uses the first adapter and graphics queue family zero. */
    uint32_t count = 1;
    VkPhysicalDevice physical;
    VkResult result = vkEnumeratePhysicalDevices(instance, &count, &physical);
    if (result != VK_INCOMPLETE) check("vkEnumeratePhysicalDevices", result);
    if (count == 0) { fputs("No Vulkan device\n", stderr); return EXIT_FAILURE; }
    VkQueueFamilyProperties family;
    count = 1;
    vkGetPhysicalDeviceQueueFamilyProperties(physical, &count, &family);
    if (!count || !family.queueCount || !(family.queueFlags & VK_QUEUE_GRAPHICS_BIT)) {
        fputs("Example requires a graphics queue in family zero\n", stderr);
        return EXIT_FAILURE;
    }
    float priority = 1.0f;
    VkDeviceQueueCreateInfo queue_info = { .sType = VK_STRUCTURE_TYPE_DEVICE_QUEUE_CREATE_INFO,
        .queueCount = 1, .pQueuePriorities = &priority };
    VkDeviceCreateInfo device_info = { .sType = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO,
        .queueCreateInfoCount = 1, .pQueueCreateInfos = &queue_info };
    VkDevice device;
    check("vkCreateDevice", vkCreateDevice(physical, &device_info, NULL, &device));
    VkQueue queue;
    vkGetDeviceQueue(device, 0, 0, &queue);

    VkShaderModule module = VK_NULL_HANDLE;
    int32_t shader_result = 0;
    uint32_t called = tower_vk_try_create_shader_module(device, color_frag,
        sizeof color_frag / sizeof color_frag[0], &module, &shader_result);
    if (!called) { fputs("Shader arguments refused\n", stderr); return EXIT_FAILURE; }
    check("vkCreateShaderModule", (VkResult)shader_result);
    if (!module) { fputs("Missing shader module\n", stderr); return EXIT_FAILURE; }
    vkDestroyShaderModule(device, module, NULL);

    VkEventCreateInfo event_info = { .sType = VK_STRUCTURE_TYPE_EVENT_CREATE_INFO };
    VkEvent event;
    check("vkCreateEvent", vkCreateEvent(device, &event_info, NULL, &event));
    VkCommandPoolCreateInfo pool_info = { .sType = VK_STRUCTURE_TYPE_COMMAND_POOL_CREATE_INFO,
        .queueFamilyIndex = queue_info.queueFamilyIndex };
    VkCommandPool pool;
    check("vkCreateCommandPool", vkCreateCommandPool(device, &pool_info, NULL, &pool));
    VkCommandBufferAllocateInfo allocate = { .sType = VK_STRUCTURE_TYPE_COMMAND_BUFFER_ALLOCATE_INFO,
        .commandPool = pool, .level = VK_COMMAND_BUFFER_LEVEL_PRIMARY, .commandBufferCount = 1 };
    VkCommandBuffer command;
    check("vkAllocateCommandBuffers", vkAllocateCommandBuffers(device, &allocate, &command));
    VkCommandBufferBeginInfo begin = { .sType = VK_STRUCTURE_TYPE_COMMAND_BUFFER_BEGIN_INFO };
    check("vkBeginCommandBuffer", vkBeginCommandBuffer(command, &begin));
    vkCmdSetEvent(command, event, VK_PIPELINE_STAGE_ALL_COMMANDS_BIT);
    check("vkEndCommandBuffer", vkEndCommandBuffer(command));

    VkFenceCreateInfo fence_info = { .sType = VK_STRUCTURE_TYPE_FENCE_CREATE_INFO };
    VkFence fence;
    check("vkCreateFence", vkCreateFence(device, &fence_info, NULL, &fence));
    VkSubmitInfo batch = { .sType = VK_STRUCTURE_TYPE_SUBMIT_INFO,
        .commandBufferCount = 1, .pCommandBuffers = &command };
    check("tower_vk_queue_submit_one_v1", tower_vk_queue_submit_one_v1(queue, &batch, fence));
    check("vkWaitForFences", vkWaitForFences(device, 1, &fence, VK_TRUE, 5000000000ULL));
    result = vkGetEventStatus(device, event);
    if (result != VK_EVENT_SET) {
        fprintf(stderr, "Expected a set GPU event, got %d\n", (int)result);
        return EXIT_FAILURE;
    }
    vkDestroyCommandPool(device, pool, NULL);
    vkDestroyEvent(device, event, NULL);
    vkDestroyFence(device, fence, NULL);
    vkDestroyDevice(device, NULL);
    vkDestroyInstance(instance, NULL);
    puts("shader created and destroyed; GPU event set after fence retirement");
    return EXIT_SUCCESS;
}
