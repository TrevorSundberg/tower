import {test} from 'node:test';
import {readFileSync, readdirSync} from 'node:fs';
import path from 'node:path';
import {refreshCompilerSources} from '../src/projects.mjs';
import {selectedCases, moduleText as copyText} from './module_case_host.mjs';
import {guestString} from './guest_text.mjs';

const scaffolding = new URL('../../scaffolding/', import.meta.url);
const fixtures = new URL('./fixtures/', import.meta.url);
function towerFiles(root, dir = '') {
  const files = [];
  for (const entry of readdirSync(new URL(dir, root), {withFileTypes:true})) {
    const name = dir + entry.name;
    if (entry.isDirectory()) files.push(...towerFiles(root, name + '/'));
    else if (name.endsWith('.tower')) files.push(name);
  }
  return files;
}

let paths, available, source, matches, project, recipe;
const check = selectedCases('module_path_names_cases', {
  path_count: () => paths.length,
  path_source_count: () => available.size,
  path_name: (ctx, index) => copyText(ctx, paths[index]),
  path_available: (ctx, name) => available.has(guestString(ctx, name)),
  path_local(ctx, importer, target) {
    const dir = path.posix.dirname(guestString(ctx, importer));
    return copyText(ctx, path.posix.normalize(path.posix.join(dir, guestString(ctx, target))));
  },
  path_read(ctx, file) { source = readFileSync(new URL(guestString(ctx, file), scaffolding), 'utf8'); },
  // Run the supplied ECMAScript multiline expression on the actual file.
  path_scan(ctx, expression) {
    matches = Array.from(source.matchAll(new RegExp(guestString(ctx, expression), 'gm')));
    return matches.length;
  },
  path_capture: (ctx, index, group) => copyText(ctx, matches[index][group]),
  upgrade_open(ctx, saved, update) {
    const read = pointer => {
      const name = guestString(ctx, pointer);
      if (!/^[a-z_]+\.json$/.test(name)) throw new Error('Invalid upgrade fixture ' + name);
      return JSON.parse(readFileSync(new URL('./module_path_names_cases/' + name, import.meta.url), 'utf8'));
    };
    project = read(saved);
    recipe = read(update);
  },
  upgrade_refresh() { refreshCompilerSources(project, recipe); },
  upgrade_count: () => project.files.length,
  upgrade_keys: (_ctx, index) => Object.keys(project.files[index]).length,
  upgrade_field: (ctx, index, key) => copyText(ctx, project.files[index][guestString(ctx, key)]),
  upgrade_active: ctx => copyText(ctx, project.active),
});

test('every owned Tower source path has an ordinary dotted import spelling', async () => {
  const files = towerFiles(scaffolding);
  available = new Set(files);
  paths = [...files, ...towerFiles(fixtures).map(name => 'playground/tests/fixtures/' + name)];
  try { await check('owned_paths', 2000); }
  finally { paths = available = source = matches = undefined; }
});

test('compiler project upgrades retire unchanged old names and preserve edits', async () => {
  try { await check('upgrade'); }
  finally { project = recipe = undefined; }
});
