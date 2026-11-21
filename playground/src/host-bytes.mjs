// Web APIs such as TextDecoder reject SharedArrayBuffer views in browsers.
// Copy only at that host boundary, after Tower has published the owned result.
export function decodeBytes(decoder, bytes, options) {
  if (bytes && typeof SharedArrayBuffer !== 'undefined' && bytes.buffer instanceof SharedArrayBuffer) bytes = bytes.slice();
  return decoder.decode(bytes, options);
}
