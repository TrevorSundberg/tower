#!/usr/bin/env bash
# Link a local application against the sixteen-entry Linux DSO. The recording
# driver is linked only into the CPU executable. Leave the ELF and logs in OUT.
set -euo pipefail
if (( $# < 2 || $# > 3 )); then
    echo "usage: $0 IMPORTS.tower NEW_OUTPUT_DIR [SHARED_TYPES.tower]" >&2
    exit 2
fi
module=$(realpath -e "$1")
types=$(realpath -e "${3:-$1}")
mkdir "$2"
out=$(realpath "$2")
here=$(cd "$(dirname "$0")" && pwd)
v=$(realpath "$here/../..")
root=$(realpath "$v/../../../..")
sysroot=${TOWER_SDK_ROOT:-/}
lib=$sysroot/usr/lib/x86_64-linux-gnu
release=$out/release
mkdir "$release" "$out/source"
if [[ -n ${GRAPHICS_SO:-} ]]; then
    cp "$GRAPHICS_SO" "$release/libtower_graphics.so"
else
    bash "$v/build_graphics_so.sh" "$release" "$lib/libvulkan.so.1"
fi
cd "$out"
echo "2d924e642e1820a8651015802bf56c332215178db373709ee80a5f5d91be76bf  release/libtower_graphics.so" | sha256sum -c
export LD_LIBRARY_PATH="$release:$lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
cc=(clang-19 --sysroot="$sysroot" -O2 -Wall -Wextra -Werror -std=c11)
tower=("$root/bootstrap/linux-x64/towerc" --library --jobs 1 --foundation "$root/scaffolding/foundation.tower")
# Compile the selected module alone to audit even unused transitive imports.
"${tower[@]}" "$module" --depfile module.d -o imports.o
cut -d: -f2- module.d | xargs -n1 realpath -e > sources.list
while IFS= read -r dep; do
    if grep -En '(^|[[:space:]])extern[[:space:]]+fn[[:space:]]+vk[A-Z]|^[[:space:]]*(export[[:space:]]+)?fn[[:space:]]+tower_vk_' "$dep"; then
        echo "driver declaration or packaged implementation in import graph: $dep" >&2; exit 1
    fi
done <sources.list
if (( $# == 2 )); then
    mapfile -t definitions < <(while IFS= read -r path; do
        if grep -Eq '^[[:space:]]*struct[[:space:]]+VkImageHandle[[:space:]]*\{' "$path"; then echo "$path"; fi
    done <sources.list)
    if (( ${#definitions[@]} != 1 )); then
        echo "supply the shared types path as the third argument" >&2; exit 2
    fi
    types=${definitions[0]}
fi
sha256sum "$module" "$types" > module.sha256
for file in "$here"/*.tower; do
    while IFS= read -r line; do
        case "$line" in
        'import application_imports;')
            printf 'import "%s";\n' "$module"
            if [[ $types != "$module" ]]; then printf 'import "%s";\n' "$types"; fi;;
        'import legacy_abi;') printf 'import "%s/readback_abi.tower";\n' "$v";;
        *) printf '%s\n' "$line";;
        esac
    done <"$file" >"source/$(basename "$file")"
done
negative() {
    local name=$1 expected=$2 rc=0
    "${tower[@]}" "source/$name.tower" -o "$name.o" >"$name.log" 2>&1 || rc=$?
    echo "$rc" >"$name.exit"
    if [[ $rc == 0 ]] || ! grep -F -- "$expected" "$name.log"; then
        cat "$name.log" >&2; echo "missing expected rejection for $name" >&2; exit 1
    fi
}
negative legacy_conflict "Incompatible declarations of foreign symbol 'vkDestroyImage'"
negative swapped_image 'Expected VkImageHandle*, got VkDeviceMemoryHandle*'
negative wrong_output 'Expected VkImageHandle**, got VkDeviceMemoryHandle**'
negative wrong_descriptor 'Expected VkImageCreateInfo*, got AppImageInfo*'

for unit in combined image_client memory_client cpu recording_driver; do
    "${tower[@]}" "source/$unit.tower" --emit llvm -o "$unit.ll"
    opt-19 '-passes=default<O2>' "$unit.ll" -o "$unit.bc"
    llc-19 -filetype=obj -relocation-model=pic "$unit.bc" -o "$unit.o"
done
cat > seven <<'NAMES'
tower_vk_allocate_memory_v1
tower_vk_bind_image_memory_zero_v1
tower_vk_create_bound_image_view_v1
tower_vk_create_image_v1
tower_vk_destroy_retired_image_v1
tower_vk_image_format_preflight_v1
tower_vk_plan_image_allocation_v1
NAMES
llvm-nm-19 -ju combined.o | sort > combined.undefined
diff -u seven combined.undefined
{ llvm-nm-19 -ju image_client.o; llvm-nm-19 -ju memory_client.o; } | sort > separate.undefined
diff -u seven separate.undefined
"${cc[@]}" -c "$here/sdk_layout.c" -o sdk_layout.o
opt-19 -passes=internalize,globaldce -internalize-public-api-list=tower_trap \
    "$root/bootstrap/linux-x64/share/tower/runtime-host-linux-x64.ll" -o runtime.bc
llc-19 -filetype=obj -relocation-model=pic runtime.bc -o runtime.o
x86_64-linux-gnu-ld -pie --export-dynamic -z noexecstack -dynamic-linker /lib64/ld-linux-x86-64.so.2 \
    "$lib/Scrt1.o" "$lib/crti.o" cpu.o recording_driver.o sdk_layout.o runtime.o \
    "$release/libtower_graphics.so" "$lib/libvulkan.so.1" "$lib/libc.so.6" "$lib/crtn.o" -Map=cpu.map -o cpu
llvm-readelf-19 --dyn-syms -W cpu > cpu.elf
awk '$7=="UND" && $8 ~ /^tower_vk_/ {print $8}' cpu.elf | sort > cpu.undefined
diff -u seven cpu.undefined
TOWER_RECORD_CASES=1 LD_DEBUG=bindings LD_DEBUG_OUTPUT="$out/loader" "$out/cpu" 3>cases.bin > cpu.log
grep -F "binding file $out/cpu " loader.* | grep -F "to $release/libtower_graphics.so " > cpu.bindings
sed -nE "s/.*symbol .(tower_vk_[a-z0-9_]+)'.*/\1/p" cpu.bindings | sort -u > resolved
diff -u seven resolved
grep -F "binding file $release/libtower_graphics.so " loader.* | grep -F "to $out/cpu " > driver.bindings
for op in GetPhysicalDeviceImageFormatProperties CreateImage GetImageMemoryRequirements AllocateMemory BindImageMemory CreateImageView DestroyImageView DestroyImage FreeMemory; do
    grep -Eq "symbol .vk${op}'" driver.bindings
done
TOWER_OWNER_CANARY=1 "$out/cpu" > canary.log
cat cpu.log
od -v -An -tx8 cases.bin > cases.hex
