# Sourced by check_device.sh. Keep the release provider and retained owner
# intact. Instrument the two new Tower clients and the CPU recording path.
s=$b/sanitize
mkdir "$s"
"${tower[@]}" scaffolding/tools/instrument_llvm.tower -o "$s/instrument.o"
opt-19 -passes=internalize,globaldce -internalize-public-api-list=tower_allocate,tower_deallocate,tower_reallocate,tower_print,tower_trap \
    bootstrap/linux-x64/share/tower/runtime-host-linux-x64.ll -o "$s/runtime.bc"
llc-19 -filetype=obj -relocation-model=pic "$s/runtime.bc" -o "$s/runtime.o"
"${ld[@]}" "$s/instrument.o" "$s/runtime.o" "$l/libLLVM.so.19.1" "${end[@]}" -o "$s/instrument"
"${tower[@]}" "$P/threads.tower" --emit llvm -o "$s/threads.ll"
rt=$TOWER_SDK_ROOT/usr/lib/llvm-19/lib/clang/19/lib/linux
ulimit -c 0
export UBSAN_OPTIONS=halt_on_error=1
for mode in address thread; do
    k=$s/$mode; mkdir "$k"
    prefix=asan; if [[ $mode == thread ]]; then prefix=tsan; fi
    support=$rt/libclang_rt.$prefix-x86_64.so
    for unit in threads cpu recording_driver image_client memory_client; do
        ir=$cpu/$unit.ll; if [[ $unit == threads ]]; then ir=$s/threads.ll; fi
        opt-19 '-passes=default<O2>' "$ir" -S -o "$k/$unit.opt.ll"
        "$s/instrument" "$mode" "$k/$unit.opt.ll" "$k/$unit.ll"
        llc-19 -filetype=obj -relocation-model=pic "$k/$unit.ll" -o "$k/$unit.o"
    done
    sed -n '/^define .*@sdk_create(/,/^}/p' "$k/image_client.ll" >"$r/$mode.create.ll"
    grep "call .*__${prefix}_" "$r/$mode.create.ll" >"$r/$mode.hooks"
    llvm-objcopy-19 --redefine-sym main=memory_suite "$k/cpu.o" "$k/suite.o"
    "${cc[@]}" "-fsanitize=$mode,undefined" -fno-sanitize-recover=undefined -c "$here/sdk_layout.c" -o "$k/layout.o"
    "${ld[@]}" --export-dynamic "$k/threads.o" "$k/suite.o" "$k/recording_driver.o" "$k/layout.o" \
        "$cpu/runtime.o" "$support" "$release/libtower_graphics.so" "${end[@]}" -Map="$k/cpu.map" -o "$k/cpu"
    export LD_LIBRARY_PATH="$rt:$release:$f:$l"
    export ASAN_OPTIONS=detect_leaks=1
    for ((try=1;try<=24;try++)); do
        log=$r/$mode.cpu.$try.log
        rc=0; TOWER_OWNER_CANARY=1 "$k/cpu" >"$log" 2>&1 || rc=$?
        echo "$rc" >"$log.exit"
        if [[ $mode == thread && $rc == 139 ]] && grep -q 'personality(old_personality' "$log"; then continue; fi
        break
    done
    if [[ $rc != 0 ]]; then cat "$log" >&2; exit "$rc"; fi
    test "$(grep -Fxc 'seven direct entries; eight recording cases passed' "$log")" = 4
    link_device "$k/application" "$k/image_client.o" "$k/memory_client.o" "$support"
    if [[ $mode == address ]]; then
        ASAN_OPTIONS=detect_leaks=0 san_preload="$support:" run_device "$k/application" asan checked
    fi
done
