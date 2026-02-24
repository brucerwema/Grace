@echo off
echo ================================================
echo   Grace Community Church — Local Server
echo ================================================
echo.
echo Starting server at http://localhost:8080
echo Open that link in your browser after this window opens.
echo Press Ctrl+C to stop the server.
echo.

:: Try Python 3 first
python -m http.server 8080 2>nul
if %errorlevel% neq 0 (
    :: Try Python 2
    python -m SimpleHTTPServer 8080 2>nul
    if %errorlevel% neq 0 (
        echo ERROR: Python not found.
        echo Please install Python from https://python.org
        echo Or drag your files to https://app.netlify.com/drop
        pause
    )
)
