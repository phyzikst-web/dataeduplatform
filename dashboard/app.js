// dashboard/app.js

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();

    document.getElementById('reset-data-btn').addEventListener('click', () => {
        if (confirm('모든 학습 데이터가 초기화됩니다. 계속하시겠습니까?')) {
            LearningTracker.clearAll();
            location.reload();
        }
    });

    document.getElementById('analyze-weakness-btn').addEventListener('click', handleAnalyzeWeakness);
});

function initDashboard() {
    const stats = LearningTracker.getStats();
    const activities = LearningTracker.getRecentActivities(15);

    // 1. Populate Stat Cards
    animateValue('stat-total-activities', 0, stats.totalActivities, 1000);
    animateValue('stat-quiz-score', 0, stats.quiz.avgScore, 1000, true);
    animateValue('stat-ai-usage', 0, stats.ai.total, 1000);

    // 2. Render Charts
    renderWeeklyChart(stats.weeklyData);
    renderTypeChart(stats);

    // 3. Render Activities
    renderActivities(activities);
}

function animateValue(id, start, end, duration, isPercentage = false) {
    if (start === end) {
        document.getElementById(id).innerHTML = `${end}${isPercentage ? '<span class="unit">%</span>' : ''}`;
        return;
    }
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        
        document.getElementById(id).innerHTML = `${current}${isPercentage ? '<span class="unit">%</span>' : ''}`;
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            document.getElementById(id).innerHTML = `${end}${isPercentage ? '<span class="unit">%</span>' : ''}`;
        }
    };
    window.requestAnimationFrame(step);
}

function renderWeeklyChart(weeklyData) {
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    
    const labels = weeklyData.map(d => d.label);
    const quizData = weeklyData.map(d => d.quiz);
    const codingData = weeklyData.map(d => d.coding);
    const aiData = weeklyData.map(d => d.ai);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '퀴즈',
                    data: quizData,
                    backgroundColor: '#3b82f6',
                    borderRadius: 4
                },
                {
                    label: '코딩',
                    data: codingData,
                    backgroundColor: '#10b981',
                    borderRadius: 4
                },
                {
                    label: 'AI 활용',
                    data: aiData,
                    backgroundColor: '#8b5cf6',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: {
                legend: { position: 'top' }
            }
        }
    });
}

function renderTypeChart(stats) {
    const ctx = document.getElementById('typeChart').getContext('2d');
    
    const data = [stats.quiz.total, stats.coding.total, stats.ai.total];
    
    if (data.every(val => val === 0)) {
        // Handle empty state
        const wrapper = document.getElementById('typeChart').parentElement;
        wrapper.innerHTML = `
            <div class="empty-state" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <span class="emoji">🤷</span>
                <p>데이터가 없습니다</p>
            </div>
        `;
        return;
    }

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['퀴즈', '코딩', 'AI 활용'],
            datasets: [{
                data: data,
                backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function renderActivities(activities) {
    const container = document.getElementById('activities-container');
    
    if (activities.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="emoji">🌱</span>
                <p>학습을 시작하면 여기에 기록이 표시됩니다!</p>
            </div>
        `;
        return;
    }

    let html = '';
    activities.forEach(act => {
        const dateObj = new Date(act.date);
        const timeStr = `${dateObj.getMonth()+1}월 ${dateObj.getDate()}일 ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
        
        html += `
            <div class="activity-item">
                <div class="act-icon">${act.icon}</div>
                <div class="act-info">
                    <div class="act-label">${act.label}</div>
                </div>
                <div class="act-time">${timeStr}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function handleAnalyzeWeakness() {
    const stats = LearningTracker.getStats();
    const activities = LearningTracker.getRecentActivities(20);
    const btn = document.getElementById('analyze-weakness-btn');
    const content = document.getElementById('ai-insight-content');

    if (stats.totalActivities === 0) {
        content.innerHTML = `<p style="color: #fca5a5; text-align: center; padding: 1.5rem 0;">학습 기록이 아직 없습니다. 퀴즈를 풀거나 코딩 테스트를 진행한 후 분석을 요청해 주세요! 🌱</p>`;
        return;
    }

    if (!GeminiAPI.hasApiKey()) {
        GeminiAPI.showApiKeyModal(handleAnalyzeWeakness);
        return;
    }

    btn.disabled = true;
    btn.textContent = '분석 진행 중...';
    content.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 2rem 0;">
            <div class="spinner" style="width:30px; height:30px; border:3px dashed rgba(139,92,246,0.3); border-top-color:#8b5cf6; border-radius:50%; animation:spin 1s linear infinite; margin-bottom:1rem;"></div>
            <p style="color:#a78bfa; animation:pulse 2s infinite; font-size: 0.95rem; text-align:center;">AI가 당신의 학습 데이터를 정밀 분석하고 있습니다...</p>
        </div>
    `;

    const recentActStrings = activities.map(a => `- ${a.label} (${a.icon})`).join('\n');

    const prompt = `학생의 학습 통계:
- 전체 학습 활동 수: ${stats.totalActivities}회
- 퀴즈 시도 횟수: ${stats.quiz.total}회 (평균 점수: ${stats.quiz.avgScore}%)
- 코딩 테스트 및 피드백 시도 횟수: ${stats.coding.total}회
- AI 튜터 피드백 이용 횟수: ${stats.ai.total}회

최근 20개 활동 내역:
${recentActStrings}

당신은 인공지능 기반 맞춤형 학습 분석 및 설계 전문가입니다. 위의 데이터를 면밀히 분석하여 아래의 마크다운 포맷으로 학생을 처방해 주세요. 존댓말로 아주 정중하고 격려 가득한 조언을 제공해야 합니다.

출력 마크다운 형식:
### 📊 1. 현재 나의 학습 페이스 요약
*현재 학습 진도와 열심히 참여한 분야에 대해 긍정적으로 요약 칭찬해 주세요.*

### 🔍 2. AI 정밀 약점 진단
- **주의 깊게 보아야 할 부분**: *최근 오답이나 부족한 부분(예: 코딩 시도가 없거나 퀴즈 점수가 낮은 점 등)을 날카롭지만 정중하게 짚어주세요.*
- **취약한 개념 예상**: *활동 기록을 기반으로 취약할 것으로 추정되는 자료구조나 알고리즘을 지적하세요.*

### 🚀 3. 다음 도전을 위한 맞춤 추천 코스
- **우선 추천 학습**: *학생이 지금 바로 이어서 해야 할 활동(예: 'AI 원클릭 커리큘럼 빌더에서 트리 단원 퀴즈 풀기' 등)을 구체적으로 추천하세요.*
- **성장 조언**: *학생에게 힘이 되는 따뜻한 격려의 말을 남겨주세요.*
`;

    try {
        const responseText = await GeminiAPI.callGemini(prompt, "당신은 세계적인 인공지능 기반 맞춤형 학습 튜터입니다.");
        typeWriterMarkdown(content, responseText);
    } catch (error) {
        content.innerHTML = `<p style="color: #fca5a5; text-align: center; padding: 1.5rem 0;">분석 실패: ${error.message}</p>`;
    } finally {
        btn.disabled = false;
        btn.textContent = 'AI 분석 실행';
    }
}

function typeWriterMarkdown(targetEl, markdownText, callback) {
    targetEl.innerHTML = '';
    let index = 0;
    const speed = 10;
    let currentText = '';
    
    const interval = setInterval(() => {
        if (index < markdownText.length) {
            const chunk = markdownText.substr(index, 4);
            currentText += chunk;
            index += chunk.length;
            
            targetEl.innerHTML = marked.parse(currentText);
            
            // Highlight code blocks
            targetEl.querySelectorAll('pre code').forEach((block) => {
                if (!block.classList.contains('hljs')) {
                    hljs.highlightElement(block);
                }
            });
        } else {
            clearInterval(interval);
            if (callback) callback();
        }
    }, speed);
}
