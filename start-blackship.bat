@echo off
setlocal
cd /d "%~dp0"

if not exist package.json (
  echo BLACKSHIP project files were not found in this folder.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing BLACKSHIP dependencies. This may take a few minutes...
  call npm install --legacy-peer-deps
  if errorlevel 1 goto :failed
)

echo Starting BLACKSHIP. Keep this window open while using the app.
call npm run dev
if errorlevel 1 goto :failed
exit /b 0

:failed
echo.
echo BLACKSHIP could not start. Please share the error shown above.
pause
exit /b 1
