/* SDK-owned storage for the recording test; no configured image goes to a GPU. */
#include "../create_image.h"

static const uint32_t families[] = {3, 7};
static const VkFormat formats[] = {VK_FORMAT_R8G8B8A8_UNORM, VK_FORMAT_R8G8B8A8_SRGB};
static const VkImageFormatListCreateInfo format_list = {
    .sType = VK_STRUCTURE_TYPE_IMAGE_FORMAT_LIST_CREATE_INFO,
    .viewFormatCount = sizeof(formats) / sizeof(formats[0]), .pViewFormats = formats
};

size_t fixture_sdk_images(const VkImageCreateInfo **first)
{
    static const VkImageCreateInfo images[] = {
        {.sType = VK_STRUCTURE_TYPE_IMAGE_CREATE_INFO, .imageType = VK_IMAGE_TYPE_2D,
         .format = VK_FORMAT_R8G8B8A8_SRGB, .extent = {256, 352, 1}, .mipLevels = 2, .arrayLayers = 1,
         .samples = VK_SAMPLE_COUNT_1_BIT, .usage = VK_IMAGE_USAGE_SAMPLED_BIT |
             VK_IMAGE_USAGE_TRANSFER_SRC_BIT | VK_IMAGE_USAGE_TRANSFER_DST_BIT},
        {.sType = VK_STRUCTURE_TYPE_IMAGE_CREATE_INFO, .flags = VK_IMAGE_CREATE_CUBE_COMPATIBLE_BIT,
         .imageType = VK_IMAGE_TYPE_2D, .format = VK_FORMAT_R8_UNORM, .extent = {64, 64, 1},
         .mipLevels = 3, .arrayLayers = 6, .samples = VK_SAMPLE_COUNT_1_BIT, .usage = VK_IMAGE_USAGE_SAMPLED_BIT},
        {.sType = VK_STRUCTURE_TYPE_IMAGE_CREATE_INFO, .imageType = VK_IMAGE_TYPE_3D,
         .format = VK_FORMAT_R32_UINT, .extent = {31, 17, 9}, .mipLevels = 1, .arrayLayers = 1,
         .samples = VK_SAMPLE_COUNT_1_BIT, .usage = VK_IMAGE_USAGE_STORAGE_BIT | VK_IMAGE_USAGE_TRANSFER_SRC_BIT},
        {.sType = VK_STRUCTURE_TYPE_IMAGE_CREATE_INFO, .pNext = &format_list,
         .flags = VK_IMAGE_CREATE_MUTABLE_FORMAT_BIT, .imageType = VK_IMAGE_TYPE_2D,
         .format = VK_FORMAT_R8G8B8A8_UNORM, .extent = {32, 24, 1}, .mipLevels = 1, .arrayLayers = 2,
         .samples = VK_SAMPLE_COUNT_4_BIT, .usage = VK_IMAGE_USAGE_COLOR_ATTACHMENT_BIT,
         .sharingMode = VK_SHARING_MODE_CONCURRENT, .queueFamilyIndexCount = sizeof(families) / sizeof(families[0]),
         .pQueueFamilyIndices = families, .initialLayout = VK_IMAGE_LAYOUT_UNDEFINED}
    };
    *first = images;
    return sizeof(images) / sizeof(images[0]);
}

VkResult fixture_issue_image(VkDevice device, const VkImageCreateInfo *info, VkImage *out)
{
#ifdef EXTERNAL_TOWER
    return tower_vk_create_image_v1(device, info, out);
#else
    VkImage created = VK_NULL_HANDLE;
    VkResult result = vkCreateImage(device, info, NULL, &created);
    if (result == VK_SUCCESS)
        *out = created;
    return result;
#endif
}
