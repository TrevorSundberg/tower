#!/usr/bin/env bash
# D is a fresh qualification directory prepared by qualify.sh.
set -euo pipefail
source "$D/e/env.sh"
source "$E/package-env.sh"
H=$V/osd_checks/retirement
C=$V/osd_checks
P=$D/p13/control
I=$P/inputs
O=$D/results
old=$D/p15
cd "$O"
set -x
tower=("$CC" --foundation "$S/scaffolding/foundation.tower" --library --jobs 1 --target x86_64-w64-windows-gnu)
cc=(clang --target=x86_64-w64-windows-gnu --sysroot="$MINGW_SYSROOT" -idirafter "$VULKAN_INCLUDE" -std=c11 -O2 -Wall -Wextra -Werror)
link=("${cc[@]}" -fuse-ld=lld -L"$G" -Wl,--no-insert-timestamp)
symbol=tower_vk_destroy_retired_image_v1
cmp standalone/retired.obj release/image_retirement.obj
llvm-objdump -dr standalone/retired.obj >standalone/retired.asm
llvm-readobj --coff-exports release/tower_graphics.dll >release/dll.exports
awk '$1=="Ordinal:"{o=$2} $1=="Name:"{print o,$2}' release/dll.exports >release/ordinals
(cat "$old/release/ordinals"; echo "16 $symbol") | diff -u - release/ordinals
rg " $symbol .* image_retirement.obj$" release/tower_graphics.map
llvm-readobj --coff-imports release/tower_graphics.dll >release/loader.imports
for name in vkDestroyImageView vkDestroyImage vkFreeMemory; do
    awk -v n="$name" '$1=="Name:"{d=$2} d=="vulkan-1.dll" && $1=="Symbol:" && $2==n {f=1} END{exit !f}' release/loader.imports
    rg "IMAGE_REL_AMD64_REL32[[:space:]]+$name$" standalone/retired.asm
done
"${tower[@]}" "$C/retired_image_cases.tower" -o published.obj
llvm-objcopy --redefine-sym vkDestroyImageView=record_view --redefine-sym vkDestroyImage=record_image \
    --redefine-sym vkFreeMemory=record_memory published.obj published_callbacks.obj
"${tower[@]}" "$H/owner.tower" -o owner.obj
"${cc[@]}" -c "$H/sdk.c" -o sdk.obj
"${cc[@]}" -c "$C/retired_image_client.c" -o client.obj
llvm-objdump -dr client.obj >client.asm
rg "IMAGE_REL_AMD64_REL32[[:space:]]+$symbol$" client.asm
rc=0
"${link[@]}" owner.obj client.obj "$old/release/tower_graphics.lib" "$I/vulkan-1.lib" -o missing.exe >missing-link.log 2>&1 || rc=$?
echo "$rc" >missing-link.exit
test "$rc" = 1
rg "undefined symbol: $symbol$" missing-link.log

# Apply the same fixture overlays as the sealed planner build, replacing only
# the source owner's defer. Target, staging, and failure paths keep their owners.
mkdir "$D/fixture"
tar xf "$P/input/fixture-inputs.tar" -C "$D/fixture"
app=$D/fixture/scaffolding/library/graphics/vulkan
cp "$P/input/"{wine_device,win_io}.tower "$C/"{gpu,shapes,oracle,texture_memory,allocation_memory}.tower "$H/retired_source.tower" "$app/"
sed -i 's/import library.graphics.indexed_indirect;/import .indexed_indirect;/' "$app/"{counted_record,indexed_draw}.tower
sed -i '/^struct ReadbackDevice {/a\    physical: VkPhysicalDeviceHandle*;' "$app/readback_device.tower"
sed -i '/out.family = family;/a\        out.physical = physical;' "$app/readback_device.tower"
sed -i '/if core.apiVersion < VkApi13/i\    if core.deviceType != 2 || core.vendorID != 4318 { return vk_failure("discrete NVIDIA device required"); }' "$app/readback_device.tower"
sed -i 's/^export fn /fn /' "$app/"{buffer_upload_record,command_begin,command_end,frame_submit}.tower
sed -i 's/^import texture_memory as memory;/import allocation_memory as memory;\nimport retired_source;/
    s/defer release(ctx, \&source);/defer retire_sampled_source(ctx.device, source.view, source.image, source.memory);/' "$app/gpu.tower"
"${tower[@]}" "$app/gpu.tower" -o gpu.obj
llvm-objcopy --redefine-sym vkGetImageMemoryRequirements=osd_trace_requirements \
    --redefine-sym vkGetPhysicalDeviceMemoryProperties=osd_trace_properties \
    --redefine-sym vkCreateImage=osd_trace_create --redefine-sym vkCreateImageView=osd_fixture_create_view \
    --redefine-sym vkDestroyImageView=osd_fixture_destroy_view --redefine-sym osd_check_allocation=memory_plan_source \
    --redefine-sym vkAllocateMemory=memory_allocate_source --redefine-sym vkBindImageMemory=memory_bind_source \
    --redefine-sym "tower.fn.readback_number@$app/readback_device.tower=tower.fn.readback_number@scaffolding/library/graphics/vulkan/readback_device.tower" \
    --redefine-sym vkFreeMemory=memory_free_source gpu.obj fixture.obj
"${cc[@]}" -c "$H/observe.c" -o observe.obj
printf 'LIBRARY winevulkan.dll\nEXPORTS\nvkDestroyImageView\nvkDestroyImage\nvkFreeMemory\n' >direct.def
llvm-dlltool -m i386:x86-64 -d direct.def -l direct.lib
"${cc[@]}" -x c -c /dev/null -o empty.obj

# A synthetic loader forwards the three imports from either PE to that PE's
# recording exports. The observed device run forwards all other calls to Wine.
forwarder() {
    local prefix=$1
    shift
    { printf 'LIBRARY vulkan-1.dll\nEXPORTS\n'
      llvm-readobj --coff-imports "$@" | awk '$1=="Name:"{dll=$2}
        dll=="vulkan-1.dll" && $1=="Symbol:"{print $2}' | sort -u |
      awk -v p="$prefix" '{target="winevulkan."$1}
        $1=="vkDestroyImageView"{target="program.exe."p"_view"}
        $1=="vkDestroyImage"{target="program.exe."p"_image"}
        $1=="vkFreeMemory"{target="program.exe."p"_memory"}
        {print $1 "=" target}'
    } >loader.def
    lld-link /dll /noentry /nodefaultlib /machine:x64 /timestamp:0 /def:loader.def /out:vulkan-1.dll "$O/empty.obj"
}
for arm in sdk object dll ubsan observed; do
    cd "$O"
    case "$arm" in
      sdk) caller=sdk.obj; provider=() ;;
      object) caller=client.obj; provider=("$O/standalone/retired.obj") ;;
      *) caller=client.obj; provider=() ;;
    esac
    flags=()
    if [[ $arm == ubsan ]]; then
        flags=(-fsanitize=undefined -fsanitize-trap=undefined)
        "${cc[@]}" "${flags[@]}" -c "$C/retired_image_client.c" -o ubsan_client.obj
        caller=ubsan_client.obj
    fi
    for path in published owner device; do
        if [[ $arm == observed && $path != device ]]; then continue; fi
        mkdir -p "$O/$arm/$path"
        cd "$O/$arm/$path"
        cp "$O/release/tower_graphics.dll" .
        # A standalone provider must satisfy the reference before the combined import library.
        libs=("${provider[@]}" "$O/release/tower_graphics.lib")
        if [[ $path == device ]]; then
            "${cc[@]}" "${flags[@]}" -c "$C/view_gpu.c" -o view.obj
            "${cc[@]}" "${flags[@]}" -c "$C/image_memory/device.c" -o device.obj
            observe=()
            fixture=$O/fixture.obj; sample=$I/sample.obj
            if [[ $arm == observed ]]; then
                printf 'EXPORTS\nobserve_view\nobserve_image\nobserve_memory\n' >program.def
                observe=("$O/observe.obj" program.def "$O/direct.lib")
                llvm-objcopy --redefine-sym perform_finish=observe_finish "$fixture" observed_fixture.obj
                llvm-objcopy --redefine-sym perform_finish=observe_finish "$sample" observed_sample.obj
                fixture=observed_fixture.obj; sample=observed_sample.obj
            fi
            "${link[@]}" "$fixture" device.obj "$O/$caller" "$old/dll/memory/linked-regular/calls.obj" \
                "$old/dll/e/bin/hardware-trace.obj" view.obj \
                "$sample" "$I/"{image_gpu-raw.obj,image_client.obj,view_client-linked.obj,caller-release.obj,linked.obj,raw_finish.obj,winrt.o} \
                "${libs[@]}" "${observe[@]}" "$I/vulkan-1.lib" "$G/libatomic.a" -Wl,-Map,program.map -o program.exe
            if [[ $arm == observed ]]; then forwarder observe program.exe tower_graphics.dll; fi
        else
            obj=$path.obj
            if [[ $path == published ]]; then obj=published_callbacks.obj; fi
            printf 'EXPORTS\nrecord_view\nrecord_image\nrecord_memory\n' >program.def
            "${link[@]}" "$O/$obj" "$O/$caller" program.def "${libs[@]}" "$I/vulkan-1.lib" -Wl,-Map,program.map -o program.exe
            forwarder record program.exe tower_graphics.dll
        fi
        llvm-readobj --coff-imports program.exe >program.imports
        if [[ $arm == object ]]; then
            rg "standalone/retired.obj:" program.map
            ! rg "$symbol" program.imports || exit 1
        elif [[ $arm != sdk ]]; then
            awk -v sym="$symbol" '$1=="Name:"{dll=$2} dll=="tower_graphics.dll" && $2==sym && $3=="(16)"{f=1} END{exit !f}' program.imports
        fi
    done
done
