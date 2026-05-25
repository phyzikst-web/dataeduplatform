import json
import os

week3_data = {
  "week": 3,
  "topic": "스택(Stack)과 큐(Queue)",
  "quiz": [
    {
      "question": "1. 스택(Stack)의 작동 원리를 가장 잘 설명한 용어는 무엇인가요?",
      "options": ["FIFO (First-In First-Out)", "LIFO (Last-In First-Out)", "LILO (Last-In Last-Out)", "LRU (Least Recently Used)"],
      "answer": 1,
      "explanation": "스택은 가장 마지막에 들어온 데이터가 가장 먼저 나가는 후입선출(LIFO, Last-In First-Out) 구조를 가집니다.",
      "difficulty": "하"
    },
    {
      "question": "2. 스택에서 데이터를 제거하지 않고, 가장 위에 있는 데이터가 무엇인지 확인만 하는 연산은 무엇인가요?",
      "options": ["push()", "pop()", "peek() / top()", "isEmpty()"],
      "answer": 2,
      "explanation": "peek() 또는 top() 연산은 데이터를 꺼내지 않고 가장 위에 무엇이 있는지만 확인하는 연산입니다.",
      "difficulty": "하"
    },
    {
      "question": "3. 스택에서 데이터의 삽입과 삭제가 일어나는 한쪽 끝을 가리키는 용어는 무엇인가요?",
      "options": ["Front", "Rear", "Top", "Tail"],
      "answer": 2,
      "explanation": "스택은 데이터의 삽입과 삭제가 항상 한쪽 끝인 'Top'에서만 일어납니다.",
      "difficulty": "하"
    },
    {
      "question": "4. 파이썬의 기본 리스트(list)를 활용하여 스택을 구현할 때, Push와 Pop 역할을 수행하는 메서드로 올바르게 짝지어진 것은 무엇인가요?",
      "options": ["insert(), remove()", "append(), pop()", "add(), delete()", "push(), pop()"],
      "answer": 1,
      "explanation": "파이썬 리스트에서 append()는 맨 뒤에 요소를 추가(Push 역할)하고, pop()은 맨 뒤 요소를 꺼내고 삭제(Pop 역할)합니다.",
      "difficulty": "중"
    },
    {
      "question": "5. 다음 중 스택(Stack) 자료구조를 활용하는 실무 사례로 가장 적절하지 않은 것은 무엇인가요?",
      "options": ["웹 브라우저의 '뒤로 가기'", "문서 에디터의 '실행 취소(Undo, Ctrl+Z)'", "함수 호출 역추적(Call Stack)", "인쇄 작업 대기열(Spooler)"],
      "answer": 3,
      "explanation": "인쇄 작업 대기열(Spooler)은 먼저 요청된 인쇄 작업을 순서대로 처리해야 하므로 선입선출(FIFO) 방식인 큐(Queue)를 사용합니다.",
      "difficulty": "중"
    },
    {
      "question": "6. 큐(Queue)의 작동 원리를 설명하는 가장 적절한 용어는 무엇인가요?",
      "options": ["LIFO (Last-In First-Out)", "FIFO (First-In First-Out)", "FILO (First-In Last-Out)", "LILO (Last-In Last-Out)"],
      "answer": 1,
      "explanation": "큐는 먼저 들어온 데이터가 먼저 나가는 선입선출(FIFO, First-In First-Out) 구조를 가집니다.",
      "difficulty": "하"
    },
    {
      "question": "7. 큐(Queue)에서 데이터의 삽입과 삭제가 일어나는 위치를 올바르게 연결한 것은 무엇인가요?",
      "options": ["삽입: Front / 삭제: Rear", "삽입: Rear / 삭제: Front", "삽입: Top / 삭제: Bottom", "삽입: Top / 삭제: Top"],
      "answer": 1,
      "explanation": "큐는 양방향 흐름을 가지며, 한쪽 끝인 Rear(Tail)에서는 삽입만, 다른 쪽 끝인 Front(Head)에서는 삭제만 일어납니다.",
      "difficulty": "중"
    },
    {
      "question": "8. 큐의 맨 뒤(Rear)에 새로운 데이터를 추가하는 연산은 무엇인가요?",
      "options": ["enqueue()", "dequeue()", "peek()", "isEmpty()"],
      "answer": 0,
      "explanation": "enqueue()는 큐의 맨 뒤(Rear)에 새로운 데이터를 추가하는 연산입니다.",
      "difficulty": "하"
    },
    {
      "question": "9. 파이썬에서 고성능 큐를 구현하기 위해 권장되는 모듈과, 맨 앞 데이터를 효율적으로 추출할 때 사용하는 메서드는 무엇인가요?",
      "options": ["list - pop(0)", "collections.deque - popleft()", "queue - get()", "collections.deque - pop()"],
      "answer": 1,
      "explanation": "일반 리스트는 성능이 느리므로 파이썬에서는 collections.deque 모듈을 사용하는 것이 정석이며, 맨 앞 데이터를 추출할 때는 popleft()를 사용하여 O(1) 성능을 보장합니다.",
      "difficulty": "상"
    },
    {
      "question": "10. 다음 중 큐(Queue) 자료구조를 활용하기에 가장 적합한 실무 사례가 아닌 것은 무엇인가요?",
      "options": ["은행 업무 및 고객 센터 대기열", "네트워크 패킷 전송 처리", "문서 에디터의 실행 취소(Undo)", "OS의 프로세스 스케줄링"],
      "answer": 2,
      "explanation": "문서 에디터의 실행 취소(Undo)는 가장 최근에 한 행동을 먼저 취소해야 하므로 후입선출(LIFO) 방식인 스택을 사용합니다.",
      "difficulty": "중"
    },
    {
      "question": "11. 빈 스택에 다음과 같은 연산이 연속으로 수행되었을 때, 최종 스택의 상태로 올바른 것은?\n연산: Push(1) -> Push(2) -> Pop() -> Push(3)",
      "options": ["[1, 2]", "[2, 3]", "[1, 3]", "[3]"],
      "answer": 2,
      "explanation": "1이 들어가고 [1], 2가 들어가고 [1, 2], Pop() 연산으로 가장 위에 있는 2가 꺼내져 [1]이 되고, 다시 3이 들어가므로 최종 상태는 [1, 3]이 됩니다.",
      "difficulty": "상"
    },
    {
      "question": "12. 빈 큐에 다음과 같은 연산이 연속으로 수행되었을 때, 최종 큐의 상태로 올바른 것은?\n연산: Enqueue(1) -> Enqueue(2) -> Dequeue() -> Enqueue(3)",
      "options": ["[1, 2]", "[2, 3]", "[1, 3]", "[3]"],
      "answer": 1,
      "explanation": "1이 들어오고 [1], 2가 들어오고 [1, 2], Dequeue() 연산으로 가장 먼저 들어온 1이 제거되어 [2]가 되고, 3이 추가되므로 최종 상태는 [2, 3]이 됩니다.",
      "difficulty": "상"
    },
    {
      "question": "13. 스택과 큐의 차이점에 대한 설명 중 옳지 않은 것은 무엇인가요?",
      "options": ["스택은 후입선출(LIFO) 구조이고, 큐는 선입선출(FIFO) 구조이다.", "스택의 데이터 삽입은 한쪽 끝(Top)에서 일어나고, 큐의 삽입은 맨 뒤(Rear)에서 일어난다.", "스택의 데이터 삭제는 Top에서 일어나고, 큐의 데이터 삭제는 맨 앞(Front)에서 일어난다.", "파이썬에서 스택을 사용할 때는 반드시 collections.deque를 써야만 한다."],
      "answer": 3,
      "explanation": "파이썬에서 스택은 기본 list의 append()와 pop() 메서드로 단 5줄 만에 완벽히 구현이 가능하며, 큐의 경우 성능 문제로 collections.deque 사용이 권장됩니다.",
      "difficulty": "중"
    },
    {
      "question": "14. 선형 큐의 메모리 낭비 문제를 해결하기 위해 처음과 끝을 연결한 구조를 무엇이라고 하나요?",
      "options": ["원형 큐 (Circular Queue)", "우선순위 큐 (Priority Queue)", "덱 (Deque)", "연결 큐 (Linked Queue)"],
      "answer": 0,
      "explanation": "원형 큐(Circular Queue)는 선형 큐의 메모리 낭비 문제를 해결하기 위해 처음과 끝을 연결한 구조입니다.",
      "difficulty": "하"
    },
    {
      "question": "15. 들어온 순서와 상관없이 데이터의 중요도나 크기에 따라 우선순위가 높은 데이터가 먼저 나가는 구조는 무엇인가요?",
      "options": ["원형 큐 (Circular Queue)", "우선순위 큐 (Priority Queue)", "덱 (Deque)", "이중 큐 (Double Queue)"],
      "answer": 1,
      "explanation": "우선순위 큐(Priority Queue)는 들어온 순서와 관계없이 우선순위가 높은 데이터가 먼저 나가는 구조입니다.",
      "difficulty": "하"
    },
    {
      "question": "16. 양쪽 끝 모두에서 데이터의 삽입과 삭제가 가능한 하이브리드형 구조를 가진 자료구조는 무엇인가요?",
      "options": ["원형 큐 (Circular Queue)", "우선순위 큐 (Priority Queue)", "덱 (Deque)", "스택 (Stack)"],
      "answer": 2,
      "explanation": "덱(Deque - Double Ended Queue)은 양쪽 끝 모두에서 삽입과 삭제가 가능한 하이브리드형 구조입니다.",
      "difficulty": "중"
    },
    {
      "question": "17. PPT에서 스택(Stack)을 비유하기 위해 사용한 실생활의 예시로 가장 적절한 것은 무엇인가요?",
      "options": ["맛집 앞에 줄을 선 사람들", "일방통행 터널을 통과하는 자동차들", "원통 속에 차곡차곡 쌓인 프링글스 과자", "은행 창구의 대기 번호표"],
      "answer": 2,
      "explanation": "PPT에서는 스택의 비유로 '원통 속에 차곡차곡 쌓인 프링글스 과자' 또는 '차곡차곡 쌓인 접시'를 언급했습니다. 나머지는 큐의 비유입니다.",
      "difficulty": "하"
    },
    {
      "question": "18. PPT에서 큐(Queue)를 설명하기 위해 사용한 실생활의 비유로 올바른 것은 무엇인가요?",
      "options": ["프링글스 과자통", "매표소의 대기줄", "차곡차곡 쌓인 접시", "되돌리기(Undo) 기능"],
      "answer": 1,
      "explanation": "PPT에서 큐의 비유로 '맛집 앞에 줄을 선 사람들(매표소 대기줄)'과 '일방통행 터널'을 제시했습니다.",
      "difficulty": "하"
    },
    {
      "question": "19. 파이썬 collections.deque에서 popleft() 연산이 보장하는 시간 복잡도는 얼마인가요?",
      "options": ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
      "answer": 0,
      "explanation": "collections.deque의 popleft() 연산은 큐의 맨 앞 데이터를 효율적으로 추출하며 시간 복잡도 O(1)을 보장합니다.",
      "difficulty": "상"
    },
    {
      "question": "20. 5주차 도전 과제로 제시된 앞뒤가 똑같은 단어를 판별하는 '문자열 회문(Palindrome)' 판별 프로그램을 작성할 때 활용하도록 권장된 파이썬 자료구조(모듈)는 무엇인가요?",
      "options": ["list", "deque", "stack", "queue"],
      "answer": 1,
      "explanation": "도전 과제에서는 파이썬의 'deque'를 활용하여 앞뒤가 똑같은 단어인 '문자열 회문(Palindrome)' 판별 프로그램을 작성하도록 안내하고 있습니다.",
      "difficulty": "상"
    }
  ],
  "coding_test": [
    {
      "title": "문제 1. 되돌리기 마법사와 타임머신 주문",
      "description": "마법학과의 우수 학생인 아리는 주문서에 마법 주문을 작성하는 실습을 하고 있습니다...\n\n아리가 사용할 수 있는 명령어는 다음과 같습니다:\n1. `write X`: 주문서의 맨 뒤에 문자 `X`를 추가합니다. (X는 알파벳 소문자 한 글자)\n2. `undo`: 주문서의 가장 마지막 글자 하나를 지우고, 이를 '되돌려진 문자 보관소'에 순서대로 저장합니다.\n3. `redo`: 가장 최근에 `undo`로 지워진 글자 하나를 복구하여 주문서의 맨 뒤에 다시 적습니다.\n\n모든 마법 명령을 마친 후, 최종적으로 주문서에 남은 문자들을 출력하는 프로그램을 작성하세요.",
      "example_input": "8\nwrite a\nwrite b\nundo\nwrite c\nredo\nundo\nundo\nwrite d",
      "example_output": "d",
      "test_cases": [
        {"input": "8\nwrite a\nwrite b\nundo\nwrite c\nredo\nundo\nundo\nwrite d", "output": "d"},
        {"input": "6\nwrite x\nwrite y\nundo\nredo\nwrite z\nundo", "output": "xy"}
      ]
    },
    {
      "title": "문제 2. 인쇄소의 새치기 방지 시스템",
      "description": "인쇄소 사장님은 중요도가 높은 문서를 먼저 인쇄하기 위해 다음과 같은 특별한 '우선순위 대기열 규칙'을 도입했습니다.\n\n1. 인쇄 대기열의 가장 앞에 있는 문서(Front)를 꺼냅니다.\n2. 꺼낸 문서보다 중요도가 높은 문서가 대기열 뒤쪽에 하나라도 남아있다면, 이 문서를 인쇄하지 않고 대기열의 가장 뒤(Rear)로 다시 보냅니다.\n3. 만약 대기열 내에 현재 문서보다 중요도가 높은 문서가 없다면, 이 문서를 즉시 인쇄합니다.\n\n여러분은 특정 문서가 주어졌을 때, 이 문서가 사장님의 새로운 규칙에 따라 몇 번째로 인쇄되는지 구하는 프로그램을 작성해야 합니다.",
      "example_input": "3\n1 0\n5\n4 2\n1 2 3 4\n6 0\n1 1 9 1 1 1",
      "example_output": "1\n2\n5",
      "test_cases": [
        {"input": "3\n1 0\n5\n4 2\n1 2 3 4\n6 0\n1 1 9 1 1 1", "output": "1\n2\n5"}
      ]
    },
    {
      "title": "문제 3. 회문 수집가의 덱 (Deque) 게임",
      "description": "민우는 양방향에서 삽입과 삭제가 모두 자유로운 자료구조인 덱(Deque)을 활용하여 문자열이 회문인지 판별하는 게임을 하려고 합니다.\n어떤 단어들은 아쉽게 한 글자 차이로 회문이 되지 못합니다. 민우는 이 점이 아쉬워 딱 한 글자를 지워서 회문으로 만들 수 있는 단어를 '유사 회문(Pseudo-palindrome)'이라고 부르기로 했습니다.\n\n- 주어진 문자열이 그 자체로 회문이면 `0`을 출력합니다.\n- 문자열에서 단 한 글자를 삭제하여 회문을 만들 수 있는 유사 회문이면 `1`을 출력합니다.\n- 두 경우 모두 해당하지 않는 일반 문자열이면 `2`을 출력합니다.",
      "example_input": "3\nabba\nsummuus\nxxyy",
      "example_output": "0\n1\n2",
      "test_cases": [
        {"input": "3\nabba\nsummuus\nxxyy", "output": "0\n1\n2"}
      ]
    }
  ]
}

os.makedirs('data', exist_ok=True)
with open(r'data\week3.json', 'w', encoding='utf-8') as f:
    json.dump(week3_data, f, ensure_ascii=False, indent=2)
