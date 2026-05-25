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

    let codingProblems = [];
    let currentProblem = null;
    let pyodide = null;
    let currentWeek = '1';
    let passedProblemsCount = 0;

    // Retrieve week parameter
    const urlParams = new URLSearchParams(window.location.search);
    currentWeek = urlParams.get('week') || '1';

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

    // 6. Load problems from Week JSON
    await loadProblems(currentWeek);

    async function loadProblems(week) {
        try {
            let data;
            if (week === 'local') {
                const raw = sessionStorage.getItem('local_week_data');
                if (!raw) throw new Error("로컬 세션 데이터를 찾을 수 없습니다.");
                data = JSON.parse(raw);
            } else {
                const response = await fetch(`../data/week${week}.json?v=${new Date().getTime()}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                data = await response.json();
            }

            codingProblems = data.coding_test;
            if (!codingProblems || codingProblems.length === 0) {
                throw new Error("코딩 테스트 문제가 포함되어 있지 않습니다.");
            }

            problemSelect.innerHTML = '';
            codingProblems.forEach((p, idx) => {
                const option = document.createElement('option');
                option.value = idx;
                option.textContent = p.title;
                problemSelect.appendChild(option);
            });

            selectProblem(0);
            terminalOutput.innerHTML = '<div class="term-line">문제가 성공적으로 로드되었습니다. 파이썬 코드를 작성해 보세요.</div>';

        } catch (err) {
            console.error("Failed to load coding tests:", err);
            probTitle.textContent = "문제 로드 실패";
            probDesc.innerHTML = `
                <h3 style="color:var(--error); margin-bottom:10px;">코딩 테스트 데이터 로드 실패</h3>
                <p style="color:var(--text-secondary);">사유: <code>${err.message}</code></p>
                <hr style="border-color:#2e3d4f; margin:15px 0;">
                <a href="../index.html" class="primary-btn" style="text-decoration:none; padding: 0.5rem 2.5rem; border-radius:10px; display:inline-block;">메인으로 이동</a>
            `;
        }
    }

    function selectProblem(index) {
        const prob = codingProblems[index];
        if (!prob) return;

        probTitle.textContent = prob.title;
        
        let descHtml = `<h3><strong>${prob.title}</strong></h3><br>`;
        descHtml += `<p style="line-height:1.75; color:#cbd5e1; white-space:pre-line;">${prob.description}</p><br>`;
        descHtml += `<div style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius:12px; padding: 1.25rem; margin-top: 1rem;">`;
        descHtml += `<p style="margin-bottom:0.5rem;"><strong>입력 예시:</strong> <code>${prob.example_input}</code></p>`;
        descHtml += `<p style="margin:0;"><strong>출력 예시:</strong> <code>${prob.example_output}</code></p>`;
        descHtml += `</div>`;

        probDesc.innerHTML = descHtml;

        // Custom starting template based on parameters
        const templateCode = `# 아래 solution 함수의 매개변수를 문제 조건에 맞게 선언하여 구현하세요.
# 예: 입력이 2개인 경우 -> def solution(nums, target):
# 예: 입력이 1개인 경우 -> def solution(nums):
def solution(*args):
    # 여기에 코드를 작성하세요.
    return
`;

        currentProblem = {
            id: `coding_week_${currentWeek}_q_${index}`,
            title: prob.title,
            initialCode: templateCode,
            testCases: prob.test_cases
        };

        editor.setValue(currentProblem.initialCode);
        
        editorFilename.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="file-icon" style="color: #38bdf8;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            solution.py
        `;

        problemSelect.value = index;
        updateRunButtonState();
    }

    function setInitialCode() {
        if (!currentProblem) return;
        editor.setValue(currentProblem.initialCode);
        updateRunButtonState();
    }

    // Event Handlers
    problemSelect.addEventListener('change', (e) => selectProblem(parseInt(e.target.value)));
    
    themeSelect.addEventListener('change', (e) => {
        editor.setOption('theme', e.target.value);
    });

    resetBtn.addEventListener('click', () => {
        if (confirm("정말로 코드를 초기 템플릿 상태로 되돌리시겠습니까?")) {
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

        terminalOutput.innerHTML = '<div class="term-line term-info">파이썬 채점 런타임 가동 중...</div>';
        
        let allPassed = true;
        let passCount = 0;

        // Clean & extract exact function name to invoke
        const funcMatch = code.match(/def\s+(\w+)\s*\(/);
        const funcName = funcMatch ? funcMatch[1] : 'solution';

        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            const inputStr = tc.input;
            const expectedStr = tc.output.trim();
            
            try {
                if (!pyodide) throw new Error("Pyodide 파이썬 인터프리터가 아직 가동되지 않았습니다.");
                
                // Construct safe sandboxed execution script
                // We parse inputStr which is a double-array encoded string e.g. "[[2, 7, 11, 15], 9]"
                const pyCode = `
import json
${code}
__input = json.loads('${inputStr}')
__res = ${funcName}(*__input)
json.dumps(__res)
`;
                let userOutputJson = await pyodide.runPythonAsync(pyCode);
                
                // Compare values
                const userOutputClean = userOutputJson ? userOutputJson.trim() : 'null';
                
                // Standardize expected string in case of single/double quotes differences
                let expectedClean = expectedStr;
                try {
                    // Try to parse both to JSON objects to compare structurally to prevent formatting fail
                    const userObj = JSON.parse(userOutputClean);
                    const expectedObj = JSON.parse(expectedStr);
                    
                    if (JSON.stringify(userObj) === JSON.stringify(expectedObj)) {
                        appendTerminal(`테스트 ${i + 1} 〉 <span class="term-success">통과 (입력: ${inputStr}, 기댓값: ${expectedStr}, 실행결과: ${userOutputClean})</span>`);
                        passCount++;
                    } else {
                        appendTerminal(`테스트 ${i + 1} 〉 <span class="term-error">실패 (입력: ${inputStr}, 기댓값: ${expectedStr}, 실행결과: ${userOutputClean})</span>`);
                        allPassed = false;
                    }
                } catch (jsonErr) {
                    // Fallback to basic string compare
                    if (userOutputClean === expectedClean) {
                        appendTerminal(`테스트 ${i + 1} 〉 <span class="term-success">통과 (입력: ${inputStr}, 기댓값: ${expectedStr})</span>`);
                        passCount++;
                    } else {
                        appendTerminal(`테스트 ${i + 1} 〉 <span class="term-error">실패 (입력: ${inputStr}, 기댓값: ${expectedStr}, 실행결과: ${userOutputClean})</span>`);
                        allPassed = false;
                    }
                }

            } catch (err) {
                appendTerminal(`테스트 ${i + 1} 〉 <span class="term-error">런타임 에러: ${err.message}</span>`);
                allPassed = false;
                break; // Stop running further tests on exception
            }
        }

        appendTerminal('<hr style="border-color:rgba(255,255,255,0.08); margin:10px 0;">');
        if (allPassed) {
            appendTerminal(`<span class="term-success" style="font-weight:600;">🎉 모든 테스트 케이스를 통과했습니다! (${passCount}/${testCases.length})</span>`);
            
            // Record coding submit success to local learning tracker
            LearningTracker.recordCodingSubmit({
                problemId: currentProblem.id,
                passed: passCount,
                total: testCases.length
            });
            
        } else {
            appendTerminal(`<span class="term-error" style="font-weight:600;">❌ 제출한 코드가 일부 테스트케이스를 통과하지 못했습니다. (${passCount}/${testCases.length})</span>`);
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
