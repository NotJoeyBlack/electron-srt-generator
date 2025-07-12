@echo off
echo ========================================
echo SRT Generator - Quick Release (Patch)
echo ========================================
echo.

REM Quick deployment with patch version bump
echo Building and releasing patch version...
npm run release
if %errorlevel% neq 0 (
    echo Error: Release failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo Quick release completed successfully!
echo ========================================
echo.

pause