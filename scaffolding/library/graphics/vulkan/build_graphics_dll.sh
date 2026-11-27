#!/usr/bin/env bash
# Linux x86-64 host, Windows x64 target. Run with LLVM's COFF tools on PATH.
set -euo pipefail
if (( $# < 1 || $# > 2 )) || [[ $# == 2 && $2 != --with-consumer ]]; then
    echo "usage: $0 OUTPUT_DIRECTORY [--with-consumer]" >&2
    exit 2
fi
v=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$v/../../../.." && pwd)
mkdir -p "$1"
cd "$1"
(cd "$root/bootstrap/linux-x64" && sha256sum --check --quiet SHA256SUMS)
for unit in shader_module_c command_begin command_finish indexed_draw_c buffer_upload_record osd_texture_upload_record tight_color_regions bound_image_view create_image image_format_preflight image_allocation_plan image_memory image_retirement; do
    "$root/bootstrap/linux-x64/towerc" "$v/$unit.tower" --library --jobs 1 \
        --target x86_64-w64-windows-gnu --foundation "$root/scaffolding/foundation.tower" \
        -o "$unit.obj"
done
# These are the complete loader dependencies of the graphics DLL.
printf 'LIBRARY vulkan-1.dll\nEXPORTS\n  vkCreateShaderModule\n  vkResetCommandBuffer\n  vkBeginCommandBuffer\n  vkEndCommandBuffer\n  vkQueueSubmit\n  vkQueueWaitIdle\n  vkCmdCopyBuffer\n  vkCmdCopyBufferToImage\n  vkCmdPipelineBarrier2\n  vkCreateImageView\n  vkCreateImage\n  vkGetPhysicalDeviceImageFormatProperties\n  vkGetImageMemoryRequirements\n  vkAllocateMemory\n  vkBindImageMemory\n  vkDestroyImageView\n  vkDestroyImage\n  vkFreeMemory\n' > graphics_loader.def
llvm-dlltool -m i386:x86-64 -d graphics_loader.def -l graphics_loader.lib
lld-link /dll /noentry /nodefaultlib /machine:x64 /timestamp:0 \
    /export:tower_vk_try_create_shader_module,@2 /export:tower_vk_queue_submit_one_v1,@1 \
    /export:tower_vk_record_indexed_indirect_count_v1,@3 \
    /export:tower_vk_command_begin_v1,@4 /export:tower_vk_command_end_for_submit_v1,@5 \
    /export:tower_vk_command_finish_v1,@6 /export:tower_vk_buffer_upload_record_v1,@7 \
    /export:tower_vk_osd_texture_upload_record_v1,@8 \
    /export:tower_vk_build_tight_color_regions_v1,@9 /export:tower_vk_create_bound_image_view_v1,@10 \
    /export:tower_vk_create_image_v1,@11 \
    /export:tower_vk_image_format_preflight_v1,@12 \
    /export:tower_vk_plan_image_allocation_v1,@13 \
    /export:tower_vk_allocate_memory_v1,@14 /export:tower_vk_bind_image_memory_zero_v1,@15 \
    /export:tower_vk_destroy_retired_image_v1,@16 \
    /out:tower_graphics.dll /implib:tower_graphics.lib /map:tower_graphics.map \
    shader_module_c.obj command_begin.obj command_finish.obj indexed_draw_c.obj buffer_upload_record.obj osd_texture_upload_record.obj tight_color_regions.obj bound_image_view.obj create_image.obj image_format_preflight.obj image_allocation_plan.obj image_memory.obj image_retirement.obj graphics_loader.lib

if [[ ${2:-} == --with-consumer ]]; then
    : "${MINGW_SYSROOT:?absolute path to the x86_64-w64-mingw32 sysroot}"
    : "${MINGW_GCC_LIB:?absolute path to the target directory containing libgcc.a}"
    : "${VULKAN_INCLUDE:?absolute path to the parent of vulkan/vulkan.h}"
    : "${VULKAN_IMPORT_LIB:?absolute path to the full x64 Vulkan loader import library}"
    glslangValidator -V --target-env vulkan1.1 --vn color_frag \
        "$v/counted_shaders/color.frag" -o color_frag.h
    target=(--target=x86_64-w64-windows-gnu --sysroot="$MINGW_SYSROOT")
    clang "${target[@]}" -idirafter "$VULKAN_INCLUDE" -I. -I"$v" \
        -std=c11 -O2 -Wall -Wextra -Werror -c "$v/graphics_consumer.c" -o graphics_consumer.obj
    clang "${target[@]}" -fuse-ld=lld -L"$MINGW_GCC_LIB" \
        -Wl,--no-insert-timestamp,-Map,graphics_consumer.map -o graphics_consumer.exe \
        graphics_consumer.obj tower_graphics.lib "$VULKAN_IMPORT_LIB"
fi
