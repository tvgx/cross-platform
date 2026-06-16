# Script tự động build APK cục bộ sử dụng JDK và SDK tùy chỉnh đã cấu hình

# Đọc các biến môi trường từ file .env
if (Test-Path ".env") {
    Get-Content ".env" | Foreach-Object {
        $line = $_.Trim()
        if ($line -and !$line.StartsWith("#") -and $line.Contains("=")) {
            $index = $line.IndexOf("=")
            $name = $line.Substring(0, $index).Trim()
            $value = $line.Substring($index + 1).Trim()
            # Loại bỏ dấu ngoặc kép hoặc ngoặc đơn ở hai đầu nếu có
            if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            [System.Environment]::SetEnvironmentVariable($name, $value, [System.EnvironmentVariableTarget]::Process)
        }
    }
}

if (!$env:JAVA_HOME -or !$env:ANDROID_HOME) {
    Write-Host "CẢNH BÁO: Chưa cấu hình JAVA_HOME hoặc ANDROID_HOME trong file .env!" -ForegroundColor Yellow
}

Write-Host "=== BAT DAU BUILD APK ===" -ForegroundColor Cyan

Write-Host "1. Chay expo prebuild..." -ForegroundColor Yellow
npx expo prebuild --platform android --clean

Write-Host "2. Chay Gradle assembleRelease..." -ForegroundColor Yellow
cd android
.\gradlew.bat assembleRelease

if ($LASTEXITCODE -eq 0) {
    cd ..
    Write-Host "3. Copy APK..." -ForegroundColor Yellow
    Copy-Item -Path "android/app/build/outputs/apk/release/app-release.apk" -Destination "app-release.apk" -Force
    Write-Host "BUILD SUCCESS!" -ForegroundColor Green
    Write-Host "APK saved as app-release.apk" -ForegroundColor Green
}
else {
    cd ..
    Write-Host "BUILD FAILED!" -ForegroundColor Red
}