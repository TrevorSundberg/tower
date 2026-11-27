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
hardware with its original `112233ff` oracle. The counted runner SHA-256
is `1458ab3b6fe0e8358e876c98f694791c1e586af8e56d29f602a19d261187bf0b`.

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

The next Tower library change will let a caller create a Vulkan shader module
from borrowed SPIR-V words. The counted pipeline will use it for compute,
vertex and fragment stages. Offline compilation, fixture hashes and file I/O
stay at the call site. This gives Draw's asset loader an in-memory entry point.
