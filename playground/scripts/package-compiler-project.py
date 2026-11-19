#!/usr/bin/env python3
"""Package the real CMake Tower units and transitional native link support.

As C++ is ported, add its .tower imports to the owning Compose*.cmake manifest
and remove its native object from that target. This pack then follows the actual
build automatically. Never call the remaining project-owned support third-party
or claim a standalone Tower compiler until that support has been retired.
"""
import argparse
import gzip
import json
from pathlib import Path
import re
import shlex
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[2]
SOURCES = ROOT / 'scaffolding'
UNIT_SOURCES = {
    'tower-compiler-utf8.o': 'compiler/utf8.tower',
    'tower-compiler-bytes.o': 'library/bytes.tower',
    'tower-shared-lifecycle.o': 'host/entity-lifecycle.tower',
}

def run(args, cwd):
    return subprocess.check_output([str(a) for a in args], cwd=cwd, text=True)


def exports(wasm):
    data = wasm.read_bytes()
    def uint(at):
        value = shift = 0
        while True:
            byte = data[at]; at += 1
            value |= (byte & 127) << shift
            if byte < 128: return value, at
            shift += 7
    at = 8
    while at < len(data):
        kind = data[at]; size, start = uint(at + 1); at = start + size
        if kind != 7: continue
        count, pos = uint(start); names = []
        for _ in range(count):
            size, pos = uint(pos); name = data[pos:pos+size].decode(); pos += size
            kind = data[pos]; _, pos = uint(pos+1)
            if kind == 0: names.append(name)
        return names
    raise ValueError('No Wasm exports')


def package(builds, destination):
    destination.mkdir(parents=True, exist_ok=True)
    files = {p.relative_to(SOURCES).as_posix(): p.read_text() for folder in ['compiler','host','backend','library']
             for p in (SOURCES/folder).rglob('*.tower')}
    files.update({n+'.tower': (SOURCES/(n+'.tower')).read_text() for n in ['bedrock','foundation','tower']})
    units, reactors = {}, {}
    for name, build, target, binary in builds:
        command = next(line for line in reversed(run(['ninja','-t','commands',target], build).splitlines()) if ' -o ' + binary + ' ' in line)
        command = command.split('&&')[1].strip() if '&&' in command else command
        driver = shlex.split(command)
        result = subprocess.run([*driver, '-###'], cwd=build, text=True, capture_output=True, check=True)
        linker = next(shlex.split(line) for line in result.stderr.splitlines() if 'wasm-ld' in line)
        sdk = Path(linker[0]).parent
        tower_objects = []
        native = []
        for arg in linker[1:]:
            if arg.endswith(('.o','.obj','.a')):
                path = Path(arg); path = path if path.is_absolute() else build/path
                if path.name in UNIT_SOURCES or path.name.startswith(('tower-compiler-', 'tower-backend-')) and path.suffix == '.o':
                    tower_objects.append(path)
                elif path.name == 'libtower-compiler-memory.a':
                    # The host Tower object shares this archive with a temporary
                    # native allocator. Rebuild the former, retain only the latter.
                    for member in run([sdk/'llvm-ar','t',path], build).splitlines():
                        if member == 'tower-compiler-host.o':
                            tower_objects.append(build/member)
                        else:
                            out = destination/(name+'-'+member)
                            out.write_bytes(subprocess.check_output([str(sdk/'llvm-ar'),'p',str(path),member]))
                            native.append(str(out))
                else: native.append(str(path))
            elif arg.startswith(('-L','-l')):
                native.append(arg)
        names = []
        for obj in tower_objects:
            key = obj.stem.removeprefix('tower-')
            entry = 'units/'+key+'.tower'
            if obj.name in UNIT_SOURCES:
                text = 'import tower;\nimport "../'+UNIT_SOURCES[obj.name][:-6]+'";\n'
            else:
                text = obj.with_suffix('.tower').read_text()
                # Expanded backend manifests contain the same ordinary imports.
                def relative(match):
                    imported = (build / (match[1]+'.tower')).resolve()
                    return 'import "../'+imported.relative_to(SOURCES).as_posix()[:-6]+'";'
                text = re.sub(r'import "([^"]+)";', relative, text)
            files[entry] = ('// Compiler build unit. Imports define its complete source closure.\n'
                            '// Add newly ported .tower modules to the owning CMake import manifest;\n'
                            '// the published project follows it. Browser edits to these imports also rebuild.\n'+text)
            units[key] = {'entry':entry, 'object':key+'.o'}
            names.append(key)
        # wasm-ld deliberately rejects -r with --undefined. Select the archive
        # closure explicitly instead, seeded by BOTH native and Tower objects.
        # Keep the Tower implementations out of the prebuilt support artifact.
        support_files = []
        support_size = 0
        paths, directories, libraries = [], [], []
        for arg in native:
            if arg.startswith('-L'): directories.append(Path(arg[2:]))
            elif arg.startswith('-l'): libraries.append(arg[2:])
            else: paths.append(Path(arg))
        for library in libraries:
            paths.append(next(d/('lib'+library+'.a') for d in directories if (d/('lib'+library+'.a')).exists()))
        defined, needed, members, symbols = set(), set(), {}, {}
        def read_symbols(path):
            return run([sdk/'llvm-nm','-A','-P','--extern-only',path],build).splitlines()
        for obj in [*tower_objects,*(p for p in paths if p.suffix != '.a')]:
            for line in read_symbols(obj):
                fields = line.split(': ',1)[-1].split()
                if len(fields)<2: continue
                symbol, kind = fields[:2]
                if kind == 'U': needed.add(symbol.removeprefix('__real_'))
                elif kind not in ('w','v'): defined.add(symbol)
        for archive in (p for p in paths if p.suffix == '.a'):
            for line in read_symbols(archive):
                match = re.match(r'.*\[([^]]+)\]: (\S+) (\S+) ',line)
                if not match: continue
                member,symbol,kind = match.groups(); key=(archive,member)
                defs,refs=members.setdefault(key,(set(),set()))
                if kind=='U': refs.add(symbol.removeprefix('__real_'))
                elif kind not in ('w','v'):
                    defs.add(symbol); symbols.setdefault(symbol,key)
        selected=set()
        while True:
            pending=sorted(needed-defined)
            chosen=[symbols[s] for s in pending if s in symbols and symbols[s] not in selected]
            if not chosen: break
            for key in chosen:
                selected.add(key); defs,refs=members[key]; defined.update(defs); needed.update(refs)
        with tempfile.TemporaryDirectory(prefix='tower-support-') as temp:
            objects=[str(p) for p in paths if p.suffix != '.a']
            for i,(archive,member) in enumerate(sorted(selected)):
                output=Path(temp)/(str(i)+'.o')
                output.write_bytes(subprocess.check_output([str(sdk/'llvm-ar'),'p',str(archive),member]))
                objects.append(str(output))
            chunks = [[]]; size = 0
            for obj in objects:
                amount = Path(obj).stat().st_size
                if size + amount > 24*1024*1024 and chunks[-1]: chunks.append([]); size = 0
                chunks[-1].append(obj); size += amount
            for i,chunk in enumerate(chunks):
                support = destination/('support-'+name+'-'+str(i)+'.a')
                # Preserve original import/export-name metadata. A partial -r
                # link loses export aliases required by the browser ABI.
                if support.exists(): support.unlink()
                run([sdk/'llvm-ar','rcsD',support,*chunk],build)
                data = support.read_bytes()
                if len(data) > 64*1024*1024: raise ValueError('Support chunk exceeds the 64 MiB input limit')
                support_size += len(data)
                packed = support.name+'.gz'
                (destination/packed).write_bytes(gzip.compress(data,compresslevel=9,mtime=0))
                support_files.append(packed); support.unlink()
        for item in destination.glob(name+'-*.obj'): item.unlink()
        args = ['wasm-ld','--no-entry','--export-memory','--stack-first','--threads=1','-z',
                'stack-size=8388608','--initial-memory=33554432','--max-memory=2147483648','--strip-all']
        args += ['--export-if-defined='+symbol for symbol in exports(build/binary)]
        # Upstream ABI wraps are part of the exact target recipe.
        for arg in linker:
            if arg.startswith('@'):
                args += shlex.split((build/arg[1:]).read_text())
            elif arg.startswith('--wrap='): args.append(arg)
        args += [units[key]['object'] for key in names]+['--whole-archive']+[p[:-3] for p in support_files]+['--no-whole-archive','-o','tower-output.bin']
        reactors[name] = {'units':names,'support':support_files,'arguments':args,'supportBytes':support_size,'exports':exports(build/binary)}
        print(name, support_size, 'support bytes;', len(names), 'Tower units')
    entry = 'units/compiler-parser-nodes.tower'
    files[entry] = ('// Tower Compiler: editable compiler, interpreter, host and LLVM backend source.\n'
                    '// import tower resolves the project file tower.tower, not the compiler binary.\n'
                    '// Its ordinary imports load foundation.tower and then bedrock.tower.\n'
                    '// The running compiler builds the next compiler generation from these files.\n'
                    '// Rebuild compiler compiles each import unit and links fresh Wasm reactors.\n'
                    '// New compiler generations are tested before use; Reset compiler recovers the original.\n'
                    '// Transitional native support still supplies adapters/runtime and upstream LLVM/LLD.\n'
                    '// Continue adding ports to Compose*.cmake and removing their native target sources.\n'
                    '// The endpoint is all project-owned code in Tower with standalone build recipes.\n\n'+files[entry])
    recipe = {'version':1,'entry':entry,'units':list(units.values()),'reactors':reactors,
              'files':[{'path':entry,'text':files.pop(entry)}]+[{'path':p,'text':t} for p,t in sorted(files.items())]}
    (destination/'project.json').write_text(json.dumps(recipe))

if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--parser-build',type=Path,required=True)
    parser.add_argument('--llvm-build',type=Path,required=True)
    parser.add_argument('--output',type=Path,default=ROOT/'build/compiler-project')
    a=parser.parse_args()
    package([('tower',a.parser_build.resolve(),'tower-browser','tower.wasm'),
             ('llvm',a.llvm_build.resolve(),'tower-browser-llvm','tower-llvm.wasm'),
             ('cross',a.llvm_build.resolve(),'tower-browser-cross','tower-cross.wasm')], a.output.resolve())
