#!/usr/bin/env python3
"""Inventory tracked Tower loops; optionally migrate a conservative counted subset.

Run from any directory. Default is read-only JSON on stdout. --apply rewrites
only direct `import tower;` users, leaving Foundation and negative fixtures alone.
Candidate counts are lexical opportunities, not proofs or performance estimates.
"""
import argparse
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[2]
TOKEN = re.compile(r'//[^\n]*|/\*[\s\S]*?\*/|"(?:\\.|[^"\\])*"|\x27(?:\\.|[^\x27\\])*\x27|`(?:\\.|[^`\\])*`|[A-Za-z_][A-Za-z_0-9]*|\d+|\+\+|--|==|!=|<=|>=|&&|\|\||[^\s]')


def scan(source):
    tokens = [m for m in TOKEN.finditer(source) if not m[0].startswith(('//', '/*'))]
    words = [m[0] for m in tokens]
    stack, pairs, parents = [], {}, {}
    for i, word in enumerate(words):
        parents[i] = stack[-1] if stack else None
        if word == '{':
            stack.append(i)
        elif word == '}' and stack:
            pairs[stack.pop()] = i
    return tokens, words, pairs, parents


def inventory(path, source):
    tokens, words, pairs, _ = scan(source)
    result = dict(path=path, lines=len(source.splitlines()), tower=bool(re.search(r'\bimport\s+tower\s*;', source)), loops=0, whiles=0, counted=0, indexed=0, declarations=words.count('var'), frees=words.count('free'), allocations=words.count('alloc'))
    result['cleanup_calls'] = sum(word == 'free' or word.endswith(('_dispose', '_destroy')) for i, word in enumerate(words[:-1]) if words[i+1] == '(' and (i == 0 or words[i-1] != 'fn'))
    result['vector_calls'] = sum(word.startswith('vector_') for i, word in enumerate(words[:-1]) if words[i+1] == '(' and (i == 0 or words[i-1] != 'fn'))
    for i, word in enumerate(words):
        if word not in ('loop', 'while'):
            continue
        j = i + 1
        while j < len(words) and words[j] not in ('{', ';'):
            j += 1
        if j not in pairs:
            continue
        result['loops' if word == 'loop' else 'whiles'] += 1
        body = words[j + 1:pairs[j]]
        if len(body) < 3 or body[-2] not in ('++', '--') or body[-1] != ';' or words[pairs[j]-4] not in (';', '{', '}'):
            continue
        result['counted'] += 1
        if any(body[k:k+3] == ['[', body[-3], ']'] for k in range(len(body)-2)):
            result['indexed'] += 1
    return result


def rewrite_once(source):
    tokens, words, pairs, parents = scan(source)
    # Inner loops first, then rescan so original offsets can never become stale.
    for i in range(len(words)-1, -1, -1):
        kind = words[i]
        if kind not in ('loop', 'while'):
            continue
        opening = i + 1
        while opening < len(words) and words[opening] not in ('{', ';'):
            opening += 1
        if opening not in pairs:
            continue
        end = pairs[opening]
        if words[end-2] not in ('++', '--') or words[end-1] != ';' or words[end-4] not in (';', '{', '}'):
            continue
        counter = words[end-3]
        if not re.fullmatch('[A-Za-z_][A-Za-z_0-9]*', counter):
            continue
        body_start = opening + 1
        if kind == 'while':
            condition = source[tokens[i+1].start():tokens[opening].start()].strip()
        else:
            # Exactly one temporary and one guard. Do not move other work/effects.
            if words[body_start] != 'var' or words[body_start+2] != '=':
                continue
            temporary = words[body_start+1]
            semi = body_start + 3
            while semi < end and words[semi] != ';':
                semi += 1
            guard = semi + 1
            negated = words[guard:guard+3] == ['if', '!', temporary]
            positive = words[guard:guard+2] == ['if', temporary]
            if not negated and not positive:
                continue
            block = guard + (3 if negated else 2)
            if words[block:block+4] != ['{', 'break', ';', '}']:
                continue
            if words[body_start:end].count(temporary) != 2:
                continue
            condition = source[tokens[body_start+3].start():tokens[semi].start()].strip()
            if positive:
                simple = re.fullmatch(r'([A-Za-z_][\w.]*|\d+)\s*(==|!=|<=|>=|<|>)\s*([A-Za-z_][\w.]*|\d+)', condition)
                if simple:
                    inverse = {'==':'!=', '!=':'==', '<':' >= ', '>':' <= ', '<=':'>', '>=':'<'}
                    condition = f'{simple[1]} {inverse[simple[2]].strip()} {simple[3]}'
                else:
                    condition = f'!({condition})'
            body_start = block + 4
        # Continue used to skip the tail update. Moving it into a for header
        # would change that behavior, even when the continue is nested in an if.
        body = words[body_start:end-3]
        if 'continue' in body:
            continue
        if any(body[k] == counter and k+1 < len(body) and body[k+1] in ('=', '++', '--', '+', '-', '*', '/', '%', '&', '|', '^') and (body[k+1] in ('=', '++', '--') or k+2 < len(body) and body[k+2] == '=') for k in range(len(body))):
            continue
        if any(body[k:k+2] in (['++', counter], ['--', counter]) for k in range(len(body)-1)):
            continue
        begin = tokens[i].start()
        initial = ''
        # Narrow initializer scope only if no later use or escaped address exists.
        if i > 0 and words[i-1] == ';':
            declaration = i - 2
            while declaration >= 0 and words[declaration] not in (';', '{', '}'):
                declaration -= 1
            declaration += 1
            parent = parents[i]
            scope_end = pairs.get(parent, len(words))
            # Any address operation in the header/body conservatively prevents
            # shortening the local's lifetime, including &(counter). Module-level
            # variables may also be imported elsewhere, even without a local use.
            escaped = '&' in words[i+1:end-3] or 'bitand' in words[i+1:end-3]
            if parent is not None and words[declaration:declaration+2] == ['var', counter] and counter not in words[end+1:scope_end] and not escaped:
                initial = source[tokens[declaration].start():tokens[i-1].start()]
                begin = tokens[declaration].start()
        # Retain comments exactly: skip a transformation if removing scaffolding
        # would consume a comment. Comments in the retained body remain untouched.
        prefix = source[begin:tokens[body_start].start()]
        tail = source[tokens[end-3].start():tokens[end].start()]
        if any(mark in prefix or mark in tail for mark in ('//', '/*')):
            continue
        step = source[tokens[end-3].start():tokens[end-1].start()]
        line_start = source.rfind('\n', 0, tokens[i].start()) + 1
        indent = source[line_start:tokens[i].start()]
        if indent.strip():
            continue
        # Preserve the body, including trailing comments and original indentation.
        body_text = source[tokens[body_start].start():tokens[end-3].start()].rstrip()
        replacement = f'for ({initial}; {condition}; {step}) {{'
        if body_text:
            replacement += '\n' + indent + '    ' + body_text
        replacement += '\n' + indent + '}'
        return source[:begin] + replacement + source[tokens[end].end():], True
    return source, False


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--revision', help='Audit a historical commit without changing the checkout')
    args = parser.parse_args()
    if args.apply and args.revision:
        parser.error('--revision is read-only')
    revision = subprocess.check_output(['git','rev-parse','--verify','--end-of-options',(args.revision or 'HEAD')+'^{commit}'],cwd=ROOT,text=True).strip()
    if args.revision:
        paths = [path for path in subprocess.check_output(['git','ls-tree','-r','--name-only',revision],cwd=ROOT,text=True).splitlines() if path.endswith('.tower')]
    else:
        paths = subprocess.check_output(['git', 'ls-files', '*.tower'], cwd=ROOT, text=True).splitlines()
    rows, changed = [], []
    for path in paths:
        file = ROOT / path
        source = subprocess.check_output(['git','show',revision+':'+path],cwd=ROOT,text=True) if args.revision else file.read_text(encoding='utf-8')
        row = inventory(path, source)
        rows.append(row)
        if not row['tower'] or '/semantic_invalid/' in path or '/syntax_invalid/' in path:
            continue
        original, count = source, 0
        while True:
            source, rewritten = rewrite_once(source)
            if not rewritten:
                break
            count += 1
        if count:
            changed.append(dict(path=path, loops=count, lines_removed=len(original.splitlines())-len(source.splitlines())))
            if args.apply:
                file.write_text(source, encoding='utf-8', newline='\n')
    summary = {key:sum(row[key] for row in rows) for key in ('lines','loops','whiles','counted','indexed','declarations','frees','allocations','cleanup_calls','vector_calls')}
    summary.update(files=len(rows), tower_files=sum(row['tower'] for row in rows), counted_files=sum(row['counted']>0 for row in rows))
    print(json.dumps(dict(revision=revision, summary=summary, migrations=changed, files=rows), indent=2))


if __name__ == '__main__':
    main()
