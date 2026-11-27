# Shared settings and helpers for install.ps1 and uninstall.ps1. Dot-source this file.

$Marker = '.xpyb-install'
$ProgId = 'xpyb.Deck'

function Get-ShortcutPath {
    Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\xpyb.lnk'
}

# Splits a PATH value into the entries that are not the given directory.
function Get-OtherPathEntries([string]$Value, [string]$Directory) {
    $wanted = $Directory.TrimEnd('\')
    @($Value -split ';' | Where-Object { $_ -and $_.TrimEnd('\') -ne $wanted })
}

function Add-PathEntry([string]$Value, [string]$Directory) {
    (@(Get-OtherPathEntries $Value $Directory) + $Directory) -join ';'
}

function Remove-PathEntry([string]$Value, [string]$Directory) {
    (Get-OtherPathEntries $Value $Directory) -join ';'
}

# Rewrites the User PATH, keeping %VARIABLE% references unexpanded.
function Update-UserPath([scriptblock]$Change) {
    $key = Get-Item 'HKCU:\Environment'
    $current = $key.GetValue('Path', '', 'DoNotExpandEnvironmentNames')
    Set-ItemProperty 'HKCU:\Environment' -Name Path -Value (& $Change $current) -Type ExpandString
    # Setting any user variable tells running programs that the environment changed.
    [Environment]::SetEnvironmentVariable('XPYB_PATH_REFRESH', $null, 'User')
}

function Test-Administrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Runs cmd.exe commands from a file, which avoids quoting differences between shells.
function Invoke-CmdLines([string[]]$Lines) {
    $file = Join-Path ([IO.Path]::GetTempPath()) "xpyb-$PID.cmd"
    Set-Content -Path $file -Value $Lines -Encoding Oem
    try { & cmd.exe /c $file } finally { Remove-Item $file -Force }
}
