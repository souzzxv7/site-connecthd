@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instale Node.js 24 ou superior em https://nodejs.org
  pause
  exit /b 1
)
call npm install
if errorlevel 1 (
  pause
  exit /b 1
)
echo Abra http://127.0.0.1:5173 no navegador.
echo Mantenha esta janela aberta enquanto usa o site.
call npm run dev
pause
