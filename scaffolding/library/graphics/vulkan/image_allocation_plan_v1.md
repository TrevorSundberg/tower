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

## Linux standalone provider and checks

[Provider](image_allocation_plan.tower) and [SDK declaration](image_allocation_plan.h)
implement this contract. The caller must supply its physical device's table
with at most 32 entries. The provider keeps the requirements on the stack,
advances an unsigned eligibility bit once per entry and writes the output
only at the first match.

On host 12, from the root of this revision with the worker SDK environment
loaded, the following builds the standalone object and runs the external C
recording client. The SDK recorder provides the Vulkan entry at final link.

```bash
set -eu
b=$(mktemp -d)
v=scaffolding/library/graphics/vulkan
l=$TOWER_SDK_ROOT/usr/lib/x86_64-linux-gnu
tower=(bootstrap/linux-x64/towerc --foundation scaffolding/foundation.tower --library --jobs 1)
cc=(clang-19 --sysroot="$TOWER_SDK_ROOT" -O2 -std=c11 -Wall -Wextra -Werror -fPIC)
"${tower[@]}" "$v/image_allocation_plan.tower" -o "$b/plan.o"
"${tower[@]}" "$v/osd_checks/plan_cases.tower" -o "$b/cases.o"
"${cc[@]}" -ftls-model=initial-exec -c "$v/osd_checks/plan_driver.c" -o "$b/driver.o"
"${cc[@]}" -c "$v/osd_checks/plan_client.c" -o "$b/client.o"
x86_64-linux-gnu-ld -pie -z noexecstack -dynamic-linker /lib64/ld-linux-x86-64.so.2 \
    "$l/Scrt1.o" "$l/crti.o" "$b/cases.o" "$b/driver.o" "$b/client.o" "$b/plan.o" \
    "$l/libc.so.6" "$l/crtn.o" -o "$b/record"
"$b/record"
```

Nine rows must end in `ok=1`. The job packet for
`a66f0252-1d11-4f29-b6f2-0ef64da646d1` also links the independent SDK
selector and an external Tower caller. Its hardware recipe applies
[the fixture patch](osd_checks/linux_plan_fixture.patch) to the five-texture
Linux image-create fixture from Tower `5dd53312b20bd063cd9d469dc1549d3720017a2b`.
The sampled-source branch calls [the test owner](osd_checks/plan_gpu.tower)
just after successful creation. Readback targets and staging buffers retain
their original owner. Link maps and disassembly identify the selected object.

The API-selected RTX 3090, UUID `cd3d9791fe794e0b3ec29fc16b74d31c`,
driver 565.57.01, family 0 queue 0, returned alignment 1,024 and mask
`0x00000003` for all five sources. The six table entries in ascending order
had (flags, heap) pairs (0,1), (1,0), (1,0), (6,1), (14,1), (7,2).
Each plan selected type 1. The five allocation sizes, in upload order, were
25,165,824, 569,856, 569,856, 1,572,864 and 32,768 bytes. All ten real
allocation and bind results per run were zero. Each bind used offset zero.
After 16 sampled reads retired, the owner released each view, image and
bound allocation in that order. All three arms reproduced the guarded
103,158,144-byte reference with SHA-256
`140d8d6511a77daee97ebd377dfc34c9c90347cf084d0dd4516e5474315d143b`.

Draw retains allocation policy and adoption. Linux shared-library export
packaging belongs to the rendering manager. Its next reviewed build should
check the complete preceding export set, including preflight if adopted,
alongside this entry. This receipt covers the Linux standalone object.
