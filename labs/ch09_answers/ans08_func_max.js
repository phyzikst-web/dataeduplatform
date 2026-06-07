// =========================================
// 실습 08 - 함수로 배열의 최댓값 구하기 [정답]
// =========================================

let numbers = [3, 7, 2, 9, 5, 1, 8];

function findMax(arr) {
    let max = arr[0];
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            max = arr[i];
        }
    }
    return max;
}

console.log('배열:', numbers.join(' '));
console.log('최댓값:', findMax(numbers));
