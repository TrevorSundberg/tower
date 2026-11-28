# Run five Vulkan SDK imports in the Win64 counted fixture

The application runs a compute, vertex and fragment shader from the repository
and records two indexed indirect count passes. Its Win64 entry reads the actual
process arguments, calls the fixture and returns its exit code through the CRT.
The build uses the ordinary Linux-hosted Tower compiler for source, target
selection and the Windows runtime. `--linker lld-link` selects LLVM 19 LLD to
write the final PE. [Application entry](application.tower)

From the root of the exported SDK source tree on x86-64 Linux, install the packaged
compiler's LLVM 19.1.7 tools, including Clang, LLD, opt, llc, llvm-readobj and llvm-dlltool, plus
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

Both executables import the fixture directly from the exported tree. The
fixture reads exactly the pinned shader length, rejects trailing bytes and
checks the digest before calling the selected shader operation. The raw
fixture selects the direct Vulkan functions. The SDK entry selects
`shader_client` and `counted_client`, which use the same handle types as the
renderer. The pipeline owner releases its modules after pipeline creation.
The recorder uses the procedure resolved on the live device. [Build script](build.sh)

Win64 supplies the shared `CountedCalls` table with those two SDK operations
and three typed functions from `command_submission.tower`. The owner lends
its command slot and submit descriptor to the DLL. It keeps the submitted
queue, fence and resources live through completion or recovery. The Linux
SDK entry continues to supply its five imported operations to the same
capture and recording code.

## Public source-to-COFF and SDK link

The earlier MSVC-target probe linked the shader and counted-draw imports
with the built-in PE linker. For the whole application it rejects the GNU target profile.
With the MSVC triple and short imports for the loader and CRT, the remaining
diagnostic on the untouched MinGW atomic library is
`Link failed: unsupported COFF/PE profile: fadd_4_.o`. This member implements
the validation callback's atomic increment. The tested ordinary driver recipe
above uses LLD and the distributed GNU libraries.

`build.sh` also emits `caller.exe`. For that PE, Tower compiles
`sdk_fixture.tower` with `--library --emit object` and LLVM GNU-flavor
`ld.lld` links the MinGW CRT entry to its exported `main(argc, argv)`.
Use the same Wine command above with `caller.exe`. Inspect `counted.d`
for the ordinary executable dependencies, `caller.d` for the Tower object
inputs and `caller.map` for the CRT link.

Both PEs import queue submit, shader creation, counted recording, command
begin and end-for-submit from the same `tower_graphics.dll` at hints 1–5. The
application imports shader destruction from `vulkan-1.dll`. The SDK DLL
imports shader creation, command reset/begin/end and queue submission from
that loader.
[Host 11 device evidence](../../../../../../../docs/temporal-opcode-research-journal.md#win64-counted-command-callbacks-on-slot-11)

## Reproduce the two-import control

Export the current SDK tree twice. Build the five-import application from the
first export. In the second, replace the single `command_submission` import in
`sdk_fixture.tower` with the three imports below and build in a fresh output
directory. This links the command functions into the control PE. Both
applications use the same primary command acquisition code, five-field callback
table, DLL, import library and three shader binaries.

```tower
import library.graphics.vulkan.command_begin;
import library.graphics.vulkan.command_end;
import library.graphics.vulkan.frame_submit;
```

The [primary command review](../../../../../../../docs/temporal-opcode-research-journal.md#sdk-review-of-command-pool-and-primary-acquisition)
records the four cross-linked PE hashes. For the earlier buffer ownership
comparison, export `9c61c1c3` for two imports and `a2d79120` for five.
The [buffer ownership review](../../../../../../../docs/temporal-opcode-research-journal.md#sdk-review-of-vulkan-buffer-acquisition-and-retirement)
identifies those binaries.
Host 11 rebuilt the same five-import callers from `a4369920` and both
`9c61c1c3` controls, checked the guarded captures and traced each buffer
from acquisition through retirement on the Quadro RTX 6000.
[Win64 buffer device results](../../../../../../../docs/temporal-opcode-research-journal.md#win64-counted-buffer-acquisition-and-retirement-on-slot-11)

For the shared staging visibility comparison, export `53c0d291` for two
imports and `49a7e06f` for five. Host 11 reproduced the four PE hashes,
ran both pairs on the Quadro RTX 6000 and matched all 112 guarded bytes.
The journal records command rejections, signed queue recovery paths, staging
flags, rejected mapping and sanitizer results for these revisions.
[Host 11 qualification on shared staging](../../../../../../../docs/temporal-opcode-research-journal.md#host-11-qualification-of-the-five-win64-imports-on-shared-staging)

The earlier hardware comparison on `b1db999a` and `e81e4c25` used the
previous staging map implementation. The control at
`c74de3f0840248a679c4b8d4efa5244566392b67` uses `counted_completion.tower`.
[Earlier command comparison](../../../../../../../docs/temporal-opcode-research-journal.md#win64-counted-caller-on-the-shared-completion-sdk)
