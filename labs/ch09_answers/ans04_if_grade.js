// =========================================
// 실습 04 - 조건문으로 학점 출력하기 [정답]
// =========================================

let score = 83;
let grade = '';

if (score >= 90)      { grade = 'A학점'; }
else if (score >= 80) { grade = 'B학점'; }
else if (score >= 70) { grade = 'C학점'; }
else if (score >= 60) { grade = 'D학점'; }
else                  { grade = 'F학점'; }

console.log('점수:', score);
console.log('학점:', grade);
