#!/usr/bin/env bash
set -euo pipefail
source "$D/e/env.sh"
source "$E/package-env.sh"
O=$D/results
P=$D/p13/control
cd "$O"
set -x
cc=(clang --target=x86_64-w64-windows-gnu --sysroot="$MINGW_SYSROOT" -idirafter "$VULKAN_INCLUDE" -std=c11 -Wall -Werror)
link=("${cc[@]}" -fuse-ld=lld -L"$G" -Wl,--no-insert-timestamp)
mkdir -p {old,new}-lookup compat/{device,record} {frozen-sdk,frozen-linked}/device wrong-order
"${link[@]}" -O2 "$V/osd_checks/retirement/lookup.c" -o old-lookup/lookup.exe
cp old-lookup/lookup.exe new-lookup/
cp "$D/p15/release/tower_graphics.dll" old-lookup/
cp release/tower_graphics.dll new-lookup/
for path in device record; do
    cp "$D/p15/dll/memory/linked-regular/$path/program.exe" "compat/$path/"
    cp release/tower_graphics.dll "compat/$path/"
done
for arm in sdk linked; do
    cp "$D/p15/dll/memory/$arm-regular/device/"{program.exe,tower_graphics.dll} "frozen-$arm/device/"
done
cp "$D/p15/dll/memory/linked-regular/record/vulkan-1.dll" compat/record/
# SDK double with opposite order for image and view. All single-child cases still succeed.
sed '/if (view) vkDestroyImageView/{h;d;}; /if (image) vkDestroyImage/{p;g;}' "$V/osd_checks/retirement/sdk.c" >wrong-order/sdk.c
"${cc[@]}" -I"$V/osd_checks/retirement" -O2 -c wrong-order/sdk.c -o wrong-order/sdk.obj
"${link[@]}" owner.obj wrong-order/sdk.obj sdk/owner/program.def "$P/inputs/vulkan-1.lib" -o wrong-order/program.exe
cp sdk/owner/vulkan-1.dll wrong-order/
for san in address thread; do
    rc=0
    "${link[@]}" -fsanitize="$san" "$V/osd_checks/retired_image_client.c" owner.obj sdk/owner/program.def \
        release/tower_graphics.lib -o "probe-$san.exe" >"probe-$san.log" 2>&1 || rc=$?
    echo "$rc" >"probe-$san.exit"
    if (( rc != 0 )); then
        case $san in
            address) rg 'clang_rt.asan.*No such file' "probe-$san.log" ;;
            thread) rg 'unsupported option.*fsanitize=thread' "probe-$san.log" ;;
        esac
    else echo "Newly available sanitizer $san requires qualification" >&2; exit 1; fi
done
