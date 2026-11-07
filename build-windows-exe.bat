@echo off
setlocal enabledelayedexpansion
title ibtipoint POS - Windows EXE Builder

:: Ensure running from the exact directory of this script
cd /d "%~dp0"

echo =======================================================
echo        ibtipoint POS - Windows Desktop EXE Builder
echo =======================================================
echo.
echo Current Working Directory: %CD%
echo.

if not exist package.json (
    echo [ERROR] package.json not found in %CD%!
    echo Please make sure this file is placed inside your ibtipoint project root directory.
    pause
    exit /b 1
)

echo [Step 1/3] Installing npm dependencies...
call npm install --legacy-peer-deps
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Warning: Retrying npm install...
    call npm install
)

echo.
echo [Step 2/3] Building Web Production Assets...
call npx vite build
if %ERRORLEVEL% NEQ 0 (
    echo Retrying with npm run build...
    call npm run build
)

if not exist dist\index.html (
    echo [ERROR] Web build failed! 'dist\index.html' not found.
    pause
    exit /b 1
)

echo.
echo [Step 3/3] Packaging Windows Standalone .EXE with Electron...
call npx electron-builder --win --x64

echo.
echo =======================================================
if exist release (
    echo  SUCCESS! Your Windows EXE is generated in the 'release' folder:
    dir /b release\*.exe
) else (
    echo Build completed. Check release/ folder.
)
echo =======================================================
echo.
pause
