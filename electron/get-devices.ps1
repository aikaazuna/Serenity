[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "SilentlyContinue"

$devices = @()
$apoPath = "HKLM:\SOFTWARE\EqualizerAPO\Child APOs"
$apoKeys = @()

if (Test-Path $apoPath) {
    $apoKeys = (Get-ChildItem -Path $apoPath).PSChildName
}

$endpoints = Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\MMDevices\Audio\Render\*\Properties'

foreach ($ep in $endpoints) {
    $guid = $ep.PSParentPath.Split('\')[-1]
    $name = $ep.'{a45c254e-df1c-4efd-8020-67d146a850e0},2'
    $desc = $ep.'{b3f8fa53-0004-438e-9003-51a46e139bfc},6'
    
    if ($name) {
        $displayName = if ($desc -and $desc -ne $name) { "$name ($desc)" } else { $name }
        $isInstalled = $apoKeys -contains $guid
        $devices += @{
            name = $displayName
            guid = $guid
            isInstalled = [bool]$isInstalled
        }
    }
}

$uniqueDevices = $devices | Sort-Object -Property name -Unique
$uniqueDevices | ConvertTo-Json -Compress
