/** Tower uses UTF-8 bytes; browser/editor positions use UTF-16 code units. */
export function byteOffsets(source) {
  const offsets = [];
  let bytes = 0, units = 0;
  for (const char of source) {
    const point = char.codePointAt(0);
    const length = point < 0x80 ? 1 : point < 0x800 ? 2 : point < 0x10000 ? 3 : 4;
    for (let i = 0; i < length; i++) offsets[bytes++] = units;
    units += char.length;
  }
  offsets[bytes] = units;
  return offsets;
}
