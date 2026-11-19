#!/usr/bin/env python3
"""Backport WASI SDK 34's first-page symbol to the pinned LLVM 20 linker.

This is third-party linker compatibility, not a Tower native bootstrap. LLVM 20
supports only 64 KiB Wasm pages; use its own WasmPageSize contract. Retire this
backport when updating to an upstream linker that supplies this symbol.
"""
from pathlib import Path
import sys
path = Path(sys.argv[1]) / 'lld/wasm/Driver.cpp'
source = path.read_text()
marker = '  // Tower WASI SDK 34 compatibility: fixed-size first Wasm page.\n'
anchor = '  WasmSym::dsoHandle = symtab->addOptionalDataSymbol("__dso_handle");\n'
patch = (marker + '  if (!ctx.isPic)\n'
         '    if (auto *firstPageEnd = symtab->addOptionalDataSymbol("__wasm_first_page_end"))\n'
         '      firstPageEnd->setVA(WasmPageSize);\n\n')
if marker in source:
    if patch not in source: raise SystemExit('Modified LLD compatibility patch; review required')
else:
    if source.count(anchor) != 1 or '__wasm_first_page_end' in source:
        raise SystemExit('Review LLD first-page compatibility for this LLVM revision')
    path.write_text(source.replace(anchor, patch + anchor))
