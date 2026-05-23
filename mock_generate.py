import os
import json
import re
import docx
import nbformat
from nbformat.v4 import new_notebook, new_markdown_cell, new_code_cell

def create_quiz_docx(filepath):
    quiz_text = """1. 트리의 최상위 노드를 일컫는 용어는 무엇인가?
① 리프 노드(Leaf Node)
② 루트 노드(Root Node)
③ 서브 트리(Sub Tree)
④ 간선(Edge)
⑤ 차수(Degree)
정답: ② | 해설: 트리의 가장 위에 있는 노드를 루트 노드(Root Node)라고 부릅니다.

2. 이진 트리(Binary Tree)에서 각 노드가 가질 수 있는 최대 자식 노드의 개수는?
① 1개
② 2개
③ 3개
④ 4개
⑤ 무제한
정답: ② | 해설: 이진 트리는 자식 노드를 최대 2개까지만 가질 수 있는 트리 구조입니다.

3. 다음 중 전위 순회(Preorder Traversal)의 탐색 순서로 올바른 것은?
① 왼쪽 서브트리 -> 오른쪽 서브트리 -> 루트
② 왼쪽 서브트리 -> 루트 -> 오른쪽 서브트리
③ 루트 -> 왼쪽 서브트리 -> 오른쪽 서브트리
④ 루트 -> 오른쪽 서브트리 -> 왼쪽 서브트리
⑤ 오른쪽 서브트리 -> 루트 -> 왼쪽 서브트리
정답: ③ | 해설: 전위 순회는 루트를 먼저 방문하고, 그 다음 왼쪽, 마지막으로 오른쪽 서브트리를 방문합니다."""

    doc = docx.Document()
    for line in quiz_text.split('\n'):
        doc.add_paragraph(line)
    
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    doc.save(filepath)

def create_learner_notebook(filepath):
    nb = new_notebook()
    nb.cells.extend([
        new_markdown_cell("# 13주차 실습: 이진 트리 노드 구현\n아래 코드는 이진 트리의 노드를 파이썬 클래스로 구현하는 예제입니다. 빈칸을 채워 완성해보세요."),
        new_code_cell("class TreeNode:\n    def __init__(self, data):\n        self.data = data\n        # 왼쪽 자식 노드와 오른쪽 자식 노드를 None으로 초기화합니다.\n        self.left = ___\n        self.right = ___"),
        new_markdown_cell("## 실습: 트리 순회 (전위 순회)\n루트 -> 왼쪽 -> 오른쪽 순서로 방문하는 전위 순회를 완성하세요."),
        new_code_cell("def preorder(node):\n    if node is None:\n        return\n    print(node.data, end=' ')\n    # 왼쪽 서브트리를 먼저 재귀호출합니다.\n    preorder(___)\n    # 그 다음 오른쪽 서브트리를 재귀호출합니다.\n    preorder(___)")
    ])
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        nbformat.write(nb, f)

def create_judge_notebook(filepath):
    nb = new_notebook()
    nb.cells.extend([
        new_markdown_cell("## [Lv.3] 트리 최대 깊이 구하기\n이진 트리의 루트 노드가 주어질 때, 트리의 최대 깊이(Maximum Depth)를 반환하는 함수를 작성하세요.\n\n### 제한사항\n- 트리의 노드 수는 0개 이상 10,000개 이하입니다.\n\n### 입출력 예시\n- root = [3,9,20,null,null,15,7] 일 때, 최대 깊이는 3입니다."),
        new_code_cell("class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef maxDepth(root):\n    # 이곳에 알고리즘 코드를 작성하세요.\n    pass"),
        new_code_cell("# 테스트 코드 (실행하여 확인)\nroot = TreeNode(3)\nroot.left = TreeNode(9)\nroot.right = TreeNode(20)\nroot.right.left = TreeNode(15)\nroot.right.right = TreeNode(7)\n\nprint('정답입니다!' if maxDepth(root) == 3 else '틀렸습니다.')")
    ])
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        nbformat.write(nb, f)

def update_js_file(js_path, var_name, new_entry):
    if not os.path.exists(js_path):
        return
    with open(js_path, 'r', encoding='utf-8') as f:
        content = f.read()
    match = re.search(r'const\s+' + var_name + r'\s*=\s*\[(.*?)\];', content, re.DOTALL)
    if match:
        arr_content = match.group(1).strip()
        new_obj_str = json.dumps(new_entry, ensure_ascii=False, indent=4)
        if arr_content:
            new_arr_content = arr_content + ",\n  " + new_obj_str
        else:
            new_arr_content = "  " + new_obj_str
        new_content = content.replace(match.group(1), f"\n{new_arr_content}\n")
        with open(js_path, 'w', encoding='utf-8') as f:
            f.write(new_content)

if __name__ == "__main__":
    create_quiz_docx("quiz/questions/week13_tree.docx")
    update_js_file("quiz/questions.js", "QUIZZES", {
        "id": "quiz_week13_tree",
        "title": "13주차: 자료구조 트리(Tree) 기본 개념",
        "filepath": "questions/week13_tree.docx"
    })
    
    create_learner_notebook("learner/notebooks/week13_tree_실습.ipynb")
    update_js_file("learner/notebooks.js", "NOTEBOOKS", {
        "id": "learner_week13_tree",
        "title": "13주차: 트리 순회 및 구조체 개념 실습",
        "filepath": "notebooks/week13_tree_실습.ipynb",
        "answerpath": "notebooks/week13_tree_실습.ipynb"
    })
    
    create_judge_notebook("judge/problems/week13_tree_알고리즘.ipynb")
    update_js_file("judge/problems.js", "PROBLEMS", {
        "id": "judge_week13_tree",
        "title": "[Lv.3] 트리의 최대 깊이 구하기 (DFS)",
        "filepath": "problems/week13_tree_알고리즘.ipynb"
    })
    print("Mock generation complete!")
