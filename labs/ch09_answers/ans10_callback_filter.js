// =========================================
// 실습 10 - 콜백 함수로 배열 필터링하기 [정답]
// =========================================

let scores = [12, 45, 88, 30, 67, 55, 9, 71];

function myFilter(arr, callback) {
    let filtered = [];
    for (let i = 0; i < arr.length; i++) {
        if (callback(arr[i])) {
            filtered.push(arr[i]);
        }
    }
    return filtered;
}

let over50 = myFilter(scores, function(n) {
    return n >= 50;
});

let odds = myFilter(scores, function(n) {
    return n % 2 !== 0;
});

console.log('원본:', scores.join(' '));
console.log('50 이상:', over50.join(' '));
console.log('홀수:', odds.join(' '));
