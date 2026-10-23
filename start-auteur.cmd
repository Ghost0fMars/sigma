@echo off
cd /d "%~dp0"
echo Demarrage de Sigma...
echo.
echo L'application sera disponible sur http://localhost:3000
echo Gardez cette fenetre ouverte pendant l'utilisation.
echo.
npm.cmd install
start "Sigma API" cmd /k npm.cmd run api
npm.cmd run dev
