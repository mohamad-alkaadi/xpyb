<#
.SYNOPSIS
Removes xpyb from Windows. Decks, notebooks and application settings are not touched.
.PARAMETER InstallDir
Folder given to install.ps1.
#>
param(
    [string]$InstallDir = (Join-Path $env:LOCALAPPDATA 'Programs\xpyb')
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'lib\windows.ps1')

# Removes the per-user keys, and the machine-wide ones when they exist.
function Unregister-FileType {
    $classes = 'HKCU:\Software\Classes'
    if ((Get-ItemProperty "$classes\.xpyb" -ErrorAction SilentlyContinue).'(default)' -eq $ProgId) {
        Remove-Item "$classes\.xpyb" -Recurse -Force
    }
    if (Test-Path "$classes\$ProgId") { Remove-Item "$classes\$ProgId" -Recurse -Force }
    if (-not (Test-Path "HKLM:\Software\Classes\$ProgId")) { return }
    if (Test-Administrator) {
        Invoke-CmdLines '@assoc .xpyb=', "@ftype $ProgId="
    } else {
        Write-Warning 'Run this script as administrator to remove the machine-wide file association.'
    }
}

if ((Test-Path $InstallDir) -and -not (Test-Path (Join-Path $InstallDir $Marker))) {
    throw "$InstallDir was not created by this installer; nothing was removed."
}
if (Test-Path $InstallDir) { Remove-Item $InstallDir -Recurse -Force }
Update-UserPath { param($value) Remove-PathEntry $value $InstallDir }
$shortcut = Get-ShortcutPath
if (Test-Path $shortcut) { Remove-Item $shortcut -Force }
Unregister-FileType
Write-Host 'Removed xpyb.'
