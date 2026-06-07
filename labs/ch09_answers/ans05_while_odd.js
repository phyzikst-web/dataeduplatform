// =========================================
// 실습 05 - while 반복문으로 홀수 합계 구하기 [정답]
// =========================================

let i       = 1;
let sum     = 0;
let numList = '';

while (i <= 20) {
    if (i % 2 !== 0) {
        numList += i + ' ';
        sum += i;
    }
    i++;
}

console.log('홀수 목록:', numList.trim());
console.log('합계:', sum);
