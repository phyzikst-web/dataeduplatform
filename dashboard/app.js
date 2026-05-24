// dashboard/app.js

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();

    document.getElementById('reset-data-btn').addEventListener('click', () => {
        if (confirm('모든 학습 데이터가 초기화됩니다. 계속하시겠습니까?')) {
            LearningTracker.clearAll();
            location.reload();
        }
    });
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
