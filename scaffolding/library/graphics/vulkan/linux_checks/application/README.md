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
These are test inputs. Qualification of the public Tower imports requires
a replay with their reviewed source revision. The private owner in this
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
