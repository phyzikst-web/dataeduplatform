// algo/ai-generator/app.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. API Key Check
    if (!GeminiAPI.hasApiKey()) {
        setTimeout(() => GeminiAPI.showApiKeyModal(), 1000);
    }
    document.getElementById('api-key-btn').addEventListener('click', () => {
        GeminiAPI.showApiKeyModal();
    });

    // 2. Setup Generate Buttons
    document.querySelectorAll('.gen-btn').forEach(btn => {
        btn.addEventListener('click', () => handleGenerate(btn.dataset.type));
    });

    // 3. Setup Reset & Submit
    document.getElementById('reset-btn').addEventListener('click', () => {
        showStep(1);
    });
    
    document.getElementById('submit-answer-btn').addEventListener('click', handleSubmit);
});

let currentQuestionData = null;
let currentQuestionType = null;
let codeEditor = null; // For Coding Test / Fill-in-the-blank

// System Prompts for JSON Generation
const PROMPTS = {
    'multiple-choice': `당신은 자료구조/알고리즘 교사입니다. 제공된 텍스트를 바탕으로 객관식(4지선다) 퀴즈 1문제를 생성하세요.
반드시 아래 JSON 형식으로만 응답하세요. 다른 설명은 제외하세요.
{
    "question": "문제 내용",
    "options": ["보기1", "보기2", "보기3", "보기4"],
    "answerIndex": 0, // 0부터 3까지 정답의 인덱스
    "explanation": "정답인 이유와 오답인 이유에 대한 마크다운 해설"
}`,
    'fill-blank': `당신은 자료구조/알고리즘 교사입니다. 제공된 텍스트를 바탕으로 파이썬 코드 빈칸 채우기 문제 1개를 생성하세요.
반드시 아래 JSON 형식으로만 응답하세요. 다른 설명은 제외하세요.
{
    "description": "문제에 대한 설명 (마크다운)",
    "codeBefore": "def example():\\n    # 빈칸 이전 코드",
    "answer": "정답코드단어",
    "codeAfter": "    # 빈칸 이후 코드",
    "explanation": "해설 (마크다운)"
}`,
    'coding-test': `당신은 코딩테스트 출제자입니다. 제공된 텍스트를 바탕으로 간단한 파이썬 알고리즘 코딩테스트 문제 1개를 생성하세요.
반드시 아래 JSON 형식으로만 응답하세요. 다른 설명은 제외하세요.
{
    "title": "문제 제목",
    "description": "문제 설명, 제약조건, 입출력 예시 (마크다운 포맷)",
    "initialCode": "def solution(data):\\n    # 코드를 작성하세요\\n    pass",
    "solutionCode": "정답 코드 예시 (사용자에게는 처음에 숨겨짐)",
    "explanation": "문제 풀이 접근법 및 시간/공간 복잡도 해설 (마크다운)"
}`
};

async function handleGenerate(type) {
    const material = document.getElementById('material-input').value.trim();
    if (!material) {
        alert('학습 자료나 키워드를 먼저 입력해주세요.');
        return;
    }
    if (!GeminiAPI.hasApiKey()) {
        GeminiAPI.showApiKeyModal(() => handleGenerate(type));
        return;
    }

    currentQuestionType = type;
    showStep('loading');

    const prompt = `다음 텍스트를 기반으로 문제를 생성하세요:\n\n${material}`;
    
    try {
        const responseText = await GeminiAPI.callGemini(prompt, PROMPTS[type]);
        
        // Extract JSON from response (handling potential markdown blocks)
        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        currentQuestionData = JSON.parse(jsonStr);

        renderQuestion(type, currentQuestionData);
        showStep(2);
        
        // Record Generation Action
        LearningTracker.recordAIUsage({ feature: `generate-${type}`, topic: '문제 자동 생성' });

    } catch (error) {
        alert('문제 생성에 실패했습니다: ' + error.message);
        showStep(1);
    }
}

function renderQuestion(type, data) {
    const container = document.getElementById('question-render-area');
    const badge = document.getElementById('q-type-badge');
    const title = document.getElementById('q-title');
    
    // Reset State
    document.getElementById('result-area').style.display = 'none';
    document.getElementById('submit-answer-btn').disabled = false;
    document.getElementById('submit-answer-btn').style.display = 'inline-block';
    if (codeEditor) {
        codeEditor.toTextArea();
        codeEditor = null;
    }

    if (type === 'multiple-choice') {
        badge.textContent = '객관식';
        title.textContent = '다음 문제를 풀어보세요';
        
        let html = `<div class="markdown-body">${marked.parse(data.question)}</div><div class="mc-options">`;
        data.options.forEach((opt, idx) => {
            html += `
                <label class="mc-option" onclick="selectOption(this)">
                    <input type="radio" name="mc-answer" value="${idx}">
                    <span>${opt}</span>
                </label>`;
        });
        html += `</div>`;
        container.innerHTML = html;

    } else if (type === 'fill-blank') {
        badge.textContent = '빈칸 채우기';
        title.textContent = '빈칸에 알맞은 코드를 작성하세요';
        
        const codeHtml = `
            <pre><code class="language-python">${data.codeBefore} <input type="text" id="blank-input" class="blank-input" autocomplete="off" spellcheck="false"> ${data.codeAfter}</code></pre>
        `;
        container.innerHTML = `
            <div class="markdown-body">${marked.parse(data.description)}</div>
            <div class="code-editor-wrapper" style="padding:1rem; background:#282a36;">${codeHtml}</div>
        `;
        document.getElementById('blank-input').focus();

    } else if (type === 'coding-test') {
        badge.textContent = '코딩테스트';
        title.textContent = data.title;
        
        container.innerHTML = `
            <div class="markdown-body">${marked.parse(data.description)}</div>
            <div class="code-editor-wrapper">
                <textarea id="code-textarea"></textarea>
            </div>
        `;
        
        codeEditor = CodeMirror.fromTextArea(document.getElementById('code-textarea'), {
            mode: 'python',
            theme: 'dracula',
            lineNumbers: true,
            matchBrackets: true,
            indentUnit: 4
        });
        codeEditor.setValue(data.initialCode);
        
        // Custom button for Coding Test (Uses AI Feedback for grading)
        document.getElementById('submit-answer-btn').textContent = 'AI 채점 및 피드백 받기';
    }
}

// Global function for radio selection style
window.selectOption = function(labelEl) {
    document.querySelectorAll('.mc-option').forEach(el => el.classList.remove('selected'));
    labelEl.classList.add('selected');
    labelEl.querySelector('input').checked = true;
};

async function handleSubmit() {
    const btn = document.getElementById('submit-answer-btn');
    const resultArea = document.getElementById('result-area');
    const resultHeader = document.getElementById('result-header');
    const statusText = document.getElementById('result-status');
    const explanation = document.getElementById('explanation-content');

    // MULTIPLE CHOICE
    if (currentQuestionType === 'multiple-choice') {
        const selected = document.querySelector('input[name="mc-answer"]:checked');
        if (!selected) return alert('답안을 선택해주세요.');
        
        const userIdx = parseInt(selected.value);
        const isCorrect = userIdx === currentQuestionData.answerIndex;
        
        showGradingResult(isCorrect, isCorrect ? '정답입니다! 🎉' : '오답입니다. 다시 생각해보세요 🤔', currentQuestionData.explanation);
        btn.disabled = true;
        LearningTracker.recordQuizResult(isCorrect);
    }
    // FILL IN BLANK
    else if (currentQuestionType === 'fill-blank') {
        const userAnswer = document.getElementById('blank-input').value.trim();
        if (!userAnswer) return alert('빈칸을 채워주세요.');
        
        const isCorrect = userAnswer === currentQuestionData.answer || userAnswer === currentQuestionData.answer.replace(/['"]/g, '');
        
        showGradingResult(isCorrect, isCorrect ? '정답입니다! 🎉' : `오답입니다. (정답: ${currentQuestionData.answer})`, currentQuestionData.explanation);
        btn.disabled = true;
        LearningTracker.recordQuizResult(isCorrect);
    }
    // CODING TEST (Uses AI for feedback)
    else if (currentQuestionType === 'coding-test') {
        const userCode = codeEditor.getValue().trim();
        
        btn.disabled = true;
        btn.textContent = 'AI가 채점 중...';
        
        const gradingPrompt = `당신은 코딩테스트 채점관입니다. 
문제: ${currentQuestionData.title}
설명: ${currentQuestionData.description}
모범답안: ${currentQuestionData.solutionCode}

학생이 제출한 코드:
\`\`\`python
${userCode}
\`\`\`

학생의 코드가 요구사항을 충족하는지(정답 여부), 그리고 코드에 대한 피드백(효율성, 버그 등)을 마크다운으로 작성해주세요. 첫 줄에 반드시 "**[정답]**" 또는 "**[오답]**"이라고 명시하세요.`;

        try {
            const feedbackText = await GeminiAPI.callGemini(gradingPrompt, "당신은 전문적인 알고리즘 채점관입니다.");
            
            resultArea.style.display = 'block';
            resultHeader.className = 'result-header feedback';
            statusText.textContent = 'AI 채점 결과';
            
            // Append 모범답안 to explanation
            const fullFeedback = feedbackText + `\n\n### 💡 참고용 모범 답안\n\`\`\`python\n${currentQuestionData.solutionCode}\n\`\`\`\n\n### 📚 문제 출제 의도\n${currentQuestionData.explanation}`;
            
            explanation.innerHTML = marked.parse(fullFeedback);
            
            // Highlight code blocks
            explanation.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
            
            btn.style.display = 'none';
            LearningTracker.recordCodingSubmit();

        } catch (error) {
            alert('채점 중 오류가 발생했습니다: ' + error.message);
            btn.disabled = false;
            btn.textContent = 'AI 채점 및 피드백 받기';
        }
    }
}

function showGradingResult(isCorrect, titleText, explanationMarkdown) {
    const resultArea = document.getElementById('result-area');
    const resultHeader = document.getElementById('result-header');
    const statusText = document.getElementById('result-status');
    const explanation = document.getElementById('explanation-content');

    resultArea.style.display = 'block';
    resultHeader.className = `result-header ${isCorrect ? 'correct' : 'incorrect'}`;
    statusText.textContent = titleText;
    
    explanation.innerHTML = marked.parse(explanationMarkdown);
    explanation.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
}

function showStep(stepId) {
    document.querySelectorAll('.step-section').forEach(el => el.style.display = 'none');
    
    if (stepId === 1) {
        document.getElementById('step-1').style.display = 'block';
    } else if (stepId === 2) {
        document.getElementById('step-2').style.display = 'block';
    } else if (stepId === 'loading') {
        document.getElementById('loading-state').style.display = 'flex';
    }
}
