// A readable debug rendering of the final tree's terminals. Token labels come
// from Tower, including generated text; source spans cannot reconstruct it.
// Layout is normalized. This is not a lossless source serializer for arbitrary
// user-defined lexers/grammars (comments and skipped whitespace are absent).
export function expandedCode(nodes) {
  const tokens = nodes.filter(node => node.production === null).map(node => node.label);
  const lines = [];
  let line = '', indent = 0, parentheses = 0, brackets = 0, previous = '';
  const newline = () => {
    if (line) lines.push('  '.repeat(Math.min(indent, 40)) + line);
    line = '';
  };
  for (let i = 0; i < tokens.length; ++i) {
    const token = tokens[i], next = tokens[i + 1];
    if (token === '}') {
      if (previous !== '{') newline();
      indent = Math.max(0, indent - 1);
    }
    const tight = [')', ']', ',', ';'].includes(token) || ['(', '['].includes(previous);
    if (line && !tight) line += ' ';
    line += token; // Never inspect/reformat the contents of a string token.
    if (token === '(') ++parentheses;
    if (token === ')') parentheses = Math.max(0, parentheses - 1);
    if (token === '[') ++brackets;
    if (token === ']') brackets = Math.max(0, brackets - 1);
    if (token === '{') {
      if (next !== '}') newline();
      ++indent;
    } else if (token === '}' && ![';', ',', ')', ']'].includes(next)) newline();
    else if (token === ';' && !parentheses && !brackets) newline();
    previous = token;
  }
  newline();
  return lines.join('\n');
}
