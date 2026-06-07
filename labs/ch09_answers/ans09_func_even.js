// =========================================
// 실습 09 - 함수로 짝수·홀수 판별하기 [정답]
// =========================================

function checkEvenOdd(n) {
    if (n % 2 === 0) { return '짝수'; }
    else             { return '홀수'; }
}

for (let i = 1; i <= 10; i++) {
    console.log(i + ' → ' + checkEvenOdd(i));
}
