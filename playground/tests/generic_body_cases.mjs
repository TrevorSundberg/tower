// The old eager body copier exceeds its 65,536-node limit for these signatures.
// The body has no demand; its syntax size must not charge each specialization.
export function lazyGenericBodySource() {
 return `import tower;
fn large(T:type):i32 {
${'print(99);\n'.repeat(240)}
return 1;
}
${Array.from({length:32}, (_,i) => `struct S${i} { field:i32; } var value${i}:decltype(large(S${i}))=1;`).join('\n')}
print(value31 - 1);`;
}

export function demandedGenericBodySource() {
 return lazyGenericBodySource().replace('print(value31 - 1);',
  Array.from({length:32}, (_,i) => `print(large(S${i}));`).join('\n'));
}
