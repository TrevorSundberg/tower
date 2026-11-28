# Link one frozen recording workload to either the retained SDK-facing C call
# sites or the two Tower clients. One owner per pthread, no shared driver state.
bench=$b/cpu_pairs
mkdir "$bench"
llvm-extract-19 --delete --rfunc='^(sdk_preflight|sdk_create|sdk_view|osd_plan|osd_allocate_memory|osd_bind_memory|osd_destroy_retired_image)$' \
    "$cpu/cpu.ll" -o "$bench/cases.bc"
opt-19 '-passes=internalize,globaldce,default<O2>' -internalize-public-api-list=main "$bench/cases.bc" -o "$bench/workload.bc"
llc-19 -filetype=obj -relocation-model=pic "$bench/workload.bc" -o "$bench/main.o"
llvm-objcopy-19 --redefine-sym main=memory_suite "$bench/main.o" "$bench/suite.o"
"${tower[@]}" "$P/threads.tower" -o "$bench/threads.o"
for file in "$v/linux_checks/plan_device_client.c" "$c/plan_client.c" "$c/memory_client.c" "$c/retired_image_client.c"; do
    "${cc[@]}" -c "$file" -o "$bench/$(basename "$file" .c).o"
done
for width in 1 4; do
    main=("$bench/main.o")
    if [[ $width == 4 ]]; then main=("$bench/threads.o" "$bench/suite.o"); fi
    for lane in c tower; do
        clients=("$cpu/image_client.o" "$cpu/memory_client.o")
        if [[ $lane == c ]]; then clients=("$bench/plan_device_client.o" "$bench/plan_client.o" "$bench/memory_client.o" "$bench/retired_image_client.o"); fi
        "${ld[@]}" --export-dynamic "${main[@]}" "${clients[@]}" "$cpu/recording_driver.o" "$cpu/sdk_layout.o" \
            "$cpu/runtime.o" "$release/libtower_graphics.so" "${end[@]}" -Map="$bench/$lane-$width.map" -o "$bench/$lane-$width"
        "$bench/$lane-$width" >"$r/cpu-$lane-$width.warm"
        test "$(grep -Fxc 'seven direct entries; eight recording cases passed' "$r/cpu-$lane-$width.warm")" = "$width"
    done
    for pass in 1 2 3; do
        lanes=(c tower); if [[ $pass == 2 ]]; then lanes=(tower c); fi
        for lane in "${lanes[@]}"; do
            tag=$r/cpu-$lane-$width-$pass
            TOWER_CASE_BENCH=1 "$f/measure" "$bench/$lane-$width" 3>"$tag.time" >"$tag.log"
            test "$(grep -Fxc 'seven direct entries; eight recording cases passed' "$tag.log")" = "$width"
        done
    done
done
