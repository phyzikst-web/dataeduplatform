// =========================================
// 실습 16 - 메서드와 this로 계산기 객체 만들기
// 참고: 예제08_객체생성과속성메서드.js
// 실행: Ctrl + Alt + N
// =========================================
// 문제:
//   두 숫자(a, b)를 속성으로 가지고
//   사칙연산 메서드를 포함한 객체 calc를 작성하시오.
//   - 속성: a, b (숫자)
//   - 메서드: add(), sub(), mul(), div()
//   - 각 메서드는 this.a와 this.b로 계산하여 반환한다.
//
// 출력 예시 (a=12, b=4):
//   a = 12,  b = 4
//   더하기: 16
//   빼기: 8
//   곱하기: 48
//   나누기: 3
// =========================================

let calc = {
    a  : 12,
    b  : 4,
    add: function() {
        // this.a + this.b 반환

    },
    sub: function() {
        // this.a - this.b 반환

    },
    mul: function() {
        // this.a * this.b 반환

    },
    div: function() {
        // this.a / this.b 반환

    }
};

console.log('a =', calc.a, ',  b =', calc.b);
console.log('더하기:', calc.add());
console.log('빼기:',   calc.sub());
console.log('곱하기:', calc.mul());
console.log('나누기:', calc.div());
