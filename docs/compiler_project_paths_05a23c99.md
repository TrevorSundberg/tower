# Compiler-project filesystem identity repair

Source baseline05a23c99e4d5647d8699d8427ded6529bb13ac91; public eeb005717318086c145428edc3b6b784d4729df7ef0514c7329e0a18b76dda9c, no override.
Historical c934 edited Gen1 remains FAILED: its immutable recipe omitted units/tower_runtime.tower; no manual source insertion or relabeling.
The native CLI canonicalized build roots, but dependency admission compared unnormalized depfile paths. Alias and direct paths name the same generated runtime; unknown Tower dependencies were silently ignored.
Shared POSIX helpers now compare physical paths for root admission while retaining the lexical source-root suffix, including in-root symlink module names. Missing files, source-root escapes and unmapped external Tower dependencies fail with the actual path.
Only the exact runtime and current object's generated entry/expansion are admitted outside scaffolding. Generated entry bytes are packaged by their recipe unit; expanded copies must match the original exactly. No basename admission or external source search.
Duplicate packaged names must have identical newline-normalized content; conflicting insertion leaves prior content intact. Owned buffers/realpaths are released by existing scope cleanup.
The Tower regression passes direct/alias x absolute/relative depfiles, escaped space/dollar, lexical symlink names, exact four-file closure including runtime, unit-byte equivalence and duplicate-content denial.
Separate missing-runtime, outside-source and symlink-escape modes each exit1 with the actual missing/unmapped path. The runtime omission is independently checked by its literal required module name.
Full equivalent-input packaging: before direct/alias returned0 but both lacked runtime (561 files/25 units); after both contain exactly one runtime (562 files/25 units).
After direct/alias project.json SHA2563000a8226361604e16430d1e9dc14b6e62f3ce773b995c0391d1866e5906ab08; before8b272a452e0f6a73301dbd96d301fecfd56689695406e4f76ba066271e924787.
Before direct wall15.650934/childCPU9.282741s/320296KiB; alias15.675854/9.336615/320728. After direct29.176691/10.867895/316764; alias29.169464/10.830690/317136. One sample each; failed-before closure is no speedup baseline, and extra path validation adds measurable CPU.
Focused positive fixture wall0.001902s/CPU below process clock resolution/1328KiB; negative modes approximately1ms/1328-1620KiB. These are validation costs, not compiler throughput.
Initial reserved-word/array-syntax/missing-import test build errors and generated-entry name-collision attempt are retained; corrected public tool/test compile and complete packaging pass. No compiler algorithm or runtime change.
Raw commands/logs, before executable and package outputs: /cache/package_paths_05a23c99; Windows logs/recipes C:/Sandbox/build/codex_ecs_20261122/B2/package_paths_05a23c99. Immutable c934 and accepted59d static dist stay untouched.
These throwaway packages use existing c934 object inputs/current resource text solely to test the producer; they are NOT the replacement coherent release bundle. A new published-source frozen build and shared/two-generation gates follow separately.
