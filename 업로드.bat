@echo off
chcp 65001 > nul
echo ===================================================
echo   웹 실습 플랫폼 자동 업데이트 (GitHub 업로드)
echo ===================================================
echo.

echo [1/3] 변경된 문제 파일들을 모으는 중...
git add .
echo.

echo [2/3] 업데이트 기록을 남기는 중...
git commit -m "실습 문제 업데이트"
echo.

echo [3/3] 인터넷(GitHub)으로 전송 중...
git push origin main
echo.

echo ===================================================
echo   업로드 완료! 1~2분 뒤 인터넷 주소에서 확인하세요.
echo   주소: https://phyzikst-web.github.io/dataeduplatform/
echo ===================================================
echo.
pause
