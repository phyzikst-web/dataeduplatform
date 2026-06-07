// =========================================
// 실습 19 - 함수로 피보나치 수열 만들기 [정답]
// =========================================

function fibonacci(n) {
    let fib = [1, 1];
    for (let i = 2; i < n; i++) {
        fib.push(fib[i - 1] + fib[i - 2]);
    }
    return fib;
}

console.log('피보나치 10개:', fibonacci(10).join(' '));
console.log('피보나치 5개: ', fibonacci(5).join(' '));
