# Record a new Draw OSD texture upload

Draw source pin `752f55c1280a1c737eedeaa46285af2a199aa37d`, draw.c blob
`7b6ee8f42bbde29790364d3de73a5d75216cbf1d`. Draw confirmed the
transaction in osd_create at lines 5339–5357 and image_layer_barrier at
2079–2096. The producer is tools/bake-osd.mjs at lines 78–85. Draw
reported assets/osd/textures.bin SHA-256
`0b5ef89a0be71e8429e6fca5d84a59d36779dc2b0e6510afb87a51bacd8db3a9`.
This implementation uses the supplied descriptor inventory. Hardware
tests use synthetic texels.

Include osd_texture_upload_record.h on Linux x86-64.

```c
void tower_vk_osd_texture_upload_record_v1(VkCommandBuffer cmd, VkBuffer staging,
    VkImage image, uint32_t layers, uint32_t mips, uint32_t count,
    const VkBufferImageCopy *regions);
```

The caller supplies a recording graphics primary outside a render pass on
the device with core synchronization2 enabled, a populated TRANSFER_SRC
staging buffer and a newly bound optimal 2D, single-sample color image
in UNDEFINED layout. Draw uses SAMPLED | TRANSFER_DST | TRANSFER_SRC.
Pass the positive actual layer and mip counts. Draw maps a raw zero layer
count to one and creates a 2D view, or creates a 2D_ARRAY view for a
nonzero raw count. Pass its complete validated layer-major, mip-minor
region array with its explicit count. The staging ranges are in bounds,
with offsets relative to the start of this texture. Each Draw region has
rowLength and imageHeight zero, COLOR/mip/layer/1, zero image offset and
extent (width >> mip, height >> mip, 1) for the listed assets.

| Command order on the same primary | Arguments |
| --- | --- |
| One vkCmdPipelineBarrier2 per layer, ascending | UNDEFINED to TRANSFER_DST_OPTIMAL. NONE / 0 to TRANSFER / TRANSFER_WRITE. |
| One vkCmdCopyBufferToImage | Original staging and image handles, TRANSFER_DST_OPTIMAL, original count and region pointer. |
| One vkCmdPipelineBarrier2 per layer, ascending | TRANSFER_DST_OPTIMAL to SHADER_READ_ONLY_OPTIMAL. TRANSFER / TRANSFER_WRITE to FRAGMENT_SHADER / SHADER_SAMPLED_READ (0x100000000). |

Each VkDependencyInfo has DEPENDENCY_INFO, null pNext, flags zero, memory
and buffer counts zero with null pointers, and one VkImageMemoryBarrier2.
The barrier has IMAGE_MEMORY_BARRIER_2, null pNext, original image and
both queue families IGNORED. Its range is COLOR, baseMipLevel 0,
levelCount mips, baseArrayLayer layer, layerCount 1. All stage/access
masks have Vulkan's 64-bit width. The function borrows the region list
through return. It uses local descriptors and allocates no heap storage.

Draw owns file validation, memory selection, allocation and mapping,
image/view creation, primary begin, finish, submission and retirement.
It keeps staging and every GPU resource alive through its last submitted
use. The existing blocking finish returns the first signed failure from
end, submit or queue idle. If accepted work has uncertain retirement,
the owner must establish completion or apply its device failure policy.
Frame submission retains its independent asynchronous fence contract.

## Build and verify

With the pinned host 12 SDK and Tower tree, build the callable object
and shared library from the repository root.

```bash
source /tmp/tower12/env
v=scaffolding/library/graphics/vulkan
out=$(mktemp -d)
bootstrap/linux-x64/towerc "$v/osd_texture_upload_record.tower" --library --jobs 1 \
    -o "$out/osd_texture_upload_record.o"
x86_64-linux-gnu-ld -shared --hash-style=both -z defs "$out/osd_texture_upload_record.o" \
    /tmp/tower12/sysroot/usr/lib/x86_64-linux-gnu/libvulkan.so.1 \
    -soname libtower_osd_upload.so -o "$out/libtower_osd_upload.so"
```

The object is 1528 bytes, SHA-256
`b2cd884a14b66be6454083455e7e89eb18df5b4af79eae9dc6c2a722d3118d95`.
The DSO is 13616 bytes, SHA-256
`5c4ac7f51247f0ec6555bcfa25f13eade719f1e930b2b24e6c9adf0115431815`.
It exports the header entry and imports vkCmdCopyBufferToImage and
vkCmdPipelineBarrier2. Link the caller with the object and loader or use
`-L"$out" -ltower_osd_upload` with the DSO in the runtime library path.

The recording-only CPU test checks five calls to the entry. Fonts have
6 layers of 2048×2048 R8_UNORM. Bitmap and inverted each have 2 mips of
256×352 R8G8B8A8_SRGB, firmware has 4 layers of that base extent, and
images have two 64×64 layers. Raw Vulkan C, external Tower DSO and direct
Tower object all match the confirmed 16 regions, 14 initial and 14 final
dependencies, including handle and region pointer identity.

On the NVIDIA RTX 3090, UUID cd3d9791fe794e0b3ec29fc16b74d31c,
driver 565.57.01, Vulkan 1.3.289, graphics family/index 0/0, the fixture
retires each new upload, then draws a full-screen triangle. A fragment
shader executes texelFetch on the source in SHADER_READ_ONLY_OPTIMAL,
selecting layer and explicit mip. Source layout stays unchanged during
observation. Fixture-only barriers transition an RGBA8_UNORM output
attachment, copy its pixels into a separate host buffer and expose
TRANSFER_WRITE to HOST_READ. A second blocking finish precedes access,
destruction and reuse. The caller reuses the staging buffer, primary and
attachment across fresh source images. Intermediate sRGB codes 128 and
64 yielded linear output codes 55 and 13. The checked output includes
every sampled texel, eight row-padding bytes and four outer guard bytes
on either side of each subresource.

| Synthetic input per transaction | Guarded output across trials | Raw C / Tower / independent stream SHA-256 |
| --- | ---: | --- |
| 7×5, 2 layers × 2 mips, R8 and sRGB, 8 new images per format | 7552 bytes | 1b819c4909e728c225a3363b92a0e7afb7fc7ba5f6e2f90650e36f67b7551b3e |
| Bitmap shape, 256×352 sRGB, 1 layer × 2 mips, 2 new images | 909600 bytes | f4e06a5b4201d5e1e916108494a1da63e4579a0df7a39053d293c9a014783cfa |

Raw C and the DSO passed both shapes, and the direct object passed the
small cases. Synchronization validation reported zero warnings/errors.
Forcing layer zero in the read consumer produced the first mismatch at
byte 240. Each small hardware trace also compared the owner's expected
calls and handles with the live descriptors forwarded to the Vulkan
loader. Draw execution, sampling with its application shaders, and
validation of the actual packed payload remain with Draw.

The evidence packet for aea4af39-d255-46e1-bbfc-60a23127eaa7 includes
the C-link build and test scripts, pinned vertex SPIR-V, raw GPU bytes,
failure logs, sanitizer evidence, timings and a base-bounded source bundle.
On host 12, extract it and run:

```bash
sha256sum --quiet -c SHA256SUMS
LOCAL_TOWER=/tmp/buffer-upload-02f6d984/src REPLAY="$(mktemp -d)" bash replay.sh
```

## Five retained images

Draw reports a separate raw application control at runtime `d1060797`,
manager `41d8b9ba`, on Wine Win64, RTX 3060, NVIDIA 595.99.02. Draw
parsed first.log, reported SHA-256
`144f9c66cba64f08ceadf793d701a3315e5ca7556358f606fd54ed35f7bff383`.
It observed 5 copies, 16 regions, 28 exact transitions, matching handles
and scopes, and five unfenced same-queue retirements before staging unmap,
destroy and free. The five images survived. The original process exited
1 with reported Wine loader diagnostics. Draw's receipt contains no
per-texel readback or new provider execution.

The independent host 12 fixture runs the five full production shapes
through raw Vulkan C and C linked to the Tower DSO. Each texture has
its own staging allocation. The caller ends its primary, submits with
a null fence, waits for success on the same queue, then unmaps the
allocation, destroys the staging buffer and frees its memory. All five
device-local images and views stay live through all sixteen fragment
reads. The loader probe records the actual resource bindings, image
views, zero-offset coherent mappings, command buffers, submissions,
successful idle returns, releases and draws. Its verifier uses the
handles in those events to check ordering and identity. Swapping the
first idle and unmap in a saved trace gives verifier exit 3.

| Texture | Synthetic staging bytes | Sampled RGBA8 bytes including guards |
| --- | ---: | ---: |
| Fonts | 25165824 | 100761648 |
| Bitmap | 450560 | 454800 |
| Inverted | 450560 | 454800 |
| Firmware | 1441792 | 1453088 |
| Images | 32768 | 33808 |

The 2048×2048 font expands from R8 to RGBA8 in the sampled read.
The first six texels of each 256-texel horizontal block encode the
row's low and high bytes, layer, mip, texture index and block index,
using red for R8 and alpha for sRGB. The other texels retain the changing
synthetic pattern. Intermediate sRGB codes and guard bytes use the same
oracle as the smaller fixtures. The GPU writes each subresource to a
separate guarded span before reusing readback storage. Raw C, external
Tower and an independently generated row stream each produced 103158144
bytes with SHA-256
`140d8d6511a77daee97ebd377dfc34c9c90347cf084d0dd4516e5474315d143b`.
Both Linux lanes exited 0 with zero synchronization-validation warnings
or errors. In the packet, inventory.sh and inventory_trace.sh reproduce
these results from the built source. The original Draw dump and packed
texels were not accessed on host 12.
