document.addEventListener('DOMContentLoaded', async () => {
    // 1. Split Layout
    Split(['#split-left', '#split-right'], { sizes: [42, 58], minSize: 300, gutterSize: 6 });

    // 2. UI Elements
    const weekBadge = document.getElementById('week-badge');
    const trackerStats = document.getElementById('tracker-stats');
    const probNumIndicator = document.getElementById('prob-num-indicator');
    const problemNav = document.getElementById('problem-nav');
    const problemTitle = document.getElementById('problem-title');
    const problemInstruction = document.getElementById('problem-instruction');
    const hintBox = document.getElementById('hint-box');
    const hintText = document.getElementById('hint-text');
    const comparisonBox = document.getElementById('comparison-box');
    const correctCodeText = document.getElementById('correct-code-text');
    
    const hintBtn = document.getElementById('hint-btn');
    const showAnswerBtn = document.getElementById('show-answer-btn');
    const resetBtn = document.getElementById('reset-btn');
    const submitBtn = document.getElementById('submit-btn');
    const gradeBadge = document.getElementById('grade-badge');

    // 3. Initialize CodeMirror
    const editor = CodeMirror(document.getElementById('editor-container'), {
        mode: 'python',
        theme: 'dracula',
        lineNumbers: true,
        indentUnit: 4,
        matchBrackets: true,
        autoCloseBrackets: true,
        extraKeys: {
            "Ctrl-Enter": function(cm) {
                submitBtn.click();
            }
        }
    });

    let blankProblems = [];
    let studentSubmissions = []; // Track student's edited code & pass status for each of the 5 questions
    let activeIndex = 0;
    let currentWeek = '1';

    // Retrieve week parameter
    const urlParams = new URLSearchParams(window.location.search);
    currentWeek = urlParams.get('week') || '1';
    weekBadge.textContent = currentWeek === 'local' ? '로컬 주차' : `Week ${currentWeek}`;

    // Load Data
    await loadBlankProblems(currentWeek);

    async function loadBlankProblems(week) {
        try {
            let data;
            if (week === 'local') {
                const raw = sessionStorage.getItem('local_week_data');
                if (!raw) throw new Error("로컬 세션스토리지에 데이터가 없습니다.");
                data = JSON.parse(raw);
            } else {
                const response = await fetch(`../data/week${week}.json?v=${new Date().getTime()}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                data = await response.json();
            }

            blankProblems = data.blank_code;
            if (!blankProblems || blankProblems.length === 0) {
                throw new Error("빈칸 채우기 문제가 제공되지 않았습니다.");
            }

            // Initialize Student submissions cache
            studentSubmissions = blankProblems.map(p => ({
                code: p.code, // Initial code template
                passed: false,
                attempts: 0
            }));

            // Sync Nav Buttons Click
            document.querySelectorAll('.prob-nav-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    saveCurrentProgress();
                    const idx = parseInt(btn.dataset.index);
                    selectProblem(idx);
                });
            });

            selectProblem(0);
            updateGlobalTrackerStats();

        } catch (err) {
            console.error("Failed to load blank codes:", err);
            problemTitle.textContent = "실습 로드 실패";
            problemInstruction.innerHTML = `<span style="color:var(--error);">사유: ${err.message}</span>`;
            editor.setValue("# 실습 로드 도중 치명적인 오류가 발생했습니다.");
            submitBtn.disabled = true;
        }
    }

    // Save student's typing in the CodeMirror editor to our local memory cache
    function saveCurrentProgress() {
        if (blankProblems.length === 0) return;
        studentSubmissions[activeIndex].code = editor.getValue();
    }

    // Select Active Problem
    function selectProblem(index) {
        activeIndex = index;
        const prob = blankProblems[index];
        const sub = studentSubmissions[index];

        // Nav Active sync
        document.querySelectorAll('.prob-nav-btn').forEach((btn, idx) => {
            btn.classList.remove('active');
            if (idx === index) btn.classList.add('active');
            
            // Passed sync
            btn.classList.remove('passed');
            if (studentSubmissions[idx].passed) btn.classList.add('passed');
        });

        // Left Panel Sync
        probNumIndicator.textContent = `Q${index + 1} / ${blankProblems.length}`;
        problemTitle.textContent = `실습 ${index + 1} 단원`;
        problemInstruction.textContent = prob.description;
        hintText.textContent = prob.hint;
        correctCodeText.textContent = prob.answer;

        // Hide boxes
        hintBox.style.display = 'none';
        comparisonBox.style.display = 'none';

        // Editor Sync
        editor.setValue(sub.code);
        
        // Sync grading badge
        if (sub.passed) {
            setGradeBadge('통과 ✅', 'var(--success)');
            showAnswerBtn.disabled = false;
        } else if (sub.attempts > 0) {
            setGradeBadge('실패 ❌', 'var(--error)');
            showAnswerBtn.disabled = false; // Allow struggling students to see answer
        } else {
            setGradeBadge('미제출', 'var(--text-muted)');
            showAnswerBtn.disabled = true;
        }
    }

    function setGradeBadge(text, color) {
        gradeBadge.textContent = text;
        gradeBadge.style.color = color;
        gradeBadge.style.borderColor = color + '44';
        gradeBadge.style.background = color + '15';
    }

    function updateGlobalTrackerStats() {
        const passedCount = studentSubmissions.filter(s => s.passed).length;
        trackerStats.textContent = `실습 완료: ${passedCount} / ${blankProblems.length}`;
    }

    // Normalized code comparison (whitespaces, single line comments, tabs and carriage returns are stripped)
    function normalizeCode(code) {
        return code
            .replace(/#.*$/gm, '') // Strip comments
            .replace(/\s+/g, '')   // Strip all whitespaces, tabs, newlines
            .trim();
    }

    // Submit and Check Answer
    submitBtn.addEventListener('click', () => {
        if (blankProblems.length === 0) return;

        const currentCode = editor.getValue();
        const correctCode = blankProblems[activeIndex].answer;
        const sub = studentSubmissions[activeIndex];

        sub.code = currentCode;
        sub.attempts++;

        const normCurrent = normalizeCode(currentCode);
        const normCorrect = normalizeCode(correctCode);

        // Heuristic fallback: check if they replaced ___
        if (currentCode.includes('___')) {
            alert('아직 빈칸(___)이 채워지지 않았습니다! 코드를 완성하여 제출하세요.');
            return;
        }

        if (normCurrent === normCorrect) {
            sub.passed = true;
            setGradeBadge('통과 ✅', 'var(--success)');
            document.querySelector(`.prob-nav-btn[data-index="${activeIndex}"]`).classList.add('passed');
            showAnswerBtn.disabled = false;
            
            // Visual success effect
            editor.getWrapperElement().style.transition = 'box-shadow 0.3s';
            editor.getWrapperElement().style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.4)';
            setTimeout(() => {
                editor.getWrapperElement().style.boxShadow = '';
            }, 1000);

            // Record Stats
            updateGlobalTrackerStats();
            checkAllCompleted();

        } else {
            sub.passed = false;
            setGradeBadge('실패 ❌', 'var(--error)');
            showAnswerBtn.disabled = false; // Allow struggling students to see the answer

            editor.getWrapperElement().style.transition = 'box-shadow 0.3s';
            editor.getWrapperElement().style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.4)';
            setTimeout(() => {
                editor.getWrapperElement().style.boxShadow = '';
            }, 1000);
            
            alert('작성한 코드가 정답과 다릅니다. 빈칸 주변 문법 및 힌트를 참고하세요!');
        }
    });

    // Reset code
    resetBtn.addEventListener('click', () => {
        if (confirm('현재 문제의 코드를 초기 템플릿(빈칸 포함)으로 복구하겠습니까?')) {
            editor.setValue(blankProblems[activeIndex].code);
            studentSubmissions[activeIndex].code = blankProblems[activeIndex].code;
            studentSubmissions[activeIndex].passed = false;
            setGradeBadge('미제출', 'var(--text-muted)');
            document.querySelector(`.prob-nav-btn[data-index="${activeIndex}"]`).classList.remove('passed');
            updateGlobalTrackerStats();
        }
    });

    // Toggle Hint Box
    hintBtn.addEventListener('click', () => {
        if (hintBox.style.display === 'block') {
            hintBox.style.display = 'none';
        } else {
            hintBox.style.display = 'block';
            hintBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });

    // Toggle Answer Comparison Box
    showAnswerBtn.addEventListener('click', () => {
        if (comparisonBox.style.display === 'block') {
            comparisonBox.style.display = 'none';
        } else {
            comparisonBox.style.display = 'block';
            comparisonBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });

    // Check if all 5 coding exercises are passed
    function checkAllCompleted() {
        const allDone = studentSubmissions.every(s => s.passed);
        if (allDone) {
            // Record to LearningTracker
            LearningTracker.recordCodingSubmit({
                problemId: `blank_week_${currentWeek}`,
                passed: blankProblems.length,
                total: blankProblems.length
            });
            
            setTimeout(() => {
                alert("🎉 축하합니다! 이번 주차의 5가지 빈칸 코드 실습을 완벽하게 올 패스 하셨습니다! 대시보드에 성공 실적이 연동되었습니다.");
            }, 300);
        }
    }
});
