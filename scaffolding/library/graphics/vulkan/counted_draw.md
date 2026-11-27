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

The `draw14` profile requests a Vulkan 1.4 instance after checking the
loader version. It checks the selected physical device, enables the reported
features on a new logical device and runs both captures. A refusal ends the
request before submission. The [feature checks and Quadro run](counted_features.md)
list the enabled bits, limits and commands.

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
and view live through fence completion. The shared synchronous operation
recovers an indeterminate fence wait on the submitted queue. Only a successful
fence wait permits readback. The [failure table](readback_v1.md#synchronous-submission-and-failure)
also covers submit errors, device loss and termination with objects live.

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

The 1.4 profile takes the same three shader paths.

```bash
"$out/counted_fixture" draw14 "$out/produce.comp.spv" "$out/triangle.vert.spv" "$out/color.frag.spv"
```

Host 11 passed on the Quadro RTX 6000 with the 1.4 loader. The 1.3 loader
and a 1.3 physical device each refused the 1.4 request in separate runs.
Missing shaders and a wrong digest each failed before submission.

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
hardware with its original `112233ff` oracle. The counted runner SHA-256
is `1458ab3b6fe0e8358e876c98f694791c1e586af8e56d29f602a19d261187bf0b`.

| Stage | GLSL source SHA-256 | SPIR-V SHA-256 (Vulkan 1.1 target) |
| --- | --- | --- |
| Compute | `8139e4f6de25fa7340b9fb1eadaf4783ba7a32169ea73d5e27617cb4043fad9e` | `eec373ac834ace1f297927483269bb416255a7437c287a0e87aad32b7e654804` |
| Vertex | `0ebf23b85463780449812c8f5c415725894a9048f481f984b97745c8bf71c80f` | `7378f68edf277566a637921c002f755b56ab35fddf66ad20b45020f63e35b999` |
| Fragment | `17e5f3481060bae1ae4f77e73146424a5c67b2aad4724dfcd754d72c9dc12e00` | `2960fce4af43a503c2723f9b950890142b95bb561f67e5351941c1f9ad3a7517` |

The original zero/one controls initialize and execute at most one record. Full-capacity
execution, noncoherent invalidation, device loss, Draw’s shipped shaders
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
capacity for at least 16384 draws. The counted caller also needs dynamic
rendering. On the Quadro RTX 6000 the `draw14` run enabled all five bits
and used one command stream with capacity 16384, writing counts zero and one.
The two headers and the two guarded caller buffers total 112 bytes. Rendering
verified their SHA-256 as
`a49420a8cae9cf5185a8d8dc1d18556dce6b332ec223f9e22aa00eabef7436e6`
on the strict run and its replay. Worker archive SHA-256 was
`c24dae6e35a7ce8f7ea1d4276d8a72d3b281bf2fa159c31c9272f9b7d4540223`.
These fixtures use independent shaders. Running Draw’s shipped assets through
Tower’s shader-module operation remains a separate integration check.

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

## Integrated Linux Vulkan 1.4 run

Build the counted and shaderless executables using the recipes above and in
[the readback contract](readback_v1.md). Put the three validated SPIR-V
files under `shaders/` in the executable directory, select the NVIDIA ICD
and the 1.4.313 loader and Khronos layer, then run from that directory.

```bash
./counted_fixture draw14 shaders/produce.comp.spv shaders/triangle.vert.spv shaders/color.frag.spv
./counted_fixture counted-core13 shaders/produce.comp.spv shaders/triangle.vert.spv shaders/color.frag.spv
./readback_fixture 0
```

With Quadro RTX 6000, NVIDIA 615.71.10, Vulkan 1.4.351, all three returned
0. The strict run enabled all five required features. An ordinary-entry
debugger trace hit both gate predicates, borrowed shader creation with
438, 273 and 95 words, checked indirect recording twice and
`vk_submit_and_wait` once. Both row copies saw offset 4, span 24, pitch
12 and capacity 32. The optimized run and replay each reported one submit,
a signaled fence, coherent staging and zero warnings/errors. Their complete
112-byte captures matched the strict baseline. The shaderless run matched
the separate guarded v1 oracle. With the 1.3.239 loader the strict request
returned 1 with selected_profile=none before submission. See slot 11 packet
`9a7312ab-4069-446d-893c-9f76a778dc66` for raw bytes and commands.

## Two-record differential on slot 11

```bash
./counted_fixture draw14 shaders/produce.comp.spv shaders/triangle.vert.spv shaders/color.frag.spv pair
```

The optional final argument selects two initialized records and additive
color blending. It uses the same three fixture SPIR-V files. Compute writes
the first record. Tower records transfer updates for the second record and
the count, with compute-to-transfer and producer-to-consumer barriers.
Both passes call the same resolved `vkCmdDrawIndexedIndirectCount` with
count offset 0, command offset 4, stride 20 and maximum 2. The six uploaded
uint16 indices are 0, 1, 2, 0, 1, 2. The commands cover elements [0,3)
and [3,6), respectively, with base vertex and first instance zero.

| Field | First capture | Second capture |
| --- | --- | --- |
| LE count | `01000000` | `02000000` |
| LE record 0 | `0300000001000000000000000000000000000000` | same |
| LE record 1 | `0300000001000000030000000000000000000000` | same |
| Four tightly packed RGBA8 pixels | `51a2f2ff51a2f2ff51a2f2ff51a2f2ff` | `91ffffff91ffffff91ffffff91ffffff` |
| Complete 32-byte caller | `a5a5a5a551a2f2ff51a2f2ffa5a5a5a551a2f2ff51a2f2ffa5a5a5a5a5a5a5a5` | `a5a5a5a591ffffff91ffffffa5a5a5a591ffffff91ffffffa5a5a5a5a5a5a5a5` |

Each triangle adds (64,128,191) to the RGB channels, starting at (17,34,51)
and saturating at 255. All four pixels therefore distinguish one triangle
from two. The observed counts, records and both guarded images matched the
table before and after replay. Their concatenated 152 bytes have SHA-256
`985872ef06325cdd21b0e0151690f8c9dd262cbdaee999ee48df0d3502bd9a6e`.
A debugger control forced the maximum argument to one at the actual Vulkan
function pointer. The second count remained two and both records matched,
but its four pixels reverted to `51a2f2ff`. The fixture returned 1 with
zero validation warnings/errors. This differential exercises two commands.
Compute-only production of two commands and 16384-command execution are open.

Draw comparison provenance is separate. The Tower shader ABI review identifies
Draw's original compute, vertex and fragment assets as 292, 285 and 84 words.
This fixture ran 438, 273 and 95 words with the SPIR-V hashes in the table
above. The registered slot 11 reader supplied Tower only. Draw's exact
three hashes and corrected pixel receipt were unavailable in the assigned
refs. All Quadro pixel results on this page refer to the Tower controls.
[Tower shader ABI review](https://github.com/TrevorSundberg/tower/commit/5e649360258171d66e924a1f1281080147cf957b)
