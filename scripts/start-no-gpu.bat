@echo off
REM Start Electron app with GPU disabled for compatibility
echo Starting LocalStack S3 Browser with GPU disabled...

set ELECTRON_DISABLE_GPU=1
set ELECTRON_NO_ATTACH_CONSOLE=1
set DISABLE_GPU=true

REM Change to the project directory
cd /d "%~dp0\.."

REM Start the application
npm run start:safe

pause