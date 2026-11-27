#include "preflight_check.h"
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define CHECK(expr) do { if (!(expr)) { fprintf(stderr, "line %d: %s\n", __LINE__, #expr); exit(4); } } while (0)
typedef struct { uint32_t w, h, d, mips, layers; } Limits;
_Static_assert(sizeof(Limits) == 20 && sizeof(VkPhysicalDevice) == 8 && sizeof(VkImageCreateInfo) == 88 &&
               offsetof(VkImageCreateInfo, extent) == 28 && offsetof(VkImageCreateInfo, pQueueFamilyIndices) == 72 &&
               sizeof(VkImageFormatProperties) == 32 && offsetof(VkImageFormatProperties, maxResourceSize) == 24 &&
               sizeof(VkResult) == 4 && sizeof(VkBool32) == 4, "x64 SDK layout");
typedef struct {
    uint64_t guard0;
    VkImageCreateInfo info;
    uint64_t guard1;
    VkImageFormatListCreateInfo chain;
    VkFormat formats[2];
    uint32_t queues[3];
    uint64_t guard2;
} Inputs;
typedef struct {
    uint64_t left;
    VkImageFormatProperties caps;
    uint32_t middle, supported, right;
} Outputs;
static _Thread_local struct {
    VkPhysicalDevice physical;
    const Inputs *in;
    const Outputs *out;
    VkImageFormatProperties caps;
    VkResult status;
    unsigned calls;
} driver;

static VKAPI_ATTR VkResult VKAPI_CALL observe(VkPhysicalDevice physical, VkFormat format, VkImageType type,
    VkImageTiling tiling, VkImageUsageFlags usage, VkImageCreateFlags flags, VkImageFormatProperties *caps) {
    const VkImageCreateInfo *info = &driver.in->info;
    CHECK(++driver.calls == 1 && physical == driver.physical && format == info->format &&
          type == info->imageType && tiling == info->tiling && usage == info->usage && flags == info->flags);
    CHECK(caps && caps != &driver.out->caps);
    *caps = driver.caps; /* Deliberately write even on nonzero return. */
    return driver.status;
}

void record_preflight(const char *name, const Limits *max, const Limits *shape, uint32_t samples,
                      uint64_t resource, int32_t status, uint32_t supported) {
    Inputs in;
    memset(&in, 0x5a, sizeof in);
    in.formats[0] = VK_FORMAT_R16_SFLOAT;
    in.formats[1] = VK_FORMAT_R16_UINT;
    in.queues[0] = 11; in.queues[1] = 2; in.queues[2] = 7;
    in.chain = (VkImageFormatListCreateInfo){.sType=VK_STRUCTURE_TYPE_IMAGE_FORMAT_LIST_CREATE_INFO,
        .viewFormatCount=sizeof in.formats/sizeof *in.formats, .pViewFormats=in.formats};
    in.info = (VkImageCreateInfo){.sType=VK_STRUCTURE_TYPE_IMAGE_CREATE_INFO, .pNext=&in.chain,
        .flags=VK_IMAGE_CREATE_MUTABLE_FORMAT_BIT, .imageType=VK_IMAGE_TYPE_3D, .format=in.formats[0],
        .extent={shape->w,shape->h,shape->d}, .mipLevels=shape->mips, .arrayLayers=shape->layers,
        .samples=(VkSampleCountFlagBits)samples, .tiling=VK_IMAGE_TILING_LINEAR,
        .usage=VK_IMAGE_USAGE_STORAGE_BIT | VK_IMAGE_USAGE_TRANSFER_DST_BIT,
        .sharingMode=VK_SHARING_MODE_CONCURRENT, .queueFamilyIndexCount=sizeof in.queues/sizeof *in.queues,
        .pQueueFamilyIndices=in.queues};
    Inputs original;
    memcpy(&original, &in, sizeof in);
    Outputs out, expected;
    memset(&out, 0xa5, sizeof out);
    out.supported = 0x12345678;
    memcpy(&expected, &out, sizeof out);
    driver.physical = (VkPhysicalDevice)(uintptr_t)0x1234567854321000ull;
    driver.in = &in; driver.out = &out; driver.calls = 0; driver.status = (VkResult)status;
    driver.caps = (VkImageFormatProperties){{max->w,max->h,max->d}, max->mips, max->layers,
        VK_SAMPLE_COUNT_1_BIT | VK_SAMPLE_COUNT_4_BIT, resource};
    if (status == VK_SUCCESS) { expected.caps = driver.caps; expected.supported = supported; }
    osd_observe_query(observe);
    VkResult result = osd_check_preflight(driver.physical, &in.info, &out.caps, &out.supported);
    CHECK(driver.calls == 1 && (int32_t)result == status);
    CHECK(!memcmp(&out, &expected, sizeof out) && !memcmp(&in, &original, sizeof in));
    printf("case=%s extent=%ux%ux%u mips=%u layers=%u samples=%u query=1 result=%d "
           "outMax=%ux%ux%u outMips=%u outLayers=%u outSamples=%u outResource=%llu outBool=%u guards=intact\n",
           name,shape->w,shape->h,shape->d,shape->mips,shape->layers,samples,result,
           out.caps.maxExtent.width,out.caps.maxExtent.height,out.caps.maxExtent.depth,out.caps.maxMipLevels,
           out.caps.maxArrayLayers,out.caps.sampleCounts,(unsigned long long)out.caps.maxResourceSize,out.supported);
    osd_observe_query(NULL);
    driver.in = NULL;
    driver.out = NULL;
}

#ifndef OSD_THREADED_SUITE
extern int record_suite(void);
int main(void) { return record_suite(); }
#endif
