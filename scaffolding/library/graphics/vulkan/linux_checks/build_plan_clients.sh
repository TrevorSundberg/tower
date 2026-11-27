#!/usr/bin/env bash
# Build three Linux comparisons with the same retained fixture and SDK call sites.
set -euo pipefail
if (( $# != 6 )); then
    echo "usage: $0 NEW_BUILD_DIR FIXTURE_GIT_READER TWELVE_PACKET STANDALONE_OBJECT TWELVE_LIB_DIR THIRTEEN_LIB_DIR" >&2
    exit 2
fi
mkdir "$1"
b=$(realpath "$1"); reader=$(realpath "$2"); previous=$(realpath "$3")
plan=$(realpath "$4"); twelve=$(realpath "$5"); thirteen=$(realpath "$6")
c=$(cd "$(dirname "$0")" && pwd); v=$(dirname "$c")
root=$(cd "$v/../../../.." && pwd); fixture=scaffolding/library/graphics/vulkan
f=$previous/fixture; l=${TOWER_SDK_ROOT:?}/usr/lib/x86_64-linux-gnu
cd "$b"
mkdir sdk owner
# The extracted host-12 SDK borrows the system glibc. Resolve its startup files.
ln -s "$l/libc.so.6" sdk/libc.so
ln -s /lib64/ld-linux-x86-64.so.2 sdk/ld-linux-x86-64.so.2
cc=(clang-19 --sysroot="$TOWER_SDK_ROOT" -std=c11 -Wall -Wextra -Werror -O2 -fPIC)
link=("${cc[@]}" --ld-path="$(command -v x86_64-linux-gnu-ld)" --rtlib=compiler-rt --unwindlib=none
      -L"$b/sdk" -Wl,-rpath-link,"$b/sdk" -Wl,-z,noexecstack)
tower=("$root/bootstrap/linux-x64/towerc" --library --jobs 1)
src=b68b1835c9c24171222eab85a695a77835c23e54
git -C "$reader" archive "$src" scaffolding | tar -xC owner
(cd owner && git apply --no-index "$v/osd_checks/linux_plan_fixture.patch")
cp "$v/osd_checks/plan_gpu.tower" "owner/$fixture/osd_upload_checks/"
"${tower[@]}" --foundation "$b/owner/scaffolding/foundation.tower" \
    "$b/owner/$fixture/osd_upload_checks/device.tower" --emit llvm -o device.ll
opt-19 '-passes=internalize,globaldce,default<O2>' -internalize-public-api-list=main -S device.ll -o device.opt.ll
llc-19 -filetype=obj -relocation-model=pic device.opt.ll -o device.o
# Keep the production imports in the C SDK translation units.
llvm-objcopy-19 --redefine-sym tower_vk_image_format_preflight_v1=sdk_preflight \
    --redefine-sym tower_vk_create_image_v1=sdk_create \
    --redefine-sym tower_vk_create_bound_image_view_v1=sdk_view device.o owner.o
"${tower[@]}" --foundation "$root/scaffolding/foundation.tower" "$v/osd_checks/plan_cases.tower" -o cases.o
"${cc[@]}" -ftls-model=initial-exec -c "$v/osd_checks/plan_driver.c" -o recorder.o
"${cc[@]}" -c "$v/osd_checks/plan_client.c" -o external.o
"${cc[@]}" -DOSD_RAW_SDK -c "$v/osd_checks/plan_client.c" -o raw.o
"${cc[@]}" -c "$c/plan_device_client.c" -o sdk.o
"${cc[@]}" -c "$c/plan_loader.c" -o loader.o
"${cc[@]}" -D__wrap_vkGetImageMemoryRequirements=vkGetImageMemoryRequirements \
    -D__real_vkGetImageMemoryRequirements=plan_loader_requirements -c "$v/osd_checks/plan_gpu_trace.c" -o trace.o
for lane in raw standalone combined; do
    dir=$twelve; client=(external.o)
    case $lane in
        raw) client=(raw.o);;
        standalone) client+=("$plan");;
        combined) dir=$thirteen;;
    esac
    "${link[@]}" -Wl,--export-dynamic-symbol=vkGetImageMemoryRequirements cases.o recorder.o "${client[@]}" \
        -L"$dir" -ltower_graphics -Wl,-rpath-link,"$l" -Wl,-Map,"cpu-$lane.map" -o "cpu-$lane"
    "${link[@]}" -Wl,--export-dynamic-symbol=vkGetImageMemoryRequirements,--export-dynamic-symbol=fixture_record \
        -Wl,--wrap=fixture_record,--wrap=vkCreateImageView,--wrap=tower_vk_create_bound_image_view_v1 \
        -Wl,--wrap=vkAllocateMemory,--wrap=vkBindImageMemory \
        owner.o sdk.o trace.o loader.o "${client[@]}" "$f/view_owner_probe.o" "$f/external-c.o" "$f/runtime.o" \
        -L"$dir" -ltower_graphics -L"$f" -llife -lviews "$l/libvulkan.so.1" "$l/libatomic.so.1" \
        -Wl,-Map,"gpu-$lane.map" -o "gpu-$lane"
done
