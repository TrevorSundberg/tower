# Linux application import acceptance

From the Tower checkout, set `APP=scaffolding/library/graphics/vulkan/linux_checks/application`.
Supply the absolute path to the application declarations module. The CPU test
discovers the file defining `VkImageHandle` through the compiler's depfile.
An optional last argument specifies the shared types file explicitly.

```sh
bash "$APP/check_cpu.sh" "$IMPORTS" /tmp/new-application-cpu
bash "$APP/check_device.sh" "$IMPORTS" "$RETIREMENT_PACKET" /tmp/new-application-device
```

The CPU command uses the pinned Linux x64 bootstrap, Vulkan SDK headers and
loader, LLVM/Clang 19 and GNU ld. Set `TOWER_SDK_ROOT` and the tool/library
search paths for a non-system SDK. With `GRAPHICS_SO` set, the command copies
the supplied released library into the test directory. Otherwise it runs the
checked-in DSO build. Both paths require the release digest `2d924e64…`.
The CPU test inputs and SDK layout oracle live in this directory.

The private owner declares `vkDestroyImage(void*,void*,void*)`. Both Tower
client modules compile alongside it and also compile to separate device-link
objects. The C SDK oracle measures field sizes and offsets, alignment and
record sizes for both private and public descriptors. The old raw ABI import,
a swapped image/memory argument, a memory output passed as an image output,
and an implicit private descriptor conversion must each fail compilation.
The compiler depfile, undefined symbols, actual loader bindings, expected
diagnostics and the CPU recording are retained in the output directory.

CPU cases cover a healthy lifecycle, signed query failure, insufficient extent
after a successful query, failed image creation, no memory type, failed allocation,
failed bind and failed view creation. The driver clobbers its output handle
on failure. A second pass seeds the caller's private fields with a marker to
check success-only publication. Only the CPU executable links this driver.
`cases.bin` holds one native `CaseRecord` from cpu.tower per case, in order.
It includes the caller and driver descriptor/extension addresses, allocation
size, bytes charged at bind and the observed call sequence. Event digits 1–9
are query, create, plan requirements, allocate, bind, create view, destroy
view, destroy image and free memory.

The device command requires host 12's NVIDIA ICD, validation layer, toolchain
and the release archive from job e9a55c1c. The evidence packet includes this
archive. The command checks its SHA-256 before extracting it into the new
output directory. It reuses the frozen owner object and the external C executable,
moves the SDK view observer to the private caller boundary, and links the two
Tower modules directly to the release DSO. The independent region-builder and
upload calls retain their previous SDK transport. The healthy C/Tower paths
must each produce sixteen sampled reads, five completed retirements, zero
validation messages and exactly 103,158,144 guarded bytes matching the SDK
capture. The two traced executions also record their actual argument vectors.

Three device failure controls exercise plan, allocation and bind refusal with
real created handles. Each child must return 1, preserve zero rendered output
and pass the existing cleanup verifier. The separate original 2×2 fixture
checks the padded RGBA8 rows and its physical-device argument. Timing samples
follow checked warmups. CPU samples run 20,000 repetitions of the eight cases
per owner, at one and four owners. Device samples run one complete retained
inventory per process on one graphics queue. Each time file contains wall
nanoseconds, user and system microseconds and peak process RSS in KiB.

The four-owner sanitizer runs instrument the Tower application, recorder and
pthread harness, with fatal UBSan checks on the C layout oracle. The device
ASan check instruments the new Tower clients against the original DSO and
enables synchronization validation with leak checking disabled. The packet's
separate device diagnostics retain leak and TSan outcomes.

## First hardware run with test declarations

Worker source `f52d72850740d8244adfe701b5e2a3cd99c31481` used a
declarations file and shared type definitions supplied by the evidence
packet. Their SHA-256 digests were
`e63931e2f3b902aa6e4bde46f3839babdd9f1c6a871d8f7f2fdd0dec95b801d3`
and `98ea6f9bf0d44916d4552dee62231cd558f9dd2e822dcd32dd74db1509acaf36`.
These test inputs supplied the historical comparison for the reviewed SDK run below. The private owner in this
fixture models handle publication and bookkeeping using three handles,
a byte count and a completion flag. Draw separately tests its actual
64-byte owner layout.

Rendering replayed the retained CPU executable with its recording driver,
including a pass with `TOWER_OWNER_CANARY=1`. Both passed eight cases.
The loader bound all seven application calls to the released sixteen-entry
DSO. The binary case records preserved the original descriptor and
extension addresses and recorded 4,294,983,680 bytes charged at bind.
Removing the success check from image publication caused the worker's
canary control to exit 1.

On the selected RTX 3090 (10de:2204, Vulkan 1.3.289, NVIDIA 565.57.01)
the application ELF had SHA-256
`d74d83ab33d91301a9716bb5ab87a1f63265c5f819d2f0d484531e70836e0306`.
Both the C and Tower runs recorded zero validation warnings or errors.
Rendering replayed both lifetime traces and compared each guarded
capture byte-for-byte with the frozen reference. All 103,158,144 bytes
matched SHA-256
`140d8d6511a77daee97ebd377dfc34c9c90347cf084d0dd4516e5474315d143b`.
The sixteen reads completed before the five image owners released their
view, image and memory. Device ASan with leak detection reported 4,187
bytes in 15 allocations. Device TSan exited 66 before verified execution.

The archived worker invocation can be repeated from evidence packet
`f4f703cb-c8cc-43ad-aabc-f974522c9ebe`, SHA-256
`1ed5e76c853b07b4f89db6e32aea7700b24fab70f7f15fe60e2df95383debc39`.
Use the package root as the working directory and a fresh output path.

```sh
bash ./replay.sh "$TOWER_CHECKOUT" "$PWD/private_binding/imports.tower" "$OUTPUT"
```

## Ordinary objects with the reviewed image lifecycle module

The application imports `library.graphics.vulkan.image_lifecycle` and
`library.graphics.vulkan.image_lifecycle_types`. Tower resolves the imports
from the Foundation directory in the SDK checkout. The two clients keep their
private owner and typed output slots. No installed copy of the graphics
declarations is needed. With the pinned Linux bootstrap, LLVM/Clang 19,
x86-64 GNU ld, and the Vulkan SDK available, run the following from the
application acceptance checkout. Set `TOWER_READER` to the registered Tower
read URL, `SDK` to a new absolute checkout path, and `OUT` to a new absolute
output directory.

```sh
git init -q "$SDK"
sdk_revision=e42a7e438536cab25e2e1248babfb32e507e92c6
git -C "$SDK" fetch --depth=1 "$TOWER_READER" "$sdk_revision"
git -C "$SDK" checkout -q --detach FETCH_HEAD
test "$(git -C "$SDK" rev-parse HEAD)" = "$sdk_revision"
ROOT=$PWD
V=scaffolding/library/graphics/vulkan
APP=$ROOT/$V/linux_checks/application
IMPORTS=$SDK/$V/image_lifecycle.tower
TYPES=$SDK/$V/image_lifecycle_types.tower
export TOWER_SDK_ROOT=${TOWER_SDK_ROOT:-/}
export PATH="$TOWER_SDK_ROOT/usr/bin:$PATH"
export LD_LIBRARY_PATH="$TOWER_SDK_ROOT/usr/lib/x86_64-linux-gnu${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
export TOWER_APP_FOUNDATION="$SDK/scaffolding/foundation.tower"
mkdir "$OUT"
(cd "$APP" && "$ROOT/bootstrap/linux-x64/towerc" --library --jobs 1 \
    --foundation "$TOWER_APP_FOUNDATION" combined.tower --depfile "$OUT/combined.d" -o "$OUT/combined.o")
env -u GRAPHICS_SO bash "$APP/check_cpu.sh" --objects "$IMPORTS" "$OUT/cpu" "$TYPES"
```

The two SDK files at code commit `9c3a7f7d` have SHA-256
`48eb97f4c33aff5667ff236d1adb75cbcb49b40383f95fbca024cc5469b2fd63` and
`5aecf3e978b3a1309e902b07dbb6fcbb30c2d5e238da27b010b108348352d285`,
respectively. The review tip preserves those blobs. The CPU recipe builds
the release DSO from source. The application depfiles, object call
relocations, executable jump slots and loader bindings are in the output
directory. `cases.rows` and `canary.rows` contain the fault, signed result,
decision, image/allocation seen flags, requested bytes, bytes charged at bind
and ordered event digits. The row reader checks descriptor and extension
identity within each process before comparing rows.

The historical commands without `--objects` retain the manual LLVM IR,
opt and llc comparison. In the ordinary lane towerc writes optimized objects
and saves its raw IR for the separate instrumentation and benchmark harness.
The slot 12 device command uses the e9a55c1c retirement packet.

```sh
bash "$APP/check_device.sh" --objects "$IMPORTS" "$RETIREMENT_PACKET" "$OUT/device" "$TYPES"
```

On slot 12 the ordinary combined object had SHA-256
`c678f7998e793651f76e841e77ca021caa58fe5dafd63de3fbf79db93f221138`.
The device executable had SHA-256
`117744a74ae96fbb20ec1d3f0156cecb12c2a4500a9fdc400cb14c54d23cfe2a`.
The depfiles identified both reviewed files. Glibc resolved all seven calls
to the sixteen-entry DSO in the recording and hardware executables. The raw
C retirement, linked C and public Tower runs each matched all 103,158,144
reference bytes on the RTX 3090, NVIDIA 565.57.01. Each recorded sixteen
sampled reads before five retirements and zero validation warnings/errors.
Both sets of eight CPU rows, four rejection diagnostics, and all three
hardware refusals matched the preceding application fixture. GPU leak
checking again reported 4,187 bytes in 15 allocations. GPU TSan exited 66
before readback. The journal records timings and instrumentation coverage.

### Linux verification and adoption by Draw's image owner

At application fixture revision `96620d2ca9e964c49d377383dca24490486f7327`,
rendering rebuilt the two clients with the public SDK revision above.
The image client contained three Vulkan library call relocations and the
memory client contained four. Rendering linked the ordinary objects to the
released Linux DSO and replayed the eight recording cases twice, once with
canaries. Both sets of normalized rows matched the frozen reference.
The four negative compilations produced the expected diagnostics.

For the RTX 3090 run (10de:2204, Vulkan 1.3.289, NVIDIA 565.57.01),
rendering verified all 710 entries of packet
`46f73ab2aa213f17dbe1c75816cfb7c5f0df504a533ae43943b19d2751b8a85b`
and replayed the lifetime verifier on the three 199-event streams.
The raw C, linked C and ordinary Tower captures each matched all 103,158,144
guarded bytes in the SDK reference, SHA-256
`140d8d6511a77daee97ebd377dfc34c9c90347cf084d0dd4516e5474315d143b`.

Draw separately adopted the same public import at
`4bb5521528443028a3a1f0cc7924fea875817f32`, tree
`3dbc1411ae36c547cd1f2442ad8b7ba8c821f3d3`. Its actual 64-byte owner
stores image, memory and view at offsets 0, 8 and 16, and allocation bytes
at 56. It keeps the original descriptor and extension pointers, publishes
private output handles on success and charges the allocation before bind.
Draw's raw Vulkan declarations compiled alongside the two SDK modules.

From the Draw root, Draw built its owner with the pinned bootstrap:

```sh
"$TOWERC" --foundation "$TOWER/scaffolding/foundation.tower" --library --jobs 1 \
    tower/vulkan_image_lifecycle.tower --target x86_64-linux-gnu --depfile owner.d -o owner.o
```

The Draw object hashed to
`248f140d2233f970e345cdaa3a7d15d72141b6b483a0f7422a37babd8644c111`.
Changing the target to `x86_64-pc-windows-msvc` produced
`7106611c4c90abab7a8e85c2f1ba5a9e7a3b0c6002c9a6978c89b170d652da52`.
The Win64 link probe
`7e76ea5e85ce97420fe2abe82d30a69a09672e2a8e3cf2bcbce18e20d9ee6b92`
imported all seven names at ordinals 10 through 16.

Draw set `DRAW_TOWER_IMAGE_LIFECYCLE_FOUNDATION` to the SDK Foundation,
`DRAW_TOWER_GRAPHICS_SO` to the released sixteen-entry library, and used
the existing create, view, preflight, plan, memory and retirement selectors
for its full matrix. Under `bash tests/vulkan-image.sh`, 32 scenarios in
17 modes matched in status, trace and diagnostics. Three extra failed-view
cases checked that a driver write to its output slot preserved Draw's private
owner. With `LD_DEBUG=bindings "$OUT/tower-imports" osd-pack`, the Tower
owner ELF `bb5c6351d528a6a0be7d16f1ece63b3244a3aadd17c392e0341960fe97b6dd1b`
resolved the seven imports from `2d924e64`. The C owner ELF was
`4cbb5beda30dee5312ab02f3832426088236629cb52c28b6e231693709939dd9`.
The five packed headers yielded the expected 45-event trace
`e5db18d01d84e0601fab1a1b0b50720219e60aa3cf003db8fda992dbeed86e89`.

These Draw-owner results cover Linux CPU recording and Win64 cross-linking.
Draw assigned direct-import device tests to Linux job
`bcf1df80-88e5-4d7e-a1c0-a1e8feb5b4ec` and Win64 job
`a187face-3ef0-4335-8aaf-27567e656743`, following the bridge baselines
`181cf92c` and `feb0c2ae` respectively.
