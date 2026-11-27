<#
.SYNOPSIS
Installs xpyb on Windows: User PATH, Start Menu shortcut and .xpyb file association.
.PARAMETER InstallDir
Target folder.
.PARAMETER SkipBuild
Use the existing dist folder instead of building.
#>
param(
    [string]$InstallDir = (Join-Path $env:LOCALAPPDATA 'Programs\xpyb'),
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'lib\windows.ps1')

$RepoDir = Split-Path $PSScriptRoot -Parent
$Binary = Join-Path $InstallDir 'xpyb-app.exe'

function Build-App {
    if ($SkipBuild) { return }
    Push-Location $RepoDir
    try {
        if (-not (Test-Path 'node_modules')) { npm ci; if ($LASTEXITCODE) { throw 'npm ci failed.' } }
        npm run build
        if ($LASTEXITCODE) { throw 'The build failed.' }
    } finally { Pop-Location }
}

# Copies the Electron runtime and the application files: the unpacked app.
function Copy-App {
    $runtime = Join-Path $RepoDir 'node_modules\electron\dist'
    if (-not (Test-Path (Join-Path $runtime 'electron.exe'))) { throw "Electron not found in $runtime." }
    if ((Test-Path $InstallDir) -and -not (Test-Path (Join-Path $InstallDir $Marker))) {
        throw "$InstallDir exists and was not created by this installer."
    }
    if (Test-Path $InstallDir) { Remove-Item $InstallDir -Recurse -Force }
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    New-Item -ItemType File -Path (Join-Path $InstallDir $Marker) | Out-Null
    Copy-Item (Join-Path $runtime '*') $InstallDir -Recurse
    Rename-Item (Join-Path $InstallDir 'electron.exe') 'xpyb-app.exe'
    $app = Join-Path $InstallDir 'resources\app'
    New-Item -ItemType Directory -Path $app -Force | Out-Null
    foreach ($item in 'package.json', 'bin', 'electron', 'python', 'dist') {
        Copy-Item (Join-Path $RepoDir $item) $app -Recurse
    }
    Remove-Item (Join-Path $InstallDir 'resources\default_app.asar') -ErrorAction SilentlyContinue
}

# The window program is named xpyb-app.exe so that "xpyb" resolves to this command file.
function Write-CliShim {
    Set-Content -Path (Join-Path $InstallDir 'xpyb.cmd') -Encoding Ascii -Value @(
        '@echo off'
        'setlocal'
        'set ELECTRON_RUN_AS_NODE=1'
        'set XPYB_PACKAGED=1'
        '"%~dp0xpyb-app.exe" "%~dp0resources\app\bin\xpyb.js" %*'
    )
}

function New-StartMenuShortcut {
    $shortcut = (New-Object -ComObject WScript.Shell).CreateShortcut((Get-ShortcutPath))
    $shortcut.TargetPath = $Binary
    $shortcut.WorkingDirectory = $InstallDir
    $shortcut.Description = 'Slide decks with runnable Python notebooks'
    $shortcut.Save()
}

# assoc and ftype need administrator rights; without them the same keys are written per user.
function Register-FileType {
    if (Test-Administrator) {
        Invoke-CmdLines "@assoc .xpyb=$ProgId", "@ftype $ProgId=`"$Binary`" `"%%1`""
        return
    }
    $classes = 'HKCU:\Software\Classes'
    New-Item "$classes\.xpyb" -Force | Set-ItemProperty -Name '(default)' -Value $ProgId
    New-Item "$classes\$ProgId\shell\open\command" -Force |
        Set-ItemProperty -Name '(default)' -Value "`"$Binary`" `"%1`""
}

Build-App
if (-not (Test-Path (Join-Path $RepoDir 'dist\index.html'))) { throw 'dist is missing. Run npm run build.' }
Copy-App
Write-CliShim
Update-UserPath { param($value) Add-PathEntry $value $InstallDir }
New-StartMenuShortcut
Register-FileType
Write-Host "Installed xpyb to $InstallDir."
Write-Host "Restart your terminal, then run 'xpyb --help' to get started."
