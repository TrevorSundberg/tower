# Win64 external C qualification for normal image retirement

From the Tower checkout, set the paths to the sealed host 11 ordinal-15 packet
and the prepared LLVM 19, MinGW and Wine 8 SDK listed in its
`inputs/sdk-packages.txt`. Run on the existing Linux x64 NVIDIA worker with
its Vulkan ICD and Xvfb. Give the script a new output directory.

```bash
export ORDINAL15_PACKET=/absolute/path/b805c1a9-ea91-4b9b-bea8-375ed76b945c.tar.gz
export PREPARED_SDK=/tmp/finish-cce07bd9/sdk
bash scaffolding/library/graphics/vulkan/osd_checks/retirement/qualify.sh /tmp/retirement-results
```

The script verifies the sealed packet and nested ordinal-13 archive, uses a
private Wine prefix and rebuilds with the checked-in bootstrap. The GNU
AMD64 COFF must match the [published standalone digest](../../image_retirement_v1.md).
Clang checks the SDK handle widths and function type. The release keeps
ordinals 1–15 and appends 16. The negative link uses the same external C
object against the old import library. The name lookup fails with
`ERROR_PROC_NOT_FOUND` (127) on the old DLL and resolves to ordinal 16
on the new one.

The raw SDK, COFF, and DLL paths each run the published synthetic eight-mask
recorder. Each also runs a dirty 64-byte test owner through both the first
release and a second call using the cleared fields. Its recording callbacks
check handle identity, order, allocator and the still-live charge. After
return the owner reverses only its own charge, preserves peak and unrelated
live allocations and checks every cleared byte. The swapped SDK order first
fails on mask 3. Native Wine forwarders route these probes to the PE's
recorder. Synthetic handles never reach the physical device.

The hardware fixture reuses the recorded upload, sample, and allocation
inputs. After successful upload and sampling, the source owner's defer
releases auxiliary views, calls the C boundary with the sampled view, image
and memory, then updates the test ledger. Targets and staging have separate
owners. The normal DLL PE uses Wine's Vulkan loader. In the additional
observed PE the fixture records each real finish result. The local
`vulkan-1.dll` forwards the DLL's three retirement imports to that PE's
observers. The observers call `winevulkan.dll`. The PE's own destruction
calls import directly from Wine Vulkan. Compare `observed/device/loader.def`,
`program.imports`, `expected`, `device.txt` and `calls` in the results.
The independent Tower readers check handle lifetimes, the ten completed
submits, the sampled texels and guards. Every device and timed capture is
compared with the sealed stream byte for byte.

| Host 11 product | SHA-256 |
| --- | --- |
| Standalone COFF | `bf3fa4e119e7a71469f1e6eb6739e63a88f147b516fd27adda2541efaf0d8b57` |
| Sixteen-entry DLL | `8fc64f24fd5491d129494dc6645be46680b87067e2288ac45f3614f242096ed7` |
| Import library | `2d56f882882f90a67ae8a063899841b0968dc6d35476967eaf1fa53b5d0d945c` |
| SDK retirement device PE | `b56524d271b9837723a969f11bf4d59df5a01b44490e30c7be6015de0cf86b10` |
| Standalone COFF device PE | `49593ab2cc9d22aa3378d301391e8936f496c894b6c31dc9deb17818e14d9033` |
| External release device PE | `5fc83d0291c11507ee5b4b07470514896697bcc288d608b647a08b19a812c1a3` |
| Observed release device PE | `abbd3b0be63126ed0d802c795b268cabd284067cdd47ab7ca6d46314c1f71de2` |
| Guarded stream, 27,542,768 bytes | `5b950be5050057096468fe29f087c5a3a5186d8de1910b174f5ba233ba44c811` |

The evidence archive includes the PE/COFF hash manifest, maps, disassembly,
stdout, stderr, exit statuses, Vulkan arguments and guarded capture.
[Journal measurements and coverage](../../../../../../docs/temporal-opcode-research-journal.md#win64-normal-image-retirement-on-slot-11)
describe the timing samples, sanitizer runs and remaining platform gaps.
