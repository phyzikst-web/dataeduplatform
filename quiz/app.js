document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize UI Elements
    const quizSelect = document.getElementById('quiz-select');
    const quizContainer = document.getElementById('quiz-container');
    const submitBtn = document.getElementById('submit-quiz');
    
    const resultModal = document.getElementById('result-modal');
    const resultText = document.getElementById('result-text');
    const studentNameInput = document.getElementById('student-name');
    const copyResultBtn = document.getElementById('copy-result');
    const closeModalBtn = document.getElementById('close-modal');

    let questions = [];
    let scoreText = '';

    // 2. Load Quizzes list from questions.js
    if (typeof QUIZZES !== 'undefined' && QUIZZES.length > 0) {
        quizSelect.innerHTML = '';
        
        // Add placeholder option
        const placeholderOpt = document.createElement('option');
        placeholderOpt.value = "";
        placeholderOpt.textContent = "퀴즈를 선택해 주세요";
        placeholderOpt.disabled = true;
        placeholderOpt.selected = true;
        quizSelect.appendChild(placeholderOpt);

        QUIZZES.forEach(q => {
            const option = document.createElement('option');
            option.value = q.id;
            option.textContent = q.title;
            quizSelect.appendChild(option);
        });

        // Load the first quiz by default
        loadQuiz(QUIZZES[0].id);
    } else {
        quizContainer.innerHTML = '<div style="text-align:center; color:#ef4444;">questions.js 파일을 로드하지 못했거나 퀴즈 목록이 비어 있습니다.</div>';
    }

    // 3. Load Quiz DOCX File and Parse
    async function loadQuiz(id) {
        const quizMeta = QUIZZES.find(q => q.id === id);
        if (!quizMeta) return;

        // Reset submit button and container
        submitBtn.style.display = 'inline-block';
        quizContainer.innerHTML = `<div class="quiz-card" style="text-align:center;"><p style="color:var(--accent);">워드 파일(${quizMeta.filepath})을 읽고 퀴즈를 빌드하는 중...</p></div>`;

        try {
            // Fetch hosted Word (.docx) file as arraybuffer
            const response = await fetch(quizMeta.filepath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const arrayBuffer = await response.arrayBuffer();
            
            // Extract raw text using Mammoth.js
            const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            const text = result.value;

            // Parse text into questions array
            questions = parseDocxQuiz(text);
            
            if (questions.length === 0) {
                throw new Error("워드 파일에서 퀴즈 문제를 해석하지 못했습니다. 형식을 확인해 주세요.");
            }

            // Sync select menu
            quizSelect.value = id;
            renderQuiz();

        } catch (err) {
            console.error("Failed to load and parse quiz docx:", err);
            quizContainer.innerHTML = `
                <div class="quiz-card" style="border-color: var(--error);">
                    <h3 style="color:var(--error); margin-bottom:10px;">퀴즈 로드 및 빌드 실패</h3>
                    <p style="color:var(--text-secondary);">경로: <code>${quizMeta.filepath}</code></p>
                    <hr style="border-color:var(--border-color); margin:15px 0;">
                    <p><strong>원인 가능성:</strong></p>
                    <ol style="margin-left: 20px; line-height: 1.6; color: var(--text-secondary);">
                        <li>해당 경로에 실제 워드 파일(.docx)이 존재하지 않는 경우</li>
                        <li>웹서버(Live Server 등)가 실행 중이지 않고 단순 더블클릭(file://)하여 로컬 파일을 차단당한 경우 (브라우저 CORS 제한)</li>
                        <li>워드 파일 내 문제 형태(번호 매기기, 선택지 기호 등)가 파서 형식과 불일치하는 경우</li>
                    </ol>
                </div>
            `;
        }
    }

    // 4. Robust DOCX parser
    function parseDocxQuiz(text) {
        // Clean and normalize text
        const cleanText = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
        
        // Regex to match question start (e.g. "1. ", "10. ") at the beginning of a line
        const questionRegex = /(?:^|\n)\s*(\d+)\.\s+/g;
        const parsedQuestions = [];
        
        // Find indices of all question numbers
        let match;
        const questionIndices = [];
        while ((match = questionRegex.exec(cleanText)) !== null) {
            questionIndices.push({
                index: match.index,
                number: match[1],
                matchedText: match[0]
            });
        }
        
        if (questionIndices.length === 0) {
            return [];
        }
        
        for (let i = 0; i < questionIndices.length; i++) {
            const start = questionIndices[i].index + questionIndices[i].matchedText.length;
            const end = (i + 1 < questionIndices.length) ? questionIndices[i + 1].index : cleanText.length;
            
            const questionBlock = cleanText.substring(start, end).trim();
            const questionLines = questionBlock.split('\n').map(l => l.trim()).filter(Boolean);
            
            if (questionLines.length < 2) continue;
            
            let questionStatement = "";
            let options = [];
            let answerIndex = -1;
            let explanation = "";
            let isParsingOptions = false;
            let answerString = "";
            
            for (let line of questionLines) {
                // Check if it's correct answer line
                if (line.startsWith('정답:')) {
                    const parts = line.split('|');
                    answerString = parts[0].substring(3).trim();
                    if (parts[1] && parts[1].trim().startsWith('해설:')) {
                        explanation = parts[1].substring(parts[1].indexOf('해설:') + 3).trim();
                    }
                    
                    const circles = ['①', '②', '③', '④', '⑤'];
                    const idxCircle = circles.findIndex(c => answerString.includes(c));
                    if (idxCircle !== -1) {
                        answerIndex = idxCircle;
                    } else if (answerString.toUpperCase() === 'O' || answerString.includes('O') || answerString.includes('o')) {
                        answerIndex = 0;
                    } else if (answerString.toUpperCase() === 'X' || answerString.includes('X') || answerString.includes('x')) {
                        answerIndex = 1;
                    } else {
                        // Extract digits
                        const matchDigit = answerString.match(/(\d+)/);
                        if (matchDigit) {
                            answerIndex = parseInt(matchDigit[1]) - 1;
                        }
                    }
                    continue;
                }
                
                // Check if it's explanation line
                if (line.startsWith('해설:')) {
                    explanation = line.substring(3).trim();
                    continue;
                }
                
                // Check option marker patterns (①, 1), A), etc.)
                const optionRegex = /^[①②③④⑤]|^[12345]\)|^[A-E]\)/i;
                if (optionRegex.test(line)) {
                    isParsingOptions = true;
                    const cleanOption = line.replace(/^[①②③④⑤]|^[12345]\)|^([A-E])\)/, '').trim();
                    options.push(cleanOption);
                } else {
                    if (!isParsingOptions) {
                        if (questionStatement) questionStatement += "\n";
                        questionStatement += line;
                    } else {
                        if (explanation) explanation += " " + line;
                        else explanation = line;
                    }
                }
            }
            
            // Auto detect OX question type
            if (options.length === 0 && (answerIndex === 0 || answerIndex === 1)) {
                options = ["O", "X"];
            }
            
            if (questionStatement && options.length > 0 && answerIndex !== -1) {
                parsedQuestions.push({
                    question: questionStatement,
                    options: options,
                    answerIndex: answerIndex,
                    explanation: explanation || "상세 해설이 없습니다."
                });
            }
        }
        
        return parsedQuestions;
    }

    // 5. Render Quiz to UI
    function renderQuiz() {
        quizContainer.innerHTML = '';
        questions.forEach((q, qIndex) => {
            const card = document.createElement('div');
            card.className = 'quiz-card';
            card.id = `question-${qIndex}`;

            const qText = document.createElement('div');
            qText.className = 'question-text';
            
            // Advanced heuristic syntax highlighter for code snippets in question texts
            const lines = q.question.split('\n');
            let questionHtml = '';
            let inCode = false;
            let codeLines = [];

            lines.forEach((line, lineIdx) => {
                const trimmed = line.trim();
                const isCodeLine = trimmed.startsWith('def ') || 
                                   trimmed.startsWith('while ') || 
                                   trimmed.startsWith('for ') || 
                                   trimmed.startsWith('if ') || 
                                   trimmed.startsWith('elif ') ||
                                   trimmed.startsWith('else:') || 
                                   trimmed.startsWith('return ') || 
                                   trimmed.startsWith('skip =') || 
                                   trimmed.startsWith('skip[') ||
                                   trimmed.startsWith('pt =') || 
                                   trimmed.startsWith('pp =') || 
                                   trimmed.startsWith('pt +=') || 
                                   trimmed.startsWith('txt =') ||
                                   trimmed.startsWith('# ') ||
                                   line.startsWith('    ') || 
                                   line.startsWith('\t');
                                   
                if (isCodeLine) {
                    if (!inCode) {
                        inCode = true;
                        codeLines = [];
                    }
                    codeLines.push(line);
                } else {
                    if (inCode) {
                        questionHtml += `<pre class="quiz-code-block"><code>${codeLines.join('\n')}</code></pre>`;
                        inCode = false;
                    }
                    if (lineIdx === 0) {
                        questionHtml += `<p class="quiz-text-line"><strong>${qIndex + 1}. ${line}</strong></p>`;
                    } else {
                        questionHtml += `<p class="quiz-text-line">${line}</p>`;
                    }
                }
            });
            if (inCode) {
                questionHtml += `<pre class="quiz-code-block"><code>${codeLines.join('\n')}</code></pre>`;
            }
            
            qText.innerHTML = questionHtml;
            
            const optionsList = document.createElement('div');
            optionsList.className = 'options-list';

            // Option markers for styling
            const markers = ['①', '②', '③', '④', '⑤'];

            q.options.forEach((opt, optIndex) => {
                const label = document.createElement('label');
                label.className = 'option-label';
                
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = `q${qIndex}`;
                radio.value = optIndex;
                radio.style.marginRight = '12px';

                radio.addEventListener('change', () => {
                    card.querySelectorAll('.option-label').forEach(l => l.classList.remove('selected'));
                    if (radio.checked) label.classList.add('selected');
                });

                label.appendChild(radio);
                
                const markerSpan = document.createElement('span');
                markerSpan.style.fontWeight = 'bold';
                markerSpan.style.marginRight = '8px';
                markerSpan.textContent = markers[optIndex] || `${optIndex + 1})`;
                label.appendChild(markerSpan);

                label.appendChild(document.createTextNode(opt));
                optionsList.appendChild(label);
            });

            const explanation = document.createElement('div');
            explanation.className = 'explanation';
            explanation.innerHTML = `<strong>해설:</strong> ${q.explanation}`;

            card.appendChild(qText);
            card.appendChild(optionsList);
            card.appendChild(explanation);
            quizContainer.appendChild(card);
        });
    }

    // 6. Submit and Score Quiz
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
                card.style.borderColor = 'var(--border-color)';
                card.style.borderWidth = '1px';
                
                const selectedIndex = parseInt(selected.value);
                const isCorrect = (selectedIndex === q.answerIndex);

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
                badge.textContent = isCorrect ? '✅ 정답' : '❌ 오답';
                card.insertBefore(badge, card.firstChild);

                // Highlight answers
                if (isCorrect) {
                    correctCount++;
                    selected.parentElement.style.background = '#ecfdf5';
                    selected.parentElement.style.borderColor = 'var(--success)';
                    selected.parentElement.style.color = 'var(--success)';
                } else {
                    selected.parentElement.style.background = '#fef2f2';
                    selected.parentElement.style.borderColor = 'var(--error)';
                    selected.parentElement.style.color = 'var(--error)';
                    
                    // Show correct answer in green
                    const correctLabel = card.querySelectorAll('.option-label')[q.answerIndex];
                    if (correctLabel) {
                        correctLabel.style.background = '#ecfdf5';
                        correctLabel.style.borderColor = 'var(--success)';
                        correctLabel.style.color = 'var(--success)';
                    }
                }

                // Show Explanation
                card.classList.add('show-explanation');
            }
        });

        if (!allAnswered) {
            alert('모든 문제의 정답을 선택해 주세요!');
            return;
        }

        // Show Score Modal
        const finalScore = Math.round((correctCount / questions.length) * 100);
        scoreText = `${finalScore}점 (${correctCount} / ${questions.length})`;
        resultText.textContent = scoreText;

        resultModal.classList.add('active');
        submitBtn.style.display = 'none'; // Hide submit button after grading
    });

    // 7. Close modal and reset
    closeModalBtn.addEventListener('click', () => {
        resultModal.classList.remove('active');
    });

    // 8. Copy result text to clipboard
    copyResultBtn.addEventListener('click', () => {
        const studentName = studentNameInput.value.trim() || '익명';
        const quizTitle = quizSelect.options[quizSelect.selectedIndex].text;
        
        const clipText = `[Algo Quiz 결과 제출]\n퀴즈: ${quizTitle}\n학생: ${studentName}\n최종 점수: ${scoreText}\n제출일시: ${new Date().toLocaleString()}`;
        
        navigator.clipboard.writeText(clipText).then(() => {
            alert('성적 결과가 클립보드에 복사되었습니다! 단톡방이나 게시판에 붙여넣어 제출하세요.');
        }).catch(err => {
            console.error("Copy failed:", err);
            alert('복사에 실패했습니다. 결과를 직접 드래그해서 복사해 주세요.');
        });
    });

    // Handle dropdown quiz select change
    quizSelect.addEventListener('change', (e) => loadQuiz(e.target.value));
});
