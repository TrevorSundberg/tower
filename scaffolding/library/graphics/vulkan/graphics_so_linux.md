# Building and calling the Vulkan graphics library

From the root of one Tower checkout on x86-64 Linux, use the packaged
Linux x64 Tower compiler and its LLVM 19.1 shared library. The ELF recipe
uses GNU x86-64 binutils. The COFF recipe uses LLVM 19's `llvm-dlltool`
and `lld-link` (on Debian, add `/usr/lib/llvm-19/bin` to PATH).

```bash
set -euo pipefail
root=$PWD
v=$root/scaffolding/library/graphics/vulkan
out=$(mktemp -d)
loader=/usr/lib/x86_64-linux-gnu/libvulkan.so.1
"$v/build_graphics_so.sh" "$out/linux" "$loader"
"$v/build_graphics_dll.sh" "$out/win64"
```

The 13 Tower units supply the same sixteen public names on both targets.
The ELF SONAME is `libtower_graphics.so`, with a single needed library,
`libvulkan.so.1`. The PE imports the driver entry points from `vulkan-1.dll`.
Place `tower_graphics.dll` beside the Windows executable. The existing
[Windows build](graphics_dll_windows.md) also supports the SDK C consumer.

## Build and run an ordinary Tower application on Linux

The [clear application](osd_checks/tower_client/clear_app.tower) uses the
public image and queue-submit declarations, the existing image owner, and
the rendering fixture's clear, device-selection and row-copy helpers.
It clears a 2×2 RGBA8 image, submits once, waits on the fence, reads two
pitched rows and retires the image. It needs a Vulkan 1.3 graphics device
with dynamic rendering and the Khronos validation layer.

Run in Bash from the SDK checkout on Linux x64. Install Clang/LLVM 19,
GNU binutils, glibc development startup objects, libatomic and the Vulkan
loader. For an extracted sysroot set `TOWER_SDK_ROOT` and make its tools,
shared libraries, validation layer and ICD discoverable. Set `VULKAN_SO` to
select a different loader path for the same target.

```bash
set -euo pipefail
root=$PWD
v=$root/scaffolding/library/graphics/vulkan
app=$(mktemp -d)
sdk=${TOWER_SDK_ROOT:-/}
lib=${sdk%/}/usr/lib/x86_64-linux-gnu
loader=${VULKAN_SO:-$lib/libvulkan.so.1}
"$v/build_graphics_so.sh" "$app/lib" "$loader"
cp "$v"/osd_checks/tower_client/{clear_app,image_owner}.tower "$app/"
cd "$app"
tc=$root/bootstrap/linux-x64/towerc
flags=(--target x86_64-linux-gnu --jobs 1 --foundation "$root/scaffolding/foundation.tower")
"$tc" clear_app.tower "${flags[@]}" --emit exe --sysroot "$sdk" \
    --link "$app/lib/libtower_graphics.so" --link "$loader" --link "$lib/libatomic.so.1" \
    --depfile clear.d -o clear
LD_LIBRARY_PATH="$app/lib:$(dirname "$loader"):$lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}" ./clear
```

The absolute Foundation path selects the SDK declaration modules. The
application calls the Vulkan loader for device setup, recording and readback.
Its validation callback uses libatomic. The executable records the libraries'
SONAMEs, so their directories must also be discoverable at run time. A passing
run exits 0, prints the selected device, `fence signaled` and
`validation_warnings_errors=0`, then prints the actual 32 bytes
`a5a5a5a5112233ff112233ffa5a5a5a5112233ff112233ffa5a5a5a5a5a5a5a5`.

**Existing applications with an exported main.** The bundled Linux runtime
supplies `main` and invokes the ordinary Tower top-level statements. Feeding
the original `image_smoke.tower` to `--emit exe` produces
`Link failed: duplicate ELF symbol: main`. To keep that fixture's entry,
continue in the same external application directory. Its object has no
unresolved Tower runtime imports.

```bash
cp "$v"/osd_checks/tower_client/{sampled_image,image_smoke}.tower .
"$tc" image_smoke.tower "${flags[@]}" --library --emit object --depfile image_smoke.o.d -o image_smoke.o
"$tc" --link-executable image_smoke.o --target x86_64-linux-gnu --jobs 1 --sysroot "$sdk" \
    --link "$app/lib/libtower_graphics.so" --link "$loader" -o image_smoke
LD_LIBRARY_PATH="$app/lib:$(dirname "$loader"):$lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}" ./image_smoke
```

`towerc` runs on each invocation. A build tool such as Ninja can consume
`clear.d` on the executable rule. It lists the source closure, the three
explicit library paths and the selected `runtime-host-linux-x64.ll`.
An object-only depfile lists the source closure. For the split build,
attach the depfile to the object rule and declare each object and library
on the executable rule. The pinned `--link-executable` rejects `--depfile`.
[Linux byte linker](../../../../docs/tower-linkers.md#cli-and-build-boundaries)

## Build the application outside Tower

Keep the application's source imports as shipped. Its `import image_owner;`
resolves in the application directory. The absolute Foundation path resolves
`import library.graphics.vulkan.image_lifecycle;` and its types in this
checkout. Copy the example sources to a fresh application directory outside
the tree. The first two compilations build the client alone. The next two
build the executable entry with those same client modules.

For command buffers and queues, import `library.graphics.vulkan.command_submission`
in the same application. Both library builds above also provide the four
[command entries and their caller examples](osd_checks/tower_client/README.md#calling-the-frame-and-upload-commands).
For staged buffers and packed textures, import `library.graphics.vulkan.upload`.
Its [three upload entries](osd_checks/tower_client/README.md#staged-buffers-and-packed-osd-uploads)
use the same command and image handles as the other two modules.
For externally compiled SPIR-V, import `library.graphics.vulkan.shader_module_creation`.
The [shader caller](osd_checks/tower_client/README.md#creating-a-shader-module-through-the-sdk)
checks whether the driver was called and the signed Vulkan result before taking ownership.

```bash
app=$(mktemp -d "$(dirname "$root")/image_app.XXXXXXXX")
example=$v/osd_checks/tower_client
cp "$example"/{sampled_image,image_owner,image_smoke}.tower "$app/"
cd "$app"
compile=("$root/bootstrap/linux-x64/towerc" --library --jobs 1
         --foundation "$root/scaffolding/foundation.tower")
for module in sampled_image image_smoke; do
    "${compile[@]}" "$module.tower" --target x86_64-linux-gnu \
        --depfile "$module.elf.d" -o "$module.o"
    "${compile[@]}" "$module.tower" --target x86_64-w64-windows-gnu \
        --depfile "$module.coff.d" -o "$module.obj"
done

cc image_smoke.o -L"$out/linux" -ltower_graphics "$loader" \
    -Wl,-rpath,'$ORIGIN' -o "$out/linux/image_smoke"
```

For the Windows executable, set `MINGW_SYSROOT`, `MINGW_GCC_LIB` and
`VULKAN_IMPORT_LIB` to the [Windows SDK paths](graphics_dll_windows.md#build-and-run-the-external-c-consumer).
The application links the SDK loader for its own device-management calls.

```bash
clang --target=x86_64-w64-windows-gnu --sysroot="$MINGW_SYSROOT" \
    -fuse-ld=lld -L"$MINGW_GCC_LIB" -Wl,--no-insert-timestamp \
    image_smoke.obj "$out/win64/tower_graphics.lib" "$VULKAN_IMPORT_LIB" \
    -o "$out/win64/image_smoke.exe"
llvm-readobj --coff-exports "$out/win64/tower_graphics.dll"
llvm-readobj --coff-imports "$out/win64/image_smoke.exe"
```

## Run the Linux CPU lifecycle check

Continue in the same application directory. The shipped recording suite
checks the typed and legacy owners across ten scenarios each. The test
executable exports its nine observation functions under the Vulkan SDK
names. The seven public image calls still resolve to the production DSO.
This check needs the loader library and can run without an ICD or a GPU.

```bash
cp "$example"/{recording,legacy_owner}.tower .
"${compile[@]}" recording.tower --target x86_64-linux-gnu --depfile recording.d -o recording.o
llvm-objcopy --redefine-syms="$example/recording_symbols.txt" recording.o driver.o
cc driver.o -L"$out/linux" -ltower_graphics -Wl,-rpath,'$ORIGIN' \
    -Wl,--export-dynamic-symbol='vk*' -o "$out/linux/recording"
"$out/linux/recording"
```

The suite checks signed failures, success-only publication, allocation
accounting at bind, and view/image/memory release followed by a second
retirement. For call origins, run `LD_DEBUG=bindings "$out/linux/recording"`
and inspect the `tower_vk_` and driver bindings. The [typed client
contract](osd_checks/tower_client/README.md) describes each call and the
expected standalone object digests.

## Run the Linux device smoke

On a host with a Vulkan ICD and a usable device, run the executable built
above. It selects physical device zero, opens queue family zero, creates
a 2×2 RGBA8 sampled image, checks the image, memory, view and allocation
charge, then retires the unused image and checks the cleared owner.

```bash
"$out/linux/image_smoke"
```

A successful run prints `Created, bound and retired one 2x2 RGBA8 image and view`.

## Release fingerprints

With the packaged compiler, GNU ld 2.40, Vulkan loader 1.3.239 and LLVM
19.1.7, `sha256sum "$out/linux/libtower_graphics.so" "$out/win64"/tower_graphics.{dll,lib}`
gives these SHA-256 values in order.

| Library | SHA-256 |
| --- | --- |
| Linux shared object | `2d924e642e1820a8651015802bf56c332215178db373709ee80a5f5d91be76bf` |
| Windows DLL | `8fc64f24fd5491d129494dc6645be46680b87067e2288ac45f3614f242096ed7` |
| Windows import library | `2d56f882882f90a67ae8a063899841b0968dc6d35476967eaf1fa53b5d0d945c` |
