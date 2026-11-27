#!/usr/bin/env bash
# Instrument the native call boundary and per-invocation recorder. Reuse
# the sealed four-pthread transport to test independent owners concurrently.
set -euo pipefail
source "$D/e/env.sh"
H=$V/osd_checks/retirement
res=$SDK/usr/lib/llvm-19/lib/clang/19/lib/linux
export LD_LIBRARY_PATH=$res:$LIB
o=$D/results/native
mkdir -p "$o"
cd "$o"
set -x
tower=("$CC" --library --jobs 1 --foundation "$S/scaffolding/foundation.tower" --no-optimize)
"${tower[@]}" "$H/owner.tower" --raw-ir owner.ll -o owner.o
"${tower[@]}" "$V/image_retirement.tower" --raw-ir provider.ll -o provider.o
"${tower[@]}" "$D/p13/control/inputs/parallel.tower" --raw-ir parallel.ll -o parallel.o
cc=(clang --target=x86_64-linux-gnu -idirafter "$SDK/usr/include" -idirafter "$SDK/usr/include/x86_64-linux-gnu" -O1 -g -Wall -Wextra -Werror)
link=(ld.lld --dynamic-linker /lib64/ld-linux-x86-64.so.2 "$LIB/crt1.o" "$LIB/crti.o")
cb=(--redefine-sym record_view=vkDestroyImageView --redefine-sym record_image=vkDestroyImage --redefine-sym record_memory=vkFreeMemory)
for san in address thread; do
    dir=$o/$san
    mkdir -p "$dir"
    cd "$dir"
    units=(owner provider)
    cb_names=("${cb[@]}")
    transport=()
    if [[ $san == address ]]; then
        passes=forceattrs,asan; rt=asan
    else
        passes='forceattrs,tsan-module,function(tsan)'; rt=tsan
        units+=(parallel); transport=(parallel.o)
        cb_names+=(--redefine-sym main=record_suite)
    fi
    for unit in "${units[@]}"; do
        opt "-passes=$passes" "-force-attribute=sanitize_$san" "$o/$unit.ll" -o "$unit.bc"
        llc -filetype=obj -relocation-model=pic "$unit.bc" -o "$unit.o"
    done
    llvm-objcopy "${cb_names[@]}" owner.o cases.o
    llvm-objdump -dr cases.o provider.o >instrumentation
    for arm in sdk linked; do
        source=$H/sdk.c; provider=()
        if [[ $arm == linked ]]; then source=$V/osd_checks/retired_image_client.c; provider=(provider.o); fi
        "${cc[@]}" -fsanitize="$san",undefined -fsanitize-trap=undefined -c "$source" -o "$arm.o"
        "${link[@]}" -Map="$arm.map" -o "$arm" "${transport[@]}" cases.o "$arm.o" "${provider[@]}" \
            "$res/libclang_rt.$rt-x86_64.so" "$D/p13/control/inputs/rt.o" \
            /lib/x86_64-linux-gnu/libgcc_s.so.1 /lib/x86_64-linux-gnu/libc.so.6 "$LIB/crtn.o"
        llvm-readelf -d "$arm" >"$arm.needed"
        for attempt in {1..32}; do
            tag=$arm-$attempt; rc=0
            ASAN_OPTIONS=detect_leaks=1 timeout -k 2 30 "./$arm" >"$tag.out" 2>"$tag.err" || rc=$?
            echo "$rc" >"$tag.exit"
            if (( rc == 0 )); then
                test ! -s "$tag.err"
                rows=1; if [[ $san == thread ]]; then rows=16; fi
                { for ((i=0; i<rows; i++)); do tr -d '\r' <"$D/results/sdk/owner/mask.out"; done; } | sort >expected
                sort "$tag.out" | diff -u expected -
                break
            fi
            [[ $san == thread && $attempt != 32 ]] && rg -q 'ADDR_NO_RANDOMIZE|unexpected memory mapping' "$tag.err" || exit "$rc"
        done
    done
done
