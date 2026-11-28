# Calling the Vulkan image lifecycle from Tower

An application module can use the released graphics library with this import.

```tower
import tower;
import library.graphics.vulkan.image_lifecycle;
```

The [declaration module](../../image_lifecycle.tower) imports the x64 handle and descriptor types from [readback_abi](../../readback_abi.tower). Every caller in the application can use the same import. The seven externs refer to named functions in the graphics library. The Win64 release at `8ac14905` already supplies them.

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
"${compiler[@]}" sampled_image.tower --target x86_64-linux-gnu -o sampled_image.o
"${compiler[@]}" sampled_image.tower --target x86_64-w64-windows-gnu -o sampled_image.obj
sha256sum sampled_image.o sampled_image.obj
```

| Product | SHA-256 |
| --- | --- |
| Linux x64 ELF | `821c82083c46a89a3eab87cb1a59d12fde06e55d2646b0b453f62e224dd1c52b` |
| Win64 GNU COFF | `d9f9686ae801388eea32cdfaba43e8c22b015c5f8c2ea6deb1a06ff33c87ff0a` |

The two object entry points are `osd_open_sampled_image` and `osd_retire_image_owner`. Run `llvm-objdump-19 -dr sampled_image.o sampled_image.obj` to inspect the seven external calls. At executable link time use the matching target provider. The Win64 fixture links the existing sixteen-entry `tower_graphics.lib` and loads the released `tower_graphics.dll` beside its executable.

Draw's receipt identifies C and Tower owners at `76099faa552ee9ab17ef94d73cc70be579a6e4a1` using the C boundary. This example type-checks against Tower’s canonical handles. A separate empty handle struct is nominally distinct. Direct source adoption by either Draw owner still requires checking its actual declarations and call sites. [Draw receipt](https://github.com/TrevorSundberg/tower/blob/de7e792d2eab23587494cbf637185024383d259b/scaffolding/library/graphics/vulkan/image_retirement_v1.md#draw-adoption-with-the-fifteen-entry-graphics-library)

The [recording fixture](recording.tower) exercises the same owner across success, clobbering queries and allocations, and a failed bind. Host 11 also ran the ordinary and observed Win64 callers on the Quadro, plus the standalone COFF linked into a separate fixture. See the [journal](../../../../../../docs/temporal-opcode-research-journal.md#typed-application-imports-for-the-win64-image-lifecycle) for device results, matched measurements and instrumentation scope.
