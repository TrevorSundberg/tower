import {validateProject} from './projects.mjs';
const encoder = new TextEncoder(), decoder = new TextDecoder('utf-8', {fatal:true});
const limit = 256 * 1024 * 1024;
const table = Uint32Array.from({length:256}, (_, n) => {
  for (let i = 0; i < 8; ++i) n = (n >>> 1) ^ (n & 1 ? 0xedb88320 : 0);
  return n >>> 0;
});
const crc = bytes => { let n = 0xffffffff; for (const b of bytes) n = table[(n ^ b) & 255] ^ (n >>> 8); return (n ^ 0xffffffff) >>> 0; };
function header(size, fields) {
  const bytes = new Uint8Array(size), view = new DataView(bytes.buffer);
  for (const [offset, width, value] of fields) view['setUint' + width](offset, value, true);
  return bytes;
}
// Standard ZIP, stored entries: no dependency, no compression memory spike.
export function exportProject(project) {
  validateProject(project);
  const {id, files, links, builtins, ...metadata} = project;
  const entries = [ ['.tower/project.json', encoder.encode(JSON.stringify({...metadata, order:files.map(f => f.path)}))],
    ...Object.entries(builtins).map(([name, text]) => ['.tower/' + name + '.tower', encoder.encode(text)]),
    ...files.map(f => [f.path, encoder.encode(f.text)]),
    ...Object.entries(links).map(([name, bytes]) => ['.tower/links/' + name, bytes]) ];
  const chunks = [], directory = []; let offset = 0, directorySize = 0;
  if (entries.length > 65535) throw new Error('Too many project files for ZIP.');
  for (const [path, bytes] of entries) {
    const name = encoder.encode(path), checksum = crc(bytes);
    if (name.length > 65535 || offset + bytes.length > limit) throw new Error('Project archive limit is 256 MiB.');
    const local = header(30, [[0,32,0x04034b50],[4,16,20],[6,16,0x800],[12,16,33],[14,32,checksum],[18,32,bytes.length],[22,32,bytes.length],[26,16,name.length]]);
    const central = header(46, [[0,32,0x02014b50],[4,16,20],[6,16,20],[8,16,0x800],[14,16,33],[16,32,checksum],[20,32,bytes.length],[24,32,bytes.length],[28,16,name.length],[42,32,offset]]);
    chunks.push(local, name, bytes); directory.push(central, name);
    offset += local.length + name.length + bytes.length; directorySize += central.length + name.length;
  }
  if (offset + directorySize + 22 > limit) throw new Error('Project archive limit is 256 MiB.');
  return new Blob([...chunks, ...directory, header(22, [[0,32,0x06054b50],[8,16,entries.length],[10,16,entries.length],[12,32,directorySize],[16,32,offset]])], {type:'application/zip'});
}
export async function importProject(blob) {
  if (blob.size > limit) throw new Error('Project archive limit is 256 MiB.');
  const bytes = new Uint8Array(await blob.arrayBuffer()), view = new DataView(bytes.buffer);
  const u16 = at => view.getUint16(at, true), u32 = at => view.getUint32(at, true);
  let end = bytes.length - 22;
  while (end >= Math.max(0, bytes.length - 65557) && u32(end) !== 0x06054b50) --end;
  if (end < 0 || u32(end) !== 0x06054b50 || end + 22 + u16(end + 20) !== bytes.length || u16(end + 4) || u16(end + 6)) throw new Error('Invalid project ZIP.');
  if (u32(end + 16) + u32(end + 12) !== end || u16(end + 8) !== u16(end + 10)) throw new Error('Invalid ZIP directory size.');
  const entries = new Map(); let at = u32(end + 16), total = 0;
  for (let i = 0; i < u16(end + 10); ++i) {
    if (at + 46 > end || u32(at) !== 0x02014b50) throw new Error('Invalid ZIP directory.');
    const flags = u16(at + 8), method = u16(at + 10), size = u32(at + 24), compressed = u32(at + 20);
    const path = decoder.decode(bytes.subarray(at + 46, at + 46 + u16(at + 28))), local = u32(at + 42);
    total += size;
    if (total > limit || flags & 1 || ![0,8].includes(method) || entries.has(path)) throw new Error('Unsupported or oversized ZIP entry: ' + path);
    if (local + 30 > at || u32(local) !== 0x04034b50) throw new Error('Invalid ZIP entry.');
    const start = local + 30 + u16(local + 26) + u16(local + 28);
    if (start + compressed > u32(end + 16)) throw new Error('Truncated ZIP entry.');
    let content = bytes.slice(start, start + compressed);
    if (method === 8) {
      const reader = new Blob([content]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
      const parts = []; let count = 0;
      for (;;) { const {value, done} = await reader.read(); if (done) break; count += value.length; if (count > size) { await reader.cancel(); throw new Error('Invalid inflated ZIP size.'); } parts.push(value); }
      content = new Uint8Array(await new Blob(parts).arrayBuffer());
    }
    if (content.length !== size || crc(content) !== u32(at + 16)) throw new Error('Damaged ZIP entry: ' + path);
    entries.set(path, content); at += 46 + u16(at + 28) + u16(at + 30) + u16(at + 32);
  }
  if (at !== end || !entries.has('.tower/project.json')) throw new Error('This ZIP needs a Tower project manifest.');
  const metadata = JSON.parse(decoder.decode(entries.get('.tower/project.json')));
  if (!Array.isArray(metadata.order)) throw new Error('Missing project file order.');
  const files = metadata.order.map(path => { if (!entries.has(path)) throw new Error('Missing file: ' + path); return {path, text:decoder.decode(entries.get(path))}; });
  const links = Object.fromEntries([...entries].filter(([path]) => path.startsWith('.tower/links/')).map(([path, data]) => [path.slice(13), data]));
  const builtins = Object.fromEntries([...entries].filter(([path]) => path.startsWith('.tower/') && path.endsWith('.tower'))
    .map(([path, bytes]) => [path.slice(7, -6), decoder.decode(bytes)]));
  if (entries.size !== 1 + Object.keys(builtins).length + files.length + Object.keys(links).length) throw new Error('ZIP contains files absent from its manifest.');
  return validateProject({...metadata, id:crypto.randomUUID(), files, links, builtins});
}
