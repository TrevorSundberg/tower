#!/usr/bin/env bash
# Compare the native SDK and instrumented provider against the Win64 owner rows.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
source "$D/e/env.sh"
mkdir "$D/native-memory"
cd "$D/native-memory"
cc=(clang --target=x86_64-linux-gnu -idirafter "$SDK/usr/include" -idirafter "$SDK/usr/include/x86_64-linux-gnu" -O1 -g -Wall -Wextra -Werror)
set -x
res=$SDK/usr/lib/llvm-19/lib/clang/19/lib/linux
export LD_LIBRARY_PATH=$res:$LIB
asan=(-fsanitize=address,undefined -fsanitize-trap=undefined)
"${cc[@]}" "${asan[@]}" -Drecord_requirements=vkGetImageMemoryRequirements -Drecord_allocate=vkAllocateMemory \
    -Drecord_bind=vkBindImageMemory -Drecord_view=vkCreateImageView -Drecord_free=vkFreeMemory \
    -Drecord_destroy_view=vkDestroyImageView -Drecord_destroy_image=vkDestroyImage -c "$here/recorder.c" -o recorder.o
link=(ld.lld --dynamic-linker /lib64/ld-linux-x86-64.so.2 "$LIB/crt1.o" "$LIB/crti.o")
arms=(sdk)
if [[ ${CHECK_RELEASE_SOURCE:-} == 1 ]]; then
    "$CC" --foundation "$S/scaffolding/foundation.tower" "$here/../../image_memory.tower" --library --jobs 1 \
        --no-optimize --raw-ir memory.ll -o memory.o
    # The allocation entry accesses the private and public slots. Bind only forwards arguments.
    opt -passes=forceattrs,asan -force-attribute=sanitize_address memory.ll -o asan.bc
    llc -filetype=obj -relocation-model=pic asan.bc -o provider-asan.o
    llvm-objdump -dr --disassemble-symbols=tower_vk_allocate_memory_v1 provider-asan.o >provider-asan.asm
    rg '__asan_report_store' provider-asan.asm
    arms+=(linked)
fi
for arm in "${arms[@]}"; do
    mkdir "$arm"
    cd "$arm"
    provider=()
    if [[ $arm == sdk ]]; then
        "${cc[@]}" "${asan[@]}" -c "$here/sdk.c" -o calls.o
    else
        "${cc[@]}" "${asan[@]}" "-DIMAGE_MEMORY_PROVIDER_HEADER=\"$PROVIDER_HEADER\"" -c "$here/client.c" -o calls.o
        provider=(../provider-asan.o)
    fi
    "${link[@]}" -Map=asan.map -o record ../recorder.o calls.o "${provider[@]}" "$PRIOR/evidence/first/linux-plan.o" \
        "$res/libclang_rt.asan-x86_64.so" /lib/x86_64-linux-gnu/libc.so.6 "$LIB/crtn.o"
    llvm-objdump -dr calls.o ../recorder.o >instrumentation.txt
    llvm-readelf -d record >needed
    for c in small wide allocate-error clobber bind-error allocate-positive bind-other; do
        rc=0
        ASAN_OPTIONS=detect_leaks=1 ./record "$arm" "$c" >"$c.out" 2>"$c.err" || rc=$?
        echo "$rc" >"$c.exit"
        for pair in row:out diagnostic:err exit:exit; do
            cmp "$D/memory/$arm-regular/record/$c.${pair%:*}" "$c.${pair#*:}"
        done
    done
    cd ..
done
