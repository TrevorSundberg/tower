# Foreign source tool failure checks

The foreign build tool now uses the shared checked byte-buffer and file helpers.
Previously, a failed output allocation could silently omit source bytes or wrap
flags and still return success. The scanner restores its temporary quoted-name
terminator on failure; both output paths are allocated before either file opens.
Write/close errors still return nonzero and may leave partial output files.

The native build uses target-registry mode. Browser LLVM builds also scan
`backend/wasi_support.tower` for wrap flags, then replace the expanded source with
the import recipe. Removing that redundant expansion is separate build-boundary
work; the documented expansion CLI remains supported.

The regression uses actual tool code with the existing single-owner allocator.
It checks failed appends for plain text, strings, comments, ordinary quoted names,
expanded foreign names and wrap flags, restores input bytes, and verifies no
retained allocations. The normal wrap case checks exact source and response bytes.
The mangler also retains its first failure independently of diagnostic allocation,
checks ownership insertion and text construction, and suppresses partial symbols.
Twelve exact ABI inputs currently exercise 515 allocation-denial positions derived
from their successful calls. Two malformed inputs exercise 18 more positions,
including recovery after a failed diagnostic-prefix allocation. Every failed call
must preserve a useful error, publish no symbol and release its owned buffers.
These cases do not establish all-input fault tolerance or threaded sanitizer
coverage.

After a default public-bootstrap native build with `TOWER_BACKEND_TESTS=ON`, run
inside the documented Linux x64 environment (set `native` to that build cache):

```sh
compiler="$PWD/bootstrap/linux-x64/towerc"
native="${TOWER_NATIVE_BUILD:-$HOME/.cache/tower/native}"
checks="$PWD/build/foreign_tool_checks"
mkdir -p "$checks"
"$compiler" scaffolding/tests/foreign_tool_checks.tower --library --jobs 4 \
  --target x86_64-unknown-linux-gnu --emit llvm-optimized -o "$checks/unbound.ll"
"$native/runtime_bind" "$checks/unbound.ll" "$checks/bound.ll" \
  main foreign_original_main foreign_tool_check_main main
clang-19 --target=x86_64-unknown-linux-gnu -O2 -c "$checks/bound.ll" -o "$checks/checks.o"
"$compiler" scaffolding/host/memory.tower --library --jobs 4 \
  --target x86_64-unknown-linux-gnu -o "$checks/memory.o"
"$compiler" --link-executable "$checks/checks.o" "$checks/memory.o" \
  "$native/runtime-instrumented.o" "$native/runtime-trap.o" -o "$checks/checks"
"$checks/checks"
```

The existing Tower runtime binder only selects the test entry instead of the
imported CLI's `main`. The aggregate compiler-host archive also contains text
exports already present in this tool; linking the smallest memory unit avoids
duplicate definitions. No native test implementation or bootstrap override is used.

On KinmenB, the failing plain-text probe returned 1 before the correction; all
regression cases now pass. The public pin compiled the changed tool and test.
Normal outputs for `host/memory_libc.tower` and `backend/wasi_support.tower`,
including wrap responses, matched the frozen predecessor byte for byte. Native
target-registry output also matched. Missing input and `/dev/full` output return
1 with diagnostics. The journal records raw logs, process timings and limits.
