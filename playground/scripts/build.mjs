import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { mkdir, copyFile, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { targets, targetInputs } from '../src/targets.mjs';
const root = fileURLToPath(new URL('..', import.meta.url));
const dist = path.join(root, 'dist');
// The published tool bootstrap runs on Linux. Windows Node keeps its native
// esbuild binding and transports tool invocations through the existing WSL host.
const windows = process.platform === 'win32';
const toolPath = value => windows ? execFileSync('wsl.exe', ['--exec', 'wslpath', '-a', value], {encoding:'utf8'}).trim() : value;
const tool = (command, args, options) => windows ? execFileSync('wsl.exe', ['--exec', command, ...args], options) : execFileSync(command, args, options);
const packager = process.env.TOWER_PLAYGROUND_ASSET_PACKAGER || path.posix.join(tool('bash',
  [toolPath(path.join(root, 'scripts/build-bootstrap.sh')), '--tools', 'package_playground_assets'],
  {encoding:'utf8', stdio:['ignore','pipe','inherit']}).trim(), 'package_playground_assets');
// dist is generated output. Never publish stale optional backends/target packs.
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
// Stamp the bundled object worker (including its WASI host, target and flags).
// Nested workers report the same stamp before their objects can be retained.
const objectHostMarker = 'TOWER_OBJECT_HOST_SHA256'.padEnd(64, '_');
await build({ define: {TOWER_OBJECT_HOST:JSON.stringify(objectHostMarker)}, absWorkingDir: root, entryPoints: ['src/app.mjs', 'src/worker.mjs', 'src/execution-worker.mjs', 'src/target-worker.mjs', 'src/language-worker.mjs', 'src/compiler-build-worker.mjs', 'src/compiler-thread-worker.mjs', 'src/compiler-isolation-worker.mjs'],
  outdir: dist, bundle: true, format: 'esm', target: 'es2022', minify: true,
  sourcemap: true, outExtension: { '.js': '.js' }, legalComments: 'linked' });
const workerPath = path.join(dist, 'compiler-build-worker.js');
const workerText = await readFile(workerPath, 'utf8');
if (!workerText.includes(objectHostMarker)) throw new Error('Missing compiler object host stamp');
const objectHost = createHash('sha256').update(workerText).digest('hex');
await writeFile(workerPath, workerText.replaceAll(objectHostMarker, objectHost));
for (const file of ['index.html', 'style.css', 'CNAME']) await copyFile(path.join(root, file), path.join(dist, file));
await copyFile(path.join(root, '../build/browser-wasi/tower.wasm'), path.join(dist, 'tower.wasm'));
let threads = false;
try {
  await copyFile(path.join(root, '../build/browser-wasi-threads/tower.wasm'), path.join(dist, 'tower-threads.wasm'));
  threads = true;
} catch (error) { if (error.code !== 'ENOENT') throw error; }
if (process.env.TOWER_REQUIRE_THREADS === '1' && !threads)
  throw new Error('Threaded deployment requires build-threads.sh.');
const builtinModules = (await readFile(path.join(root, '../scaffolding/builtin_modules.txt'), 'utf8'))
  .trimEnd().split(/\r?\n/).map(file => file.slice(0, -path.extname(file).length));
for (const name of builtinModules) {
  const destination = path.join(dist, name + '.tower');
  await mkdir(path.dirname(destination), {recursive:true});
  await copyFile(path.join(root, '../scaffolding', name + '.tower'), destination);
}
await writeFile(path.join(dist, 'builtins.json'), JSON.stringify(builtinModules));
let llvm = false;
try {
  await copyFile(path.join(root, '../build/browser-wasi-llvm/tower-llvm.wasm'), path.join(dist, 'tower-llvm.wasm'));
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
  await writeFile(path.join(dist, 'tower-cross.wasm'), crossBytes);
  cross = true;
}
await writeFile(path.join(dist, 'capabilities.json'), JSON.stringify({ llvm, cross, threads }));
if (process.env.TOWER_REQUIRE_BACKENDS === '1' && (!llvm || !cross))
  throw new Error('Full deployment requires both LLVM reactors and target support packs.');
// Produced from the actual native build manifests, including each new Tower port.
// Keep parser-only development builds usable; a publication requires the recipe.
const compilerProject = path.join(root, '../build/compiler-project');
let compilerRecipe;
if (llvm && cross) {
  try { compilerRecipe = JSON.parse(await readFile(path.join(compilerProject,'project.json'),'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
if (process.env.TOWER_REQUIRE_BACKENDS === '1' && !compilerRecipe)
  throw new Error('Full deployment requires the compiler project. Run build-wasm.sh and build-llvm.sh with TOWER_BROWSER_CROSS=ON.');
if (compilerRecipe) {
  await mkdir(path.join(dist,'compiler'),{recursive:true});
  for (const name of ['project.json', ...Object.values(compilerRecipe.reactors).flatMap(reactor => reactor.support)])
    await copyFile(path.join(compilerProject,name),path.join(dist,'compiler',name));
}
let licenses = 'Tower playground: third-party notices\n\n';
for (const [name, file] of [
  ['LLVM / compiler-rt (Apache 2.0 with LLVM exceptions)', '../third_party/llvm-project/llvm/LICENSE.TXT'],
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
tool(packager, [toolPath(dist), toolPath(path.join(root, '../scaffolding/examples'))], {stdio:'inherit'});
console.log(`Static playground built: ${dist} (LLVM module ${llvm ? 'included' : 'not built'})`);
