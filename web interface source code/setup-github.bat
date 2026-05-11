@echo off
echo ===========================================
echo  CLONMED MCP Server - GitHub Setup
echo ===========================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not installed!
    echo Download from: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [1/5] Initializing Git repository...
git init

echo.
echo [2/5] Adding files to git...
git add .

echo.
echo [3/5] Creating first commit...
git commit -m "Initial CLONMED MCP Server"

echo.
echo [4/5] Setting up remote...
echo.
echo ===========================================
echo  IMPORTANT: Create GitHub repo first!
echo ===========================================
echo.
echo 1. Go to https://github.com/new
echo 2. Repository name: clonmed-mcp-server
echo 3. Click "Create repository"
echo 4. Copy the HTTPS URL (not SSH)
echo.
set /p GITHUB_URL="Paste GitHub repo URL here: "

git remote add origin %GITHUB_URL%
git branch -M main

echo.
echo [5/5] Pushing to GitHub...
git push -u origin main

echo.
echo ===========================================
echo  SETUP COMPLETE!
echo ===========================================
echo.
echo Next steps:
echo 1. Go to https://dashboard.render.com
echo 2. Sign up with GitHub
echo 3. Click "New +" -> "Web Service"
echo 4. Select your repo
echo 5. Deploy!
echo.
echo See AUTO_DEPLOY.md for full instructions.
echo.
pause
