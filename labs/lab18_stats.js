// =========================================
// 실습 18 - 학생 객체 배열에서 통계 계산하기
// 참고: 예제10_배열안객체와종합활용.js
// 실행: Ctrl + Alt + N
// =========================================
// 문제:
//   아래 학생 배열을 for 반복문으로 순회하여
//   다음 통계를 계산하고 출력하시오.
//   - 전체 평균 점수
//   - 최고 점수를 받은 학생 이름과 점수
//   - 최저 점수를 받은 학생 이름과 점수
//   - 80점 이상인 학생 수
//
// 출력 예시:
//   전체 평균: 74점
//   최고 점수: 이순신 (96점)
//   최저 점수: 강감찬 (48점)
//   80점 이상 학생 수: 3명
// =========================================

let students = [
    { name: '홍길동',   score: 85 },
    { name: '임꺽정',   score: 72 },
    { name: '장보고',   score: 91 },
    { name: '이순신',   score: 96 },
    { name: '강감찬',   score: 48 },
    { name: '을지문덕', score: 53 }
];

let total      = 0;
let maxScore   = students[0].score;
let maxName    = students[0].name;
let minScore   = students[0].score;
let minName    = students[0].name;
let overEighty = 0;

// for 반복문으로 통계를 계산하세요
for (          ) {

}

let avg = ;
console.log('전체 평균:', avg + '점');
console.log('최고 점수:', maxName, '(' + maxScore + '점)');
console.log('최저 점수:', minName, '(' + minScore + '점)');
console.log('80점 이상 학생 수:', overEighty + '명');
