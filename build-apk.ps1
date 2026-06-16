# Script tự động build APK cục bộ sử dụng JDK và SDK tùy chỉnh đã cấu hình
$env:JAVA_HOME="C:\Users\Admin\AppData\Local\Programs\Eclipse Adoptium\jdk-25.0.3.9-hotspot"
$env:ANDROID_HOME="C:\Users\36\AndroidSDK"

Write-Host "=== Bắt đầu quá trình Build APK ===" -ForegroundColor Cyan

Write-Host "1. Làm sạch và tạo mới thư mục native Android (npx expo prebuild)..." -ForegroundColor Yellow
npx expo prebuild --platform android --clean

Write-Host "2. Bắt đầu biên dịch ứng dụng bằng Gradle (assembleRelease)..." -ForegroundColor Yellow
cd android
.\gradlew.bat assembleRelease

if ($LASTEXITCODE -eq 0) {
    cd ..
    Write-Host "3. Sao chép file APK đầu ra..." -ForegroundColor Yellow
    Copy-Item -Path "android/app/build/outputs/apk/release/app-release.apk" -Destination "app-release.apk" -Force
    Write-Host "=== BUILD THÀNH CÔNG! ===" -ForegroundColor Green
    Write-Host "File APK của bạn đã được đặt tại: app-release.apk" -ForegroundColor Green
} else {
    cd ..
    Write-Host "=== BUILD THẤT BẠI! ===" -ForegroundColor Red
    Write-Host "Vui lòng kiểm tra lại log lỗi ở trên." -ForegroundColor Red
}
