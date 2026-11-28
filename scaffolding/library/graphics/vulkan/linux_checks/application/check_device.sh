#!/usr/bin/env bash
# Reuse host 12's verified release and observation tools. A new output directory
# keeps the frozen executable, raw SDK capture and legacy checkout read-only.
set -euo pipefail
if (( $# < 3 || $# > 4 )); then
    echo "usage: $0 IMPORTS.tower RETIREMENT_PACKET.tar.gz NEW_OUTPUT_DIR [SHARED_TYPES.tower]" >&2
    exit 2
fi
module=$(realpath -e "$1")
archive=$(realpath -e "$2")
types=()
if (( $# == 4 )); then types=("$(realpath -e "$4")"); fi
here=$(cd "$(dirname "$0")" && pwd)
export SRC=$(realpath "$here/../../../../../..")
mkdir "$3"; export WORK=$(realpath "$3")
R=$WORK/retirement
P=$WORK/fifteen
mkdir "$R" "$P"
echo "4399ea3d12fe29c573fcdc6d3f41cbb35e5f08c0d53b258f7c125d2a85e89cf0  $archive" | sha256sum -c
tar xzf "$archive" -C "$R"
(cd "$R" && sha256sum --quiet -c SHA256SUMS)
tar xzf "$R"/inputs/b8b88*.tar.gz -C "$P"
(cd "$P" && sha256sum --quiet -c SHA256SUMS)
source "$P/environment.sh"
for header in image_format_preflight create_image bound_image_view image_allocation_plan image_memory; do
    cmp "$v/$header.h" "$P/release/$header.h"
done
cmp "$v/image_retirement.h" "$R/release/image_retirement.h"
export GRAPHICS_SO=$R/release/libtower_graphics.so
bash "$here/check_cpu.sh" "$module" "$w/cpu" "${types[@]}"
cpu=$w/cpu
release=$cpu/release
export LD_LIBRARY_PATH="$release:$f:$l"
life=$R/release/verify_lifetime
o=$b/owner
mkdir "$o"
tar xzf "$f/owner-scaffolding.tar.gz" -C "$o"
checks=$o/$v/osd_upload_checks
cp "$P/failure_release.tower" "$checks/"
for unit in verify_image_format failure_release; do
    bootstrap/linux-x64/towerc --library --jobs 1 --foundation "$o/scaffolding/foundation.tower" \
        "$checks/$unit.tower" --emit llvm -o "$b/$unit.ll"
    opt-19 '-passes=internalize,globaldce,default<O2>' -internalize-public-api-list=main "$b/$unit.ll" -o "$b/$unit.bc"
    llc-19 -filetype=obj -relocation-model=pic "$b/$unit.bc" -o "$b/$unit.o"
    "${ld[@]}" "$b/$unit.o" "$f/runtime.o" "$l/libc.so.6" "$l/crtn.o" -o "$b/$unit"
done
gzip -dc "$f/raw.bin.gz" >"$w/reference"
echo "140d8d6511a77daee97ebd377dfc34c9c90347cf084d0dd4516e5474315d143b  $w/reference" | sha256sum -c
gzip -dc "$R/gpu-linked-trace/guarded.bin.gz" | cmp - "$w/reference"
gzip -dc "$R/gpu-raw-trace/guarded.bin.gz" | cmp - "$w/reference"

for unit in plan_loader memory_loader; do "${cc[@]}" -c "$v/linux_checks/$unit.c" -o "$b/$unit.o"; done
"${cc[@]}" "${trace_defs[@]}" -c "$c/plan_gpu_trace.c" -o "$b/trace.o"
# Observe the retained owner's private sdk_view call. The new application's
# public view relocation goes straight to the release DSO.
llvm-objcopy-19 --redefine-sym __wrap_tower_vk_create_bound_image_view_v1=__wrap_sdk_view \
    --redefine-sym __real_tower_vk_create_bound_image_view_v1=__real_sdk_view "$f/view_owner_probe.o" "$b/view_probe.o"
link_device() {
    local destination=$1 image=$2 memory=$3; shift 3
    "${ld[@]}" "${observe[@]}" --export-dynamic-symbol=fixture_record --wrap=fixture_record \
        --wrap=vkCreateImageView --wrap=sdk_view "$R/release/owner.o" "$image" "$memory" "$@" \
        "$b/plan_loader.o" "$b/memory_loader.o" "$b/trace.o" "$b/view_probe.o" "$f/external-c.o" \
        "$f/runtime.o" "$release/libtower_graphics.so" -L"$f" -llife -lviews "${end[@]}" \
        -Map="$destination.map" -o "$destination"
}
link_device "$b/application" "$cpu/image_client.o" "$cpu/memory_client.o"
llvm-readelf-19 --dyn-syms -W "$b/application" > "$r/application.elf"
awk '$7=="UND" {print $8}' "$r/application.elf" | grep -Fx -f "$cpu/seven" | sort >"$r/direct"
diff -u "$cpu/seven" "$r/direct"
"$P/release/sdk-client" > "$r/sdk-client.log"
cmp "$r/sdk-client.log" "$R/compat/release-sdk-client.log"

run_device() {
    local exe=$1 name=$2 pass=$3 d=$r/$2-$3 want=0 rc=0
    local opts=() launch=()
    mkdir "$d"
    case $pass in
        trace)
            opts=(LD_DEBUG=bindings LD_DEBUG_OUTPUT="$b/bind")
            launch=(strace -s 4096 -f -e trace=execve -o "$d/argv.log");;
        EMPTY_PLAN|FAIL_PLAN_ALLOC|FAIL_PLAN_BIND) opts=("OSD_$pass=1"); want=1;;
    esac
    # The archived retained workload takes no application arguments.
    "${launch[@]}" "$f/measure" /usr/bin/env "LD_PRELOAD=${san_preload:-}$probe" "${opts[@]}" "$exe" \
        3>"$d/time" 4>"$b/pixels" 5>"$d/owner" 6>"$d/driver" 7>"$d/events" \
        8>"$d/owner.views" 9>"$d/views" 10>"$d/images" 11>"$d/queries" >"$d/log" 2>&1 || rc=$?
    echo "$rc" >"$d/exit"
    if [[ $rc != "$want" ]]; then tail -30 "$d/log" >&2; return 1; fi
    if [[ $want == 0 ]]; then
        source "$R/check_capture.sh"
        for pattern in '^requirements ' '^plan .*bool=1 ' '^allocate .*result=0 .*accounted=0$' '^bind .*offset=0 .*result=0 accounted=[1-9]'; do
            test "$(grep -cE "$pattern" "$d/log")" = 5
        done
        if [[ $pass == trace ]]; then
            grep -F "execve(\"$exe\", [\"$exe\"]" "$d/argv.log"
            rg --no-filename "binding file $exe .* to $release/libtower_graphics.so .*symbol .tower_vk_" "$b"/bind.* > "$d/bindings"
            rg --no-filename "binding file .* to .*libvulkan.so.1 .*symbol .vk" "$b"/bind.* > "$d/loader.bindings"
            for op in GetPhysicalDeviceImageFormatProperties CreateImage GetImageMemoryRequirements AllocateMemory BindImageMemory CreateImageView DestroyImageView DestroyImage FreeMemory; do
                grep -Eq "symbol .vk${op}'" "$d/loader.bindings"
            done
            rm -- "$b"/bind.*
            sed -nE "s/.*symbol .(tower_vk_[a-z0-9_]+)'.*/\1/p" "$d/bindings" | grep -Fx -f "$cpu/seven" | sort -u >"$d/seven"
            diff -u "$cpu/seven" "$d/seven"
            gzip -nc "$b/pixels" > "$d/guarded.bin.gz"
        fi
    else
        grep -Fx validation_warnings_errors=0 "$d/log"
        test ! -s "$b/pixels" && test ! -s "$d/views" && test ! -s "$d/driver" || return 1
        local device memory=0
        device=$(sed -nE 's/^source device=(0x[0-9a-f]+) .*/\1/p' "$d/log")
        case $pass in
        EMPTY_PLAN) grep -Ex 'plan .*bool=0' "$d/log";;
        FAIL_PLAN_ALLOC) grep -Ex 'allocate .*injected=1 result=-2 memory=\(nil\) accounted=0' "$d/log";;
        FAIL_PLAN_BIND)
            grep -Ex 'bind .*offset=0 injected=1 result=-2 accounted=25165824' "$d/log"
            memory=$(sed -nE 's/^allocate .*memory=(0x[0-9a-f]+) .*/\1/p' "$d/log");;
        esac
        "$b/failure_release" "$device" "$memory" <"$d/events" 10<"$d/images" >"$d/cleanup"
    fi
}
for pass in trace 1 2 3 EMPTY_PLAN FAIL_PLAN_ALLOC FAIL_PLAN_BIND; do
    lanes=(c tower); if [[ $pass == 2 ]]; then lanes=(tower c); fi
    for lane in "${lanes[@]}"; do
        exe=$R/release/gpu-linked
        if [[ $lane == tower ]]; then exe=$b/application; fi
        run_device "$exe" "$lane" "$pass"
    done
done
(cd "$v" && sha256sum -c "$P/results/oracle.sha256")
mkdir -p "$w/ev"
export P
bash "$R/oracle.sh"
for arg in x 4294967296; do
    rc=0; "$b/oracle/clear" "$arg" > "$r/argv-$arg.log" 2>&1 || rc=$?
    echo "$rc" > "$r/argv-$arg.exit"; test "$rc" = 2
done
grep -Fx 'Expected decimal physical device index' "$r/argv-x.log"
grep -Fx 'Physical device index overflow' "$r/argv-4294967296.log"
source "$here/compare_cpu.sh"
source "$here/sanitize.sh"
