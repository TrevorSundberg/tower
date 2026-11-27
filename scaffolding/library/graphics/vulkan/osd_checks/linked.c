#include "control.h"
#include "../osd_texture_upload_record.h"

void osd_record(VkCommandBuffer cmd, VkBuffer staging, VkImage image,
                uint32_t layers, uint32_t mips, uint32_t count, const VkBufferImageCopy *regions) {
    tower_vk_osd_texture_upload_record_v1(cmd, staging, image, layers, mips, count, regions);
}
