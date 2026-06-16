# Script phat trien real-time cho Android (Fast Refresh / Hot Reload)
# Doc JAVA_HOME va ANDROID_HOME tu file .env
$envFile = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "Loi: Khong tim thay file .env tai $envFile" -ForegroundColor Red
    exit 1
}

Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($Matches[1].Trim(), $Matches[2].Trim(), 'Process')
    }
}

if (-not $env:JAVA_HOME -or -not $env:ANDROID_HOME) {
    Write-Host "Loi: JAVA_HOME hoac ANDROID_HOME chua duoc dinh nghia trong .env" -ForegroundColor Red
    exit 1
}

$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:JAVA_HOME\bin;$env:PATH"

Write-Host "=== Android Development Mode (Real-time) ===" -ForegroundColor Cyan
Write-Host "   JAVA_HOME    = $env:JAVA_HOME" -ForegroundColor Gray
Write-Host "   ANDROID_HOME = $env:ANDROID_HOME" -ForegroundColor Gray
Write-Host ""
Write-Host "Yeu cau: Thiet bi Android ket noi USB (bat USB Debugging)" -ForegroundColor Yellow
Write-Host "         HOAC Android Emulator dang chay" -ForegroundColor Yellow
Write-Host ""

# Kiem tra thiet bi ket noi
$adbPath = "$env:ANDROID_HOME\platform-tools\adb.exe"
$devices = & $adbPath devices 2>$null
$connectedDevices = $devices | Select-String -Pattern "device$"
if (-not $connectedDevices) {
    Write-Host "CANH BAO: Khong tim thay thiet bi Android!" -ForegroundColor Red
    Write-Host "Hay ket noi thiet bi hoac mo emulator truoc." -ForegroundColor Red
    Write-Host ""
    Write-Host "List emulators: $env:ANDROID_HOME\emulator\emulator.exe -list-avds" -ForegroundColor Gray
    exit 1
}

Write-Host "Devices connected:" -ForegroundColor Green
$connectedDevices | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
Write-Host ""
Write-Host "Starting development build + Metro bundler..." -ForegroundColor Yellow
Write-Host "(First run will take a few minutes to build and install APK)" -ForegroundColor Gray
Write-Host ""

npx expo run:android
