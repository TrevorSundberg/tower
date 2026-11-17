// Static hosts need no Content-Encoding configuration for bundled gzip assets.
export async function fetchBytes(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Unable to load ' + url);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes[0] !== 31 || bytes[1] !== 139) return bytes;
  return new Uint8Array(await new Response(new Blob([bytes]).stream()
    .pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
}
