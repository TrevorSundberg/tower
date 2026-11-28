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
The Linux standalone provider has the fixture coverage below. Draw's shipping
constructor has its own adoption check.

## Linux standalone provider and checks

[Provider](image_allocation_plan.tower) and [SDK declaration](image_allocation_plan.h)
implement this contract. The caller must supply its physical device's table
with at most 32 entries. The provider keeps the requirements on the stack,
advances an unsigned eligibility bit once per entry and writes the output
only at the first match.

From the Tower root, build the Linux x86-64 object for a C application with
the pinned bootstrap. Add the resulting object to the application's normal
Vulkan loader link and include `image_allocation_plan.h` at the call site.

```sh
bootstrap/linux-x64/towerc --foundation scaffolding/foundation.tower --library --jobs 1 \
    scaffolding/library/graphics/vulkan/image_allocation_plan.tower -o plan.o
```

Rendering independently rebuilt the 1,088-byte object, SHA-256
`2884c8ad19d32dfd05dcb60e3be560599de85e8b724cff1742f54e5246d3ad80`,
and ran the external C recorder. Its nine rows matched the worker's
rows byte for byte, SHA-256
`ed6ced81bad6a066292e87b29a78d55630920d2fa4594d69870ffc202ad303e2`.

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

## Draw constructor adoption on Linux

Draw adopted Tower `26efb7bb7d06da8ccd6748c283a8e5eae07c40e4` in its
owning C and Tower image constructors at local commit
`51d4785e6456353b9a65f49d311cb0c6925ee42d`
(tree `509f0a80c0459aec8610cee96c53c2cd6a5cc72d`).
Draw reproduced the 1,088-byte object and the nine external C recording
rows above. Rendering reran its retained C recorder and matched those rows
byte for byte.

From the Draw root, select the standalone provider with the following
command, where `tower_root` is the checked-out Tower release.

```sh
DRAW_TOWER_IMAGE_ALLOCATION_PLAN_ROOT="$tower_root" bash tests/vulkan-image.sh
```

Draw ran 29 cases across four recording configurations, then the same 29
across twelve configurations with the earlier shared graphics and preflight
libraries. It also ran two view controls. Both combined test executables
linked the planner object directly and imported image creation and preflight.
Draw reported these executable hashes.

| Draw constructor | Recording ELF SHA-256 |
| --- | --- |
| C | `bd7eed9f39147f21bed5ea10da591d24c5b7083ded6bae151fec73f3b8dc4ce3` |
| Tower | `d054a66d58a8aea0d0e2041c4840a12917f2327332b5920ee89fc953f9d101c2` |

Both owners carried 4,294,983,680 bytes and memory type 31 through the
allocation, bind and retirement trace. With an empty table or no matching
type, the process exited 1 after the requirements query. An injected −2
at allocation stopped before accounting. The same signed error at bind
followed an accounted allocation of 16,384 bytes. The five shipping OSD
headers reproduced the earlier 45-event lifecycle trace, SHA-256
`e5db18d01d84e0601fab1a1b0b50720219e60aa3cf003db8fda992dbeed86e89`.

These Draw checks used a recording driver. Draw queued its shipping GPU
comparison on the RTX 5060 Ti under job
`7e3234ce-f5ca-4d1a-807a-086d3a68d274`, after its preflight and recovery
inputs.

## Draw shipping Linux result for the standalone planner

Draw reviewed job `7e3234ce-f5ca-4d1a-807a-086d3a68d274` at worker
source `3c97e58cf7373eee30ce38724f909403e07063ba` and tests `7e917253`,
using Draw `bb53b12b` as the control. The worker reconstructed the adopter
because it lacked the manager's `51d4785e` revision. Both linked shipping
executables used the 1,088-byte planner object from Tower
`26efb7bb7d06da8ccd6748c283a8e5eae07c40e4`. Draw checked the
instructions and their resolved Vulkan memory-requirements query.
Rendering rehashed its retained object and reran the nine-row C recording
control. They matched the object and row digests above.

| Linked Draw owner | Shipping ELF SHA-256 |
| --- | --- |
| C | `e279ac6365694b67b2541825adaca86d8c601ed3536f72ba33efe2a5a4ffdfc9` |
| Tower | `b76fb71cc6075b674903e08f3ef46cc40b0597e41df695557fa0eb4e402444ad` |

Draw selected the planner at build time with
`DRAW_TOWER_IMAGE_ALLOCATION_PLAN_ROOT=/home/agent/work/7e3234ce/sdk-root`.
The other operations used the eleven-entry graphics DSO and separate
preflight DSO. The C build unset `TOWERC` and `DRAW_TOWER_FRAME_SUBMIT`.
The following capture used an API-selected RTX 5060 Ti (10de:2d04),
Vulkan 1.4.303 and NVIDIA 570.169.

```sh
cd /home/agent/work/7e3234ce/draw
VK_DRIVER_FILES=/etc/vulkan/icd.d/nvidia_icd.json \
  /home/agent/work/7e3234ce/ev/build/tower-linked \
  --offscreen --validate --fixed-time 0 --day-hour 12 --size 1280 800 \
  --frames 4 --osd assets/osd/state.bin --resize-test --no-hud \
  --capture /home/agent/work/7e3234ce/ev/gates/hud-tower-linked.ppm
```

Draw's four C/Tower and control/linked configurations passed the assets
and core checks and agreed on HUD, camera and post-completion retirement.
All five images selected memory type 1 from mask 3 with alignment 1,024
and bind offset zero. The requirements in pack order were 25,165,824,
569,856, 569,856, 1,572,864 and 32,768 bytes. Rendering also checked those
five values against its earlier RTX 3090 trace. Draw compared all 16
subresources to the real pack. The 27,541,504 active bytes hashed to
`df14881703119d96e6def5700eafd7927d7b83c890bf3e85f77d4db11e679ac4`.
The 27,906,048 bytes including guards and padding hashed to
`bd512fc0888f77285f3fa422326f9923471e5d306b7242455fd13825d87bd76f`.
The reported median frame times (control, linked) were 9.666 and 9.651 ms
for C, and 9.652 and 9.677 ms for Tower.

Draw verified 2,353 archive entries, SHA-256
`b3e9a7d4a0c7aed5a6e9beff0af9ebf2c45b801cdab150457e48834ac690bb9c`,
and parsed the wait statuses. All ten healthy processes exited 0.
The 42 injected trials produced the following outcomes.

| Injection | Normal exit 1 | SIGSEGV |
| --- | ---: | ---: |
| Format preflight | 7 | 1 |
| Second image creation | 8 | 0 |
| No compatible memory type (zero mask) | 8 | 2 |
| Memory allocation returned −2 | 6 | 2 |
| Image binding returned −2 | 6 | 2 |
| Total | 35 | 7 |

Four signals occurred in controls, two in linked production executables and
one in a linked observer. A rejected allocation stopped before accounting
and bind. A rejected bind followed a successful, accounted 569,856-byte
allocation. Even processes that exited 1 left incomplete owner cleanup on
no-match, allocation failure and bind failure. The per-trial environment
and command are in the Draw archive's `trace/*.wait.json`. The bind
injection selected `FAULT=bind` with the following child arguments.

```text
--offscreen --osd-test assets/osd/state.bin --fixed-time 5 --size 960 540 --frames 3 --validate --capture /home/agent/work/7e3234ce/ev/gates/trace-last.rgba
```

Draw tracks those three owner cleanup paths in
`1823ef69-56ed-451a-8b63-30333031b797` and format-preflight recovery in
`1b416017`. The observed requirements and plan selections agree with the
reference. The cause of the process signals remains unresolved.
