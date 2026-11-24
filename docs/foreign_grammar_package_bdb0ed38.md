# Optional foreign grammar package repair

L1, 2026-11-24; source base `bdb0ed3839a8d9b714c1336274e371d5166af153`. Compiler remains public59d7dc9e, not a newly built successor.
Public executable SHA256: `eeb005717318086c145428edc3b6b784d4729df7ef0514c7329e0a18b76dda9c`, identical in the private copy.
Caller audit: CMake and browser packaging copy foreign_grammar alone; its declarations reference only Tower grammar. Backend foreign_symbol/foreign_api already compile their own reader/mangler closure.
Production fix removes the unused `import foreign_reader`; contextual/identifier attributes, grammar names/rules/activation and cpp_name/c_name spelling remain unchanged.
Original resource SHA256 `d5ba839e6ffc54e1128f9a067e68d0c08a2c53722fe78315990f8d2bb807f470`; patched `a976b1ed9c0f92b0d29c9fd266001f2bfc3ec647e17eb69aaa769796e5eb3dd1`.
Private package is an exact complete public copy except that resource; public compiler/resources/checksum/provenance files and checked-in bootstrap remain untouched.
The copied private checksum/provenance files still describe the original release; the external overlay hash manifest explicitly records the changed resource, not a repin.
ROOT's exact fixture becomes distribution_foreign.tower, unchanged SHA256 `ac8fc71e5aedd8c84ae1bc300827b10484b3288433c27efe2564d8248e11a562`.
Its independently fixed result is `(20+1)*2 = 42`; both exported names use the actual imported optional grammar, with no inline grammar copy.
New library-only companion owns the same two export definitions; existing backend_foreign_calls supplies independent quoted-name extern declarations/calls for native ABI linking.
verify_compiler copies these into its fresh isolated source directory, checks Graph/Fast exact42, emits the imported-grammar library, links the existing caller and requires native42.
The copy helper now takes an explicit source filename, reusing the existing caller without another duplicated call fixture. Old diagnostic/object-repeat/library/executable checks remain intact.

Before: actual isolated public-package request exits1, `foreign_grammar.tower:2:23: Cannot read imported module: foreign_reader`; ROOT's original failed logs also retained.
Same request/CLI/input/CWD after the private resource change: Graph exits0/output42. Before0.65wall/0.59CPU/168636KiB RSS; after0.95/0.89/183540. Failure versus success is not a speed comparison.
The completed verifier runs **21/21 development checks** plus **14/14 expected-missing-Clang checks**, exit0; restricted standalone-release verification remains NOT passed.
Those35 checks take13.83wall/14.45CPU seconds/189688KiB peak waited-child RSS; original180s child guards remain, with180s finite outer checks.
Final verifier SHA256 `fcba6fb767f948de7c4ea1f08c747d022fd8b16eb21283821c88b6767d9d5f1c`; actual exports are `_ZN15foreign_fixture9incrementEi` and `foreign_twice`.
Final verifier against original package rejects at foreign_interpret, exit1 after six earlier passes:1.69wall/1.74CPU/177356KiB.
Deliberately withdrawing only the private grammar also rejects there: `foreign.tower:2:32: Cannot read imported module: backend/foreign_grammar`, exit1,1.62wall/1.68CPU/177260KiB; exact patched resource restored.
Initial verifier draft correctly rejected compiling the whole executable fixture as a library: `Library source cannot contain top-level executable statements`,12 earlier passes, then exit1. Its logs/input/hash are preserved; the separate library fixture fixes this test boundary.
One OS receipt comparison expected dotted rather than normalized slash import spelling after that deliberate missing-resource run; corrected metadata only, no repeated successful verifier run or weakened assertion.

Linux x64 Ubuntu24/LLVM19, CPU0–3/24GiB, existing L1 tools cache. Public-pin tool build5.04wall/3.81CPU/197764KiB; necessary fixture-boundary refresh1.90/1.20/197168. No native compiler/reactor build.
Matched healthy ordinary controls use identical distribution_program bytes, explicit jobs1/4, fresh processes/warm filesystem, one ordered pair each; all output42.
Jobs1 before→after:0.63→0.48wall,0.55→0.48CPU,173856→173884KiB RSS. Jobs4:0.51→0.51wall,0.52→0.53CPU,176752→177028KiB; no throughput/scaling claim from n1.
Imported-grammar Fast jobs1/4 also output42:0.78/0.82wall,0.76/0.85CPU,185376/189112KiB.
Existing inline backend_foreign_surface linked to existing quoted library independently outputs42 before/after; library emission0.51/0.50wall,0.52/0.53CPU,178692/178916KiB.
Reference link1.19/1.04wall,1.11/1.08CPU,192496/193296KiB; executable output42 both, timing below0.01s resolution. ROOT's earlier whole-source attempt remains failed, not this passing reference.
Private relocation path contains spaces. Complete public and private-overlay manifests rechecked after drain; only one resource differs, no unshipped reader closure was supplied.
Native Linux ABI/execution and packaged grammar are covered; new browser resources, other target ABIs, complete package adoption and publication remain ROOT-owned and unclaimed.
Raw before/failures/after reports, commands, timings, public/private hashes and independent exports: `C:/Sandbox/build/codex_ecs_20261122/L1/foreign_resource_bdb0ed38/`.
Private package/reports: `/root/.cache/tower/l1_foreign_resource_bdb0ed38/` in Orchestral-Revng; immutable original remains `/root/.cache/tower/root_candidate_59d_verify/package/linux-x64/`.
No generation/UI/sanitizer/deployment verification was repeated. All owned processes drained; runtime/resource identity stays distinct from the newer verifier/test sources.
