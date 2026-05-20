@echo off
chcp 65001 >nul
title 교회 재정 — SQLite 모듈 수리
cd /d "%~dp0"

echo node_modules 를 삭제하고 이 PC에서 다시 설치합니다...
echo.

if exist "node_modules\" (
    rmdir /s /q "node_modules"
)

call npm install
if errorlevel 1 goto fail

call npm rebuild better-sqlite3
if errorlevel 1 goto fail

echo.
echo 수리 완료. 이제 실행.bat 을 사용하세요.
pause
exit /b 0

:fail
echo.
echo [오류] 설치/빌드에 실패했습니다.
echo Node.js LTS 22.x 설치를 권장합니다: https://nodejs.org/
pause
exit /b 1
