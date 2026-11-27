#!/usr/bin/env bash
set -euo pipefail
source "$D/e/env.sh"
export VK_LOADER_DEBUG=layer VK_LOADER_LAYERS_ENABLE=VK_LAYER_KHRONOS_validation VK_LAYER_ENABLES=VK_VALIDATION_FEATURE_ENABLE_SYNCHRONIZATION_VALIDATION_EXT
out=$D/memory
# Initialize Wine before collecting the owner's stderr in a fresh prefix.
WINEDEBUG=-all timeout -k 2 45 wine64 cmd /c ver >"$E/prefix.out" 2>"$E/prefix.err"
I=$P/inputs
arms=(sdk)
if [[ -n ${PROVIDER_DLL:-} || -n ${PROVIDER_OBJ:-} ]]; then arms+=(linked); fi
check_device() {
    OSD_CAPTURE=image.raw WINEDEBUG=+vulkan,+loaddll timeout -k 2 45 wine64 program.exe >device.log 2>device.err
    gzip -dc "$I/linked-capture.gz" | cmp - image.raw
    "$I/verify_capture" image.raw >samples.log
    sha256sum image.raw >capture.sha256
    tr -d '\r' < device.log >device.txt
    for field in 'Quadro RTX 6000' 'discrete GPU (hardware)' '615.71.10' device_uuid=26f60f6cead65faf0253a959b2e93a2d validation_warnings_errors=0; do rg -Fx "$field" device.txt; done
    rg -m1 'Inserted device layer "VK_LAYER_KHRONOS_validation"' device.err
    rg -m1 'Loaded .*tower_graphics.dll.*native' device.err
    if [[ $arm == linked && -n ${PROVIDER_DLL:-} ]]; then rg -Fi "$(basename "$PROVIDER_DLL")" device.err | rg 'Loaded .*native' >provider-load.log; fi
    sed -nE 's/^source_image .* (type=.*) result=0 ticks=.*$/\1/p' device.txt | diff -u "$I/source-shapes.txt" -
    sed -nE 's/^shape=([0-9]+) size=([0-9]+).* index=([0-9]+) bindOffset=0$/\1 \3 \2/p' "$P/sealed/alloc-raw.checked" >expected.alloc
    sed -nE 's/^memory allocate case=([0-9]+) .*result=0 index=([0-9]+) bytes=([0-9]+) memory=[0-9a-f]+ live=\3 count=1$/\1 \2 \3/p' device.txt | diff -u expected.alloc -
    sed -nE 's/^memory bind case=([0-9]+) .* result=0 offset=0 live=([0-9]+) count=1$/\1 \2/p' device.txt | diff -u <(cut -d' ' -f1,3 expected.alloc) -
    sed -nE 's/^memory retired case=([0-9]+) .* live=0 peak=[0-9]+ count=0$/\1/p' device.txt | diff -u <(cut -d' ' -f1 expected.alloc) -
    rg 'thunk64_vk(CreateImage|GetImageMemoryRequirements|AllocateMemory|BindImageMemory|CreateImageView|QueueSubmit|QueueWaitIdle|DestroyImageView|DestroyImage|FreeMemory) ' device.err | sed -E 's/^.*thunk64_vk//' >calls
    sed -nE 's/^osd_view device=([[:xdigit:]]+) image=([[:xdigit:]]+) view=([[:xdigit:]]+).*$/view \1 \2 \3/p' device.txt >handles
    "$E/bin/image_lifetime" calls handles >retirement.log
}
for arm in "${arms[@]}"; do
    for flavor in regular ubsan; do
        cd "$out/$arm-$flavor/record"
        for c in small wide allocate-error clobber bind-error allocate-positive bind-other; do
            rc=0
            WINEDLLOVERRIDES='vulkan-1=n;winedbg.exe=d' WINEDEBUG=-all timeout -k 2 30 wine64 program.exe "$arm" "$c" > "$c.out" 2> "$c.err" || rc=$?
            echo "$rc" >"$c.exit"
            stage=allocate
            status=-2
            case $c in
              small|wide) expected=0 ;;
              allocate-error|clobber) expected=1 ;;
              bind-error) stage=bind; expected=1 ;;
              allocate-positive) expected=1; status=1 ;;
              bind-other) stage=bind; expected=1; status=-7 ;;
            esac
            [[ $rc == "$expected" ]] || { cat "$c.err" "$c.out" >&2; exit 1; }
            tr -d '\r' <"$c.err" >"$c.diagnostic"
            if [[ $expected == 0 ]]; then test ! -s "$c.diagnostic"
            else printf 'source image %s failed (%s)\n' "$stage" "$status" | diff -u - "$c.diagnostic"; fi
            tr -d '\r' <"$c.out" >"$c.row"
            rg -x "case=$c .* guards=ok" "$c.row"
            if [[ $arm == linked ]]; then
                # The extra private-slot guarantee is the only expected row difference.
                sed 's/slot=badc0ffe1357abcd/slot=0000000000000000/' "$out/sdk-$flavor/record/$c.row" | diff -u - "$c.row"
            fi
        done
        cd ../device
        check_device
        if [[ -d ../observed ]]; then
            cd ../observed
            WINEDLLOVERRIDES=vulkan-1=n check_device
            rg -m1 'Loaded .*observed.*vulkan-1.dll.*native' device.err
            sed -n 's/^trace //p' device.txt >allocation.trace
            "$E/bin/allocation_trace" planned allocation.trace >allocation.checked
            cmp allocation.checked "$P/sealed/alloc-raw.checked"
        fi
    done
done
if [[ -d "$out/linked-regular/observed" ]]; then
    # Execute the sealed release-13 PEs without relinking either caller.
    mkdir "$out/compat-record" "$out/compat-device"
    cp "$PRIOR/evidence/matrix/"{external.exe,vulkan-1.dll} "$out/compat-record/"
    cp "$PRIOR/evidence/clean/hardware.exe" "$out/compat-device/"
    for dir in "$out/compat-record" "$out/compat-device"; do cp "$PROVIDER_DLL" "$dir/"; done
    cd "$out/compat-record"
    WINEDLLOVERRIDES=vulkan-1=n WINEDEBUG=+loaddll timeout -k 2 30 wine64 external.exe >planner.rows 2>planner.err
    cmp planner.rows "$P/sealed/sdk.rows"
    rg -m1 'Loaded .*compat-record.*tower_graphics.dll.*native' planner.err
    cd "$out/compat-device"
    OSD_CAPTURE=image.raw WINEDEBUG=+loaddll timeout -k 2 45 wine64 hardware.exe >device.log 2>device.err
    rg -m1 'Loaded .*compat-device.*tower_graphics.dll.*native' device.err
    rg -m1 'Inserted device layer "VK_LAYER_KHRONOS_validation"' device.err
    tr -d '\r' <device.log | rg -x 'validation_warnings_errors=0'
    gzip -dc "$I/linked-capture.gz" | cmp - image.raw
    "$I/verify_capture" image.raw >samples.log
    sha256sum image.raw >capture.sha256
fi
# One fresh PE per sample on the same warm server. All outputs verified.
for i in 1 2 3; do
    order=(before "${arms[@]}")
    if [[ $i == 2 ]]; then
        order=(sdk before)
        if [[ ${#arms[@]} == 2 ]]; then order=(linked sdk before); fi
    fi
    for arm in "${order[@]}"; do
        cd "$E/bin"; program=hardware.exe
        if [[ $arm != before ]]; then cd "$out/$arm-regular/device"; program=program.exe; fi
        OSD_CAPTURE=timed.raw WINEDEBUG=-all "$SDK/usr/bin/time" -f '%e %U %S %M %x' \
            -o "$out/$arm-$i.time" timeout -k 2 45 wine64 "$program" > "$out/$arm-$i.log" 2> "$out/$arm-$i.err"
        gzip -dc "$I/linked-capture.gz" | cmp - timed.raw
        if [[ $arm != before ]]; then
            cd "$out/$arm-regular/record"
            WINEDLLOVERRIDES=vulkan-1=n WINEDEBUG=-all "$SDK/usr/bin/time" -f '%e %U %S %M %x' \
                -o "$out/$arm-record-$i.time" timeout -k 2 30 wine64 program.exe "$arm" wide \
                >"$out/$arm-record-$i.log" 2>"$out/$arm-record-$i.err"
            cmp "$out/$arm-record-$i.log" wide.out
            test ! -s "$out/$arm-record-$i.err"
        fi
    done
done
