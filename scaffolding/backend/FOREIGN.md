# Foreign symbol names

The declaration reader, Itanium encoder, Microsoft encoder, C decoration and
bootstrap source expander are Tower implementations. They do not call Clang,
libclang, a demangler, or an owned native shim. LLVM/lld remain upstream code.

Use ordinary Foundation identifiers to attach a declaration to an extern or
export. The Tower signature is the **lowered call ABI**, including any explicit
`this`, `sret` or indirect aggregate parameters:

```tower
extern fn `cpp_name(llvm::raw_ostream& llvm::nulls())`(): void*;
extern fn `c_name(int puts(char const* text))`(text: u8*): i32;
```

Calls use the same identifier. Aliases can use ordinary Tower functions or
grammar replacements. No new semantic operation or duplicate program IR is
introduced: the existing Foundation name is authoritative, and the foreign
description is a disposable encoding cache. Foundation serialization retains
the declaration rather than replacing it with a target-specific symbol.

For an unquoted single expression, load `foreign-grammar.tower`. A single colon
separates adjacent C++ words; `::` still means a qualified C++ name:

```tower
extern fn cpp_name(int:foreign_fixture::increment(int:value))(value: i32): i32;
extern fn c_name(int:foreign_twice(int:value))(value: i32): i32;
```

This separator survives the shared semantic name reader's token concatenation
and the existing source formatter. Spaces are otherwise immaterial. The quoted
Foundation spelling and callable API accept conventional C++ spacing. There is
no new parser-side semantic lookup or bootstrap grammar change.

The standalone API returns an owned `ForeignName*`:

```tower
var result = cpp_name(foreign_wasi(), "bool lld::wasm::link(llvm::ArrayRef<char const*>, llvm::raw_ostream&, llvm::raw_ostream&, bool, bool)");
// Inspect foreign_name_error(result), then foreign_name_text(result).
foreign_name_close(result);
```

`c_name(profile, declaration)` follows the same ownership rule.
`foreign_mangle(profile, declaration, cpp, object)` selects LLVM name spelling
(`object = false`) or final object/linker spelling (`true`). This distinction
prevents double application of Mach-O underscores, x86 C decoration and ARM64EC
tags. LLVM lowering propagates the selected calling convention to declarations
and calls. Name generation does not infer C++ record layout, inheritance,
aggregate classification, hidden arguments, or library compatibility.

| Profile function | Numeric value | Naming/data model |
| --- | ---: | --- |
| `foreign_wasi()` | 1 | Itanium, wasm32, ILP32 |
| `foreign_linux_x64()` | 2 | Itanium, ELF, LP64 |
| `foreign_macos_x64()` | 3 | Itanium, Mach-O, LP64 |
| `foreign_macos_arm64()` | 4 | Itanium, Mach-O, LP64 |
| `foreign_windows_x64()` | 5 | Microsoft, COFF, LLP64 |
| `foreign_windows_x86()` | 6 | Microsoft, COFF, ILP32 |
| `foreign_mingw_x64()` | 7 | Itanium, COFF, LLP64 |
| `foreign_linux_arm64()` | 8 | Itanium, ELF, LP64 |
| `foreign_linux_x86()` | 9 | Itanium, ELF, ILP32 |
| `foreign_windows_arm64()` | 10 | Microsoft, COFF, LLP64 |
| `foreign_windows_arm64ec()` | 11 | Microsoft plus ARM64EC object decoration |

These are explicit enum-like constants exposed as functions under the current
Foundation. The ability to generate an x86/ARM64EC name does not expand the
backend's existing target-layout or execution support.

Declarations support scalar types, qualified names, concrete type templates,
integer template arguments, cv qualifiers, pointers/references, arrays,
function pointers, member pointers, varargs, ordinary operators, method/ref
qualifiers, `noexcept`, and calling conventions. Parameter identifiers do not
affect the result. Itanium substitutions and Microsoft name/argument
backreferences are derived from canonical types, not source spellings.

All required foreign metadata fits inside the expression:

```text
cpp_name(using Count = unsigned long; void foo(Count))
cpp_name(typedef unsigned long Count; void foo(Count))
cpp_name(class Widget; public method int Widget::read() const & noexcept)
cpp_name(ctor(base) llvm::raw_fd_ostream(int, bool, bool, llvm::raw_ostream::OStreamKind))
cpp_name(dtor(base) llvm::raw_fd_ostream())
cpp_name(using std::ostream = std::basic_ostream<char, std::char_traits<char>>; void foo(std::ostream*))
cpp_name(void foo(Buffer<value(unsigned long long, 18446744073709551615)>))
cpp_name(void foo<int>(param(0)))
```

Microsoft record types require `struct`, `class`, `union`, or `enum` metadata;
the declaration can prefix the type at its use or declare it earlier in the
same expression. `method`, `static`, `virtual` and access markers describe a
member without requiring a class definition. Constructor variants are
`complete`/`base`; destructor variants are `complete`/`base`/`deleting`, with
unsupported Microsoft complete-destructor metadata diagnosed. `value(Type, n)`
gives a non-type template argument its exact type. `param(n)` spells an Itanium
template parameter in the original template signature.

Standard-library aliases must be supplied explicitly. `std::string` is not a
universal type: libc++ inline namespaces and libstdc++'s dual ABI change the
name. `abi_tag(cxx11)` explicitly attaches a known Itanium function ABI tag;
the reader cannot infer attributes from an absent header. `__wrap;` and
`__real;` at the beginning of a declaration select upstream link-time wrapping.
The bootstrap tool emits the corresponding LLD response file from those same
declarations; the build no longer duplicates mangled wrap names.

This is a foreign declaration language, not a complete C++ frontend. Dependent
expressions, template deduction, arbitrary constexpr evaluation, lambdas/local
entities, modules, vendor vector/address-space types and vtable/thunk synthesis
are not implemented. Supply concrete resolved declarations; unsupported syntax
produces an error. Names alone never establish that a library's call ABI matches
the explicit Tower signature. The pinned WASI bindings separately validate those
signatures against upstream emitted IR and record layouts.

`foreign-names.tower` contains the functional encoding tests; backend API tests
execute them both natively and in wasm32. `backend-foreign-{library,calls,surface}`
exercise real exports, extern resolution and compact grammar. The build-host
`tower-foreign` tool expands quoted declaration identifiers to Foundation text
when an older bootstrap compiler does not yet recognize the metadata. It uses
the same Tower implementation as normal backend lowering.

References: [Itanium ABI §5.1](https://itanium-cxx-abi.github.io/cxx-abi/abi.html#mangling),
[Microsoft decoration](https://learn.microsoft.com/en-us/cpp/build/reference/decorated-names?view=msvc-170),
[libstdc++ dual ABI](https://gcc.gnu.org/onlinedocs/libstdc++/manual/using_dual_abi.html),
and the pinned upstream `clang/lib/AST/{Itanium,Microsoft}Mangle.cpp`,
`llvm/lib/IR/Mangler.cpp`, and `clang/test/CodeGenCXX/mangle-ms.cpp`.
