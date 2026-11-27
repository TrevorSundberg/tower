# Win64 SDK caller for image allocation and binding

The two C translation units implement the call sites for
[draw-tower-image-memory/v1](../../image_memory_v1.md). Both include the real
Vulkan SDK types. The raw control passes the owner's output slot straight to
`vkAllocateMemory`. The external caller references the two public names and
can type-check them against the released header. Neither object defines a
Tower export.

Run from a checkout containing this directory. Supply the original host 11
planner evidence archive and the prepared Linux x64 SDK described in that
archive's `control/sdk-packages.txt`. The reader needs access to the Tower
planner base `a2b0899a`. The script checks the input digest, reconstructs the
ordinal-13 fixture in a fresh directory and prints the results path. It needs
the existing Quadro, NVIDIA Vulkan ICD, Xvfb and Wine. The default mode
executes the SDK reference through a Win64 PE.

```bash
export ORDINAL13_PACKET=/absolute/path/84bd5154-65b1-4ee8-bc56-c709b6a487a8.tar.gz
export PREPARED_SDK=/tmp/finish-cce07bd9/sdk
export TOWER_READER=https://github.com/TrevorSundberg/tower
bash scaffolding/library/graphics/vulkan/osd_checks/image_memory/replay.sh
```

For the linked comparison, run the same command with the released SDK header
and one of the following sets of absolute paths in the environment.

| Material delivered | Environment |
| --- | --- |
| AMD64 COFF object defining both entries | `PROVIDER_HEADER`, `PROVIDER_OBJ` |
| Win64 DLL exporting both entries and matching COFF import library | `PROVIDER_HEADER`, `PROVIDER_DLL`, `PROVIDER_LIB` |

The device and recording executables link the same selected caller object.
A combined `tower_graphics.dll` must retain the fixture's existing exports
including the planner at ordinal 13. A separately named provider can accompany
the retained planner DLL. Keep a separate provider's original loader basename.
The build checks both caller relocations. For a supplied provider it records the
input hashes and checks the defining object against the map or the import
names against the DLL. The old planner import library must fail the new link
on both names.

The recorder exercises two successful sizes, two allocation failures (one
writes through the driver's output pointer), and a bind failure. Each starts a
new process, gets an actual plan from index 31, and adds a live dedicated-image
descriptor to its extension chain. The SDK recorder observes the input
pointers, allocator, memory, offset, operation order and the caller's counters.
Each failure exits 1 and writes an operation-specific diagnostic to stderr.
The raw clobber changes the public slot. The linked comparison requires its
public slot and canaries to survive.

For the device path the fixture uses the original five sampled images and
readback atlas. Each source plan is borrowed only until allocation returns.
A successful allocation is charged before bind. Its memory stays live
through both queue completions, view and image destruction, and the SDK
free. The test compares every captured byte with the retained stream and
runs the independent Tower sampling and lifetime readers. Raw and linked
executables reside in separate directories. The hardware path uses Wine's normal
Vulkan loader. The recording-only loader redirects SDK calls to the recording
PE. The packet carries stdout, stderr, exits, loaded modules, COFFs, PEs,
maps, captures, and per-run measurements.

[Observed SDK results and remaining provider checks](../../../../../../docs/temporal-opcode-research-journal.md#win64-sdk-caller-for-separate-image-allocation-and-binding)
