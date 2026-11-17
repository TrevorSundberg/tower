// Compare observable behavior, never backend-specific counters or timing.
export function compareResults(a, b) {
  if (!a || !b) return null;
  const keys = ['status', 'output', 'error', 'errorOffset', 'outputTruncated'];
  return keys.filter(key => (a[key] ?? (key === 'errorOffset' ? 0 : key === 'outputTruncated' ? false : '')) !==
    (b[key] ?? (key === 'errorOffset' ? 0 : key === 'outputTruncated' ? false : '')));
}
