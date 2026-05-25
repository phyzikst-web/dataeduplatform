document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('quizForm');
    const btnGenerate = document.getElementById('btnGenerate');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const btnExportWord = document.getElementById('btnExportWord');
    const quizPreviewRender = document.getElementById('quizPreviewRender');

    let currentQuizData = null;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const apiKey = localStorage.getItem('gemini_api_key');
        if (!apiKey) {
            alert('API 키가 설정되지 않았습니다. 메인 페이지 우측 상단의 [설정]에서 API 키를 입력해주세요.');
            return;
        }

        const subject = document.getElementById('subject').value;
        const problemCount = document.getElementById('problemCount').value || 20;
        const fileInput = document.getElementById('pptFile');

        if (fileInput.files.length === 0) {
            alert('PPT 파일을 선택해주세요.');
            return;
        }

        btnGenerate.disabled = true;
        loadingOverlay.classList.remove('hidden');
        const loadingMessage = document.querySelector('#loadingOverlay p');
        loadingMessage.textContent = 'PPT 파일을 분석하여 텍스트를 추출 중입니다...';

        try {
            const file = fileInput.files[0];
            const zip = new JSZip();
            const loadedZip = await zip.loadAsync(file);
            const slideFiles = [];

            // Find all slide XML files
            loadedZip.folder("ppt/slides").forEach((relativePath, fileObj) => {
                if (relativePath.startsWith('slide') && relativePath.endsWith('.xml')) {
                    slideFiles.push(fileObj);
                }
            });

            // Sort them to keep order
            slideFiles.sort((a, b) => {
                const numA = parseInt(a.name.match(/slide(\d+)\.xml/)[1]);
                const numB = parseInt(b.name.match(/slide(\d+)\.xml/)[1]);
                return numA - numB;
            });

            let pptContent = "";
            for (const slideFile of slideFiles) {
                const xmlContent = await slideFile.async("string");
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
                
                const textNodes = xmlDoc.getElementsByTagName('a:t');
                let slideText = "";
                for (let i = 0; i < textNodes.length; i++) {
                    slideText += textNodes[i].textContent + " ";
                }
                if (slideText.trim()) {
                    pptContent += slideText.trim() + "\n\n";
                }
            }

            if (!pptContent.trim()) {
                throw new Error("PPT에서 추출할 텍스트가 없습니다.");
            }

            loadingMessage.textContent = 'AI가 문제를 출제하고 있습니다... (약 1분 소요)';

            const prompt = `당신은 최고 수준의 대학 교수이자 시험 출제 위원입니다.
제공된 PPT 내용을 바탕으로 객관식 4지선다형 문제를 정확히 ${problemCount}개 출제해주세요.
문제는 학생들이 개념을 정확히 이해했는지 확인하기 좋은 퀄리티로 작성해야 합니다.

과목명: ${subject}
출제 문항 수: ${problemCount}개

[요구사항]
1. 모든 문제는 4지선다(보기 4개)로 구성.
2. 정답은 1~4 중 하나의 숫자.
3. 명확한 해설 포함.
4. 반드시 제공된 PPT 내용에서 유추할 수 있는 문제 출제.
5. [중요] JSON 문자열 내의 줄바꿈은 실제 줄바꿈 대신 반드시 '\\n'으로 작성하세요. 큰따옴표(") 역시 '\\"'로 이스케이프해야 합니다. JSON 문법 오류가 발생하지 않도록 철저히 검증하세요.

[출력 형식 - 반드시 아래 JSON 배열 형식으로만 출력]
[
  {
    "question": "문제 내용",
    "options": ["보기1", "보기2", "보기3", "보기4"],
    "answer": 1,
    "explanation": "해설 내용"
  },
  ...
]

PPT 내용:
${pptContent}`;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 8192,
                            responseMimeType: "application/json",
                            responseSchema: {
                                type: "ARRAY",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        question: { type: "STRING" },
                                        options: { type: "ARRAY", items: { type: "STRING" } },
                                        answer: { type: "INTEGER" },
                                        explanation: { type: "STRING" }
                                    },
                                    required: ["question", "options", "answer", "explanation"]
                                }
                            }
                        }
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API 요청 실패 (${response.status})`);
            }

            const data = await response.json();
            let resultText = data.candidates[0].content.parts[0].text;
            
            // 1. Remove markdown code blocks if any
            resultText = resultText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
            
            // 2. Fix literal newlines inside JSON strings which cause "Unterminated string" errors
            resultText = resultText.replace(/"(?:[^"\\]|\\.)*"/g, function(match) {
                return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
            });
            
            const quizData = JSON.parse(resultText);
            if (!Array.isArray(quizData)) {
                throw new Error("AI가 올바른 배열 형식으로 응답하지 않았습니다.");
            }

            currentQuizData = quizData;
            renderPreview(quizData);
            btnExportWord.disabled = false;
        } catch (error) {
            alert('문제 생성 중 오류가 발생했습니다:\n' + error.message);
            console.error(error);
        } finally {
            btnGenerate.disabled = false;
            loadingOverlay.classList.add('hidden');
        }
    });

    function renderPreview(quizData) {
        quizPreviewRender.innerHTML = '';
        
        if (quizData.length === 0) {
            quizPreviewRender.innerHTML = '<p>렌더링할 문제가 없습니다.</p>';
            return;
        }

        quizData.forEach((q, index) => {
            const div = document.createElement('div');
            div.className = 'quiz-preview';
            
            div.innerHTML = `
                <div class="quiz-question">${index + 1}. ${q.question}</div>
                <ul class="quiz-options">
                    ${q.options.map((opt, i) => `<li>①②③④⑤⑥⑦⑧⑨⑩`.charAt(i) + ` ${opt}</li>`).join('')}
                </ul>
                <div class="quiz-answer">정답: ${q.answer}</div>
                <div class="quiz-explanation">해설: ${q.explanation}</div>
            `;
            quizPreviewRender.appendChild(div);
        });
    }

    btnExportWord.addEventListener('click', async () => {
        if (!currentQuizData) return;
        
        try {
            const subject = document.getElementById('subject').value || 'Lecture';
            
            // Generate DOCX using docx.js
            const { Document, Packer, Paragraph, TextRun, PageBreak } = docx;

            const docChildren = [];
            
            // --- Part 1: Questions Only ---
            docChildren.push(new Paragraph({
                children: [
                    new TextRun({ text: `${subject} - 객관식 평가`, bold: true, size: 36 })
                ],
                spacing: { after: 400 }
            }));

            currentQuizData.forEach((q, idx) => {
                docChildren.push(new Paragraph({
                    children: [new TextRun({ text: `${idx + 1}. ${q.question}`, bold: true, size: 24 })],
                    spacing: { before: 200, after: 100 }
                }));

                q.options.forEach((opt, oIdx) => {
                    const numCircle = ["①", "②", "③", "④"][oIdx] || `${oIdx+1}.`;
                    docChildren.push(new Paragraph({
                        children: [new TextRun({ text: `    ${numCircle} ${opt}`, size: 22 })],
                        spacing: { after: 50 }
                    }));
                });
                
                docChildren.push(new Paragraph({
                    children: [new TextRun({ text: "" })],
                    spacing: { after: 200 }
                }));
            });

            // --- Page Break ---
            docChildren.push(new Paragraph({
                children: [new PageBreak()]
            }));

            // --- Part 2: Answers & Explanations ---
            docChildren.push(new Paragraph({
                children: [
                    new TextRun({ text: "정답 및 해설", bold: true, size: 32 })
                ],
                spacing: { after: 400 }
            }));

            currentQuizData.forEach((q, idx) => {
                docChildren.push(new Paragraph({
                    children: [
                        new TextRun({ text: `${idx + 1}번 정답: `, bold: true, size: 24 }),
                        new TextRun({ text: `${q.answer}`, size: 24, color: "FF0000", bold: true })
                    ],
                    spacing: { before: 200, after: 100 }
                }));

                docChildren.push(new Paragraph({
                    children: [
                        new TextRun({ text: "해설: ", bold: true, size: 22 }),
                        new TextRun({ text: q.explanation, size: 22 })
                    ],
                    spacing: { after: 200 }
                }));
            });

            const doc = new Document({
                sections: [{
                    properties: {},
                    children: docChildren
                }]
            });

            const blob = await Packer.toBlob(doc);
            const filename = `${subject.replace(/[^a-z0-9가-힣]/gi, '_')}_객관식문제.docx`;
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 0);
        } catch (err) {
            alert("Word 파일 생성 중 오류가 발생했습니다: " + err.message);
            console.error(err);
        }
    });
});
