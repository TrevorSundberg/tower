// Test-only SDK boundary for format queries, sampling, transfer readback and retirement.
#include "control.h"
#include <stdio.h>
#include <stdlib.h>
#include "triangle.h"
#include "flat.h"
#include "array.h"

static void check(VkResult result, const char *operation) {
    if (result != VK_SUCCESS) {
        fprintf(stderr, "%s failed with VkResult %d\n", operation, result);
        exit(3);
    }
}
#define CHECK(operation) check((operation), #operation)

int osd_format(VkPhysicalDevice physical, VkFormat format, VkImageUsageFlags usage,
               uint32_t w, uint32_t h, uint32_t layers, uint32_t mips) {
    VkFormatProperties props;
    vkGetPhysicalDeviceFormatProperties(physical, format, &props);
    VkFormatFeatureFlags required = VK_FORMAT_FEATURE_TRANSFER_SRC_BIT;
    if (usage & VK_IMAGE_USAGE_SAMPLED_BIT)
        required |= VK_FORMAT_FEATURE_SAMPLED_IMAGE_BIT | VK_FORMAT_FEATURE_TRANSFER_DST_BIT;
    if (usage & VK_IMAGE_USAGE_COLOR_ATTACHMENT_BIT) required |= VK_FORMAT_FEATURE_COLOR_ATTACHMENT_BIT;
    VkImageFormatProperties image;
    CHECK(vkGetPhysicalDeviceImageFormatProperties(physical, format, VK_IMAGE_TYPE_2D,
        VK_IMAGE_TILING_OPTIMAL, usage, 0, &image));
    printf("format=%d optimal=0x%x required=0x%x usage=0x%x max=%ux%u layers=%u mips=%u samples=0x%x\n",
        format, props.optimalTilingFeatures, required, usage, image.maxExtent.width, image.maxExtent.height,
        image.maxArrayLayers, image.maxMipLevels, image.sampleCounts);
    return (props.optimalTilingFeatures & required) == required && image.maxExtent.width >= w
        && image.maxExtent.height >= h && image.maxArrayLayers >= layers && image.maxMipLevels >= mips
        && (image.sampleCounts & VK_SAMPLE_COUNT_1_BIT);
}

static VkShaderModule module(VkDevice device, const uint32_t *words, size_t bytes) {
    VkShaderModuleCreateInfo info = {.sType=VK_STRUCTURE_TYPE_SHADER_MODULE_CREATE_INFO,
        .codeSize=bytes, .pCode=words};
    VkShaderModule shader;
    CHECK(vkCreateShaderModule(device, &info, NULL, &shader));
    return shader;
}
static VkPipeline pipeline(VkDevice device, VkPipelineLayout layout, VkExtent2D extent, int array_view) {
    VkShaderModule vert = module(device, triangle, sizeof triangle);
    VkShaderModule frag = array_view ? module(device, array, sizeof array) : module(device, flat, sizeof flat);
    VkPipelineShaderStageCreateInfo stages[] = {
        {.sType=VK_STRUCTURE_TYPE_PIPELINE_SHADER_STAGE_CREATE_INFO, .stage=VK_SHADER_STAGE_VERTEX_BIT, .module=vert, .pName="main"},
        {.sType=VK_STRUCTURE_TYPE_PIPELINE_SHADER_STAGE_CREATE_INFO, .stage=VK_SHADER_STAGE_FRAGMENT_BIT, .module=frag, .pName="main"}
    };
    VkFormat format = VK_FORMAT_R8G8B8A8_UNORM;
    VkPipelineRenderingCreateInfo rendering = {.sType=VK_STRUCTURE_TYPE_PIPELINE_RENDERING_CREATE_INFO,
        .colorAttachmentCount=1, .pColorAttachmentFormats=&format};
    VkViewport viewport = {.width=(float)extent.width, .height=(float)extent.height, .maxDepth=1};
    VkRect2D scissor = {.extent=extent};
    VkPipelineColorBlendAttachmentState attachment = {.colorWriteMask=VK_COLOR_COMPONENT_R_BIT |
        VK_COLOR_COMPONENT_G_BIT | VK_COLOR_COMPONENT_B_BIT | VK_COLOR_COMPONENT_A_BIT};
    VkGraphicsPipelineCreateInfo info = {.sType=VK_STRUCTURE_TYPE_GRAPHICS_PIPELINE_CREATE_INFO, .pNext=&rendering,
        .stageCount=2, .pStages=stages, .layout=layout,
        .pVertexInputState=&(VkPipelineVertexInputStateCreateInfo){.sType=VK_STRUCTURE_TYPE_PIPELINE_VERTEX_INPUT_STATE_CREATE_INFO},
        .pInputAssemblyState=&(VkPipelineInputAssemblyStateCreateInfo){.sType=VK_STRUCTURE_TYPE_PIPELINE_INPUT_ASSEMBLY_STATE_CREATE_INFO,
            .topology=VK_PRIMITIVE_TOPOLOGY_TRIANGLE_LIST},
        .pViewportState=&(VkPipelineViewportStateCreateInfo){.sType=VK_STRUCTURE_TYPE_PIPELINE_VIEWPORT_STATE_CREATE_INFO,
            .viewportCount=1, .pViewports=&viewport, .scissorCount=1, .pScissors=&scissor},
        .pRasterizationState=&(VkPipelineRasterizationStateCreateInfo){.sType=VK_STRUCTURE_TYPE_PIPELINE_RASTERIZATION_STATE_CREATE_INFO,
            .polygonMode=VK_POLYGON_MODE_FILL, .lineWidth=1},
        .pMultisampleState=&(VkPipelineMultisampleStateCreateInfo){.sType=VK_STRUCTURE_TYPE_PIPELINE_MULTISAMPLE_STATE_CREATE_INFO,
            .rasterizationSamples=VK_SAMPLE_COUNT_1_BIT},
        .pColorBlendState=&(VkPipelineColorBlendStateCreateInfo){.sType=VK_STRUCTURE_TYPE_PIPELINE_COLOR_BLEND_STATE_CREATE_INFO,
            .attachmentCount=1, .pAttachments=&attachment}};
    VkPipeline result;
    CHECK(vkCreateGraphicsPipelines(device, VK_NULL_HANDLE, 1, &info, NULL, &result));
    vkDestroyShaderModule(device, frag, NULL);
    vkDestroyShaderModule(device, vert, NULL);
    return result;
}
static void image_transition(VkCommandBuffer cmd, VkImage image, VkImageSubresourceRange range,
    VkImageLayout old, VkImageLayout next, VkPipelineStageFlags2 from, VkAccessFlags2 read,
    VkPipelineStageFlags2 to, VkAccessFlags2 write) {
    VkImageMemoryBarrier2 barrier = {.sType=VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER_2, .srcStageMask=from,
        .srcAccessMask=read, .dstStageMask=to, .dstAccessMask=write, .oldLayout=old, .newLayout=next,
        .srcQueueFamilyIndex=VK_QUEUE_FAMILY_IGNORED, .dstQueueFamilyIndex=VK_QUEUE_FAMILY_IGNORED,
        .image=image, .subresourceRange=range};
    vkCmdPipelineBarrier2(cmd, &(VkDependencyInfo){.sType=VK_STRUCTURE_TYPE_DEPENDENCY_INFO,
        .imageMemoryBarrierCount=1, .pImageMemoryBarriers=&barrier});
}

// Enter with a separate recording primary and previously retired staging.
// read_regions is a caller-owned, independently placed set of host destinations.
void osd_sample_retire(VkDevice device, VkQueue queue, VkCommandBuffer cmd,
    const OsdShape *s, VkImage source, VkImageView view, VkImage target, VkImageView color,
    VkBuffer host, VkDeviceSize sample_offset, VkExtent2D *extent,
    uint32_t count, const VkBufferImageCopy *read_regions) {
    VkSampler sampler;
    CHECK(vkCreateSampler(device, &(VkSamplerCreateInfo){.sType=VK_STRUCTURE_TYPE_SAMPLER_CREATE_INFO,
        .magFilter=VK_FILTER_NEAREST, .minFilter=VK_FILTER_NEAREST, .mipmapMode=VK_SAMPLER_MIPMAP_MODE_NEAREST,
        .maxLod=(float)(s->mips-1)}, NULL, &sampler));
    VkDescriptorType type = VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER;
    VkDescriptorSetLayoutBinding binding = {.descriptorType=type, .descriptorCount=1, .stageFlags=VK_SHADER_STAGE_FRAGMENT_BIT};
    VkDescriptorSetLayout set_layout;
    CHECK(vkCreateDescriptorSetLayout(device, &(VkDescriptorSetLayoutCreateInfo){
        .sType=VK_STRUCTURE_TYPE_DESCRIPTOR_SET_LAYOUT_CREATE_INFO, .bindingCount=1, .pBindings=&binding}, NULL, &set_layout));
    VkPushConstantRange push = {.stageFlags=VK_SHADER_STAGE_FRAGMENT_BIT, .size=sizeof s->mips};
    VkPipelineLayout layout;
    CHECK(vkCreatePipelineLayout(device, &(VkPipelineLayoutCreateInfo){.sType=VK_STRUCTURE_TYPE_PIPELINE_LAYOUT_CREATE_INFO,
        .setLayoutCount=1, .pSetLayouts=&set_layout, .pushConstantRangeCount=1, .pPushConstantRanges=&push}, NULL, &layout));
    VkPipeline graphics = pipeline(device, layout, *extent, s->raw_layers != 0);
    VkDescriptorPool pool;
    CHECK(vkCreateDescriptorPool(device, &(VkDescriptorPoolCreateInfo){.sType=VK_STRUCTURE_TYPE_DESCRIPTOR_POOL_CREATE_INFO,
        .maxSets=1, .poolSizeCount=1, .pPoolSizes=&(VkDescriptorPoolSize){type,1}}, NULL, &pool));
    VkDescriptorSet set;
    CHECK(vkAllocateDescriptorSets(device, &(VkDescriptorSetAllocateInfo){.sType=VK_STRUCTURE_TYPE_DESCRIPTOR_SET_ALLOCATE_INFO,
        .descriptorPool=pool, .descriptorSetCount=1, .pSetLayouts=&set_layout}, &set));
    VkDescriptorImageInfo texture = {sampler, view, VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL};
    vkUpdateDescriptorSets(device, 1, &(VkWriteDescriptorSet){.sType=VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET,
        .dstSet=set, .descriptorCount=1, .descriptorType=type, .pImageInfo=&texture}, 0, NULL);
    VkImageSubresourceRange range = {VK_IMAGE_ASPECT_COLOR_BIT, 0, 1, 0, 1};
    image_transition(cmd, target, range, VK_IMAGE_LAYOUT_UNDEFINED, VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL,
        VK_PIPELINE_STAGE_2_NONE, 0, VK_PIPELINE_STAGE_2_COLOR_ATTACHMENT_OUTPUT_BIT, VK_ACCESS_2_COLOR_ATTACHMENT_WRITE_BIT);
    VkRenderingAttachmentInfo attachment = {.sType=VK_STRUCTURE_TYPE_RENDERING_ATTACHMENT_INFO,
        .imageView=color, .imageLayout=VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL,
        .loadOp=VK_ATTACHMENT_LOAD_OP_CLEAR, .storeOp=VK_ATTACHMENT_STORE_OP_STORE};
    vkCmdBeginRendering(cmd, &(VkRenderingInfo){.sType=VK_STRUCTURE_TYPE_RENDERING_INFO, .renderArea={.extent=*extent},
        .layerCount=1, .colorAttachmentCount=1, .pColorAttachments=&attachment});
    vkCmdBindPipeline(cmd, VK_PIPELINE_BIND_POINT_GRAPHICS, graphics);
    vkCmdBindDescriptorSets(cmd, VK_PIPELINE_BIND_POINT_GRAPHICS, layout, 0, 1, &set, 0, NULL);
    vkCmdPushConstants(cmd, layout, VK_SHADER_STAGE_FRAGMENT_BIT, 0, sizeof s->mips, &s->mips);
    vkCmdDraw(cmd, 3, 1, 0, 0);
    vkCmdEndRendering(cmd);

    image_transition(cmd, target, range, VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL, VK_IMAGE_LAYOUT_TRANSFER_SRC_OPTIMAL,
        VK_PIPELINE_STAGE_2_COLOR_ATTACHMENT_OUTPUT_BIT, VK_ACCESS_2_COLOR_ATTACHMENT_WRITE_BIT,
        VK_PIPELINE_STAGE_2_TRANSFER_BIT, VK_ACCESS_2_TRANSFER_READ_BIT);
    vkCmdCopyImageToBuffer(cmd, target, VK_IMAGE_LAYOUT_TRANSFER_SRC_OPTIMAL, host, 1, &(VkBufferImageCopy){
        .bufferOffset=sample_offset, .imageSubresource={VK_IMAGE_ASPECT_COLOR_BIT,0,0,1},
        .imageExtent={extent->width,extent->height,1}});
    range.levelCount = s->mips;
    range.layerCount = actual_layers(*s);
    image_transition(cmd, source, range, VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL, VK_IMAGE_LAYOUT_TRANSFER_SRC_OPTIMAL,
        VK_PIPELINE_STAGE_2_FRAGMENT_SHADER_BIT, VK_ACCESS_2_SHADER_SAMPLED_READ_BIT,
        VK_PIPELINE_STAGE_2_TRANSFER_BIT, VK_ACCESS_2_TRANSFER_READ_BIT);
    vkCmdCopyImageToBuffer(cmd, source, VK_IMAGE_LAYOUT_TRANSFER_SRC_OPTIMAL, host, count, read_regions);
    VkMemoryBarrier2 visibility = {.sType=VK_STRUCTURE_TYPE_MEMORY_BARRIER_2, .srcStageMask=VK_PIPELINE_STAGE_2_TRANSFER_BIT,
        .srcAccessMask=VK_ACCESS_2_TRANSFER_WRITE_BIT, .dstStageMask=VK_PIPELINE_STAGE_2_HOST_BIT, .dstAccessMask=VK_ACCESS_2_HOST_READ_BIT};
    vkCmdPipelineBarrier2(cmd, &(VkDependencyInfo){.sType=VK_STRUCTURE_TYPE_DEPENDENCY_INFO, .memoryBarrierCount=1, .pMemoryBarriers=&visibility});
    CHECK(perform_finish(queue, cmd));
    vkDestroyDescriptorPool(device, pool, NULL);
    vkDestroyPipeline(device, graphics, NULL);
    vkDestroyPipelineLayout(device, layout, NULL);
    vkDestroyDescriptorSetLayout(device, set_layout, NULL);
    vkDestroySampler(device, sampler, NULL);
}
