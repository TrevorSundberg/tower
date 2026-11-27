# draw-tower-command-finish/v1

Draw's staged buffer and texture uploaders need a blocking operation that
finishes the current command buffer and retires work on its queue. At Draw
`30b66f597b33c6f88964779f0ab1b87e847dc839`, the implementation is
`command_finish` at draw.c:1851 and the staged buffer caller is at
draw.c:1892. At Draw `94f2d31e618e8a10177afcb3f6c95251595faab2`, the
corresponding lines are 1913 and 1954. Draw confirmed this C signature for
the planned Tower entry:

```c
VkResult tower_vk_command_finish_v1(VkQueue queue, VkCommandBuffer cmd);
```

The caller lends both handles by value and externally synchronizes access
to the primary, its pool and the queue. The operation owns a local
`VkSubmitInfo` and a local copy of the command handle. On a successful
end, the submit descriptor has `sType = VK_STRUCTURE_TYPE_SUBMIT_INFO`,
null `pNext`, one primary and a pointer to the command-handle slot.
Both semaphore counts are zero. Wait, stage and signal pointers are null.
Draw's raw C implementation can borrow its existing command slot. The
slot that the descriptor references has to live through the submit call.

| Step | Vulkan invocation | If it fails |
| --- | --- | --- |
| End (E) | `vkEndCommandBuffer(cmd)` | Return the exact signed result after E. |
| Submit (S) | `vkQueueSubmit(queue, 1, &si, VK_NULL_HANDLE)` | Return the exact signed result after ES. |
| Idle (I) | `vkQueueWaitIdle(queue)` | Return the exact signed result after ESI. Previously submitted work has unknown completion. |

A successful ESI returns `VK_SUCCESS`. The same queue is used for S and I.
There are no retries, waits on a fence, device-wide waits or resource
destruction in the entry. Draw's raw C caller checks each individual API
expression. Its Tower-enabled caller checks the single
`draw_vk_command_finish_v1(queue, cmd)` expression. Its fatal policy logs
`Vulkan error %d at line %d: %s` followed by a newline, then exits 1.
The library returns the result to its caller.

Draw's staged `buffer_upload` path copies the host data to coherent
staging, records the buffer copy, and issues a barrier from
TRANSFER/TRANSFER_WRITE to ALL_COMMANDS/MEMORY_READ. It calls finish, then
destroys staging after normal success. Direct-mapped uploads bypass finish.
The OSD texture uploader records image transitions and a buffer-to-image
copy before finish and staging retirement. Draw owns resource lifetime and
its failure policy. Interactive frames use the [separate asynchronous end
and submit operations](command_end_v1.md).

Draw's recording control exercised −4, −1 and +1 at each reachable stage.
The expected traces are E, ES and ESI with the first signed error preserved.
These are measurements of Draw's current finish implementation. The
reusable Tower implementation and a checked upload on hardware are assigned
to rendering slot 12.
