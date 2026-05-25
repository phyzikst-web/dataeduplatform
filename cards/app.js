document.addEventListener('DOMContentLoaded', async () => {
    // 1. UI Elements
    const flashcardWrapper = document.getElementById('flashcard-wrapper');
    const flashcard = document.getElementById('flashcard');
    const cardTerm = document.getElementById('card-term');
    const cardDefinition = document.getElementById('card-definition');
    const cardExample = document.getElementById('card-example');
    
    const cardProgressText = document.getElementById('card-progress-text');
    const cardPercentage = document.getElementById('card-percentage');
    const progressBarCurrent = document.getElementById('progress-bar-current');
    
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const deckStats = document.getElementById('deck-stats');

    const cardsPageTitle = document.getElementById('cards-page-title');
    const cardsPageDesc = document.getElementById('cards-page-desc');

    let conceptCards = [];
    let activeIndex = 0;
    let currentWeek = '1';
    let visitedIndices = new Set();
    let completedRecorded = false;

    // Retrieve week parameter
    const urlParams = new URLSearchParams(window.location.search);
    currentWeek = urlParams.get('week') || '1';

    // Load Data
    await loadCards(currentWeek);

    async function loadCards(week) {
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

            conceptCards = data.cards;
            if (!conceptCards || conceptCards.length === 0) {
                throw new Error("개념 카드가 저장되어 있지 않습니다.");
            }

            // Sync Header UI
            cardsPageTitle.innerHTML = `개념 플래시 카드 — <span>Week ${week === 'local' ? '로컬' : week}</span>`;
            cardsPageDesc.textContent = `주제: ${data.topic}`;

            // Initialize Card deck
            activeIndex = 0;
            selectCard(0);

        } catch (err) {
            console.error("Failed to load cards:", err);
            cardTerm.textContent = "개념 카드 로드 실패";
            cardDefinition.textContent = `사유: ${err.message}`;
            cardExample.textContent = "-";
            prevBtn.disabled = true;
            nextBtn.disabled = true;
        }
    }

    function selectCard(index) {
        activeIndex = index;
        const card = conceptCards[index];
        if (!card) return;

        visitedIndices.add(index);

        // Reset flip state
        flashcard.classList.remove('flipped');

        // Apply dynamic content
        cardTerm.textContent = card.term;
        cardDefinition.textContent = card.definition;
        cardExample.textContent = card.example;

        // Progress Text and Indicators
        const total = conceptCards.length;
        const currentNum = index + 1;
        cardProgressText.textContent = `개념 요약 ${currentNum} / ${total}`;
        deckStats.textContent = `${currentNum} / ${total}`;
        
        // Progress Bar
        const percentage = Math.round((currentNum / total) * 100);
        cardPercentage.textContent = `${percentage}% 학습`;
        progressBarCurrent.style.width = `${percentage}%`;

        // Buttons Enable/Disable
        prevBtn.disabled = (index === 0);
        
        // If it's the last card, we can change Next button style or text
        if (index === total - 1) {
            nextBtn.textContent = '완료';
        } else {
            nextBtn.textContent = '→';
        }

        // Check if all cards are viewed
        checkCompletion();
    }

    // Toggle 3D Flip on card click
    flashcardWrapper.addEventListener('click', () => {
        flashcard.classList.toggle('flipped');
    });

    // Pagination Click
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card from flipping
        if (activeIndex > 0) {
            selectCard(activeIndex - 1);
        }
    });

    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card from flipping
        if (activeIndex < conceptCards.length - 1) {
            selectCard(activeIndex + 1);
        } else {
            // Clicked "Complete" on last card
            if (visitedIndices.size === conceptCards.length) {
                triggerFinalCompletion();
            } else {
                alert("아직 다 읽지 않은 개념 카드가 있습니다! 이전 버튼을 눌러 마저 학습해 주세요.");
            }
        }
    });

    function checkCompletion() {
        if (visitedIndices.size === conceptCards.length && !completedRecorded) {
            triggerFinalCompletion();
        }
    }

    function triggerFinalCompletion() {
        completedRecorded = true;
        
        // Record concept card completion to Local Learning Tracker
        LearningTracker.recordAIUsage({
            feature: 'feedback', // Map to AI use to increment stats
            topic: `개념 카드 Week ${currentWeek}`
        });

        setTimeout(() => {
            alert(`🎉 축하합니다! 이번 주차에 수록된 ${conceptCards.length}가지 핵심 개념 카드를 완벽하게 마스터하셨습니다. 학습 진척도가 대시보드에 안전하게 누적 기록되었습니다!`);
        }, 500);
    }
});
