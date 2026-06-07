document.addEventListener('DOMContentLoaded', async () => {
    // 1. Layout Initialization
    Split(['#split-left', '#split-right'], {
        sizes: [40, 60],
        minSize: [300, 400],
        gutterSize: 8,
    });

    Split(['#editor-pane', '#terminal-pane'], {
        direction: 'vertical',
        sizes: [70, 30],
        minSize: [200, 100],
        gutterSize: 8,
    });

    // 2. Editor Initialization
    const editor = CodeMirror(document.getElementById('editor-container'), {
        mode: 'javascript',
        theme: 'dracula',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 4,
        tabSize: 4,
        lineWrapping: true,
        value: '// 문제를 선택해주세요.\n'
    });

    // 3. UI Elements
    const problemSelect = document.getElementById('problem-select');
    const themeSelect = document.getElementById('theme-select');
    const resetBtn = document.getElementById('reset-code-btn');
    const runBtn = document.getElementById('run-btn');
    const clearTerminalBtn = document.getElementById('clear-terminal');
    const terminalOutput = document.getElementById('terminal-output');
    
    const probTitle = document.getElementById('prob-title');
    const probDesc = document.getElementById('prob-desc');
    const editorFilename = document.getElementById('editor-filename');

    let currentProblem = null;

    // Helper: Append to Terminal
    function appendTerminal(htmlMsg) {
        const line = document.createElement('div');
        line.className = 'term-line';
        line.innerHTML = htmlMsg;
        terminalOutput.appendChild(line);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    function updateRunButtonState() {
        if (!currentProblem) {
            runBtn.disabled = true;
            runBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <span>준비 중...</span>
            `;
        } else {
            runBtn.disabled = false;
            runBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <span>코드 실행 및 채점 (Ctrl+Enter)</span>
            `;
        }
    }

    // 4. Load Problems
    function loadProblems() {
        try {
            if (typeof JS_PROBLEMS === 'undefined' || JS_PROBLEMS.length === 0) {
                throw new Error("문제 데이터를 찾을 수 없습니다. (problems.js 확인 필요)");
            }

            problemSelect.innerHTML = '<option value="" disabled selected>문제를 선택하세요</option>';
            JS_PROBLEMS.forEach((prob, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = prob.title;
                problemSelect.appendChild(option);
            });

            probTitle.textContent = "문제 선택 대기 중";
            updateRunButtonState();

            // 첫 번째 문제 자동 선택 (옵션)
            if (JS_PROBLEMS.length > 0) {
                selectProblem(0);
            }

        } catch (err) {
            console.error("문제 로드 에러:", err);
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
        const prob = JS_PROBLEMS[index];
        if (!prob) return;

        probTitle.textContent = prob.title;
        
        let descHtml = `<h3><strong>${prob.title}</strong></h3><br>`;
        descHtml += `<p style="line-height:1.75; color:#cbd5e1; white-space:pre-line;">${prob.description}</p><br>`;
        descHtml += `<div style="background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius:12px; padding: 1.25rem; margin-top: 1rem;">`;
        descHtml += `<p style="margin-bottom:0.5rem;"><strong>입력 예시:</strong> <code>${prob.example_input}</code></p>`;
        descHtml += `<p style="margin:0;"><strong>출력 예시:</strong> <code>${prob.example_output}</code></p>`;
        descHtml += `</div>`;

        probDesc.innerHTML = descHtml;

        // JS Template Code
        const templateCode = `// 아래 solution 함수의 매개변수를 문제 조건에 맞게 선언하여 구현하세요.
// 예: 입력이 배열인 경우 -> function solution(arr) { ... }
function solution(arr) {
    // 여기에 코드를 작성하세요.
    return;
}
`;

        currentProblem = {
            id: prob.id,
            title: prob.title,
            initialCode: templateCode,
            testCases: prob.test_cases
        };

        editor.setValue(currentProblem.initialCode);
        
        editorFilename.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="file-icon" style="color: #f7df1e;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            solution.js
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

    // 5. Execution Engine Sandbox (JavaScript via new Function)
    runBtn.addEventListener('click', () => {
        if (!currentProblem) return;
        const code = editor.getValue();
        const testCases = currentProblem.testCases;

        terminalOutput.innerHTML = '<div class="term-line term-info">자바스크립트 채점 시작...</div>';
        
        let allPassed = true;
        let passCount = 0;

        // Clean & extract exact function name to invoke
        const funcMatch = code.match(/function\s+(\w+)\s*\(/) || code.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\()/);
        const funcName = funcMatch ? funcMatch[1] : 'solution';

        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            const inputStr = tc.input;
            const expectedStr = tc.output.trim();
            
            try {
                // Parse input arguments. Assumes inputStr is JSON array or parseable primitive
                let parsedInput;
                try {
                    parsedInput = JSON.parse(inputStr);
                } catch (e) {
                    parsedInput = eval('(' + inputStr + ')'); // Fallback for simple values if not strict JSON
                }

                // If parsedInput is not an array (e.g., single primitive), wrap it in array for apply
                if (!Array.isArray(parsedInput)) {
                    parsedInput = [parsedInput];
                }

                // Create sandbox wrapper function
                // It injects the user code, then calls the function with apply
                const wrapperBody = `
                    ${code}
                    if (typeof ${funcName} !== 'function') {
                        throw new Error("함수 '${funcName}' 를 찾을 수 없거나 함수가 아닙니다.");
                    }
                    return ${funcName}.apply(null, args);
                `;

                // Execute!
                const runTest = new Function('args', wrapperBody);
                const userResult = runTest(parsedInput);
                
                // Compare values
                const userOutputStr = JSON.stringify(userResult);
                
                // Prepare expected object for deep comparison
                let expectedObj;
                try {
                    expectedObj = JSON.parse(expectedStr);
                } catch (e) {
                    expectedObj = eval('(' + expectedStr + ')');
                }

                const expectedOutputStr = JSON.stringify(expectedObj);

                if (userOutputStr === expectedOutputStr) {
                    appendTerminal(`테스트 ${i + 1} 〉 <span class="term-success">통과 (입력: ${inputStr}, 기댓값: ${expectedStr}, 실행결과: ${userOutputStr})</span>`);
                    passCount++;
                } else {
                    appendTerminal(`테스트 ${i + 1} 〉 <span class="term-error">실패 (입력: ${inputStr}, 기댓값: ${expectedStr}, 실행결과: ${userOutputStr})</span>`);
                    allPassed = false;
                }

            } catch (err) {
                appendTerminal(`테스트 ${i + 1} 〉 <span class="term-error">런타임 에러: ${err.message}</span>`);
                allPassed = false;
                break; // Stop running further tests on exception
            }
        }

        if (allPassed) {
            appendTerminal('<div class="term-line term-success" style="margin-top:10px; font-weight:bold;">🎉 모든 테스트 케이스를 통과했습니다! (정답)</div>');
            
            if (window.LearningTracker) {
                window.LearningTracker.trackProgress('html5-judge', currentProblem.id, 100);
            }
        } else {
            appendTerminal(`<div class="term-line term-error" style="margin-top:10px; font-weight:bold;">❌ 테스트 실패. (${passCount} / ${testCases.length} 통과)</div>`);
        }
    });

    // Run Init
    loadProblems();
});
