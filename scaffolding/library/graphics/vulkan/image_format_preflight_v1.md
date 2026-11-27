# Draw image-format preflight for Vulkan

Draw proposed sharing the capability check that precedes image creation in
`image_create_checked` at `b15f6edd305d2234362f3ca863656f2a7487e21e`
(`draw.c:2076` and `vulkan_image.tower:74`). This is the proposed C
boundary for `draw-tower-image-format-preflight/v1`.

```c
VkResult tower_vk_image_format_preflight_v1(
    VkPhysicalDevice physical, const VkImageCreateInfo *info,
    VkImageFormatProperties *properties, VkBool32 *supported);
```

Borrow a live physical device and a readable image descriptor for the call.
The caller supplies two distinct writable outputs, each separate from the
descriptor and its referenced storage. First call
`vkGetPhysicalDeviceImageFormatProperties` once with the physical device,
format, image type, tiling, usage and flags from the descriptor. Receive
the properties in local storage. Even a zero dimension reaches the query,
so a driver error still takes precedence.

| Query outcome | Return | Caller outputs |
| --- | --- | --- |
| Driver returns a nonzero result | Exact signed driver result | Proposed guarantee: preserve both outputs, including when the driver wrote its temporary result. |
| Query succeeds, requested shape exceeds a limit or fails another test below | `VK_SUCCESS` | Copy the returned properties and write `VK_FALSE`. |
| Query succeeds, all tests pass | `VK_SUCCESS` | Copy the returned properties and write `VK_TRUE`. |

On success, require positive width, height, depth, mip count and array layer
count. Compare each extent component with its corresponding `maxExtent`
component, mip count with `maxMipLevels`, and layer count with
`maxArrayLayers`. All five upper bounds are inclusive. Require a nonzero
bitwise intersection of `info->samples` and `sampleCounts`. Return
`maxResourceSize` as part of the properties so Draw retains the complete
query result. The capacity predicate uses only the fields listed above.

Draw keeps its diagnostics and decides whether to call the separate
[image-creation entry](create_image_v1.md), then allocate and bind memory.
The preflight borrows its inputs through return and performs no creation
or allocation.

## Acceptance

Compare the raw Draw predicate and the externally linked C/Tower entry
with a recording query. Check the physical device, argument order and call
count. Include exact upper limits, zero and one-over-limit cases for each
dimension and count, supported and unsupported sample bits, and a changed
`maxResourceSize` with the same decision. Check all returned properties
on both successful branches. For a query error, use canary-filled outputs
and a driver that writes its temporary before returning a signed error.

For the device test, record the actual Vulkan-selected adapter, driver and
queried properties. Exercise the accepted 2D OSD shapes through the existing
create, bind, view, upload and sampled readback path. Check that an unsupported
shape stops in the caller before image creation. Draw owns the independent
shipping application comparison.

Draw has already independently rebuilt the preceding Linux `create.o` at
Tower `07587159dbc5606b3e24d85fa6e3babfc2f9b6fe` and matched its 952 bytes
and SHA-256 `9e870edce24bc9759319332a5fc643b4b0cc16cc35d7d04042a17d970e7c174c`.
Its linked constructor and device results are pending. This proposed
preflight entry has no implementation or device receipt yet.
