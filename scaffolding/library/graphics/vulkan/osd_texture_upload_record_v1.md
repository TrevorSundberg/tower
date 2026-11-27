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

From the repository root, use the Linux x64 bootstrap with LLVM 19.
Set `VULKAN_LOADER` to the full path of the Linux x64 Vulkan loader.

```bash
v=scaffolding/library/graphics/vulkan
out=$(mktemp -d)
bootstrap/linux-x64/towerc "$v/osd_texture_upload_record.tower" --foundation scaffolding/foundation.tower --library --jobs 1 \
    -o "$out/osd_texture_upload_record.o"
x86_64-linux-gnu-ld -shared --hash-style=both -z defs "$out/osd_texture_upload_record.o" \
    "${VULKAN_LOADER:?Set VULKAN_LOADER to the full path of libvulkan.so.1}" \
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
loader. Draw's CPU recording result with the real pack is recorded below.
Its device readback and application shader checks remain open.

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

## Draw region-builder contract

At Draw `3b0c80e4d0e4352ac50498cdec0723ddc0fc6d5b`, `osd_create`
reads the OST1 header and validates five whitelisted texture records.
Each record has a 32-byte header immediately followed by its payload.
The packed file is 27,541,680 bytes, including the 16-byte file header.
The two bitmap records encode zero layers and Draw passes one actual
layer. The other records encode their array layer counts. Draw starts at
offset zero for each texture and derives each next offset by adding the
current mip's width × height × bytes per texel. Its eight-slot local
array holds 6, 2, 2, 4 and 2 regions for the five successive copies.

Draw reported 20/20 CPU cases using the original reader and a recording
callback. Bad headers, truncation and trailing data reproduced their
diagnostics and preceding copy counts. The reader accepted changes to
ignored words and texel data. Draw checked all thirteen scalar fields
of each canonical region. Its textual trace SHA-256 was
`f1e549d9291d7604185e267952e5a0f203c714711a6db4d0567c8e44d4da6dee`.
The source block SHA-256 was
`c4074cad66dad564a41d31430fc7ea89513959ffc7e4bc6ae99e46623b30c0b5`.

The proposed companion C entry constructs tightly packed color regions
for the recorder. The following signature is the contract for the
follow-on implementation.

```c
uint32_t tower_vk_build_tight_color_regions_v1(VkBufferImageCopy *out,
    uint32_t capacity, uint32_t width, uint32_t height,
    uint32_t actual_layers, uint32_t mip_count, uint32_t bytes_per_texel,
    VkDeviceSize available_bytes);
```

Success returns the number written and preserves unused slots. Refusal
returns zero before writing any output, including for insufficient
capacity or payload span, zero extents and arithmetic overflow.
A capacity of five for fonts and a 450,559-byte span for a bitmap must
refuse. Draw owns serialized header validation. Its streaming uploader
continues to supply explicit staging offsets and destination coordinates.

## Rendering review

The worker tested `75476dcd1013af214d518084c5883c41f0bc815b`. Rendering
verified 487 archive manifest entries, both compressed GPU readbacks
after decompression, and the Linux object and DSO hashes. Across each
loader trace, all 208 region fields and 28 barriers matched the Draw
layout above. Each independent 189-event lifetime trace contains five
retirements before staging release and sixteen draws. The archive SHA-256
is `c95cefbb2ed5e2c7d63a9ec329017845cf75dbfc709e38949514092abacb3461`.

The worker's address-only GPU checks passed. Full leak checking with
synchronization validation reported 4,187 bytes in 15 allocations in
each arm. Ownership remains unresolved. TSan stopped before main.

## Draw CPU recording with the shipped texture pack

Draw fetched Tower `846176abc06dfa3ac6dbb939f3f683e9380cd99e`,
rebuilt the recorder object and integrated it into `osd_create` at
local Draw commit `e850df53415536c06e03f180b7568c83a3e3f013`.
Rendering rehashed its retained 1,528-byte Linux object and matched
Draw's rebuilt SHA-256, `b2cd884a14b66be6454083455e7e89eb18df5b4af79eae9dc6c2a722d3118d95`.

Draw ran the extracted production loop twice with recording Vulkan
callbacks, once through raw C and once with the Tower object linked.
Both read the 27,541,680-byte `assets/osd/textures.bin`, SHA-256
`0b5ef89a0be71e8429e6fca5d84a59d36779dc2b0e6510afb87a51bacd8db3a9`,
and exited 0. Draw checked five copies, all 208 fields in the 16 regions,
28 per-layer dependencies with their 64-bit access masks, and begin/finish
order against its independent oracle. Each run produced a 64-line trace
with SHA-256 `1ca1ad200e2e418ad72035c4b5021a5f48ba2e79844fdd93d15253acda94a581`.
The Linux application device results follow below.

### Replaying the Draw test

The test source is local Draw commit `4524eebe12ddd1310cbfab50a62600543039a4d9`.
From that checkout, set `DRAW_TOWER_OSD_TEXTURE_UPLOAD_ROOT` to the path of
the Tower checkout at `846176abc06dfa3ac6dbb939f3f683e9380cd99e` and run:

```sh
python3 tests/verify-osd-texture-record.py "$DRAW_TOWER_OSD_TEXTURE_UPLOAD_ROOT"
```

Draw recorded the following invocation with its local compiler, SDK headers
and output directory. Raw C and linked Tower both returned 0 and produced
the 64-line trace recorded above.

```sh
CC=/tmp/draw-contract.6364VolT/check-cc \
LD_LIBRARY_PATH=/tmp/draw-contract.6364VolT/deps/usr/lib/x86_64-linux-gnu \
TOWERC=/tmp/draw-contract.6364VolT/bootstrap/linux-x64/towerc \
CPPFLAGS="-I$PWD/build/tower-port/manager/receipt-144/sdk/usr/include" \
python3 tests/verify-osd-texture-record.py \
    build/tower-port/manager/receipt-145/provider \
    --out build/tower-port/manager/receipt-146/cpu
```

### Expected device readback of the shipped texels

Draw concatenated the 16 logical subresources in file texture order,
then layer order, then mip order within each layer. The resulting
27,541,504 packed texel bytes have file-derived SHA-256
`df14881703119d96e6def5700eafd7927d7b83c890bf3e85f77d4db11e679ac4`.
Rendering verified the individual spans of 25,165,824, 450,560, 450,560,
1,441,792 and 32,768 bytes against both retained Tower loader traces.
The 16-byte file header and five 32-byte record headers account for the
remaining 176 bytes in the full pack.

Draw verified the file-derived digest in the following device run.

## Draw Linux hardware acceptance on the shipped OSD pack

Draw job `a07d1af8` compared its raw and Tower-linked recorders on an
API-selected RTX 3060, Vulkan 1.4.329, NVIDIA 595.99.02. The worker
reconstructed the adoption at Draw `c95c6e7c2b63ae829620933b0807432e7421db3e`,
with tests `70beaa3bd549f69773f29957f8e2aa3f273b2967` based on
`7104049a`. The earlier manager adoption is a separate tree at `e850df53`.
Tower supplied the 1,528-byte recorder at `846176abc06dfa3ac6dbb939f3f683e9380cd99e`,
object SHA-256 `b2cd884a14b66be6454083455e7e89eb18df5b4af79eae9dc6c2a722d3118d95`.

From the Draw root the manager's CPU check and the worker's GPU test were:

```sh
python3 tests/verify-osd-texture-record.py build/tower-port/manager/receipt-145/provider \
  --out build/tower-port/manager/receipt-162/cpu
bash tests/osd-texture.sh /tmp/draw-a07d1af8/raw /tmp/draw-a07d1af8/linked \
  /tmp/draw-a07d1af8/provider /tmp/draw-a07d1af8/probe
```

Both checks exited 0. The CPU runs reproduced the 64-line trace above. Both
GPU arms ran `--offscreen --validate --osd-test assets/osd/state.bin --fixed-time 0 --frames 1 --size 1280 800 --capture /tmp/draw-a07d1af8/probe/frame.rgba`.
An instrumented readback supplied the packed texture bytes. Draw verified
all 208 fields across five copies (6, 2, 2, 4 and 2 regions), 28 per-layer
barriers, same-queue completion before each of the five staging releases,
and sampled draws before image destruction. Native validation reported zero
warnings or errors.

| Draw output | SHA-256 verified by Draw |
| --- | --- |
| 27,541,504 active texel bytes from the shipped pack, both GPU arms | `df14881703119d96e6def5700eafd7927d7b83c890bf3e85f77d4db11e679ac4` |
| 27,632,640 bytes including 91,136 bytes of `a5` guards and padding | `3946dbc85c975231e31da714d607d1fbf12f00d23ff37eed8f780ec0d225ca97` |
| Visible 1280×800 HUD layer | `cb466e6d1d99597316171d274fabe58718c126f4eec9829d9b59751db081fef2` |
| Visible full RGB PPM | `721296ac221895d46094a7468fa8059504da5124698f45a92da34a2f6027e12a` |
| Resized HUD layer | `26bcbccf9bbff785fc3ab3c2f9a7ef9f63d8372dc64f1cbd4438077bfb7a264d` |

Draw observed identical raw and linked RGB and camera output. The raw ELF
SHA-256 was `6378d17a8aa1521d0bfa08856a6c24e30b8245d7cd8d4c1108da43a4844da4b5`;
the linked ELF was `604117b6013bfa5d0fab5f502eaa73038783f371130bbfe7b70dc17ff75ed731`.
Draw verified 320 indexed files plus the manifest in archive
`3a559fc8958b5a4ad02162d7c8ca6d9ea47fc6ad75d0503445624ce1d9851fa6`.
Tower rendering rehashed its retained object and independently decoded
the 208 fields, five payload spans and 28 barriers in its own two Linux
loader traces. The tight-region builder, bound-view provider and Win64 OSD
recorder each have a separate Draw application test.
