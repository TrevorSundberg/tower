const normalized = source => source.replaceAll('\r', '');
// Exact content identity of the bundled module before struct support. Older
// playground versions saved even unmodified defaults without a baseline key.
const legacyDefaults = new Set(['3c33bbb4e094c4982f21e9c8d33af988c4b130be4deee75b67958153aa956e33']);
// Versioned migration of the old bundled lexical preamble, not a Tower parser.
// Only these known headers and complete one-line legacy declarations qualify.
// Unknown syntax stops the preamble scan; custom declarations are kept verbatim.
const legacyHeaders = [
  "// The ordinary language's lexer is data. The native bootstrap reader only\n// knows how to read declarations, names, quoted literals and /patterns/.",
  "// The ordinary language's lexer and grammar are data, read using bedrock.tower.\n// The host loads bedrock first; foundation will import it when imports exist.",
];
const legacyShared = new Set(String.raw`skip Whitespace = /[ \t\r\n]+/;
skip LineComment = /\/\/[^\r\n]*/ as comment;
skip BlockComment = /\/\*([^*]|\*+[^*/])*\*+\// as comment;
token Identifier = /[A-Za-z_][A-Za-z0-9_]*/ as identifier;
token Identifier = /[A-Za-z_][A-Za-z0-9_]*|\`([^\`\\\r\n]|\\[nrt\\\`])*\`/ as identifier;
token String = /"([^"\\\r\n]|\\[nrt\\'"])*"|'([^'\\\r\n]|\\[nrt\\'"])*'/ as string;`.replaceAll('\\`', '`').split('\n'));
const legacyNumber = 'token Number = /[0-9]+/ as number;';

function upgradeLegacyFoundation(bundled, saved, bedrock) {
  if (!bedrock) return saved;
  const source = normalized(saved);
  const header = legacyHeaders.find(value => source.startsWith(value + '\n'));
  if (!header) return saved;
  const inherited = new Set(normalized(bedrock).split('\n').map(line => line.trim()));
  const lines = source.slice(header.length + 1).split('\n');
  const kept = []; let index = 0, removed = false;
  for (; index < lines.length; ++index) {
    const line = lines[index], trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) { kept.push(line); continue; }
    if (!/^(?:token|skip) [A-Za-z_][A-Za-z0-9_]* = \/.*\/(?: as [A-Za-z_][A-Za-z0-9_]*)?;$/.test(trimmed)) break;
    if (legacyShared.has(trimmed) || inherited.has(trimmed)) removed = true;
    else kept.push(line);
  }
  if (!removed) return saved;
  // This bundled version imports its grammar; overrides must follow imports.
  const split = /^import foundation_syntax;$/m.test(bundled);
  const body = lines.slice(index).join('\n');
  if (!body.trim()) {
    // The old lexer-only module predates the unified Foundation file. Upgrade
    // its default to the full module and retain real lexical edits as overrides.
    const edits = kept.filter(line => line.trim() !== legacyNumber).join('\n').trim();
    if (!edits) return bundled;
    const at = bundled.indexOf('\nparse ');
    if (at < 0) return split ? bundled + '\n' + edits + '\n' : saved;
    return bundled.slice(0, at) + '\n' + edits + '\n' + bundled.slice(at);
  }
  const currentHeader = split ? bundled : normalized(bundled).split('\n').slice(0, 2).join('\n');
  return currentHeader + '\n' + kept.join('\n') + '\n' + body;
}

export async function selectFoundation(bundled, saved, baseline, { bedrock } = {}) {
  if (saved === null) return bundled;
  if (normalized(saved) === normalized(bundled) || (baseline !== null && normalized(saved) === normalized(baseline))) return bundled;
  // Recognized old defaults still upgrade if an older UI already overwrote the
  // baseline key while preserving the old document.
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized(saved)));
    const hash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
    if (legacyDefaults.has(hash)) return bundled;
  }
  return upgradeLegacyFoundation(bundled, saved, bedrock);
}
