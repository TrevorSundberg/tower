param(
  [switch]$Trace,
  [switch]$Sanitize,
  [string]$Source,
  [string]$VcVars = "${env:ProgramFiles(x86)}/Microsoft Visual Studio/2022/BuildTools/VC/Auxiliary/Build/vcvars64.bat"
)
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$out = Join-Path $repo 'build/parser-tests'
New-Item -ItemType Directory -Force $out | Out-Null
Copy-Item -LiteralPath "$repo/scaffolding/foundation.tower" -Destination $out
Copy-Item -LiteralPath "$repo/scaffolding/bedrock.tower" -Destination $out
$flags = '/Od /Zi /MDd'
if ($Sanitize) { $flags = '/Od /Zi /MD /fsanitize=address' }
$runArguments = ''
if ($Trace) { $runArguments = '--trace' }
if ($Source) {
  $sourcePath = (Resolve-Path $Source).Path
  $runArguments += " --parse `"$sourcePath`""
}
$batch = @"
@echo off
call "$VcVars" >nul
if errorlevel 1 exit /b 1
cd /d "$out"
cl /nologo /std:c++20 /D_HAS_EXCEPTIONS=0 /utf-8 /UNDEBUG $flags "$repo/scaffolding/tower.cpp" "$repo/scaffolding/parser.cpp" "$repo/scaffolding/parser-tree-tests.cpp" "$repo/scaffolding/syntax.cpp" "$repo/scaffolding/syntax-nodes.cpp" "$repo/scaffolding/bedrock.cpp" "$repo/scaffolding/format.cpp" "$repo/scaffolding/lex-pattern.cpp" "$repo/scaffolding/syntax-tests.cpp" "$repo/scaffolding/core.cpp" "$repo/scaffolding/core-nodes.cpp" "$repo/scaffolding/core-machine.cpp" "$repo/scaffolding/core-tests.cpp" "$PSScriptRoot/main.cpp" /Fe:tower-parser-tests.exe /link /INCREMENTAL:NO
if errorlevel 1 exit /b 1
tower-parser-tests.exe $runArguments
"@
$batch | Set-Content -Encoding ascii (Join-Path $out 'run.cmd')
& $env:ComSpec /d /c (Join-Path $out 'run.cmd')
if ($LASTEXITCODE) { throw "Parser build/tests failed ($LASTEXITCODE)" }
