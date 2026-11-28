# Counted indexed Vulkan raster control

On host 12 the `counted-core13` Tower executable observed `112233ff` with
a GPU count of zero and `4080bfff` with a GPU count of one. Both cases used
the same RTX 3090, pipeline, uint16 indices, indirect stream, RGBA8 image and
queue. One command buffer and one signaled fence covered both captures.

## Source contract and profiles

Draw's reported `gpu_check` at `7be8d020b07454789195427588712c72ee465637`
uses `vkCmdDrawIndexedIndirectCount`. The manager supplied its layout and
pixel oracle. Host 12's authorized reader has only the Tower repository.
The [three GLSL controls](counted_shaders/) replace the unavailable Draw
shaders. The fixture covers the named command path. Draw's C control flow,
original shaders, full feature predicate and end-to-end parity still require
an authorized source comparison.

| Input | Contract used here |
| --- | --- |
| Count | Little-endian u32 at byte 0 of the storage/indirect buffer |
| Records | Start at byte 4, 20-byte stride, capacity 16384, total 327684 bytes |
| Record fields | u32 indexCount, u32 instanceCount, u32 firstIndex, i32 vertexOffset, u32 firstInstance |
| Index data | 0, 1, 2 as uint16, plus one padding element for the transfer update |
| Output | 2×2 `R8G8B8A8_UNORM`, CLEAR and STORE, 8 active bytes per row |
| CPU copy | 32-byte allocation filled with `a5`, offset 4, writable span 24, pitch 12. Both row gaps and both outer guards are checked. |

The `draw14` probe identifies the physical device through a Vulkan 1.3
instance. It exits 1 before device creation if the device API is below Draw's
required Vulkan 1.4. On a newer device it also refuses to certify the missing
Draw feature inventory. The runnable profile is an explicit CLI choice.

`counted-core13` queries and enables core `drawIndirectCount` and
`dynamicRendering`. It requires a graphics+compute queue, the full advertised
capacity within `maxDrawIndirectCount`, sufficient storage-buffer range and
a compatible single-sample attachment/transfer format. It records the
availability of `multiDrawIndirect`. The logical device enables no base
feature bits. This command has its own feature and count limit. See the
[Khronos command reference](https://docs.vulkan.org/refpages/latest/refpages/source/vkCmdDrawIndexedIndirectCount.html).

## Creating a module from an in-memory shader

Import `library.graphics.vulkan.shader_module`. Pass a live device, the
first aligned `u32*` of a readable, validated, device-compatible SPIR-V
asset, its **word count** and the address of a distinct, initialized null
`VkShaderModuleHandle*`. The operation checks alignment, the minimum
five-word header size, byte-length multiplication, address wrap, output
overlap and an occupied slot before calling Vulkan. The caller supplies
the actual extent, lifetime and shader validity of the borrowed array.

`vk_create_shader_module(device, words, word_count, &module)` returns
`VkShaderModuleResult`. Check `called` first. A false value means local
argument rejection. If true, `result` is the exact signed VkResult.
Only `called && result == 0` transfers a module into the slot. Both failure
paths preserve its contents. The caller owns the words throughout and may
release them on return. After the last pipeline creation that uses a module
has returned, destroy it once with `vkDestroyShaderModule(device, module, null)`
while the device lives. The resulting pipelines have their own lifetimes.

The counted fixture opens, hashes and frees its Linux files and buffers as
before. Compute, vertex and fragment now pass through the same library
operation. Offline glslang and spirv-val commands, accepted digests and the
hardware and software pixel oracles below apply to the extracted path.
The runner from implementation `255836f8` has SHA-256
`7a2f69dc05f7a2e6cd1e362d18435816a39de09beb46a3f4a203eb3cd190adc1`.

After the Linux build below, run the isolated output-ownership checks
from the same shell. The test executable supplies its own synchronous
create/destroy symbols and exits 0 on success.

```bash
"$cc" "$v/shader_module_checks.tower" --library --jobs 1 \
    --foundation "$s/foundation.tower" -o "$out/checks.o"
"$cc" --link-executable "$out/checks.o" --link "$out/runtime.o" \
    --sysroot "$sdk" -o "$out/checks"
"$out/checks"
```

The slot 12 packet for assignment `6ad78267-230b-41f5-98a7-603d93965ba3`
also contains `focused.sh`. It links a copy of the counted object with a
test-only allocator probe at its single shader-create relocation. Using the
validated compute asset on llvmpipe, the driver returned
`VK_ERROR_OUT_OF_HOST_MEMORY` (−1). The fixture printed that value and exited 1
before submission with zero validation warnings/errors. The allocator
callbacks carry no mutable state and always deny allocations. The probe
destroys an unexpected successful handle with the same allocator and fails
the test. Normal runs use the loader directly and pass a null allocator.

The same C entry is available as a [Windows x64 DLL](shader_module_windows.md).

### Calling from C on Linux x86-64

Use `shader_module_c.h` with the Vulkan SDK and SysV LP64 calling convention.
Keep the caller's missing-file, byte-length and SPIR-V magic checks. Divide
the validated byte length by `sizeof(uint32_t)` to obtain the word count.
The C entry borrows all inputs synchronously. Supply exclusive, naturally
aligned storage for each output, disjoint from the words and any device
storage. Initialize the handle even when the old raw Vulkan call accepted
an uninitialized output. For example, inside the caller's success path:

```c
VkShaderModule candidate = VK_NULL_HANDLE;
int32_t result = 0;
uint32_t called = tower_vk_try_create_shader_module(
    device, words, byte_length / sizeof(*words), &candidate, &result);
/* The caller may release words here. */
if (called && result == VK_SUCCESS) {
    /* Transfer candidate to the pipeline owner. */
}
```

A return of zero with a valid, separate result slot sets `result` to zero.
Report that case as an argument refusal. A return of one with a nonzero
result delivers the driver's signed error. In both cases the module slot
retains its original value. The wrapper rejects a null, misaligned or
overlapping result pointer without writing through it. The overlap check
uses the claimed extent even for an excessive word count. Callers own the
actual allocation sizes and lifetimes. Destroy a successful handle once
with `vkDestroyShaderModule(device, candidate, NULL)` on its creating
logical device after the last pipeline creation that uses it returns.

From the checkout containing this entry, build the object with the published
bootstrap. With an ordinary Linux x64 C toolchain and Vulkan development
headers/libraries, link it alongside the consumer's existing objects:

```sh
set -eu
v=scaffolding/library/graphics/vulkan
(cd bootstrap/linux-x64 && sha256sum -c --status SHA256SUMS)
bootstrap/linux-x64/towerc "$v/shader_module_c.tower" --library --jobs 1 \
    --foundation scaffolding/foundation.tower -o shader_module_c.o
nm -g shader_module_c.o
cc -I"$v" -c consumer.c -o consumer.o
# Run with the ordinary application's main and any other required objects.
cc main.o consumer.o shader_module_c.o -lvulkan -o application
```

The ELF64 relocatable defines `tower_vk_try_create_shader_module` and has
one undefined symbol, `vkCreateShaderModule`. The object requires the
Vulkan loader (`libvulkan.so.1` at runtime). The standalone entry requires
no Tower runtime object. Alternatively link the same object as a shared
library with `cc -shared -nostdlib -Wl,-z,defs shader_module_c.o -lvulkan -o libtower_shader_module.so`.
Place the resulting library on the application's loader search path.

The external C smoke test below checks for a local refusal. Save it as
`smoke.c` and build it with the same Vulkan headers used by the application.

```c
#include "shader_module_c.h"
#include <assert.h>

int main(void) {
    VkShaderModule module = VK_NULL_HANDLE;
    int32_t result = -99;
    uint32_t called = tower_vk_try_create_shader_module(VK_NULL_HANDLE, NULL, 0, &module, &result);
    assert(called == 0 && result == 0 && module == VK_NULL_HANDLE);
    return 0;
}
```

Starting with the Tower object and shared library built above, run both forms.

```sh
cc -I"$v" smoke.c shader_module_c.o -lvulkan -o smoke-object
./smoke-object
cc -I"$v" smoke.c -L. -ltower_shader_module -Wl,-rpath,'$ORIGIN' -o smoke-shared
./smoke-shared
```

On Linux x64 both C executables exited 0. The shader object was 1,360 bytes,
SHA-256 `a5b21cb8757eaffbedb0217cf12dc97aacf8a62059ebe6f8eb955b2f1098a381`.
In the counted driver test, a C call site passed three independent control
modules of 438, 273 and 95 words to the same entry. The RTX 3090 run returned
the guarded count-zero and count-one images. A separate llvmpipe run forced
an allocation refusal and returned called=1, result=-1, with an empty slot.

Slot 12 assignment `31e3de36-8175-4013-b2d6-368435dfb3d6` exercised C
calls into this object for all three independent control shaders. The
packet includes the C consumer, counted-fixture overlay, link commands,
object and DSO, device traces and failure runs. The Linux
`counted-core13` hardware and software results below apply. Draw's original
292/285/84-word assets and 16384-draw rendering remain Draw-owned checks.

## Recording and lifetime

One compute invocation writes record zero as `(3,1,0,0,0)` on each pass.
It clamps the requested count to one, so every consumable record has been
initialized. The runner checks the exact SPIR-V digests before module creation.
The producer targets one storage descriptor spanning the entire indirect
buffer. A compute-shader-write barrier exposes count and commands to indirect
reads and to a transfer that captures the first 24 bytes. The recorded index
upload has a transfer-write to index-read barrier.

Within dynamic rendering, Tower binds the raster pipeline and uint16 index
buffer, then calls the manager's checked helper with the same typed buffer for
commands and count. The unchanged helper resolves the core device procedure
and calls it with 64-bit offsets and 32-bit maximum and stride. Each pass
stores the attachment and copies all four pixels. The second pass waits for
the previous indirect/transfer reads before overwriting the stream and for
the image transfer before reusing the attachment.

The staging allocation holds two disjoint 40-byte samples. Host reads follow a
transfer-to-host barrier and completion of the single submission. Noncoherent
memory requires whole-allocation invalidation. Shader modules retire after
pipeline creation. The pipelines, descriptors, buffers, backing memory, image
and view live through fence completion. Failed fence waits take the v1
device-idle recovery path. Failure to establish either retirement or device loss
terminates with the objects still live.

## Reproduce on Linux x86-64

Use the pinned Tower compiler, LLVM 19, glslangValidator 12.0.0, SPIRV-Tools
2023.1, the Vulkan loader, Khronos validation with synchronization validation,
and a selected ICD. Set `VK_ICD_FILENAMES` to the intended driver. Set
`TOWER_SDK_ROOT`, `PATH`, `LD_LIBRARY_PATH` and `VK_LAYER_PATH` for an
extracted SDK. Run from the Tower checkout in Bash.

```bash
set -euo pipefail
s="$PWD/scaffolding"
v="$s/library/graphics/vulkan"
out=$(mktemp -d)
cc=bootstrap/linux-x64/towerc
sdk=${TOWER_SDK_ROOT:-/}
lib="$sdk/usr/lib/x86_64-linux-gnu"
rt=bootstrap/linux-x64/share/tower/runtime-host-linux-x64.ll
(cd bootstrap/linux-x64 && sha256sum -c --status SHA256SUMS)
for f in "$v"/counted_shaders/*; do
    spv="$out/$(basename "$f").spv"
    glslangValidator -V --target-env vulkan1.1 "$f" -o "$spv"
    spirv-val --target-env vulkan1.1 "$spv"
done
"$cc" "$v/counted_fixture.tower" --library --jobs 1 \
    --foundation "$s/foundation.tower" -o "$out/counted.o"
opt-19 -passes=internalize,globaldce \
    -internalize-public-api-list=tower_allocate,tower_deallocate,tower_strict_float_binary,tower_strict_float_from_integer,tower_trap \
    "$rt" -o "$out/runtime.bc"
llc-19 -relocation-model=pic -filetype=obj "$out/runtime.bc" -o "$out/runtime.o"
"$cc" --link-executable "$out/counted.o" --link "$out/runtime.o" \
    --link "$lib/libvulkan.so.1" --link "$lib/libatomic.so.1" --sysroot "$sdk" -o "$out/counted_fixture"
"$out/counted_fixture" counted-core13 "$out/produce.comp.spv" "$out/triangle.vert.spv" "$out/color.frag.spv"
```

Run `"$out/counted_fixture" draw14` separately. The expected result here
is exit 1 with the Vulkan 1.4 refusal. Missing shaders and a wrong stage's
SPIR-V each failed before submission with their own diagnostics.

| Host 12 result | RTX 3090 hardware | llvmpipe software reference |
| --- | --- | --- |
| API, driver | 1.3.289, NVIDIA 565.57.01 | 1.3.230, Mesa 22.3.6, LLVM 15.0.6 |
| Physical device / queue family / queue | 0 / 0 / 0 | 0 / 0 / 0 |
| Device UUID | cd3d9791fe794e0b3ec29fc16b74d31c | 6d65736132322e332e36000000000000 |
| Captured counts and command | 0 then 1, (3,1,0,0,0) twice | Same |
| All four pixels, zero / one | 112233ff / 4080bfff | 112233ff / 4080bfff |
| Caller guards / fence | intact / signaled | intact / signaled |
| Validation warnings or errors / exit | 0 / 0 | 0 / 0 |

The separate [shaderless v1 fixture](readback_v1.md) also passed on the
hardware with its original `112233ff` oracle. The original counted runner at `fb49e797` has SHA-256
`1458ab3b6fe0e8358e876c98f694791c1e586af8e56d29f602a19d261187bf0b`.

| Stage | GLSL source SHA-256 | SPIR-V SHA-256 (Vulkan 1.1 target) |
| --- | --- | --- |
| Compute | `8139e4f6de25fa7340b9fb1eadaf4783ba7a32169ea73d5e27617cb4043fad9e` | `eec373ac834ace1f297927483269bb416255a7437c287a0e87aad32b7e654804` |
| Vertex | `0ebf23b85463780449812c8f5c415725894a9048f481f984b97745c8bf71c80f` | `7378f68edf277566a637921c002f755b56ab35fddf66ad20b45020f63e35b999` |
| Fragment | `17e5f3481060bae1ae4f77e73146424a5c67b2aad4724dfcd754d72c9dc12e00` | `2960fce4af43a503c2723f9b950890142b95bb561f67e5351941c1f9ad3a7517` |

The controls initialize and execute at most one record. Full-capacity
execution, noncoherent invalidation, device loss, true Draw-profile execution
and other graphics backends remain unverified for this path.

## Rendering review for Draw

Rendering accepted the Linux `counted-core13` operation at Tower
`fb49e79732e41a69a8080acbc39f4a34077d6e53` against the counted draw
layout and pixel oracle reported for Draw `7be8d020b07454789195427588712c72ee465637`.
For each count, the review compared the captured count and five command fields,
all 16 active bytes and all 32 caller bytes with independently constructed
expectations. The tight raster SHA-256 was
`048402e9c4d980772355b55651974f77b1eca456a62116b54bfce1871d725ff1`.
Each adapter's replay log matched its original byte for byte. The ELF imports
`vkGetDeviceProcAddr` and has a direct dependency on `libvulkan.so.1`.
Worker archive SHA-256 was `a32c55677b93b047d6d8e688fed2e9ab1a3807b7ed03b65ef16ac95e997cf10e`.

The reported Draw gate includes Vulkan 1.4, `multiDrawIndirect`,
`drawIndirectFirstInstance`, `drawIndirectCount`, `shaderDrawParameters` and
capacity for at least 16384 draws. The strict fixture currently refuses every
device, including devices reporting 1.4, pending implementation and comparison
with Draw's pinned C and original shaders. Full-profile acceptance needs those
inputs and matching guarded captures from a qualifying device.

Rendering verified the in-memory shader-module operation in all three counted
stages at Tower `39e33fd4816c73c612b9747b5c0fedbb65694daf`. Each adapter's
baseline, candidate and clean replay logs were byte-identical. For counts
zero and one, rendering decoded the count word, first command and all 32
caller bytes and checked each against the captured bytes. The real llvmpipe
allocation refusal reached the caller as `VkResult=-1` before submission.
The receipt archive SHA-256 is
`221c6384881c40c9bdcbd2e47c886016e599330579407a00b060d0188e12b8c5`.

These execution results cover Linux x64. The asset loader can release its
word buffer when the call returns. The fixture still owns Linux-specific
file I/O. Qualification through a Windows executable requires a Windows-safe
asset-loading path and a completed render and readback in that executable.

## Draw counted-record C contract v1

Draw reviewed 24 `vkCmdDrawIndexedIndirectCount` sites at
`be2fb42065dacdb49c476efdde892ab649cfe772` (draw.c blob `84ce1a58`).
The public C entry in [indexed_draw_c.h](indexed_draw_c.h) uses the existing
[Tower recording helper](indexed_draw.tower). It returns
**1 for recorded** and **0 for refused**. The underlying Vulkan command
returns void. Recording success says the command was issued once; the caller
submits the command buffer and observes completion separately.

Use the typed `PFN_vkCmdDrawIndexedIndirectCount` resolved for the live
logical device. On acceptance the helper forwards the seven Vulkan arguments
in their original order. They are the recording `VkCommandBuffer`, indirect
argument `VkBuffer`, command offset, count `VkBuffer`, count offset, maximum
draw count and stride. Judge both spans against their respective logical
`VkBuffer` sizes (Draw's `Buffer.size`). Backing allocation padding cannot
extend either span. Offsets and logical sizes are 64-bit. Buffer identity and
offsets survive unchanged when both roles refer to the same buffer.

| Draw site | Command offset | Count offset | Maximum / stride | Boundary check |
| --- | ---: | ---: | --- | --- |
| GPU check, shared buffer | 4 | 0 | 16,384 / 20 | Final record ends at byte 327,684, exactly the logical size. A logical size of 327,683 refuses even if the allocation is larger. |
| Nuclear particles, shared 3,624-byte buffer | 2,560 | 3,584 | 32 / 32 | Final record starts at 3,552 and ends at 3,572. The count occupies bytes 3,584 through 3,587. |
| OSD, shared buffer | pass × 24 | pass × 24 + 20 | 1 / 20 | For pass 1, the record occupies [24, 44) and the count [44, 48). A 47-byte logical buffer refuses. |
| Scene bucket, distinct buffers | bucket × frame info[0] × 20 | 32 + bucket × 4 | Caller values | Check the command span and the separate 128-byte count buffer independently. Keep the command offset at VkDeviceSize width. |
| Water pool, shared buffer | 1,032 | 4 | poolChunkCount / caller stride | Zero maximum may place an aligned command offset at the logical end. The count word still has to fit. |

A command record is 20 bytes, including a signed 32-bit base vertex at byte
12. The stride determines where the next record starts. For a positive
maximum the final record needs its 20 data bytes. The range checker compares
the last stride displacement with the remaining size after the first record
fits. It never needs to add a near-limit offset to the displacement. A zero
maximum still forwards a valid command once. Null required handles or
function pointer, misalignment, invalid stride, or a short logical span
refuse before the callback. The host reads neither the count nor the records.
[Range and alignment implementation](../indexed_indirect.tower)

Draw owns device features and limits, bindings, rendering scope,
compute-to-indirect barriers, queue submission and buffer lifetime through
GPU completion. A function pointer is cached per enabled device and expires
with it. Draw's Linux CPU probe at Tower `1db528e8` called the existing
Tower helper with a recording callback. Draw reported 18/18 cases passed:
valid inputs forwarded the original seven arguments once, and invalid
inputs made zero calls. That probe covered the layouts above, nulls,
short and misaligned spans, an oversized maximum and near-u64 arithmetic.
Rendering verified the external C symbol on Linux x86-64 and Windows x64
at `ea062c4b`. Draw subsequently linked its `94f2d31e` OSD render object
through the public entry with a CPU recording shim. Draw assigned its
strict raster and HUD GPU checks to job `5d1c45b6`.
[External C link and run instructions](graphics_dll_windows.md#external-link-and-recording-controls)

## Calling from ordinary Tower

Import `library.graphics.vulkan.counted_draw`. Its
`PFN_vkCmdDrawIndexedIndirectCount` is a Tower function value with the
device procedure's seven parameters and void return. Pass the procedure
your device owner resolved when it enabled `drawIndirectCount`. The module
uses the command handle from `command_submission_types` and the buffer
handle from `upload_types`. An application can pass its existing handles
directly. The public entry returns a `u32`.

For example, given a recording primary and the GPU-check stream from the
table above, this call accepts the exact logical span of 327684 bytes.

```tower
import tower;
import library.graphics.vulkan.counted_draw;

fn record_gpu_check(draw: PFN_vkCmdDrawIndexedIndirectCount, cmd: VkCommandBufferHandle*,
    stream: VkBufferHandle*, logical_bytes: u64): bool {
    return tower_vk_record_indexed_indirect_count_v1(draw, cmd, stream, logical_bytes, 4,
        stream, logical_bytes, 0, 16384, 20) == 1;
}
```

Build the general [example caller](osd_checks/tower_client/counted_client.tower)
outside the checkout. Start at the Tower root with LLVM 19, the Vulkan SDK,
and the [released library build tools](graphics_so_linux.md).

```bash
set -euo pipefail
root=$PWD
v=$root/scaffolding/library/graphics/vulkan
app=$(mktemp -d)
cp "$v/osd_checks/tower_client/counted_client.tower" "$app/"
cd "$app"
cc_tower=("$root/bootstrap/linux-x64/towerc" --library --jobs 1
          --foundation "$root/scaffolding/foundation.tower" counted_client.tower)
"${cc_tower[@]}" --target x86_64-linux-gnu --depfile counted.d -o counted.o
"${cc_tower[@]}" --target x86_64-w64-windows-gnu --depfile counted-pe.d -o counted.obj
llvm-nm -u counted.o counted.obj
```

Each object imports just `tower_vk_record_indexed_indirect_count_v1`.
Link the application's ordinary entry with `counted.o` and
`libtower_graphics.so` on Linux, or `counted.obj` and
`tower_graphics.lib` on Win64. Put the matching DLL beside the executable.
To exercise the example on Linux, route the existing C SDK regression's
call through its exported Tower function.

```bash
"$v/build_graphics_so.sh" "$app" /usr/lib/x86_64-linux-gnu/libvulkan.so.1
cc -std=c11 -O2 -I"$v" -Dtower_vk_record_indexed_indirect_count_v1=record_counted \
   "$v/indexed_draw_c_checks.c" counted.o -L. -ltower_graphics -Wl,-rpath,'$ORIGIN' -o check
./check
```

Expect 38 rows, with one callback each in 13 cases and zero in 25. The
[slot 11 qualification](../../../../docs/temporal-opcode-research-journal.md#public-tower-import-for-counted-indexed-drawing)
records the Win64 DLL, the SDK references and the hardware readback.
