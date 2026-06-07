// =========================================
// 실습 18 - 학생 객체 배열에서 통계 계산하기 [정답]
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

for (let i = 0; i < students.length; i++) {
    let s = students[i];
    total += s.score;
    if (s.score > maxScore) { maxScore = s.score; maxName = s.name; }
    if (s.score < minScore) { minScore = s.score; minName = s.name; }
    if (s.score >= 80)      { overEighty++; }
}

let avg = total / students.length;
console.log('전체 평균:', avg + '점');
console.log('최고 점수:', maxName, '(' + maxScore + '점)');
console.log('최저 점수:', minName, '(' + minScore + '점)');
console.log('80점 이상 학생 수:', overEighty + '명');
