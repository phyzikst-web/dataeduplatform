// =========================================
// 실습 20 - 종합 도전: 미니 성적 관리 시스템
// 참고: 예제 01~10 전체
// 실행: Ctrl + Alt + N
// =========================================
// 문제:
//   아래 기능을 모두 갖춘 성적 관리 시스템을 작성하시오.
//
//   ① 학생 데이터: 배열 안 객체 형태로 5명의 이름과 점수를 저장한다.
//   ② 함수 getGrade(score): 점수를 받아 A/B/C/D/F 학점을 반환한다.
//   ③ 함수 getStats(students): 학생 배열을 받아
//      {avg, max, min, passCount} 객체를 반환한다.
//      - avg: 평균, max: 최고점, min: 최저점, passCount: 60점 이상 학생 수
//   ④ for 반복문으로 각 학생의 이름, 점수, 학점을 출력한다.
//   ⑤ getStats()를 호출하여 통계를 출력한다.
//
// 출력 예시:
//   == 성적표 ==
//   홍길동  85점  B
//   임꺽정  42점  F
//   장보고  91점  A
//   이순신  67점  C
//   강감찬  78점  C
//
//   == 통계 ==
//   평균: 72.6점
//   최고: 91점
//   최저: 42점
//   합격자 수: 4명
// =========================================

// ① 학생 데이터 배열
let students = [

];

// ② getGrade 함수
function getGrade(score) {

}

// ③ getStats 함수
function getStats(arr) {
    let stats = { avg: 0, max: 0, min: 100, passCount: 0 };

    // for 반복문으로 통계를 계산하세요


    stats.avg = ;
    return stats;
}

// ④ 성적표 출력
console.log('== 성적표 ==');
for (          ) {

}

// ⑤ 통계 출력
let s = getStats(students);
console.log('\n== 통계 ==');
console.log('평균:', s.avg + '점');
console.log('최고:', s.max + '점');
console.log('최저:', s.min + '점');
console.log('합격자 수:', s.passCount + '명');
