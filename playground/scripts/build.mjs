import { build } from 'esbuild';
import { mkdir, copyFile, readFile, writeFile, readdir, rm, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
const root = fileURLToPath(new URL('..', import.meta.url));
const dist = path.join(root, 'dist');
await mkdir(dist, { recursive: true });
// Remove the retired, generated smoke-test worker when updating an older build.
for (const name of ['llvm-worker.js', 'llvm-worker.js.map', 'llvm-worker.js.LEGAL.txt', 'export-worker.js', 'export-worker.js.map', 'syntax-bootstrap.tower', 'core.tower'])
  await rm(path.join(dist, name), { force: true });
await build({ absWorkingDir: root, entryPoints: ['src/app.mjs', 'src/worker.mjs', 'src/execution-worker.mjs', 'src/target-worker.mjs'],
  outdir: dist, bundle: true, format: 'esm', target: 'es2022', minify: true,
  sourcemap: true, outExtension: { '.js': '.js' }, legalComments: 'linked' });
for (const file of ['index.html', 'style.css']) await copyFile(path.join(root, file), path.join(dist, file));
await copyFile(path.join(root, '../build/browser-wasi/tower.wasm'), path.join(dist, 'tower.wasm'));
await copyFile(path.join(root, '../scaffolding/examples/foreach.tower'), path.join(dist, 'foreach.tower'));
await copyFile(path.join(root, '../scaffolding/foundation.tower'), path.join(dist, 'foundation.tower'));
await copyFile(path.join(root, '../scaffolding/bedrock.tower'), path.join(dist, 'bedrock.tower'));
await copyFile(path.join(root, '../scaffolding/examples/tokens.tower'), path.join(dist, 'tokens.tower'));
await copyFile(path.join(root, '../scaffolding/examples/replacements.tower'), path.join(dist, 'replacements.tower'));
// All examples import the single shared foundation module.
for (const name of ['execution', 'functions', 'structs', 'memory']) await writeFile(path.join(dist, name + '.tower'),
  await readFile(path.join(root, '../scaffolding/examples/' + name + '.tower'), 'utf8'));
let llvm = false;
try {
  await copyFile(path.join(root, '../build/browser-wasi-llvm/tower-llvm.wasm'), path.join(dist, 'tower-llvm.wasm'));
  llvm = true;
} catch (error) { if (error.code !== 'ENOENT') throw error; }
let cross = false;
try {
  const crossBytes = await readFile(path.join(root, '../build/browser-wasi-llvm/tower-cross.wasm'));
  await writeFile(path.join(dist, 'tower-cross.wasm.gz'), gzipSync(crossBytes, {level:9}));
  await rm(path.join(dist, 'tower-cross.wasm'), {force:true});
  await cp(path.join(root, '../build/targets'), path.join(dist, 'targets'), { recursive: true });
  cross = true;
} catch (error) { if (error.code !== 'ENOENT') throw error; }
await writeFile(path.join(dist, 'capabilities.json'), JSON.stringify({ llvm, cross }));
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
for (const name of ['@codemirror/view', '@codemirror/state', '@codemirror/commands', '@codemirror/language',
  '@lezer/common', '@lezer/highlight', '@lezer/lr', '@marijn/find-cluster-break', 'crelt', 'style-mod', 'w3c-keyname']) {
  const dir = path.join(root, 'node_modules', name);
  for (const file of await readdir(dir)) if (/^license/i.test(file))
    licenses += `\n${name} — ${file}\n${await readFile(path.join(dir, file), 'utf8')}\n`;
}
await writeFile(path.join(dist, 'THIRD-PARTY-NOTICES.txt'), licenses);
console.log(`Static playground built: ${dist} (LLVM module ${llvm ? 'included' : 'not built'})`);
