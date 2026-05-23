document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const views = { setup: document.getElementById('setup-view'), practice: document.getElementById('practice-view') };
    const notebookSelect = document.getElementById('notebook-select');
    const generateBtn = document.getElementById('generate-btn');
    const backBtn = document.getElementById('back-btn');
    const checkBtn = document.getElementById('check-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    // Load pre-hosted notebooks if available
    if (typeof NOTEBOOKS !== 'undefined' && NOTEBOOKS.length > 0) {
        notebookSelect.innerHTML = '';
        
        // Add placeholder option
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
                window.answerNotebook = null;
                if (notebookMeta.answerpath) {
                    try {
                        const ansRes = await fetch(notebookMeta.answerpath);
                        if (ansRes.ok) window.answerNotebook = await ansRes.json();
                    } catch (e) {
                        console.warn("Answer notebook load failed", e);
                    }
                }
                
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
    
    // Mode UI Elements
    const difficultySlider = document.getElementById('difficulty-slider');
    const difficultyValue = document.getElementById('difficulty-value');
    
    // Practice View Elements
    const practiceContainer = document.getElementById('practice-container');
    const commentBankContainer = document.getElementById('comment-bank-container');
    const commentBank = document.getElementById('comment-bank');
    const qaDisplayContainer = document.getElementById('qa-display-container');
    const qaDisplayQuestion = document.getElementById('qa-display-question');
    const qaStudentAnswer = document.getElementById('qa-student-answer');
    
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
    let currentMode = 'blank';
    let modeData = {};

    difficultySlider.addEventListener('input', (e) => { difficultyValue.textContent = e.target.value; });
    backBtn.addEventListener('click', () => switchView('setup'));
    resetBtn.addEventListener('click', () => generatePractice());
    checkBtn.addEventListener('click', () => checkAnswers());

    generateBtn.addEventListener('click', () => {
        if (!originalCode) return alert('실습 주피터 노트북을 선택해 주세요!');
        generatePractice();
        switchView('practice');
    });

    // Main Router
    function switchView(viewName) {
        Object.values(views).forEach(v => v.classList.remove('active'));
        views[viewName].classList.add('active');
    }

    function generatePractice() {
        practiceContainer.innerHTML = '';
        practiceContainer.classList.remove('notebook-view');
        commentBankContainer.style.display = 'none';
        qaDisplayContainer.style.display = 'none';
        
        const actionButtons = document.querySelector('#practice-view .action-buttons');
        if (actionButtons) actionButtons.style.display = 'flex';
        
        modeData = {};
        generateBlankFill();
    }

    // 1. Blank Fill Mode
    function generateBlankFill() {
        const tokenRegex = /([a-zA-Z0-9_]+)|(\s+)|([^a-zA-Z0-9_\s]+)/g;
        let parsedTokens = [];
        let match;
        while ((match = tokenRegex.exec(originalCode)) !== null) {
            if (match[1]) parsedTokens.push({ type: 'word', value: match[1] });
            else if (match[2]) parsedTokens.push({ type: 'space', value: match[2] });
            else if (match[3]) parsedTokens.push({ type: 'symbol', value: match[3] });
        }

        const wordIndices = parsedTokens.map((t, i) => t.type === 'word' ? i : -1).filter(i => i !== -1);
        const difficultyRatio = parseInt(difficultySlider.value) / 100;
        shuffleArray(wordIndices);
        const blankIndices = wordIndices.slice(0, Math.max(1, Math.floor(wordIndices.length * difficultyRatio)));
        
        modeData = { parsedTokens, blankIndices };

        const pre = document.createElement('pre');
        const code = document.createElement('code');
        pre.appendChild(code);
        practiceContainer.appendChild(pre);

        parsedTokens.forEach((token, index) => {
            if (blankIndices.includes(index)) {
                const input = document.createElement('input');
                input.type = 'text'; input.className = 'blank-input';
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

    // Checking Logic
    function checkAnswers() {
        let allCorrect = true;
        let checkedCount = 0;

        document.querySelectorAll('.blank-input').forEach(input => {
            input.classList.remove('correct', 'incorrect');
            if (input.value.trim() === input.dataset.answer) {
                input.classList.add('correct');
            } else {
                input.classList.add('incorrect');
                allCorrect = false;
            }
            checkedCount++;
        });

        if (checkedCount > 0 && allCorrect) {
            setTimeout(() => resultModal.classList.add('active'), 300);
        }
    }

    // Modal Actions
    closeModalBtn.addEventListener('click', () => resultModal.classList.remove('active'));

    copyResultBtn.addEventListener('click', () => {
        const name = studentNameInput.value.trim() || '익명 학생';
        const modesMap = { blank: '빈칸 채우기' };
        const textToCopy = `[학습 완료 인증]\n이름: ${name}\n학습 모드: ${modesMap[currentMode]}\n정답률: 100%`;
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
        
        // Cleanup UI for screenshot
        document.querySelectorAll('.blank-input, .text-input, .bug-select').forEach(el => {
            el.style.border = 'none'; el.style.background = 'transparent'; el.style.color = '#34d399';
        });

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
            document.querySelectorAll('.blank-input, .text-input, .bug-select').forEach(el => {
                el.style.border = ''; el.style.background = ''; el.style.color = '';
            });
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
