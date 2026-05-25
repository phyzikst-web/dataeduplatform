document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('notebookForm');
    const btnGenerate = document.getElementById('btnGenerate');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const btnExportIpynb = document.getElementById('btnExportIpynb');
    const cellPreviewRender = document.getElementById('cellPreviewRender');

    let currentIpynbJson = null;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const apiKey = localStorage.getItem('gemini_api_key');
        if (!apiKey) {
            alert('API 키가 설정되지 않았습니다. 메인 페이지 우측 상단의 [설정]에서 API 키를 입력해주세요.');
            return;
        }

        const subject = document.getElementById('subject').value;
        const week = document.getElementById('week').value;
        const problemCount = document.getElementById('problemCount').value || 6;
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

            // Sort them to keep order (slide1, slide2, ...)
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
                
                // Extract text from <a:t> nodes
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
                throw new Error("PPT에서 추출할 텍스트가 없습니다. 이미지 위주의 슬라이드일 수 있습니다.");
            }

            loadingMessage.textContent = 'AI가 텍스트를 분석하여 Notebook을 생성 중입니다... (약 1분 소요)';

        const prompt = `당신은 전문대학 프로그래밍 실습 교재 제작 전문가입니다.
교수가 붙여넣은 강의 PPT 내용을 분석하여
Jupyter Notebook 실습 자료를 생성합니다.

규칙:
1. 입력된 PPT 내용에서 핵심 개념과 코드를 파악
2. 그 내용에 맞는 실습 셀을 동적으로 구성
3. 특정 주제에 고정하지 말고 입력 내용 기반으로 생성
4. 학생 수준: 전문대 1~2학년, Python 기초 이수자
5. 모든 설명은 한국어로 작성
6. 반드시 올바른 .ipynb JSON 형식으로만 출력
7. JSON 코드블록 마크다운(\`\`\`) 없이 순수 JSON만 출력
8. 빈칸 채우기(Fill-in-the-blank) 형식의 문제와, 배운 내용을 활용해 직접 코드를 작성해보는 응용 문제를 적절히 섞어주세요.
9. ${subject} 과목의 ${week} 진도에 맞는 수준으로 작성해주세요.
10. 정답(Solution) 셀을 따로 만들지 말고, 학생이 직접 채워넣을 수 있는 형태(TODO 주석 등)로 코드를 제공하세요.
11. [중요] JSON 문자열 내의 줄바꿈은 실제 줄바꿈 대신 반드시 '\\n'으로 작성하세요. 큰따옴표(") 역시 '\\"'로 이스케이프해야 합니다. 특히 파이썬 코드 문자열에서 JSON 문법 오류가 발생하지 않도록 철저히 검증하세요.

과목명: ${subject}
주차: ${week}
PPT 내용:
${pptContent}

아래 구조로 Notebook을 구성하세요:
1. 타이틀 + 학습목표 (마크다운 셀)
2. 핵심 개념 설명 (마크다운 셀, PPT 내용 기반)
3. 완성 코드 예제 (코드 셀, 실행 가능)
4. 빈칸 채우기 및 응용 실습 문제 (코드 셀, 반드시 총 ${problemCount}문제 출제)
5. 마무리 요약 (마크다운 셀)

출력 형식 (.ipynb JSON):
{
  "nbformat": 4,
  "nbformat_minor": 5,
  "metadata": {
    "kernelspec": {
      "display_name": "Python 3",
      "language": "python",
      "name": "python3"
    },
    "language_info": {
      "name": "python",
      "version": "3.8.0"
    }
  },
  "cells": [
    {
      "cell_type": "markdown",
      "metadata": {},
      "source": ["내용"]
    },
    {
      "cell_type": "code",
      "execution_count": null,
      "metadata": {},
      "outputs": [],
      "source": ["코드"]
    }
  ]
}`;
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
                                type: "OBJECT",
                                properties: {
                                    cells: {
                                        type: "ARRAY",
                                        items: {
                                            type: "OBJECT",
                                            properties: {
                                                cell_type: { type: "STRING" },
                                                metadata: { type: "OBJECT" },
                                                source: { type: "ARRAY", items: { type: "STRING" } }
                                            }
                                        }
                                    },
                                    metadata: { type: "OBJECT" },
                                    nbformat: { type: "INTEGER" },
                                    nbformat_minor: { type: "INTEGER" }
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
            
            if (resultText.endsWith('```')) {
                resultText = resultText.substring(0, resultText.length - 3);
            }
            if (resultText.startsWith('json')) {
                resultText = resultText.substring(4);
            }
            resultText = resultText.trim();
            
            // Fix literal newlines inside JSON strings which cause "Unterminated string" errors
            resultText = resultText.replace(/"(?:[^"\\]|\\.)*"/g, function(match) {
                return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
            });
            
            const ipynbObj = JSON.parse(resultText);
            currentIpynbJson = JSON.stringify(ipynbObj, null, 2);
            
            renderPreview(ipynbObj.cells);
            btnExportIpynb.disabled = false;
        } catch (error) {
            alert('Notebook 생성 중 오류가 발생했습니다: ' + error.message);
            console.error(error);
        } finally {
            btnGenerate.disabled = false;
            loadingOverlay.classList.add('hidden');
        }
    });

    btnExportIpynb.addEventListener('click', () => {
        if (!currentIpynbJson) return;
        const subject = document.getElementById('subject').value || 'Lecture';
        const filename = `${subject.replace(/[^a-z0-9가-힣]/gi, '_')}_실습.ipynb`;
        
        const blob = new Blob([currentIpynbJson], { type: 'application/json' });
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
    });

    function renderPreview(cells) {
        cellPreviewRender.innerHTML = '';
        if (!cells || cells.length === 0) {
            cellPreviewRender.innerHTML = '<p>렌더링할 셀이 없습니다.</p>';
            return;
        }

        cells.forEach((cell, index) => {
            const cellDiv = document.createElement('div');
            cellDiv.className = `cell-preview cell-type-${cell.cell_type}`;
            
            const header = document.createElement('div');
            header.className = 'cell-header';
            header.innerHTML = `<span>[${index + 1}] ${cell.cell_type === 'markdown' ? 'Markdown' : 'Code'}</span>`;
            
            const body = document.createElement('div');
            body.className = 'cell-body';
            
            const sourceText = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
            
            if (cell.cell_type === 'markdown') {
                body.innerHTML = marked.parse(sourceText);
            } else {
                body.textContent = sourceText;
            }
            
            cellDiv.appendChild(header);
            cellDiv.appendChild(body);
            cellPreviewRender.appendChild(cellDiv);
        });
        
        // Apply highlight.js to markdown code blocks if any
        if (typeof hljs !== 'undefined') {
            document.querySelectorAll('#cellPreviewRender pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }
    }
});
