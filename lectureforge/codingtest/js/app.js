document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('codingTestForm');
    const btnGenerate = document.getElementById('btnGenerate');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const btnExportMarkdown = document.getElementById('btnExportMarkdown');
    const ctPreviewRender = document.getElementById('ctPreviewRender');

    let currentCTData = null;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const apiKey = localStorage.getItem('gemini_api_key');
        if (!apiKey) {
            alert('API 키가 설정되지 않았습니다. 메인 페이지 우측 상단의 [설정]에서 API 키를 입력해주세요.');
            return;
        }

        const subject = document.getElementById('subject').value;
        const difficulty = document.getElementById('difficulty').value;
        const problemCount = document.getElementById('problemCount').value || 3;
        const fileInput = document.getElementById('pptFile');

        if (fileInput.files.length === 0) {
            alert('PPT 파일을 선택해주세요.');
            return;
        }

        btnGenerate.disabled = true;
        loadingOverlay.classList.remove('hidden');

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

            const prompt = `당신은 알고리즘 코딩테스트 출제 위원입니다.
제공된 강의 PPT 내용을 바탕으로 실전 코딩테스트 문제 ${problemCount}개를 출제해주세요.
각 문제는 백준이나 프로그래머스 같은 온라인 저지(Online Judge) 플랫폼 포맷을 정확히 지켜야 합니다.

과목명/주제: ${subject}
난이도: ${difficulty}
출제 문항 수: ${problemCount}개

[요구사항]
1. 문제 배경(Story)과 상황을 재미있게 구성하세요.
2. 제한 사항(Constraints), 입력 형식, 출력 형식을 명확히 기재하세요.
3. 입출력 예시(예제 입력/출력)는 각 문제당 최소 2세트 이상 제공하세요.
4. 모든 문제에 대해 완벽하게 동작하는 모범 답안 코드(Python 기반)와 해설을 제공하세요.
5. 제공된 PPT 개념이 반드시 문제 풀이에 활용되도록 설계하세요.
6. [중요] JSON 문자열 내의 줄바꿈은 실제 줄바꿈 대신 반드시 '\\n'으로 작성하세요. 큰따옴표(") 역시 '\\"'로 이스케이프해야 합니다. JSON 문법 오류가 발생하지 않도록 철저히 검증하세요.

[출력 형식 - 반드시 아래 JSON 배열 형식으로만 출력]
[
  {
    "title": "문제 제목",
    "description": "문제 설명 (상황 부여)",
    "constraints": ["제한사항 1", "제한사항 2"],
    "inputFormat": "입력 형식",
    "outputFormat": "출력 형식",
    "ioExamples": [
      {
        "input": "예제 입력 1\\n2 3",
        "output": "예제 출력 1\\n5"
      },
      ...
    ],
    "solutionCode": "def solve():\\n    ...",
    "solutionExplanation": "모범 답안 해설"
  }
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
                                        title: { type: "STRING" },
                                        description: { type: "STRING" },
                                        constraints: { type: "ARRAY", items: { type: "STRING" } },
                                        inputFormat: { type: "STRING" },
                                        outputFormat: { type: "STRING" },
                                        ioExamples: {
                                            type: "ARRAY",
                                            items: {
                                                type: "OBJECT",
                                                properties: {
                                                    input: { type: "STRING" },
                                                    output: { type: "STRING" }
                                                }
                                            }
                                        },
                                        solutionCode: { type: "STRING" },
                                        solutionExplanation: { type: "STRING" }
                                    },
                                    required: ["title", "description", "constraints", "inputFormat", "outputFormat", "ioExamples", "solutionCode", "solutionExplanation"]
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
            
            const ctData = JSON.parse(resultText);
            if (!Array.isArray(ctData)) {
                throw new Error("AI가 올바른 배열 형식으로 응답하지 않았습니다.");
            }

            currentCTData = ctData;
            renderPreview(ctData);
            btnExportMarkdown.disabled = false;
        } catch (error) {
            alert('문제 생성 중 오류가 발생했습니다:\n' + error.message);
            console.error(error);
        } finally {
            btnGenerate.disabled = false;
            loadingOverlay.classList.add('hidden');
        }
    });

    function renderPreview(ctData) {
        ctPreviewRender.innerHTML = '';
        
        if (ctData.length === 0) {
            ctPreviewRender.innerHTML = '<p>생성된 문제가 없습니다.</p>';
            return;
        }

        ctData.forEach((q, index) => {
            const div = document.createElement('div');
            div.className = 'ct-problem';
            
            let ioHtml = '';
            q.ioExamples.forEach((io, i) => {
                ioHtml += `
                    <div class="ct-io-container" style="margin-top: 1rem;">
                        <div class="ct-io-box">
                            <h5>예제 입력 ${i + 1}</h5>
                            <pre class="ct-pre">${io.input}</pre>
                        </div>
                        <div class="ct-io-box">
                            <h5>예제 출력 ${i + 1}</h5>
                            <pre class="ct-pre">${io.output}</pre>
                        </div>
                    </div>
                `;
            });

            div.innerHTML = `
                <h3>문제 ${index + 1}. ${q.title}</h3>
                <div class="ct-section">
                    <h4>문제 설명</h4>
                    <p>${q.description.replace(/\\n/g, '<br>')}</p>
                </div>
                <div class="ct-section">
                    <h4>제한 사항</h4>
                    <ul>
                        ${q.constraints.map(c => `<li>${c}</li>`).join('')}
                    </ul>
                </div>
                <div class="ct-section">
                    <h4>입력 형식</h4>
                    <p>${q.inputFormat}</p>
                </div>
                <div class="ct-section">
                    <h4>출력 형식</h4>
                    <p>${q.outputFormat}</p>
                </div>
                <div class="ct-section">
                    <h4>입출력 예제</h4>
                    ${ioHtml}
                </div>
                
                <div class="ct-solution">
                    <button class="btn btn-secondary btn-sm" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">정답 코드 및 해설 보기/숨기기</button>
                    <div style="display: none; margin-top: 1rem;">
                        <h4>모범 답안 (Python)</h4>
                        <pre><code class="language-python">${q.solutionCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
                        <h4>해설</h4>
                        <p>${q.solutionExplanation.replace(/\\n/g, '<br>')}</p>
                    </div>
                </div>
            `;
            ctPreviewRender.appendChild(div);
        });
        
        // Apply highlight.js
        document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }

    btnExportMarkdown.addEventListener('click', () => {
        if (!currentCTData) return;
        
        const subject = document.getElementById('subject').value || 'CodingTest';
        
        let mdContent = `# ${subject} - 코딩테스트 문제\n\n`;
        
        currentCTData.forEach((q, index) => {
            mdContent += `## 문제 ${index + 1}. ${q.title}\n\n`;
            mdContent += `### 문제 설명\n${q.description}\n\n`;
            
            mdContent += `### 제한 사항\n`;
            q.constraints.forEach(c => {
                mdContent += `- ${c}\n`;
            });
            mdContent += `\n`;
            
            mdContent += `### 입력 형식\n${q.inputFormat}\n\n`;
            mdContent += `### 출력 형식\n${q.outputFormat}\n\n`;
            
            mdContent += `### 입출력 예제\n\n`;
            q.ioExamples.forEach((io, i) => {
                mdContent += `**예제 입력 ${i + 1}**\n\`\`\`\n${io.input}\n\`\`\`\n\n`;
                mdContent += `**예제 출력 ${i + 1}**\n\`\`\`\n${io.output}\n\`\`\`\n\n`;
            });
            
            mdContent += `---\n\n`;
            mdContent += `### 💡 정답 및 해설\n\n`;
            mdContent += `#### 모범 답안\n\`\`\`python\n${q.solutionCode}\n\`\`\`\n\n`;
            mdContent += `#### 해설\n${q.solutionExplanation}\n\n`;
            mdContent += `---\n\n`;
        });
        
        const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${subject.replace(/[^a-z0-9가-힣]/gi, '_')}_코딩테스트.md`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    });
});
