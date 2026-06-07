// =========================================
// 실습 07 - 배열로 성적 합계·평균 구하기 [정답]
// =========================================

let scores = [85, 92, 78, 96, 60];
let total  = 0;

for (let i = 0; i < scores.length; i++) {
    total += scores[i];
}

let average = total / scores.length;

console.log('점수 목록:', scores.join(' '));
console.log('합계:', total);
console.log('평균:', average);
