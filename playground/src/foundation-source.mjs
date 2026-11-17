// Canonical text is the inter-module program format. This sidecar only maps
// diagnostics back to original source; it is not executable program metadata.
export function originalDiagnostic(result, spans) {
  if (result.status !== 'error') return result;
  const offset = result.errorOffset;
  let best;
  for (const span of spans) {
    if (span.begin <= offset && offset < span.end &&
        (!best || span.end - span.begin < best.end - best.begin)) best = span;
  }
  return { ...result, errorOffset: best?.source ?? offset };
}
