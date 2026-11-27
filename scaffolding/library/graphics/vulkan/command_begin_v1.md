# Starting another recording on a retired primary

This Linux x86-64 Tower entry is under internal review for Draw
`30b66f597b33c6f88964779f0ab1b87e847dc839`. The counted Tower caller
and native C controls below exercised the entry. Draw's exact parameter
list, failed-operation reporting convention and per-caller flag values
still need comparison before proposing an adapter or publishing a Draw
contract. The work started at Tower `09769704` and includes the
documentation corrections from `2477ba66`.

## Caller contract

Include `frame_submit.h`. Pass a live primary allocated from a pool
created with `VK_COMMAND_POOL_CREATE_RESET_COMMAND_BUFFER_BIT` and a
distinct writable 32-bit result slot. The caller synchronizes host access
to the pool and command buffer and establishes that every submission
using the buffer has retired. On the frame path, only a successful wait
for the corresponding submitted fence establishes the completion used here.

```c
VkResult tower_vk_command_reset_begin_v1(VkCommandBuffer command,
    VkCommandBufferResetFlags reset_flags, VkCommandBufferUsageFlags usage,
    uint32_t *failed_step);
```

The operation resets this one primary with the supplied reset flags.
After success it begins the same buffer with the supplied valid primary
usage flags, `VK_STRUCTURE_TYPE_COMMAND_BUFFER_BEGIN_INFO`, and null
extension and inheritance pointers. It retains no addresses and creates
no resources. Each call returns its first non-success signed Vulkan
result unchanged. The following table gives all outcomes.

| Loader calls in order | Return | Output step |
| --- | --- | --- |
| Reset fails | Reset result | TOWER_VK_COMMAND_STEP_RESET |
| Reset succeeds, begin fails | Begin result | TOWER_VK_COMMAND_STEP_BEGIN |
| Reset succeeds, begin succeeds | VK_SUCCESS | TOWER_VK_COMMAND_STEP_OK |

The step identifies the Vulkan operation even when both would report the
same result. On success, record ordinary commands, then use the existing
end and submit entries. On failure, stop the frame at the identified step.
A fence the app reset for a submission that never happened cannot signal
for that submission. Acquisition, fence wait/reset, queue synchronization,
history updates and presentation all belong to the app. Fresh allocations
in the existing shaderless and counted callers continue to begin directly
from pools with flags zero. [End and submit lifetime](command_end_v1.md)

## C linkage

From the repository root, with the absolute loader path in
`vulkan_loader`, build the new object independently. The combined DSO
can reuse the original end/submit object.

```sh
v=scaffolding/library/graphics/vulkan
bootstrap/linux-x64/towerc "$v/command_begin.tower" --library --jobs 1 -o command_begin.o
bootstrap/linux-x64/towerc "$v/command_end.tower" --library --jobs 1 -o command_end.o
x86_64-linux-gnu-ld -shared -z defs command_begin.o command_end.o "${vulkan_loader:?}" \
    -soname libtower_frame_submit.so -o libtower_frame_submit.so
```

The standalone begin object exports only the new entry. Its two undefined
symbols are `vkResetCommandBuffer` and `vkBeginCommandBuffer`. The
combined DSO adds the existing end and submit exports and the loader
dependencies `vkEndCommandBuffer` and `vkQueueSubmit`. The verified
end/submit object still hashes to
`e6cb394beffaf44bce041603f58af6c29bf934e0edd8d408d56cd16857a9c5d1`.

## Host 12 replay

Extract assignment `e576d09c-c639-4b78-aafb-bd90e2144800` and run the
following from its manifest directory on the provisioned SDK host.

```sh
REPLAY=$(mktemp -d) LOCAL_TOWER=/tmp/end-confirmed-74b8/clean bash replay.sh
```

The replay verifies input hashes and the bundle, builds from the pinned
Linux bootstrap, reuses the hashed shader data, compares rebuilt link
products, and exercises both one-shot callers and the new test entry.

```sh
./counted_fixture reuse-core13 shaders/produce.comp.spv shaders/triangle.vert.spv shaders/color.frag.spv
```

The reuse caller keeps one pool, one primary and one fence through three
frames. Each frame ends, submits, waits, and checks two 24-byte producer
records and two 32-byte guarded caller buffers. The count-zero pixels are
`112233ff` and the count-one pixels are `4080bfff`, four of each. The
two captures swap storage positions on the middle frame. The loader trace
records the command and fence addresses, pool flags, independent fence
status after each wait, and reset/begin arguments. The tested reuse caller
uses zero for both flag words. The recording controls independently
exercise release-resources reset and one-time or simultaneous-use begin.

The hardware-selected device was the discrete RTX 3090, PCI 10de:2204,
API 1.3.289, NVIDIA 565.57.01. The raw Vulkan C reference, ordinary Tower
and C-through-DSO reuse caller produced identical guarded output and zero
Khronos synchronization-validation warnings or errors. Injecting host OOM
at reset or begin on the second frame exited 1 with the respective Vulkan
name, before that frame could submit. Displayed WSI, Draw linking this
entry, actual device loss and noncoherent memory remain open. Details of
instrumentation and bounded timings accompany the assignment.
