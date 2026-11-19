import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TowerWASI, WASIExit } from '../src/wasi-host.mjs';
function host() {
  const logs = [], wasi = new TowerWASI({ log: text => logs.push(text) });
  const memory = new WebAssembly.Memory({ initial: 2 }); wasi.initialize({ exports: { memory } });
  const view = () => new DataView(memory.buffer), bytes = () => new Uint8Array(memory.buffer);
  const text = (s, pointer = 100) => { const data = new TextEncoder().encode(s); bytes().set(data, pointer); return [pointer, data.length]; };
  const open = (name, flags = 1) => { assert.equal(wasi.wasiImport.path_open(3, 0, ...text(name), flags, 0n, 0n, 0, 16), 0); return view().getUint32(16, true); };
  const write = (fd, s) => { const [p, n] = text(s); view().setUint32(0, p, true); view().setUint32(4, n, true); return wasi.wasiImport.fd_write(fd, 0, 1, 16); };
  return { wasi, api: wasi.wasiImport, memory, logs, view, bytes, text, open, write };
}
test('Tower WASI file offsets, pread, truncation, holes and memory growth', () => {
  const h = host(), fd = h.open('object.o');
  assert.equal(h.write(fd, 'abcdef'), 0);
  assert.equal(h.api.fd_seek(fd, 2n, 0, 16), 0);
  assert.equal(h.write(fd, 'XY'), 0);
  h.view().setUint32(0, 200, true); h.view().setUint32(4, 6, true);
  assert.equal(h.api.fd_pread(fd, 0, 1, 0n, 16), 0);
  assert.equal(new TextDecoder().decode(h.bytes().subarray(200, 206)), 'abXYef');
  assert.equal(h.api.fd_seek(fd, 0n, 1, 16), 0); assert.equal(h.view().getBigUint64(16, true), 4n);
  assert.equal(h.api.fd_filestat_set_size(fd, 3n), 0);
  assert.equal(h.api.fd_seek(fd, 5n, 0, 16), 0); assert.equal(h.write(fd, 'Z'), 0);
  assert.deepEqual([...h.wasi.files.get('object.o').data], [97, 98, 88, 0, 0, 90]);
  h.memory.grow(1); assert.equal(h.api.fd_filestat_get(fd, 140000), 0);
  assert.equal(h.view().getBigUint64(140032, true), 6n);
  assert.equal(h.api.fd_close(fd), 0); assert.equal(h.api.fd_close(fd), 8);
});
test('Tower WASI directory ABI, rename, unlink and path confinement', () => {
  const h = host();
  assert.equal(h.api.fd_prestat_get(3, 0), 0); assert.equal(h.view().getUint32(4, true), 1);
  assert.equal(h.api.fd_prestat_dir_name(3, 8, 1), 0); assert.equal(h.bytes()[8], 46);
  assert.equal(h.api.path_create_directory(3, ...h.text('work')), 0);
  const fd = h.open('work/input'); h.write(fd, 'data');
  const a = h.text('work/input'), b = h.text('work/output', 200);
  assert.equal(h.api.path_rename(3, ...a, 3, ...b), 0);
  assert.equal(h.api.path_filestat_get(3, 0, ...h.text('work/output'), 300), 0);
  assert.equal(h.view().getUint8(316), 4); assert.equal(h.view().getBigUint64(332, true), 4n);
  const dir = h.open('work', 2);
  assert.equal(h.api.path_open(3, 1, ...h.text('work'), 2, 0n, 0n, 4, 16), 0, 'wasi-libc opendir uses NONBLOCK');
  const nonblocking = h.view().getUint32(16, true);
  assert.equal(h.api.fd_fdstat_get(nonblocking, 300), 0);
  assert.equal(h.view().getUint16(302, true), 4);
  assert.equal(h.api.fd_fdstat_set_flags(nonblocking, 5), 0);
  assert.equal(h.api.fd_fdstat_set_flags(nonblocking, 2), 58, 'unsupported synchronization flag');
  assert.equal(h.api.path_open(3, 0, ...h.text('work'), 2, 0n, 0n, 2, 16), 58);
  assert.equal(h.api.fd_close(nonblocking), 0);
  assert.equal(h.api.fd_readdir(dir, 300, 100, 0n, 16), 0);
  assert.equal(h.view().getBigUint64(300, true), 1n); assert.equal(h.view().getUint32(316, true), 6);
  assert.equal(new TextDecoder().decode(h.bytes().subarray(324, 330)), 'output');
  assert.equal(h.api.path_remove_directory(3, ...h.text('work')), 55);
  assert.equal(h.api.path_unlink_file(3, ...h.text('work/output')), 0);
  assert.equal(h.api.fd_filestat_get(fd, 300), 0, 'unlinked open file stays alive');
  assert.equal(h.api.path_remove_directory(3, ...h.text('work')), 0);
  for (const name of ['../escape', '/absolute', 'work/../../escape'])
    assert.equal(h.api.path_open(3, 0, ...h.text(name), 1, 0n, 0n, 0, 16), 76);
});
test('Tower WASI reports faults, supplies clocks/entropy and handles UTF-8 streams', () => {
  const h = host();
  assert.equal(h.api.fd_filestat_get(1, 131050), 21);
  assert.equal(h.api.clock_time_get(0, 0n, 16), 0); assert.ok(h.view().getBigUint64(16, true) > 0n);
  assert.equal(h.api.clock_time_get(99, 0n, 16), 28);
  assert.equal(h.api.random_get(100, 70000), 0); assert.ok(h.bytes().subarray(100, 70100).some(byte => byte));
  h.bytes().set([0xe2, 0x82, 0xac, 10], 100);
  h.view().setUint32(0, 100, true); h.view().setUint32(4, 2, true);
  assert.equal(h.api.fd_write(1, 0, 1, 16), 0);
  h.view().setUint32(0, 102, true); assert.equal(h.api.fd_write(1, 0, 1, 16), 0);
  assert.deepEqual(h.logs, ['€']);
  assert.throws(() => h.api.proc_exit(7), error => error instanceof WASIExit && error.code === 7);
});

test('Tower WASI hard links share contents and survive unlinking the original', () => {
  const h = host(), fd = h.open('a'); h.write(fd, 'value');
  const source = h.text('a'), dest = h.text('b',200);
  assert.equal(h.api.path_link(3,0,...source,3,...dest),0);
  assert.equal(h.api.path_link(3,0,...source,3,...dest),20);
  const alias = h.open('b',0); h.write(alias,'other');
  assert.equal(h.api.path_unlink_file(3,...h.text('a')),0);
  assert.equal(h.api.fd_filestat_get(fd,300),0); assert.equal(h.view().getBigUint64(324,true),1n);
  assert.equal(new TextDecoder().decode(h.wasi.files.get('b').data),'other');
  assert.equal(h.api.path_link(3,0,...h.text('b'),3,...h.text('../escape',200)),76);
});
