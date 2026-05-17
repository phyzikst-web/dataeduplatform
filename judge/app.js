document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize Layout (Split.js)
    Split(['#split-left', '#split-right'], { sizes: [40, 60], minSize: 300, gutterSize: 8 });
    Split(['#editor-pane', '#terminal-pane'], { direction: 'vertical', sizes: [60, 40], minSize: 150, gutterSize: 8 });

    // 2. Initialize UI Elements
    const problemSelect = document.getElementById('problem-select');
    const langSelect = document.getElementById('lang-select');
    const probTitle = document.getElementById('prob-title');
    const probDesc = document.getElementById('prob-desc');
    const runBtn = document.getElementById('run-btn');
    const resetBtn = document.getElementById('reset-code-btn');
    const terminalOutput = document.getElementById('terminal-output');
    const pyodideStatus = document.getElementById('pyodide-status');

    // 3. Initialize CodeMirror
    const editor = CodeMirror(document.getElementById('editor-container'), {
        mode: 'python',
        theme: 'monokai',
        lineNumbers: true,
        indentUnit: 4,
        matchBrackets: true,
        autoCloseBrackets: true
    });

    let problems = [];
    let currentProblem = null;
    let pyodide = null;

    // 4. Load Pyodide (Python Engine)
    try {
        pyodide = await loadPyodide();
        pyodideStatus.textContent = '[시스템] 파이썬 엔진 초기화 완료. 코드를 실행할 수 있습니다.';
        pyodideStatus.style.color = '#10b981';
    } catch (err) {
        pyodideStatus.textContent = '[시스템 오류] 파이썬 엔진을 로드하지 못했습니다. 인터넷 연결을 확인하세요.';
        pyodideStatus.style.color = '#ef4444';
    }

    // 5. Load Problems
    try {
        const response = await fetch('problems.json');
        problems = await response.json();
        
        problemSelect.innerHTML = '';
        problems.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.title;
            problemSelect.appendChild(option);
        });

        if (problems.length > 0) loadProblem(problems[0].id);
    } catch (err) {
        probTitle.textContent = "문제 로드 실패";
        probDesc.innerHTML = `<p style="color:red;">problems.json 파일을 불러오지 못했습니다. 로컬 서버(Live Server)에서 실행 중인지 확인하세요.</p>`;
    }

    function loadProblem(id) {
        currentProblem = problems.find(p => p.id === id);
        if (!currentProblem) return;

        probTitle.textContent = currentProblem.title;
        probDesc.innerHTML = currentProblem.description;
        setInitialCode();
        terminalOutput.innerHTML = '<div class="term-line">결과가 이곳에 표시됩니다.</div>';
    }

    function setInitialCode() {
        const lang = langSelect.value;
        if (lang === 'python') editor.setOption('mode', 'python');
        if (lang === 'javascript') editor.setOption('mode', 'javascript');
        editor.setValue(currentProblem.initialCode[lang] || '');
    }

    // Events
    problemSelect.addEventListener('change', (e) => loadProblem(e.target.value));
    langSelect.addEventListener('change', setInitialCode);
    resetBtn.addEventListener('click', setInitialCode);

    // 6. Execution Engine Sandbox
    runBtn.addEventListener('click', async () => {
        if (!currentProblem) return;
        const code = editor.getValue();
        const lang = langSelect.value;
        const testCases = currentProblem.testCases;
        const funcName = currentProblem.functionName;

        terminalOutput.innerHTML = '<div class="term-info">채점을 시작합니다...</div>';
        
        let allPassed = true;
        let passCount = 0;

        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            const inputStr = JSON.stringify(tc.input);
            const expectedStr = JSON.stringify(tc.output);
            
            try {
                let userOutput;
                
                if (lang === 'javascript') {
                    // Sandbox using new Function
                    // Wrap the code and call the function with the input array spread
                    const executeCode = new Function(`
                        ${code}
                        return ${funcName}(...${inputStr});
                    `);
                    userOutput = executeCode();
                } else if (lang === 'python') {
                    if (!pyodide) throw new Error("Pyodide가 아직 로드되지 않았습니다.");
                    // In Python, we append the function call logic to capture the return
                    // inputStr is a JSON array, e.g. [3, 4], so we format it as args `*json.loads('[3, 4]')`
                    const pyCode = `
import json
${code}
__input = json.loads('${inputStr}')
${funcName}(*__input)
`;
                    userOutput = await pyodide.runPythonAsync(pyCode);
                    // Convert Pyodide proxy to JS object if needed
                    if (userOutput && typeof userOutput.toJs === 'function') {
                        userOutput = userOutput.toJs();
                    }
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
                break; // Stop executing further cases on error
            }
        }

        appendTerminal('<hr style="border-color:#333; margin:10px 0;">');
        if (allPassed) {
            appendTerminal(`<span class="term-success">🎉 모든 테스트 케이스를 통과했습니다! (${passCount}/${testCases.length})</span>`);
        } else {
            appendTerminal(`<span class="term-error">❌ 제출한 코드가 일부 테스트 케이스를 통과하지 못했습니다.</span>`);
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
