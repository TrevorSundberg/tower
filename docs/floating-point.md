# Scalar floating point

Tower provides `f32` and `f64` values in the shared type registry. They occupy
4/8 bytes, with 4/8-byte alignment under the current target profiles. They work
in locals, pointers, arrays, structs, generic containers, parameters and returns.

```tower
import tower;

fn accelerate(speed: f32, force: f32, dt: f32): f32 {
    return speed + force * dt;
}

var speed: f32 = 1.5;
speed += accelerate(speed, 2, 0.25);
var precise = 1.25e-3; // f64 without another type constraint
var staged = comptime(accelerate(1.0, 2.0, 0.5));
```

Decimal literals use digits on both sides of the point, or an exponent, such as
`1.5`, `1e3` and `2.5E-4`. A sign is a unary operation in Tower. Typed contexts
and peers constrain numeric literals; unconstrained floating literals use f64
and unconstrained integer literals retain i32. Typed values require explicit
conversions between integers and floats, or between f32 and f64. There are no
implicit promotions. Literal parsing rounds directly to the requested precision.
Out-of-range floating literals are errors; very small literals may round to zero.
The parser diagnoses literals exceeding its 4096-significant-digit scratch budget.

Arithmetic supports `+`, `-`, `*`, `/`, comparisons, unary signs, `++`/`--` and
the corresponding arithmetic compound assignments. Remainder, bitwise and shift
operations require integers. Float conditions require a bool comparison or
`convert(bool, value)`; both zeros are false and NaNs are true under that conversion.

Strict arithmetic uses IEEE binary32/binary64 encodings, nearest/ties-to-even
rounding and gradual underflow. Division by zero produces infinity or NaN as
appropriate. Comparisons with NaN are false except `!=`. Arithmetic NaNs have a
canonical positive quiet encoding. Unary minus toggles the sign bit, including
zero and NaNs; copying and `bits` preserve all bits and payloads. There are no
implicit exception flags, rounding-mode state, contraction or reassociation.

`convert` between floating widths rounds once and canonicalizes NaNs, including
same-width numeric conversion. Integer-to-float conversion rounds normally;
float-to-integer conversion truncates toward zero and traps for NaN, infinity or
an unrepresentable result. A negative fraction truncating to zero is valid for
an unsigned destination. Float-to-float overflow produces infinity. `bits`
requires equal storage widths and is not a numeric conversion. For example,
`bits(f64, 9223372036854775808)` constructs negative zero; an integer literal in
that position takes the destination storage width and accepts its full bit range.

The implementation is ordinary Tower integer code in `library/float_bits.tower`,
shared by staged evaluation, both interpreters, and linked native/Wasm runtime
helpers. Native/Wasm values still use real LLVM float/double types and their
scalar calling conventions. This first strict implementation prioritizes defined
cross-host results; it does not yet use hardware floating instructions for the
arithmetic itself. Future hardware/SIMD implementations must preserve the selected
numeric contract. Ambient native rounding and flush-to-zero cannot change the
current software results. Foreign functions retain their explicit host contract.

Canonical Foundation spells floating constants with `bits(f32, ...)` or
`bits(f64, ...)`, using signed integer spellings when the sign bit is set.
Reparsing reconstructs the floating operand with its exact bits. This also
preserves NaN payloads, which decimal text cannot express. Optimized LLVM import
reconstructs the same Foundation arithmetic/conversions from strict runtime calls.
The narrow-integer extension used `.towerbc` container version 1 and semantics
and execution-cache versions 4. Later versions are listed in the
[current package contract](../playground/README.md); incompatible packages are
rejected before execution. Floating conversions also support i8/i16/u16.

`print` uses Tower decimal conversion, with 9/17 significant digits sufficient
for round trips. It uses scientific notation, retains a decimal point and zero's
sign, and writes `inf`, `-inf` or `nan` for non-finite values. This is deterministic
output, not yet a shortest-decimal formatter. Browser JavaScript only transports
the formatted bytes and converts foreign-call bit representations at the host ABI.

LLVM native/Wasm emission and both interpreters support these values. The C and
Roku source emitters currently diagnose floating operations; they do not silently
substitute integer arithmetic or inherit another runtime's floating policy.
Hexadecimal float literals, scalar math-library expansion, fixed vectors,
swizzles and hardware SIMD selection remain follow-up work. See the project
journal for the vector direction and validation/publication receipts.

## Linking strict conversions into a C application

With the Linux x64 bootstrap at `a580e70a`, this library export has a
link-time dependency even though its result is constant.

```tower
import tower;
export fn clear_depth_word(): u32 { return bits(u32, convert(f32, 1.0)); }
```

Compile it with `--library --emit object`. For both Linux x64 and Win64,
optimized IR passes the binary64 encoding of `1.0` and the widths 64 and
32 to `tower_strict_float_convert`. The outer `bits` preserves the resulting
binary32 word. A C executable that links this object must also link a matching
definition of the conversion helper. The object alone leaves the symbol
undefined. A C caller linked with the pinned Linux runtime's conversion
helper verified the expected word.

Draw initializes the Vulkan clear-value union through its 32-bit word
representation. Its fixed depth of 1.0 uses the Tower integer literal `1065353216` (binary32 bits
`0x3f800000`). This literal produced an immediate return with no unresolved
symbols. Spelling the integer as `0x3f800000` in Tower source produced a
parse error on this bootstrap. [Reproducer, object hashes and Draw caller](temporal-opcode-research-journal.md#draw-shadow-clear-depth-word-in-a-c-linked-library)
