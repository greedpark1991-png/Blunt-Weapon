@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js가 설치되어 있지 않습니다.
  echo Node.js LTS를 설치한 뒤 다시 실행해 주세요.
  pause
  exit /b 1
)
echo 형제 대장간 V0.2.4 로컬 서버를 시작합니다.
echo 잠시 뒤 브라우저가 자동으로 열립니다.
start "" cmd /c "timeout /t 1 /nobreak >nul & start http://localhost:5173"
node scripts/dev-server.mjs
pause
