/* Test-only raw call boundary, compiled with the host Vulkan SDK. */
#include <vulkan/vulkan.h>

VkResult fixture_sdk_create_view(unsigned row, VkDevice device, VkImage image,
                                 VkImageView *slot)
{
    static const struct {
        VkImageViewType type;
        VkFormat format;
        uint32_t mips, layers;
    } cases[] = {
        {VK_IMAGE_VIEW_TYPE_2D_ARRAY, VK_FORMAT_R8_UNORM, 1, 6},
        {VK_IMAGE_VIEW_TYPE_2D, VK_FORMAT_R8G8B8A8_SRGB, 2, 1},
        {VK_IMAGE_VIEW_TYPE_2D, VK_FORMAT_R8G8B8A8_SRGB, 2, 1},
        {VK_IMAGE_VIEW_TYPE_2D_ARRAY, VK_FORMAT_R8G8B8A8_SRGB, 1, 4},
        {VK_IMAGE_VIEW_TYPE_2D_ARRAY, VK_FORMAT_R8G8B8A8_SRGB, 1, 2},
        {VK_IMAGE_VIEW_TYPE_2D, VK_FORMAT_R8G8B8A8_UNORM, 1, 1}, /* attachment */
        {VK_IMAGE_VIEW_TYPE_2D_ARRAY, VK_FORMAT_R8_UNORM, 2, 1}, /* recording only */
    };
    if (row >= sizeof(cases) / sizeof(cases[0]))
        return VK_ERROR_INITIALIZATION_FAILED;
    VkImageViewCreateInfo info = {
        .sType = VK_STRUCTURE_TYPE_IMAGE_VIEW_CREATE_INFO,
        .image = image, .viewType = cases[row].type, .format = cases[row].format,
        .subresourceRange = {VK_IMAGE_ASPECT_COLOR_BIT, 0, cases[row].mips, 0, cases[row].layers}
    };
    if (row == 6) {
        info.flags = VK_IMAGE_VIEW_CREATE_FRAGMENT_DENSITY_MAP_DYNAMIC_BIT_EXT;
        info.components = (VkComponentMapping){VK_COMPONENT_SWIZZLE_B, VK_COMPONENT_SWIZZLE_ONE,
                                               VK_COMPONENT_SWIZZLE_R, VK_COMPONENT_SWIZZLE_ZERO};
        info.subresourceRange.baseMipLevel = 3;
        info.subresourceRange.baseArrayLayer = 7;
    }
    return vkCreateImageView(device, &info, NULL, slot);
}
