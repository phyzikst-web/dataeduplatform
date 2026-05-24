// algo/ai-feedback/app.js

const systemPrompt = `당신은 자료구조 및 알고리즘 전문 코드 리뷰어입니다. 
학생이 제출한 코드를 분석하여 다음 항목을 한국어로 답변하세요:

## 📋 코드 분석
코드의 전반적인 동작을 설명하세요.

## 🐛 오류 및 버그
발견된 오류나 잠재적 버그를 설명하세요. 없다면 "발견된 오류가 없습니다"라고 답하세요.

## 💡 개선 제안
코드 품질, 가독성, 효율성 측면에서 개선할 점을 제안하세요.

## ⏱️ 복잡도 분석
시간복잡도와 공간복잡도를 분석하세요.

마크다운 형식으로 출력하세요. 코드 예시는 \`\`\`로 감싸세요.`;

let editor;
let currentLang = 'python';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize CodeMirror
    editor = CodeMirror(document.getElementById('editor-container'), {
        mode: 'python',
        theme: 'dracula',
        lineNumbers: true,
        matchBrackets: true,
        indentUnit: 4,
        value: '# 여기에 코드를 붙여넣으세요\n\ndef solution(arr):\n    # 코드 작성\n    pass\n'
    });

    // Handle language toggle
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            currentLang = e.target.dataset.lang;
            editor.setOption('mode', currentLang);
            document.getElementById('editor-filename').textContent = currentLang === 'python' ? 'solution.py' : 'solution.js';
        });
    });

    // API Key button
    document.getElementById('api-key-btn').addEventListener('click', () => {
        GeminiAPI.showApiKeyModal();
    });

    // Check API Key on load
    if (!GeminiAPI.hasApiKey()) {
        setTimeout(() => GeminiAPI.showApiKeyModal(), 1000);
    }

    // Feedback button
    document.getElementById('feedback-btn').addEventListener('click', handleFeedbackRequest);
    document.getElementById('retry-btn').addEventListener('click', handleFeedbackRequest);
});

async function handleFeedbackRequest() {
    const code = editor.getValue().trim();
    
    if (!code || code === '# 여기에 코드를 붙여넣으세요\n\ndef solution(arr):\n    # 코드 작성\n    pass') {
        alert('분석할 코드를 입력해주세요.');
        return;
    }

    if (!GeminiAPI.hasApiKey()) {
        GeminiAPI.showApiKeyModal(handleFeedbackRequest);
        return;
    }

    const btn = document.getElementById('feedback-btn');
    btn.disabled = true;

    // Show loading state
    showState('loading');

    const prompt = `[Language: ${currentLang}]\n\n${code}`;

    try {
        const responseText = await GeminiAPI.callGemini(prompt, systemPrompt);
        
        // Record usage
        LearningTracker.recordAIUsage({ 
            feature: 'feedback', 
            topic: code.substring(0, 30).replace(/\n/g, ' ') + '...'
        });

        // Show result state
        const resultContainer = document.getElementById('state-result');
        resultContainer.innerHTML = marked.parse(responseText);
        
        // Apply syntax highlighting to code blocks in markdown
        resultContainer.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });

        showState('result');

    } catch (error) {
        if (error.code === 'API_KEY_MISSING') {
            GeminiAPI.showApiKeyModal(handleFeedbackRequest);
            showState('empty');
        } else {
            document.getElementById('error-message').textContent = error.message;
            showState('error');
        }
    } finally {
        btn.disabled = false;
    }
}

function showState(stateId) {
    const states = ['empty', 'loading', 'error', 'result'];
    states.forEach(s => {
        document.getElementById(`state-${s}`).style.display = s === stateId ? 'block' : 'none';
        // 'empty' and 'error' use flex, others use block
        if (s === stateId && (s === 'empty' || s === 'error')) {
            document.getElementById(`state-${s}`).style.display = 'flex';
        }
    });
}
