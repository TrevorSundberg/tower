# Draw image-format preflight for Vulkan

Draw confirmed the capability check that precedes image creation in
`image_create_checked` at `b15f6edd305d2234362f3ca863656f2a7487e21e`
(`draw.c:2076` and `vulkan_image.tower:74`). Both shipping constructors were reviewed against the C
boundary for `draw-tower-image-format-preflight/v1`.

```c
VkResult tower_vk_image_format_preflight_v1(
    VkPhysicalDevice physical, const VkImageCreateInfo *info,
    VkImageFormatProperties *properties, VkBool32 *supported);
```

Borrow a live physical device and a readable image descriptor for the call.
The caller supplies two distinct writable outputs, each separate from the
descriptor and its referenced storage. First call
`vkGetPhysicalDeviceImageFormatProperties` once with the physical device,
format, image type, tiling, usage and flags from the descriptor. Receive
the properties in local storage. Even a zero dimension reaches the query,
so a driver error still takes precedence.

| Query outcome | Return | Caller outputs |
| --- | --- | --- |
| Driver returns a nonzero result | Exact signed driver result | Preserve both outputs byte for byte, including when the driver wrote its temporary result. |
| Query succeeds, requested shape exceeds a limit or fails another test below | `VK_SUCCESS` | Copy the returned properties and write `VK_FALSE`. |
| Query succeeds, all tests pass | `VK_SUCCESS` | Copy the returned properties and write `VK_TRUE`. |

On success, require positive width, height, depth, mip count and array layer
count. Compare each extent component with its corresponding `maxExtent`
component, mip count with `maxMipLevels`, and layer count with
`maxArrayLayers`. All five upper bounds are inclusive. Require a nonzero
bitwise intersection of `info->samples` and `sampleCounts`. Return
`maxResourceSize` as part of the properties so Draw retains the complete
query result. The capacity predicate uses only the fields listed above.

Draw keeps its diagnostics and decides whether to call the separate
[image-creation entry](create_image_v1.md), then allocate and bind memory.
The preflight borrows its inputs through return and performs no creation
or allocation.

## Draw diagnostics

Draw acknowledged the ABI at Tower `596fda73480cde302f61e4f4722ab8ab1b0d4762`.
If the query returns a nonzero result, Draw reports the original format,
image type, usage and signed driver result. It reads neither output and
stops before creating an image or allocating memory. If the query succeeds
but capacity is insufficient, Draw reports the requested format, extent,
layer count and mip count alongside the returned `maxExtent`,
`maxArrayLayers` and `maxMipLevels`.

## Acceptance

Compare the raw Draw predicate and the externally linked C/Tower entry
with a recording query. Check the physical device, argument order and call
count. Include exact upper limits, zero and one-over-limit cases for each
dimension and count, supported and unsupported sample bits, and a changed
`maxResourceSize` with the same decision. Check all returned properties
on both successful branches. For a query error, use canary-filled outputs
and a driver that writes its temporary before returning a signed error.
Include a zero-width descriptor paired with an injected query error. Expect
one query, the exact driver result, and both original output byte patterns.
Repeat with a successful query on the same descriptor. Expect all properties
to be published and `supported` set to `VK_FALSE`.

For the device test, record the actual Vulkan-selected adapter, driver and
queried properties. Exercise the accepted 2D OSD shapes through the existing
create, bind, view, upload and sampled readback path. Check that an unsupported
shape stops in the caller before image creation. Draw owns the independent
shipping application comparison.

Draw has already independently rebuilt the preceding Linux `create.o` at
Tower `07587159dbc5606b3e24d85fa6e3babfc2f9b6fe` and matched its 952 bytes
and SHA-256 `9e870edce24bc9759319332a5fc643b4b0cc16cc35d7d04042a17d970e7c174c`.
At confirmation, the preflight receipt covered Draw source and contract review.
The Linux provider and rendering device results follow below. Draw owns
acceptance of its linked shipping application.

## Linux x86-64 implementation and link

The provider is available as a standalone object or shared library. Include
`image_format_preflight.h` in the SDK caller. Use the pinned Tower bootstrap,
GNU linker and Vulkan loader from the slot 12 sysroot. From the Tower root
with an existing output directory and the packet's `host.env` sourced, run

```bash
v=scaffolding/library/graphics/vulkan
bootstrap/linux-x64/towerc --foundation scaffolding/foundation.tower --library --jobs 1 \
  "$v/image_format_preflight.tower" -o "$OUT/preflight.o"
x86_64-linux-gnu-ld -shared --hash-style=both -z defs "$OUT/preflight.o" \
  "$TOWER_SDK_ROOT/usr/lib/x86_64-linux-gnu/libvulkan.so.1" \
  -soname libtower_preflight.so -o "$OUT/libtower_preflight.so"
```

The 1,192-byte object has SHA-256
`37b926d98ee6c2dd66785e7f9e4c0d005990690bc235257df5fdf2895f3f1ebf`.
It exports the confirmed entry and imports only the Vulkan query. The
13,576-byte DSO has SHA-256
`49d257ae9d80fad613e7ab8f4ac058f030637c9e1a1bba7af9c254e014237367`.
Link the object and Vulkan, or link with `-L"$OUT" -ltower_preflight` and
make the DSO available at runtime. The caller owns all output storage.

## Recorded results

The raw SDK, C/object, C/DSO and Tower recording calls each passed 32 cases.
All five inclusive maxima, their zero and one-over neighbors, a high unsigned
width, sample intersections, a zero sample mask and two resource-size extremes
were exercised. A driver that wrote its private slot before returning −11,
−1, −2 or synthetic +1 preserved both guarded outputs. The same zero-width
request succeeded at query time and published all limits with decision zero
when the recorder returned zero.

The standalone SDK client selected physical device 0, NVIDIA GeForce RTX 3090,
Vulkan 1.3.289, driver 565.57.01. Raw, object and DSO clients printed
identical fields and decisions. For the sRGB 2D sampled image the maximum
extent was 32768 × 32768 × 1, with 16 mips, 2048 layers, sample mask 15 and
resource size 1099511627776. The six-layer cube-compatible R8 request had
sample mask 1. The 31 × 17 × 9 R32_UINT 3D storage request returned maximum
extent 16384³, 15 mips, one layer and sample mask 1. The four-sample,
two-layer color attachment also passed.

The retained OSD test called the preflight before its existing create and
bind operations for five textures and five sampled-readback attachments.
The Tower call and both external C routes resolved to the recorded APIs,
issued ten per-image queries plus one existing adapter-admission query, and
passed all sixteen guarded reads. The complete 103,158,144 bytes matched
SHA-256 `140d8d6511a77daee97ebd377dfc34c9c90347cf084d0dd4516e5474315d143b`.
All 189 lifetime events passed on family 0, queue 0 of device UUID
`cd3d9791fe794e0b3ec29fc16b74d31c`. Sync validation counted zero warnings
or errors. A width of 4294967295 returned the hardware limits to the caller
and stopped before the first image creation. An injected −11 at the second
source left one earlier image to retire. The later create and view OOM
controls retained their original diagnostics and cleanup.

Job `098ed838-0613-4ba0-9e4a-ee201427aeea` contains the ELF files, link maps,
original captures, SDK client and replay scripts. On the assigned Linux
host run `bash replay.sh /path/to/authorized/tower /new/replay-directory`
from the extracted packet. Draw's linked application run remains with Draw.

## Linking with the accepted Linux graphics library

Draw can keep its reviewed eleven-entry `libtower_graphics.so` and link the
separate `preflight.o` or `libtower_preflight.so` for the new query. Slot 12
rebuilt the graphics library from Tower
`bef3026fc41d02334a2fd3f88f18b8d6e9392abe` and compared all 14,816 bytes
with the accepted artifact. SHA-256 before and after the tests was
`d926aabb989ac25ac3a5aa79dd00b5f557124c39a04855018ac7f678d5efe715`.

With the combined graphics library supplying creation and bound-view creation,
the SDK recording controls passed 16 image calls and 36 view calls. Each of
the raw SDK, C/shared and ordinary Tower preflight callers reproduced the
reference pixels on the RTX 3090. Loader traces identify the two constructor
symbols in the accepted library and the preflight entry in its own DSO for
the two provider routes. Each caller also passed the oversized descriptor,
query error and later create/view failure controls. The job's
`accepted-package.sh` replays these links and verifies the package digest.

Draw's separately reported CPU constructor parity and bindings at Draw
`2f38b19c8218fef304993df5708a7458fa16776b` are recorded on the
[Linux package ref](https://github.com/TrevorSundberg/tower/blob/8edf50ba4dd8902c4ae6a8de23c5c987776873d3/scaffolding/library/graphics/vulkan/graphics_so_linux.md#draw-constructor-checks-with-the-shared-library).
Draw owns the shipping application check for the new preflight entry.
