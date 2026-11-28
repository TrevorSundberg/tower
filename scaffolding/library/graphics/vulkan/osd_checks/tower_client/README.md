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
