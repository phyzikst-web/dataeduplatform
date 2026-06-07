window.JS_PROBLEMS = [
  {
    "id": "lab01_variables",
    "title": "실습 01 - 변수 선언과 출력",
    "markdown": "## 실습 01 - 변수 선언과 출력\n### 문제:\n1. 변수 myName에 자신의 이름(문자열)을 저장하시오.\n2. 변수 myAge에 자신의 나이(숫자)를 저장하시오.\n3. 변수 isAdult에 나이가 19 이상이면 true, 아니면 false를 저장하시오.\n4. 아래 형식으로 출력하시오.\n\n### 출력 예시:\n```text\n이름: 홍길동\n나이: 20\n성인 여부: true\n```",
    "code": "let myName  = '';    // 이름을 입력하세요\nlet myAge   = 0;     // 나이를 입력하세요\nlet isAdult = ;      // myAge >= 19 를 이용해 작성하세요\n\nconsole.log('이름:', myName);\nconsole.log('나이:', myAge);\nconsole.log('성인 여부:', isAdult);"
  },
  {
    "id": "lab02_arithmetic",
    "title": "실습 02 - 산술 연산과 원의 넓이·둘레",
    "markdown": "## 실습 02 - 산술 연산과 원의 넓이·둘레\n### 문제:\n1. 변수 radius에 반지름 값 7을 저장하시오.\n2. 변수 pi에 원주율 3.14159를 저장하시오.\n3. 변수 area에 원의 넓이(pi * radius * radius)를 계산하시오.\n4. 변수 circumference에 원의 둘레(2 * pi * radius)를 계산하시오.\n5. 아래 형식으로 출력하시오.\n\n### 출력 예시:\n```text\n반지름: 7\n원의 넓이: 153.93791\n원의 둘레: 43.98226\n```",
    "code": "let radius =           ;   // 반지름\nlet pi     =           ;   // 원주율\n\nlet area          =    ;   // 넓이 공식 작성\nlet circumference =    ;   // 둘레 공식 작성\n\nconsole.log('반지름:', radius);\nconsole.log('원의 넓이:', area);\nconsole.log('원의 둘레:', circumference);"
  },
  {
    "id": "lab03_operators",
    "title": "실습 03 - 비교·논리 연산자 결과 채우기",
    "markdown": "## 실습 03 - 비교·논리 연산자 결과 채우기\n### 문제:\n아래 여섯 줄의 표현식 각각에 대해\n예상 결과를 주석으로 먼저 적은 뒤,\n빈칸을 채워 실행하여 실제 결과와 비교하시오.\n\n### 출력 예시:\n```text\n① 10 > 5          : true\n② 10 === '10'     : false\n③ 10 == '10'      : true\n④ (7>3)&&(2<1)    : false\n⑤ (7>3)||(2<1)    : true\n⑥ !(10===10)      : false\n```",
    "code": "console.log('① 10 > 5          :',          );   // 예상:\nconsole.log('② 10 === \"10\"     :',          );   // 예상:\nconsole.log('③ 10 == \"10\"      :',          );   // 예상:\nconsole.log('④ (7>3)&&(2<1)    :',          );   // 예상:\nconsole.log('⑤ (7>3)||(2<1)    :',          );   // 예상:\nconsole.log('⑥ !(10===10)      :',          );   // 예상:"
  },
  {
    "id": "lab04_if_grade",
    "title": "실습 04 - 조건문으로 학점 출력하기",
    "markdown": "## 실습 04 - 조건문으로 학점 출력하기\n### 문제:\n변수 score에 점수를 저장한 뒤,\nif-else if-else 구조로 학점을 판별하여 출력하시오.\n- 90점 이상 → A학점\n- 80점 이상 → B학점\n- 70점 이상 → C학점\n- 60점 이상 → D학점\n- 60점 미만  → F학점\nscore 값을 바꿔가며 세 번 이상 테스트하시오.\n\n출력 예시 (score = 83):\n점수: 83\n학점: B학점\nif - else if - else 구조를 작성하세요",
    "code": "let score = 83;   // 이 숫자를 바꿔가며 테스트하세요\nlet grade = '';\n\n\n\n\nconsole.log('점수:', score);\nconsole.log('학점:', grade);"
  },
  {
    "id": "lab05_while_odd",
    "title": "실습 05 - while 반복문으로 홀수 합계 구하기",
    "markdown": "## 실습 05 - while 반복문으로 홀수 합계 구하기\n### 문제:\nwhile 반복문으로 1부터 20 사이의 홀수를 모두 더한 합계를 구하시오.\n- 변수 i를 1로 초기화하여 20 이하인 동안 반복한다.\n- i가 홀수일 때만 sum에 더한다. (i % 2 !== 0)\n- 홀수 목록과 합계를 출력한다.\n\n### 출력 예시:\n```text\n홀수 목록: 1 3 5 7 9 11 13 15 17 19\n합계: 100\nwhile 반복문을 작성하세요\n```",
    "code": "let i       = 1;\nlet sum     = 0;\nlet numList = '';\n\nwhile (       ) {\n\n    // 홀수 판별 후 numList에 추가하고 sum에 더하세요\n\n\n    i++;\n}\n\nconsole.log('홀수 목록:', numList.trim());\nconsole.log('합계:', sum);"
  },
  {
    "id": "lab06_for_times",
    "title": "실습 06 - for 반복문으로 구구단 출력하기",
    "markdown": "## 실습 06 - for 반복문으로 구구단 출력하기\n### 문제:\n변수 dan에 원하는 단(2~9)을 저장한 뒤,\nfor 반복문으로 해당 단의 구구단을 출력하시오.\n출력 형식: 5 x 1 = 5\ndan 값을 바꾸어 3단, 7단도 테스트하시오.\n\n출력 예시 (dan = 5):\n--- 5단 ---\n5 x 1 = 5\n5 x 2 = 10\n...\n5 x 9 = 45\nfor 반복문으로 구구단을 완성하세요",
    "code": "let dan = 5;   // 이 숫자를 바꿔가며 테스트하세요\nconsole.log('---', dan + '단', '---');\n\nfor (          ) {\n\n}"
  },
  {
    "id": "lab07_array_avg",
    "title": "실습 07 - 배열로 성적 합계·평균 구하기",
    "markdown": "## 실습 07 - 배열로 성적 합계·평균 구하기\n### 문제:\n점수 배열 scores를 이용하여 합계와 평균을 구하시오.\n- for 반복문과 scores.length를 사용하여 합계를 구한다.\n- 평균 = 합계 ÷ 배열 길이\n\n### 출력 예시:\n```text\n점수 목록: 85 92 78 96 60\n합계: 411\n평균: 82.2\nfor 반복문으로 합계를 구하세요\n평균을 계산하세요\n```",
    "code": "let scores = [85, 92, 78, 96, 60];\nlet total  = 0;\n\nfor (          ) {\n\n}\n\nlet average = ;\n\nconsole.log('점수 목록:', scores.join(' '));\nconsole.log('합계:', total);\nconsole.log('평균:', average);"
  },
  {
    "id": "lab08_func_max",
    "title": "실습 08 - 함수로 배열의 최댓값 구하기",
    "markdown": "## 실습 08 - 함수로 배열의 최댓값 구하기\n### 문제:\n배열을 매개변수로 받아 최댓값을 반환하는\n함수 findMax(arr)를 직접 작성하시오.\n- for 반복문으로 배열 전체를 순회하며 가장 큰 값을 찾는다.\n- Math.max() 사용 불가 — 반복문으로 직접 구현한다.\n\n### 출력 예시:\n```text\n배열: 3 7 2 9 5 1 8\n최댓값: 9\nfindMax 함수를 완성하세요\n```",
    "code": "let numbers = [3, 7, 2, 9, 5, 1, 8];\n\nfunction findMax(arr) {\n    let max = arr[0];   // 첫 번째 값을 초기 최댓값으로 설정\n\n    // for 반복문으로 나머지 요소를 비교하세요\n\n\n    return max;\n}\n\nconsole.log('배열:', numbers.join(' '));\nconsole.log('최댓값:', findMax(numbers));"
  },
  {
    "id": "lab09_func_even",
    "title": "실습 09 - 함수로 짝수·홀수 판별하기",
    "markdown": "## 실습 09 - 함수로 짝수·홀수 판별하기\n### 문제:\n숫자를 매개변수로 받아 '짝수' 또는 '홀수'를\n반환하는 함수 checkEvenOdd(n)을 작성하시오.\n- % (나머지) 연산자를 사용한다.\n- 함수 작성 후 1~10까지 각 숫자에 적용하여 출력한다.\n\n### 출력 예시:\n```text\n1 → 홀수\n2 → 짝수\n...\n10 → 짝수\ncheckEvenOdd 함수를 완성하세요\nfor 반복문으로 1~10까지 출력하세요\n```",
    "code": "function checkEvenOdd(n) {\n\n}\n\nfor (          ) {\n\n}"
  },
  {
    "id": "lab10_callback_filter",
    "title": "실습 10 - 콜백 함수로 배열 필터링하기",
    "markdown": "## 실습 10 - 콜백 함수로 배열 필터링하기\n### 문제:\n배열과 조건 함수(콜백)를 받아 조건을 만족하는\n요소만 모아 반환하는 함수 myFilter(arr, callback)를 작성하시오.\n- callback(요소)가 true를 반환하는 요소만 결과 배열에 담는다.\n- 두 가지 콜백(50 이상, 홀수)으로 테스트한다.\n\n### 출력 예시:\n```text\n원본: 12 45 88 30 67 55 9 71\n50 이상: 88 67 55 71\n홀수: 45 67 9 71\nmyFilter 함수를 완성하세요\n50 이상 필터\n홀수 필터\n```",
    "code": "let scores = [12, 45, 88, 30, 67, 55, 9, 71];\n\nfunction myFilter(arr, callback) {\n    let filtered = [];\n    for (let i = 0; i < arr.length; i++) {\n        // callback이 true를 반환할 때만 filtered에 추가하세요\n\n    }\n    return filtered;\n}\n\nlet over50 = myFilter(scores, function(n) {\n    // 50 이상이면 true 반환\n\n});\n\nlet odds = myFilter(scores, function(n) {\n    // 홀수이면 true 반환\n\n});\n\nconsole.log('원본:', scores.join(' '));\nconsole.log('50 이상:', over50.join(' '));\nconsole.log('홀수:', odds.join(' '));"
  },
  {
    "id": "lab11_object_myinfo",
    "title": "실습 11 - 나만의 객체 만들기",
    "markdown": "## 실습 11 - 나만의 객체 만들기\n### 문제:\n자신의 정보를 담은 객체 myInfo를 직접 만들고 출력하시오.\n- 속성: name(이름), age(나이), major(전공), hobby(취미)\n- 메서드: introduce() — \"안녕하세요, 저는 [이름]이고 [전공]을 전공하고 있습니다.\" 반환\n\n### 출력 예시:\n```text\n이름: 홍길동\n나이: 20\n전공: 컴퓨터정보과\n취미: 게임\n---\n안녕하세요, 저는 홍길동이고 컴퓨터정보과을 전공하고 있습니다.\n```",
    "code": "let myInfo = {\n    name     : '',    // 자신의 이름\n    age      : 0,     // 자신의 나이\n    major    : '',    // 전공\n    hobby    : '',    // 취미\n    introduce: function() {\n        // this를 사용하여 자기소개 문장을 반환하세요\n\n    }\n};\n\nconsole.log('이름:', myInfo.name);\nconsole.log('나이:', myInfo.age);\nconsole.log('전공:', myInfo.major);\nconsole.log('취미:', myInfo.hobby);\nconsole.log('---');\nconsole.log(myInfo.introduce());"
  },
  {
    "id": "lab12_forin",
    "title": "실습 12 - for in으로 상품 정보 출력하기",
    "markdown": "## 실습 12 - for in으로 상품 정보 출력하기\n### 문제:\n아래 상품 객체의 모든 키와 값을 for in 반복문으로 출력하시오.\n- 출력 형식: 키: 값\n- price이면 값 뒤에 '원', stock이면 '개' 단위를 붙인다.\n\n### 출력 예시:\n```text\nname: 무선 마우스\nbrand: 로지텍\nprice: 35000원\nstock: 12개\nfor in 반복문으로 완성하세요\n```",
    "code": "let item = {\n    name  : '무선 마우스',\n    brand : '로지텍',\n    price : 35000,\n    stock : 12\n};\n\nfor (          ) {\n\n}"
  },
  {
    "id": "lab13_forof",
    "title": "실습 13 - for of로 과일 목록 출력하기",
    "markdown": "## 실습 13 - for of로 과일 목록 출력하기\n### 문제:\nfor of 반복문으로 과일 배열을 순환하고,\n각 과일 이름의 길이와 함께 출력하시오.\n- 출력 형식: 사과 (2글자)\n- 가장 긴 이름의 과일도 별도로 출력한다.\n\n### 출력 예시:\n```text\n사과 (2글자)\n바나나 (3글자)\n...\n---\n가장 긴 이름: 파인애플 (4글자)\nfor of 반복문으로 완성하세요\n```",
    "code": "let fruits  = ['사과', '바나나', '딸기', '수박', '파인애플', '블루베리'];\nlet maxLen   = 0;\nlet maxFruit = '';\n\nfor (          ) {\n\n}\n\nconsole.log('---');\nconsole.log('가장 긴 이름:', maxFruit, '(' + maxLen + '글자)');"
  },
  {
    "id": "lab14_array_object",
    "title": "실습 14 - 배열 안 객체로 성적표 출력하기",
    "markdown": "## 실습 14 - 배열 안 객체로 성적표 출력하기\n### 문제:\n아래 학생 배열을 for 반복문으로 순회하여\n이름, 점수, 합격 여부를 출력하시오.\n- 60점 이상이면 '합격', 미만이면 '불합격'\n- 전체 평균 점수도 함께 출력한다.\n\n### 출력 예시:\n```text\n번호  이름    점수  결과\n--------------------------\n1     홍길동  85점  합격\n2     임꺽정  42점  불합격\n...\n--------------------------\n평균: 68점\nfor 반복문으로 각 학생 정보를 출력하고 합계를 구하세요\n평균을 계산하여 출력하세요\n```",
    "code": "let students = [\n    { name: '홍길동', score: 85 },\n    { name: '임꺽정', score: 42 },\n    { name: '장보고', score: 91 },\n    { name: '이순신', score: 67 },\n    { name: '강감찬', score: 55 }\n];\n\nconsole.log('번호  이름    점수  결과');\nconsole.log('--------------------------');\n\nlet total = 0;\n\nfor (          ) {\n\n}\n\nlet avg = ;\nconsole.log('--------------------------');\nconsole.log('평균:', avg + '점');"
  },
  {
    "id": "lab15_nested_for",
    "title": "실습 15 - 중첩 for문으로 구구단 전체 출력하기",
    "markdown": "## 실습 15 - 중첩 for문으로 구구단 전체 출력하기\n### 문제:\n중첩 for 반복문(for 안에 for)으로\n2단부터 9단까지 구구단 전체를 출력하시오.\n- 바깥 for: 단(2~9)\n- 안쪽 for: 각 단의 1~9\n\n### 출력 예시:\n```text\n=== 2단 ===\n2 x 1 = 2\n...\n=== 3단 ===\n3 x 1 = 3\n...\n중첩 for 반복문을 작성하세요\n```",
    "code": "for (          ) {\n    console.log('===', dan + '단', '===');\n    for (          ) {\n\n    }\n    console.log('');\n}"
  },
  {
    "id": "lab16_method_this",
    "title": "실습 16 - 메서드와 this로 계산기 객체 만들기",
    "markdown": "## 실습 16 - 메서드와 this로 계산기 객체 만들기\n### 문제:\n두 숫자(a, b)를 속성으로 가지고\n사칙연산 메서드를 포함한 객체 calc를 작성하시오.\n- 속성: a, b (숫자)\n- 메서드: add(), sub(), mul(), div()\n- 각 메서드는 this.a와 this.b로 계산하여 반환한다.\n\n출력 예시 (a=12, b=4):\na = 12,  b = 4\n더하기: 16\n빼기: 8\n곱하기: 48\n나누기: 3",
    "code": "let calc = {\n    a  : 12,\n    b  : 4,\n    add: function() {\n        // this.a + this.b 반환\n\n    },\n    sub: function() {\n        // this.a - this.b 반환\n\n    },\n    mul: function() {\n        // this.a * this.b 반환\n\n    },\n    div: function() {\n        // this.a / this.b 반환\n\n    }\n};\n\nconsole.log('a =', calc.a, ',  b =', calc.b);\nconsole.log('더하기:', calc.add());\nconsole.log('빼기:',   calc.sub());\nconsole.log('곱하기:', calc.mul());\nconsole.log('나누기:', calc.div());"
  },
  {
    "id": "lab17_callback_map",
    "title": "실습 17 - 콜백으로 배열 변환하기 (myMap)",
    "markdown": "## 실습 17 - 콜백으로 배열 변환하기 (myMap)\n### 문제:\n배열의 각 요소에 콜백 함수를 적용하여\n새 배열을 만드는 함수 myMap(arr, callback)을 작성하시오.\n- 원본 배열은 바꾸지 않고 새 배열을 반환한다.\n- 두 가지 콜백(2배, 제곱)으로 테스트한다.\n\n### 출력 예시:\n```text\n원본: 1 2 3 4 5\n2배: 2 4 6 8 10\n제곱: 1 4 9 16 25\nmyMap 함수를 완성하세요\n2배 콜백\n제곱 콜백\n```",
    "code": "let nums = [1, 2, 3, 4, 5];\n\nfunction myMap(arr, callback) {\n    let newArr = [];\n    for (let i = 0; i < arr.length; i++) {\n        // callback으로 변환한 값을 newArr에 추가하세요\n\n    }\n    return newArr;\n}\n\nlet doubled = myMap(nums, function(n) {\n\n});\n\nlet squared = myMap(nums, function(n) {\n\n});\n\nconsole.log('원본:', nums.join(' '));\nconsole.log('2배:', doubled.join(' '));\nconsole.log('제곱:', squared.join(' '));"
  },
  {
    "id": "lab18_stats",
    "title": "실습 18 - 학생 객체 배열에서 통계 계산하기",
    "markdown": "## 실습 18 - 학생 객체 배열에서 통계 계산하기\n### 문제:\n아래 학생 배열을 for 반복문으로 순회하여\n다음 통계를 계산하고 출력하시오.\n- 전체 평균 점수\n- 최고 점수를 받은 학생 이름과 점수\n- 최저 점수를 받은 학생 이름과 점수\n- 80점 이상인 학생 수\n\n### 출력 예시:\n```text\n전체 평균: 74점\n최고 점수: 이순신 (96점)\n최저 점수: 강감찬 (48점)\n80점 이상 학생 수: 3명\nfor 반복문으로 통계를 계산하세요\n```",
    "code": "let students = [\n    { name: '홍길동',   score: 85 },\n    { name: '임꺽정',   score: 72 },\n    { name: '장보고',   score: 91 },\n    { name: '이순신',   score: 96 },\n    { name: '강감찬',   score: 48 },\n    { name: '을지문덕', score: 53 }\n];\n\nlet total      = 0;\nlet maxScore   = students[0].score;\nlet maxName    = students[0].name;\nlet minScore   = students[0].score;\nlet minName    = students[0].name;\nlet overEighty = 0;\n\nfor (          ) {\n\n}\n\nlet avg = ;\nconsole.log('전체 평균:', avg + '점');\nconsole.log('최고 점수:', maxName, '(' + maxScore + '점)');\nconsole.log('최저 점수:', minName, '(' + minScore + '점)');\nconsole.log('80점 이상 학생 수:', overEighty + '명');"
  },
  {
    "id": "lab19_fibonacci",
    "title": "실습 19 - 함수로 피보나치 수열 만들기",
    "markdown": "## 실습 19 - 함수로 피보나치 수열 만들기\n### 문제:\n첫 n개의 피보나치 수열을 배열로 반환하는\n함수 fibonacci(n)을 작성하시오.\n- 피보나치: 1, 1, 2, 3, 5, 8, 13, 21 ...\n- 처음 두 값은 1, 1로 시작한다.\n- for 반복문으로 나머지를 계산하여 배열에 추가한다.\n(힌트: fib[i] = fib[i-1] + fib[i-2])\n\n### 출력 예시:\n```text\n피보나치 10개: 1 1 2 3 5 8 13 21 34 55\n피보나치 5개:  1 1 2 3 5\nfibonacci 함수를 완성하세요\n```",
    "code": "function fibonacci(n) {\n    let fib = [1, 1];   // 처음 두 값\n\n    // for 반복문으로 나머지 값을 계산하여 fib에 추가하세요\n    for (          ) {\n\n    }\n\n    return fib;\n}\n\nconsole.log('피보나치 10개:', fibonacci(10).join(' '));\nconsole.log('피보나치 5개: ', fibonacci(5).join(' '));"
  },
  {
    "id": "lab20_final",
    "title": "실습 20 - 종합 도전: 미니 성적 관리 시스템",
    "markdown": "## 실습 20 - 종합 도전: 미니 성적 관리 시스템\n### 문제:\n아래 기능을 모두 갖춘 성적 관리 시스템을 작성하시오.\n\n① 학생 데이터: 배열 안 객체 형태로 5명의 이름과 점수를 저장한다.\n② 함수 getGrade(score): 점수를 받아 A/B/C/D/F 학점을 반환한다.\n③ 함수 getStats(students): 학생 배열을 받아\n{avg, max, min, passCount} 객체를 반환한다.\n- avg: 평균, max: 최고점, min: 최저점, passCount: 60점 이상 학생 수\n④ for 반복문으로 각 학생의 이름, 점수, 학점을 출력한다.\n⑤ getStats()를 호출하여 통계를 출력한다.\n\n### 출력 예시:\n```text\n== 성적표 ==\n홍길동  85점  B\n임꺽정  42점  F\n장보고  91점  A\n이순신  67점  C\n강감찬  78점  C\n\n== 통계 ==\n평균: 72.6점\n최고: 91점\n최저: 42점\n합격자 수: 4명\n① 학생 데이터 배열\n② getGrade 함수\n③ getStats 함수\n④ 성적표 출력\n⑤ 통계 출력\n```",
    "code": "let students = [\n\n];\n\nfunction getGrade(score) {\n\n}\n\nfunction getStats(arr) {\n    let stats = { avg: 0, max: 0, min: 100, passCount: 0 };\n\n    // for 반복문으로 통계를 계산하세요\n\n\n    stats.avg = ;\n    return stats;\n}\n\nconsole.log('== 성적표 ==');\nfor (          ) {\n\n}\n\nlet s = getStats(students);\nconsole.log('\\n== 통계 ==');\nconsole.log('평균:', s.avg + '점');\nconsole.log('최고:', s.max + '점');\nconsole.log('최저:', s.min + '점');\nconsole.log('합격자 수:', s.passCount + '명');"
  }
];