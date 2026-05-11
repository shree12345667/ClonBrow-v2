@echo off
echo Deleting deployment files...
del /q EASY_DEPLOY_RAILWAY.md 2>nul
del /q RAILWAY_DEPLOY.md 2>nul
del /q DEPLOY_24_7.md 2>nul
del /q DEPLOY_SHREE.md 2>nul
del /q AUTO_DEPLOY.md 2>nul
del /q WORKFLOW.md 2>nul
del /q GITHUB_TO_RENDER.md 2>nul
del /q GITHUB_UPLOAD.md 2>nul
del /q SIMPLE_STEPS.md 2>nul
del /q FIX_REPO.bat 2>nul
del /q setup-github.bat 2>nul
del /q render.yaml 2>nul
del /q railway.json 2>nul
rmdir /s /q .github 2>nul
echo Done! Kept only START.bat and server.
pause
