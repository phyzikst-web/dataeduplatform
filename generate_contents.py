import os
import sys
import json
import re
import argparse
import docx
import nbformat
import google.generativeai as genai
from nbformat.v4 import new_notebook, new_markdown_cell, new_code_cell

def setup_api():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("에러: GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.")
        print("실행 예시: set GEMINI_API_KEY=당신의키 && python generate_contents.py --input lecture.txt --week 13주차 --title 트리")
        sys.exit(1)
    genai.configure(api_key=api_key)

def get_gemini_response(prompt, json_mode=False):
    model = genai.GenerativeModel('gemini-2.5-flash')
    generation_config = {}
    if json_mode:
        generation_config['response_mime_type'] = 'application/json'
        
    response = model.generate_content(prompt, generation_config=generation_config)
    return response.text

def create_quiz_docx(text, filepath):
    prompt = f"""
다음 강의 자료 텍스트를 바탕으로 객관식(5지 선다형) 퀴즈 3문제를 만들어주세요.
반드시 아래의 출력 형식을 정확히 지켜주세요. JSON이 아니라 일반 텍스트 포맷입니다.

출력 형식 예시:
1. 문제 내용이 들어갑니다.
① 보기 1
② 보기 2
③ 보기 3
④ 보기 4
⑤ 보기 5
정답: ① | 해설: 정답인 이유를 설명합니다.

2. 두번째 문제 내용...
(동일한 형식 반복)

강의 텍스트:
{text}
"""
    print(">>> 객관식 퀴즈 생성 중...")
    quiz_text = get_gemini_response(prompt)
    
    # Save to Docx
    doc = docx.Document()
    for line in quiz_text.split('\n'):
        doc.add_paragraph(line)
    
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    doc.save(filepath)
    print(f"    -> {filepath} 저장 완료.")

def create_notebook(text, filepath, nb_type="learner"):
    print(f">>> {nb_type} 노트북 생성 중...")
    if nb_type == "learner":
        prompt = f"""
다음 강의 자료를 바탕으로 학생들이 개념을 학습할 수 있는 '코드 빈칸 채우기' Jupyter Notebook 셀 데이터를 JSON 배열로 생성해주세요.
배열의 각 객체는 "type" ("markdown" 또는 "code")와 "source" (문자열)를 가져야 합니다.
코드의 핵심 부분은 '___' (언더바 3개)로 빈칸을 뚫어주세요.

출력 예시:
[
  {{"type": "markdown", "source": "# 연결 리스트 실습\\n개념 설명..."}},
  {{"type": "code", "source": "class Node:\\n    def __init__(self, data):\\n        self.data = data\\n        self.next = ___"}},
  ...
]

강의 텍스트:
{text}
"""
    else: # judge
        prompt = f"""
다음 강의 자료를 바탕으로 '실전 알고리즘 코딩 테스트 문제' Jupyter Notebook 셀 데이터를 JSON 배열로 생성해주세요.
배열의 각 객체는 "type" ("markdown" 또는 "code")와 "source" (문자열)를 가져야 합니다.
첫번째 셀은 마크다운으로 문제 설명, 제한사항, 입출력 예시를 적고, 두번째 셀은 파이썬 함수 뼈대를 작성하세요.

출력 예시:
[
  {{"type": "markdown", "source": "## 문제: 트리 순회\\n주어진 트리를 전위 순회하세요...\\n\\n### 입출력 예시..."}},
  {{"type": "code", "source": "def preorder_traversal(root):\\n    # 코드를 작성하세요\\n    pass"}},
  {{"type": "code", "source": "# 테스트 코드\\nprint(preorder_traversal(tree) == expected)"}}
]

강의 텍스트:
{text}
"""
    
    cells_json = get_gemini_response(prompt, json_mode=True)
    try:
        cells_data = json.loads(cells_json)
    except Exception as e:
        print("JSON 파싱 에러. 원본:", cells_json)
        cells_data = []

    nb = new_notebook()
    for c in cells_data:
        if c.get("type") == "markdown":
            nb.cells.append(new_markdown_cell(c.get("source", "")))
        elif c.get("type") == "code":
            nb.cells.append(new_code_cell(c.get("source", "")))

    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        nbformat.write(nb, f)
    print(f"    -> {filepath} 저장 완료.")

def update_js_file(js_path, var_name, new_entry):
    if not os.path.exists(js_path):
        print(f"경고: {js_path} 파일을 찾을 수 없어 업데이트하지 못했습니다.")
        return

    with open(js_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # JS 배열에 새 항목을 추가하기 위해 정규식 사용
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
        print(f"    -> {js_path} 인덱스 업데이트 완료.")
    else:
        print(f"경고: {js_path} 에서 {var_name} 배열을 찾지 못했습니다.")

def main():
    parser = argparse.ArgumentParser(description="강의 텍스트를 기반으로 학습 자료 자동 생성")
    parser.add_argument("--input", required=True, help="강의 자료 텍스트 파일 경로")
    parser.add_argument("--week", required=True, help="주차 (예: 13주차)")
    parser.add_argument("--title", required=True, help="주제 (예: 트리 기본)")
    
    args = parser.parse_args()
    
    setup_api()
    
    with open(args.input, 'r', encoding='utf-8') as f:
        text = f.read()
        
    clean_title = args.title.replace(" ", "_").replace("/", "")
    week_str = args.week.replace("주차", "week")
    
    # 1. 객관식 퀴즈 생성
    quiz_file = f"quiz/questions/{week_str}_{clean_title}.docx"
    create_quiz_docx(text, quiz_file)
    update_js_file("quiz/questions.js", "QUIZZES", {
        "id": f"quiz_{week_str}_{clean_title}",
        "title": f"{args.week}: {args.title} (AI 자동 생성)",
        "filepath": quiz_file
    })
    
    # 2. 개념 학습 (빈칸 채우기)
    learner_file = f"learner/notebooks/{week_str}_{clean_title}_실습.ipynb"
    create_notebook(text, learner_file, nb_type="learner")
    update_js_file("learner/notebooks.js", "NOTEBOOKS", {
        "id": f"learner_{week_str}_{clean_title}",
        "title": f"{args.week}: {args.title} 빈칸 채우기 (AI 자동 생성)",
        "filepath": learner_file,
        "answerpath": learner_file # 임시로 같은 파일로 지정
    })
    
    # 3. 실전 코딩 테스트
    judge_file = f"judge/problems/{week_str}_{clean_title}_알고리즘.ipynb"
    create_notebook(text, judge_file, nb_type="judge")
    update_js_file("judge/problems.js", "PROBLEMS", {
        "id": f"judge_{week_str}_{clean_title}",
        "title": f"[{args.week}] {args.title} 코딩 테스트 (AI 자동 생성)",
        "filepath": judge_file
    })
    
    print("\n===================================================")
    print("모든 학습 자료 생성이 완료되었습니다!")
    print("이제 '업로드.bat'을 실행하여 학생들에게 배포하실 수 있습니다.")
    print("===================================================")

if __name__ == "__main__":
    main()
