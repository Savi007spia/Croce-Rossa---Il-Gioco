@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 launch_web.py
) else (
  python launch_web.py
)
if errorlevel 1 (
  echo.
  echo Impossibile avviare il server web locale. Installa Python 3 e riprova.
  pause
)
