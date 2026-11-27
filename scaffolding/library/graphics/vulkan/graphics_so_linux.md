# Linux x86-64 Vulkan C library

Build the eleven reviewed functions from the Tower checkout. The host needs the
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
review build is 14,816 bytes, SHA-256
`d926aabb989ac25ac3a5aa79dd00b5f557124c39a04855018ac7f678d5efe715`.

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

The SDK headers specify the ownership and synchronization requirements.
Creation leaves binding to the caller. Upload recording returns before
submission. Keep staging live through retirement, and keep a sampled view,
its image and memory live through the final read. A failed idle after a
successful submit requires recovery before freeing pending resources.

The single-executable recording check in `linux_checks` imports all eleven
functions. Job `322c325f-64d2-4ca0-8656-438ea23b6260` supplies its binary,
commands, checked operation rows, provider bindings and the frozen controls.
The job also compares a Linux RTX 3090 capture with the full guarded raw
reference. The journal records device identity, test scope, measurements and
the open leak report. [Linux release evidence](../../../../docs/temporal-opcode-research-journal.md#combining-eleven-reviewed-vulkan-entries-on-linux-x86-64)

## Run the eleven-entry C recording check

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

A passing run exits 0 and prints twelve rows. Shader creation reports
`called` and `VkResult` separately. The last three rows trace end (`E`),
submit (`S`) and blocking finish (`ESI`). Rendering reran the delivered
recording executable and verified all eleven runtime bindings to this DSO.

## Hardware readback

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

## Draw constructor checks with the shared library

Draw `2f38b19c8218fef304993df5708a7458fa16776b` independently built Tower
`bef3026fc41d02334a2fd3f88f18b8d6e9392abe` with the pinned `a580e70a`
bootstrap and GNU ld 2.44. The resulting 14,816-byte DSO reproduced the
SHA-256 above, its eleven exports, SONAME and sole loader dependency.
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

These calls used CPU recording drivers. Draw slot 10 job
`7c22503e-5491-4462-a6da-c1efdc38c3d3` is assigned the shipping DSO
driver bindings, packed GPU readback and HUD comparison after the
individual-provider job `447eb373-d35d-4ab3-8fa2-5ee2b481f96e`.
