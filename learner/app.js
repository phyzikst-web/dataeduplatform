document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const views = { setup: document.getElementById('setup-view'), practice: document.getElementById('practice-view') };
    const notebookSelect = document.getElementById('notebook-select');
    const generateBtn = document.getElementById('generate-btn');
    const backBtn = document.getElementById('back-btn');
    const checkBtn = document.getElementById('check-btn');
    
    // Practice View Elements
    const dynamicWorkArea = document.getElementById('dynamic-work-area');
    const stageTitle = document.getElementById('stage-title');
    const stageDesc = document.getElementById('stage-desc');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const progressText = document.getElementById('progress-text');
    const repeatText = document.getElementById('repeat-text');
    
    // Modal Elements
    const resultModal = document.getElementById('result-modal');
    const studentNameInput = document.getElementById('student-name');
    const copyResultBtn = document.getElementById('copy-result-btn');
    const downloadImgBtn = document.getElementById('download-img-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const captureArea = document.getElementById('capture-area');
    const certName = document.getElementById('cert-name');

    // State
    let originalCode = '';
    let currentStage = 0;
    let typingCount = 0;
    const MAX_TYPING = 3;
    let modeData = {};

    // Load pre-hosted notebooks if available
    if (typeof NOTEBOOKS !== 'undefined' && NOTEBOOKS.length > 0) {
        notebookSelect.innerHTML = '';
        const placeholderOpt = document.createElement('option');
        placeholderOpt.value = "";
        placeholderOpt.textContent = "실습 주피터 노트북을 선택해 주세요";
        placeholderOpt.disabled = true;
        placeholderOpt.selected = true;
        notebookSelect.appendChild(placeholderOpt);

        NOTEBOOKS.forEach(n => {
            const option = document.createElement('option');
            option.value = n.id;
            option.textContent = n.title;
            notebookSelect.appendChild(option);
        });

        notebookSelect.addEventListener('change', async (e) => {
            const selectedId = e.target.value;
            const notebookMeta = NOTEBOOKS.find(n => n.id === selectedId);
            if (!notebookMeta) return;
            
            try {
                const response = await fetch(notebookMeta.filepath);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                window.currentNotebook = await response.json();
                
                let combined = '';
                if (window.currentNotebook.cells) {
                    window.currentNotebook.cells.forEach(cell => {
                        if (cell.cell_type === 'code') {
                            combined += (Array.isArray(cell.source) ? cell.source.join('') : cell.source) + '\n\n';
                        }
                    });
                }
                originalCode = combined.trim();
            } catch (err) {
                console.error("Failed to load notebook:", err);
                alert(`노트북 불러오기 실패! 파일 경로를 확인해 주세요: ${notebookMeta.filepath}`);
            }
        });
    }

    backBtn.addEventListener('click', () => switchView('setup'));
    
    generateBtn.addEventListener('click', () => {
        if (!originalCode) return alert('실습 주피터 노트북을 선택해 주세요!');
        currentStage = 0;
        typingCount = 0;
        startStage(currentStage);
        switchView('practice');
    });

    checkBtn.addEventListener('click', () => {
        checkCurrentStage();
    });

    function switchView(viewName) {
        Object.values(views).forEach(v => v.classList.remove('active'));
        views[viewName].classList.add('active');
    }
    
    function updateProgress() {
        const totalStages = 6; // 0 to 5
        let progress = (currentStage / totalStages) * 100;
        if (currentStage === 0) {
            progress = (typingCount / (MAX_TYPING * totalStages)) * 100;
            repeatText.style.display = 'block';
            repeatText.textContent = `반복: ${typingCount}/${MAX_TYPING}`;
        } else {
            repeatText.style.display = 'none';
        }
        progressBarFill.style.width = `${progress}%`;
        progressText.textContent = `진행률: ${Math.round(progress)}%`;
    }

    function startStage(stage) {
        dynamicWorkArea.innerHTML = '';
        modeData = {};
        updateProgress();
        
        // Reset button state
        const checkBtn = document.getElementById('check-btn');
        checkBtn.textContent = '정답 제출 / 다음 단계';
        checkBtn.classList.remove('secondary-btn');
        checkBtn.classList.add('success-btn');
        isWaitingForNextTyping = false;

        switch (stage) {
            case 0:
                stageTitle.textContent = "Stage 0: 타이핑 연습";
                stageDesc.textContent = "원본 코드를 보며 정확히 따라 타이핑하세요. 기호와 띄어쓰기에 주의하세요.";
                renderTypingStage();
                break;
            case 1:
                stageTitle.textContent = "Stage 1: 워밍업 (빈칸 채우기)";
                stageDesc.textContent = "핵심 키워드를 채워넣으세요. (난이도: 하)";
                renderBlankStage(0.1); // 10%
                break;
            case 2:
                stageTitle.textContent = "Stage 2: 코어 로직 완성";
                stageDesc.textContent = "알고리즘의 핵심 로직을 완성하세요. (난이도: 중)";
                renderBlankStage(0.3); // 30%
                break;
            case 3:
                stageTitle.textContent = "Stage 3: 디버깅";
                stageDesc.textContent = "다음 코드에는 논리적 오류가 숨어있습니다. 찾아서 올바르게 수정하세요.";
                renderDebuggingStage();
                break;
            case 4:
                stageTitle.textContent = "Stage 4: 실행 흐름 추적";
                stageDesc.textContent = "코드를 머릿속으로 실행해보고, 최종 출력 결과를 예측하여 적어보세요.";
                renderTracingStage();
                break;
            case 5:
                stageTitle.textContent = "Stage 5: 미니 챌린지";
                stageDesc.textContent = "배운 내용을 바탕으로 새로운 기능을 추가해 보세요.";
                renderChallengeStage();
                break;
            default:
                finishAllStages();
                break;
        }
    }

    // --- Rendering Stages ---

    function renderTypingStage() {
        // Calculate estimated height based on code lines
        const lines = originalCode.split('\n').length;
        const exactHeight = Math.max(300, (lines * 24) + 60) + 'px'; // 24px per line + padding

        // Create a 2-column container
        const flexContainer = document.createElement('div');
        flexContainer.style.display = 'flex';
        flexContainer.style.gap = '1.5rem';
        flexContainer.style.alignItems = 'stretch';
        flexContainer.style.height = exactHeight;
        
        // Original Code View (Left)
        const origContainer = document.createElement('div');
        origContainer.className = 'code-cell';
        origContainer.style.flex = '1';
        origContainer.style.margin = '0';
        origContainer.style.height = '100%';
        origContainer.style.overflowY = 'auto';
        origContainer.innerHTML = `<pre><code>${hljs.highlight(originalCode, {language: 'python'}).value}</code></pre>`;
        flexContainer.appendChild(origContainer);

        // Typing Area (Right)
        const textArea = document.createElement('textarea');
        textArea.id = 'typing-input';
        textArea.className = 'notebook-code-editor';
        textArea.placeholder = "여기에 코드를 타이핑하세요...";
        textArea.style.flex = '1';
        textArea.style.height = '100%';
        textArea.style.margin = '0';
        textArea.style.background = '#0f172a';
        textArea.style.padding = '1.25rem';
        textArea.style.borderRadius = '8px';
        textArea.style.border = '1px solid var(--border-color)';
        textArea.style.resize = 'none'; // Disable resize to keep layout clean
        textArea.style.overflowY = 'auto';
        
        textArea.addEventListener('input', function() {
            this.classList.remove('correct', 'incorrect');
        });
        
        flexContainer.appendChild(textArea);
        dynamicWorkArea.appendChild(flexContainer);
    }

    function renderBlankStage(difficultyRatio) {
        const tokenRegex = /([a-zA-Z0-9_]+)|(\s+)|([^a-zA-Z0-9_\s]+)/g;
        let parsedTokens = [];
        let match;
        while ((match = tokenRegex.exec(originalCode)) !== null) {
            if (match[1]) parsedTokens.push({ type: 'word', value: match[1] });
            else if (match[2]) parsedTokens.push({ type: 'space', value: match[2] });
            else if (match[3]) parsedTokens.push({ type: 'symbol', value: match[3] });
        }

        const wordIndices = parsedTokens.map((t, i) => t.type === 'word' ? i : -1).filter(i => i !== -1);
        shuffleArray(wordIndices);
        const blankIndices = wordIndices.slice(0, Math.max(1, Math.floor(wordIndices.length * difficultyRatio)));
        
        modeData = { parsedTokens, blankIndices };

        const container = document.createElement('div');
        container.className = 'code-cell';
        container.style.lineHeight = '1.8'; // Add some line height for inputs
        container.style.fontSize = '1.05rem';
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        pre.appendChild(code);
        container.appendChild(pre);
        dynamicWorkArea.appendChild(container);

        parsedTokens.forEach((token, index) => {
            if (blankIndices.includes(index)) {
                const input = document.createElement('input');
                input.type = 'text'; input.className = 'notebook-blank-input';
                input.dataset.answer = token.value;
                input.maxLength = token.value.length + 5;
                input.style.width = `${Math.max(3, token.value.length)}ch`;
                input.addEventListener('input', () => input.classList.remove('correct', 'incorrect'));
                code.appendChild(input);
            } else {
                code.appendChild(document.createTextNode(token.value));
            }
        });
    }

    function renderDebuggingStage() {
        // Option A: Use placeholder data for now until notebook.js is updated
        const dummyBugCode = originalCode.replace(/return/g, "break"); // Simple dummy bug
        
        const container = document.createElement('div');
        container.className = 'code-cell';
        
        const textArea = document.createElement('textarea');
        textArea.id = 'debug-input';
        textArea.className = 'notebook-code-editor';
        textArea.value = dummyBugCode;
        textArea.style.minHeight = '300px';
        
        textArea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
            this.classList.remove('correct', 'incorrect');
        });
        
        container.appendChild(textArea);
        dynamicWorkArea.appendChild(container);
    }

    function renderTracingStage() {
        const origContainer = document.createElement('div');
        origContainer.className = 'code-cell';
        origContainer.innerHTML = `<pre><code>${hljs.highlight(originalCode, {language: 'python'}).value}</code></pre>`;
        dynamicWorkArea.appendChild(origContainer);

        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';
        inputGroup.style.marginTop = '2rem';
        
        const label = document.createElement('label');
        label.textContent = "Q. 위 코드가 실행되었을 때 최종 출력 결과는 무엇일까요?";
        label.style.fontWeight = 'bold';
        label.style.display = 'block';
        label.style.marginBottom = '0.5rem';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'trace-input';
        input.className = 'text-input';
        input.placeholder = "예: [1, 2, 3]";
        
        inputGroup.appendChild(label);
        inputGroup.appendChild(input);
        dynamicWorkArea.appendChild(inputGroup);
    }

    function renderChallengeStage() {
        const origContainer = document.createElement('div');
        origContainer.className = 'code-cell';
        origContainer.innerHTML = `<pre><code>${hljs.highlight(originalCode, {language: 'python'}).value}</code></pre>`;
        dynamicWorkArea.appendChild(origContainer);

        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';
        inputGroup.style.marginTop = '2rem';
        
        const label = document.createElement('label');
        label.textContent = "미션: 데이터의 크기를 반환하는 size() 메서드(또는 함수)를 추가해보세요.";
        label.style.fontWeight = 'bold';
        label.style.display = 'block';
        label.style.marginBottom = '0.5rem';
        
        const textArea = document.createElement('textarea');
        textArea.id = 'challenge-input';
        textArea.className = 'notebook-code-editor';
        textArea.placeholder = "여기에 응용 코드를 작성하세요...";
        textArea.style.minHeight = '150px';
        textArea.style.background = '#0f172a';
        textArea.style.padding = '1rem';
        textArea.style.borderRadius = '8px';
        textArea.style.border = '1px solid var(--border-color)';
        
        inputGroup.appendChild(label);
        inputGroup.appendChild(textArea);
        dynamicWorkArea.appendChild(inputGroup);
    }

    // --- Checking Logic ---

    let isWaitingForNextTyping = false;

    function checkCurrentStage() {
        let isPass = false;
        const checkBtn = document.getElementById('check-btn');

        if (currentStage === 0) {
            const inputEl = document.getElementById('typing-input');
            
            // If we are currently waiting for user to acknowledge success and start next repeat
            if (isWaitingForNextTyping) {
                isWaitingForNextTyping = false;
                inputEl.value = '';
                inputEl.classList.remove('correct');
                checkBtn.textContent = '정답 제출 / 다음 단계';
                checkBtn.classList.remove('secondary-btn');
                checkBtn.classList.add('success-btn');
                return;
            }

            const userText = inputEl.value;
            // Ignore whitespace for similarity
            const cleanUser = userText.replace(/\s+/g, '');
            const cleanOrig = originalCode.replace(/\s+/g, '');
            
            if (cleanUser === cleanOrig) {
                inputEl.classList.add('correct');
                typingCount++;
                updateProgress();
                
                if (typingCount < MAX_TYPING) {
                    isWaitingForNextTyping = true;
                    checkBtn.textContent = `성공! ${typingCount}/${MAX_TYPING} 완료 (클릭하여 다음 반복 시작)`;
                    checkBtn.classList.remove('success-btn');
                    checkBtn.classList.add('secondary-btn');
                    return; // Don't advance stage yet
                } else {
                    isPass = true; // All 3 repeats done
                }
            } else {
                inputEl.classList.add('incorrect');
            }
        } 
        else if (currentStage === 1 || currentStage === 2) {
            let allCorrect = true;
            document.querySelectorAll('.notebook-blank-input').forEach(input => {
                input.classList.remove('correct', 'incorrect');
                if (input.value.trim() === input.dataset.answer) {
                    input.classList.add('correct');
                } else {
                    input.classList.add('incorrect');
                    allCorrect = false;
                }
            });
            isPass = allCorrect;
        }
        else if (currentStage === 3) {
            const inputEl = document.getElementById('debug-input');
            const userText = inputEl.value;
            const cleanUser = userText.replace(/\s+/g, '');
            const cleanOrig = originalCode.replace(/\s+/g, '');
            if (cleanUser === cleanOrig) { // user fixed the bug back to original
                inputEl.classList.add('correct');
                isPass = true;
            } else {
                inputEl.classList.add('incorrect');
            }
        }
        else if (currentStage === 4) {
            const inputEl = document.getElementById('trace-input');
            if (inputEl.value.trim().length > 0) { // Accept any non-empty for dummy
                isPass = true;
            } else {
                inputEl.style.borderColor = 'var(--error)';
            }
        }
        else if (currentStage === 5) {
            const inputEl = document.getElementById('challenge-input');
            if (inputEl.value.trim().length > 10) { // Accept any decent attempt for dummy
                isPass = true;
            } else {
                inputEl.classList.add('incorrect');
            }
        }

        if (isPass) {
            setTimeout(() => {
                currentStage++;
                if (currentStage > 5) {
                    finishAllStages();
                } else {
                    startStage(currentStage);
                }
            }, 800);
        }
    }

    function finishAllStages() {
        progressBarFill.style.width = '100%';
        progressText.textContent = `진행률: 100%`;
        resultModal.classList.add('active');
    }

    // Modal Actions
    closeModalBtn.addEventListener('click', () => resultModal.classList.remove('active'));

    copyResultBtn.addEventListener('click', () => {
        const name = studentNameInput.value.trim() || '익명 학생';
        const textToCopy = `[학습 완료 인증]\n이름: ${name}\n학습 6단계 모두 완료!\n정답률: 100%`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            const original = copyResultBtn.textContent;
            copyResultBtn.textContent = '복사 완료!';
            setTimeout(() => copyResultBtn.textContent = original, 2000);
        });
    });

    downloadImgBtn.addEventListener('click', async () => {
        const name = studentNameInput.value.trim() || '익명 학생';
        certName.textContent = name;
        captureArea.classList.add('certificate-mode');
        
        resultModal.classList.remove('active');
        try {
            const canvas = await html2canvas(captureArea, { backgroundColor: '#0f172a', scale: 2 });
            const link = document.createElement('a');
            link.download = `학습인증_${name}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) { alert('이미지 생성 실패'); } 
        finally {
            captureArea.classList.remove('certificate-mode');
            resultModal.classList.add('active');
        }
    });

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
});
