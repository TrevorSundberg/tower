#!/usr/bin/env python3
"""Exercise real filesystem imports with an explicit native Tower compiler."""
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

compiler = str(Path(sys.argv[1]).resolve())
sources = Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='tower_imports_') as temporary:
    root = Path(temporary)
    library = root / 'library'
    library.mkdir()
    for name in ('bedrock', 'foundation', 'tower'):
        shutil.copyfile(sources / (name + '.tower'), library / (name + '.tower'))
    def write(name, text):
        path = root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding='utf8')
        return path
    def run(source, output=None, entry='a/b/main.tower'):
        path = write(entry, source)
        result = subprocess.run([compiler, str(path), '--interpret',
            '--foundation', str(library / 'foundation.tower'),
            '--bedrock', str(library / 'bedrock.tower')], capture_output=True, text=True)
        if output is None:
            assert result.returncode != 0, (source, result.stdout, result.stderr)
            assert 'import' in result.stderr.lower(), result.stderr
        else:
            assert result.returncode == 0, (source, result.stderr)
            assert result.stdout == output, (source, result.stdout)
    write('a/one.tower', 'import tower; print(1);')
    write('two.tower', 'import tower; print(2);')
    run('import .one; import ..two;', '1\n2\n')
    write('CaseDir/Exact.tower', 'import tower; print(42);')
    run('import "../../CaseDir/Exact.tower";', '42\n')
    for name in ('casedir/Exact.tower', 'CaseDir/exact.tower', 'CaseDir/Exact.Tower', 'CaseDir/Exact'):
        run(f'import "../../{name}";')
    write('custom folder/a-b.tower', 'import tower; print(9);')
    run('import "../../custom folder/a-b.tower";', '9\n')
    run('import ..CaseDir.Exact; import "../../CaseDir/Exact.tower";', '42\n')
    # Exact library matches win over a differently cased local file, on every OS.
    write('a/b/Helper.tower', 'import tower; print(0);')
    write('library/helper.tower', 'import tower; print(3);')
    run('import helper;', '3\n')
    run('import .helper;')
    write('effects.tower', 'import tower; print(7);')
    try:
        (root / 'alias.tower').symlink_to(root / 'effects.tower')
    except OSError as error:
        print('Symlink fixture unavailable:', error)
    else:
        run('import ..effects; import ..alias;', '7\n7\n')
print('Native module paths passed')
