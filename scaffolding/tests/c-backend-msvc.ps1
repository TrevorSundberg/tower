param([string]$Artifacts = 'build/c-validation')
$ErrorActionPreference = 'Stop'
$vswhere = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio/Installer/vswhere.exe'
$installation = & $vswhere -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
if (!$installation) { throw 'MSVC C/C++ tools are not installed' }
$directory = (Resolve-Path -LiteralPath $Artifacts).Path
$batch = Join-Path $directory 'msvc-compile.cmd'
$cases = Get-Content (Join-Path $directory 'expected.json') -Raw | ConvertFrom-Json
$commands = [Collections.Generic.List[string]]::new()
$commands.Add('@echo off')
$commands.Add("call `"$installation\Common7\Tools\VsDevCmd.bat`" -no_logo -arch=amd64 >nul")
$commands.Add('if errorlevel 1 exit /b 1')
foreach ($case in $cases) {
    foreach ($language in @('TC','TP')) {
        foreach ($optimization in @('Od','O2')) {
            $source = Join-Path $directory $case.file
            $exe = Join-Path $directory ($case.name + '-' + $language + '-' + $optimization + '.exe')
            $object = Join-Path $directory ($case.name + '-' + $language + '-' + $optimization + '.obj')
            $commands.Add("cl /nologo /W4 /WX /$language /$optimization /Fo`"$object`" /Fe`"$exe`" `"$source`"")
            $commands.Add('if errorlevel 1 exit /b 1')
        }
    }
}
$commands | Set-Content -LiteralPath $batch -Encoding ascii
$buildOutput = & cmd /d /c $batch 2>&1
if ($LASTEXITCODE) { throw ($buildOutput -join "`n") }
foreach ($case in $cases) {
    foreach ($language in @('TC','TP')) {
        foreach ($optimization in @('Od','O2')) {
            $exe = Join-Path $directory ($case.name + '-' + $language + '-' + $optimization + '.exe')
            $start = [Diagnostics.ProcessStartInfo]::new($exe)
            $start.UseShellExecute = $false
            $start.CreateNoWindow = $true
            $start.RedirectStandardOutput = $true
            $start.RedirectStandardError = $true
            $process = [Diagnostics.Process]::Start($start)
            $stdout = $process.StandardOutput.ReadToEndAsync()
            $stderr = $process.StandardError.ReadToEndAsync()
            if (!$process.WaitForExit(30000)) { $process.Kill(); throw "MSVC execution timeout: $exe" }
            $actualOut = $stdout.GetAwaiter().GetResult().Replace("`r`n","`n")
            $actualErr = $stderr.GetAwaiter().GetResult().Replace("`r`n","`n")
            if ($actualOut -cne $case.stdout -or $actualErr -cne $case.stderr -or $process.ExitCode -ne $case.code) { throw "MSVC differential mismatch: $($case.name) /$language /$optimization" }
            $process.Dispose()
        }
    }
    Write-Output "$($case.name): MSVC C/C++ /Od /O2 /W4 /WX passed"
}
