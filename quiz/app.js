document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize UI Elements
    const quizContainer = document.getElementById('quiz-container');
    const submitBtn = document.getElementById('submit-quiz');
    const quizActions = document.getElementById('quiz-actions');
    
    const resultModal = document.getElementById('result-modal');
    const resultText = document.getElementById('result-text');
    const studentNameInput = document.getElementById('student-name');
    const copyResultBtn = document.getElementById('copy-result');
    const closeModalBtn = document.getElementById('close-modal');

    const quizPageTitle = document.getElementById('quiz-page-title');
    const quizPageDesc = document.getElementById('quiz-page-desc');

    let questions = [];
    let scoreText = '';
    let currentWeek = '1';
    let quizTopic = '';

    // Retrieve week parameter
    const urlParams = new URLSearchParams(window.location.search);
    currentWeek = urlParams.get('week') || '1';

    // Set stored student name if exists
    const savedName = localStorage.getItem('student_name');
    if (savedName) {
        studentNameInput.value = savedName;
    }

    // Load Quiz Data
    await loadQuiz(currentWeek);

    async function loadQuiz(week) {
        try {
            let data;
            if (week === 'local') {
                const raw = sessionStorage.getItem('local_week_data');
                if (!raw) throw new Error("가져온 로컬 퀴즈 데이터가 존재하지 않습니다.");
                data = JSON.parse(raw);
            } else {
                const response = await fetch(`../data/week${week}.json?v=${new Date().getTime()}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                data = await response.json();
            }

            questions = data.quiz;
            quizTopic = data.topic;
            
            // UI Title Sync
            quizPageTitle.innerHTML = `AI 실전 퀴즈 — <span>Week ${week === 'local' ? '로컬' : week}</span>`;
            quizPageDesc.textContent = `주제: ${data.topic}`;

            if (!questions || questions.length === 0) {
                throw new Error("퀴즈 문항이 존재하지 않습니다.");
            }

            renderQuiz();
            quizActions.style.display = 'block';

        } catch (err) {
            console.error("Failed to load and parse quiz:", err);
            quizContainer.innerHTML = `
                <div class="card" style="border-color: var(--error); padding: 3rem; text-align: center;">
                    <span style="font-size:3rem; display:block; margin-bottom:1rem;">❌</span>
                    <h3 style="color:var(--error); margin-bottom:10px; font-size:1.4rem;">퀴즈 데이터를 불러오지 못했습니다</h3>
                    <p style="color:var(--text-muted); margin-bottom:1.5rem;">사유: <code>${err.message}</code></p>
                    <a href="../index.html" class="primary-btn" style="text-decoration:none; padding: 0.75rem 2rem; border-radius: 10px; display:inline-block; font-size:0.95rem;">메인으로 돌아가기</a>
                </div>
            `;
        }
    }

    // Heuristic code block formatter inside questions
    function formatQuestionText(text) {
        if (!text) return '';
        
        // Regex to parse backticks ```code```
        const parts = text.split(/```/g);
        let html = '';
        
        parts.forEach((part, index) => {
            if (index % 2 === 1) {
                // Inside code block
                // Determine language if specified (e.g. ```python)
                let code = part.trim();
                if (code.startsWith('python\n') || code.startsWith('py\n')) {
                    code = code.substring(code.indexOf('\n') + 1);
                }
                html += `<pre class="quiz-code-block"><code class="language-python">${escapeHtml(code)}</code></pre>`;
            } else {
                // Normal text (split by newlines to make paragraphs)
                const lines = part.split('\n');
                lines.forEach(line => {
                    if (line.trim()) {
                        html += `<p class="quiz-text-line">${escapeHtml(line)}</p>`;
                    }
                });
            }
        });
        
        return html;
    }

    function escapeHtml(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Render Quiz
    function renderQuiz() {
        quizContainer.innerHTML = '';
        
        questions.forEach((q, qIndex) => {
            const card = document.createElement('div');
            card.className = 'card quiz-card';
            card.id = `question-${qIndex}`;

            // Difficulty Badge
            const diffClass = q.difficulty === '상' ? 'tag-new' : '';
            const diffColor = q.difficulty === '상' ? '#f43f5e' : (q.difficulty === '중' ? '#eab308' : '#10b981');
            const diffBadgeHtml = `<span class="tag" style="background: rgba(255,255,255,0.05); color: ${diffColor}; border: 1px solid ${diffColor}44; font-size: 0.75rem; font-weight:700; margin-bottom:1rem; display:inline-block;">난이도: ${q.difficulty || '하'}</span>`;

            const qText = document.createElement('div');
            qText.className = 'question-text';
            
            // Format statement with code blocks
            let statementHtml = `<h3><strong>${qIndex + 1}. </strong></h3>`;
            statementHtml += formatQuestionText(q.question);
            qText.innerHTML = diffBadgeHtml + statementHtml;
            
            const optionsList = document.createElement('div');
            optionsList.className = 'options-list';

            const markers = ['①', '②', '③', '④', '⑤'];

            q.options.forEach((opt, optIndex) => {
                const label = document.createElement('label');
                label.className = 'option-label';
                
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = `q${qIndex}`;
                radio.value = optIndex;
                radio.style.marginRight = '12px';
                radio.style.display = 'none';

                radio.addEventListener('change', () => {
                    card.querySelectorAll('.option-label').forEach(l => l.classList.remove('selected'));
                    if (radio.checked) label.classList.add('selected');
                });

                label.appendChild(radio);
                
                const markerSpan = document.createElement('span');
                markerSpan.style.fontWeight = 'bold';
                markerSpan.style.marginRight = '8px';
                markerSpan.style.fontSize = '1.05rem';
                markerSpan.textContent = markers[optIndex] || `${optIndex + 1})`;
                label.appendChild(markerSpan);

                label.appendChild(document.createTextNode(opt));
                optionsList.appendChild(label);
            });

            const explanation = document.createElement('div');
            explanation.className = 'explanation';
            explanation.innerHTML = `<strong>💡 AI 오답노트 해설:</strong><br><p style="margin-top:0.5rem; color:#e2e8f0; line-height:1.7;">${q.explanation}</p>`;

            card.appendChild(qText);
            card.appendChild(optionsList);
            card.appendChild(explanation);
            quizContainer.appendChild(card);
        });

        // Run highlight.js
        hljs.highlightAll();
    }

    // Submit Quiz
    submitBtn.addEventListener('click', () => {
        let correctCount = 0;
        let allAnswered = true;

        questions.forEach((q, qIndex) => {
            const card = document.getElementById(`question-${qIndex}`);
            const selected = card.querySelector(`input[name="q${qIndex}"]:checked`);
            
            if (!selected) {
                allAnswered = false;
                card.style.borderColor = 'var(--error)';
                card.style.borderWidth = '2px';
            } else {
                card.style.borderColor = 'var(--glass-border)';
                card.style.borderWidth = '1px';
                
                const selectedIndex = parseInt(selected.value);
                const isCorrect = (selectedIndex === q.answer);

                // Reset statuses
                card.classList.remove('show-explanation');
                card.querySelectorAll('.option-label').forEach(l => {
                    l.style.background = '';
                    l.style.borderColor = '';
                    l.style.color = '';
                });

                const existingBadge = card.querySelector('.status-badge');
                if (existingBadge) existingBadge.remove();

                // Add status badge
                const badge = document.createElement('div');
                badge.className = `status-badge ${isCorrect ? 'badge-correct' : 'badge-incorrect'}`;
                badge.textContent = isCorrect ? '✅ 정답입니다!' : '❌ 틀렸습니다';
                card.insertBefore(badge, card.firstChild);

                // Highlight options
                const optionLabels = card.querySelectorAll('.option-label');
                if (isCorrect) {
                    correctCount++;
                    selected.parentElement.style.background = 'rgba(16, 185, 129, 0.1)';
                    selected.parentElement.style.borderColor = 'var(--success)';
                    selected.parentElement.style.color = '#fff';
                } else {
                    selected.parentElement.style.background = 'rgba(239, 68, 68, 0.1)';
                    selected.parentElement.style.borderColor = 'var(--error)';
                    selected.parentElement.style.color = '#fff';
                    
                    // Show correct answer in green
                    const correctLabel = optionLabels[q.answer];
                    if (correctLabel) {
                        correctLabel.style.background = 'rgba(16, 185, 129, 0.08)';
                        correctLabel.style.borderColor = 'var(--success)';
                        correctLabel.style.color = 'var(--success)';
                    }
                }

                // Show Explanation
                card.classList.add('show-explanation');
            }
        });

        if (!allAnswered) {
            alert('아직 풀지 않은 문제가 있습니다. 모든 문제의 답안을 마킹해 주세요!');
            // Scroll to the first unanswered question
            const firstUnanswered = Array.from(questions).findIndex((q, idx) => !document.querySelector(`input[name="q${idx}"]:checked`));
            if (firstUnanswered !== -1) {
                document.getElementById(`question-${firstUnanswered}`).scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // Record results in Learning Tracker
        LearningTracker.recordQuizResult({
            quizId: `quiz_week_${currentWeek}`,
            score: correctCount,
            total: questions.length
        });

        // Show Score Modal
        const finalScore = Math.round((correctCount / questions.length) * 100);
        scoreText = `${finalScore}점 (${correctCount} / ${questions.length})`;
        resultText.textContent = scoreText;

        resultModal.classList.add('active');
        submitBtn.style.display = 'none'; // Hide submit button
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Close Modal and Reset
    closeModalBtn.addEventListener('click', () => {
        resultModal.classList.remove('active');
        // Let them review the answers, submit remains hidden.
    });

    // Copy Result to Clipboard
    copyResultBtn.addEventListener('click', () => {
        const studentName = studentNameInput.value.trim() || '익명';
        localStorage.setItem('student_name', studentName);
        
        const clipText = `[AI DataEdu Platform 퀴즈 성적 제출]\n주차: Week ${currentWeek === 'local' ? '로컬' : currentWeek}\n주제: ${quizTopic}\n학생: ${studentName}\n최종 점수: ${scoreText}\n제출일시: ${new Date().toLocaleString()}`;
        
        navigator.clipboard.writeText(clipText).then(() => {
            alert('성적이 클립보드에 성공적으로 복사되었습니다! 교수님께 제출하거나 오픈톡방에 업로드하세요.');
        }).catch(err => {
            console.error("Clipboard copy failed:", err);
            alert('복사에 실패했습니다. 결과 값을 직접 드래그 복사해 주세요.');
        });
    });
});
