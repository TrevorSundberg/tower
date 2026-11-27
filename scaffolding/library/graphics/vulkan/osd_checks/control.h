#pragma once
#include <vulkan/vulkan.h>
#include <stdint.h>

typedef struct {
    uint32_t width, height, raw_layers, mips, channels;
} OsdShape;

static inline uint32_t actual_layers(OsdShape shape) {
    return shape.raw_layers ? shape.raw_layers : 1;
}

VkResult perform_finish(VkQueue queue, VkCommandBuffer cmd);
void osd_record(VkCommandBuffer cmd, VkBuffer src, VkImage dst,
                uint32_t layers, uint32_t mips, uint32_t count, const VkBufferImageCopy *regions);
