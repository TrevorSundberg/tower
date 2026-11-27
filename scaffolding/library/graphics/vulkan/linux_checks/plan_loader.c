/* GNU ld --wrap only rewrites references in its own link. Export the retained
 * recorder's query from the executable so it observes the DSO's PLT as well. */
#define _GNU_SOURCE
#include <dlfcn.h>
#include <stdio.h>
#include <stdlib.h>
#include <vulkan/vulkan.h>

void plan_loader_requirements(VkDevice device, VkImage image, VkMemoryRequirements *out) {
    PFN_vkGetImageMemoryRequirements query = (PFN_vkGetImageMemoryRequirements)
        dlsym(RTLD_NEXT, "vkGetImageMemoryRequirements");
    if (!query) {
        fprintf(stderr, "resolve vkGetImageMemoryRequirements: %s\n", dlerror());
        abort();
    }
    query(device, image, out);
}
