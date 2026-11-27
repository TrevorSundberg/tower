#include "control.h"
#include "../tight_color_regions.h"

/* SDK boundary for the retained Win64 five-texture caller. */
uint32_t osd_regions(const OsdShape *s, VkDeviceSize payload, VkBufferImageCopy *out, uint32_t capacity) {
    return tower_vk_build_tight_color_regions_v1(out, capacity, s->width, s->height,
                                                 actual_layers(*s), s->mips, s->channels, payload);
}
