/* Independent raw SDK boundary for the retained Tower device fixture. */
#include <vulkan/vulkan.h>

VkResult fixture_sdk_create_image(uint32_t index, VkDevice device, VkImage *out)
{
    static const struct {
        uint32_t width, height, mips, layers;
        VkFormat format;
    } sources[] = {
        {2048, 2048, 1, 6, VK_FORMAT_R8_UNORM},
        {256, 352, 2, 1, VK_FORMAT_R8G8B8A8_SRGB},
        {256, 352, 2, 1, VK_FORMAT_R8G8B8A8_SRGB},
        {256, 352, 1, 4, VK_FORMAT_R8G8B8A8_SRGB},
        {64, 64, 1, 2, VK_FORMAT_R8G8B8A8_SRGB}
    };
    const uint32_t count = sizeof(sources) / sizeof(sources[0]);
    if (index >= 2 * count)
        return VK_ERROR_INITIALIZATION_FAILED;
    const uint32_t row = index % count;
    const VkBool32 attachment = index >= count;
    const VkImageCreateInfo info = {
        .sType = VK_STRUCTURE_TYPE_IMAGE_CREATE_INFO, .pNext = NULL, .flags = 0,
        .imageType = VK_IMAGE_TYPE_2D,
        .format = attachment ? VK_FORMAT_R8G8B8A8_UNORM : sources[row].format,
        .extent = {sources[row].width, sources[row].height, 1},
        .mipLevels = attachment ? 1 : sources[row].mips,
        .arrayLayers = attachment ? 1 : sources[row].layers,
        .samples = VK_SAMPLE_COUNT_1_BIT, .tiling = VK_IMAGE_TILING_OPTIMAL,
        .usage = VK_IMAGE_USAGE_TRANSFER_SRC_BIT |
                 (attachment ? VK_IMAGE_USAGE_COLOR_ATTACHMENT_BIT :
                               VK_IMAGE_USAGE_SAMPLED_BIT | VK_IMAGE_USAGE_TRANSFER_DST_BIT),
        .sharingMode = VK_SHARING_MODE_EXCLUSIVE, .queueFamilyIndexCount = 0,
        .pQueueFamilyIndices = NULL, .initialLayout = VK_IMAGE_LAYOUT_UNDEFINED
    };
    return vkCreateImage(device, &info, NULL, out);
}
