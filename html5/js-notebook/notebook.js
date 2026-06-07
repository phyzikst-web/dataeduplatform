class JSNotebook {
    constructor() {
        this.cells = [];
        this.iframe = null;
        this.nextCellId = 1;
        this.container = document.getElementById('notebook-content');
        
        this.initSandbox();
        this.setupEventListeners();
        this.initSidebar();
        
        // Add initial empty cell if no problem loaded
        if (!this.currentProblem) {
            this.addCell();
        }
    }

    initSidebar() {
        const sidebar = document.getElementById('sidebar');
        const problemList = document.getElementById('problem-list');
        const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
        
        if (!window.JS_PROBLEMS || window.JS_PROBLEMS.length === 0) return;
        
        btnToggleSidebar.addEventListener('click', () => {
            sidebar.classList.toggle('hidden');
        });

        // Add Free Practice Item
        const freePracticeLi = document.createElement('li');
        freePracticeLi.textContent = '💡 자유 연습장';
        freePracticeLi.dataset.id = 'free-practice';
        freePracticeLi.addEventListener('click', () => this.loadFreePractice());
        problemList.appendChild(freePracticeLi);

        window.JS_PROBLEMS.forEach(prob => {
            const li = document.createElement('li');
            li.textContent = prob.title;
            li.dataset.id = prob.id;
            li.addEventListener('click', () => this.loadProblem(prob.id));
            problemList.appendChild(li);
        });
    }

    saveCurrentState() {
        if (!this.currentProblem) return;
        const state = this.cells.map(c => ({
            type: c.type,
            code: c.cm.getValue()
        }));
        localStorage.setItem(`js_notebook_state_${this.currentProblem}`, JSON.stringify(state));
    }

    loadProblem(problemId) {
        if (this.currentProblem) this.saveCurrentState();

        const problem = window.JS_PROBLEMS.find(p => p.id === problemId);
        if (!problem) return;
        
        // Update active class
        document.querySelectorAll('.problem-list li').forEach(li => {
            li.classList.toggle('active', li.dataset.id === problemId);
        });

        // Clear existing cells
        this.container.innerHTML = '';
        this.cells = [];
        this.nextCellId = 1;
        this.currentProblem = problemId;
        this.restartKernel(true);

        const savedState = localStorage.getItem(`js_notebook_state_${problemId}`);
        if (savedState) {
            const state = JSON.parse(savedState);
            
            // 항상 최신 문제 설명으로 덮어쓰기 (로컬 스토리지에 옛날 문제 설명이 남아있는 문제 해결)
            if (state.length > 0 && state[0].type === 'markdown') {
                state[0].code = problem.markdown;
            }

            // 빈 코드 셀 제거 (불필요한 빈 셀이 쌓이는 문제 방지)
            const filteredState = state.filter(cell => 
                cell.type === 'markdown' || (cell.code && cell.code.trim() !== '')
            );

            filteredState.forEach(cell => {
                const cellId = this.addCell(cell.code, cell.type);
                if (cell.type === 'markdown') {
                    this.runCell(cellId);
                }
            });
        } else {
            // Add problem markdown
            const mdCellId = this.addCell(problem.markdown, 'markdown');
            this.runCell(mdCellId);

            // Add problem starter code
            this.addCell(problem.code, 'code');
        }
    }

    loadFreePractice() {
        if (this.currentProblem) this.saveCurrentState();

        // Update active class
        document.querySelectorAll('.problem-list li').forEach(li => {
            li.classList.toggle('active', li.dataset.id === 'free-practice');
        });

        // Clear existing cells
        this.container.innerHTML = '';
        this.cells = [];
        this.nextCellId = 1;
        this.currentProblem = 'free-practice';
        this.restartKernel(true);

        const savedState = localStorage.getItem(`js_notebook_state_free-practice`);
        if (savedState) {
            const state = JSON.parse(savedState);
            state.forEach(cell => {
                const cellId = this.addCell(cell.code, cell.type);
                if (cell.type === 'markdown') {
                    this.runCell(cellId);
                }
            });
        } else {
            // Add empty code cell
            this.addCell('', 'code');
        }
    }

    initSandbox() {
        // 기존 샌드박스가 있다면 제거
        if (this.iframe) {
            this.iframe.remove();
        }
        
        this.iframe = document.createElement('iframe');
        this.iframe.style.display = 'none';
        document.body.appendChild(this.iframe);

        const win = this.iframe.contentWindow;
        
        // console.log 가로채기
        win.console = {
            log: (...args) => this.captureLog('log', args),
            error: (...args) => this.captureLog('error', args),
            warn: (...args) => this.captureLog('warn', args),
            info: (...args) => this.captureLog('info', args)
        };
        
        // 에러 가로채기
        win.onerror = (message, source, lineno, colno, error) => {
            this.captureLog('error', [message]);
            return true;
        };
        
        this.currentExecutingCell = null;
    }

    captureLog(type, args) {
        if (!this.currentExecutingCell) return;
        
        const cellId = this.currentExecutingCell;
        const outputEl = document.getElementById(`output-${cellId}`);
        
        let outputText = args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg, null, 2);
                } catch(e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');
        
        const line = document.createElement('div');
        line.className = type === 'error' ? 'out-error' : 'out-log';
        line.textContent = outputText;
        
        outputEl.appendChild(line);
        outputEl.classList.add('has-content');
    }

    addCell(initialCode = '', type = 'code') {
        const cellId = this.nextCellId++;
        
        const isMarkdown = type === 'markdown';
        const cellTitle = isMarkdown ? 'Markdown Cell' : 'JS Code Cell';
        const btnAction = isMarkdown ? '렌더링' : '실행';
        
        const cellHtml = `
            <div class="cell ${isMarkdown ? 'markdown-cell' : ''}" id="cell-${cellId}" data-type="${type}">
                <div class="cell-header">
                    <span>[ ] ${cellTitle}</span>
                    <div class="cell-actions">
                        ${isMarkdown ? `<button class="cell-action-btn" onclick="notebook.editMarkdown(${cellId})" title="수정 (더블클릭)">✎ 수정</button>` : ''}
                        <button class="cell-action-btn" onclick="notebook.runCell(${cellId})" title="${btnAction} (Ctrl+Enter)">▶ ${btnAction}</button>
                        <button class="cell-action-btn" onclick="notebook.deleteCell(${cellId})" title="삭제">✕</button>
                    </div>
                </div>
                <div class="cell-editor" id="editor-container-${cellId}">
                    <textarea id="editor-${cellId}"></textarea>
                </div>
                ${isMarkdown ? `<div class="markdown-preview" id="preview-${cellId}" style="display:none;" ondblclick="notebook.editMarkdown(${cellId})"></div>` : `<div class="cell-output" id="output-${cellId}"></div>`}
            </div>
        `;
        
        this.container.insertAdjacentHTML('beforeend', cellHtml);
        
        const textarea = document.getElementById(`editor-${cellId}`);
        const isLight = document.body.classList.contains('light-theme');
        const cm = CodeMirror.fromTextArea(textarea, {
            mode: isMarkdown ? 'markdown' : 'javascript',
            theme: isLight ? 'default' : 'dracula',
            lineNumbers: !isMarkdown,
            autoCloseBrackets: true,
            matchBrackets: true,
            indentUnit: 4,
            tabSize: 4,
            viewportMargin: Infinity
        });
        
        cm.setValue(initialCode);
        
        // 포커스 스타일링
        cm.on('focus', () => document.getElementById(`cell-${cellId}`).classList.add('focused'));
        cm.on('blur', () => document.getElementById(`cell-${cellId}`).classList.remove('focused'));
        cm.on('change', () => {
            // Delay save slightly to avoid saving constantly on every keystroke
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => this.saveCurrentState(), 500);
        });

        // 단축키 실행
        cm.setOption("extraKeys", {
            "Ctrl-Enter": () => this.runCell(cellId),
            "Shift-Enter": () => {
                this.runCell(cellId);
                // 마지막 셀이면 새 셀 추가, 아니면 다음 셀로 포커스 이동 (간단히 구현)
                const idx = this.cells.findIndex(c => c.id === cellId);
                if (idx === this.cells.length - 1) {
                    this.addCell();
                } else {
                    this.cells[idx+1].cm.focus();
                }
            }
        });

        this.cells.push({ id: cellId, cm: cm, type: type });
        cm.focus();
        
        return cellId;
    }

    deleteCell(cellId) {
        if (this.cells.length <= 1) return; // 최소 1개는 유지
        
        if (confirm('이 셀을 삭제하시겠습니까?')) {
            const idx = this.cells.findIndex(c => c.id === cellId);
            if (idx !== -1) {
                this.cells.splice(idx, 1);
                document.getElementById(`cell-${cellId}`).remove();
                this.saveCurrentState();
            }
        }
    }

    editMarkdown(cellId) {
        const cell = this.cells.find(c => c.id === cellId);
        if (!cell || cell.type !== 'markdown') return;
        
        document.getElementById(`preview-${cellId}`).style.display = 'none';
        document.getElementById(`editor-container-${cellId}`).style.display = 'block';
        cell.cm.focus();
    }

    runCell(cellId) {
        const cell = this.cells.find(c => c.id === cellId);
        if (!cell) return;
        
        const code = cell.cm.getValue();
        const headerSpan = document.querySelector(`#cell-${cellId} .cell-header span`);
        
        if (cell.type === 'markdown') {
            const previewEl = document.getElementById(`preview-${cellId}`);
            const editorEl = document.getElementById(`editor-container-${cellId}`);
            previewEl.innerHTML = marked.parse(code);
            previewEl.style.display = 'block';
            editorEl.style.display = 'none';
            headerSpan.textContent = `[M] Markdown Cell`;
            return;
        }
        
        const outputEl = document.getElementById(`output-${cellId}`);
        
        // 출력창 초기화
        outputEl.innerHTML = '';
        outputEl.classList.remove('has-content');
        this.currentExecutingCell = cellId;
        
        headerSpan.textContent = `[*] Running...`;
        
        // 학생 코드 출력을 수집할 배열
        const studentLogs = [];
        const origCaptureLog = this.captureLog.bind(this);
        
        // captureLog를 임시로 래핑하여 학생 출력을 수집
        const origMethod = this.captureLog;
        this.captureLog = (type, args) => {
            if (type !== 'error') {
                studentLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
            }
            origMethod.call(this, type, args);
        };
        
        try {
            const win = this.iframe.contentWindow;
            const doc = win.document;
            
            // 같은 셀을 여러 번 실행할 때 'Identifier has already been declared' 에러 방지
            const safeCode = code.replace(/\blet\s+/g, 'var ').replace(/\bconst\s+/g, 'var ');
            
            const script = doc.createElement('script');
            script.textContent = safeCode;
            doc.body.appendChild(script);
            
            headerSpan.textContent = `[${cellId}] JS Code Cell`;
            
        } catch (err) {
            this.captureLog('error', [err.name + ": " + err.message]);
            headerSpan.textContent = `[!] Error`;
        }
        
        // captureLog 복원
        this.captureLog = origMethod;
        
        // 정답 코드 출력 비교 (answerCode가 있는 문제일 때만)
        if (this.currentProblem && this.currentProblem !== 'free-practice' && cell.type === 'code') {
            const problem = window.JS_PROBLEMS.find(p => p.id === this.currentProblem);
            if (problem && problem.answerCode) {
                try {
                    const expectedLogs = this.runAnswerCode(problem.answerCode);
                    const studentOutput = studentLogs.join('\n').trim();
                    const expectedOutput = expectedLogs.join('\n').trim();
                    
                    if (studentOutput.length > 0 && studentOutput === expectedOutput) {
                        // 정답
                        const line = document.createElement('div');
                        line.className = 'out-log';
                        line.style.cssText = 'color: #4caf50; font-weight: bold; margin-top: 8px; padding: 6px 10px; background: rgba(76,175,80,0.1); border-radius: 4px; border-left: 3px solid #4caf50;';
                        line.textContent = '✅ 정답입니다! 잘하셨습니다!';
                        outputEl.appendChild(line);
                        outputEl.classList.add('has-content');
                    } else if (studentOutput.length > 0) {
                        // 오답
                        const line = document.createElement('div');
                        line.className = 'out-log';
                        line.style.cssText = 'color: #ff9800; font-weight: bold; margin-top: 8px; padding: 6px 10px; background: rgba(255,152,0,0.1); border-radius: 4px; border-left: 3px solid #ff9800;';
                        line.textContent = '❌ 출력 결과가 정답과 다릅니다. 다시 확인해 보세요.';
                        outputEl.appendChild(line);
                        outputEl.classList.add('has-content');
                    }
                } catch (e) {
                    // 정답 비교 중 오류 발생 시 무시
                }
            }
        }
        
        // 약간의 지연 후 실행 셀 포커스 해제 (비동기 로그 캡처를 위해)
        setTimeout(() => {
            if (this.currentExecutingCell === cellId) {
                this.currentExecutingCell = null;
            }
        }, 100);
    }

    // 정답 코드를 별도 iframe에서 실행하여 출력 결과만 수집
    runAnswerCode(answerCode) {
        const logs = [];
        const tempIframe = document.createElement('iframe');
        tempIframe.style.display = 'none';
        document.body.appendChild(tempIframe);
        
        const tempWin = tempIframe.contentWindow;
        tempWin.console = {
            log: (...args) => {
                logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
            },
            error: () => {},
            warn: () => {},
            info: () => {}
        };
        
        try {
            const safeAnswer = answerCode.replace(/\blet\s+/g, 'var ').replace(/\bconst\s+/g, 'var ');
            const script = tempIframe.contentDocument.createElement('script');
            script.textContent = safeAnswer;
            tempIframe.contentDocument.body.appendChild(script);
        } catch (e) {
            // 정답 코드 실행 오류
        }
        
        tempIframe.remove();
        return logs;
    }

    runAll() {
        this.cells.forEach(cell => this.runCell(cell.id));
    }

    restartKernel(force = false) {
        if (force || confirm('커널을 재시작하시겠습니까? 모든 변수와 실행 상태가 초기화됩니다.')) {
            this.initSandbox();
            this.cells.forEach(cell => {
                const outputEl = document.getElementById(`output-${cell.id}`);
                if (outputEl) {
                    outputEl.innerHTML = '';
                    outputEl.classList.remove('has-content');
                }
                const headerSpan = document.querySelector(`#cell-${cell.id} .cell-header span`);
                if (headerSpan) {
                    headerSpan.textContent = `[ ] JS Code Cell`;
                }
            });
            console.log("커널 재시작 완료");
        }
    }
    
    setupEventListeners() {
        document.getElementById('btn-add-cell').addEventListener('click', () => this.addCell('', 'code'));
        document.getElementById('btn-add-md-cell').addEventListener('click', () => this.addCell('', 'markdown'));
        document.getElementById('btn-run-all').addEventListener('click', () => this.runAll());
        document.getElementById('btn-restart').addEventListener('click', () => this.restartKernel());
        document.getElementById('btn-toggle-theme').addEventListener('click', () => this.toggleTheme());
    }

    toggleTheme() {
        const isLight = document.body.classList.toggle('light-theme');
        const theme = isLight ? 'default' : 'dracula';
        
        this.cells.forEach(cell => {
            cell.cm.setOption('theme', theme);
        });
    }
}

let notebook;
document.addEventListener('DOMContentLoaded', () => {
    notebook = new JSNotebook();
});
