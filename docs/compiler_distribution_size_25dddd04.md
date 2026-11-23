# Browser distribution size and redundant LLVM copy

D2, 2026-11-23. Source reviewed at published main
`6019450c23be2453987351d4847de37a78fab7b9`, plus the scoped packaging change below.
Reactor bytes are the immutable **25dddd04** pair, not rebuilt current sources.
Their SHA256 values remain portable `35379f42d09a199c1f2ff83327b861fcc50f65d0c70f57006ba5065adfd773fb`
and LLVM `c1280ba15b9d529acf45f5165d83e47b7f233b2273a982767ec80ab87e63ecfa`.

## Exact local sizes

All sizes are bytes. External codec outputs were decoded and compared byte for
byte with their original files; they are experiments, not new shipped formats.

| Frozen artifact | Raw | Current Tower gzip | gzip `-n -9` | Brotli `-q 5 -w 22 --no-copy-stat` |
| --- | ---: | ---: | ---: | ---: |
| Portable | 1,663,850 | Not packaged as explicit gzip | 516,529 | 446,763 |
| LLVM | 35,416,018 | 13,668,575 | 11,089,385 | 8,996,937 |

Tower uses its existing fixed-Huffman/bounded-LZ77 encoder. GNU gzip1.14-modified
and Brotli1.1.0 were already installed. Their wall/CPU/peak-RSS costs were,
respectively: portable gzip0.81/0.77s/2108KiB, Brotli0.12/0.11s/12556KiB;
LLVM gzip4.65/4.62s/2176KiB, Brotli1.64/1.62s/39780KiB. Single samples, warm
filesystem, CPU0,2, host compression address-space limit8GiB. These do not measure
served HTTP encoding, network latency, browser decompression or compiler throughput.

LLVM19 section reports show portable CODE1,478,747B/DATA149,745B and only a160B
`target_features` custom section; LLVM CODE32,806,755B/DATA2,474,985B, no custom
sections. There is no observed debug payload to strip. Release CMake strips the
portable binary and build-llvm.sh explicitly strips LLVM/cross after copying.
The configured2,147,483,648B maximum linear memory is a runtime ceiling, not
executable size, committed memory or process RSS.

## Package and loading contracts

The remote gh-pages ref still equals `6f142bef15f58380831ed344ab5eac5c4b3c2840`;
its tracked installed tree is **106 files / 144,266,921B**, build identity98ade8cc.
This is an older package, not a size measurement of a newly deployed25 build.
Its largest contributors are compiler project/support70,549,645B, raw LLVM
35,117,419B, cross gzip18,753,987B and LLVM gzip13,569,935B. The compiler group
includes project.json4,273,939B (533 editable source files/22 object units) and
66,275,706B of already-compressed support. Target packs total83,521B; standalone
Tower resources207,567B; JS source maps2,384,655B. The manifest has no identical
asset digests to deduplicate blindly.

ROOT's journal separately records its Windows25 snapshot:32 files/168,207,359B,
including reactors/project/support, not the installed app. That complete snapshot
was not copied here. Cross raw is approximately56.6MB per supplied context;
its exact25 size/compression is unmeasured on Deck and not inferred from older gzip.

Audited build.mjs, package_playground_assets, compiler-runtime, fetch-bytes,
execution/target/build workers, app target warmup and compiler project/archive
producers. Browser LLVM consumers all request `.wasm.gz`; Node tools consume
raw **build inputs**, not dist. Cross is loaded for selected native targets;
LLVM warmup serves the deliberately enabled differential backends. The isolation
service worker adds headers and has no precache. Project JSON is fetched at app
startup to install the editable compiler; compressed support is loaded for rebuild.
Embedded project sources and standalone language modules serve distinct loaders.
Type prelude, Foundation syntax, target/import libraries, licenses and complete
editable sources remain intact. No eager request was removed without its contract.

## Implemented and checked

The Tower packager now removes the redundant raw LLVM **dist staging copy** after
writing its complete gzip, exactly as it already does for cross. It still publishes
checksums last and fails if compression, writing or unlinking fails. Raw build
inputs remain available. On the exact real LLVM input, gzip is byte-identical
before/after and independently decompresses to the original. Installed payload
saving is **35,416,018B**, plus85B for the removed manifest entry. Browser transfer
bytes and runtime memory are unchanged; final publication will no longer offer
the unused raw dist URL. No backend capability or output identity changed.

The focused regression fails against the old packager (exit1, missing expected
ENOENT), then passes with the repair. The final synthetic boundary gate checks
91 complete/79 optional asset hashes, CNAME, stale cleanup, all five missing-input
rejections, and both gzip assets through independent zlib and the production
fetchBytes loader. Synthetic bytes are never executed as Wasm. No hosted claim.

Deck Docker CPU0,2/8GiB, Node22.23.5, jobs1; original public768 bootstrap without
override built only package_playground_assets in4.94wall/4.80CPU s,218804KiB peak.
Its depfile closure is unchanged since the earlier accepted tool except this edit.
Equivalent real-LLVM packaging: before3.87wall/3.82CPU s,63752KiB; after3.33/3.31s,
66128KiB. Gate: before3.06/1.85s,66788KiB; after2.97/1.92s,74356KiB (adds actual
loader assertions). n1 each; byte saving is exact, timing is not a speedup claim.
Old/new tool SHA256: `9d257830c23ad71229805950a1d9aefb69ab2a9cbf6f50794f0e0be8d5ec13ef` /
`4c3fe08016bfe610b588c94584a6bde7067f5dbc689cc7e690098547614c8a30`.
Raw logs, failures, depfiles, section reports, manifests and compression outputs:
`build/d2_ecs/distribution_25_6019450c/`. No compiler/reactor or broad suite rebuilt.

One justified next step is measuring a dynamic-Huffman improvement in the shared
Tower deflate encoder: gzip9 demonstrates2,579,190B less LLVM transfer payload
while retaining the existing browser gzip path. That is a candidate, not implemented
acceptance. Brotli needs a separate transport capability decision. Do not remove
required LLVM code, reconstruction archives or sources merely to meet a size target.
ROOT retains the final real-bundle/hosted deployment gate.
