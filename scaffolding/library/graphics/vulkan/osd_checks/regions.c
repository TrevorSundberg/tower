#include "control.h"

// Fixed storage for this five-texture test client. Production owns its region storage.
uint32_t osd_regions(const OsdShape *s, VkDeviceSize payload, VkBufferImageCopy *out, uint32_t capacity) {
    uint32_t layers = actual_layers(*s), count = 0;
    VkDeviceSize offset = 0;
    if (!s->mips || s->mips > 32 || layers > capacity / s->mips ||
        (s->channels != 1 && s->channels != 4)) return 0;
    for (uint32_t layer = 0; layer < layers; ++layer) {
        for (uint32_t mip = 0; mip < s->mips; ++mip) {
            uint32_t w = s->width >> mip, h = s->height >> mip;
            VkDeviceSize pixels = (VkDeviceSize)w * h;
            if (!pixels || pixels > (payload - offset) / s->channels) return 0;
            out[count++] = (VkBufferImageCopy){.bufferOffset = offset,
                .imageSubresource = {VK_IMAGE_ASPECT_COLOR_BIT, mip, layer, 1},
                .imageExtent = {w, h, 1}};
            offset += pixels * s->channels;
        }
    }
    return offset == payload ? count : 0;
}
