# Native validation of the Draw-reported features

Slot 11 exercised the predicate reported for Draw `7be8d020b07454789195427588712c72ee465637`
with independent control shaders. Tower implementation `dd2bebe013ebf1b6c6f8ec99c395da15fd0264bc`
has parent `4bd679415e655a263062e6da5db33a310b80cf37`, containing the
`fb49e797` counted worker. Before changes the pinned build reproduced the
original runner SHA-256 and passed on this Quadro. The GLSL and SPIR-V
hashes match the [original contract](counted_draw.md). Full Draw source and
shader parity and execution of all 16384 records remain open.

| Same strict run | Observed |
| --- | --- |
| Requested / selected | draw14 / draw14, instance request 1.4.0, loader 1.4.313 |
| Physical device 0 | Quadro RTX 6000 discrete hardware, NVIDIA 615.71.10, Vulkan 1.4.351, vendor/device 10de:1e78, UUID 26f60f6cead65faf0253a959b2e93a2d |
| Queried / enabled | multiDrawIndirect, drawIndirectFirstInstance, drawIndirectCount, shaderDrawParameters, dynamicRendering each 1 / 1 |
| Limits | maxDrawIndirectCount and maxStorageBufferRange both 4294967295, requested 16384 records and 327684 bytes |
| Queue and attachment | Family 0, flags 15, count 16, queue 0. Optimal RGBA8 color attachment + transfer source supported, max extent 32768×32768, sample-count mask 15 |
| Execution | One submit, one signaled fence, coherent staging. Khronos + sync validation, zero warnings/errors |
| Producer | Count words 0 and 1. Both first commands (3,1,0,0,0), count offset 0, command offset 4, stride 20 |
| Captures | Four 112233ff pixels then four 4080bfff pixels. Each caller had offset 4, pitch 12, span 24, capacity 32, eight active bytes per row. All gap and outer guard bytes were a5 |
| Replay | Complete strict stdout identical on rerun. Two 24-byte headers and two 32-byte guarded buffers matched the independent 112-byte oracle |

A second strict run from the same source used an unoptimized runner. GDB
read the destination fields and arguments on both entries to readback_two_rows
after the fence. Each copy reported capacity 32, offset 4, span 24 and pitch
12, with source size 16 and pitch 8. Its four actual byte strings matched
the optimized run.

The create chain uses Features2 for the base bits, the standalone dynamic
rendering and shader draw parameters structures, and Vulkan12Features for
drawIndirectCount. The base feature pointer in VkDeviceCreateInfo is null.
Only a successful vkCreateDevice reports enabled bits. The core13 profile
enables drawIndirectCount and dynamicRendering. See the
[Khronos device creation rules](https://docs.vulkan.org/refpages/latest/refpages/source/VkDeviceCreateInfo.html).

Build the shaders and native executable using the [Linux recipe](counted_draw.md#reproduce-on-linux-x86-64).
Use these commands from the checkout with its Vulkan ICD, loader and layer
paths set. Use the same output directory as the build.

```bash
v=scaffolding/library/graphics/vulkan
cc=bootstrap/linux-x64/towerc
for jobs in 1 4; do
    "$cc" --test "$v/counted_features_test.tower" --foundation scaffolding/foundation.tower --jobs "$jobs" --test-details
    "$cc" --test "$v/../indexed_indirect_test.tower" --foundation scaffolding/foundation.tower --jobs "$jobs" --test-details
done
shaders=("$out/produce.comp.spv" "$out/triangle.vert.spv" "$out/color.frag.spv")
"$out/counted_fixture" counted-core13 "${shaders[@]}"
"$out/counted_fixture" draw14 "${shaders[@]}" > "$out/strict.log"
"$out/counted_fixture" draw14 "${shaders[@]}" > "$out/replay.log"
cmp "$out/strict.log" "$out/replay.log"
```

The 15 gate tests vary one capability at a time and cover both profile
boundaries. Four existing tests cover the indirect layout and ranges. Two
native strict refusals exited 1 with selected_profile=none before device
creation. The Debian 1.3.239 loader reported 4206831. With the 1.4.313 loader,
Mesa llvmpipe reported device 1.3.230 (4206822) and all five bits available.
The core13 hardware run passed with the older loader. The assignment archive
contains both runners, SPIR-V, package digests, commands, complete capture logs,
raw bytes and sanitizer results under ID `4cb0a9d6-6dfa-40fa-b59e-acbc35606247`.
