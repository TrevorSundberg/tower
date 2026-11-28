/* Independent Linux C SDK oracle for the byte-level casts in both clients. */
#include <stddef.h>
#include "../../image_format_preflight.h"
#include "../../create_image.h"
#include "../../bound_image_view.h"
#include "../../image_memory.h"
#include "../../image_allocation_plan.h"
#include "../../image_retirement.h"
#define FIELD(T, F) offsetof(T, F), sizeof(((T *)0)->F)
static const size_t layout[] = {
    sizeof(VkExtent3D), _Alignof(VkExtent3D),
    FIELD(VkExtent3D, width),
    FIELD(VkExtent3D, height),
    FIELD(VkExtent3D, depth),
    sizeof(VkImageCreateInfo), _Alignof(VkImageCreateInfo),
    FIELD(VkImageCreateInfo, sType),
    FIELD(VkImageCreateInfo, pNext),
    FIELD(VkImageCreateInfo, flags),
    FIELD(VkImageCreateInfo, imageType),
    FIELD(VkImageCreateInfo, format),
    FIELD(VkImageCreateInfo, extent),
    FIELD(VkImageCreateInfo, mipLevels),
    FIELD(VkImageCreateInfo, arrayLayers),
    FIELD(VkImageCreateInfo, samples),
    FIELD(VkImageCreateInfo, tiling),
    FIELD(VkImageCreateInfo, usage),
    FIELD(VkImageCreateInfo, sharingMode),
    FIELD(VkImageCreateInfo, queueFamilyIndexCount),
    FIELD(VkImageCreateInfo, pQueueFamilyIndices),
    FIELD(VkImageCreateInfo, initialLayout),
    sizeof(VkImageFormatProperties), _Alignof(VkImageFormatProperties),
    FIELD(VkImageFormatProperties, maxExtent),
    FIELD(VkImageFormatProperties, maxMipLevels),
    FIELD(VkImageFormatProperties, maxArrayLayers),
    FIELD(VkImageFormatProperties, sampleCounts),
    FIELD(VkImageFormatProperties, maxResourceSize),
    sizeof(VkImageSubresourceRange), _Alignof(VkImageSubresourceRange),
    FIELD(VkImageSubresourceRange, aspectMask),
    FIELD(VkImageSubresourceRange, baseMipLevel),
    FIELD(VkImageSubresourceRange, levelCount),
    FIELD(VkImageSubresourceRange, baseArrayLayer),
    FIELD(VkImageSubresourceRange, layerCount),
    sizeof(VkMemoryAllocateInfo), _Alignof(VkMemoryAllocateInfo),
    FIELD(VkMemoryAllocateInfo, sType),
    FIELD(VkMemoryAllocateInfo, pNext),
    FIELD(VkMemoryAllocateInfo, allocationSize),
    FIELD(VkMemoryAllocateInfo, memoryTypeIndex),
    sizeof(VkMemoryType), _Alignof(VkMemoryType),
    FIELD(VkMemoryType, propertyFlags),
    FIELD(VkMemoryType, heapIndex),
};
const size_t *sdk_layout(size_t *count) {
    *count = sizeof layout / sizeof layout[0];
    return layout;
}
