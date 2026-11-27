# Linux x86-64 Vulkan C library

Build the fifteen functions from the Tower checkout. The host needs the
checked-in Linux x64 bootstrap's LLVM 19.1 shared library, Bash, coreutils and
GNU x86-64 binutils. Supply the absolute path to the target's Vulkan loader.

```bash
v=scaffolding/library/graphics/vulkan
"$v/build_graphics_so.sh" "$PWD/out" /usr/lib/x86_64-linux-gnu/libvulkan.so.1
```

An application includes the SDK header(s) for the functions it calls. For
example, this existing C program exercises the counted draw entry with an SDK
recording callback. With the Vulkan development headers installed, run it
alongside the shared library.

```bash
cc -std=c11 -O2 -I"$v" "$v/indexed_draw_c_checks.c" \
    -Lout -ltower_graphics -Wl,-rpath,'$ORIGIN' -o out/counted-check
out/counted-check
readelf -d out/libtower_graphics.so
nm -D --defined-only out/libtower_graphics.so
```

For an application making its own Vulkan calls, use the same link with
`-lvulkan` after `-ltower_graphics`. Install the loader in the host library
search path and configure the intended ICD. The library's SONAME is
`libtower_graphics.so`. Its sole DT_NEEDED entry is `libvulkan.so.1`. The
fifteen-entry build is 15,352 bytes, SHA-256
`1296b5b49762c4807d343c69afda5bfca52ee35621d86c0142b27e8bed2e2104`.
The earlier twelve-entry build was 14,976 bytes, SHA-256
`652949ebd1103e806b1e55ad5528a7b7b07bb0d338091bf0f62cec6254496ed6`.

| SDK header | Export | Checked through the combined library |
| --- | --- | --- |
| shader_module_c.h | tower_vk_try_create_shader_module | SDK client recorded called=1, result=0. Separate checks covered local refusal, overlapping slots and driver −2. Real module created and destroyed. |
| frame_submit.h | tower_vk_command_begin_v1 | Reset then one-time begin. Five C cases covered zero, −1 and −4 with reset or begin failing. |
| frame_submit.h | tower_vk_command_end_for_submit_v1 | End status 0 or −4. SDK checked the borrowed command, wait, stage and signal pointers and unchanged destination after failed end. |
| frame_submit.h | tower_vk_queue_submit_one_v1 | One submit with the original descriptor and fence, status 0 or −4. Also used by the three-frame C event test. |
| frame_submit.h | tower_vk_command_finish_v1 | End, submit, then idle on the same queue. Ten C cases checked success and −4, −1 or +1 at each step. Failed idle left accepted work pending. |
| indexed_draw_c.h | tower_vk_record_indexed_indirect_count_v1 | 38 SDK callback cases, including both HUD layouts. Each acceptance forwarded seven arguments once. Each refusal called the driver zero times. |
| buffer_upload_record.h | tower_vk_buffer_upload_record_v1 | Copy and global dependency fields checked at 1, 73, 67,108,864 and 4,294,967,369 bytes with a recorder. |
| osd_texture_upload_record.h | tower_vk_osd_texture_upload_record_v1 | Five texture shapes and one mixed-order control. Checked 12/2/2/8/4/4 barriers and 6/2/2/4/2/4 copy regions respectively. |
| tight_color_regions.h | tower_vk_build_tight_color_regions_v1 | SDK compared ordered fields, exact and short capacities/payloads, wide offsets, mixed mips, invalid inputs and output guards. |
| bound_image_view.h | tower_vk_create_bound_image_view_v1 | Nine Linux cases × four results checked the descriptor, private handle slot and guarded output. The GPU fixture sampled all five retained views. |
| create_image.h | tower_vk_create_image_v1 | Four SDK descriptors × four results (0, −1, −2, +1) checked borrowed pointers, driver clobber and success-only publication. The device check correlated ten created images with their views. |
| image_format_preflight.h | tower_vk_image_format_preflight_v1 | 32 raw SDK and linked recording cases checked query fields, signed results, output guards and driver clobber. The retained device caller used the same DSO for preflight, create and view. |
| image_allocation_plan.h | tower_vk_plan_image_allocation_v1 | Nine external C recording cases and five RTX source allocations, including guarded readback and injected allocation and bind failures. |
| image_memory.h | tower_vk_allocate_memory_v1 | Original descriptor and extension chain, null allocator, full-width size and success-only handle publication through a private slot. |
| image_memory.h | tower_vk_bind_image_memory_zero_v1 | The recorder checked the acquired memory handle, image, zero offset and caller accounting at bind. |

Include `image_format_preflight.h` and link with `-ltower_graphics`.
Pass the selected physical device and the descriptor you intend to create.
Supply distinct writable properties and decision outputs. A nonzero
`VkResult` preserves both outputs. On `VK_SUCCESS`, inspect `supported`
before creating the image. Both successful decisions publish the complete
queried properties. The decision compares positive extents, mip levels and
array layers with their inclusive limits and checks for a common sample bit.

The SDK headers specify the ownership and synchronization requirements.
Creation leaves binding to the caller. Upload recording returns before
submission. Keep staging live through retirement, and keep a sampled view,
its image and memory live through the final read. A failed idle after a
successful submit requires recovery before freeing pending resources.

## Allocate and bind through the fifteen-entry library

Include `image_allocation_plan.h` and `image_memory.h`. After successful
preflight, image creation and planning, pass the planner's original
`VkMemoryAllocateInfo` to `tower_vk_allocate_memory_v1`. Supply a
separate, initially null `VkDeviceMemory` slot. On `VK_SUCCESS`, record
the full `allocationSize` and allocation count, then call
`tower_vk_bind_image_memory_zero_v1` with the acquired handle. Create the
view only after a successful bind. Each call preserves its signed driver
result. A bind failure leaves the image, allocation and charge with the
caller. After last use, destroy the view and image, free the memory and
reverse the charge. [External C SDK client](linux_checks/memory_sdk_client.c)

On host 12 the ELF loader bound all six construction calls from that C
client to one DSO. The retained raw and shared five-image runs on the RTX
3090 matched all 103,158,144 guarded bytes. Job
`b8b88b52-ea22-4141-b4cf-1c498c4e93b1` includes the binaries, commands,
captures, loader traces, exit statuses and sanitizer logs. Draw's
thirteen-entry uptake is recorded below. [Device checks and coverage](../../../../docs/temporal-opcode-research-journal.md#linux-graphics-library-allocation-and-zero-offset-bind-on-host-12)

Rendering independently rebuilt the 15,352-byte release at worker revision
`c5e3df6b2274cd0776bfe418710db1bc59f00364`. Its SHA-256 was
`1296b5b49762c4807d343c69afda5bfca52ee35621d86c0142b27e8bed2e2104`.
Both existing SDK recording executables and the prior planner executable
reproduced their stored rows on the new library. The new memory recording
client reproduced its case results and pointer relationships after accounting
for address randomization. Eager loading with the thirteen-entry library
exited 127 on the missing zero-offset bind entry.

The separate `sdk-new` executable queries the selected device. Its
compatibility receipt belongs to the worker's RTX 3090 run. Rendering
rehash-checked the worker's packed guarded streams from the raw, shared and
clean shared replay paths against its retained SDK reference. Each digest
was `140d8d6511a77daee97ebd377dfc34c9c90347cf084d0dd4516e5474315d143b`.
Draw's shipping constructor and GPU acceptance have their own revisions.

## Link the image planner

The thirteen-entry DSO is 15,120 bytes with SHA-256
`6816c2282148a963f832409a8a2553663e48d7fc748b3f6a7877c59d97e40bca`.
Include `image_allocation_plan.h` and link with `-ltower_graphics`. After
preflight and successful image creation, pass the live device, the unbound
image and its physical device's memory-type table. On `VK_TRUE`, pass the
returned descriptor to `vkAllocateMemory`. Account its full size after
success, bind at offset zero, then create the view. On `VK_FALSE`, the
output slot retains its original bytes. The caller owns failure cleanup and
retirement. [Planner contract and standalone checks](image_allocation_plan_v1.md)

On Linux, [build_plan_clients.sh](linux_checks/build_plan_clients.sh) links
the same retained Tower owner with the raw SDK selector, the standalone
object or the shared entry. It compiles the SDK call sites with Clang and
uses the same device for planning, allocation, binding and view creation.
The CPU recorder, live loader bindings, fault runs, timings and replay
commands are in the indexed packet for job
`89f3c727-312d-485b-839f-4f8670138806`.
[Linux shared planner results](../../../../docs/temporal-opcode-research-journal.md#linux-graphics-library-image-allocation-planner-on-host-12)

## Run the twelve-entry C recording check

From the repository root, build the shared library as above. Generate the
shader header from the checked-in fragment shader using `glslangValidator`.
The C executable provides Vulkan recording functions. Export them from the
executable so the shared library resolves its loader calls to the recorder.

```bash
v=scaffolding/library/graphics/vulkan
glslangValidator -V --target-env vulkan1.1 --vn color_frag \
  "$v/counted_shaders/color.frag" -o out/color_frag.h
bootstrap/linux-x64/towerc "$v/linux_checks/api_trace.tower" \
  --library --jobs 1 --foundation "$PWD/scaffolding/foundation.tower" -o out/api_trace.o
cc -std=c11 -O2 -I"$v" -Iout "$v/linux_checks/api_client.c" out/api_trace.o \
  -Lout -ltower_graphics '-Wl,--export-dynamic-symbol=vk*' \
  -Wl,-rpath,'$ORIGIN' -o out/sdk-all
out/sdk-all
```

A passing run exits 0 and prints fifteen rows. The format query records
one `Q` call, result 0, decision 1 and a 4,096-byte resource limit.
The final three rows trace end (`E`), submit (`S`) and blocking finish
(`ESI`). The original eleven-entry C executable from job `322c325f`
also ran unchanged and reproduced all twelve of its original rows.

## Twelve-entry hardware check

On the RTX 3090 with NVIDIA 565.57.01, the retained Tower caller resolved
the query, image and bound-view helpers to one `libtower_graphics.so`.
It retained five textures through sixteen reads. All 103,158,144 guarded
bytes matched the frozen raw SDK capture. A request 4,294,967,295 texels
wide exceeded the reported limit of 32,768 and exited before any image
creation or device-memory allocation. The job packet includes the prior
two-library comparison, runtime bindings, descriptor and lifetime traces.
[Measurements and sanitizer results](../../../../docs/temporal-opcode-research-journal.md#package-the-image-format-preflight-with-the-linux-vulkan-c-entries)

## Historical eleven-entry hardware readback

Vulkan selected an RTX 3090, API 1.3.289, NVIDIA 565.57.01, for the
worker's synthetic texture test. The ELF loader bound six entries to the
shared library in this run: image creation, bound-view creation, region
building, texture upload recording, command begin and blocking finish.
The device caller retained five source images and views across sixteen
sampled reads. All 189 lifetime events passed the ownership check. Each
upload completed on its queue before staging was freed. Injected failure
of the second image creation returned signed −2 and stopped before binding
the failed image. The first retired allocation was released.

Rendering compared the 103,158,144 captured bytes with the separately
retained raw SDK control. Both yielded SHA-256
`140d8d6511a77daee97ebd377dfc34c9c90347cf084d0dd4516e5474315d143b`.
Synchronization validation reported zero warnings or errors. Full-device
LeakSanitizer reported 4,187 bytes in 15 allocations in each link form.
Ownership remains unresolved. Both GPU ThreadSanitizer processes exited
66 before completing. The recording boundary separately completed its
four-thread checks. Draw's shipping application has separate adoption tests.

## Draw constructor checks with the eleven-entry library

Draw `2f38b19c8218fef304993df5708a7458fa16776b` independently built Tower
`bef3026fc41d02334a2fd3f88f18b8d6e9392abe` with the pinned `a580e70a`
bootstrap and GNU ld 2.44. The resulting 14,816-byte DSO reproduced the
original SHA-256 `d926aabb989ac25ac3a5aa79dd00b5f557124c39a04855018ac7f678d5efe715`,
its eleven exports, SONAME and sole loader dependency.
From the Draw checkout, with `tower_root` set to that Tower checkout
and the built library in its `out` directory, run:

```sh
TOWERC="$tower_root/bootstrap/linux-x64/towerc" \
DRAW_TOWER_GRAPHICS_SO="$tower_root/out/libtower_graphics.so" \
DRAW_TOWER_CREATE_IMAGE_ROOT="$tower_root" DRAW_TOWER_BOUND_VIEW_ROOT="$tower_root" \
bash tests/vulkan-image.sh
```

Draw reported exit 0. All eight configurations across 25 scenarios
matched the individual-object results for traces, diagnostics and exit
status. Two additional view-failure controls passed. For the five shipped
texture headers, the 45-event trace SHA-256 was
`e5db18d01d84e0601fab1a1b0b50720219e60aa3cf003db8fda992dbeed86e89`.
With `LD_DEBUG=bindings` on the `osd-pack` case, both Draw's C and Tower
owning constructors resolved `tower_vk_create_image_v1` and
`tower_vk_create_bound_image_view_v1` to the checksum-matched DSO.
The recording ELFs had SHA-256
`367a6286429c3bd8ca82ff993cd0b3641ca6a5e8aeb41687ceff3b9f91418b44`
and `9a9159988539986689c2eb57bdf2c939e3590f3e1d7ddbb5aca5f82180a82158`.

These constructor checks used CPU recording drivers. Draw subsequently
ran the separately linked application on hardware.

## Draw shipping renderer on Linux

The shipping results below use the eleven-entry release.

Draw job `7c22503e-5491-4462-a6da-c1efdc38c3d3` used the eleven-entry
Tower library at `bef3026fc41d02334a2fd3f88f18b8d6e9392abe`. The Draw
worker tested runtime `05c09e1d87414bb02cf0dcd03f7a1e71872c8d0b`
and fixtures `643863eeb15d33d0c62e3a4034e4ed61590a4fcd` on base
`258877b947cde3eb082051e38f13f90778b1077d`. The earlier Draw manager
revision `2f38b19c` was unavailable on that worker. Draw verified
2,745 entries in archive
`8e1011c14566a86d3f035a0a93970fb5c44844996743eee05e1e551045ef7248`.
Rendering rehashed the retained 14,816-byte library and matched Draw's
`d926aabb989ac25ac3a5aa79dd00b5f557124c39a04855018ac7f678d5efe715`.

The shared executable imported six Tower operations. While `osd_create`
ran, debugger and loader traces placed eight command begins, two finishes,
eight image creations and eight bound-view creations in `out/libtower_graphics.so`.
The optimized shared executable had SHA-256
`f734f317546bc900a37b71c6460ee6d54f8bff3729acc566f094e21f540c54e8`.
The object-linked executable had SHA-256
`73c295323a62c7cba5ac3a5a10a98a0f0dd4284d1700bd33ba3effbe2536c61a`.

Vulkan selected an RTX 5060 Ti (10de:2d04), device API 1.4.303, NVIDIA
570.169, with the 1.4.328 SDK loader. Draw reported exit 0 for this run.

```sh
"$shared" --offscreen --validate --fixed-time 0 --day-hour 12 \
    --size 1280 800 --frames 4 --osd assets/osd/state.bin \
    --resize-test --no-hud --capture hud-shared.ppm
```

Draw compared both C and Tower constructors with each link form against
the shipping pack. All four captures matched across 16 subresources.
The 27,541,504 active bytes had SHA-256
`df14881703119d96e6def5700eafd7927d7b83c890bf3e85f77d4db11e679ac4`.
Including 364,544 guard and padding bytes, the digest was
`bd512fc0888f77285f3fa422326f9923471e5d306b7242455fd13825d87bd76f`.
Normal and resized RGB, HUD and camera outputs matched the earlier run.
Across 120 matched completed-frame intervals, Draw reported medians
of 9.388 ms with object linkage and 9.428 ms with shared linkage.

Draw injected −2 before forwarding the second image creation. Six
object-linked runs and three ordinary shared runs exited 1. Of three
validated shared runs, two received SIGSEGV and one exited 1. The failed
image never reached requirements or bind. The first atlas had no recorded
explicit teardown. Draw owns recovery under `f6abd0c0`.

Separately, the stock C constructor requested `R8_UNORM` for a depth/stencil
attachment. The hardware query returned the expected format rejection
(−11). The first process exited 139. On a full repeat both C and Tower
refusals exited 1. The cause of the signal remains open. Draw's shipping
preflight job `dff82eda` uses this shared-library run as its prerequisite.

## Draw constructor checks with the twelve-entry library

At Draw `51d4785e6456353b9a65f49d311cb0c6925ee42d`, the C and Tower
image constructors can use one shared library for format preflight, image
creation and bound-view creation. Draw independently fetched Tower
`73f499791fcdb6b69bdc16fd7e0a34a847668053` and rebuilt the 14,976-byte
ELF with the release digest above. In the Draw checkout, select the
release headers and the same absolute shared object for both selectors.

```sh
export DRAW_TOWER_GRAPHICS_SO="$TOWER_OUT/libtower_graphics.so"
export DRAW_TOWER_IMAGE_PREFLIGHT_SO="$DRAW_TOWER_GRAPHICS_SO"
bash tests/vulkan-image.sh
```

Draw reported 290 matching scenarios across ten recording configurations
and two additional clobbered-view checks. Both final configurations
reproduced all 29 traces, diagnostics and exits of the split-library check.
With the five shipping OSD headers, the 45-event trace had SHA-256
`e5db18d01d84e0601fab1a1b0b50720219e60aa3cf003db8fda992dbeed86e89`.
The separate 28-row SDK reference had SHA-256
`c5a4f4aee3da06792977fb78b71737a219de63c12190f22114bd7ad231d7ca3e`.

Each recording executable had one Tower library dependency. Draw traced all
three symbols to the rebuilt library with `LD_DEBUG`. The C executable had
SHA-256 `c4ae00b8be510cfc2d1de656f5657becf54e69319e4a19771d48db8b8ba0ca01`
and the Tower executable had SHA-256
`ac69616d5ddc9a89a6a3822fc9c67f4fff26e061beb0f84a8c14c97a3e681144`.
The eleven-entry Draw recording executable also ran unchanged against this
release. Draw checked the builder's library selection across four builds.
The split configuration loaded two Tower libraries, the single-library
build and its cached repeat loaded one, and the object build loaded zero.

These Draw tests used a recording Vulkan driver. Draw assigned the shipping
GPU comparison to slot 10 job `b6f28d59-681f-44bd-b19e-6922d03bf357`
using the standalone preflight result from `dff82eda`. The planner has
its own shipping test in `7e3234ce`.

## Draw constructor checks with the thirteen-entry library

Draw integrated the library in both image constructors at local commit
`51365ca81c6a3267cadfb14fdc69b7b29fd3450c`, tree
`dee4c19c163391d479112c3bb4ca8e30d684c7a5`. Draw rebuilt Tower
`2b7a733c4cc4e199f4f104b67b0eb9a3bd66fc7d` and matched the 15,120-byte
release, SHA-256
`6816c2282148a963f832409a8a2553663e48d7fc748b3f6a7877c59d97e40bca`.
Its exports include the previous twelve entries and the planner. Its only
required shared library is `libvulkan.so.1`.

From the pinned Draw checkout, set `TOWER_ROOT` to the absolute Tower
checkout path and `TOWER_OUT` to the absolute directory containing the built
library. Use the same file for all three shared-library selectors.

```sh
export DRAW_TOWER_CREATE_IMAGE_ROOT="$TOWER_ROOT"
export DRAW_TOWER_BOUND_VIEW_ROOT="$TOWER_ROOT"
export DRAW_TOWER_IMAGE_PREFLIGHT_ROOT="$TOWER_ROOT"
export DRAW_TOWER_IMAGE_ALLOCATION_PLAN_ROOT="$TOWER_ROOT"
export DRAW_TOWER_GRAPHICS_SO="$TOWER_OUT/libtower_graphics.so"
export DRAW_TOWER_IMAGE_PREFLIGHT_SO="$DRAW_TOWER_GRAPHICS_SO"
export DRAW_TOWER_IMAGE_ALLOCATION_PLAN_SO="$DRAW_TOWER_GRAPHICS_SO"
export LD_LIBRARY_PATH="$TOWER_OUT${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
bash tests/vulkan-image.sh
```

Draw matched exit statuses and traces for 29 scenarios across twelve
configurations (348 comparisons), plus two clobbered-output checks.
In the `osd-pack` case, `LD_DEBUG=bindings` showed both the C and Tower
constructor executables resolving preflight, image creation, allocation
planning and bound-view creation to the same file. Each produced the
45-event trace with SHA-256
`e5db18d01d84e0601fab1a1b0b50720219e60aa3cf003db8fda992dbeed86e89`.
Both owners preserved the full 4,294,983,680-byte size and memory type 31.
Allocation failure stopped before accounting. At bind failure the owner
had already recorded 16,384 bytes and one live allocation.

Draw reproduced the nine external C planner rows
(`ed6ced81bad6a066292e87b29a78d55630920d2fa4594d69870ffc202ad303e2`)
and the 28-row preflight result from its unchanged twelve-entry-linked
client (`c5a4f4aee3da06792977fb78b71737a219de63c12190f22114bd7ad231d7ca3e`).
Rendering replayed its separate nine-row planner and fifteen-row previous
SDK client against the same release and matched its retained results.

These Draw runs used a recording driver. Draw assigned the shipping
RTX 5060 Ti comparison to slot 10 job
`b6ef1857-bd89-44b4-910d-2d2349bb20c9`. Its inputs are the twelve-entry
shared-library job `b6f28d59-681f-44bd-b19e-6922d03bf357` and the
standalone planner job `7e3234ce-f5ca-4d1a-807a-086d3a68d274`.
In this release Draw still calls Vulkan to allocate and bind memory.
