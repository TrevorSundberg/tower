# Blocking Vulkan command finish

Draw's staged `buffer_upload` at `30b66f597b33c6f88964779f0ab1b87e847dc839`,
draw.c:1892, copies host bytes to staging, records a buffer copy and a
TRANSFER/TRANSFER_WRITE to ALL_COMMANDS/MEMORY_READ barrier, then finishes
the primary and releases staging after success. The directly mapped path
bypasses finish. The manager confirmed the same finish contract for texture
upload/prewarm. Tower's tested implementation is `d1f468c33`. Include
`frame_submit.h` and use the Linux x86-64 Vulkan C ABI.

```c
VkResult tower_vk_command_finish_v1(VkQueue queue, VkCommandBuffer cmd);
```

Pass a recording primary from a command pool compatible with the queue's
family. Externally synchronize the queue, primary and pool. Keep the device,
queue, pool, primary, referenced resources and their bound memory alive
through retirement. The local submit descriptor and the slot holding the
borrowed command handle only need to survive the submit call.

| Call | On a nonzero signed result |
| --- | --- |
| `vkEndCommandBuffer(cmd)` | Return the result immediately. This finish made no submission. |
| `vkQueueSubmit(queue, 1, &si, VK_NULL_HANDLE)` | Return the submit result. Finish skips the wait. Apply Vulkan's failure rules to the specific result. |
| `vkQueueWaitIdle(queue)` | Return the wait result. The driver accepted submission. The caller must retain in-flight objects and establish retirement or apply its terminal-device policy. |

After a successful end, the existing prepare helper supplies a local
`VK_STRUCTURE_TYPE_SUBMIT_INFO` with null next pointer, one command slot,
zero waits/signals and null semaphore/stage pointers. The submit helper
borrows that descriptor. Successful queue idle returns zero and covers
prior work on that queue. Equal errors at different steps have the same
public value. The library performs no recovery or cleanup. Draw checks
individual raw calls or its single linked helper, prints the signed result,
line and expression, then exits 1 on error. The asynchronous frame entry
and the guarded readback retain their separate fence contracts.
[Frame submit](frame_submit_v1.md) and [guarded readback](readback_v1.md).

## Standalone objects and C link

Run in Bash from the Tower root on the host 12 Linux SDK. The receipt
pins the LLVM 19 tools, GNU ld, Vulkan headers/loader (1.3.239), bootstrap
resources and the compiler (SHA-256
`7430bdb39f73b285687fedb2945d370eaf51d2cc2fa289e5e0041cc15ad1b896`).
This recipe selects the new entry before optimization so it calls the
two public functions in the byte-identical, previously tested end object.

```bash
source /tmp/tower12/env
v=scaffolding/library/graphics/vulkan
c=bootstrap/linux-x64/towerc
loader=/tmp/tower12/sysroot/usr/lib/x86_64-linux-gnu/libvulkan.so.1
out=$(mktemp -d)
"$c" "$v/command_begin.tower" --library --jobs 1 -o "$out/command_begin.o"
"$c" "$v/command_end.tower" --library --jobs 1 -o "$out/command_end.o"
"$c" "$v/command_finish.tower" --library --jobs 1 --emit llvm -o "$out/finish.ll"
llvm-extract-19 --func=tower_vk_command_finish_v1 "$out/finish.ll" -o "$out/finish.bc"
opt-19 -passes='default<O2>' "$out/finish.bc" -o "$out/finish-opt.bc"
llc-19 -relocation-model=pic -filetype=obj "$out/finish-opt.bc" -o "$out/finish_only.o"
x86_64-linux-gnu-ld --hash-style=both -shared -z defs "$out/command_begin.o" \
    "$out/command_end.o" "$out/finish_only.o" "$loader" \
    -soname libtower_frame_submit.so -o "$out/libtower_frame_submit.so"
```

Link the external C caller to `libtower_frame_submit.so` or directly to
`finish_only.o`, `command_end.o` and the Vulkan loader. The packet's
`build.sh` exercises both links. Compiling `command_finish.tower` directly
with `--library -o command_finish.o` instead emits an aggregate object
with finish, end and submit. It replaces the end object in that form.

| Linux product | SHA-256 |
| --- | --- |
| Additive finish object, 1,144 bytes | `68cd4ba1c9dcddf18e1c25629a3254c40256ede42ace6eb2f7f367530db23693` |
| Combined four-entry DSO, 13,968 bytes | `1bcf0db193e46756559f2b64659d95b8eea4ab2be1dafc080619df804721310e` |
| Aggregate finish/end/submit object | `da4424945c4fddbc0e4c69279f39d2e0346b238bb7ac28fea22ad17fa6507654` |

## Host 12 evidence

Assignment `b820dd37-38b4-4fae-8a65-01effba2cd0f` contains the bundle,
header, objects, paired callers, observer and logs. From the unpacked packet,
run `REPLAY=$(mktemp -d) LOCAL_TOWER=/path/to/local/Tower bash replay.sh`.
The local Git objects must include the tested tree `06d47a5d` and
the host must have the pinned SDK and NVIDIA ICD.

Raw C and C through the DSO each performed 64 eight-byte transfers to
offset 4 of a coherent 16-byte destination, resetting one primary only
after the previous finish. A fixture-only transfer-to-host barrier makes
host visibility explicit. The entire destination alternated between
`a5a5a5a53031323334353637a5a5a5a5` and
`a5a5a5a56162636465666768a5a5a5a5`. Each caller exited 0 with zero
Khronos synchronization validation warnings/errors. Trace checks verified
the queue, original primary, descriptor fields, null fence, call order
and successful queue-idle return. The selected device was the discrete
RTX 3090, UUID `cd3d9791fe794e0b3ec29fc16b74d31c`, PCI 10de:2204,
Vulkan 1.3.289, NVIDIA 565.57.01, family 0 queue 0.

Each recording lane returned 0 and each of −4, −1 and +1 injected at
end, submit and idle. The fatal C controls exited 1. On the GPU the
interposer returned each injected value before forwarding that call.
The fixture's separate recovery wait always reached the real driver.
After that drain, end and submit faults left all 16 bytes at a5. Idle
faults produced the first guarded payload, proving that transfer ran
after a real accepted submit. These are synthetic results on a healthy
device. The async gate returned with VK_NOT_READY before host release,
then signaled both fences and the GPU event. Guarded clear and counted
raster reproduced the frozen bytes. Draw application execution, WSI and
real device loss remain unchecked.
