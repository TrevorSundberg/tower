# Run both Vulkan imports in the Win64 counted fixture

The application runs a compute, vertex and fragment shader from the repository
and records two indexed indirect count passes. Its Win64 entry reads the actual
process arguments, calls the fixture and returns its exit code through the CRT.
The build uses the ordinary Linux-hosted Tower compiler for source, target
selection and the Windows runtime. `--linker lld-link` selects LLVM 19 LLD to
write the final PE. [Application entry](application.tower)

From the root of the review checkout on x86-64 Linux, install the packaged
compiler's LLVM 19 dependencies, including Clang, LLD and llvm-dlltool, plus
MinGW-w64 x64. To reproduce the pinned SPIR-V, put glslangValidator 12.0.0
and spirv-val 2023.1 on PATH. The checked Debian packages were
`glslang-tools=12.0.0-2` and `spirv-tools=2023.1-2`. With glslang 15.2.0,
the compute and vertex hashes differ and the build stops at the checksum check.
Set the three absolute SDK paths
below for your installation. The host 11 packet includes the checked x64
Vulkan loader import library and its Khronos definition. [Windows SDK paths](../../../graphics_dll_windows.md#build-and-run-the-external-c-consumer)

```bash
set -euo pipefail
root=$PWD
v=$root/scaffolding/library/graphics/vulkan
export PATH=/usr/lib/llvm-19/bin:$PATH
export MINGW_SYSROOT=/usr/x86_64-w64-mingw32
export MINGW_GCC_LIB=/usr/lib/gcc/x86_64-w64-mingw32/12-posix
export VULKAN_IMPORT_LIB="$VULKAN_SDK/Lib/vulkan-1.lib"
# Obtain the original Win64 entry and bounded file loader if needed.
git fetch origin refs/heads/rendering/vulkan-windows-counted-ea6ce027
out=$(mktemp -d)/win64
"$v/osd_checks/tower_client/counted_win64/build.sh" "$out"
cd "$out"
VK_LOADER_DEBUG=layer VK_LOADER_LAYERS_ENABLE=VK_LAYER_KHRONOS_validation \
VK_LAYER_ENABLES=VK_VALIDATION_FEATURE_ENABLE_SYNCHRONIZATION_VALIDATION_EXT \
wine64 ./counted.exe counted-core13 produce.comp.spv triangle.vert.spv color.frag.spv --external-layer
```

Select the host ICD and layer search paths for your installation. The host
loader must report insertion of the Khronos device layer for the external-layer
run. The guest installs a debug messenger. On a guest with its own Khronos
validation layer and validation-features extension, omit `--external-layer` to
request them explicitly. That mode exited 1 with `VK_ERROR_LAYER_NOT_PRESENT`
on host 11. The Quadro run used Wine 8.0 and host validation.

Expected exit 0 includes a signaled fence, zero warning/error callbacks, counts
0 and 1 and identical 20-byte records with fields (3, 1, 0, 0, 0). All four
RGBA8 pixels in the first capture are `112233ff`. All four in the second are
`4080bfff`. The row gaps and outer guards retain `a5`. Compare all 112 bytes.
The accepted hash is `a49420a8cae9cf5185a8d8dc1d18556dce6b332ec223f9e22aa00eabef7436e6`.

The build copies only the application's import closure into a new directory.
The Win64 entry, file loader, capture and recording modules come from the same
fixture revision, `ea6ce027`. Stage the SDK's current `readback_clear`,
`readback_completion` and `readback_device` together under that same
`source/library/graphics/vulkan` root. The pinned capture uses device loss,
flush and abort declarations from `readback_device`. Its submit and wait
continue to come from the pinned capture source. The archive work in
assignment f22cca24 needs this same file selection and staged Foundation.
The accepted ordinary PE SHA-256 is
`ee5e16f4fc747421e72a6f2c25308de142bfc7f0386d85df79db8156cb72e2b3`.

Each shader passes
the file length and digest checks before the local adapter calls the shipped
`shader_client`. Its result must indicate both dispatch and Vulkan success.
The pipeline owner retains its original deferred destruction loop. Inside each
rendering scope the other adapter calls the shipped `counted_client` with the
device-selected PFN. Compile the provider from the original checkout. The two
application-local adapter files share names with private fixture dependencies.
[Build script](build.sh)

## Public source-to-COFF and SDK link

The built-in PE linker accepts both graphics imports in an MSVC-target
executable probe. For the whole application it rejects the GNU target profile.
With the MSVC triple and short imports for the loader and CRT, the remaining
diagnostic on the untouched MinGW atomic library is
`Link failed: unsupported COFF/PE profile: fadd_4_.o`. This member implements
the validation callback's atomic increment. The tested ordinary driver recipe
above uses LLD and the distributed GNU libraries.

For a conventional MinGW CRT entry, continue with the same source tree and
verified release. The packaged Tower compiler emits a library object exporting
the fixture's real `main(argc, argv)`. LLVM's GNU-flavor `ld.lld` performs this
final link. The host 11 packet also ran this PE and compared every output byte.

```bash
cc=$root/bootstrap/linux-x64/towerc
app=$out/source/library/graphics/vulkan
w=$MINGW_SYSROOT/lib
g=$MINGW_GCC_LIB
"$cc" "$app/counted_fixture.tower" --library --jobs 1 --emit object \
    --target x86_64-w64-windows-gnu --foundation "$out/source/foundation.tower" \
    --depfile caller.d -o caller.obj
api=tower_allocate,tower_deallocate,tower_strict_float_binary,tower_strict_float_from_integer,tower_trap
opt -passes=internalize,globaldce -internalize-public-api-list="$api" \
    "$root/bootstrap/linux-x64/share/tower/runtime-windows-x64.ll" -o winrt.bc
llc -filetype=obj -relocation-model=pic winrt.bc -o winrt.o
ld.lld -m i386pep --no-insert-timestamp --subsystem console --Map=caller.map \
    -o caller.exe "$w/crt2.o" caller.obj release/tower_graphics.lib winrt.o \
    "$VULKAN_IMPORT_LIB" -L"$w" -L"$g" -lmingw32 -lgcc -lmingwex -lmsvcrt \
    -lkernel32 "$g/libatomic.a"
llvm-readobj --coff-imports caller.exe
```

Both PEs import shader creation and counted recording from the same
`tower_graphics.dll` at hints 2 and 3. The application imports shader destruction
from `vulkan-1.dll`. The SDK DLL imports shader creation from that loader.
[Host 11 device evidence](../../../../../../../docs/temporal-opcode-research-journal.md#combined-win64-counted-fixture-on-host-11)
