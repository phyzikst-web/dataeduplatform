/**
 * shared/learning-tracker.js — 학습 데이터 수집/통계 모듈
 * 
 * 사용법:
 *   LearningTracker.recordQuizResult({ quizId, score, total })
 *   LearningTracker.recordCodingSubmit({ problemId, passed, total })
 *   LearningTracker.recordAIUsage({ feature, topic })
 *   LearningTracker.getStats()
 *   LearningTracker.getRecentActivities(limit)
 *   LearningTracker.clearAll()
 */

const LearningTracker = (() => {
    const STORAGE_KEY = 'algoedu_learning_data';

    // ── 내부: 데이터 로드/저장 ────────────────────
    function _loadData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return _defaultData();
            const data = JSON.parse(raw);
            // 마이그레이션: 필드 누락 방지
            return { ..._defaultData(), ...data };
        } catch {
            return _defaultData();
        }
    }

    function _saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function _defaultData() {
        return {
            quizResults: [],       // { quizId, score, total, date, percentage }
            codingSubmits: [],     // { problemId, passed, total, date, allPassed }
            aiUsages: [],          // { feature, topic, date }
            totalActivities: 0,
        };
    }

    function _now() {
        return new Date().toISOString();
    }

    // ── 퀴즈 결과 기록 ───────────────────────────
    function recordQuizResult({ quizId = 'unknown', score = 0, total = 0 }) {
        const data = _loadData();
        data.quizResults.push({
            quizId,
            score,
            total,
            percentage: total > 0 ? Math.round((score / total) * 100) : 0,
            date: _now(),
        });
        data.totalActivities++;
        _saveData(data);
    }

    // ── 코딩 제출 기록 ───────────────────────────
    function recordCodingSubmit({ problemId = 'unknown', passed = 0, total = 0 }) {
        const data = _loadData();
        data.codingSubmits.push({
            problemId,
            passed,
            total,
            allPassed: passed === total && total > 0,
            date: _now(),
        });
        data.totalActivities++;
        _saveData(data);
    }

    // ── AI 기능 사용 기록 ─────────────────────────
    function recordAIUsage({ feature = 'unknown', topic = '' }) {
        const data = _loadData();
        data.aiUsages.push({
            feature,  // 'feedback' | 'chat'
            topic,
            date: _now(),
        });
        data.totalActivities++;
        _saveData(data);
    }

    // ── 통계 반환 ─────────────────────────────────
    function getStats() {
        const data = _loadData();
        const now = new Date();

        // 퀴즈 평균 점수
        const quizScores = data.quizResults.map(r => r.percentage);
        const avgQuizScore = quizScores.length > 0
            ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
            : 0;

        // 코딩 통과율
        const codingPassed = data.codingSubmits.filter(s => s.allPassed).length;
        const codingTotal = data.codingSubmits.length;

        // AI 사용 횟수
        const aiFeedbackCount = data.aiUsages.filter(u => u.feature === 'feedback').length;
        const aiChatCount = data.aiUsages.filter(u => u.feature === 'chat').length;
        const aiTotalCount = data.aiUsages.length;

        // 주간 활동 데이터 (최근 7일)
        const weeklyData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayLabel = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];

            const quizCount = data.quizResults.filter(r => r.date.startsWith(dateStr)).length;
            const codingCount = data.codingSubmits.filter(s => s.date.startsWith(dateStr)).length;
            const aiCount = data.aiUsages.filter(u => u.date.startsWith(dateStr)).length;

            weeklyData.push({
                date: dateStr,
                label: dayLabel,
                quiz: quizCount,
                coding: codingCount,
                ai: aiCount,
                total: quizCount + codingCount + aiCount,
            });
        }

        return {
            totalActivities: data.totalActivities,
            quiz: {
                total: data.quizResults.length,
                avgScore: avgQuizScore,
                scores: quizScores.slice(-10), // 최근 10개
            },
            coding: {
                total: codingTotal,
                passed: codingPassed,
                passRate: codingTotal > 0 ? Math.round((codingPassed / codingTotal) * 100) : 0,
            },
            ai: {
                total: aiTotalCount,
                feedback: aiFeedbackCount,
                chat: aiChatCount,
            },
            weeklyData,
        };
    }

    // ── 최근 활동 목록 ────────────────────────────
    function getRecentActivities(limit = 20) {
        const data = _loadData();
        const activities = [];

        data.quizResults.forEach(r => {
            activities.push({
                type: 'quiz',
                icon: '📝',
                label: `퀴즈 풀기 — ${r.score}/${r.total} (${r.percentage}%)`,
                date: r.date,
            });
        });

        data.codingSubmits.forEach(s => {
            activities.push({
                type: 'coding',
                icon: '💻',
                label: `코딩 테스트 — ${s.passed}/${s.total} 통과${s.allPassed ? ' ✅' : ''}`,
                date: s.date,
            });
        });

        data.aiUsages.forEach(u => {
            const featureLabel = u.feature === 'feedback' ? 'AI 코드 피드백' : 'AI 질문응답';
            activities.push({
                type: 'ai',
                icon: u.feature === 'feedback' ? '🤖' : '💬',
                label: `${featureLabel}${u.topic ? ` — ${u.topic}` : ''}`,
                date: u.date,
            });
        });

        // 최신순 정렬
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));
        return activities.slice(0, limit);
    }

    // ── 데이터 초기화 ─────────────────────────────
    function clearAll() {
        localStorage.removeItem(STORAGE_KEY);
    }

    // ── Public API ─────────────────────────────────
    return {
        recordQuizResult,
        recordCodingSubmit,
        recordAIUsage,
        getStats,
        getRecentActivities,
        clearAll,
    };
})();
