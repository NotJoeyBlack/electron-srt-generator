@echo off
echo ========================================
echo SRT Generator - Automated Deployment
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: npm is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: git is not installed or not in PATH
    echo Please install git from https://git-scm.com/
    pause
    exit /b 1
)

REM Check if GitHub CLI is installed
gh --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: GitHub CLI is not installed or not in PATH
    echo Please install GitHub CLI from https://cli.github.com/
    echo This is required for automated releases
    pause
    exit /b 1
)

echo Checking GitHub authentication...
gh auth status >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Not authenticated with GitHub
    echo Please run: gh auth login
    pause
    exit /b 1
)

echo All prerequisites check passed!
echo.

REM Get current version
echo Current version:
npm version --json | findstr "\"version\":"
echo.

REM Ask for version type
echo Select version bump type:
echo 1. Patch (1.0.0 -> 1.0.1)
echo 2. Minor (1.0.0 -> 1.1.0)
echo 3. Major (1.0.0 -> 2.0.0)
echo 4. Custom version
echo 5. Skip version bump (use current version)
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo Bumping patch version...
    npm version patch
    if %errorlevel% neq 0 (
        echo Error: Failed to bump patch version
        pause
        exit /b 1
    )
) else if "%choice%"=="2" (
    echo Bumping minor version...
    npm version minor
    if %errorlevel% neq 0 (
        echo Error: Failed to bump minor version
        pause
        exit /b 1
    )
) else if "%choice%"=="3" (
    echo Bumping major version...
    npm version major
    if %errorlevel% neq 0 (
        echo Error: Failed to bump major version
        pause
        exit /b 1
    )
) else if "%choice%"=="4" (
    set /p custom_version="Enter custom version (e.g., 1.2.3): "
    echo Setting version to %custom_version%...
    npm version %custom_version%
    if %errorlevel% neq 0 (
        echo Error: Failed to set custom version
        pause
        exit /b 1
    )
) else if "%choice%"=="5" (
    echo Skipping version bump, using current version
) else (
    echo Invalid choice. Exiting.
    pause
    exit /b 1
)

echo.
echo Building application...
npm run build
if %errorlevel% neq 0 (
    echo Error: Build failed
    pause
    exit /b 1
)

echo.
echo Running tests...
npm test
if %errorlevel% neq 0 (
    echo Error: Tests failed
    pause
    exit /b 1
)

echo.
echo Type checking...
npm run typecheck
if %errorlevel% neq 0 (
    echo Error: Type checking failed
    pause
    exit /b 1
)

echo.
echo Linting...
npm run lint
if %errorlevel% neq 0 (
    echo Warning: Linting issues found, but continuing...
)

echo.
echo Creating distribution packages...
npm run dist:publish
if %errorlevel% neq 0 (
    echo Error: Distribution build failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo Deployment completed successfully!
echo ========================================
echo.

REM Get the new version
for /f "tokens=*" %%a in ('npm version --json ^| findstr "\"version\":" ^| findstr /o ":" ^| findstr /o "[0-9]"') do (
    set version_line=%%a
)

echo The new version has been built and published to GitHub Releases.
echo Electron apps will automatically check for updates on startup.
echo.

echo Process completed:
echo - Version bumped (if selected)
echo - Application built and tested
echo - Distribution packages created
echo - GitHub release created with installers
echo - Update server configured
echo.

pause