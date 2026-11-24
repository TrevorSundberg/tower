# Retained-world execution after an aliased shared leaf changes

The existing direct-import execution fixture and grammar-only cache diamond exercise different boundaries. The new case runs inside `tower-retained-source-updates`, using its session, bounded compiler world, module environment and final release checks. It registers the two intermediate texts once and passes the same root text on every compilation. Each arm declares a distinct grammar rule to qualify for `module_cache_store` and imports the same leaf under a different alias. [Execution fixture](../scaffolding/tests/execution_world.tower) · [Existing grammar diamond](../scaffolding/tests/module_cache_profile.tower)

`frontend_modules_source` replaces the named input. For a cached arm, `module_cache_valid` walks its cloned graph's ordered modules, pairing each import with its dependency. It resolves the declaration's name and literal flag in the importing module and checks the resolved path and source bytes. The alias stays on the import node for binding. Cloning reuses a module already in the current graph by resolved path, so the shared leaf has one initializer. Compilation closes the previous execution state and rebuilds semantics in the retained world. [Module cache](../scaffolding/compiler/frontend_modules.tower) · [Execution session](../scaffolding/compiler/execution_session.tower)

| Only leaf input changes | Exact output lines in order, or exact diagnostic |
| --- | --- |
| Initial `u8`, forward helper returns 20 | `11 21 31 1 25 7` |
| Edited `u64`, forward helper returns 40 | `12 21 31 8 45 19` |
| Invalid declaration | `Unknown type 'MissingLeaf'`, zero steps/output, Graph start and Fast conversion both reject |
| Repaired `u16`, forward helper returns 60 | `14 21 31 2 65 9` |

The first three lines are the leaf, left and right initializer effects. The last three are the size of a one-field struct typed through the left arm's `decltype`, the right arm's staged helper result plus five, and the left arm's runtime seed. Each worker setting checks Graph and Fast on all three successful leaf versions and carries the failed request into the repair. Across workers 1 and 2 this adds 12 successful executions and two expected compilation failures.

The sensitivity control bypassed only the source-byte comparison for `retained_leaf.tower` in a temporary provider. On the first edit it returned the entire old output. The new oracle rejected it, CTest exit 8, 0.94 s wall / 0.86 s CPU / 157608 KiB peak RSS. The original producer blob `2882e9f54be31f0127efb5130fcbdf4b2c3e5700` was restored and rebuilt.

Tested base `d38396bbaee55ba2e503c5b646c84173b32ca1df` has the requested 587d2b360 execution and cache inputs. Final fixture blob `249662c0efdf47011d7faaff0f2575bfa3a5c74d`, runner SHA256 `8157faed4f3d701d640ae48e78907613347636ad03079011cec979203679887f`, public bootstrap 745afa2f. The restored provider/link took 23.75 s wall / 22.88 s CPU / 718952 KiB peak RSS. The exact CTest registration passed 1/1 in **2.69 s wall / 2.46 s CPU / 167956 KiB peak RSS** with its original 90 s guard. The enclosing fixture observed LR overlap 2 at workers 2 and zero final bytes, live grants and lanes at both worker settings. The compiled target used 8-byte pointers throughout.

Raw commands, source and object hashes, temporary control patch, executables, time reports and complete logs are in `build/d2_ecs/retained_diamond_r6/{initial,stale_leaf_control,restored}` and the parent directory. Deck CPU2–5, quota 2, 3 GiB RAM, swap 0. Memory event counts were zero and owned jobs drained. No production defect was found in the between-request edit contract.
