@echo off
chcp 65001 > nul
echo.
echo ========================================
echo    🎴 타로 카드 리딩 앱 실행
echo ========================================
echo.

cd /d "%~dp0"

:: 카드 뒷면 이미지가 없으면 생성
if not exist "assets\card_back.png" (
    echo 카드 뒷면 이미지 생성 중...
    python create_card_back.py
    echo.
)

:: 앱 실행
echo 앱을 시작합니다...
python tarot_app.py

pause
