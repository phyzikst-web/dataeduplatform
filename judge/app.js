document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize Layout (Split.js)
    Split(['#split-left', '#split-right'], { sizes: [40, 60], minSize: 300, gutterSize: 6 });
    Split(['#editor-pane', '#terminal-pane'], { direction: 'vertical', sizes: [60, 40], minSize: 150, gutterSize: 6 });

    // 2. Initialize UI Elements
    const problemSelect = document.getElementById('problem-select');
    const themeSelect = document.getElementById('theme-select');
    const probTitle = document.getElementById('prob-title');
    const probDesc = document.getElementById('prob-desc');
    const runBtn = document.getElementById('run-btn');
    const resetBtn = document.getElementById('reset-code-btn');
    const terminalOutput = document.getElementById('terminal-output');
    const pyodideStatus = document.getElementById('pyodide-status');
    const editorFilename = document.getElementById('editor-filename');
    const clearTerminalBtn = document.getElementById('clear-terminal');

    // 3. Initialize CodeMirror
    const editor = CodeMirror(document.getElementById('editor-container'), {
        mode: 'python',
        theme: themeSelect.value || 'dracula',
        lineNumbers: true,
        indentUnit: 4,
        matchBrackets: true,
        autoCloseBrackets: true,
        extraKeys: {
            "Ctrl-Enter": function(cm) {
                if (!runBtn.disabled) {
                    runBtn.click();
                }
            }
        }
    });

    let currentProblem = null;
    let pyodide = null;

    // 4. Update Run Button Enablement State
    function updateRunButtonState() {
        if (!currentProblem) {
            runBtn.disabled = true;
            return;
        }
        runBtn.disabled = (pyodide === null);
    }

    // 5. Load Pyodide (Python Engine)
    try {
        pyodide = await loadPyodide();
        pyodideStatus.textContent = '[시스템] 파이썬 엔진 준비 완료';
        pyodideStatus.className = 'status-indicator status-ready';
        updateRunButtonState();
    } catch (err) {
        pyodideStatus.textContent = '[시스템 오류] 파이썬 엔진 로드 실패';
        pyodideStatus.className = 'status-indicator status-error';
        console.error(err);
    }

    // 6. Load Problems list from problems.js
    if (typeof PROBLEMS !== 'undefined' && PROBLEMS.length > 0) {
        problemSelect.innerHTML = '';
        PROBLEMS.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.title;
            problemSelect.appendChild(option);
        });

        loadProblem(PROBLEMS[0].id);
    } else {
        probTitle.textContent = "문제 목록 없음";
        probDesc.innerHTML = `<p style="color:var(--error);">problems.js 파일을 로드하지 못했거나 문제 목록이 비어 있습니다.</p>`;
    }

    async function loadProblem(id) {
        const problemMeta = PROBLEMS.find(p => p.id === id);
        if (!problemMeta) return;

        probTitle.textContent = problemMeta.title;
        probDesc.innerHTML = `<div class="term-line term-info">주피터 노트북 파일(${problemMeta.filepath})을 로드 및 해석하는 중...</div>`;
        
        try {
            // Fetch the hosted .ipynb file
            const response = await fetch(problemMeta.filepath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const notebook = await response.json();
            
            let description = '';
            let initialCode = '';
            let testCases = [];
            let functionName = 'solution'; // Default fallback

            // Parse Notebook cells
            if (notebook.cells) {
                notebook.cells.forEach(cell => {
                    if (cell.cell_type === 'markdown') {
                        // Combine Markdown source lines
                        const mdSource = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
                        description += mdSource + '\n';
                    } else if (cell.cell_type === 'code') {
                        const codeSource = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
                        
                        // Check if it's the solution code template (contains 'def solution')
                        if (codeSource.includes('def ')) {
                            initialCode = codeSource;
                            
                            // Try to dynamically extract function name (e.g. def solution(number, k) -> "solution")
                            const funcMatch = codeSource.match(/def\s+(\w+)\s*\(/);
                            if (funcMatch) {
                                functionName = funcMatch[1];
                            }
                        }
                        
                        // Check if it contains assertions for test cases
                        if (codeSource.includes('assert ')) {
                            const lines = codeSource.split('\n');
                            lines.forEach(line => {
                                // Matches "assert [anyFuncName]([args]) == [expected]"
                                const assertRegex = /assert\s+\w+\((.*)\)\s*==\s*(.*)/;
                                const match = line.trim().match(assertRegex);
                                if (match) {
                                    try {
                                        const inputRaw = match[1];
                                        const outputRaw = match[2];
                                        
                                        // Safely evaluate standard inputs and outputs
                                        const evalInput = new Function(`return [${inputRaw}];`)();
                                        const evalOutput = new Function(`return ${outputRaw};`)();
                                        
                                        testCases.push({
                                            input: evalInput,
                                            output: evalOutput
                                        });
                                    } catch (e) {
                                        console.error("Failed to parse assertion line:", line, e);
                                    }
                                }
                            });
                        }
                    }
                });
            }

            // Update current problem with parsed data
            currentProblem = {
                id: problemMeta.id,
                title: problemMeta.title,
                description: description || '<h3>설명이 없는 문제</h3>',
                initialCode: initialCode || 'def solution():\n    return',
                testCases: testCases.length > 0 ? testCases : [{ input: [], output: null }],
                functionName: functionName
            };

            probDesc.innerHTML = currentProblem.description;
            editor.setValue(currentProblem.initialCode);
            
            // Highlight first file tab
            editorFilename.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="file-icon" style="color: #38bdf8;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                solution.py
            `;
            
            // Synced select dropdown UI
            problemSelect.value = id;
            updateRunButtonState();
            
            terminalOutput.innerHTML = '<div class="term-line">문제가 성공적으로 로드되었습니다. 파이썬 코드를 작성해 보세요.</div>';

        } catch (err) {
            console.error("Failed to load notebook:", err);
            probDesc.innerHTML = `
                <h3 style="color:var(--error); margin-bottom:10px;">주피터 노트북 파일 로드 실패</h3>
                <p style="color:var(--text-secondary);">경로: <code>${problemMeta.filepath}</code></p>
                <hr style="border-color:#2e3d4f; margin:15px 0;">
                <p><strong>원인 가능성:</strong></p>
                <ol style="margin-left: 20px; line-height: 1.6; color: var(--text-secondary);">
                    <li>해당 경로에 실제 노트북 파일이 존재하지 않는 경우</li>
                    <li>웹서버(python -m http.server 8080 등)가 실행 중이지 않고 단순 더블클릭(file://)하여 로컬 파일을 차단당한 경우 (브라우저 CORS 제한)</li>
                </ol>
            `;
        }
    }

    function setInitialCode() {
        if (!currentProblem) return;
        editor.setValue(currentProblem.initialCode);
        updateRunButtonState();
    }

    // Event Handlers
    problemSelect.addEventListener('change', (e) => loadProblem(e.target.value));
    
    themeSelect.addEventListener('change', (e) => {
        editor.setOption('theme', e.target.value);
    });

    resetBtn.addEventListener('click', () => {
        if (confirm("정말로 코드를 초기 상태로 되돌리시겠습니까?")) {
            setInitialCode();
        }
    });

    clearTerminalBtn.addEventListener('click', () => {
        terminalOutput.innerHTML = '<div class="term-line">결과창이 비워졌습니다.</div>';
    });

    // Global keyboard listener for Ctrl+Enter code execution
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            if (!runBtn.disabled) {
                runBtn.click();
            }
        }
    });

    // 7. Execution Engine Sandbox (Python3-only via Pyodide)
    runBtn.addEventListener('click', async () => {
        if (!currentProblem) return;
        const code = editor.getValue();
        const testCases = currentProblem.testCases;
        const funcName = currentProblem.functionName;

        terminalOutput.innerHTML = '<div class="term-line term-info">파이썬 채점을 시작합니다...</div>';
        
        let allPassed = true;
        let passCount = 0;

        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            const inputStr = JSON.stringify(tc.input);
            const expectedStr = JSON.stringify(tc.output);
            
            try {
                if (!pyodide) throw new Error("Pyodide가 아직 로드되지 않았습니다.");
                
                const pyCode = `
import json
${code}
__input = json.loads('${inputStr}')
${funcName}(*__input)
`;
                let userOutput = await pyodide.runPythonAsync(pyCode);
                
                // Convert Pyodide proxy to JS object
                if (userOutput && typeof userOutput.toJs === 'function') {
                    userOutput = userOutput.toJs();
                }

                // Check answer
                const userOutputStr = JSON.stringify(userOutput);
                if (userOutputStr === expectedStr) {
                    appendTerminal(`테스트 ${i + 1} 〉 <span class="term-success">통과 (입력: ${inputStr}, 기댓값: ${expectedStr}, 실행결과: ${userOutputStr})</span>`);
                    passCount++;
                } else {
                    appendTerminal(`테스트 ${i + 1} 〉 <span class="term-error">실패 (입력: ${inputStr}, 기댓값: ${expectedStr}, 실행결과: ${userOutputStr})</span>`);
                    allPassed = false;
                }

            } catch (err) {
                appendTerminal(`테스트 ${i + 1} 〉 <span class="term-error">런타임 에러: ${err.message}</span>`);
                allPassed = false;
                break; // Stop execution on error
            }
        }

        appendTerminal('<hr style="border-color:#2e3d4f; margin:10px 0;">');
        if (allPassed) {
            appendTerminal(`<span class="term-success" style="font-weight:600;">🎉 모든 테스트 케이스를 통과했습니다! (${passCount}/${testCases.length})</span>`);
        } else {
            appendTerminal(`<span class="term-error" style="font-weight:600;">❌ 제출한 코드가 일부 테스트 케이스를 통과하지 못했습니다.</span>`);
        }
    });

    function appendTerminal(html) {
        const div = document.createElement('div');
        div.className = 'term-line';
        div.innerHTML = html;
        terminalOutput.appendChild(div);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }
});
