#!/usr/bin/env bash
# Native Linux x86-64. The loader is the SDK/host libvulkan.so.1 for this target.
set -euo pipefail
if (( $# != 2 )); then
    echo "usage: $0 OUTPUT_DIRECTORY /absolute/path/to/libvulkan.so.1" >&2
    exit 2
fi
loader=$2
if [[ $loader != /* || ! -f $loader ]]; then
    echo "expected an absolute path to the Vulkan loader, got '$loader'" >&2
    exit 2
fi
v=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$v/../../../.." && pwd)
mkdir -p "$1"
out=$(cd "$1" && pwd)
tmp=$(mktemp -d "$out/.graphics.XXXXXXXX")
trap 'rm -rf -- "$tmp"' EXIT
(cd "$root/bootstrap/linux-x64" && sha256sum --check --quiet SHA256SUMS)
cd "$tmp"
objects=()
# command_finish emits the public end and submit entries via its imports.
for unit in shader_module_c command_begin command_finish indexed_draw_c buffer_upload_record \
            osd_texture_upload_record tight_color_regions bound_image_view create_image image_format_preflight \
            image_allocation_plan image_memory image_retirement; do
    "$root/bootstrap/linux-x64/towerc" "$v/$unit.tower" --library --jobs 1 \
        --foundation "$root/scaffolding/foundation.tower" -o "$unit.o"
    objects+=("$unit.o")
done
x86_64-linux-gnu-ld -shared --hash-style=both -z defs -z noexecstack \
    -soname libtower_graphics.so "${objects[@]}" "$loader" -o libtower_graphics.so
mv libtower_graphics.so "$out/"
