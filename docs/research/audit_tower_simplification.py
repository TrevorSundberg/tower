#!/usr/bin/env python3
"""Read-only inventory of Tower simplification opportunities, not rewrite proofs.

Counts exclude comments/strings via the existing lexical scanner. --revision
reproduces a committed snapshot. Candidate lists carry source locations for review.
"""
import argparse
from collections import Counter
import json
import re
import subprocess
from audit_tower_loops import ROOT, scan

GENERATED = re.compile(r'(?:step\d+|returned_\d+|[A-Za-z_]+_condition\d+)\Z')


def inventory(path, source):
    tokens, words, braces, parents = scan(source)
    metrics = Counter(files=1, lines=len(source.splitlines()))
    tower = any(words[i:i + 3] == ['import', 'tower', ';'] for i in range(len(words) - 2))
    rows = []

    def add(kind, index, **details):
        metrics[kind] += 1
        rows.append(dict(kind=kind, path=path, line=source.count('\n', 0, tokens[index].start()) + 1, **details))

    # Pair parentheses and brackets separately from lexical blocks.
    pairs, stack = {}, []
    for i, word in enumerate(words):
        if word in ('(', '['):
            stack.append(i)
        elif word in (')', ']') and stack and words[stack[-1]] == {')': '(', ']': '['}[word]:
            pairs[stack.pop()] = i
    functions = []
    for i, word in enumerate(words[:-2]):
        if word != 'fn':
            continue
        end = i + 2
        while end < len(words) and words[end] not in ('{', ';'):
            end += 1
        if end in braces:
            functions.append((end, braces[end], words[i + 1]))
    metrics['functions'] = len(functions)
    metrics['tower_files' if tower else 'other_files'] = 1
    metrics['tower_lines' if tower else 'other_lines'] = metrics['lines']
    if not tower:
        return metrics, rows

    for start, end, function in functions:
        uses = Counter(words[start + 1:end])
        locals_ = Counter(words[i + 1] for i in range(start + 1, end - 1) if words[i] == 'var')
        expression_sites = set()
        for i in range(start + 1, end - 2):
            if words[i] == 'var':
                metrics['locals'] += 1
                name = words[i + 1]
                semi = i + 2
                while semi < end and words[semi] not in (';', '{', '}'):
                    semi += 1
                if semi == end or words[semi] != ';':
                    continue
                declaration = words[i:semi]
                if GENERATED.fullmatch(name):
                    metrics['generated_locals'] += 1
                    if uses[name] == 2 and locals_[name] == 1 and '=' in declaration:
                        add('single_use_generated', i, name=name, function=function)
                        expression_sites.add(i)
                        # Adjacent use is still not permission to move evaluation:
                        # calls, alias writes, address-taking and short-circuit
                        # contexts must be checked semantically before rewriting.
                        next_end = semi + 1
                        while next_end < end and words[next_end] not in (';', '{', '}'):
                            next_end += 1
                        if name in words[semi + 1:next_end]:
                            add('adjacent_generated', i, name=name, function=function,
                                typed=words[i + 2] == ':')
                if semi + 3 < end and words[semi + 1] == 'if' and '=' in declaration:
                    j = semi + 2
                    if words[j] == '!':
                        j += 1
                    if words[j:j + 2] == [name, '{'] and uses[name] == 2 and locals_[name] == 1:
                        add('single_use_if_guard', i, name=name, function=function)
                        expression_sites.add(i)

            if words[i] == 'if':
                opening = i + 1
                while opening < end and words[opening] not in ('{', ';', '}'):
                    opening += 1
                closing = braces.get(opening)
                if closing is not None:
                    if closing == opening + 1 and words[closing + 1:closing + 3] == ['else', '{']:
                        add('empty_success_branch', i, function=function)
                    condition = words[i + 1:opening]
                    name = condition[-1] if condition else ''
                    if condition in ([name], ['!', name]) and re.fullmatch(r'[A-Za-z_]\w*', name):
                        tail = words[closing - 4:closing]
                        body = words[opening + 1:closing]
                        if len(tail) == 4 and tail[0] == name and tail[1] == '=' and tail[3] == ';' and not any(w in body for w in ('if', 'loop', 'while', 'for', 'return', 'break', 'continue', 'defer')):
                            add('guarded_boolean_assignment', i, function=function, name=name)

            if words[i + 1] == '(' and words[i] not in ('fn', 'if', 'for', 'while') and words[i - 1] != 'fn':
                name = words[i]
                metrics['calls'] += 1
                if name.startswith(('vector_', 'stack_', 'queue_')):
                    add('collection_call', i, function=function, callee=name)
                if name == 'fill' and i + 1 in pairs:
                    args = words[i + 2:pairs[i + 1]]
                    if 'sizeof' in args and '0' in args:
                        add('zero_fill_sizeof', i, function=function)

            if words[i] in ('loop', 'while', 'for'):
                opening = i + 1
                while opening < end and words[opening] != '{':
                    opening += 1
                if opening not in braces:
                    continue
                closing = braces[opening]
                body = words[opening + 1:closing]
                kind = words[i]
                metrics[kind + '_loops'] += 1
                if kind != 'for' or words[i + 1] != '(' or i + 1 not in pairs:
                    continue
                header = words[i + 2:pairs[i + 1]]
                semis = [k for k, word in enumerate(header) if word == ';']
                if len(semis) != 2:
                    continue
                update = header[semis[1] + 1:]
                counter = update[0] if len(update) == 2 and update[1] == '++' else None
                if counter is None or sum(word == counter for word in body) == 0:
                    continue
                occurrences = [k for k, word in enumerate(body) if word == counter]
                indexed = [k for k in occurrences if k > 0 and k + 1 < len(body) and body[k - 1:k + 2] == ['[', counter, ']']]
                if indexed:
                    add('indexed_for', i, function=function, counter=counter)
                if indexed and len(indexed) == len(occurrences):
                    add('index_only_for', i, function=function, counter=counter)
                    bases = set()
                    for k in indexed:
                        at = k - 2
                        before = at
                        while before >= 2 and body[before - 1] == '.' and re.fullmatch(r'[A-Za-z_]\w*', body[before - 2]):
                            before -= 2
                        bases.add(''.join(body[before:at + 1]))
                    if len(bases) == 1:
                        base = next(iter(bases))
                        add('one_storage_index_only_for', i, function=function, counter=counter, storage=base)
                        condition = ''.join(header[semis[0] + 1:semis[1]])
                        initializer = ''.join(header[:semis[0]])
                        receiver = base[:-5] if base.endswith('.data') else None
                        if receiver and condition in (counter + '<' + receiver + '.length', counter + '!=' + receiver + '.length') and initializer.startswith('var' + counter) and initializer.endswith('=0') and not any(body[k:k + 2] == ['var', counter] for k in range(len(body) - 1)):
                            add('fresh_collection_for', i, function=function, counter=counter, receiver=receiver)

        metrics['distinct_expression_locals'] += len(expression_sites)

    # Direct scalar field-assignment runs are evidence for initializer syntax,
    # not a claim that the receiver is fresh, plain data, or fully initialized.
    i = 0
    while i + 4 < len(words):
        if not (re.fullmatch(r'[A-Za-z_]\w*', words[i]) and words[i + 1] == '.' and words[i + 3] == '='):
            i += 1
            continue
        name, at, count = words[i], i, 0
        while at + 4 < len(words) and words[at:at + 2] == [name, '.'] and words[at + 3] == '=':
            semi = at + 4
            while semi < len(words) and words[semi] not in (';', '{', '}'):
                semi += 1
            if semi == len(words) or words[semi] != ';':
                break
            count += 1
            at = semi + 1
        if count >= 3:
            add('field_assignment_run', i, receiver=name, assignments=count)
            metrics['field_assignments_in_runs'] += count
        i = max(i + 1, at)
    return metrics, rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--revision')
    parser.add_argument('--output', help='Write detailed JSON to a report file instead of stdout')
    args = parser.parse_args()
    revision = subprocess.check_output(['git', 'rev-parse', '--verify', '--end-of-options',
                                       (args.revision or 'HEAD') + '^{commit}'], cwd=ROOT, text=True).strip()
    paths = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', revision] if args.revision else ['git', 'ls-files'], cwd=ROOT, text=True).splitlines()
    total, areas, files, candidates = Counter(), {}, [], []
    for path in paths:
        if not path.endswith('.tower') or path.startswith('third_party/'):
            continue
        source = subprocess.check_output(['git', 'show', revision + ':' + path], cwd=ROOT, text=True) if args.revision else (ROOT/path).read_text(encoding='utf-8')
        metrics, rows = inventory(path, source)
        total.update(metrics)
        area = '/'.join(path.split('/')[:2])
        areas.setdefault(area, Counter()).update(metrics)
        files.append(dict(path=path, **metrics))
        candidates.extend(rows)
    result = dict(revision=revision, working_tree=not bool(args.revision), totals=total, areas=areas,
                  files=sorted(files, key=lambda row: -row.get('single_use_generated', 0)), candidates=candidates)
    report = json.dumps(result, indent=2) + '\n'
    if args.output:
        from pathlib import Path
        Path(args.output).write_text(report, encoding='utf-8')
        print(json.dumps(dict(revision=revision, totals=total, areas=areas), indent=2))
    else:
        print(report, end='')


if __name__ == '__main__':
    main()
