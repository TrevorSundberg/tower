import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {runToEnd} from '../src/tower-host.mjs';
import {builtins as grammar} from './compiler-fixtures.mjs';
import {moduleHost, selectedCases, moduleText as copyText} from './module_case_host.mjs';
import {guestString} from './guest_text.mjs';

const inputs = new URL('./module_resolution_cases/inputs/', import.meta.url);
function fixture(name) {
  if (name === 'examples/functions.tower')
    return readFileSync(new URL('../../scaffolding/' + name, import.meta.url), 'utf8');
  if (!/^[a-z_]+\.(tower|expected)$/.test(name)) throw new Error('Invalid module fixture ' + name);
  return readFileSync(new URL(name, inputs), 'utf8');
}
const file = (path, text) => ({path, text});
let host, wrapper, files, result;
const check = selectedCases('module_resolution_cases', {
  module_fixture: (ctx, name) => copyText(ctx, fixture(guestString(ctx, name))),
  module_builtin: (ctx, name) => copyText(ctx, grammar[guestString(ctx, name)]),
  module_root_files() {
    // Reinstalling the root library also restores its original upload order.
    for (const name of Object.keys(grammar)) files.delete(name + '.tower');
    for (const [name, source] of Object.entries(grammar)) files.set(name + '.tower', source);
  },
  module_put: (ctx, path, text) => { files.set(guestString(ctx, path), guestString(ctx, text)); },
  module_remove: (ctx, path) => { files.delete(guestString(ctx, path)); },
  module_configure(ctx, entry) {
    host.configureModules({entry:guestString(ctx, entry), library:'.',
      files:Array.from(files, ([path, text]) => file(path, text))});
  },
  module_replace_library(ctx, entry) {
    const builtins = Object.fromEntries(Array.from(files, ([path, text]) => [path.slice(0, -'.tower'.length), text]));
    host.configureModules({entry:guestString(ctx, entry), files:[], builtins, replaceBuiltins:true});
  },
  module_install_with_suffix(ctx, suffix) {
    const source = wrapper + guestString(ctx, suffix);
    try { host.configure(source); }
    catch (error) { return copyText(ctx, error.message); }
    return copyText(ctx, '');
  },
  module_execute(ctx, source, dependencies) {
    const handle = host.compile(guestString(ctx, source));
    try {
      result = host.execute(handle, 10000);
      if (dependencies) result.dependencies = host.dependencies();
      if (result.outputTruncated) throw new Error('Truncated module execution output');
    } finally { host.destroyExecution(handle); }
  },
  module_parse(ctx, source, format) {
    const handle = host.create(guestString(ctx, source));
    try {
      result = runToEnd(host, handle).end;
      if (format && result.status === 'done') {
        const formatted = host.format(handle);
        result.formatError = formatted.error;
        result.formatted = formatted.source;
      }
    } finally { host.destroy(handle); }
  },
  module_has_format_error: () => result.formatError !== undefined,
  module_field: (ctx, name) => copyText(ctx, result[guestString(ctx, name)]),
  module_dependency_count: () => result.dependencies.length,
  module_dependency: (ctx, index) => copyText(ctx, result.dependencies[index]),
});

const cases = [
  ['replace_library', 'reused host replaces a complete project library without retaining removed capabilities'],
  ['cold_wrapper', 'cold wrapper imports use the project files and restore the active entry after a failed install'],
  ['renamed_language', 'Tower, Foundation and Bedrock work under ordinary renamed paths'],
  ['nearest_edit', 'tower uses ordinary nearest-file lookup and invalidates cached resolutions after edits'],
  ['missing_cycle', 'tower has no privileged fallback or exemption from import cycles'],
  ['shared_identity', 'dotted and quoted paths share module identity, effects and imported bindings'],
  ['relative_string', 'relative strings are anchored to their importer and normalize either separator'],
  ['format_segments', 'import formatting preserves dotted segments and literal dots, with canonical slash paths'],
  ['invalid_segments', 'dotted imports reject empty segments and report errors from the selected file'],
  ['legacy_grammar', 'saved Bedrock grammars with direct identifier imports remain usable'],
  ['parent_aliases', 'each leading dot moves up one directory, including aliases and cached grammars'],
  ['parent_missing', 'leading-dot imports never fall back to library paths'],
  ['exact_filename', 'quoted imports use the exact complete filename and case, including arbitrary user names'],
  ['format_parents', 'parent import terms, comments and aliases survive repeated formatting'],
];
for (const [entry, name] of cases) test(name, async () => {
  files = new Map();
  wrapper = grammar.foundation;
  let project;
  if (entry === 'cold_wrapper') {
    wrapper += fixture('import_extension.tower');
    project = {entry:'nested/main.tower', library:'.tower', files:[
      file('.tower/extension.tower', fixture('extension.tower')),
      file('nested/extension.tower', fixture('absent.tower')),
      file('nested/sibling.tower', fixture('sibling.tower')),
    ]};
  }
  host = await moduleHost({project, builtins:grammar}, wrapper);
  try { await check(entry, 30); }
  finally { host.close(); host = files = result = undefined; }
});
