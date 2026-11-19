// Canonical text is the inter-module program format. This sidecar only maps
// diagnostics back to original source; it is not executable program metadata.
import {moduleDiagnostic} from './module-inputs.mjs';
export function originalDiagnostic(result, spans, sourceMap) {
  if (result.status !== 'error') return result;
  const offset = result.errorOffset;
  let best;
  for (const span of spans) {
    if (span.begin <= offset && offset < span.end &&
        (!best || span.end - span.begin < best.end - best.begin)) best = span;
  }
  return moduleDiagnostic({ ...result, errorOffset: best?.source ?? offset }, sourceMap);
}
