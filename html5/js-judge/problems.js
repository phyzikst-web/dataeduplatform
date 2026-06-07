/**
 * JS Judge - 호스팅 문제 목록 인덱스
 * 
 * 자바스크립트 실전 코딩 테스트에 사용할 문제 데이터입니다.
 * 객체 배열에 문제 정보와 테스트 케이스를 직접 입력할 수 있습니다.
 */

const JS_PROBLEMS = [
  {
    id: "js_q1",
    title: "[Lv.1] 배열의 합 구하기",
    description: "주어진 숫자 배열(arr)의 모든 원소의 합을 구하는 함수를 작성하세요.\n\n예: [1, 2, 3, 4] -> 10\n예: [10, 20, -5] -> 25",
    example_input: "[1, 2, 3, 4]",
    example_output: "10",
    test_cases: [
      { input: "[1, 2, 3, 4]", output: "10" },
      { input: "[10, 20, -5]", output: "25" },
      { input: "[0, 0, 0]", output: "0" },
      { input: "[100]", output: "100" }
    ]
  },
  {
    id: "js_q2",
    title: "[Lv.1] 짝수만 필터링하기",
    description: "주어진 배열(arr)에서 짝수만 포함된 새로운 배열을 반환하는 함수를 작성하세요.\n\n예: [1, 2, 3, 4, 5, 6] -> [2, 4, 6]",
    example_input: "[1, 2, 3, 4, 5, 6]",
    example_output: "[2, 4, 6]",
    test_cases: [
      { input: "[1, 2, 3, 4, 5, 6]", output: "[2, 4, 6]" },
      { input: "[2, 4, 6, 8]", output: "[2, 4, 6, 8]" },
      { input: "[1, 3, 5, 7]", output: "[]" }
    ]
  },
  {
    id: "js_q3",
    title: "[Lv.2] 가장 큰 두 수의 곱",
    description: "배열에서 가장 큰 두 수를 찾아 곱한 값을 반환하세요. 배열의 길이는 항상 2 이상이며, 모든 요소는 양수라고 가정합니다.\n\n예: [3, 1, 4, 1, 5, 9] -> 45 (5 * 9)",
    example_input: "[3, 1, 4, 1, 5, 9]",
    example_output: "45",
    test_cases: [
      { input: "[3, 1, 4, 1, 5, 9]", output: "45" },
      { input: "[10, 10, 2, 3]", output: "100" },
      { input: "[2, 3]", output: "6" }
    ]
  }
];
