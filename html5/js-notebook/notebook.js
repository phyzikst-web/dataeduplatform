class JSNotebook {
    constructor() {
        this.cells = [];
        this.iframe = null;
        this.nextCellId = 1;
        this.container = document.getElementById('notebook-content');
        
        this.initSandbox();
        this.setupEventListeners();
        
        // Add initial cells
        this.addCell("# 자바스크립트 노트북\n\n여기에 마크다운으로 설명을 적을 수 있습니다.\n아래 셀의 자바스크립트 코드를 실행해보세요.", 'markdown');
        this.runCell(1); // 렌더링
        this.addCell("let a = 10;\nconsole.log('변수 a가 선언되었습니다: ', a);");
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
            document.getElementById(`cell-${cellId}`).remove();
            this.cells = this.cells.filter(c => c.id !== cellId);
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
        
        try {
            const win = this.iframe.contentWindow;
            const doc = win.document;
            
            // eval 대신 script 태그를 삽입해야 let, const가 글로벌 컨텍스트(iframe 내)에 유지됨
            const script = doc.createElement('script');
            script.textContent = code;
            doc.body.appendChild(script);
            
            headerSpan.textContent = `[${cellId}] JS Code Cell`;
            
        } catch (err) {
            this.captureLog('error', [err.name + ": " + err.message]);
            headerSpan.textContent = `[!] Error`;
        }
        
        // 약간의 지연 후 실행 셀 포커스 해제 (비동기 로그 캡처를 위해)
        setTimeout(() => {
            if (this.currentExecutingCell === cellId) {
                this.currentExecutingCell = null;
            }
        }, 100);
    }

    runAll() {
        this.cells.forEach(cell => this.runCell(cell.id));
    }

    restartKernel() {
        if (confirm('커널을 재시작하시겠습니까? 모든 변수와 실행 상태가 초기화됩니다.')) {
            this.initSandbox();
            this.cells.forEach(cell => {
                const outputEl = document.getElementById(`output-${cell.id}`);
                outputEl.innerHTML = '';
                outputEl.classList.remove('has-content');
                document.querySelector(`#cell-${cell.id} .cell-header span`).textContent = `[ ] JS Code Cell`;
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
