@echo off
setlocal enabledelayedexpansion

git status

set pjtname=nextplay
set target=
set choice=
set /p choice="Select Command (1: Run,  2: Make-EXE,  3: Make-Setup): "

python check_version.py
set /p version=<%pjtname%.version
echo %pjtname%.version: %version%

if "%choice%"=="1" (
    echo ******** Run %pjtname%.py ********
    python %pjtname%.py
    exit /b
)

if "%choice%"=="2" (
    echo ******** Make EXE ********
    pyinstaller --noconfirm %pjtname%_pyinstaller.spec
    exit /b
)

if "%choice%"=="3" (
    echo ******** Make Setup Program ********
    "C:\Program Files (x86)\NSIS\makensis.exe" %pjtname%_nsis.nsi
    exit /b
)

rem default command
echo ******** Run %pjtname%.py ********
python %pjtname%.py

