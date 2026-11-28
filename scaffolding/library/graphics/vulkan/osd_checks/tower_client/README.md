# Calling the Vulkan image lifecycle from Tower

An application module can use the released graphics library with this import.

```tower
import tower;
import library.graphics.vulkan.image_lifecycle;
```

The [declaration module](../../image_lifecycle.tower) has seven externs. Its only Vulkan dependency is [image_lifecycle_types](../../image_lifecycle_types.tower), which defines the five nominal handle types, five descriptors and their nested extent. The [provider ABI](../../readback_abi.tower) imports those same types and owns the driver declarations. The Win64 release at `8ac14905` supplies all seven functions.

[Sampled image construction](sampled_image.tower) passes the caller's create descriptor through preflight and creation, plans against the selected physical device's memory types, then hands that plan and its live image owner to [the allocation and retirement caller](image_owner.tower). Both modules import the lifecycle declarations directly. On a successful bind, construction passes the caller's subresource range and owner view slot to view creation. The example maps an unsupported capacity decision to `-11` and a missing suitable memory type to `-8`. Driver failures retain their signed result.

| Win64 ordinal | Operation | Caller contract |
| ---: | --- | --- |
| 12 | Preflight | Borrow the physical device and the intended create descriptor. Supply separate limits and `u32` supported outputs. Only result zero publishes either. |
| 11 | Create | Pass the same descriptor and a separate, initially null image slot. Success transfers the unbound image. |
| 13 | Plan | Pass that image, the live device's type table, its count and the required flags. A `u32` result of one publishes a `VkMemoryAllocateInfo`. Zero preserves the output. |
| 14 | Allocate | Borrow the plan and its chain. Only a zero result transfers memory through the owner's initially null slot. Charge the full `u64` size before bind. |
| 15 | Bind at zero | Pass the acquired image and memory. Failure leaves the charge and both handles with the owner. Stop before creating a view. |
| 10 | Create bound view | Borrow the bound image and range. Supply the view type, format and initially null view slot. Only success transfers the new view. |
| 16 | Destroy retired image | Complete all uses and release auxiliary views first. Pass the owned view, image and memory, any of which can be null. The function destroys in that order. Reverse the owner's charge and clear the owner after return. |

Use a fresh owner per image. If construction fails, the caller may retire its partially acquired handles before any submission. After submission the owner must establish completion, including any sampling or readback, before retiring them. An uncertain submit or wait requires the application’s recovery path.

## Build the example outside the checkout

Run from a clean checkout of this revision on Linux x64 with the packaged compiler's LLVM 19 shared-library dependencies installed. The temporary application contains only the two caller modules. The absolute Foundation path selects the checkout's ordinary language and library tree. Object generation requires neither a prior qualification packet nor a Vulkan SDK, DLL, import library or private compiler override.

```bash
set -euo pipefail
root=$PWD
(cd bootstrap/linux-x64 && sha256sum --quiet -c SHA256SUMS)
app=$(mktemp -d)
cp scaffolding/library/graphics/vulkan/osd_checks/tower_client/{sampled_image,image_owner}.tower "$app/"
cd "$app"
compiler=("$root/bootstrap/linux-x64/towerc" --library --jobs 1 --foundation "$root/scaffolding/foundation.tower")
"${compiler[@]}" sampled_image.tower --target x86_64-linux-gnu --depfile elf.d -o sampled_image.o
"${compiler[@]}" sampled_image.tower --target x86_64-w64-windows-gnu --depfile coff.d -o sampled_image.obj
sha256sum sampled_image.o sampled_image.obj
```

| Product | SHA-256 |
| --- | --- |
| Linux x64 ELF | `821c82083c46a89a3eab87cb1a59d12fde06e55d2646b0b453f62e224dd1c52b` |
| Win64 GNU COFF | `d9f9686ae801388eea32cdfaba43e8c22b015c5f8c2ea6deb1a06ff33c87ff0a` |

The two object entry points are `osd_open_sampled_image` and `osd_retire_image_owner`. Run `llvm-objdump-19 -dr sampled_image.o sampled_image.obj` to inspect the seven external calls. At executable link time use the matching target provider. The Win64 fixture links the existing sixteen-entry `tower_graphics.lib` and loads the released `tower_graphics.dll` beside its executable.

Draw reported a conflict at `ad18ef06` when its raw owner imported the previous declaration surface. The pinned compiler reproduced the conflict on both targets. The [legacy caller](legacy_owner.tower) keeps its own three-void-pointer `vkDestroyImage` declaration. It checks the size, alignment and field offsets of its private 64-byte record before converting individual handle values. The constructor passes the original create descriptor and allocation plan through by address. It publishes an initially null, typed image, memory or view local to its corresponding private slot only on success. A failed bind leaves the acquired memory charged for retirement. The private record is a Tower fixture. Compiling Draw itself at `ad18ef06` remains a separate check. [Draw owner cross-link](../../graphics_dll_windows.md#draw-win64-owner-cross-link-at-ordinal-16)

To build both callers, the private owner and their [recording checks](recording.tower) together, continue in the temporary application directory. The recorder also needs four driver-side descriptor types. It imports their [type declarations](../../image_driver_types.tower) without pulling in driver functions.

```bash
cp "$root"/scaffolding/library/graphics/vulkan/osd_checks/tower_client/{legacy_owner,recording}.tower .
for target in x86_64-linux-gnu x86_64-w64-windows-gnu; do
    "${compiler[@]}" recording.tower --target "$target" --depfile "$target.d" -o "$target.o"
done
```

The two application depfiles (`elf.d`, `coff.d`) each list nine sources. The combined check lists twelve. In each graph the sole public lifecycle declarations come from image_lifecycle and there are no provider bodies or imports of readback_abi. The raw declaration appears only in the legacy caller. The recorder calls it once with a synthetic handle. Both owners also run signed query failures, successful query with insufficient capacity, no compatible memory type, clobbered outputs, accounting at bind, and ordered retirement followed by a second release. The [journal](../../../../../../docs/temporal-opcode-research-journal.md#isolating-image-lifecycle-types-from-driver-declarations) records the provider byte comparisons and both device runs.

## Linked application checks

For a single-checkout build of both libraries, executable links and the CPU lifecycle test, follow the [Linux and Win64 application recipe](../../graphics_so_linux.md).

Rendering rebuilt the two modules from a temporary application directory
with the ordinary bootstrap compiler at `a3805474e56ebe0ec25c4f2127e5df7aec06c212`.
Both objects matched the digests above. Their only unresolved symbols
are the seven packaged functions. The declaration module's depfile lists
five language files followed by `image_lifecycle_types.tower` and
`image_lifecycle.tower`. Importing a second application module preserves
the nominal identity of an image or memory handle across both callers.

On Linux, the recording executable linked against the 15,576-byte
`libtower_graphics.so` from `f2d6df4b` (SHA-256
`2d924e642e1820a8651015802bf56c332215178db373709ee80a5f5d91be76bf`).
Rendering verified dynamic resolution of all seven functions to that file
and reran all ten recording scenarios for each of the two owner types.
The actual driver calls in this check resolve to CPU recording functions.
[Linux library build and verification](https://github.com/TrevorSundberg/tower/blob/f2d6df4b5604b5a66ea58f8772ddf8764ea883d4/scaffolding/library/graphics/vulkan/graphics_so_linux.md#independent-verification-of-the-sixteen-entry-release)

On Wine 8, the selected Quadro RTX 6000 (10de:1e78, Vulkan 1.4.351,
NVIDIA 615.71.10) exercised the actual Win64 DLL. The hardware test
PE containing the standalone typed caller had SHA-256
`6272c31877735449ffb860c5e888f17945d0472d8e8da89e816b6ef11f34b254`.
The separate private-owner PE had SHA-256
`9ccd2825841dc0433570b768bdb393f567e8e9a9d3d07c9e0b851f3b9671e075`.
Rendering verified both executables' seven imports and the DLL hash
`8fc64f24fd5491d129494dc6645be46680b87067e2288ac45f3614f242096ed7`.
Each device trace shows two successful queue completions per texture
before the owner releases its view, image and memory. The private-owner
capture matched the preceding C fixture byte-for-byte across 27,542,768
guarded bytes (SHA-256
`5b950be5050057096468fe29f087c5a3a5186d8de1910b174f5ba233ba44c811`).

Physical Windows and Draw's shipping application have separate device
checks. The Win64 sanitizer result covers trapping UBSan at the C
boundary. Win64 ASan and TSan coverage remains open.

## Calling the frame and upload commands

Import `library.graphics.vulkan.command_submission` for the four functions
in `frame_submit.h`. The [frame caller](frame_client.tower) uses their
signed `i32` results directly. The [private owner](frame_owner.tower)
imports image lifecycle and command submission together and declares
its own SDK queue, device and fence types.

| Ordinal | Public entry | Contract |
| ---: | --- | --- |
| 4 | `tower_vk_command_begin_v1` | Externally synchronize a non-pending primary and its individually resettable pool. Reset uses flags zero. Only a successful reset starts one-time recording. |
| 5 | `tower_vk_command_end_for_submit_v1` | End the primary in the caller's command slot. Success writes a one-command descriptor that points to the original command, optional wait, stage and signal slots. Failure preserves every destination byte. Supply a valid stage mask for a wait. |
| 1 | `tower_vk_queue_submit_one_v1` | Borrow the descriptor, extension chain and referenced arrays through return. Submit once on the externally synchronized queue with the optional unsignaled fence. Success can leave the primary pending. Keep device resources and synchronization objects alive through their last use, including the consumer of a signaled semaphore. |
| 6 | `tower_vk_command_finish_v1` | End, submit once with a null fence and no semaphores, then wait for queue idle. Return the first nonzero result. If submit succeeded and idle failed, keep the pool, primary and resources until separate retirement or device recovery. |

Run this source-only link check from the Tower root on Linux x64 with
LLVM 19 tools on PATH and the bootstrap's LLVM libraries installed.
It builds both application object formats and a Win64 executable.
The example entry returns immediately. The device tests below exercise
the exported caller functions with live handles.

```bash
set -euo pipefail
root=$PWD
v=$root/scaffolding/library/graphics/vulkan
work=$(mktemp -d)
cp "$v"/osd_checks/tower_client/{frame_client,frame_owner}.tower "$work/"
cd "$work"
cat >application.tower <<'TOWER'
import tower;
import frame_client;
import frame_owner;
export fn app_entry(): i32 { return 0; }
TOWER
compile=("$root/bootstrap/linux-x64/towerc" --library --jobs 1 --foundation "$root/scaffolding/foundation.tower")
"${compile[@]}" application.tower --target x86_64-linux-gnu --depfile elf.d -o application.o
"${compile[@]}" application.tower --target x86_64-w64-windows-gnu --depfile coff.d -o application.obj
"$v/build_graphics_dll.sh" "$work/release"
printf '%s\n' 'LIBRARY vulkan-1.dll' EXPORTS vkGetFenceStatus vkQueueWaitIdle >owner.def
llvm-dlltool -m i386:x86-64 -d owner.def -l owner.lib
lld-link /entry:app_entry /subsystem:console /nodefaultlib /timestamp:0 /out:application.exe \
    application.obj release/tower_graphics.lib owner.lib
llvm-readobj --coff-imports application.exe
```

To link the ELF application against the same sixteen-entry release, continue
in the same shell. Set `VULKAN_SO` to the system Vulkan loader if needed.

```bash
loader=${VULKAN_SO:-/usr/lib/x86_64-linux-gnu/libvulkan.so.1}
"$v/build_graphics_so.sh" "$work/linux" "$loader"
ld.lld -shared -z defs -o application.so application.o "$work/linux/libtower_graphics.so" "$loader"
```

To reproduce the device qualification on prepared slot 11, run the
following in Bash. The packet includes a bounded Git bundle, released
DLL and import library, SDK reference callers, fixtures and byte oracles.
Replay verifies the packet manifest, checks out its advertised commit in
a temporary directory and uses the installed host SDK.

```bash
set -euo pipefail
packet=/home/agent/.local/share/kinmen/evidence/2eb15084-1c7a-4d8e-ac8c-3b9653b274e8/b80c042b-013b-419b-bce9-b76a534cde74.tar.gz
out=$(mktemp -d)
tar -xzf "$packet" -C "$out"
bash "$out/replay.sh"
```

On the Quadro RTX 6000 the SDK and Tower applications matched all 336
guarded offscreen bytes and 240 physical staging bytes after three fence
retirements. A separate timeline gate held the subject fence unsignaled
after submit returned. The blocking transfer checked 64 guarded copies.
The [qualification record](../../../../../../docs/temporal-opcode-research-journal.md#typed-command-submission-on-host-11)
identifies the loaded modules, error injections, measurements and
remaining platform coverage.

### Draw command-owner adoption

Draw tested the public command import from Tower
`663437f8594f321a60bd9816db5cfb008a88bfd8` in its command owner at
`4a981b425969d49e7db006b669088b993aef4bcf`. From the Draw root it compiled
`tower/vulkan_command_submission.tower` with this Foundation, `--library
--jobs 1` and a depfile. Its Linux x64 object has SHA-256
`ea6df429120093a36f0d0ad244c3d7d6299f4ce5c1054647a80864969fe8bb43`.
Its x64 MSVC-target COFF object has SHA-256
`0590b0f3b41a072ed366b002aa3f137416b341e2173d56c1ee10444bce05fd21`.

Draw reports 31 passing Linux ABI cases with the released shared library
and a recording driver. Its production frame helpers preserved the
original borrowed slots in eight successful reset/begin/end/submit
sequences. All 32 injected failures exited 1 at the expected call.
The staged-upload helper passed six cases, including retention of both
buffers when a failed queue-idle call left completion unknown.
Draw also cross-linked the command and image owners against the Win64
import library. Its inspected PE imported commands 1, 4, 5 and 6 and
image functions 10 through 16. Draw assigned Linux device run
`2ccf8771-c57d-55cb-883e-0968cecadad8` and Win64 device run
`7a4988f5-f7a8-55e5-9ab7-b62ed72accb8` to follow its image-only runs.

## Staged buffers and packed OSD uploads

Import `library.graphics.vulkan.upload` alongside `command_submission` and
`image_lifecycle`. An image returned by `tower_vk_create_image_v1` and a
primary passed to `tower_vk_command_begin_v1` have the handle types the upload
recorder expects. The device needs synchronization2. Begin recording outside
a render pass and check the signed begin result before recording.

* For a staged buffer, call `tower_vk_buffer_upload_record_v1(cmd, staging,
  dst, bytes)` on a transfer-capable primary. The buffers must cover the
  positive `u64` length at offset zero, have the corresponding transfer usages
  and refer to non-overlapping ranges. The call records the copy and its
  transfer-write to memory-read barrier.
* For an OSD texture, use a recording graphics primary, coherent staging
  and a new bound color image in undefined layout. Convert the pack's zero
  layer field to one actual layer before both calls. For the five recorded
  shapes the largest region list has six entries. Size storage to the actual
  caller's needs. This example returns false on builder rejection and true
  after recording the copy and transitions.

```tower
import tower;
import library.graphics.vulkan.upload;

fn record_packed(cmd: VkCommandBufferHandle*, staging: VkBufferHandle*, image: VkImageHandle*,
    width: u32, height: u32, layers: u32, mips: u32, texel_bytes: u32, span: u64,
    regions: VkBufferImageCopy*, capacity: u32): bool {
    var n = tower_vk_build_tight_color_regions_v1(regions, capacity, width, height,
        layers, mips, texel_bytes, span);
    if n == 0 { return false; }
    tower_vk_osd_texture_upload_record_v1(cmd, staging, image, layers, mips, n, regions);
    return true;
}
```

Capacity counts writable SDK records. A null output, short capacity or
short byte span returns zero and preserves all destination bytes. Surplus
span and spare entries are allowed. Each successful entry describes a
layer-major, tightly packed mip with a `u64` byte offset from this texture's
staging base. The recorder borrows the array read-only until return and
leaves the image in shader-read-only layout. The primary remains recording.
To finish either upload synchronously, call
`tower_vk_command_finish_v1(queue, cmd)` and check its signed `i32` result.
Retain staging through completion and destination resources through their
last use. If submission succeeded and the queue wait failed, keep in-flight
resources live until an independent drain or device recovery establishes
retirement. Read host-visible results after the
readback submission and its host visibility barrier complete.

Build the [application caller](upload_client.tower) from an external directory
on Linux x64. LLVM 19 supplies the bootstrap dependencies and inspection tools.

```bash
set -euo pipefail
root=$PWD
(cd "$root/bootstrap/linux-x64" && sha256sum --quiet -c SHA256SUMS)
work=$(mktemp -d)
cp "$root/scaffolding/library/graphics/vulkan/osd_checks/tower_client/upload_client.tower" "$work/"
cd "$work"
for target in x86_64-linux-gnu x86_64-w64-windows-gnu; do
    "$root/bootstrap/linux-x64/towerc" --library --jobs 1 --foundation "$root/scaffolding/foundation.tower" \
        --target "$target" upload_client.tower --depfile "$target.d" -o "$target.o"
    llvm-nm -u "$target.o"
done
```

Expect the three upload symbols and blocking finish. Use the
[single-checkout build](../../graphics_so_linux.md) to produce
`libtower_graphics.so` on Linux or `tower_graphics.lib` and its matching
`tower_graphics.dll` for Win64. The [host 11 qualification](../../../../../../docs/temporal-opcode-research-journal.md#typed-vulkan-upload-imports-on-host-11)
records the SDK controls, hardware readbacks, failure controls and packet.

### Draw's typed upload callers

Draw enabled the three upload calls in `try_buffer_upload` and `osd_create`
at `01eabb2fe4ac526961cbb9acd3b9aa3f06054ae1` with
`DRAW_TOWER_UPLOAD_FOUNDATION` selecting the Foundation from SDK
`b52de45a4360db19dc6c8dad91e9f1e66d0ff028`. Draw ran this command from
its source root with the SDK headers and the packaged compiler:

```sh
python3 tests/verify-osd-texture-record.py "$TOWER" --graphics-so "$GRAPHICS/libtower_graphics.so"
```

Draw reports identical results across the typed caller, raw caller and three
previous object combinations. The real pack produced 6/2/2/4/2 copy regions
and 28 barriers. The 896 bytes of SDK records matched SHA-256
`afffaf85ebb9fa1d5a84d583eded1c95a4d797435778fa7c9a3ce21e65f3eb93`,
and the 64-line recording trace matched
`1ca1ad200e2e418ad72035c4b5021a5f48ba2e79844fdd93d15253acda94a581`.
All 20 pack-file cases passed. Draw also checked rejection before allocation,
untouched output on short capacity or span, and cleanup after a second-image
failure. Its staged buffer caller matched the 73-byte payload
and guards, bypassed recording for mapped memory, and retained resources
through recovery on injected end, submit and idle errors.

Draw traced the three upload calls to the released Linux DSO in those CPU
fixtures. Its adapter objects were
`8350b1939c0af226e40d2ad612c16c59c980cf78a1701bbed45afd1d0197eba5`
(ELF) and `e2ff57a445c89bfd4f393876e471958d70280311637cba7a3456190c11a4eb63`
(MSVC-target COFF). Its combined Win64 link probe imported ordinals 1 and
4 through 16 and had SHA-256
`8a56713563a190fbf23f15880fa1a762eb06307c19c748bf6df20785bbcafd30`.
Draw's direct-upload application device jobs are `61e2d4ae` on Linux and
`cbaac550` on Win64.

## Creating a shader module through the SDK

Import `library.graphics.vulkan.shader_module_creation`. The signature uses
the same nominal device as the image lifecycle and the same nominal module
as the provider. The only function it declares is the existing shader create
entry (Win64 ordinal 2). The [external caller](shader_client.tower) keeps its
own declaration for destruction.

Borrow aligned `u32` words from an externally compiled, validated SPIR-V
asset. Pass the **word count**. Keep the words readable and the two output
slots aligned, disjoint and exclusive until the call returns. For example,
with a live device and the verified shader input in scope:

```tower
var owner: AppShader = { device: device, ..default };
var status: i32 = 0;
var called = app_load_shader(&owner, words, word_count, &status);
if called == 0 { return vk_failure("Invalid shader module arguments"); }
if !vk_ok("vkCreateShaderModule", status) { return false; }
defer app_release_shader(&owner);
// Create the pipeline using owner.module before this scope exits.
```

The example uses the counted fixture's error reporters. The driver ends
its borrow of the words when creation returns. The caller
retains ownership of their storage. Local refusal returns zero and writes
zero to a valid separate result slot. A null, misaligned or aliased result
receives no write. A driver return produces one and its exact signed result.
Only driver success publishes the module. An occupied slot is preserved.
Destroy a successful module after its last pipeline creation on the same
live device with the null allocator. [C contract](../../shader_module_c.h)

To compile and link the shader, image and command examples together, run
from the SDK root on Linux x64 with LLVM 19 tools and the Vulkan loader.

```bash
set -euo pipefail
root=$PWD
v=$root/scaffolding/library/graphics/vulkan
work=$(mktemp -d)
cp "$v"/osd_checks/tower_client/{shader_client,sampled_image,image_owner,frame_client}.tower "$work/"
cd "$work"
cat > application.tower <<'TOWER'
import tower;
import shader_client;
import sampled_image;
import frame_client;
export fn app_entry(): i32 { return 0; }
TOWER
tc=("$root/bootstrap/linux-x64/towerc" --library --jobs 1 --foundation "$root/scaffolding/foundation.tower")
"${tc[@]}" application.tower --target x86_64-linux-gnu --depfile elf.d -o client.o
"${tc[@]}" application.tower --target x86_64-w64-windows-gnu --depfile coff.d -o client.obj
loader=${VULKAN_SO:-/usr/lib/x86_64-linux-gnu/libvulkan.so.1}
bash "$v/build_graphics_so.sh" release "$loader"
bash "$v/build_graphics_dll.sh" release
ld.lld -shared -z defs client.o release/libtower_graphics.so "$loader" -o application.so
printf 'LIBRARY vulkan-1.dll\nEXPORTS\n vkDestroyShaderModule\n' > destroy.def
llvm-dlltool -m i386:x86-64 -d destroy.def -l destroy.lib
lld-link /entry:app_entry /subsystem:console /nodefaultlib /timestamp:0 /out:application.exe client.obj release/tower_graphics.lib destroy.lib
llvm-nm -u client.o client.obj
llvm-readobj --coff-imports application.exe
```

Each caller object references twelve public functions and the application's
private `vkDestroyShaderModule`. The [recording test](shader_recording.tower)
runs the creation contract against the linked shared library. Its
`vkCreateShaderModule` writes a candidate on every driver return.
The packet's `record.sh` binds its separate destruction recorder and runs
the test with four pthreads. [Device results and packet ID](../../../../../../docs/temporal-opcode-research-journal.md#typed-shader-module-import-on-host-12)

The RTX 3090 device test used the repository's
[counted fixture shaders](../../counted_shaders). It compiled the compute,
vertex and fragment GLSL inputs with `glslangValidator -V --target-env vulkan1.1`
and checked the SPIR-V with `spirv-val --target-env vulkan1.1` before the
Tower caller borrowed their 438, 273 and 95 words, respectively. All three
calls returned `called=1` and `VkResult=0`. Each resulting module was
destroyed once on its creating device after pipeline creation. The count-zero
pass retained `112233ff` at all four pixels. The single-draw pass produced
`4080bfff` at all four. The typed and raw SDK paths matched the 112-byte
guarded reference. This run used Vulkan 1.3.289 and NVIDIA 565.57.01.
Draw's Vulkan 1.4 shipping profile and its own SPIR-V have separate device tests.
