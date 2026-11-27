#include "../image_retirement.h"
#include <stdint.h>
#include <string.h>

void osd_destroy_retired_image(VkDevice, VkImageView, VkImage, VkDeviceMemory);

struct owner {
    VkImageView view;
    VkImage image;
    VkDeviceMemory memory;
    uint64_t size;
    uint64_t metadata[4];
};
_Static_assert(sizeof(struct owner) == 64, "recording owner layout");

struct totals { uint64_t bytes, count, peak_bytes, peak_count; };

/* Check callback identity independently of the device argument being tested. */
struct recording;
static _Thread_local struct recording *active;
void set_recording(struct recording *recording) { active = recording; }
struct recording *get_recording(void) { return active; }

void retire_test_owner(VkDevice device, struct owner *owner, struct totals *totals) {
    osd_destroy_retired_image(device, owner->view, owner->image, owner->memory);
    if (owner->memory) {
        totals->bytes -= owner->size;
        --totals->count;
    }
    memset(owner, 0, sizeof *owner);
}
