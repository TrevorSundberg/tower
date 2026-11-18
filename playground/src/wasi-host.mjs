// Tower's WASI Preview 1 host. ABI layouts/constants follow wasi-sdk's
// wasi/wasip1.h. This deliberately implements only our compiler's imports:
// memory files, standard streams, clocks, entropy and process exit.
// No host filesystem, sockets, environment variables or subprocesses.
const E = { BADF: 8, EXIST: 20, FAULT: 21, FBIG: 22, INVAL: 28, ISDIR: 31,
  NOENT: 44, NOTDIR: 54, NOTEMPTY: 55, NOTSUP: 58, SPIPE: 70, NOTCAPABLE: 76 };
const encoder = new TextEncoder(), decoder = new TextDecoder('utf-8', { fatal: true });
const FILE_LIMIT = 64 * 1024 * 1024;
class Errno { constructor(code) { this.code = code; } }
export class WASIExit extends Error {
  constructor(code) { super(`Tower WASI process exited with code ${code}`); this.code = code; }
}
export class TowerWASI {
  constructor({ log = () => {} } = {}) {
    this.files = new Map(); this.nextInode = 1n;
    const root = this.node(3); this.files.set('', root);
    this.fds = new Map([[0, { node: this.node(2), position: 0 }],
      [1, { node: this.node(2), position: 0, log, pending: '', decoder: new TextDecoder() }],
      [2, { node: this.node(2), position: 0, log, pending: '', decoder: new TextDecoder() }],
      [3, { node: root, path: '', position: 0, preopen: true }]]);
    this.wasiImport = {};
    for (const [name, action] of Object.entries(this.operations())) this.wasiImport[name] = (...args) => {
      try { action(...args); return 0; }
      catch (error) { if (error instanceof Errno) return error.code; throw error; }
    };
  }
  initialize(instance) { this.instance = instance; instance.exports._initialize?.(); }
  // Replace the complete virtual drive and invalidate every open guest file.
  mountFiles(files) {
    const mounted = new Map([['', this.files.get('')]]);
    for (const {path, text} of files) {
      if (!path || /[\\\x00:]/.test(path) || path.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('Invalid virtual file path: ' + path);
      const parts = path.split('/'); let directory = '';
      for (const part of parts.slice(0,-1)) {
        directory += (directory ? '/' : '') + part;
        if (mounted.has(directory) && mounted.get(directory).type !== 3) throw new Error('Virtual folder conflicts with file');
        if (!mounted.has(directory)) mounted.set(directory,this.node(3));
      }
      if (mounted.has(path)) throw new Error('Duplicate virtual file: ' + path);
      const file = this.node(4); file.data = encoder.encode(text); mounted.set(path,file);
    }
    for (const fd of this.fds.keys()) if (fd > 3) this.fds.delete(fd);
    this.files = mounted;
  }
  node(type) { return { type, inode: this.nextInode++, links: 1n, data: new Uint8Array(), time: BigInt(Date.now()) * 1000000n }; }
  fail(code) { throw new Errno(code); }
  memory(pointer, length) {
    pointer >>>= 0; length >>>= 0;
    if (pointer + length > this.instance.exports.memory.buffer.byteLength) this.fail(E.FAULT);
    return new Uint8Array(this.instance.exports.memory.buffer, pointer, length);
  }
  view(pointer, size) { const bytes = this.memory(pointer, size); return new DataView(bytes.buffer, bytes.byteOffset, size); }
  put32(pointer, value) { this.view(pointer, 4).setUint32(0, value, true); }
  put64(pointer, value) { this.view(pointer, 8).setBigUint64(0, value, true); }
  fd(number) { const handle = this.fds.get(number); if (!handle) this.fail(E.BADF); return handle; }
  path(fd, pointer, length) {
    const handle = this.fd(fd); if (handle.node.type !== 3) this.fail(E.NOTDIR);
    let text;
    try { text = decoder.decode(this.memory(pointer, length)); } catch (error) { if (error instanceof Errno) throw error; this.fail(E.INVAL); }
    if (!text || text.includes('\0')) this.fail(E.INVAL);
    if (text.startsWith('/')) this.fail(E.NOTCAPABLE);
    const parts = [];
    for (const part of text.split('/')) {
      if (part === '..') { if (!parts.length) this.fail(E.NOTCAPABLE); parts.pop(); }
      else if (part && part !== '.') parts.push(part);
    }
    return [handle.path, ...parts].filter(Boolean).join('/');
  }
  lookup(path) { const node = this.files.get(path); if (!node) this.fail(E.NOENT); return node; }
  parent(path) {
    const index = path.lastIndexOf('/');
    if (this.lookup(index < 0 ? '' : path.slice(0, index)).type !== 3) this.fail(E.NOTDIR);
  }
  resize(node, length) {
    if (node.type !== 4) this.fail(E.ISDIR);
    if (length < 0 || length > FILE_LIMIT) this.fail(E.FBIG);
    if (length === node.data.length) return;
    const data = new Uint8Array(length); data.set(node.data.subarray(0, length)); node.data = data;
  }
  vectors(pointer, count) {
    if ((count >>> 0) > 1024) this.fail(E.INVAL);
    const view = this.view(pointer, count * 8), result = [];
    for (let i = 0; i < count; ++i) result.push(this.memory(view.getUint32(i * 8, true), view.getUint32(i * 8 + 4, true)));
    return result;
  }
  read(fd, vectors, count, result, offset) {
    const handle = this.fd(fd); if (handle.node.type === 3) this.fail(E.ISDIR);
    this.view(result, 4);
    const buffers = this.vectors(vectors, count);
    const position = offset === undefined ? handle.position : Number(offset);
    if (!Number.isSafeInteger(position) || position < 0) this.fail(E.INVAL);
    let read = 0;
    for (const bytes of buffers) {
      const chunk = handle.node.data.subarray(position + read, position + read + bytes.length);
      bytes.set(chunk); read += chunk.length; if (chunk.length < bytes.length) break;
    }
    if (offset === undefined) handle.position += read;
    this.put32(result, read);
  }
  stat(node, pointer) {
    this.memory(pointer, 64).fill(0); const view = this.view(pointer, 64);
    view.setBigUint64(8, node.inode, true); view.setUint8(16, node.type);
    view.setBigUint64(24, node.links, true); view.setBigUint64(32, BigInt(node.data.length), true);
    for (const offset of [40, 48, 56]) view.setBigUint64(offset, node.time, true);
  }
  operations() { return {
    args_sizes_get: (argc, size) => { this.put32(argc, 0); this.put32(size, 0); },
    args_get: () => {},
    environ_sizes_get: (count, size) => { this.put32(count, 0); this.put32(size, 0); },
    environ_get: () => {},
    clock_time_get: (clock, precision, result) => {
      if (clock !== 0 && clock !== 1) this.fail(E.INVAL);
      this.put64(result, clock === 0 ? BigInt(Date.now()) * 1000000n : BigInt(Math.floor(performance.now() * 1000000)));
    },
    random_get: (pointer, length) => {
      const bytes = this.memory(pointer, length);
      for (let start = 0; start < bytes.length; start += 65536) crypto.getRandomValues(bytes.subarray(start, start + 65536));
    },
    proc_exit: code => { throw new WASIExit(code); },
    fd_close: fd => {
      const h = this.fd(fd);
      if (h.log) { h.pending += h.decoder.decode(); if (h.pending) h.log(h.pending); }
      this.fds.delete(fd);
    },
    fd_prestat_get: (fd, result) => {
      if (!this.fd(fd).preopen) this.fail(E.BADF);
      this.memory(result, 8).fill(0); this.put32(result + 4, 1);
    },
    fd_prestat_dir_name: (fd, result, length) => {
      if (!this.fd(fd).preopen) this.fail(E.BADF);
      if (length < 1) this.fail(E.INVAL); this.memory(result, 1)[0] = 46;
    },
    fd_fdstat_set_flags: (fd, flags) => { const h = this.fd(fd); if (flags & ~1) this.fail(E.NOTSUP); h.flags = flags; },
    fd_fdstat_get: (fd, result) => {
      const h = this.fd(fd); this.memory(result, 24).fill(0); const view = this.view(result, 24);
      view.setUint8(0, h.node.type); view.setUint16(2, h.flags ?? 0, true);
      // Preview 1 rights through SOCK_SHUTDOWN; only these imports are exposed.
      view.setBigUint64(8, (1n << 29n) - 1n, true); view.setBigUint64(16, h.node.type === 3 ? (1n << 29n) - 1n : 0n, true);
    },
    fd_filestat_get: (fd, result) => this.stat(this.fd(fd).node, result),
    fd_filestat_set_size: (fd, size) => this.resize(this.fd(fd).node, Number(size)),
    fd_seek: (fd, offset, whence, result) => {
      const h = this.fd(fd); if (h.node.type !== 4) this.fail(E.SPIPE);
      if (whence > 2) this.fail(E.INVAL);
      const position = (whence === 0 ? 0n : BigInt(whence === 1 ? h.position : h.node.data.length)) + offset;
      if (position < 0n || position > BigInt(Number.MAX_SAFE_INTEGER)) this.fail(E.INVAL);
      this.put64(result, position); h.position = Number(position);
    },
    fd_read: (...args) => this.read(...args),
    fd_pread: (fd, vectors, count, offset, result) => this.read(fd, vectors, count, result, offset),
    fd_write: (fd, vectors, count, result) => {
      const h = this.fd(fd); if (h.node.type === 3) this.fail(E.ISDIR);
      this.view(result, 4); const buffers = this.vectors(vectors, count);
      const total = buffers.reduce((n, bytes) => n + bytes.length, 0);
      if (h.log) {
        for (const bytes of buffers) h.pending += h.decoder.decode(bytes, { stream: true });
        const lines = h.pending.split('\n'); h.pending = lines.pop(); for (const line of lines) h.log(line);
        if (h.pending.length > 65536) { h.log(h.pending); h.pending = ''; }
      } else {
        if (h.node.type !== 4) this.fail(E.BADF);
        if (h.flags & 1) h.position = h.node.data.length;
        if (h.position + total > h.node.data.length) this.resize(h.node, h.position + total);
        for (const bytes of buffers) { h.node.data.set(bytes, h.position); h.position += bytes.length; }
      }
      this.put32(result, total);
    },
    path_open: (fd, lookup, pointer, length, flags, rights, inherit, fdflags, result) => {
      this.view(result, 4); const path = this.path(fd, pointer, length); let node = this.files.get(path);
      if (flags & ~15 || fdflags & ~1) this.fail(E.NOTSUP);
      if (node && flags & 1 && flags & 4) this.fail(E.EXIST);
      if (!node) {
        if (!(flags & 1)) this.fail(E.NOENT); if (flags & 2) this.fail(E.NOTDIR);
        this.parent(path); node = this.node(4); this.files.set(path, node);
      }
      if (flags & 2 && node.type !== 3) this.fail(E.NOTDIR);
      if (flags & 8) this.resize(node, 0);
      let next = 4; while (this.fds.has(next)) ++next;
      this.fds.set(next, { node, path, position: 0, flags: fdflags }); this.put32(result, next);
    },
    path_filestat_get: (fd, flags, pointer, length, result) => this.stat(this.lookup(this.path(fd, pointer, length)), result),
    path_create_directory: (fd, pointer, length) => {
      const path = this.path(fd, pointer, length); if (this.files.has(path)) this.fail(E.EXIST);
      this.parent(path); this.files.set(path, this.node(3));
    },
    path_unlink_file: (fd, pointer, length) => {
      const path = this.path(fd, pointer, length); if (this.lookup(path).type === 3) this.fail(E.ISDIR);
      this.lookup(path).links--;
      this.files.delete(path);
    },
    path_link: (fd, flags, pointer, length, toFd, toPointer, toLength) => {
      if (flags & ~1) this.fail(E.INVAL);
      const from = this.path(fd, pointer, length), to = this.path(toFd, toPointer, toLength);
      const node = this.lookup(from); if (node.type !== 4) this.fail(E.NOTSUP);
      this.parent(to); if (this.files.has(to)) this.fail(E.EXIST);
      this.files.set(to, node); node.links++;
    },
    path_remove_directory: (fd, pointer, length) => {
      const path = this.path(fd, pointer, length); if (this.lookup(path).type !== 3) this.fail(E.NOTDIR);
      if (!path || [...this.files.keys()].some(key => key.startsWith(path + '/'))) this.fail(E.NOTEMPTY);
      this.files.delete(path);
    },
    path_readlink: (fd, pointer, length) => { this.lookup(this.path(fd, pointer, length)); this.fail(E.INVAL); },
    path_rename: (fd, pointer, length, toFd, toPointer, toLength) => {
      const from = this.path(fd, pointer, length), to = this.path(toFd, toPointer, toLength);
      const node = this.lookup(from); if (from === to) return;
      this.parent(to); if (!from || !to || to.startsWith(from + '/')) this.fail(E.INVAL);
      const previous = this.files.get(to);
      if (previous === node) return;
      if (previous && previous.type !== node.type) this.fail(previous.type === 3 ? E.ISDIR : E.NOTDIR);
      if (previous?.type === 3 && [...this.files.keys()].some(key => key.startsWith(to + '/'))) this.fail(E.NOTEMPTY);
      if (previous) previous.links--;
      for (const [path, item] of [...this.files]) if (path === from || path.startsWith(from + '/')) {
        this.files.delete(path); this.files.set(to + path.slice(from.length), item);
      }
      for (const h of this.fds.values()) if (h.path === from || h.path?.startsWith(from + '/')) h.path = to + h.path.slice(from.length);
    },
    fd_readdir: (fd, pointer, length, cookie, result) => {
      const h = this.fd(fd); if (h.node.type !== 3) this.fail(E.NOTDIR);
      const output = this.memory(pointer, length); this.view(result, 4);
      const prefix = h.path ? h.path + '/' : '';
      const children = [...this.files].filter(([path]) => path && path.startsWith(prefix) && !path.slice(prefix.length).includes('/'));
      let written = 0;
      for (let i = Number(cookie); i < children.length && written < length; ++i) {
        const [path, node] = children[i], name = encoder.encode(path.slice(prefix.length));
        const entry = new Uint8Array(24 + name.length), view = new DataView(entry.buffer);
        view.setBigUint64(0, BigInt(i + 1), true); view.setBigUint64(8, node.inode, true);
        view.setUint32(16, name.length, true); view.setUint8(20, node.type); entry.set(name, 24);
        const chunk = entry.subarray(0, length - written); output.set(chunk, written); written += chunk.length;
      }
      this.put32(result, written);
    },
  }; }
}
