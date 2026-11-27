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
