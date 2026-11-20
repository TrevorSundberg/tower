// The assertions and fixtures are Tower. This runner supplies only the normal
// source capabilities and invokes the focused service test export.
import {readFile} from 'node:fs/promises';
import {loadTower} from '../tests/compiler-fixtures.mjs';
const root = new URL('../../', import.meta.url);
const binary = process.argv[2] ?? new URL('build/browser-wasi/tower.wasm', root);
const source = await readFile(new URL('scaffolding/foundation.tower', root), 'utf8');
const host = await loadTower(await readFile(binary), undefined, source);
if (typeof host.exports.ide_tests !== 'function') throw new Error('Build with -DTOWER_IDE_TESTS=ON');
const result = host.exports.ide_tests();
if (result) throw new Error(`Tower IDE fixture failed: ${result}`);
console.log('Tower IDE fixtures passed');
