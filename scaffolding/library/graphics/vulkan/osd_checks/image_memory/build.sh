#!/usr/bin/env bash
# D contains the clean, rebuilt 84bd5154 fixture. P contains its sealed control.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
source "$D/e/env.sh"
source "$E/package-env.sh"
I=$P/inputs
cc=(clang --target=x86_64-w64-windows-gnu --sysroot="$MINGW_SYSROOT" -idirafter "$VULKAN_INCLUDE" -std=c11 -O2 -Wall -Wextra -Werror)
link=("${cc[@]}" -fuse-ld=lld -L"$G" -Wl,--no-insert-timestamp)
out=$D/memory
mkdir "$out"
cd "$out"
set -x
"${cc[@]}" -c "$here/client.c" -o external.obj
llvm-objdump -dr external.obj >external.relocations
for symbol in tower_vk_allocate_memory_v1 tower_vk_bind_image_memory_zero_v1; do
    rg "IMAGE_REL_AMD64_REL32[[:space:]]+$symbol$" external.relocations
done
# The fixture compiler qualifies its local readback helper with the temporary source path.
source_file=scaffolding/library/graphics/vulkan/readback_device.tower
llvm-objcopy --redefine-sym osd_check_allocation=memory_plan_source \
    --redefine-sym osd_trace_allocate=memory_allocate_source --redefine-sym osd_trace_bind=memory_bind_source \
    --redefine-sym "tower.fn.readback_number@$D/fixture/$source_file=tower.fn.readback_number@$source_file" \
    --redefine-sym vkFreeMemory=memory_free_source "$E/bin/planned.obj" fixture.obj
arms=(sdk)
kind=sdk
if [[ -n ${PROVIDER_OBJ:-} ]]; then
    : "${PROVIDER_HEADER:?absolute released SDK header}"
    [[ -z ${PROVIDER_DLL:-} && -z ${PROVIDER_LIB:-} ]] || { echo "Choose the released object or DLL pair" >&2; exit 2; }
    llvm-nm --defined-only "$PROVIDER_OBJ" >provider.symbols
    for symbol in tower_vk_allocate_memory_v1 tower_vk_bind_image_memory_zero_v1; do rg " T $symbol$" provider.symbols; done
    sha256sum "$PROVIDER_OBJ" "$PROVIDER_HEADER" >released.sha256
    kind=object
    arms+=(linked)
elif [[ -n ${PROVIDER_DLL:-} || -n ${PROVIDER_LIB:-} || -n ${PROVIDER_HEADER:-} ]]; then
    : "${PROVIDER_LIB:?absolute released COFF import library}" "${PROVIDER_DLL:?absolute released DLL}" "${PROVIDER_HEADER:?absolute released SDK header}"
    llvm-readobj --coff-exports "$PROVIDER_DLL" > provider.exports
    for symbol in tower_vk_allocate_memory_v1 tower_vk_bind_image_memory_zero_v1; do rg -Fx "  Name: $symbol" provider.exports; done
    sha256sum "$PROVIDER_LIB" "$PROVIDER_DLL" "$PROVIDER_HEADER" >released.sha256
    kind=dll
    arms+=(linked)
fi
for arm in "${arms[@]}"; do
    for flavor in regular ubsan; do
        dir=$out/$arm-$flavor
        mkdir -p "$dir"/{device,record}
        cd "$dir"
        flags=()
        if [[ $flavor == ubsan ]]; then flags=(-fsanitize=undefined -fsanitize-trap=undefined); fi
        release=("$D/release/tower_graphics.lib")
        if [[ $arm == sdk ]]; then
            "${cc[@]}" "${flags[@]}" -c "$here/sdk.c" -o calls.obj
        else
            release=("${PROVIDER_OBJ:-${PROVIDER_LIB:-}}" "${release[@]}")
            if [[ $kind == dll && $(basename "$PROVIDER_DLL") == tower_graphics.dll ]]; then
                release=("$PROVIDER_LIB")
            fi
            "${cc[@]}" "${flags[@]}" "-DIMAGE_MEMORY_PROVIDER_HEADER=\"$PROVIDER_HEADER\"" -c "$here/client.c" -o calls.obj
        fi
        for src in recorder device; do "${cc[@]}" "${flags[@]}" -c "$here/$src.c" -o "$src.obj"; done
        for path in device record; do
            cp "$D/release/tower_graphics.dll" "$path/"
            if [[ $arm == linked && $kind == dll ]]; then cp "$PROVIDER_DLL" "$path/"; fi
        done
        device_inputs=("$out/fixture.obj" device.obj calls.obj "$E/bin/hardware-trace.obj" "$E/bin/view.obj"
            "$I/"{sample.obj,image_gpu-raw.obj,image_client.obj,view_client-linked.obj,caller-release.obj,linked.obj,raw_finish.obj,winrt.o}
            "${release[@]}")
        "${link[@]}" "${device_inputs[@]}" "$I/vulkan-1.lib" "$G/libatomic.a" -Wl,-Map,device/program.map -o device/program.exe
        if [[ $arm == linked && $kind == dll && $flavor == regular && $(basename "$PROVIDER_DLL") == tower_graphics.dll ]]; then
            mkdir observed
            cp "$PROVIDER_DLL" observed/
            (
                cd observed
                printf 'LIBRARY winevulkan.dll\nEXPORTS\nvkGetImageMemoryRequirements\nvkAllocateMemory\nvkBindImageMemory\n' > direct.def
                llvm-dlltool -m i386:x86-64 -d direct.def -l direct.lib
                printf 'EXPORTS\nosd_trace_requirements\nosd_trace_allocate\nosd_trace_bind\n' > observer.def
            )
            "${link[@]}" "${device_inputs[@]}" observed/observer.def observed/direct.lib "$I/vulkan-1.lib" "$G/libatomic.a" \
                -Wl,-Map,observed/program.map -o observed/program.exe
            (
                cd observed
                llvm-readobj --coff-imports program.exe >program.imports
                { printf 'LIBRARY vulkan-1.dll\nEXPORTS\n'
                  llvm-readobj --coff-imports program.exe tower_graphics.dll | awk '$1=="Name:"{dll=$2}
                    dll=="vulkan-1.dll" && $1=="Symbol:" {print $2}' | sort -u |
                  awk '{target="winevulkan."$1}
                    $1=="vkGetImageMemoryRequirements"{target="program.exe.osd_trace_requirements"}
                    $1=="vkAllocateMemory"{target="program.exe.osd_trace_allocate"}
                    $1=="vkBindImageMemory"{target="program.exe.osd_trace_bind"}
                    {print $1 "=" target}'
                } >loader.def
                "${cc[@]}" -x c -c /dev/null -o forward.obj
                lld-link /dll /noentry /nodefaultlib /machine:x64 /timestamp:0 /def:loader.def /out:vulkan-1.dll forward.obj
            )
        fi
        cat >record/program.def <<'DEFS'
EXPORTS
record_allocate
record_bind
record_requirements
record_view
record_destroy_view
record_destroy_image
record_free
DEFS
        "${link[@]}" recorder.obj calls.obj record/program.def "${release[@]}" "$I/vulkan-1.lib" \
            -Wl,-Map,record/program.map -o record/program.exe
        if [[ $arm == sdk && $flavor == regular ]]; then
            rc=0
            "${link[@]}" recorder.obj "$out/external.obj" "${release[@]}" "$I/vulkan-1.lib" \
                -o old.exe >"$out/old-link.log" 2>&1 || rc=$?
            echo "$rc" >"$out/old-link.exit"
            test "$rc" -eq 1
            for symbol in tower_vk_allocate_memory_v1 tower_vk_bind_image_memory_zero_v1; do
                rg "undefined symbol: $symbol$" "$out/old-link.log"
            done
        fi
        for path in record device; do
            llvm-readobj --coff-imports "$path/program.exe" >"$path/program.imports"
            rg 'tower_vk_plan_image_allocation_v1 \(13\)' "$path/program.imports"
            if [[ $arm == linked && $kind == object ]]; then
                llvm-nm "$path/program.exe" >"$path/program.symbols"
                for symbol in tower_vk_allocate_memory_v1 tower_vk_bind_image_memory_zero_v1; do
                    rg " T $symbol$" "$path/program.symbols"
                    awk -v file="$PROVIDER_OBJ" -v sym="$symbol" '/:\(/{owner=$0}
                        $NF==sym && index(owner,file ":("){print owner; print; found=1}
                        END{exit !found}' "$path/program.map" >"$path/$symbol.origin"
                done
            elif [[ $arm == linked ]]; then
                for symbol in tower_vk_allocate_memory_v1 tower_vk_bind_image_memory_zero_v1; do
                    awk -v dll="$(basename "$PROVIDER_DLL")" -v name="$symbol" \
                      '$1=="Name:"{d=$2} d==dll && $1=="Symbol:" && $2==name{found=1} END{exit !found}' "$path/program.imports"
                done
            fi
        done
        cd record
        # Redirect just these Vulkan calls from both PEs. All other imports use Wine's driver.
        { echo 'LIBRARY vulkan-1.dll'; echo EXPORTS
          llvm-readobj --coff-imports program.exe ./*.dll | awk '$1=="Name:"{dll=$2}
            dll=="vulkan-1.dll" && $1=="Symbol:" {print $2}' | sort -u |
          awk '{target="winevulkan."$1}
            $1=="vkGetImageMemoryRequirements"{target="program.exe.record_requirements"}
            $1=="vkAllocateMemory"{target="program.exe.record_allocate"}
            $1=="vkBindImageMemory"{target="program.exe.record_bind"}
            $1=="vkCreateImageView"{target="program.exe.record_view"}
            $1=="vkDestroyImageView"{target="program.exe.record_destroy_view"}
            $1=="vkDestroyImage"{target="program.exe.record_destroy_image"}
            $1=="vkFreeMemory"{target="program.exe.record_free"}
            {print $1 "=" target}'
        } > loader.def
        "${cc[@]}" -x c -c /dev/null -o forward.obj
        lld-link /dll /noentry /nodefaultlib /machine:x64 /timestamp:0 /def:loader.def /out:vulkan-1.dll forward.obj
    done
done
cd "$out/sdk-regular"
for san in address thread; do
    rc=0
    "${link[@]}" -fsanitize="$san" "$here/recorder.c" "$here/sdk.c" "$D/release/tower_graphics.lib" \
        "$I/vulkan-1.lib" -o "$out/probe-$san.exe" >"$out/probe-$san.log" 2>&1 || rc=$?
    echo "$rc" >"$out/probe-$san.exit"
    if (( rc )); then
        case $san in
          address) rg 'could not open .*clang_rt.asan.*No such file or directory' "$out/probe-$san.log" ;;
          thread) rg "unsupported option.*fsanitize=thread" "$out/probe-$san.log" ;;
        esac
    fi
done
