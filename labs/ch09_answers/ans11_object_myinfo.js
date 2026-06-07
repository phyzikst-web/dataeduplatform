// =========================================
// 실습 11 - 나만의 객체 만들기 [정답]
// =========================================

let myInfo = {
    name     : '홍길동',
    age      : 20,
    major    : '컴퓨터정보과',
    hobby    : '게임',
    introduce: function() {
        return '안녕하세요, 저는 ' + this.name + '이고 ' + this.major + '을 전공하고 있습니다.';
    }
};

console.log('이름:', myInfo.name);
console.log('나이:', myInfo.age);
console.log('전공:', myInfo.major);
console.log('취미:', myInfo.hobby);
console.log('---');
console.log(myInfo.introduce());
