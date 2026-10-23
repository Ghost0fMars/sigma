@echo off
set "VSCODE=%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe"

if not exist "%VSCODE%" (
  echo VS Code est introuvable ici:
  echo %VSCODE%
  echo.
  echo Ouvrez VS Code manuellement, puis utilisez Fichier ^> Ouvrir un dossier...
  pause
  exit /b 1
)

start "" "%VSCODE%" "%~dp0"
