# Byte and short integers

Tower provides signed `i8`/`i16` and unsigned `u8`/`u16`, alongside the existing
32/64-bit integers and target-sized `usize`. These are ordinary type names in
the shared registry; no new grammar or reserved keywords are needed.

| Type | Size/alignment | Range |
| --- | --- | --- |
| i8 | 1 byte | -128 through 127 |
| u8 | 1 byte | 0 through 255 |
| i16 | 2 bytes | -32768 through 32767 |
| u16 | 2 bytes | 0 through 65535 |

```tower
import tower;

struct Sample { channel: u8; delta: i16; }
var sample: Sample = { channel: 3, delta: -32768 };
var total = convert(i32, sample.delta);
var encoded = bits(u16, sample.delta);
var mask: u16 = 65535;
mask += 1; // zero: arithmetic wraps at the declared width
```

There are no C-style implicit integer promotions. Operations retain their operand
type; mixed typed widths need `convert`. Unconstrained integer literals still
default to i32, while declarations, parameters and typed peers constrain literals.
`convert` checks the destination's range, including signedness; `bits` reinterprets
equal-width storage. Floating conversions use the existing strict runtime and
truncate toward zero before checking the integer range.

Unary minus remains an ordinary operation. Signed minimum literals use an exact
unsigned magnitude before negation; parentheses do not change that behavior.
`-0` is zero for integers. Add/subtract/multiply/negate wrap at the declared width;
division truncates toward zero and traps for zero or signed-minimum divided by
minus one, including remainder. `>>` is arithmetic for signed values, `>>>` is
logical, and shift counts are masked to the operand width as for wider integers.

The types work in arrays, raw pointers, structs, by-value Tower calls, generic
containers and staged evaluation. Two-byte memory operations read/write exactly
two bytes, including unaligned addresses. Layout and arithmetic are shared by
the graph interpreter, private execution cache, formatter and LLVM lowering.
Independent compiler workers use their existing isolated queries and deterministic
publication. No new constant evaluator or shared mutable type table is introduced.

Public scalar LLVM signatures carry matching signed/unsigned extension attributes
at declarations, definitions and calls. Browser foreign transport decodes the
declared narrow signedness. This does not establish every foreign platform ABI.
The C and Roku emitters support these integer widths as well. The scalar
Foundation reconstruction profile prevents implicit SIMD; native target emission
retains its normal optimizer and can vectorize eligible loops.

The `.towerbc` container version remains 1; semantics and execution-cache versions
are 4. Older version-3 packages need regeneration. Canonical Foundation remains
the semantic format, and cache reconstruction/verification is mandatory.
