#!/usr/bin/env bash
# Linux x64 host, GNU Win64 target. Give each invocation a new output directory.
set -euo pipefail
[[ $# == 1 ]] || { echo "usage: $0 NEW_OUTPUT_DIRECTORY" >&2; exit 2; }
: "${MINGW_SYSROOT:?absolute target sysroot}" "${MINGW_GCC_LIB:?absolute target directory containing libatomic.a and libgcc.a}"
: "${VULKAN_IMPORT_LIB:?absolute path to the x64 Vulkan loader import library}"
here=$(cd "$(dirname "$0")" && pwd)
v=$(cd "$here/../../.." && pwd)
root=$(git -C "$v" rev-parse --show-toplevel)
fixture=ea6ce0274d2de4166d526e2460f56868581b6937
git -C "$root" cat-file -e "$fixture^{commit}" || {
    echo "Fetch the Win64 fixture refs/heads/rendering/vulkan-windows-counted-ea6ce027 into this checkout." >&2
    exit 1
}
mkdir -- "$1"
out=$(cd "$1" && pwd)
cd "$out"
src=$out/source
app=$src/library/graphics/vulkan
mkdir -p "$app"
# Keep one lexical owner for each nominal handle. Only the fixture's two
# local operation modules differ from the raw implementation.
cp "$root/scaffolding/"{bedrock,foundation,foundation_syntax,types,tower}.tower "$src/"
cp "$root/scaffolding/library/sha256.tower" "$src/library/"
cp "$v/../indexed_indirect.tower" "$src/library/graphics/"
cp "$v/"{counted_abi,counted_capture,counted_device,counted_record,counted_draw,readback_abi,readback_clear,readback_device,readback_oracle,readback_rows,readback_validation}.tower "$app/"
cp "$v/"{command_submission_types,image_driver_types,image_lifecycle_types,shader_module_creation,shader_module_types,upload_types}.tower "$app/"
cp "$here/../"{shader_client,counted_client}.tower "$here/"{indexed_draw,shader_module,application}.tower "$app/"
for unit in counted_fixture counted_pipeline; do
    git -C "$root" show "$fixture:scaffolding/library/graphics/vulkan/$unit.tower" >"$app/$unit.tower"
done

"$v/build_graphics_dll.sh" "$out/release"
cp release/tower_graphics.dll .
for shader in "$v"/counted_shaders/*; do
    spv=$(basename "$shader").spv
    glslangValidator -V --target-env vulkan1.1 "$shader" -o "$spv"
    spirv-val --target-env vulkan1.1 "$spv"
done
sha256sum -c "$here/inputs.sha256"
# MinGW's GCC main initialization references atexit. Its definition normally
# lives in crt2.o. The Tower executable runtime owns startup in this link.
printf 'LIBRARY msvcrt.dll\nEXPORTS\n atexit\n' >atexit.def
llvm-dlltool -m i386:x86-64 -d atexit.def -l atexit.lib
LINK=/timestamp:0 "$root/bootstrap/linux-x64/towerc" "$app/application.tower" \
    --foundation "$src/foundation.tower" --jobs 1 --emit exe --target x86_64-w64-windows-gnu \
    --sysroot "$MINGW_SYSROOT" --linker lld-link --link "$out/release/tower_graphics.lib" \
    --link "$VULKAN_IMPORT_LIB" --link "$out/atexit.lib" --link "$MINGW_SYSROOT/lib/libmsvcrt.a" \
    --link "$MINGW_SYSROOT/lib/libkernel32.a" --link "$MINGW_GCC_LIB/libgcc.a" \
    --link "$MINGW_GCC_LIB/libatomic.a" -o "$out/counted.exe"
llvm-readobj --coff-imports counted.exe
