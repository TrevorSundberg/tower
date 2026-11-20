#!/usr/bin/env python3
"""Package a generated .brs file for manual Roku developer-mode sideloading."""
import argparse
from pathlib import Path
import zipfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("source", type=Path)
parser.add_argument("output", type=Path)
args = parser.parse_args()
source = args.source.read_text(encoding="utf-8")
if "function TowerRun(" not in source:
    parser.error("input must be Tower-generated Roku BrightScript")
if args.source.resolve() == args.output.resolve():
    parser.error("output must differ from source")
entries = {
    "manifest": "title=Tower Roku program\nmajor_version=1\nminor_version=0\nbuild_version=0\n",
    "source/Main.brs": 'sub Main()\n    print "TOWER_ROKU_BEGIN"\n    TowerRun()\n    print "TOWER_ROKU_END"\nend sub\n',
    "source/program.brs": source,
}
args.output.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(args.output, "w", zipfile.ZIP_DEFLATED) as archive:
    for name, content in entries.items():
        entry = zipfile.ZipInfo(name, (2020, 1, 1, 0, 0, 0))
        entry.compress_type = zipfile.ZIP_DEFLATED
        entry.external_attr = 0o644 << 16
        archive.writestr(entry, content.encode("utf-8"))
print(f"Wrote {args.output}; physical Roku execution remains to be tested.")
