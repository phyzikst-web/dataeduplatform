// =========================================
// 실습 17 - 콜백으로 배열 변환하기 (myMap)
// 참고: 예제07_콜백함수.js
// 실행: Ctrl + Alt + N
// =========================================
// 문제:
//   배열의 각 요소에 콜백 함수를 적용하여
//   새 배열을 만드는 함수 myMap(arr, callback)을 작성하시오.
//   - 원본 배열은 바꾸지 않고 새 배열을 반환한다.
//   - 두 가지 콜백(2배, 제곱)으로 테스트한다.
//
// 출력 예시:
//   원본: 1 2 3 4 5
//   2배: 2 4 6 8 10
//   제곱: 1 4 9 16 25
// =========================================

let nums = [1, 2, 3, 4, 5];

// myMap 함수를 완성하세요
function myMap(arr, callback) {
    let newArr = [];
    for (let i = 0; i < arr.length; i++) {
        // callback으로 변환한 값을 newArr에 추가하세요

    }
    return newArr;
}

// 2배 콜백
let doubled = myMap(nums, function(n) {

});

// 제곱 콜백
let squared = myMap(nums, function(n) {

});

console.log('원본:', nums.join(' '));
console.log('2배:', doubled.join(' '));
console.log('제곱:', squared.join(' '));
