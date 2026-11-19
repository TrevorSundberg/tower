import { build } from 'esbuild';
import { mkdir, copyFile, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { targets, targetInputs } from '../src/targets.mjs';
const root = fileURLToPath(new URL('..', import.meta.url));
const dist = path.join(root, 'dist');
// dist is generated output. Never publish stale optional backends/target packs.
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await build({ absWorkingDir: root, entryPoints: ['src/app.mjs', 'src/worker.mjs', 'src/execution-worker.mjs', 'src/target-worker.mjs', 'src/language-worker.mjs'],
  outdir: dist, bundle: true, format: 'esm', target: 'es2022', minify: true,
  sourcemap: true, outExtension: { '.js': '.js' }, legalComments: 'linked' });
for (const file of ['index.html', 'style.css']) await copyFile(path.join(root, file), path.join(dist, file));
await copyFile(path.join(root, '../build/browser-wasi/tower.wasm'), path.join(dist, 'tower.wasm'));
await copyFile(path.join(root, '../scaffolding/examples/foreach.tower'), path.join(dist, 'foreach.tower'));
const builtinModules = ['bedrock', 'foundation', 'tower', ...(await readdir(path.join(root, '../scaffolding/library')))
  .filter(name => name.endsWith('.tower')).sort().map(name => 'library/' + name.slice(0, -6)), 'backend/foreign-grammar'];
for (const name of builtinModules) {
  const destination = path.join(dist, name + '.tower');
  await mkdir(path.dirname(destination), {recursive:true});
  await copyFile(path.join(root, '../scaffolding', name + '.tower'), destination);
}
await writeFile(path.join(dist, 'builtins.json'), JSON.stringify(builtinModules));
await copyFile(path.join(root, '../scaffolding/examples/tokens.tower'), path.join(dist, 'tokens.tower'));
await copyFile(path.join(root, '../scaffolding/examples/replacements.tower'), path.join(dist, 'replacements.tower'));
// Examples declare their own Bedrock, Foundation or Tower dependency.
for (const name of ['execution', 'increment', 'inference', 'templates', 'match', 'collections', 'functions', 'structs', 'memory']) await writeFile(path.join(dist, name + '.tower'),
  await readFile(path.join(root, '../scaffolding/examples/' + name + '.tower'), 'utf8'));
let llvm = false;
try {
  await copyFile(path.join(root, '../build/browser-wasi-llvm/tower-llvm.wasm'), path.join(dist, 'tower-llvm.wasm'));
  await writeFile(path.join(dist, 'tower-llvm.wasm.gz'), gzipSync(await readFile(path.join(dist, 'tower-llvm.wasm')), {level:9}));
  llvm = true;
} catch (error) { if (error.code !== 'ENOENT') throw error; }
let cross = false;
let crossBytes;
try { crossBytes = await readFile(path.join(root, '../build/browser-wasi-llvm/tower-cross.wasm')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
if (crossBytes) {
  // A present compiler with missing support files is a broken build, not an
  // absent optional feature. Copy exactly the inputs declared by each target.
  await mkdir(path.join(dist, 'targets'), {recursive:true});
  for (const target of Object.values(targets)) {
    const inputs = await targetInputs(target, name => readFile(path.join(root, '../build', name)));
    for (const [name, bytes] of Object.entries(inputs)) await writeFile(path.join(dist, 'targets', name), bytes);
  }
  await writeFile(path.join(dist, 'tower-cross.wasm.gz'), gzipSync(crossBytes, {level:9}));
  cross = true;
}
await writeFile(path.join(dist, 'capabilities.json'), JSON.stringify({ llvm, cross }));
if (process.env.TOWER_REQUIRE_BACKENDS === '1' && (!llvm || !cross))
  throw new Error('Full deployment requires both LLVM reactors and target support packs.');
let licenses = 'Tower playground: third-party notices\n\n';
for (const [name, file] of [
  ['LLVM / LLD / compiler-rt (Apache 2.0 with LLVM exceptions)', '../third_party/llvm-project/llvm/LICENSE.TXT'],
  ['libc++ / libc++abi', '../third_party/llvm-project/libcxx/LICENSE.TXT'],
  ['wasi-libc (including musl)', 'licenses/wasi-libc.txt'],
  ['wasi-libc MIT license', 'licenses/wasi-libc-mit.txt'],
  ['musl', 'licenses/musl.txt'],
  ['cloudlibc', 'licenses/cloudlibc.txt'],
  ['musl-fts', 'licenses/musl-fts.txt'],
]) licenses += `\n${name}\n${await readFile(path.join(root, file), 'utf8')}\n`;
for (const name of ['@codemirror/view', '@codemirror/state', '@codemirror/commands', '@codemirror/autocomplete', '@codemirror/language', '@codemirror/streamparser',
  '@lezer/common', '@lezer/highlight', '@lezer/lr', '@marijn/find-cluster-break', 'crelt', 'style-mod', 'w3c-keyname']) {
  const dir = path.join(root, 'node_modules', name);
  for (const file of await readdir(dir)) if (/^license/i.test(file))
    licenses += `\n${name} — ${file}\n${await readFile(path.join(dir, file), 'utf8')}\n`;
}
await writeFile(path.join(dist, 'THIRD-PARTY-NOTICES.txt'), licenses);
await writeFile(path.join(dist, '.nojekyll'), '');
const assets = {};
async function collect(directory) {
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a,b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(file);
    else assets[path.relative(dist, file).split(path.sep).join('/')] =
      createHash('sha256').update(await readFile(file)).digest('hex');
  }
}
await collect(dist);
await writeFile(path.join(dist, 'deployment-manifest.json'), JSON.stringify({assets}, null, 2) + '\n');
console.log(`Static playground built: ${dist} (LLVM module ${llvm ? 'included' : 'not built'})`);
