param(
  [switch]$Trace,
  [switch]$Sanitize,
  [switch]$Optimize,
  [string]$Source,
  [string]$BootstrapCompiler = $env:TOWER_BOOTSTRAP_COMPILER,
  [string]$VcVars = "${env:ProgramFiles(x86)}/Microsoft Visual Studio/2022/BuildTools/VC/Auxiliary/Build/vcvars64.bat"
)
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$out = Join-Path $repo 'build/parser-tests'
New-Item -ItemType Directory -Force $out | Out-Null
Copy-Item -LiteralPath "$repo/scaffolding/foundation.tower" -Destination $out
Copy-Item -LiteralPath "$repo/scaffolding/bedrock.tower" -Destination $out
# Build the same Tower modules as CMake's Linux/Wasm targets. A native Windows
# compiler can be supplied; otherwise use the transitional WSL host compiler.
if (-not $BootstrapCompiler) {
  $wslRepo = (& wsl --exec wslpath -u $repo.Replace('\', '/')).Trim()
  if ($LASTEXITCODE) { throw 'Unable to resolve the checkout in WSL' }
  # Windows PowerShell treats native stderr as errors even for CMake status lines.
  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $hostCompiler = (& wsl --exec bash "$wslRepo/playground/scripts/build-bootstrap.sh" 2> "$out/bootstrap-build.log").Trim()
    $bootstrapExit = $LASTEXITCODE
  } finally { $ErrorActionPreference = $previousPreference }
  if ($bootstrapExit) { throw "Bootstrap build failed; see $out/bootstrap-build.log" }
  $hostCompiler | Set-Content -Encoding ascii "$out/bootstrap-path.txt"
  @'
$ErrorActionPreference = 'Stop'
$compiler = (Get-Content -LiteralPath "$PSScriptRoot/bootstrap-path.txt" -Raw).Trim()
$converted = @($args | ForEach-Object {
  if ($_ -match '^([A-Za-z]):[\\/](.*)$') {
    '/mnt/' + $Matches[1].ToLowerInvariant() + '/' + $Matches[2].Replace('\', '/')
  } else { $_ }
})
& wsl --exec $compiler @converted
exit $LASTEXITCODE
'@ | Set-Content -Encoding utf8 "$out/host-bootstrap.ps1"
  @'
@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0host-bootstrap.ps1" %*
exit /b %errorlevel%
'@ | Set-Content -Encoding ascii "$out/host-bootstrap.cmd"
  $BootstrapCompiler = "$out/host-bootstrap.cmd"
}
$BootstrapCompiler = (Resolve-Path -LiteralPath $BootstrapCompiler).Path
$flags = '/Od /Zi /MDd'
if ($Sanitize) { $flags = '/Od /Zi /MD /fsanitize=address' }
if ($Optimize) { $flags = $flags.Replace('/Od', '/O2') }
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
cmake -S "$repo" -B "$out/cmake" -G Ninja -DTOWER_PARSER_ONLY=ON -DCMAKE_CXX_COMPILER=cl -DCMAKE_BUILD_TYPE= -DCMAKE_CXX_FLAGS="$flags" -DTOWER_BOOTSTRAP_COMPILER="$BootstrapCompiler" -DTOWER_UTILITIES_TARGET=x86_64-pc-windows-msvc
if errorlevel 1 exit /b 1
cmake --build "$out/cmake" --parallel 4
if errorlevel 1 exit /b 1
"$out/cmake/tower-parser-tests.exe" $runArguments
"@
$batch | Set-Content -Encoding ascii (Join-Path $out 'run.cmd')
& $env:ComSpec /d /c (Join-Path $out 'run.cmd')
if ($LASTEXITCODE) { throw "Parser build/tests failed ($LASTEXITCODE)" }
