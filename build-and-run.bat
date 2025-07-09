@echo off
echo Building and Running SRT Generator in Production Mode...
echo.

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo Installing dependencies...
    npm install
    echo.
)

REM Build the React app and Electron TypeScript
echo Building React app and compiling Electron TypeScript...
npm run build

REM Check if build was successful
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

REM Create distribution package
echo Creating distribution package...
npm run dist

REM Check if packaging was successful
if %errorlevel% neq 0 (
    echo Packaging failed!
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo You can find the packaged app in the 'release' folder.
echo.

REM Ask user if they want to run the built app
set /p choice="Do you want to run the packaged app? (y/n): "
if /i "%choice%"=="y" (
    echo Looking for executable in release folder...
    if exist "release\win-unpacked\SRT Generator.exe" (
        echo Starting SRT Generator...
        start "" "release\win-unpacked\SRT Generator.exe"
    ) else (
        echo Executable not found in expected location.
        echo Please check the release folder manually.
    )
)

pause