#!/usr/bin/env bash
set -euo pipefail
source "$D/e/env.sh"
O=$D/results
I=$D/p13/control/inputs
old=$D/p15/dll/memory/linked-regular
export VK_LOADER_DEBUG=layer VK_LOADER_LAYERS_ENABLE=VK_LAYER_KHRONOS_validation VK_LAYER_ENABLES=VK_VALIDATION_FEATURE_ENABLE_SYNCHRONIZATION_VALIDATION_EXT
WINEDEBUG=-all timeout -k 2 45 wine64 cmd /c ver >"$O/prefix.log" 2>"$O/prefix.err"
run() {
    local rc=0 expected=$1 tag=$2; shift 2
    timeout -k 2 45 wine64 "$@" >"$tag.out" 2>"$tag.err" || rc=$?
    echo "$rc" >"$tag.exit"
    if (( rc != expected )); then tail -30 "$tag.err" "$tag.out" >&2; return 1; fi
}
cd "$O/old-lookup"; WINEDEBUG=-all run 16 lookup lookup.exe
rg 'Win32 error 127' lookup.out
cd "$O/new-lookup"; WINEDEBUG=-all run 0 lookup lookup.exe
cd "$O/wrong-order"; WINEDLLOVERRIDES=vulkan-1=n WINEDEBUG=-all run 4 negative program.exe
for arm in sdk object dll ubsan; do
    for path in published owner; do
        cd "$O/$arm/$path"
        WINEDLLOVERRIDES=vulkan-1=n WINEDEBUG=+loaddll run 0 mask program.exe
        rg -m1 'Loaded .*vulkan-1.dll.*native' mask.err
        if [[ $arm == dll || $arm == ubsan ]]; then rg -m1 'Loaded .*tower_graphics.dll.*native' mask.err; fi
        cmp mask.out "$O/sdk/$path/mask.out"
        if [[ $path == owner ]]; then
            for mask in {0..7}; do echo "mask=$mask seen=$mask owner_bytes=64 live=128 count=2 passes=2"; done | diff -u - <(tr -d '\r' <mask.out)
        else test ! -s mask.out; fi
    done
done
cd "$O/compat/record"
WINEDLLOVERRIDES=vulkan-1=n WINEDEBUG=+loaddll run 0 earlier program.exe linked wide
cmp earlier.out "$old/record/wide.out"
rg -m1 'Loaded .*tower_graphics.dll.*native' earlier.err
capture() {
    local tag=$1
    echo '5b950be5050057096468fe29f087c5a3a5186d8de1910b174f5ba233ba44c811  image.raw' | sha256sum -c -
    test "$(wc -c <image.raw)" = 27542768
    gzip -dc "$I/linked-capture.gz" | cmp - image.raw
    sha256sum image.raw >"$tag.sha256"
    "$I/verify_capture" image.raw >"$tag.samples"
    tr -d '\r' <"$tag.out" >"$tag.txt"
    for field in 'Quadro RTX 6000' 'discrete GPU (hardware)' 615.71.10 device_uuid=26f60f6cead65faf0253a959b2e93a2d \
        api_version=4211039 physical_device_index=0 graphics_queue_family=0 queue_index=0 validation_warnings_errors=0; do
        rg -Fx "$field" "$tag.txt"
    done
    sed -nE 's/^memory allocate case=([0-9]+) .*result=0 index=([0-9]+) bytes=([0-9]+) .* live=\3 count=1$/\1 \2 \3/p' "$tag.txt" | diff -u "$old/device/expected.alloc" -
    sed -nE 's/^memory bind case=([0-9]+) .*result=0 offset=0 live=([0-9]+) count=1$/\1 \2/p' "$tag.txt" | diff -u <(cut -d' ' -f1,3 "$old/device/expected.alloc") -
    rg -m1 'Inserted device layer "VK_LAYER_KHRONOS_validation"' "$tag.err"
    sed -nE 's/^memory retired case=([0-9]+).* live=0 peak=25165824 count=0$/\1/p' "$tag.txt" | diff -u <(seq 0 4) -
}
for arm in frozen-sdk frozen-linked compat sdk object dll ubsan observed; do
    cd "$O/$arm/device"
    overrides=""
    if [[ $arm == observed ]]; then overrides=vulkan-1=n; fi
    WINEDLLOVERRIDES=$overrides OSD_CAPTURE=image.raw WINEDEBUG=+loaddll,+vulkan run 0 device program.exe
    capture device
    rg -m1 'Loaded .*tower_graphics.dll.*native' device.err
    if [[ $arm == observed ]]; then rg -m1 'Loaded .*observed.*vulkan-1.dll.*native' device.err; fi
    rg 'thunk64_vk(CreateImage|GetImageMemoryRequirements|AllocateMemory|BindImageMemory|CreateImageView|QueueSubmit|QueueWaitIdle|DestroyImageView|DestroyImage|FreeMemory) ' device.err | sed -E 's/^.*thunk64_vk//' >calls
    sed -nE 's/^osd_view device=([[:xdigit:]]+) image=([[:xdigit:]]+) view=([[:xdigit:]]+).*$/view \1 \2 \3/p' device.txt >handles
    "$D/p15/dll/e/bin/image_lifetime" calls handles >lifetime.out
    if [[ $arm == observed ]]; then
        # Both retained finish call sites return VK_SUCCESS before the source triple.
        awk '/^finish /{if($4!="result=0")exit 1; n++}
             /^dll_view /{if(n!=2)exit 1; n=0; images++} END{if(n || images!=5)exit 1}' device.txt
        # First view per source is the sampled view. Match the PE callbacks
        # with the successful source binding, never with the readback target.
        awk '/^memory bind /{split($4,i,"=");split($5,m,"=");bound=1}
             /^osd_view / && bound {split($2,d,"=");split($3,im,"=");split($4,v,"=");
               if(im[2]!=i[2]) exit 1;
               print "dll_view",d[2],v[2],"0000000000000000";
               print "dll_image",d[2],i[2],"0000000000000000";
               print "dll_memory",d[2],m[2],"0000000000000000"; bound=0}' device.txt >expected
        test "$(wc -l <expected)" = 15
        rg '^dll_' device.txt | diff -u expected -
    fi
done
# One process, one device and one queue. All timed samples use the same Wine
# server, validation configuration, outputs and bounded timeout.
for i in 0 1 2 3; do
    order=(sdk dll)
    if (( i % 2 )); then order=(dll sdk); fi
    for arm in "${order[@]}"; do
        for path in owner device; do
            cd "$O/$arm/$path"
            tag=timed-$i
            override=; if [[ $path == owner ]]; then override=vulkan-1=n; fi
            OSD_CAPTURE=image.raw WINEDLLOVERRIDES=$override WINEDEBUG=-all "$SDK/usr/bin/time" -f '%e %U %S %M %x' -o "$tag.time" \
                timeout -k 2 45 wine64 program.exe >"$tag.out" 2>"$tag.err"
            if [[ $path == device ]]; then capture "$tag"; else cmp "$tag.out" mask.out; fi
        done
    done
done
