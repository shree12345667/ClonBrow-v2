@echo off
echo ===========================================
echo  FIXING REPO URL
echo ===========================================
echo.

cd "C:\Users\ClonexxShree\Desktop\hackathon\health thing"

echo [1/4] Removing old remote...
git remote remove origin 2>nul
echo.

echo [2/4] Adding correct remote (Web-Service)...
git remote add origin https://github.com/shree12345667/Web-Service.git
echo.

echo [3/4] Adding ALL HTML files...
git add *.html
git add server.js
git add package.json
echo.

echo [4/4] Committing and pushing...
git commit -m "Add all 150 lab files and server"
git push -u origin main
echo.

echo ===========================================
echo  DONE! Check Render logs in 2 minutes
echo ===========================================
pause
