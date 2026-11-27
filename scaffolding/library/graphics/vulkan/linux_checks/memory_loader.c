/* Forward the device recorder's calls past the executable's ELF interposers.
 * The next definition may itself be the retained lifetime observer. */
#define _GNU_SOURCE
#include <dlfcn.h>
#include <stdio.h>
#include <stdlib.h>
#include "../image_memory.h"

static void *next_symbol(const char *name) {
    void *address = dlsym(RTLD_NEXT, name);
    if (!address) {
        fprintf(stderr, "resolve %s: %s\n", name, dlerror());
        abort();
    }
    return address;
}

VkResult memory_loader_allocate(VkDevice device, const VkMemoryAllocateInfo *info,
                                const VkAllocationCallbacks *allocator, VkDeviceMemory *out) {
    PFN_vkAllocateMemory allocate = (PFN_vkAllocateMemory)next_symbol("vkAllocateMemory");
    return allocate(device, info, allocator, out);
}

VkResult memory_loader_bind(VkDevice device, VkImage image, VkDeviceMemory memory, VkDeviceSize offset) {
    PFN_vkBindImageMemory bind = (PFN_vkBindImageMemory)next_symbol("vkBindImageMemory");
    return bind(device, image, memory, offset);
}
