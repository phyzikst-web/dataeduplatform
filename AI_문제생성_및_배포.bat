@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul
title AlgoEdu - AI 문제 생성 및 자동 배포 마법사

echo ===================================================
echo   🧠 AlgoEdu AI 문제 생성 및 자동 배포 마법사 🧠
echo ===================================================
echo.
echo 이 도구는 교수님의 강의 자료 텍스트를 분석하여,
echo 1. 객관식 퀴즈 (워드 파일)
echo 2. 예제 코드 학습 (빈칸 채우기 노트북)
echo 3. 실전 코딩 테스트 (알고리즘 문제 노트북)
echo 세 가지 보충 평가 자료를 AI로 자동 구축하고
echo 깃허브(GitHub)에 원클릭으로 자동 배포합니다.
echo.
echo ===================================================
echo.

:: 1. API 키 불러오기 및 설정
set KEY_FILE=.gemini_api_key.txt
set GEMINI_API_KEY=

if exist "%KEY_FILE%" (
    set /p GEMINI_API_KEY=<"%KEY_FILE%"
)

if "%GEMINI_API_KEY%"=="" (
    echo [안내] 최초 1회 구글 Gemini API 키 등록이 필요합니다.
    echo API 키는 https://aistudio.google.com/ 에서 발급받으실 수 있습니다.
    set /p GEMINI_API_KEY="🔑 Gemini API 키를 입력해주세요: "
) else (
    echo [기억된 API 키 사용 중] 변경을 원하시면 새로운 키를 입력하시고,
    echo 기존 키를 그대로 사용하시려면 그냥 [엔터]를 눌러주세요.
    set /p NEW_KEY="🔑 Gemini API 키 입력 (기존 키 유지 시 엔터): "
    if not "!NEW_KEY!"=="" (
        set GEMINI_API_KEY=!NEW_KEY!
    )
)

:: 입력한 API 키 저장하기
echo %GEMINI_API_KEY% > "%KEY_FILE%"
echo.

:: 2. 단원 정보 입력받기
echo ---------------------------------------------------
echo 📝 배포할 단원의 정보를 입력해 주세요.
echo ---------------------------------------------------
set /p WEEK_INPUT="📌 몇 주차 실습인가요? (예: 14주차 또는 14): "
set /p TITLE_INPUT="📌 학습 주제는 무엇인가요? (예: 그래프 탐색): "
set /p FILE_INPUT="📌 강의 텍스트 파일명 또는 경로를 입력하세요 (예: lecture.txt): "
echo.

:: 입력값 보정 (주차 형식 통일)
set WEEK_CLEAN=%WEEK_INPUT%
if "%WEEK_CLEAN:~-2%" NEQ "주차" (
    set WEEK_CLEAN=%WEEK_CLEAN%주차
)

if not exist "%FILE_INPUT%" (
    echo ❌ [오류] "%FILE_INPUT%" 파일을 찾을 수 없습니다.
    echo 강의 자료 텍스트 파일을 해당 이름으로 생성 후 다시 시도해 주세요.
    pause
    exit /b
)

echo ---------------------------------------------------
echo 🤖 AI가 핵심 개념을 분석하여 문제를 제작하고 있습니다...
echo    (Gemini API 통신 중, 약 10~15초 소요)
echo ---------------------------------------------------

:: 3. 파이썬 생성기 구동
python generate_contents.py --input "%FILE_INPUT%" --week "%WEEK_CLEAN%" --title "%TITLE_INPUT%"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ [오류] AI 문제 생성 중 에러가 발생했습니다.
    echo API 키를 확인하시거나 파이썬 패키지가 설치되어 있는지 체크해 주세요.
    pause
    exit /b
)

echo.
echo ---------------------------------------------------
echo 🚀 학생용 학습 웹사이트에 실시간 자동 배포를 시작합니다...
echo ---------------------------------------------------
echo.

:: 4. 자동 배포 (Git Commit & Push)
git add .
git commit -m "AI Auto-generated materials for %WEEK_CLEAN% %TITLE_INPUT%"
git push origin main

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠️ [경고] 깃허브 자동 배포 중 네트워크 오류가 발생했습니다.
    echo 인터넷 연결 상태 또는 깃(Git) 인증 상태를 점검하신 뒤,
    echo 수동으로 '업로드.bat'을 실행해 배포를 완료해 주세요.
) else (
    echo.
    echo 🎉 [성공] AI 문제 생성 및 깃허브 Pages 실시간 배포가 완료되었습니다!
    echo 학생들이 즉시 웹사이트에서 문제를 풀고 채점할 수 있습니다.
)

echo.
echo ===================================================
pause
