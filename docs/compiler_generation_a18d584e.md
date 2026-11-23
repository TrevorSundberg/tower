# Complete Linux x64 development generations at a18d584e

All 38 actual build binaries are byte-identical across generations 1, 2 and 3.
Generations 2 and 3 also match every byte of the 54 package payload files and
`SHA256SUMS`. This is a complete development-bootstrap candidate for ROOT;
the checked-in pin and deployment remain unchanged.

## Delivery and frozen identity

Use `C:/Sandbox/build/codex_ecs_20261122/L1/current_generation_a18d584e/generation3.tar.gz`.
It contains the executable, adjacent resources, LLVM license, checksums,
`development.json` and the original source patch. The executable is 2,293,960
bytes, mode **0755**. Transfer back from Windows to a fresh Linux path containing
spaces reproduced every package byte, passed all checksums and preserved 0755.

| Identity | Exact value |
| --- | --- |
| Frozen published main | `a18d584e29b79267bc03d099e70e214e48017b36` |
| Root tree | `604828158f8ac7d9acab878246e83d5ccbd2b3e0` |
| Compiler tree | `1830db721a8d96a54a2e38a5d2ef20ece56561f3` |
| Library tree | `c6fed2e3602a422e120bfcafa67d5a31f18e4a0b` |
| Bootstrap tree | `b3d2a442c193fa307d6d336c516c43fae0f7d5aa` |
| Gen3 archive SHA256 | `1d091f61d5545407e824eca558f7233dc870e9336f933a9a1536e20d3dc7a04a` |
| All three executables SHA256 | `47353de5b4c43917549c0ab6386a4a5aef1127bace76b8d6a0eaf01d4d899ac7` |
| Public predecessor SHA256 | `768a0cdff2d8a903d2de64b137671412a9c19f42784c99df626b64bcf911c138` |
| Gen3 development.json SHA256 | `d35050ca8a19cb912a0929a3efb206299cb17708a8d46a742003d66cfadd6adc` |
| Gen2/3 SHA256SUMS SHA256 | `1380e71c5cb5889780456ec05a38b0075e5632bbb28cbf8c85d38ce5338b0eba` |
| Complete binary manifest SHA256 | `4e798ee90a4583224c7e47337a33426152c88db5156c1393443ab800a84a5106` |
| Gen2/3 complete package manifest SHA256 | `23f9699a155c54d6e21544be8a581ed37574fffb99fa694310fa87026cf784dd` |
| Actual source-file manifest SHA256 | `249ef3dd5ce2386cdbd0e6320fd43adf7beb41b892933e043a6b4bb190fb6718` |
| Actual source snapshot SHA256 | `e2abe476dcc83e39be6dbb1cf49bc47b9751632f48d3540b9dee937a645bf9d1` |

The freeze includes a06ec4b1, B1's exclusive budget gate, B2's inline component
storage and 125efb11 declaration changes. All three package provenance manifests
record the same 1,249 source hashes; the broader build/bootstrap snapshot records
1,328 files. Actual bytes were checked before/after stages and after extracting
the source snapshot. There was no pull or source edit during generation work.
Later producer changes are outside this candidate.

Windows Git's `core.autocrlf=true` checkout is clean. Linux Git captured a
59-file CRLF-only patch in all three packages. An additional inspection's
mode-only assumption exited 1; that failed assumption and output are preserved.
Direct comparison of each affected file against its published Git blob confirmed
only line-ending differences. The original patch, SHA256
`7dffffd718d5766751e8bd4ae7eb17cb21b667b796d9d78e6282324b990cdbe5`,
and all actual source/artifact bytes remain intact. No normalization established
generation equality or rewrote provenance.

## Process and membership

Reused the established 48db0f27 OS process and current Tower `package_bootstrap`,
`verify_compiler` and `verify_bootstrap_symbols` tools. Independent Ubuntu 24 WSL
`Orchestral-Revng`, Ryzen 9 5900HX, LLVM/Clang 19.1.1, CMake 3.28.3 and Ninja;
fresh owned `/root/.cache/tower/l1_generation_a18d584e`. Whole build scopes had
`AllowedCPUs=0-7`, `MemoryMax=12884901888`, `MemorySwapMax=0`; outer jobs 4,
compiler jobs 1. Existing jobs drained and prior `build/native` was preserved.

Gen1's exact documented command, with the public predecessor verified:

```sh
env -u TOWER_BOOTSTRAP_COMPILER \
  TOWER_NATIVE_BUILD=/root/.cache/tower/l1_generation_a18d584e/gen1_build \
  TOWER_BUILD_JOBS=4 bash playground/scripts/build-native.sh -DTOWER_COMPILER_JOBS=1
```

Gen2/3 used the same `successor_build` directory and explicit test overrides to
the preceding complete verified packages under `packages/gen1` and `packages/gen2`.
Gen2's entire build was copied and hash-checked before the existing clean target.
Each generation completed 52 dependency actions. There was no duplicate public
leaf build or private bootstrap adoption; tool builds were limited to the three
current packaging/verification tools.

Inventory enumerated every ELF/archive file, including nested configure probes,
and independently required every `.o`, `.a` and `.bin` to be included. All 30
objects, one archive, three executables and four configure probes match across
all three builds, by hashes and actual `cmp`. Membership remains the historical
34 binaries plus four probes. Package membership grows from 53 to 54 payloads
solely by `share/tower/library/work_gate.tower`; nothing was removed.

All Gen2/3 payloads and checksum bytes match without filtering. Gen1 differs in
the nine runtime IR `ModuleID` comments identifying its separate build directory,
and consequently its checksum file; complete diffs are preserved. Provenance
keeps each actual command/predecessor rather than being made equal.

## Verification and observed cost

All three complete packages passed existing development verification. Gen3 also
passed relocation to a path containing spaces and the required restricted-PATH
missing-Clang negative control. Strict native symbol validation passed all nine
registered units: utf8, bytes, entities, parser-nodes, host, interpreter,
semantics, parser-format and template-build. No symbol-policy change was needed.

Existing 16/1000-function inputs and literal output files were hash-admitted from
`reference_handoff`. Resulting objects exactly matched saved checked objects in
`ROOT_reference_f72179d2`, hashes `cdc5a6ec0f2b12f1f7a622f45a27859e374558867df97470c8120cd81ddfb407`
and `ae9e824d75213b15baa1811f9ec4db04a2f044cce25746d291b888c7952f4e08`.
Linking against the relocated runtime produced exactly `15\n` and `999\n`.
Build, compile and link logs contain no warnings or errors.

GNU time, one observation each, warm filesystem/fresh processes; CPU includes
children, RSS is the process/child high-water mark, not concurrent summed RSS.

| Phase | Wall s | CPU s | Peak RSS KiB |
| --- | ---: | ---: | ---: |
| Gen1 build | 80.95 | 205.95 | 1,075,868 |
| Gen2 build | 50.98 | 114.84 | 963,184 |
| Gen3 build | 46.96 | 115.63 | 963,588 |
| Gen1 development verification | 4.98 | 5.11 | 183,220 |
| Gen2 development verification | 5.07 | 5.19 | 183,272 |
| Gen3 development + missing-Clang | 8.64 | 8.89 | 183,272 |
| Small control, jobs 1 | 0.48 | 0.47 | 177,532 |
| Large control, jobs 1 | 0.71 | 0.70 | 219,752 |

Gen1 scope peak memory was 2,785,333,248 bytes; the combined Gen2/3 scope peaked
at 2,392,662,016 bytes, including charged cache. All scopes recorded zero limit,
OOM and OOM-kill events. These are validation costs, not a speedup or scaling claim.

Complete manifests, exact commands, stage exits, timing, comparison, symbol,
relocation and control logs accompany the delivery under `manifests`, `commands`
and `checks`, with `EVIDENCE_SHA256SUMS`. Original builds, raw source snapshot and
previous artifacts remain in the owned WSL cache. Only one delivery archive was
created. No production code changed; no separate runtime profile is applicable.

This remains a **Linux x64 development bootstrap requiring system LLVM/Clang**.
Restricted standalone release verification has **not** passed. Included runtime
resources are not new cross-host runtime acceptance. ROOT owns repinning, clean
default adoption, joined platform checks and deployment; none is claimed here.

Publication reconciliation preserved complete incoming6649bbe1 history through
07bd99dba1dfbe30ef2a2938ae54423499fbe1b9. Compiler/library/host/backend/runtime,
language resources and public predecessor trees are unchanged. Incoming Windows
and native test fixtures/registration, browser memory-capacity exposure and owner
receipts are outside the frozen candidate. Their adoption is not claimed by this
receipt; no runtime checks were repeated merely to follow main. Final diff check
passed, generation/evidence hashes stayed fixed, and all owned jobs drained.