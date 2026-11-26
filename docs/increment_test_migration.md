# Increment tests

The six `node:test` selectors in the [91b3e1f8 inventory](test-inventory.md)
have the same names at `5a134705` and after migration. Run the complete browser
suite with its interpreter and LLVM reactors. The existing
`TOWER_INTERPRETER_ONLY=1` configuration exercises the interpreter and
Foundation replay. [Browser test](../playground/tests/increment.test.mjs)

```sh
node --test --test-concurrency=1 playground/tests/increment.test.mjs
for jobs in 1 4; do
  bootstrap/linux-x64/towerc --test scaffolding/examples/increment.tower --test-details --jobs "$jobs"
  bootstrap/linux-x64/towerc --test scaffolding/compiler/semantic_expression_lowering.tower --test-details --jobs "$jobs"
done
```

Tower checks addressability and recognizes prefix and postfix modifications in
`semantic_expressions.tower`. Expression lowering captures the destination,
saves values needed across later operands and orders the resulting Foundation
operations. The existing floating compound-assignment case also mutates the
original cell and redirects the destination during its right operand. Its
expected call order and final cells are `12, 3.5, 8.0`.
[Checking](../scaffolding/compiler/semantic_expressions.tower) ·
[Lowering](../scaffolding/compiler/semantic_expression_lowering.tower) ·
[Compound-assignment fixture](../scaffolding/tests/floating_compound_capture.tower)

The lesson implements its own two Foundation grammar replacements. Its companion
imports the lesson and uses its grammar in an implicit test. The separate
`increment_rules.tower` fixture has similar grammar. The full Tower cases use
built-in place operators. The two invalid calls to `post_increment` resolve the
existing `increment_builtin.tower` helper. The lowering companion reads the
values initialized by the composition and nested fixtures and calls the
Foundation address fixture directly.
[Lesson assertions](../scaffolding/examples/increment_test.tower) ·
[Lowering assertions](../scaffolding/compiler/semantic_expression_lowering_test.tower) ·
[Guest files](../scaffolding/tests/increment)

## Assertion map

Old and new JS lines refer to `playground/tests/increment.test.mjs`. Each
comma-separated output below denotes one line, including a final newline.
`lesson` and `lowering` refer to the two companions linked above. The four
positive selectors each execute the six host assertions in the second table.

| Original selector line → new line | Executed input | Output or session assertions |
| --- | --- | --- |
| 29 → 44, increment example | Original `examples/increment.tower` | `5, 6, 7, 7, 9` → lesson lines 9, 10, 11, 12, 15. Lines 13–14 discard the two intermediate results and line 16 checks the last update to 10. |
| 32 → 47, composition | `composition.tower` | `7, 9, 20, 11, 11, 12, 13, true, 14, 20, 1, 21, 40, 42, 43` → lowering lines 7–21, one value per line in order. |
| 58 → 50, nested operands and target capture | `nested.tower` | `11, 2, false, 4, 2, 1, 20` → lowering lines 25–31 in order. The last three check the final index, written cell and untouched neighbor. |
| 73 → 53, calls with address operands | `address.tower` | `42, 42, 42, 7, 42, true` → lowering lines 36–41 in order, covering local, field, array element, fill, copy and address bits. |
| 84 → 56, errors before execution | Old rows 86–91 → `bool_operand`, `argument_type`, `void_value`, `missing_local`, `literal_place`, `nesting_limit` | Each real source starts its executable statements with `print(99)`. The four assertions on old line 92 → new lines 69–72 require `error`, zero steps, empty stdout and the corresponding diagnostic pattern on new lines 59–64. The last source nests 140 calls. |
| 94 → 78, resumable nested call | `forever.tower` | The three assertions on old line 96 → new lines 83–85. Each of 20 successive budget-one requests on one handle must return `executing`, cumulative steps equal to the request number and empty output. |

| Observation for each positive selector | Old line → new line |
| --- | --- |
| Budget-one graph execution reaches `done` | 21 → 22 |
| Concatenated graph output equals the literal transcript | 21 → 23 |
| Formatting the reparsed Foundation returns the original canonical text | 24 → 28 |
| LLVM compiles the canonical Foundation | 25 → 34 |
| Executing the emitted Wasm reaches `done` | 25 → 36 |
| Emitted Wasm output equals the same literal transcript | 25 → 37 |

The browser observes compilation failure and resumability through
`compileFiles`/`compile` and `execute`. Stepping reaches `tw_exec_step`
and the real interpreter session. Both companion paths also support direct
selection with `towerc --test`.
[Browser transport](../playground/src/tower-host.mjs) ·
[Session step](../scaffolding/compiler/execution_session.tower)
