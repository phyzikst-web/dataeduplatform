document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const views = { setup: document.getElementById('setup-view'), practice: document.getElementById('practice-view') };
    const codeInput = document.getElementById('code-input');
    const dropZone = document.getElementById('drop-zone');
    const fileUpload = document.getElementById('file-upload');
    const fileNameDisplay = document.getElementById('file-name-display');
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

            fileNameDisplay.textContent = `불러오는 중...`;
            
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
                codeInput.value = combined.trim();
                fileNameDisplay.textContent = `선택됨: ${notebookMeta.title}`;
            } catch (err) {
                console.error("Failed to load notebook:", err);
                alert(`노트북 불러오기 실패! 파일 경로를 확인해 주세요: ${notebookMeta.filepath}`);
                fileNameDisplay.textContent = '불러오기 실패';
            }
        });
    }
    
    // Mode UI Elements
    const modeRadios = document.querySelectorAll('input[name="learning-mode"]');
    const modeSettings = document.querySelectorAll('.mode-settings');
    const difficultySlider = document.getElementById('difficulty-slider');
    const difficultyValue = document.getElementById('difficulty-value');
    const qaQuestion = document.getElementById('qa-question');
    const qaAnswer = document.getElementById('qa-answer');
    
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

    // Basic UI Events
    modeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentMode = e.target.value;
            modeSettings.forEach(el => el.classList.remove('active'));
            if (currentMode === 'blank') document.getElementById('blank-settings').classList.add('active');
            if (currentMode === 'qa') document.getElementById('qa-settings').classList.add('active');
        });
    });

    difficultySlider.addEventListener('input', (e) => { difficultyValue.textContent = e.target.value; });
    backBtn.addEventListener('click', () => switchView('setup'));
    resetBtn.addEventListener('click', () => generatePractice());
    checkBtn.addEventListener('click', () => checkAnswers());

    generateBtn.addEventListener('click', () => {
        const code = codeInput.value.trim();
        if (!code) return alert('코드를 입력해주세요!');
        originalCode = code;
        generatePractice();
        switchView('practice');
    });

    // Drag & Drop File Upload
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => dropZone.addEventListener(e, preventDefaults, false));
    function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }
    ['dragenter', 'dragover'].forEach(e => dropZone.addEventListener(e, () => dropZone.classList.add('dragover'), false));
    ['dragleave', 'drop'].forEach(e => dropZone.addEventListener(e, () => dropZone.classList.remove('dragover'), false));
    
    dropZone.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.ipynb')) handleFileUpload(file);
        else if (file) alert('.ipynb 파일만 가능합니다.');
    }, false);

    fileUpload.addEventListener('change', (e) => {
        if (e.target.files[0]) handleFileUpload(e.target.files[0]);
        e.target.value = '';
    });

    function handleFileUpload(file) {
        fileNameDisplay.textContent = file.name;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                window.currentNotebook = JSON.parse(event.target.result);
                let combined = '';
                if (window.currentNotebook.cells) {
                    window.currentNotebook.cells.forEach(cell => {
                        if (cell.cell_type === 'code') combined += (Array.isArray(cell.source) ? cell.source.join('') : cell.source) + '\n\n';
                    });
                }
                codeInput.value = combined.trim() || alert('코드 셀이 없습니다.');
            } catch (err) { alert('파싱 실패!'); }
        };
        reader.readAsText(file);
    }

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

        switch (currentMode) {
            case 'blank': generateBlankFill(); break;
            case 'parsons': generateParsons(); break;
            case 'bug': generateBugHunter(); break;
            case 'comment': generateCommentMatch(); break;
            case 'notebook': generateNotebookView(); break;
            case 'qa': generateQA(); break;
        }
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

    // 2. Parsons Puzzle Mode
    function generateParsons() {
        let lines = originalCode.split('\n').filter(l => l.trim() !== '');
        modeData = { correctLines: [...lines] };
        shuffleArray(lines);
        
        const parsonsContainer = document.createElement('div');
        parsonsContainer.className = 'parsons-container';
        practiceContainer.appendChild(parsonsContainer);

        lines.forEach((line, index) => {
            const block = document.createElement('div');
            block.className = 'parsons-block';
            block.textContent = line;
            block.dataset.id = line; // Simple ID using content
            parsonsContainer.appendChild(block);
        });

        Sortable.create(parsonsContainer, { animation: 150, ghostClass: 'sortable-ghost' });
    }

    // 3. Bug Hunter Mode
    function generateBugHunter() {
        const operators = {
            '+': '-', '-': '+',
            '<': '>', '>': '<',
            '++': '--', '--': '++',
            '==': '!=', '!=': '=='
        };
        const tokenRegex = /([a-zA-Z0-9_]+)|(\s+)|(\+\+|--|==|!=|[+<>-])/g; // Simplified for operator match
        let parsedTokens = [];
        let match;
        // Basic fallback tokenization just for this view
        const lines = originalCode.split('\n');
        
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        pre.appendChild(code);
        practiceContainer.appendChild(pre);

        let bugsCount = 0;
        
        lines.forEach((line, lineIndex) => {
            // Find operators in the line
            let newLine = line;
            Object.keys(operators).forEach(op => {
                if(bugsCount > 4) return; // Limit bugs
                if(newLine.includes(op) && Math.random() > 0.5) {
                    const swapped = operators[op];
                    newLine = newLine.replace(op, `<select class="bug-select" data-answer="${op}"><option value="${swapped}">${swapped}</option><option value="${op}">${op}</option></select>`);
                    bugsCount++;
                }
            });
            const lineDiv = document.createElement('div');
            lineDiv.innerHTML = newLine || ' ';
            code.appendChild(lineDiv);
        });

        // Event listeners for bug selects
        document.querySelectorAll('.bug-select').forEach(sel => {
            sel.addEventListener('change', () => sel.classList.remove('correct', 'incorrect'));
        });
    }

    // 4. Comment Match Mode
    function generateCommentMatch() {
        const lines = originalCode.split('\n');
        let processedLines = [];
        let comments = [];
        
        lines.forEach((line, index) => {
            // Simple match for // or #
            const match = line.match(/(\/\/|#)(.*)/);
            if (match) {
                const commentText = match[0];
                const codePart = line.replace(commentText, '').trimEnd();
                comments.push({ id: `c-${index}`, text: commentText });
                processedLines.push({ code: codePart, expectedComment: `c-${index}` });
            } else {
                processedLines.push({ code: line, expectedComment: null });
            }
        });

        if (comments.length === 0) {
            practiceContainer.innerHTML = '<p style="color:var(--error);">오류: 코드에 주석(// 또는 #)이 포함되어 있지 않습니다.</p>';
            return;
        }

        commentBankContainer.style.display = 'block';
        commentBank.innerHTML = '';
        
        shuffleArray(comments);
        comments.forEach(c => {
            const card = document.createElement('div');
            card.className = 'comment-card';
            card.textContent = c.text;
            card.dataset.id = c.id;
            commentBank.appendChild(card);
        });

        Sortable.create(commentBank, { group: 'comments', animation: 150 });

        const pre = document.createElement('pre');
        const code = document.createElement('code');
        pre.appendChild(code);
        practiceContainer.appendChild(pre);

        processedLines.forEach(item => {
            const lineDiv = document.createElement('div');
            lineDiv.style.minHeight = '1.8rem';
            lineDiv.style.marginBottom = '0.5rem';
            lineDiv.appendChild(document.createTextNode(item.code || ' '));
            
            if (item.expectedComment) {
                const dropzone = document.createElement('div');
                dropzone.className = 'comment-dropzone';
                dropzone.dataset.expected = item.expectedComment;
                lineDiv.appendChild(dropzone);
                Sortable.create(dropzone, { group: 'comments', animation: 150, max: 1 });
            }
            code.appendChild(lineDiv);
        });
    }

    // 5. Custom QA Mode
    function generateQA() {
        const q = qaQuestion.value.trim();
        const a = qaAnswer.value.trim();
        if (!q || !a) return alert('질문과 정답을 모두 입력해주세요.');

        modeData = { question: q, answer: a };
        qaDisplayContainer.style.display = 'block';
        qaDisplayQuestion.textContent = `Q. ${q}`;
        qaStudentAnswer.value = '';
        qaStudentAnswer.classList.remove('correct', 'incorrect');

        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.textContent = originalCode;
        pre.appendChild(code);
        practiceContainer.appendChild(pre);
    }

    // 6. Notebook View Mode
    function generateNotebookView() {
        if (!window.currentNotebook || !window.currentNotebook.cells) {
            practiceContainer.innerHTML = '<p style="color:var(--error);">노트북 데이터가 없습니다.</p>';
            return;
        }
        
        practiceContainer.classList.add('notebook-view');
        
        const probCodeCells = window.currentNotebook.cells.filter(c => c.cell_type === 'code');
        const ansCodeCells = (window.answerNotebook && window.answerNotebook.cells) ? window.answerNotebook.cells.filter(c => c.cell_type === 'code') : [];
        let codeCellIndex = 0;
        
        window.currentNotebook.cells.forEach(cell => {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'notebook-cell';
            
            const sourceText = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
            
            if (cell.cell_type === 'markdown') {
                cellDiv.classList.add('markdown-cell');
                cellDiv.innerHTML = marked.parse(sourceText);
            } else if (cell.cell_type === 'code') {
                cellDiv.classList.add('code-cell');
                
                let ansText = '';
                if (codeCellIndex < ansCodeCells.length) {
                    const aSrc = ansCodeCells[codeCellIndex].source;
                    ansText = Array.isArray(aSrc) ? aSrc.join('') : aSrc;
                }
                
                if (sourceText.includes('_____')) {
                    const pre = document.createElement('pre');
                    const code = document.createElement('code');
                    code.className = 'language-python';
                    
                    const parts = sourceText.split('_____');
                    let extractedAnswers = [];
                    
                    if (ansText) {
                        let searchStartIndex = 0;
                        for (let i = 0; i < parts.length - 1; i++) {
                            const prefix = parts[i];
                            const suffix = parts[i+1];
                            const preIdx = ansText.indexOf(prefix, searchStartIndex);
                            if (preIdx !== -1) {
                                const startOfAns = preIdx + prefix.length;
                                if (suffix.length === 0 && i === parts.length - 2) {
                                    extractedAnswers.push(ansText.substring(startOfAns));
                                    break;
                                }
                                const sufIdx = ansText.indexOf(suffix, startOfAns);
                                if (sufIdx !== -1) {
                                    extractedAnswers.push(ansText.substring(startOfAns, sufIdx));
                                    searchStartIndex = sufIdx;
                                } else extractedAnswers.push("");
                            } else extractedAnswers.push("");
                        }
                    }
                    
                    parts.forEach((part, idx) => {
                        code.appendChild(document.createTextNode(part));
                        if (idx < parts.length - 1) {
                            const input = document.createElement('input');
                            input.type = 'text';
                            input.className = 'notebook-blank-input';
                            const ans = extractedAnswers[idx] || '';
                            input.dataset.answer = ans.trim();
                            const w = Math.max(4, ans.length + 2);
                            input.style.width = `${w}ch`;
                            input.addEventListener('input', function() {
                                this.classList.remove('correct', 'incorrect');
                            });
                            code.appendChild(input);
                        }
                    });
                    pre.appendChild(code);
                    cellDiv.appendChild(pre);
                } else {
                    const textarea = document.createElement('textarea');
                    textarea.className = 'notebook-code-editor';
                    textarea.spellcheck = false;
                    textarea.value = sourceText;
                    textarea.dataset.index = codeCellIndex;
                    
                    textarea.style.height = 'auto';
                    setTimeout(() => { textarea.style.height = (textarea.scrollHeight || 100) + 'px'; }, 10);
                    textarea.addEventListener('input', function() {
                        this.style.height = 'auto';
                        this.style.height = (this.scrollHeight) + 'px';
                        this.classList.remove('correct', 'incorrect');
                    });
                    
                    cellDiv.appendChild(textarea);
                }
                
                codeCellIndex++;
                
                if (cell.outputs && cell.outputs.length > 0) {
                    const outputDiv = document.createElement('div');
                    outputDiv.className = 'notebook-output';
                    let outText = '';
                    cell.outputs.forEach(out => {
                        if (out.text) outText += Array.isArray(out.text) ? out.text.join('') : out.text;
                    });
                    if (outText) {
                        const outPre = document.createElement('pre');
                        outPre.textContent = outText;
                        outputDiv.appendChild(outPre);
                        cellDiv.appendChild(outputDiv);
                    }
                }
            }
            practiceContainer.appendChild(cellDiv);
        });
        
        const actionButtons = document.querySelector('#practice-view .action-buttons');
        if (actionButtons) actionButtons.style.display = 'flex';
    }

    // Checking Logic
    function checkAnswers() {
        let allCorrect = true;
        let checkedCount = 0;

        if (currentMode === 'blank') {
            document.querySelectorAll('.blank-input').forEach(input => {
                input.classList.remove('correct', 'incorrect');
                if (input.value.trim() === input.dataset.answer) input.classList.add('correct');
                else { input.classList.add('incorrect'); allCorrect = false; }
                checkedCount++;
            });
        } 
        else if (currentMode === 'parsons') {
            const blocks = document.querySelectorAll('.parsons-block');
            blocks.forEach((block, idx) => {
                block.classList.remove('correct-pos', 'incorrect-pos');
                if (block.dataset.id === modeData.correctLines[idx]) block.classList.add('correct-pos');
                else { block.classList.add('incorrect-pos'); allCorrect = false; }
                checkedCount++;
            });
        }
        else if (currentMode === 'bug') {
            const selects = document.querySelectorAll('.bug-select');
            if (selects.length === 0) return alert('버그가 존재하지 않습니다.');
            selects.forEach(sel => {
                sel.classList.remove('correct', 'incorrect');
                if (sel.value === sel.dataset.answer) sel.classList.add('correct');
                else { sel.classList.add('incorrect'); allCorrect = false; }
                checkedCount++;
            });
        }
        else if (currentMode === 'comment') {
            const dropzones = document.querySelectorAll('.comment-dropzone');
            dropzones.forEach(dz => {
                dz.classList.remove('correct', 'incorrect');
                const dropped = dz.querySelector('.comment-card');
                if (!dropped) { dz.classList.add('incorrect'); allCorrect = false; }
                else if (dropped.dataset.id === dz.dataset.expected) dz.classList.add('correct');
                else { dz.classList.add('incorrect'); allCorrect = false; }
                checkedCount++;
            });
        }
        else if (currentMode === 'qa') {
            qaStudentAnswer.classList.remove('correct', 'incorrect');
            if (qaStudentAnswer.value.trim().toLowerCase() === modeData.answer.toLowerCase()) {
                qaStudentAnswer.classList.add('correct');
                qaStudentAnswer.style.borderColor = 'var(--success)';
            } else {
                qaStudentAnswer.classList.add('incorrect');
                qaStudentAnswer.style.borderColor = 'var(--error)';
                allCorrect = false;
            }
            checkedCount++;
        }
        else if (currentMode === 'notebook') {
            const blankInputs = document.querySelectorAll('.notebook-blank-input');
            const editors = document.querySelectorAll('.notebook-code-editor');
            
            if (blankInputs.length === 0 && editors.length === 0) return;
            
            if (!window.answerNotebook || !window.answerNotebook.cells) {
                return alert('정답 해설 노트북이 등록되지 않았습니다.');
            }
            
            const answerCodeCells = window.answerNotebook.cells.filter(c => c.cell_type === 'code');
            
            blankInputs.forEach(input => {
                input.classList.remove('correct', 'incorrect');
                const studText = input.value.trim();
                const expected = input.dataset.answer.replace(/\s+/g, '');
                const actual = studText.replace(/\s+/g, '');
                
                if (actual === expected && actual !== '') {
                    input.classList.add('correct');
                } else {
                    input.classList.add('incorrect');
                    allCorrect = false;
                }
                checkedCount++;
            });
            
            editors.forEach(editor => {
                editor.classList.remove('correct', 'incorrect');
                const editorIndex = parseInt(editor.dataset.index);
                if (editorIndex < answerCodeCells.length) {
                    const ansSource = answerCodeCells[editorIndex].source;
                    const ansText = (Array.isArray(ansSource) ? ansSource.join('') : ansSource).trim();
                    const studText = editor.value.trim();
                    
                    const cleanAns = ansText.replace(/\s+/g, '');
                    const cleanStud = studText.replace(/\s+/g, '');
                    
                    if (cleanStud === cleanAns && cleanStud !== '') {
                        editor.classList.add('correct');
                    } else {
                        editor.classList.add('incorrect');
                        allCorrect = false;
                    }
                }
                checkedCount++;
            });
        }

        if (checkedCount > 0 && allCorrect) {
            setTimeout(() => resultModal.classList.add('active'), 300);
        }
    }

    // Modal Actions
    closeModalBtn.addEventListener('click', () => resultModal.classList.remove('active'));

    copyResultBtn.addEventListener('click', () => {
        const name = studentNameInput.value.trim() || '익명 학생';
        const modesMap = { blank: '빈칸 채우기', parsons: '퍼즐 맟주기', bug: '버그 찾기', comment: '주석 짝맞추기', qa: '커스텀 QA', notebook: '노트북 실습' };
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
