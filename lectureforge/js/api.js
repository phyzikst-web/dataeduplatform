class GeminiAPI {
    constructor() {}

    getKey() {
        return localStorage.getItem('gemini_api_key');
    }

    buildPrompt(formData) {
        let elements = [];
        if (formData.incConcept) elements.push('개념 설명');
        if (formData.incCode) elements.push(`코드 예제 (언어: ${formData.codeLang})`);
        if (formData.incVisual) elements.push('시각화 다이어그램 및 그림 설명 플레이스홀더');
        if (formData.incActivity) elements.push('실습 활동');
        if (formData.incSummary) elements.push('핵심 요약');

        return `당신은 대한민국 최고의 1타 강사이자 전설적인 대학 교수입니다. 학생들의 눈높이에 맞춰 가장 명쾌하고 우아하게 강의자료를 설계하는 것이 당신의 목표입니다.
아래 요청 사항을 바탕으로, 전문적이면서도 쉽게 이해할 수 있는 완벽한 프리젠테이션용 마크다운 슬라이드 자료를 작성해 주세요.

[요구사항]
- 과목명: ${formData.courseName}
- 주제: ${formData.topic}
- 주차: ${formData.week || '명시되지 않음'}
- 대상 학습자: ${formData.targetAudience}
- 슬라이드 분량: 약 ${formData.slideCount}장
- 포함 요소: ${elements.join(', ')}

[슬라이드 작성 규칙 - 매우 중요]
1. 슬라이드 구분자: 각 슬라이드는 반드시 \`---\` (가로선)으로 구분하세요.
2. 슬라이드 제목: 각 슬라이드의 첫 줄은 반드시 \`## 슬라이드 제목\` 형태의 Heading 2로 시작하세요.
3. 내용 구성: 글머리 기호(\`-\` 또는 \`*\`)를 사용하여 핵심 위주로 개조식으로 간결하게 작성하세요. 서술형 문장은 피하세요.
4. 글꼴 강조: 핵심 키워드나 중요한 문구는 반드시 마크다운 진하게(\`**단어**\`)로 감싸서 강조하세요.
5. 코드 예제: 코드는 **절대로 10줄을 넘지 않도록** 핵심 로직만 매우 간결하게 작성하세요. PPT 슬라이드를 벗어나지 않아야 합니다.
6. 그림 설명: 시각화나 다이어그램이 필요한 부분에는 \`> [그림 설명: (여기에 어떤 그림이 들어가면 좋을지 전문가의 시선에서 상세히 묘사)]\` 형태의 인용구를 넣어주세요.
7. 디자인 & 톤앤매너: 최고급 IT 컨퍼런스(예: Apple, Toss)의 키노트나 우아한 대학 명강의를 연상시키는 세련되고 명료한 어투를 사용하세요.

[강의 목표]
${formData.learningObjectives || '이 주제의 핵심 개념을 완벽하게 이해하고 실무에 적용할 수 있는 기초를 다진다.'}

[추가 요청사항]
${formData.extraInstructions || '없음'}
`;
    }

    async generateLecture(formData, onChunk, onComplete, onError) {
        const apiKey = this.getKey();
        if (!apiKey) {
            onError('API 키가 설정되지 않았습니다. 우측 상단의 [설정]에서 API 키를 입력해주세요.');
            return;
        }

        const prompt = this.buildPrompt(formData);
        await this._streamRequest(prompt, apiKey, onChunk, onComplete, onError);
    }

    async regenerateSlide(currentTitle, onChunk, onComplete, onError) {
        const apiKey = this.getKey();
        if (!apiKey) {
            onError('API 키가 설정되지 않았습니다.');
            return;
        }

        const prompt = `이전 맥락을 무시하고, 다음 제목에 대한 강의 슬라이드 내용 하나를 마크다운으로 작성해주세요.\n\n제목: ${currentTitle}\n\n조건:\n- 하이픈 3개(---) 등의 구분선은 출력하지 마세요.\n- 바로 제목(## ${currentTitle})부터 시작하세요.\n- 내용을 더 풍부하고 상세하게 작성해주세요.`;
        await this._streamRequest(prompt, apiKey, onChunk, onComplete, onError);
    }

    async _streamRequest(prompt, apiKey, onChunk, onComplete, onError) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:streamGenerateContent?alt=sse&key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API 요청 실패 (${response.status})`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";
            let fullContent = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
                                const text = data.candidates[0].content.parts[0].text;
                                if (text) {
                                    fullContent += text;
                                    onChunk(fullContent);
                                }
                            }
                        } catch (e) {
                            console.warn("Parse error for line: ", line);
                        }
                    }
                }
            }
            onComplete(fullContent);
        } catch (error) {
            onError(error.message);
        }
    }
}
window.geminiAPI = new GeminiAPI();
