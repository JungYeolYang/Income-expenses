@echo off
chcp 65001 >nul
title 교회 재정 — 서버 종료
cd /d "%~dp0"

echo 이전에 실행 중인 API(3001) / 웹(5173) 프로세스를 종료합니다...
echo.

set FOUND=0
for %%P in (3001 5173 5174) do (
  for /f "tokens=5" %%A in ('netstat -ano 2^>nul ^| findstr ":%%P " ^| findstr LISTENING') do (
    echo   포트 %%P - PID %%A 종료
    taskkill /F /PID %%A >nul 2>&1
    set FOUND=1
  )
)

if "%FOUND%"=="0" (
  echo   사용 중인 포트가 없습니다.
) else (
  echo.
  echo 종료 완료. 이제 실행.bat 을 다시 실행하세요.
)

if /i not "%~1"=="silent" pause
