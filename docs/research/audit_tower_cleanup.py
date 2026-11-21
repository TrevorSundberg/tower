#!/usr/bin/env python3
"""Read-only inventory of repeated cleanup expressions in tracked Tower functions.

Counts are review candidates, not proof of redundant cleanup or ownership.
Use --revision to reproduce a historical inventory without editing any files.
"""
import argparse
from collections import Counter
import json
import subprocess
from audit_tower_loops import ROOT, scan


def inventory(source):
    _, words, pairs, _ = scan(source)
    functions = []
    for i, word in enumerate(words):
        if word != 'fn' or i + 1 >= len(words):
            continue
        start = i + 2
        while start < len(words) and words[start] not in ('{', ';'):
            start += 1
        if start not in pairs:
            continue
        end = pairs[start]
        calls = Counter()
        for k in range(start + 1, end - 1):
            name = words[k]
            if words[k + 1] != '(' or not (name == 'free' or name.endswith(('_dispose', '_destroy'))):
                continue
            depth, stop = 1, k + 2
            while stop < end and depth:
                depth += (words[stop] == '(') - (words[stop] == ')')
                stop += 1
            if stop < end and words[stop] == ';':
                calls[''.join(words[k:stop])] += 1
        repeated = {call: count for call, count in calls.items() if count > 1}
        if repeated:
            functions.append(dict(function=words[i + 1], repeated=repeated,
                                  extra_copies=sum(count - 1 for count in repeated.values())))
    return functions


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--revision')
    args = parser.parse_args()
    revision = subprocess.check_output(['git', 'rev-parse', '--verify', '--end-of-options',
                                       (args.revision or 'HEAD') + '^{commit}'], cwd=ROOT, text=True).strip()
    if args.revision:
        paths = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', revision], cwd=ROOT, text=True).splitlines()
    else:
        paths = subprocess.check_output(['git', 'ls-files'], cwd=ROOT, text=True).splitlines()
    rows = []
    for path in paths:
        if not path.endswith('.tower'):
            continue
        source = subprocess.check_output(['git', 'show', revision + ':' + path], cwd=ROOT, text=True) if args.revision else (ROOT / path).read_text(encoding='utf-8')
        rows.extend(dict(path=path, **row) for row in inventory(source))
    rows.sort(key=lambda row: (-row['extra_copies'], row['path'], row['function']))
    print(json.dumps(dict(revision=revision, functions=len(rows),
                          extra_copies=sum(row['extra_copies'] for row in rows), candidates=rows), indent=2))


if __name__ == '__main__':
    main()
