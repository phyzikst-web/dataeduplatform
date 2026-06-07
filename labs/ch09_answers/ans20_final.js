// =========================================
// 실습 20 - 종합 도전: 미니 성적 관리 시스템 [정답]
// =========================================

// ① 학생 데이터 배열
let students = [
    { name: '홍길동', score: 85 },
    { name: '임꺽정', score: 42 },
    { name: '장보고', score: 91 },
    { name: '이순신', score: 67 },
    { name: '강감찬', score: 78 }
];

// ② getGrade 함수
function getGrade(score) {
    if (score >= 90) { return 'A'; }
    if (score >= 80) { return 'B'; }
    if (score >= 70) { return 'C'; }
    if (score >= 60) { return 'D'; }
    return 'F';
}

// ③ getStats 함수
function getStats(arr) {
    let stats = { avg: 0, max: 0, min: 100, passCount: 0 };
    let total = 0;
    for (let i = 0; i < arr.length; i++) {
        let s = arr[i];
        total += s.score;
        if (s.score > stats.max) { stats.max = s.score; }
        if (s.score < stats.min) { stats.min = s.score; }
        if (s.score >= 60)       { stats.passCount++; }
    }
    stats.avg = total / arr.length;
    return stats;
}

// ④ 성적표 출력
console.log('== 성적표 ==');
for (let i = 0; i < students.length; i++) {
    let s = students[i];
    console.log(s.name + '  ' + s.score + '점  ' + getGrade(s.score));
}

// ⑤ 통계 출력
let s = getStats(students);
console.log('\n== 통계 ==');
console.log('평균:', s.avg + '점');
console.log('최고:', s.max + '점');
console.log('최저:', s.min + '점');
console.log('합격자 수:', s.passCount + '명');
