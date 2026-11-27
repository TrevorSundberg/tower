#!/usr/bin/env bash
# Run the standalone and release callers against the same sealed planner oracle.
set -euo pipefail
if (( $# != 1 )); then echo "usage: $0 EMPTY_OUTPUT_DIRECTORY" >&2; exit 2; fi
here=$(cd "$(dirname "$0")" && pwd)
v=$(cd "$here/../.." && pwd)
root=$(cd "$v/../../../.." && pwd)
PREPARED_SDK=$(realpath -e "${PREPARED_SDK:?LLVM19, MinGW x64, Vulkan SDK and Wine 8}")
export PREPARED_SDK
: "${ORDINAL13_PACKET:?sealed 84bd5154 archive}" "${TOWER_READER:?authorized reader for Tower pins}"
out=$(realpath -m "$1")
mkdir "$out"
export TMPDIR=$out/runs
mkdir "$TMPDIR" "$out/standalone"
export PATH=$PREPARED_SDK/usr/lib/llvm-19/bin:$PATH LD_LIBRARY_PATH=$PREPARED_SDK/usr/lib/x86_64-linux-gnu
unset PROVIDER_OBJ PROVIDER_DLL PROVIDER_LIB
export PROVIDER_HEADER=$v/image_memory.h CHECK_RELEASE_SOURCE=1
(cd "$root/bootstrap/linux-x64" && sha256sum --quiet --check SHA256SUMS)
cd "$out/standalone"
"$root/bootstrap/linux-x64/towerc" --foundation "$root/scaffolding/foundation.tower" --library --jobs 1 \
    "$v/image_memory.tower" --target x86_64-w64-windows-gnu -o image_memory.obj
echo '288c5360fd28fe3701ec32ca9b163f6bbab88618901a104531070478c55c6aed  image_memory.obj' | sha256sum --check
echo "aa3a711505a5c81f33e58fa8f0c0ec837802deaf7630e58fb758db33cbff6ce0  $PROVIDER_HEADER" | sha256sum --check
llvm-objdump -dr image_memory.obj >provider.asm
PROVIDER_OBJ=$PWD/image_memory.obj bash "$here/replay.sh" | tee "$out/object.log"
bash -x "$v/build_graphics_dll.sh" "$out/release" >"$out/release-build.log" 2>&1
cd "$out/release"
cmp image_memory.obj "$out/standalone/image_memory.obj"
llvm-readobj --coff-imports tower_graphics.dll >loader.imports
for call in vkGetImageMemoryRequirements vkAllocateMemory vkBindImageMemory; do
    awk -v call="$call" '$1=="Name:"{dll=$2} dll=="vulkan-1.dll" && $1=="Symbol:" && $2==call{ok=1} END{exit !ok}' loader.imports
done
for symbol in tower_vk_allocate_memory_v1 tower_vk_bind_image_memory_zero_v1; do
    rg " $symbol .* image_memory.obj$" tower_graphics.map
done
llvm-readobj --coff-exports tower_graphics.dll >dll.exports
awk '$1=="Ordinal:"{ord=$2} $1=="Name:"{print ord,$2}' dll.exports >ordinals
object_run=$(sed -n 's/^results //p' "$out/object.log")
(cat "$object_run/prior/evidence/clean/exports"; printf '14 tower_vk_allocate_memory_v1\n15 tower_vk_bind_image_memory_zero_v1\n') | diff -u - <(awk '$1 <= 15' ordinals)
sha256sum tower_graphics.dll tower_graphics.lib image_memory.obj >release.sha256
PROVIDER_DLL=$PWD/tower_graphics.dll PROVIDER_LIB=$PWD/tower_graphics.lib bash "$here/replay.sh" | tee "$out/dll.log"
export D
D=$(sed -n 's/^results //p' "$out/dll.log")
export P=$D/prior/control
cmp "$object_run/memory/fixture.obj" "$D/memory/fixture.obj"
for path in record device; do
    cmp "$object_run/memory/sdk-regular/$path/program.exe" "$D/memory/sdk-regular/$path/program.exe"
done
# Rebuild the ordinal-13 SDK oracle too, retaining its forbidden-call sentinels.
(
    source "$D/e/env.sh"
    source "$E/package-env.sh"
    bash "$E/session.sh" "$here/../check_allocation.sh" "$D/planner" --release "$out/release"
    cmp "$D/planner/external.rows" "$P/sealed/sdk.rows"
    for name in vkAllocateMemory vkBindImageMemory; do
        rg -x "$name" "$D/planner/loader.def"
        if rg "^$name=" "$D/planner/loader.def"; then echo "Planner sentinel forwarded: $name" >&2; exit 1; fi
    done
) >"$out/planner.log" 2>&1
bash "$here/native_threads.sh" >"$out/native-threads.log" 2>&1
