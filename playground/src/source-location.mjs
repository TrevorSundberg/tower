// One display spelling for cursor positions, diagnostics and symbol definitions.
export const sourcePath = file => (file || 'input.tower').replace(/^\.tower\//, '');
export const sourceLocation = (file, line, column) =>
  `${sourcePath(file)}:${line}${column === undefined ? '' : `:${column}`}`;

export function documentLocation(doc, offset, file) {
  const line = doc.lineAt(offset);
  // Match Tower's source positions: count Unicode scalars, not UTF-16 units.
  const column = [...doc.sliceString(line.from, offset)].length + 1;
  return {file:sourcePath(file), line:line.number, column};
}
