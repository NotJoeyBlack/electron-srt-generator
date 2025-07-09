@echo off
echo Starting SRT Generator in Development Mode...
echo.

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo Installing dependencies...
    npm install
    echo.
)

REM Start the development server
echo Starting React development server and Electron...
npm run dev

pause