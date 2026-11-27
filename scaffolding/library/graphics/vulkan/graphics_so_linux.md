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
