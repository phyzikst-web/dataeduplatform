// =========================================
// 실습 14 - 배열 안 객체로 성적표 출력하기 [정답]
// =========================================

let students = [
    { name: '홍길동', score: 85 },
    { name: '임꺽정', score: 42 },
    { name: '장보고', score: 91 },
    { name: '이순신', score: 67 },
    { name: '강감찬', score: 55 }
];

console.log('번호  이름    점수  결과');
console.log('--------------------------');

let total = 0;

for (let i = 0; i < students.length; i++) {
    let s      = students[i];
    let result = s.score >= 60 ? '합격' : '불합격';
    total += s.score;
    console.log((i + 1) + '     ' + s.name + '  ' + s.score + '점  ' + result);
}

let avg = total / students.length;
console.log('--------------------------');
console.log('평균:', avg + '점');
