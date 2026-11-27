# Device-memory allocation and zero-offset image binding

This is the rendering-side contract for `draw-tower-image-memory/v1`.
Draw proposed the split at `51d4785e6456353b9a65f49d311cb0c6925ee42d`
(tree `509f0a80c0459aec8610cee96c53c2cd6a5cc72d`). The Tower base
`552485aceb1b875150965ea32edcbc7443e2e083` supplies the
[standalone allocation planner](image_allocation_plan_v1.md).
The two entries below are proposed exports for one library unit.

```c
#include <vulkan/vulkan.h>

VkResult tower_vk_allocate_memory_v1(
    VkDevice device, const VkMemoryAllocateInfo *info, VkDeviceMemory *out);

VkResult tower_vk_bind_image_memory_zero_v1(
    VkDevice device, VkImage image, VkDeviceMemory memory);
```

## Ownership at each call

1. The allocation caller supplies a live device, its original allocation
   descriptor and a separate, writable, initially null memory slot. Keep
   the descriptor and referenced storage live through return. Call
   `vkAllocateMemory(device, info, NULL, &temporary)` once with a private
   memory slot. Pass the original descriptor pointer, including its
   `pNext`, full `VkDeviceSize` and memory type index. Return the exact
   signed `VkResult`. On `VK_SUCCESS`, publish the handle into `*out`.
   Draw then owns the allocation. For every other result, leave `*out`
   byte-identical even if a test driver overwrote the private slot.
2. Draw records `allocationBytes = info->allocationSize` and updates live
   bytes, peak bytes and allocation count after allocation succeeds. Those
   updates are observable at the next call.
3. The bind caller supplies the same live device, its unbound image and
   compatible allocated memory. Call `vkBindImageMemory(device, image,
   memory, 0)` exactly once, and return its signed result unchanged.
   Draw keeps ownership of the image and allocation through return.
   Successful binding allows Draw to create the view. On failure Draw
   still owns the image and allocated memory and its accounting is intact.

Each entry borrows its inputs only for the synchronous driver call. Draw
retains diagnostics, any recovery on partial construction, and normal
retirement after the last use. The owner destroys the view, destroys the
image, frees the memory, updates accounting and clears its state.

## Source and recording reference

Draw traced `osd_create` through `image_create_layers` to both owning
constructors. In its pinned tree the C block is `image_allocate` at
`draw.c:2153` (blob `c0c0d8f386da6e037d2df0402ce71e9f50037013`).
The Tower block is `draw_vk_image_allocate` at
`tower/vulkan_image.tower:106` (blob
`9dc16249bca873981a5e063de8130defdd344a72`). Draw reported four
matched pairs of CPU recording runs using the two existing owners.

| Driver outcome | Draw observation |
| --- | --- |
| Allocation and bind succeed | The 16,384-byte and 4,294,983,680-byte allocations retained their full size. Live bytes and count returned to zero after retirement. |
| Allocation returns −2 | The driver left the raw output alone. The image was live, the memory and view slots empty, and size, live bytes and allocation count zero. The owner diagnosed allocation and exited 1 before binding. |
| Allocation succeeds and bind returns −2 | At bind the successful handle was published and 16,384 bytes and one allocation were accounted. The owner diagnosed bind and exited 1 with no view. Its recording trace ended before destruction, free or counter reversal. |

Both existing owners pass the actual owner slot directly to allocation.
The private output slot in this contract adds protection against a
clobbering error return. Distinguish that proposed guarantee from the
observed raw failure with an untouched slot.

## Provider acceptance

Exercise the real SDK header from an external C caller and a caller linked
to the Tower unit. Record allocation and bind as separate operations.
Check pointer identity and nested descriptor storage, null allocator,
the full-width size, index 31, the exact published memory handle, device
and image, and the zero `VkDeviceSize` bind offset. Check caller accounting
between the calls and an owner action after successful bind. Repeat the
same signed error at each stage, include a clobbering allocation failure
and guard the public slot. Trace the first failing driver call and verify
that the owner never advances to view creation after failure.

On existing hardware compare raw and linked calls for the five retained OSD
source images. Identify the selected device and driver. Check the plan
that the allocation actually consumes, the allocation passed to bind,
guarded pixels and sampling, queue completion and view/image/memory
destruction. Keep injected return values and real driver results separately
attributed. Draw's production caller and any shipping error recovery have
their own acceptance runs.

## Draw compatibility acknowledgement

Draw fetched Tower `21e0d03be39e256504d74702b4d75ad0416c8fb5` and
confirmed both SDK signatures against Draw
`51d4785e6456353b9a65f49d311cb0c6925ee42d`. Both constructors can pass
the original allocation descriptor and its extension chain. Their empty
owner slot accepts the handle on success. The existing Draw accounting
runs before the bind call and the two diagnostics retain their separate
operation names. This acknowledgement covers the interface and ownership
sequence. The portable provider and the device runs have separate
implementation and test receipts.

## Standalone provider and consumption

The [implementation](image_memory.tower) imports the existing readback ABI. Include
[the SDK header](image_memory.h) in the C caller. Link the resulting object into the
consumer along with the target Vulkan loader. Allocation uses one initially null
automatic handle and publishes it after success. The bind entry has no state.

From the Tower repository root, the packaged Linux bootstrap builds either object.

```bash
v=scaffolding/library/graphics/vulkan
tower=(bootstrap/linux-x64/towerc --foundation scaffolding/foundation.tower --library --jobs 1)
"${tower[@]}" "$v/image_memory.tower" -o image_memory.o
"${tower[@]}" "$v/image_memory.tower" --target x86_64-w64-windows-gnu -o image_memory.obj
```

Host 12 built the x86-64 ELF and AMD64 COFF directly from the same source.
Both define the two entries above and require only `vkAllocateMemory` and
`vkBindImageMemory`. The SDK caller in [memory_client.c](osd_checks/memory_client.c)
uses the same call sites in the CPU recorder and the five-image hardware run.
Define `OSD_RAW_SDK` to build the independent SDK reference. The linked arm calls
the separate Tower object. The CPU double overwrites its private output on success
and failure. With both allocation sizes it observed a memory-type index of 31 and
the original descriptor and dedicated-allocation chain. At bind it inspected the
owner's published slot, allocation size, live bytes, peak and count.

| Checked on host 12 | Result |
| --- | --- |
| 16 KiB and 4 GiB + 16 KiB, allocation and bind succeed | Recorded view creation and modeled completion, followed by view/image destruction, free, zero live bytes and zero count. |
| Allocation returns −2 or +1 | Exact status, guarded public slot unchanged, zero live bytes, no bind or view. |
| Bind returns −2 or −7 | Exact status, owner retains the published handle, full live and peak bytes and count one. CPU trace stops at bind. |
| Five retained hardware images | RTX 3090, driver 565.57.01, all ten real calls succeeded per run. Sixteen completed sampled reads matched all 103,158,144 reference bytes. After completion the owner destroyed each view and image and freed its bound allocation. |

The hardware return controls inject −2 at the first allocation or first bind.
The Linux fixture's failure cleanup releases its staging allocation, destroys the
source image, then calls `vkFreeMemory` with its current slot (null on allocation
failure, the live allocation on bind failure). Neither path created a view.
Draw's own retirement/accounting policy and a running Win64 consumer require
their respective owner tests. The standalone COFF has been cross-built and its
relocations inspected. The job does not assign DLL ordinals.

The archived job `fb2f4a01-62de-4f17-9d0f-0ae92eed5cba` includes the
object pair, checked fixture inputs, raw Linux results and the clean replay
entry point. See the [host 12 journal entry](../../../../docs/temporal-opcode-research-journal.md#standalone-draw-image-memory-provider-on-host-12).
