# Linux x64 development bootstrap at c49c8b37

The compiler in `bootstrap/linux-x64/towerc` was built from `c49c8b37afd39011bc7894961e16791f25c1c478`. Its 57 executable and resource files occupy 11,305,096 bytes. The package preserves its Gen3 provenance, including its predecessor and its Linux LLVM 19 dependencies. [Generation and package checks](compiler_generation_c49c8b37.md)

| Verified file | Bytes | SHA256 |
| --- | ---: | --- |
| Linux x64 compiler, mode 0755 | 2,312,440 | `77f23db6124377e49dd677714aaca147d507a80f05928a71c3cc18faa0040a0c` |
| Delivered archive | 3,014,398 | `7aada892f2c11066a5da00c018a8cf6352070f01c56f24ebf6b0d3534f5e78db` |
| Development manifest | 154,788 | `d38c8624b69f42ff2cea0c211f7549fff80211f0983f3b667f5e490eed7ab17e` |
| Payload checksum list | 5,820 | `4f3fa844dd8ad8ed5844df9a50b551d2b8e5cd022edd43a65c59c7dc27310e7b` |

ROOT extracted the archive, checked the size and hash of each payload and compared the staged Git blobs of all 58 package files and the development manifest with the extracted bytes. Linux verified the checksums, executable mode, default compiler path and help execution with the bootstrap override unset.

A1 independently compared all 39 actual native products for each of three generations. Its package checks matched 304 archived files, 1,292 source inputs and 57 installed payloads. All nine relocated commands returned zero. Interpretation, both canonical interpreters and the linked native foreign-call program each produced `42`. The original symbol policy rejected the new parser dependency. The repaired policy accepted the actual parser provider and retained rejection of the wrong consumer and near-name control. Evidence is in `A1/native_c49_peer_r6/acceptance` on KinmenA.

The frozen source passed 94 selected native registrations and 23 direct commands. Its measured 32-worker multi-unit compilation took 1.61 seconds, down from 3.27 seconds before the repair. Eight workers remained faster on that workload. [Native acceptance](native_acceptance_c49c8b37.md), [ordinary timings and memory](compiler_combined_r5_bf9429d9.md), [AddressSanitizer](lr_arena_asan_c49c8b37.md), [ThreadSanitizer](compiler_thread_lr_arena_c49c8b37.md)

This distribution update changes the default predecessor for future builds. The public-default successor build and the browser deployment have their own verification steps. The previous published site retains its `3c0ccdce` runtime until its replacement passes the browser and hosted checks.
