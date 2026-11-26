import {after, test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {StringStream} from '@codemirror/language';
import {outputParser} from '../src/output-syntax.mjs';
import {loadTower} from '../src/tower-host.mjs';
import {copyText, guestString} from './guest_text.mjs';
import {runSelectedTest} from './selected_test.mjs';

const root = new URL('../../', import.meta.url);
const directory = 'playground/src/output_syntax_cases/';
const source = path => readFile(new URL(path, root), 'utf8');
const modules = ['bedrock', 'foundation_syntax', 'types', 'foundation', 'tower',
  'library/testing', 'backend/text', 'library/vector'];
const builtins = Object.fromEntries(await Promise.all(modules.map(async name =>
  [name, await source('scaffolding/' + name + '.tower')])));
let tokens = [];
const tower = await loadTower(await readFile(process.env.TOWER_TEST_WASM ||
  new URL('build/browser-wasi/tower.wasm', root)), undefined, builtins.foundation, undefined,
  builtins.bedrock, {builtins, tower:builtins.tower, threads:{capacity:1}, imports:{
    output_tokenize(context, syntax, input) {
      tokens = [];
      let parser;
      try { parser = outputParser(guestString(context, syntax)); }
      catch (error) { return copyText(context, error.message); }
      const state = parser.startState();
      for (const line of guestString(context, input).split('\n')) {
        const stream = new StringStream(line, 4, 2);
        while (!stream.eol()) {
          stream.start = stream.pos;
          const tag = parser.token(stream, state);
          if (stream.pos <= stream.start) return copyText(context, 'Lexer stopped advancing');
          tokens.push([stream.current(), tag]);
        }
      }
      return copyText(context, '');
    },
    output_token_count: () => tokens.length,
    output_token_text: (context, index) => copyText(context, tokens[index][0]),
    output_token_tag: (context, index) => copyText(context, tokens[index][1] ?? ''),
    output_token_join: context => copyText(context, tokens.map(([text]) => text).join('')),
  }});
after(() => tower.close());

const helper = {path:directory + 'tokens.tower', text:await source(directory + 'tokens.tower')};
for (const [name, title] of [
  ['tower', 'Tower output cannot fall back to an independent JavaScript keyword list'],
  ['llvm', 'LLVM raw and optimized syntax includes SSA, metadata, labels and opcodes'],
  ['x86', 'x86 disassembly highlights decoded instructions'],
  ['arm', 'arm disassembly highlights decoded instructions'],
  ['wasm', 'wasm disassembly highlights decoded instructions'],
  ['literal', 'long and hostile display text remains literal and lexer always advances'],
  ['c', 'C highlights types, preprocessing, comments and statements after semicolons'],
  ['prefix', 'prefixed x86 instructions are highlighted'],
]) {
  test(title, async () => {
    const path = directory + name + '_test.tower';
    runSelectedTest(tower, path, 100, {files:[helper, {path, text:await source(path)}]});
  });
}
