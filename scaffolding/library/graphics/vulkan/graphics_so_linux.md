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

## Build the application outside Tower

Keep the application's source imports as shipped. Its `import image_owner;`
resolves in the application directory. The absolute Foundation path resolves
`import library.graphics.vulkan.image_lifecycle;` and its types in this
checkout. Copy the example sources to a fresh application directory outside
the tree. The first two compilations build the client alone. The next two
build the executable entry with those same client modules.

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
