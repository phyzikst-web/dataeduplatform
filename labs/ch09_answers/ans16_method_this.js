// =========================================
// 실습 16 - 메서드와 this로 계산기 객체 만들기 [정답]
// =========================================

let calc = {
    a  : 12,
    b  : 4,
    add: function() { return this.a + this.b; },
    sub: function() { return this.a - this.b; },
    mul: function() { return this.a * this.b; },
    div: function() { return this.a / this.b; }
};

console.log('a =', calc.a, ',  b =', calc.b);
console.log('더하기:', calc.add());
console.log('빼기:',   calc.sub());
console.log('곱하기:', calc.mul());
console.log('나누기:', calc.div());
