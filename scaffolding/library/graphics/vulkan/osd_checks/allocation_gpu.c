#include "allocation_check.h"
#include <stdio.h>

/* Single-caller, one-source-at-a-time fixture. Forward every observed operation
 * to the SDK and record the data from that call. The verifier runs separately. */
static VkPhysicalDevice physical;
static VkPhysicalDeviceMemoryProperties table;
static VkImage source;
extern VkResult osd_fixture_create_image(VkDevice, const VkImageCreateInfo *, const VkAllocationCallbacks *, VkImage *);

void osd_trace_properties(VkPhysicalDevice p, VkPhysicalDeviceMemoryProperties *out) {
    vkGetPhysicalDeviceMemoryProperties(p, out);
    physical = p;
    table = *out;
}

VkResult osd_trace_create(VkDevice device, const VkImageCreateInfo *info,
        const VkAllocationCallbacks *allocator, VkImage *out) {
    VkResult result = osd_fixture_create_image(device, info, allocator, out);
    if (result == VK_SUCCESS && (info->usage & VK_IMAGE_USAGE_SAMPLED_BIT)) {
        source = *out;
        printf("trace Create %p %p %p %x\n", (void *)device, (void *)source, (void *)physical, table.memoryTypeCount);
        for (uint32_t i = 0; i < table.memoryTypeCount; ++i)
            printf("trace Type %x %x %x\n", i, table.memoryTypes[i].propertyFlags, table.memoryTypes[i].heapIndex);
    }
    return result;
}

void osd_trace_borrow(VkDevice device, VkImage image, const VkMemoryType *types, uint32_t count,
        VkMemoryPropertyFlags required) {
    printf("trace Borrow %p %p %x %x\n", (void *)device, (void *)image, count, required);
    for (uint32_t i = 0; i < count; ++i)
        printf("trace Input %x %x %x\n", i, types[i].propertyFlags, types[i].heapIndex);
}

void osd_trace_requirements(VkDevice device, VkImage image, VkMemoryRequirements *out) {
    vkGetImageMemoryRequirements(device, image, out);
    if (source) {
        printf("trace Requirements %p %p %llx %llx\n", (void *)device, (void *)image,
                (unsigned long long)out->size, (unsigned long long)out->alignment);
        printf("trace Mask %x\n", out->memoryTypeBits);
    }
}

static void fields(const VkMemoryAllocateInfo *info) {
    printf("trace Fields %x %p %llx %x\n", (unsigned)info->sType, info->pNext,
            (unsigned long long)info->allocationSize, info->memoryTypeIndex);
}
void osd_trace_plan(VkMemoryAllocateInfo *info, VkBool32 status) {
    printf("trace Plan %p %x\n", (void *)info, status);
    if (status == VK_TRUE) fields(info);
}

VkResult osd_trace_allocate(VkDevice device, const VkMemoryAllocateInfo *info,
        const VkAllocationCallbacks *allocator, VkDeviceMemory *out) {
    VkResult result = vkAllocateMemory(device, info, allocator, out);
    if (source) {
        printf("trace Allocate %p %p %p %x\n", (void *)device, (void *)info,
                result == VK_SUCCESS ? (void *)*out : NULL, (unsigned)result);
        fields(info);
    }
    return result;
}

VkResult osd_trace_bind(VkDevice device, VkImage image, VkDeviceMemory memory, VkDeviceSize offset) {
    VkResult result = vkBindImageMemory(device, image, memory, offset);
    if (source) {
        printf("trace Bind %p %p %p %llx\ntrace BindResult %x\n", (void *)device, (void *)image,
                (void *)memory, (unsigned long long)offset, (unsigned)result);
        source = VK_NULL_HANDLE;
    }
    return result;
}
