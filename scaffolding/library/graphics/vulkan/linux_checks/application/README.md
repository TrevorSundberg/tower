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
