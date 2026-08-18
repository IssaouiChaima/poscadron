@echo off
title Position Cadron
color 0A

echo ============================================
echo   Position Cadron - Demarrage
echo ============================================
echo.

cd /d "%~dp0backend"

if not exist venv (
    echo [ERREUR] Le dossier venv est introuvable dans backend\
    echo Installe d'abord le projet une fois avec les commandes manuelles.
    pause
    exit /b
)

call venv\Scripts\activate.bat

echo Demarrage du serveur...
echo (laisse cette fenetre ouverte tant que tu utilises l'application)
echo.

start "" http://localhost:8000

python run.py

pause
