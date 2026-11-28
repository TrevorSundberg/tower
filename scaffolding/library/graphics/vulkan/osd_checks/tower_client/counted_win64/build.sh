#!/usr/bin/env bash
# Linux x64 host, GNU Win64 target. Give each invocation a new output directory.
set -euo pipefail
[[ $# == 1 ]] || { echo "usage: $0 NEW_OUTPUT_DIRECTORY" >&2; exit 2; }
: "${MINGW_SYSROOT:?absolute target sysroot}" "${MINGW_GCC_LIB:?absolute target directory containing libatomic.a and libgcc.a}"
: "${VULKAN_IMPORT_LIB:?absolute path to the x64 Vulkan loader import library}"
here=$(cd "$(dirname "$0")" && pwd)
v=$(cd "$here/../../.." && pwd)
root=$(cd "$v/../../../.." && pwd)
mkdir -- "$1"
out=$(cd "$1" && pwd)
cd "$out"
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
LINK=/timestamp:0 "$root/bootstrap/linux-x64/towerc" "$here/application.tower" \
    --foundation "$root/scaffolding/foundation.tower" --jobs 1 --emit exe --target x86_64-w64-windows-gnu \
    --sysroot "$MINGW_SYSROOT" --linker lld-link --link "$out/release/tower_graphics.lib" \
    --link "$VULKAN_IMPORT_LIB" --link "$out/atexit.lib" --link "$MINGW_SYSROOT/lib/libmsvcrt.a" \
    --link "$MINGW_SYSROOT/lib/libkernel32.a" --link "$MINGW_GCC_LIB/libgcc.a" \
    --link "$MINGW_GCC_LIB/libatomic.a" --depfile "$out/counted.d" -o "$out/counted.exe"
llvm-readobj --coff-imports counted.exe

# Conventional CRT startup calls the same SDK fixture with the process argv.
"$root/bootstrap/linux-x64/towerc" "$here/sdk_fixture.tower" --library --jobs 1 --emit object \
    --target x86_64-w64-windows-gnu --foundation "$root/scaffolding/foundation.tower" \
    --depfile caller.d -o caller.obj
api=tower_allocate,tower_deallocate,tower_strict_float_binary,tower_strict_float_from_integer,tower_trap
opt -passes=internalize,globaldce -internalize-public-api-list="$api" \
    "$root/bootstrap/linux-x64/share/tower/runtime-windows-x64.ll" -o winrt.bc
llc -filetype=obj -relocation-model=pic winrt.bc -o winrt.o
ld.lld -m i386pep --no-insert-timestamp --subsystem console --Map=caller.map \
    -o caller.exe "$MINGW_SYSROOT/lib/crt2.o" caller.obj release/tower_graphics.lib \
    winrt.o "$VULKAN_IMPORT_LIB" -L"$MINGW_SYSROOT/lib" -L"$MINGW_GCC_LIB" \
    -lmingw32 -lgcc -lmingwex -lmsvcrt -lkernel32 "$MINGW_GCC_LIB/libatomic.a"
llvm-readobj --coff-imports caller.exe
