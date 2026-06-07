// =========================================
// 실습 11 - 나만의 객체 만들기
// 참고: 예제08_객체생성과속성메서드.js
// 실행: Ctrl + Alt + N
// =========================================
// 문제:
//   자신의 정보를 담은 객체 myInfo를 직접 만들고 출력하시오.
//   - 속성: name(이름), age(나이), major(전공), hobby(취미)
//   - 메서드: introduce() — "안녕하세요, 저는 [이름]이고 [전공]을 전공하고 있습니다." 반환
//
// 출력 예시:
//   이름: 홍길동
//   나이: 20
//   전공: 컴퓨터정보과
//   취미: 게임
//   ---
//   안녕하세요, 저는 홍길동이고 컴퓨터정보과을 전공하고 있습니다.
// =========================================

let myInfo = {
    name     : '',    // 자신의 이름
    age      : 0,     // 자신의 나이
    major    : '',    // 전공
    hobby    : '',    // 취미
    introduce: function() {
        // this를 사용하여 자기소개 문장을 반환하세요

    }
};

console.log('이름:', myInfo.name);
console.log('나이:', myInfo.age);
console.log('전공:', myInfo.major);
console.log('취미:', myInfo.hobby);
console.log('---');
console.log(myInfo.introduce());
