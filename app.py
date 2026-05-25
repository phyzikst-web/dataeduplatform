import streamlit as st
import openai
import json
import time
import graphviz

# 페이지 기본 설정
st.set_page_config(page_title="AI-VisuCode", layout="wide")

# OpenAI API 키 설정 (Streamlit secrets 또는 직접 입력)
try:
    OPENAI_API_KEY = st.secrets["OPENAI_API_KEY"]
except (KeyError, FileNotFoundError):
    OPENAI_API_KEY = "YOUR_OPENAI_API_KEY_HERE"

def get_operation_plan_from_ai(prompt):
    """
    OpenAI API를 호출하여 사용자의 자연어 명령을 JSON 형태의 연산 배열로 변환합니다.
    """
    client = openai.OpenAI(api_key=OPENAI_API_KEY)
    
    system_prompt = """
    You are an AI that translates natural language data structure operations into a precise JSON array.
    Do not include any explanations, markdown formatting (like ```json), or extra text. Output ONLY the raw JSON array.
    Supported structures: stack, queue.
    Operations for stack: create, push, pop
    Operations for queue: create, enqueue, dequeue
    
    JSON Schema Example:
    [
        {"operation": "create", "structure": "stack"},
        {"operation": "push", "data": "10"},
        {"operation": "push", "data": "20"},
        {"operation": "pop", "data": "20"}
    ]
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0
        )
        
        raw_output = response.choices[0].message.content.strip()
        # 혹시 모를 마크다운 백틱 제거
        if raw_output.startswith("```json"):
            raw_output = raw_output[7:]
        if raw_output.startswith("```"):
            raw_output = raw_output[3:]
        if raw_output.endswith("```"):
            raw_output = raw_output[:-3]
            
        return json.loads(raw_output.strip())
    except Exception as e:
        st.error(f"AI 시각화 계획 생성 중 오류가 발생했습니다: {e}")
        return []

def render_structure(step_index, operation_plan):
    """
    주어진 단계(step_index)까지의 연산을 적용한 후,
    현재 데이터 구조의 상태를 Graphviz 객체로 생성하여 반환합니다.
    """
    if not operation_plan:
        return None
        
    structure_type = "stack"
    items = []
    
    # 처음부터 현재 단계까지 연산 누적 적용
    for i in range(min(step_index + 1, len(operation_plan))):
        op = operation_plan[i]
        op_name = op.get("operation")
        
        if op_name == "create":
            structure_type = op.get("structure", "stack").lower()
            items = []
        elif op_name in ["push", "enqueue"]:
            items.append(str(op.get("data", "")))
        elif op_name == "pop":
            if items:
                items.pop()
        elif op_name == "dequeue":
            if items:
                items.pop(0)

    # Graphviz를 활용한 렌더링
    dot = graphviz.Digraph(engine='dot')
    dot.attr('node', shape='record', style='filled', fillcolor='lightblue', fontname='Helvetica')
    
    if not items:
        dot.node('empty', 'Empty ' + structure_type.capitalize(), fillcolor='lightgrey')
        return dot

    if structure_type == "stack":
        # 스택(Stack): 세로로 쌓이는 구조 (최근에 추가된 것이 위로 오도록 역순 배치)
        dot.attr(rankdir='TB')
        label = ""
        for i, item in enumerate(reversed(items)):
            if i > 0:
                label += "|"
            label += f"<{len(items)-1-i}> {item}"
        dot.node('stack', label)
    else:
        # 큐(Queue): 가로로 이어지는 구조
        dot.attr(rankdir='LR')
        label = ""
        for i, item in enumerate(items):
            if i > 0:
                label += "|"
            label += f"<{i}> {item}"
        dot.node('queue', label)
        
    return dot

# ==========================================
# 세션 상태(Session State) 초기화
# ==========================================
if 'operation_plan' not in st.session_state:
    st.session_state.operation_plan = []
if 'current_step' not in st.session_state:
    st.session_state.current_step = 0
if 'is_playing' not in st.session_state:
    st.session_state.is_playing = False

# ==========================================
# UI 레이아웃
# ==========================================
st.title("💡 AI-VisuCode")
st.markdown("자연어로 명령하면 AI가 데이터 구조를 분석하여 시뮬레이션을 생성합니다. 컴퓨터 공학의 기초 자료구조를 직관적으로 학습해 보세요!")

# 입력 섹션
prompt_input = st.text_area(
    "명령어 입력:", 
    placeholder="예시: 스택에 10, 20, 30을 순서대로 넣고(push), 한 번 빼줘(pop)",
    height=100
)

if st.button("시각화 생성하기", type="primary"):
    if OPENAI_API_KEY == "YOUR_OPENAI_API_KEY_HERE":
        st.warning("코드 상단의 `OPENAI_API_KEY`를 설정하거나 `.streamlit/secrets.toml`에 API 키를 입력해 주세요.")
    elif not prompt_input.strip():
        st.warning("명령어를 입력해 주세요.")
    else:
        with st.spinner("AI가 데이터를 분석하여 시각화 계획을 세우는 중입니다..."):
            plan = get_operation_plan_from_ai(prompt_input)
            if plan:
                st.session_state.operation_plan = plan
                st.session_state.current_step = 0
                st.session_state.is_playing = False
                st.success("시각화 계획 생성 완료!")

# ==========================================
# 시각화 및 시뮬레이션 컨트롤
# ==========================================
if st.session_state.operation_plan:
    st.markdown("---")
    
    # 시뮬레이션 컨트롤 버튼 배치
    col1, col2, col3, col4, col5 = st.columns([1, 1, 1, 1, 2])
    
    with col1:
        if st.button("⏪ 이전 단계"):
            st.session_state.is_playing = False
            if st.session_state.current_step > 0:
                st.session_state.current_step -= 1
    with col2:
        if st.button("⏩ 다음 단계"):
            st.session_state.is_playing = False
            if st.session_state.current_step < len(st.session_state.operation_plan) - 1:
                st.session_state.current_step += 1
    with col3:
        if st.button("▶️ 재생"):
            st.session_state.is_playing = True
            # 끝에 도달했을 경우 처음부터 다시 재생
            if st.session_state.current_step >= len(st.session_state.operation_plan) - 1:
                st.session_state.current_step = 0 
    with col4:
        if st.button("⏸️ 일시정지"):
            st.session_state.is_playing = False

    # 현재 단계 정보 및 실행 중인 연산 표시
    total_steps = len(st.session_state.operation_plan)
    current_op = st.session_state.operation_plan[st.session_state.current_step]
    op_name = current_op.get('operation', 'unknown')
    op_data = current_op.get('data', '')
    
    st.markdown(f"**현재 진행 단계:** `{st.session_state.current_step + 1} / {total_steps}`")
    if op_data:
        st.info(f"**실행 중인 연산:** `{op_name.upper()}` ➔ 데이터: **{op_data}**")
    else:
        st.info(f"**실행 중인 연산:** `{op_name.upper()}`")

    # Graphviz 렌더링
    graph = render_structure(st.session_state.current_step, st.session_state.operation_plan)
    if graph:
        st.graphviz_chart(graph)
        
    # 애니메이션(재생) 로직: is_playing이 True일 때 단계별로 자동 진행
    if st.session_state.is_playing:
        if st.session_state.current_step < total_steps - 1:
            time.sleep(1.0) # 1초 간격으로 애니메이션 효과
            st.session_state.current_step += 1
            st.rerun()
        else:
            # 모든 단계가 끝나면 재생 상태 해제
            st.session_state.is_playing = False
