// algo/ai-feedback/app.js

const systemPrompt = `당신은 자료구조 및 알고리즘 전문 "소크라테스식" 코드 튜터입니다. 
당신의 역할은 학생이 스스로 답을 찾을 수 있도록 돕는 것입니다. 절대로 정답 코드를 한 번에 제공하지 마십시오.

출력은 반드시 다음 마크다운 형식을 지켜주세요:

# 🧩 AI 튜터 소크라테스식 피드백

## 📊 1. 코드 분석 및 복잡도
- **현재 시간 복잡도**: O(...)
- **목표 시간 복잡도**: O(...) (더 개선될 여지가 있다면)
- **현재 공간 복잡도**: O(...)
*학생이 작성한 코드의 핵심 로직과 연산 방식을 분석하여 작성하세요.*

## 🔍 2. 무엇을 잘했나요? (칭찬 한마디)
*코드의 긍정적인 부분(예: 변수 이름, 가독성, 예외 처리 등)을 구체적으로 칭찬해 주세요.*

## 💡 3. 소크라테스식 질문과 힌트 (스스로 생각해보세요)
*직접적인 코드는 주지 말고, 학생이 범한 논리적 오류나 성능 개선 지점을 지적하며 다음 질문을 던져주세요:*
- **질문 1**: *로직의 경계값이나 특정 입력을 가정하고 생각하게 만드는 질문*
- **질문 2**: *성능이나 불필요한 연산을 줄이기 위한 실마리를 제공하는 질문*
*학생이 막혔을 때 힌트가 되는 의사코드(Pseudocode)나 핵심 아이디어만 텍스트로 제시하세요.*

## 🚀 4. 도전해볼 만한 방향성
*어떤 알고리즘 기법이나 자료구조를 찾아봐야 하는지 로드맵을 알려주세요. (예: DP, Sliding Window 등)*
`;

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

    // Show loading state and start scanner animation
    showState('loading');
    document.getElementById('editor-scanner').style.display = 'block';

    const prompt = `[Language: ${currentLang}]\n\n${code}`;

    try {
        const responseText = await GeminiAPI.callGemini(prompt, systemPrompt);
        
        // Record usage
        LearningTracker.recordAIUsage({ 
            feature: 'feedback', 
            topic: code.substring(0, 30).replace(/\n/g, ' ') + '...'
        });

        // Hide scanner and show result with typewriter effect
        document.getElementById('editor-scanner').style.display = 'none';
        showState('result');
        
        const resultContainer = document.getElementById('state-result');
        typeWriterMarkdown(resultContainer, responseText);

    } catch (error) {
        document.getElementById('editor-scanner').style.display = 'none';
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

function typeWriterMarkdown(targetEl, markdownText, callback) {
    targetEl.innerHTML = '';
    let index = 0;
    const speed = 10; // ms per step
    let currentText = '';
    
    // Auto-scroll target is the scrollable result container
    const container = document.getElementById('result-container');
    
    const interval = setInterval(() => {
        if (index < markdownText.length) {
            // Type a small chunk of chars at a time to keep it snappy but animated
            const chunk = markdownText.substr(index, 4);
            currentText += chunk;
            index += chunk.length;
            
            targetEl.innerHTML = marked.parse(currentText);
            
            // Highlight code blocks
            targetEl.querySelectorAll('pre code').forEach((block) => {
                if (!block.classList.contains('hljs')) {
                    hljs.highlightElement(block);
                }
            });
            
            // Scroll down as new text generates
            container.scrollTop = container.scrollHeight;
        } else {
            clearInterval(interval);
            if (callback) callback();
        }
    }, speed);
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
