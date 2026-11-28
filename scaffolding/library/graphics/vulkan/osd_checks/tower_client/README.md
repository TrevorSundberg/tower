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

To link the ELF application as a shared object, continue in the same
shell. Set `VULKAN_SO` to the system Vulkan loader if needed. This small
test provider contains the three production units used by the example.

```bash
for unit in command_begin command_finish image_retirement; do
    "${compile[@]}" "$v/$unit.tower" --target x86_64-linux-gnu -o "$unit.o"
done
ld.lld -shared -z defs -soname libframe_example.so -o libframe_example.so \
    command_begin.o command_finish.o image_retirement.o "${VULKAN_SO:-/usr/lib/x86_64-linux-gnu/libvulkan.so.1}"
ld.lld -shared -z defs -o application.so application.o libframe_example.so "${VULKAN_SO:-/usr/lib/x86_64-linux-gnu/libvulkan.so.1}"
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
