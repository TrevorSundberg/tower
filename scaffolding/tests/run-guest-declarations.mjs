// Transport selected W32 Foundation through the same object compiler, linker,
// allocation provider and linear-memory limits as the exported ABI fixture.
import {execFileSync} from 'node:child_process';
import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {builtins, executeWasm, files} from '../../playground/tests/compiler-fixtures.mjs';
import {loadTower} from '../../playground/src/tower-host.mjs';
import {sourceLocation} from '../../playground/src/source-location.mjs';

const [reactor, unit, expected, compiler, linker, ...linkArgs] = process.argv.slice(2);
const entry = '.tower/tests/' + unit + '.tower';
const tower = await loadTower(await readFile(reactor), undefined, builtins.foundation, builtins.foundation,
  builtins.bedrock, {tower:builtins.tower, builtins, project:{entry, files}});
let selected;
try {
  const handle = tower.compileTests({pointerBytes:4});
  try {
    selected = tower.foundation(handle);
    if (!selected.source) throw new Error(JSON.stringify(tower.execute(handle, 1)));
    const count = tower.testCount(handle);
    if (count !== Number(expected)) throw new Error(`${entry} selected ${count}, expected ${expected}`);
  } finally { tower.destroyExecution(handle); }
} finally { tower.close(); }

await writeFile('selected.tower', selected.source);
const foundation = fileURLToPath(new URL('../foundation.tower', import.meta.url));
execFileSync(compiler, ['selected.tower', '--jobs', '1', '--foundation', foundation, '--target',
  'wasm32-unknown-unknown', '--emit', 'object', '-o', 'selected.o'], {stdio:'inherit'});
execFileSync(linker, ['--freestanding', '--no-entry', '--export=tower_main', 'selected.o',
  ...linkArgs, '-o', 'selected.wasm'], {stdio:'inherit'});

const result = await executeWasm({wasm:await readFile('selected.wasm'), sourceMap:selected.sourceMap});
process.stdout.write(result.output);
if (result.status !== 'done') {
  const file = files.find(file => file.path === result.errorFile);
  if (!file) throw new Error(JSON.stringify(result));
  const lines = Buffer.from(file.text).subarray(0, result.errorOffset).toString().split('\n');
  throw new Error(sourceLocation(file.path, lines.length, [...lines.at(-1)].length + 1) + ': ' + result.error);
}
console.error(`${expected} Tower test(s) passed for ${entry} on wasm32`);
