# Vulkan image allocation planning for Draw

Tower accepts `draw-tower-image-allocation-plan/v1` for the first five OSD
textures. Draw identified `image_allocate` at `draw.c:2108`, its memory-type
selection at `draw.c:1831`, and the owning Tower functions
`draw_vk_image_allocate` and `draw_vk_memory_type` at Draw
`2f38b19c8218fef304993df5708a7458fa16776b`. The common Linux library at
Tower `bef3026fc41d02334a2fd3f88f18b8d6e9392abe` has compatible
`VkMemoryType`, `VkMemoryRequirements` and `VkMemoryAllocateInfo` layouts.
Its [readback allocator](readback_clear.tower) already uses this first-match
rule and the full Vulkan requirement size.

```c
VkBool32 tower_vk_plan_image_allocation_v1(
    VkDevice device, VkImage created, const VkMemoryType *types,
    uint32_t count, VkMemoryPropertyFlags required, VkMemoryAllocateInfo *out);
```

Borrow the live device, its newly created unbound image and the creating
physical device's memory-type table through return. The table supplies
`count` readable entries, with `count <= VK_MAX_MEMORY_TYPES`. Supply
separate writable output storage. One call to
`vkGetImageMemoryRequirements(device, created, &requirements)` precedes
selection. In ascending order over `i < count`, require both a set bit
in `requirements.memoryTypeBits` at `i` (unsigned 32-bit mask) and
`(types[i].propertyFlags & required) == required`.

On the first match, return `VK_TRUE` and publish the following fields.

| Field | Value |
| --- | --- |
| `sType` | `VK_STRUCTURE_TYPE_MEMORY_ALLOCATE_INFO` |
| `pNext` | `NULL` |
| `allocationSize` | The full `requirements.size` as a `VkDeviceSize` |
| `memoryTypeIndex` | The first matching `i` |

On no match, including an empty table, return `VK_FALSE` with every output
byte preserved. The query still occurs once. The operation ends at the
plan. Draw supplies `DEVICE_LOCAL` for these textures and retains the image
and type table. It handles the no-match diagnostic, calls `vkAllocateMemory`,
accounts bytes after successful allocation, binds at offset zero, creates
the view and retires GPU use before destroying the view, image and memory.
The plan returns a `VkBool32`. Allocation and bind each keep their own
signed `VkResult` in the caller. The existing buffer callers retain
their UMA and caching preferences.

## Acceptance

Use a recording Vulkan driver and an external C caller linked to the Tower
entry. Check the original device and image in the single requirements
query. The recorder must observe zero allocation and bind calls inside
the planner. Compare the following outputs against an independent SDK
selection and preserve canaries around the input table and output.

| Requirements and caller input | Expected result |
| --- | --- |
| Size 16,384, alignment 512, mask `0x80000001`, 32 entries, only entry 31 is device-local | True, size 16,384, index 31 |
| Same mask and count, entries 0 and 31 both match | True, index 0 |
| Only bit 31 eligible, count 31 | False, output byte-identical |
| Empty mask, empty table, or flags missing one required bit | False on each, output byte-identical |
| Required flags zero, several allowed entries | True, lowest allowed index |
| Requirement size `0x100004000`, permitted matching type | True, full 64-bit size unchanged |

Draw reports its current CPU owner selects index 31 in the first case.
With no compatible type it stops after requirements. An injected allocation
error −2 stops before accounting. An injected bind error −2 observes a
previously accounted 16,384-byte allocation. These are caller controls.

For hardware acceptance, capture the actual selected API device and driver,
each source image's requirements and table, the returned plan, and the
allocation and zero-offset bind that consume it. Compare the five uploads,
sampled readback and retirement with the raw caller on the same adapter.
The portable provider and its linked Draw execution await testing.
