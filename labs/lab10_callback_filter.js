// =========================================
// 실습 10 - 콜백 함수로 배열 필터링하기
// 참고: 예제07_콜백함수.js
// 실행: Ctrl + Alt + N
// =========================================
// 문제:
//   배열과 조건 함수(콜백)를 받아 조건을 만족하는
//   요소만 모아 반환하는 함수 myFilter(arr, callback)를 작성하시오.
//   - callback(요소)가 true를 반환하는 요소만 결과 배열에 담는다.
//   - 두 가지 콜백(50 이상, 홀수)으로 테스트한다.
//
// 출력 예시:
//   원본: 12 45 88 30 67 55 9 71
//   50 이상: 88 67 55 71
//   홀수: 45 67 9 71
// =========================================

let scores = [12, 45, 88, 30, 67, 55, 9, 71];

// myFilter 함수를 완성하세요
function myFilter(arr, callback) {
    let filtered = [];
    for (let i = 0; i < arr.length; i++) {
        // callback이 true를 반환할 때만 filtered에 추가하세요

    }
    return filtered;
}

// 50 이상 필터
let over50 = myFilter(scores, function(n) {
    // 50 이상이면 true 반환

});

// 홀수 필터
let odds = myFilter(scores, function(n) {
    // 홀수이면 true 반환

});

console.log('원본:', scores.join(' '));
console.log('50 이상:', over50.join(' '));
console.log('홀수:', odds.join(' '));
