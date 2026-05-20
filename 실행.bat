@echo off
chcp 65001 >nul
title 교회 재정 관리 — 서버 실행
cd /d "%~dp0"

where npm >nul 2>&1
if errorlevel 1 (
    echo [오류] Node.js/npm이 설치되어 있지 않습니다.
    echo https://nodejs.org/ 에서 LTS 버전을 설치한 뒤 다시 실행하세요.
    pause
    exit /b 1
)

echo 패키지 설치/확인 중...
call npm install
if errorlevel 1 (
    echo [오류] npm install 실패
    pause
    exit /b 1
)

echo.
echo SQLite 모듈을 이 PC의 Node.js 버전에 맞게 빌드합니다...
echo (다른 PC에서 복사한 node_modules 는 사용하지 마세요.)
call npm rebuild better-sqlite3
if errorlevel 1 (
    echo.
    echo [오류] better-sqlite3 빌드 실패
    echo  - Node.js LTS 22.x 권장: https://nodejs.org/
    echo  - 또는 관리자 권한으로 다시 실행
    echo  - node_modules 폴더를 삭제한 뒤 실행.bat 을 다시 실행해 보세요.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   교회 재정 관리 프로그램
echo   API + 웹 서버를 시작합니다.
echo   종료: 이 창에서 Ctrl+C
echo ========================================
echo.

REM 이전 실행이 남아 있으면 포트 충돌 방지
call "%~dp0서버-종료.bat" silent

REM 서버 기동 후 브라우저 자동 열기 (약 5초 대기)
start "" /b cmd /c "ping -n 6 127.0.0.1 >nul && start "" "http://localhost:5173""

call npm run dev

echo.
echo 서버가 종료되었습니다.
pause
