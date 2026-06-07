// =========================================
// 실습 13 - for of로 과일 목록 출력하기 [정답]
// =========================================

let fruits  = ['사과', '바나나', '딸기', '수박', '파인애플', '블루베리'];
let maxLen   = 0;
let maxFruit = '';

for (let fruit of fruits) {
    console.log(fruit + ' (' + fruit.length + '글자)');
    if (fruit.length > maxLen) {
        maxLen   = fruit.length;
        maxFruit = fruit;
    }
}

console.log('---');
console.log('가장 긴 이름:', maxFruit, '(' + maxLen + '글자)');
