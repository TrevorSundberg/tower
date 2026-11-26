// The selected Tower case owns the sequence. Only the project, Blob and WASI
// objects live here. A pending Blob import settles between interpreter steps.
import {readFileSync} from 'node:fs';
import {newProject, validateProject} from '../src/projects.mjs';
import {exportProject, importProject} from '../src/project-archive.mjs';
import {TowerWASI} from '../src/wasi-host.mjs';
import {builtins as grammar} from './compiler-fixtures.mjs';
import {guestString} from './guest_text.mjs';
import {moduleText, selectedCases} from './module_case_host.mjs';

const inputs = new URL('./project_storage_cases/inputs/', import.meta.url);
const builtins = {foundation:grammar.foundation, bedrock:grammar.bedrock};
let files, project, archive, directory, imported, pending, error, wasi, memory;

function attempt(operation) {
  error = '';
  try { operation(); }
  catch (failure) { error = failure.message; }
}
function hasPrototype(value, prototype) {
  return value != null && Object.getPrototypeOf(value) === prototype;
}
const check = selectedCases('project_storage_cases', {
  storage_clear_files() { files = []; },
  storage_file(ctx, path, text) { files.push({path:guestString(ctx, path), text:guestString(ctx, text)}); },
  storage_fixture: (ctx, name) => moduleText(ctx, readFileSync(new URL(guestString(ctx, name), inputs), 'utf8')),
  storage_create(ctx, title) {
    const name = guestString(ctx, title);
    attempt(() => { project = newProject(name, builtins, files.length ? files : undefined); });
  },
  storage_link(ctx, name, fixture) {
    project.links[guestString(ctx, name)] = new Uint8Array(readFileSync(new URL(guestString(ctx, fixture), inputs)));
  },
  storage_activate(ctx, path) { project.active = guestString(ctx, path); },
  storage_original_id: ctx => moduleText(ctx, project.id),
  storage_export() { archive = exportProject(project); },
  storage_damage(_ctx, offset, mask) {
    pending = archive.arrayBuffer().then(buffer => {
      const bytes = new Uint8Array(buffer);
      if (offset >= bytes.length) throw new RangeError('Damage offset outside archive');
      bytes[offset] ^= mask;
      archive = new Blob([bytes]);
    });
  },
  storage_blob(ctx, text) { archive = new Blob([guestString(ctx, text)]); },
  storage_import() {
    error = '';
    imported = undefined;
    pending = importProject(archive).then(
      result => { imported = result; },
      failure => { error = failure.message; },
    );
  },
  storage_busy: () => Boolean(pending),
  storage_error: ctx => moduleText(ctx, error),
  storage_duplicate() {
    attempt(() => validateProject({...project, files:[...project.files, ...project.files]}));
  },
  archive_inspect_blob() {
    pending = archive.arrayBuffer().then(buffer => { directory = new DataView(buffer); });
  },
  archive_size: () => directory.byteLength,
  archive_u16: (_ctx, offset) => directory.getUint16(offset, true),
  archive_u32: (_ctx, offset) => directory.getUint32(offset, true),
  archive_name: (ctx, offset, length) =>
    moduleText(ctx, new TextDecoder('utf-8', {fatal:true}).decode(new Uint8Array(directory.buffer, offset, length))),
  archive_is_array: (ctx, group) => Array.isArray(imported[guestString(ctx, group)]),
  archive_array_prototype: (ctx, group) => hasPrototype(imported[guestString(ctx, group)], Array.prototype),
  archive_array_length: (ctx, group) => imported[guestString(ctx, group)].length,
  archive_plain_record: (ctx, group) => hasPrototype(imported[guestString(ctx, group)], Object.prototype),
  archive_plain_file: (_ctx, index) => hasPrototype(imported.files[index], Object.prototype),
  archive_byte_array: (ctx, name) => hasPrototype(imported.links[guestString(ctx, name)], Uint8Array.prototype),
  archive_count: (ctx, group) => Object.keys(imported[guestString(ctx, group)]).length,
  archive_key(ctx, group, index) {
    const name = guestString(ctx, group);
    return moduleText(ctx, name === 'files' ? imported.files[index].path : Object.keys(imported[name])[index]);
  },
  archive_file_fields: (_ctx, index) => Object.keys(imported.files[index]).length,
  archive_file_text: (ctx, index) => moduleText(ctx, imported.files[index].text),
  archive_file_size: (_ctx, index) => Buffer.byteLength(imported.files[index].text),
  archive_field: (ctx, field) => moduleText(ctx, imported[guestString(ctx, field)]),
  archive_builtin: (ctx, name, original) => moduleText(ctx, (original ? builtins : imported.builtins)[guestString(ctx, name)]),
  archive_link_length: (ctx, name) => imported.links[guestString(ctx, name)].length,
  archive_link_byte: (ctx, name, index) => imported.links[guestString(ctx, name)][index],
  drive_mount() { attempt(() => wasi.mountFiles(files)); },
  drive_file_count: () => wasi.files.size,
  drive_has_file: (ctx, path) => wasi.files.has(guestString(ctx, path)),
  drive_type: (ctx, path) => wasi.files.get(guestString(ctx, path)).type,
  drive_text: (ctx, path) => moduleText(ctx, new TextDecoder('utf-8', {fatal:true}).decode(wasi.files.get(guestString(ctx, path)).data)),
  drive_open(ctx, name) {
    const bytes = new TextEncoder().encode(guestString(ctx, name));
    new Uint8Array(memory.buffer).set(bytes, 16);
    const errno = wasi.wasiImport.path_open(3, 0, 16, bytes.length, 0, 0n, 0n, 0, 0);
    if (errno) throw new Error('path_open errno ' + errno);
    return new DataView(memory.buffer).getUint32(0, true);
  },
  drive_has_fd: (_ctx, fd) => wasi.fds.has(fd),
  drive_fd_stat: (_ctx, fd) => wasi.wasiImport.fd_fdstat_get(fd, 0),
}, settleImport);

async function settleImport() {
  try { await pending; }
  finally { pending = undefined; }
}

export async function checkStorage(name) {
  files = [];
  if (name === 'remount') {
    wasi = new TowerWASI();
    memory = new WebAssembly.Memory({initial:1});
    wasi.initialize({exports:{memory}});
  }
  try { await check(name, name === 'archive' ? 10000 : 10); }
  finally {
    await settleImport();
    files = project = archive = directory = imported = error = wasi = memory = undefined;
  }
}
