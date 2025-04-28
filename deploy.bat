@echo off
REM Usage: deploy.bat filename
REM Example: deploy.bat public/index.html

set FILENAME=%1
set COMMIT_MSG=Update: %FILENAME% changes

git add %FILENAME%
git commit -m "%COMMIT_MSG%"
git push

echo Deployed %FILENAME% to Render!