@echo off
cls
echo ==========================================
echo    CLONMED MCP SERVER + CLOUDFLARE
echo ==========================================
echo.

REM Kill any node processes
 taskkill /F /IM node.exe 2>nul

REM Start MCP Server
echo [1/3] Starting MCP Server...
start "MCP Server" cmd /c "cd /d C:\Users\ClonexxShree\Desktop\hackathon\health thing && npm start"

REM Wait for server
timeout /t 3 /nobreak >nul

REM Start Cloudflare Tunnel
echo [2/3] Starting Cloudflare Tunnel...
start "Cloudflare" cmd /c "cloudflared tunnel --url http://localhost:3001"

REM Open Viewer
echo [3/3] Opening Viewer...
timeout /t 5 /nobreak >nul
start http://localhost:3001/viewer.html

echo.
echo ==========================================
echo SERVER RUNNING!
echo.
echo Wait for Cloudflare URL (copy it)
echo Then use in Prompt Opinion:
echo   URL: https://xxxx.trycloudflare.com/mcp
echo   Type: Streamable HTTP
echo.
echo Press any key to stop all...
echo ==========================================
pause

REM Kill processes
taskkill /F /FI "WINDOWTITLE eq MCP Server*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Cloudflare*" 2>nul
taskkill /F /IM node.exe 2>nul
taskkill /F /IM cloudflared.exe 2>nul

echo Stopped.
