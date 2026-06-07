// =========================================
// 실습 17 - 콜백으로 배열 변환하기 (myMap) [정답]
// =========================================

let nums = [1, 2, 3, 4, 5];

function myMap(arr, callback) {
    let newArr = [];
    for (let i = 0; i < arr.length; i++) {
        newArr.push(callback(arr[i]));
    }
    return newArr;
}

let doubled = myMap(nums, function(n) {
    return n * 2;
});

let squared = myMap(nums, function(n) {
    return n * n;
});

console.log('원본:', nums.join(' '));
console.log('2배:', doubled.join(' '));
console.log('제곱:', squared.join(' '));
