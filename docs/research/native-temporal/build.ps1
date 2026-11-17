param(
    [string]$Python = "python",
    [string]$VcVars = "${env:ProgramFiles(x86)}/Microsoft Visual Studio/2022/BuildTools/VC/Auxiliary/Build/vcvars64.bat",
    [string]$Out = "build/temporal-native"
)
$ErrorActionPreference = "Stop"
$repo = (Resolve-Path (Join-Path $PSScriptRoot "../../..")).Path
Set-Location $repo
New-Item -ItemType Directory -Force $Out | Out-Null
$outPath = (Resolve-Path $Out).Path
if (!(Test-Path "$outPath/venv/Scripts/python.exe")) {
    & $Python -m venv "$outPath/venv"
    if ($LASTEXITCODE) { throw "venv failed" }
}
& "$outPath/venv/Scripts/python.exe" -m pip install -r "$PSScriptRoot/requirements.txt"
if ($LASTEXITCODE) { throw "dependency install failed" }
& "$outPath/venv/Scripts/python.exe" "$PSScriptRoot/generate.py" --out $outPath
if ($LASTEXITCODE) { throw "LLVM generation failed" }
# This generated batch only invokes compiler tools. No filesystem deletion/moves.
$batch = @"
@echo off
call "$VcVars" >nul
if errorlevel 1 exit /b 1
cl /Bv > "$outPath/compiler-version.txt" 2>&1
cl /nologo /O2 /EHsc /std:c++17 /W4 "$PSScriptRoot/benchmark.cpp" "$outPath/plain.obj" "$outPath/undo.obj" "$outPath/tracked.obj" /Fo"$outPath/runtime.obj" /Fe"$outPath/temporal-native.exe" /link /INCREMENTAL:NO
"@
$batch | Set-Content -Encoding ascii "$outPath/compile.cmd"
& $env:ComSpec /d /c "$outPath/compile.cmd"
if ($LASTEXITCODE) { throw "native build failed" }
& "$outPath/temporal-native.exe" --test
if ($LASTEXITCODE) { throw "native validation failed" }
