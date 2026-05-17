document.addEventListener('DOMContentLoaded', async () => {
    const quizContainer = document.getElementById('quiz-container');
    const actionContainer = document.getElementById('action-container');
    const submitBtn = document.getElementById('submit-btn');
    
    const resultModal = document.getElementById('result-modal');
    const scoreDisplay = document.getElementById('score-display');
    const studentNameInput = document.getElementById('student-name');
    const downloadImgBtn = document.getElementById('download-img-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const captureArea = document.getElementById('capture-area');

    let questions = [];
    let settings = { showAnswersAndExplanations: true };

    // Load Settings
    try {
        const setRes = await fetch('settings.json');
        settings = await setRes.json();
    } catch(e) {
        console.log("settings.json을 찾을 수 없어 기본값(true)을 사용합니다.");
    }

    // Load Questions
    try {
        const response = await fetch('questions.json');
        questions = await response.json();
        renderQuiz();
        actionContainer.style.display = 'block';
    } catch (error) {
        quizContainer.innerHTML = '<div style="text-align:center; color:#ef4444;">questions.json 파일을 불러오지 못했습니다. 로컬 서버 환경을 확인해주세요.</div>';
    }

    function renderQuiz() {
        quizContainer.innerHTML = '';
        questions.forEach((q, qIndex) => {
            const card = document.createElement('div');
            card.className = 'quiz-card';
            card.id = `question-${qIndex}`;

            const qText = document.createElement('div');
            qText.className = 'question-text';
            qText.textContent = `${qIndex + 1}. ${q.question}`;
            
            const optionsList = document.createElement('div');
            optionsList.className = 'options-list';

            q.options.forEach((opt, optIndex) => {
                const label = document.createElement('label');
                label.className = 'option-label';
                
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = `q${qIndex}`;
                radio.value = optIndex;

                // UI feedback on select
                radio.addEventListener('change', () => {
                    card.querySelectorAll('.option-label').forEach(l => l.classList.remove('selected'));
                    if (radio.checked) label.classList.add('selected');
                });

                label.appendChild(radio);
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

    submitBtn.addEventListener('click', () => {
        let correctCount = 0;
        let allAnswered = true;

        questions.forEach((q, qIndex) => {
            const card = document.getElementById(`question-${qIndex}`);
            const selected = card.querySelector(`input[name="q${qIndex}"]:checked`);
            
            if (!selected) {
                allAnswered = false;
                card.style.borderColor = 'var(--error)';
                return;
            } else {
                card.style.borderColor = 'var(--border-color)';
            }

            const selectedIndex = parseInt(selected.value);
            const isCorrect = (selectedIndex === q.answerIndex);

            // Reset classes
            card.classList.remove('correct', 'incorrect', 'show-explanation');
            card.querySelectorAll('.option-label').forEach(l => l.classList.remove('is-correct', 'is-wrong-selected'));

            // Remove existing badges
            const existingBadge = card.querySelector('.status-badge');
            if(existingBadge) existingBadge.remove();

            // Check if answers should be revealed
            if (settings.showAnswersAndExplanations) {
                const badge = document.createElement('div');
                badge.className = `status-badge ${isCorrect ? 'badge-correct' : 'badge-incorrect'}`;
                badge.textContent = isCorrect ? '✅ 정답' : '❌ 오답';
                card.insertBefore(badge, card.firstChild);

                if (isCorrect) {
                    card.classList.add('correct');
                    selected.parentElement.classList.add('is-correct');
                } else {
                    card.classList.add('incorrect');
                    selected.parentElement.classList.add('is-wrong-selected');
                    // Highlight correct answer
                    const correctInput = card.querySelector(`input[name="q${qIndex}"][value="${q.answerIndex}"]`);
                    if(correctInput) correctInput.parentElement.classList.add('is-correct');
                }
                
                // Show explanation
                card.classList.add('show-explanation');
            } else {
                // Lock the inputs so they can't change after submit
                card.querySelectorAll('input').forEach(input => input.disabled = true);
            }
        });

        if (!allAnswered) {
            alert('모든 문제에 답을 선택해주세요!');
            return;
        }

        const score = Math.round((correctCount / questions.length) * 100);
        scoreDisplay.textContent = `${score}점 (${correctCount}/${questions.length})`;
        
        if (!settings.showAnswersAndExplanations) {
            closeModalBtn.textContent = '닫기';
        }

        resultModal.classList.add('active');
        submitBtn.style.display = 'none'; // Hide submit button after grading
    });

    closeModalBtn.addEventListener('click', () => {
        resultModal.classList.remove('active');
    });

    downloadImgBtn.addEventListener('click', async () => {
        const name = studentNameInput.value.trim() || '익명 학생';
        
        resultModal.classList.remove('active');
        
        // Add name tag to capture area temporarily
        const nameTag = document.createElement('div');
        nameTag.innerHTML = `<h2 style="text-align:center; color:#34d399; margin-bottom:2rem;">${name} 학생의 퀴즈 결과: ${scoreDisplay.textContent}</h2>`;
        captureArea.insertBefore(nameTag, captureArea.firstChild);
        
        // Setup capture mode styles
        captureArea.style.background = '#0f172a';
        captureArea.style.padding = '2rem';
        captureArea.style.borderRadius = '12px';

        try {
            const canvas = await html2canvas(captureArea, { backgroundColor: '#0f172a', scale: 1.5 });
            const link = document.createElement('a');
            link.download = `퀴즈결과_${name}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            alert('이미지 저장에 실패했습니다.');
        } finally {
            nameTag.remove();
            captureArea.style.background = '';
            captureArea.style.padding = '';
            captureArea.style.borderRadius = '';
            resultModal.classList.add('active');
        }
    });
});
