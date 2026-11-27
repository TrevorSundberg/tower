# Win64 OSD initial-upload control

Host 11's packet for job `6cd74574-f678-4bbe-9de0-701de63065af` contains
the replay recipe, its checksummed inputs, build commands, ordinary seven-entry
DLL and import library, recording-only loader, real Wine PE, validation and
instrumentation logs, and the exact guarded GPU result. Slot 12 owns the
production recorder. The SDK C control in raw.c has test-only linkage.

Use the packet and sibling Git bundle with a Tower reader that can fetch the
published seven-entry history. On a Linux x64 worker with the package versions
and NVIDIA ICD from platform.txt and packages.txt, set PACKET, BUNDLE,
PREPARED_SDK and D to absolute paths. D is a fresh directory.

```bash
set -euo pipefail
(cd "$PACKET" && sha256sum --quiet -c SHA256SUMS)
mkdir -p "$D/src"
git -C "$D/src" init -q -b main
git -C "$D/src" fetch --depth=3 https://github.com/TrevorSundberg/tower \
    refs/heads/rendering/windows-vulkan-upload-1512cb96:refs/tags/public-seven
git -C "$D/src" bundle verify "$BUNDLE"
git -C "$D/src" fetch "$BUNDLE" HEAD
git -C "$D/src" merge --ff-only FETCH_HEAD
D="$D" PREPARED_SDK="$PREPARED_SDK" bash "$PACKET/replay.sh"
gzip -dc "$PACKET/guarded-raw.gz" | sha256sum
```

The four replay phases build, run Wine tests in a private prefix/display,
audit linkage/retirement, and run the supported sanitizers. Keep the fixture
import paths and bootstrap resources from the recipe together. The build
uses the prior reviewed upload fixture's device, buffer and command helpers.
The suffixes .log, .err, .exit and .time identify stdout, stderr, process
exit and wall/user/system seconds plus peak RSS KiB and exit status.

The upload recorder enters and returns with the same primary recording.
A separate owner finishes, releases staging, records fragment sampling
and transfer readback, finishes again and releases both views/images.
The copy region array is caller-owned throughout each recording. The
separate recording test observes all public fields at the Vulkan ABI.
Four-by-four samples per subresource exercise the 2D and array views
and both bitmap mips. The raw hardware control's expected output is
27,542,768 bytes with SHA-256
`5b950be5050057096468fe29f087c5a3a5186d8de1910b174f5ba233ba44c811`.
For each texture in order the stream contains 16 a5 bytes, every encoded
texel, 16 a5 bytes, the linear RGBA8 sample atlas, and 16 a5 bytes.
The complete observed/expected shape table, measurements and remaining
obligations are in the [project journal](../../../../../docs/temporal-opcode-research-journal.md#win64-raw-control-for-initial-osd-texture-uploads).

## Independent capture verification and sampling fault controls

`verify_capture.tower` reads the retired transfer bytes and reconstructs
each expected atlas pixel from the corresponding mip, row, column and
layer. Its sRGB channels use the piecewise transfer function and native
libm. Alpha passes through and an R8 sample expands to (R,0,0,255). The
verifier checks all three guards for each texture and requires end of file
after the fifth. Use the raw receipt to verify every transfer byte against
the generated input.

The job's sibling `-sampling` packet includes a three-case shader fault
control, the original raw recorder object, and capture-verifier build and
test recipes. Run its replay script with PACKET set to the extracted raw
packet, D to a new absolute directory containing the candidate in src,
and PREPARED_SDK to the same SDK path as the raw replay.

```bash
D="$D" PACKET="$PACKET" PREPARED_SDK="$PREPARED_SDK" bash "$SUPPLEMENT/replay.sh"
gzip -dc "$PACKET/guarded-raw.gz" > "$D/b/guarded.raw"
"$D/e/bin/verify_capture" "$D/b/guarded.raw"
```

## SDK control for creating a bound view

Draw acknowledged `draw-tower-bound-image-view/v1` at Tower
`0c38f209d80679279ad4696953513e90387536bc`. The page and prototype are in
`scaffolding/library/graphics/vulkan/bound_image_view_v1.md` on that ref.
The Win64 release used for this control is `3b739bb6` with nine exports.

Compile `view_sdk.c` as a separate object for the raw SDK reference.
Compile `view_client.c` for the external DLL path. It includes the published
`bound_image_view.h` and checks its function pointer type at compile time.
Both objects supply the same test entry.

The recording PE links `view_cases.c` with one of these objects. Its local
test loader exports `vkCreateImageView` and the PFN registration in
`view_driver.c`. The hardware PE links the same selected object with
`view_gpu.c` and the ordinal-nine capture fixture. Redirect only its
`gpu.obj` references to `vkCreateImageView` and `vkDestroyImageView`. The
adapter leaves the readback target on its original SDK path, retains five
additional subresource views through completion, and logs returned handles
for comparison with the Wine retirement trace. Sampling uses the original
five full views. Build, execution and replay commands are in the packet for
`01f5b8d5-c2f6-4a88-b80c-a248fd127cea`.

The numeric result and output guard checks exercise the published valid-input
contract. The recording driver deliberately returns an error after writing
the private slot. The two bitmap probes separately create a 2D-array view of
mip 1 on an image with exactly one actual layer. The full-range array probe also holds the same bitmap, format and range as
its sampled 2D view. The font probe starts at
layer 2. See the [Win64 release measurements](../../../../../docs/temporal-opcode-research-journal.md#win64-ordinal-10-for-an-already-bound-osd-image).

## SDK control for Draw image creation

Tower contract `a6ddd459` pins Draw `852d5de3`. Compile `image_sdk.c`
for the independent Vulkan SDK reference and `image_client.c` for the
external C caller. Define `OSD_IMAGE_PROVIDER_HEADER` to the quoted path
of the reviewed provider header on delivery and compare that caller object
with the frozen one.

The slot 11 recipe redirects the frozen fixture object's `vkCreateImage`
relocation to `image_gpu.c`. Only the five source images enter the selected
arm. The readback atlas keeps the original SDK call. The same fixture owns
format checks, memory allocation/binding, submission and destruction. The
view, region and upload calls use DLL ordinals 10, 9 and 8.

The recording PE checks descriptor identity, object representation, queue
families, chained format list and its format array. Each call starts with
a separate private null slot. A clobber followed by either signed error
must leave the public output null and the guards intact. The fault loader
also exercises the full PE through its first image creation.

In packet `68f080cc-b791-465e-89cf-77c50607a0fb`, run `bash replay.sh`
with a fresh absolute `D`, `TOWER_READER` and `PREPARED_SDK`. The packet
provides the exact build, loader selection, device, trace and sanitizer
commands. The link-only import description allows freezing the external PE
before provider delivery. [Device and timing results](../../../../../docs/temporal-opcode-research-journal.md#win64-sdk-control-for-draw-image-creation)

## Win64 image-format preflight control

The reviewed contract at Tower `7e2683c248404957a7e6caaced23f74ba95e839a`
pins the two Draw constructors at `b15f6edd305d2234362f3ca863656f2a7487e21e`.
The SDK control calls the physical-device query before inspecting any shape
limit. Its caller enters the existing ordinal-11 create path only on a
successful query with sufficient capacity. It retains the independent
optimal-tiling feature check. The RGBA8 readback targets use their original
SDK path. The physical device and descriptor are borrowed for each source.

### Run the 28-case C recording check from source

From the repository root on Linux x64 with LLVM 19 (Clang, LLD and
llvm-readobj), the MinGW-w64 x64 CRT and libgcc, Vulkan SDK headers and a
working 64-bit Wine prefix, run the following. These example paths are
for a system-installed Debian toolchain. Set `WINE64` to the Wine
executable if it has a different name or path.

```bash
export PATH="/usr/lib/llvm-19/bin:/usr/lib/wine:$PATH"
export MINGW_SYSROOT=/usr/x86_64-w64-mingw32
export MINGW_GCC_LIB="$(dirname "$(x86_64-w64-mingw32-gcc -print-libgcc-file-name)")"
export VULKAN_INCLUDE=/usr/include
check=scaffolding/library/graphics/vulkan/osd_checks/check_preflight.sh
"$check" "$(mktemp -d)/sdk"
```

The command verifies the pinned Linux bootstrap, compiles
`preflight_cases.tower` to Win64 COFF, builds the SDK control and C
observer, and links the recording driver as a local `vulkan-1.dll`.
Wine loads that DLL for this process. Its registration export and the
physical-device query share the same thread-local observer. Expect exit
0 and 28 rows, each with one query and intact canaries. The output directory
retains the PE import/export tables, maps, Wine load logs, stdout and exit
status. This check runs without a GPU.

To compare an external C implementation, pass one source file defining
`tower_vk_image_format_preflight_v1` with the confirmed C signature. Put
any local headers alongside that file. Use a fresh output directory.

```bash
"$check" "$(mktemp -d)/compare" /absolute/path/to/provider.c
```

This also builds `preflight_client.c` against the import library generated
for the test's `preflight_provider.dll`. The check verifies the external
PE imports the provider entry and the observer registration, and that the
provider DLL imports the physical-device query from the recording loader.
Both arms use the same matrix, observer and driver. The command compares
their complete stdout byte for byte, including row order, signed results,
all 64 resource-size bits and both error-output canaries.

### Replay the archived device qualification

The slot 11 packet `2b729d40-a8cc-4f8e-881c-f67d3f77f538` carries the
full capture, PE images, checksums and Git bundle. From the extracted
packet on the prepared Linux NVIDIA host, run

```bash
TOWER_CHECKOUT=/path/to/tower PREPARED_SDK=/path/to/sdk \
  D="$(mktemp -d)/run" bash replay.sh
```

The checkout must contain the release base `a639a49e`. The replay first runs
the two frozen executables with its eleven-entry DLL. It then builds and
runs the recording and hardware SDK controls. Expect 28 checked recording
rows, five supported source queries, ten completed submissions and a
27,542,768-byte stream. Each zero-width application probe exits 3 before
create. The PE under `products/contract/device.exe` imports
`tower_vk_image_format_preflight_v1` by name with hint 12. Its recording
companion is `products/contract/cases.exe`. The matching import description
is a link fixture. Both PEs await a released provider. When that arrives,
compile `preflight_client.c` with `OSD_PREFLIGHT_PROVIDER_HEADER` set to its
quoted header, link with the release import library and repeat both device
outcomes, the recording rows, complete captures and timing pairs. See the
[device and ABI results](../../../../../docs/temporal-opcode-research-journal.md#win64-sdk-control-for-image-format-preflight).

### Reviewed Win64 SDK and external caller results

Draw's contract at `b15f6edd305d2234362f3ca863656f2a7487e21e`
distinguishes a failed format query from a successful query whose limits
cannot accommodate the image. In the SDK control at Tower
`cc43665c708e23ccb52da7181ff6cb2f15ad62ea`, the same zero-width request
exercised both paths. The real Vulkan query succeeded and returned the
limits. An injected driver wrote its temporary output and returned −11.
Both callers stopped after one source query, before creation, allocation
or submission, with fixture exit 3. The 28 recording cases also checked
positive and negative nonzero status, all five inclusive unsigned limits,
sample-mask intersection, and preservation of both outputs on error.
[Confirmed C contract](https://github.com/TrevorSundberg/tower/blob/7e2683c248404957a7e6caaced23f74ba95e839a/scaffolding/library/graphics/vulkan/image_format_preflight_v1.md)

For the five accepted source textures, Wine 8 selected a Quadro RTX 6000,
Vulkan 1.4.351, NVIDIA 615.71.10. The SDK query returned maximum extent
32768×32768×1, 16 mip levels, 2048 layers, sample mask 15 and
`maxResourceSize` 1099511627776. This last field is returned to the
caller. The support predicate uses the extent, level, layer and sample
limits. From the replay's prepared executable directory, the device
invocation was `OSD_CAPTURE=sdk.raw WINEDEBUG=+vulkan,+loaddll wine64 ./gpu-sdk.exe`,
exit 0. Rendering compared all 27,542,768 captured bytes to the retained
independent SDK control. SHA-256 was
`5b950be5050057096468fe29f087c5a3a5186d8de1910b174f5ba233ba44c811`.
The capture verifier checked 256 sampled texels and 240 guard bytes. All
ten submits completed before teardown. The explicit guest validation
layer returned −6. Physical Windows remains untested.

| Executable | Preflight path | SHA-256 |
| --- | --- | --- |
| SDK device control executed on the Quadro | SDK query followed by Tower ordinal-11 image creation | `0a57174f4fdc67ba2cf039d3e1ca9ac2d06141ee881ff9937f6349649af92a81` |
| Prospective external device caller | Link fixture with the proposed preflight import, hint 12 | `f391ba3776188cb243bcf5fb56485518022bf352274e3eec6167b34586083268` |
| Prospective recording caller | Link fixture with only the preflight import from Tower | `382fe35e7d73b8e9c78805c9e4f189fbec2f25a6d31fa49b40badf2bbda9c8f9` |

Rendering decoded the PE import tables and confirmed the released DLL's
eleven exports. Linking the external caller against that release stopped
at the unresolved `tower_vk_image_format_preflight_v1`. Running the two
prospective callers requires a DLL exporting that entry.

### Draw Linux replay of the SDK control

At Draw `2f38b19c8218fef304993df5708a7458fa16776b`, Draw independently
rebuilt the SDK recording suite from Tower `8c55c0bc` on Linux x64
with the pinned Tower case driver. All 28 cases issued one query each.
The guards remained intact and the signed results +5, −11 and
−1000001004 matched. The executable exited 0. Its stdout SHA-256 was
`c5a4f4aee3da06792977fb78b71737a219de63c12190f22114bd7ad231d7ca3e`.
Rendering reproduced that digest from the retained Win64 SDK output
with CRLF converted to LF. The check exercises the independent SDK
control. Portable provider acceptance requires a separate linked run.
