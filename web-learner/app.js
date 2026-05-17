// ═══════════════════════════════════════════════
//  Web Learner — 파일 기반 문제 로더
//  선생님은 problems/ 폴더에 파일만 넣으면 됩니다.
// ═══════════════════════════════════════════════

let htmlViewer, cssEditor;
let previewFrame, ghostFrame, conditionList;
let problems = [];
let currentIdx = 0;
let savedCode = {};  // { idx: cssCode } — 학생 입력 보존

// ─── HTML에서 <style> 블록 분리 ───
function extractAndStripStyle(fullHtml) {
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let extractedCss = '';
    let match;
    while ((match = styleRegex.exec(fullHtml)) !== null) {
        extractedCss += match[1].trim() + '\n';
    }
    // <style> 블록 제거
    const strippedHtml = fullHtml.replace(styleRegex, '').trim();
    return { html: strippedHtml, css: extractedCss.trim() };
}

// ─── CSS에서 조건표 자동 생성 ───
function autoGenerateConditions(cssText) {
    const conditions = [];
    // @media 블록을 제외한 일반 룰만 추출
    const noMedia = cssText.replace(/@media[^{]+\{[\s\S]*?\}\s*\}/g, '');
    const ruleRegex = /([^{}@]+)\{([^}]+)\}/g;
    let match;
    while ((match = ruleRegex.exec(noMedia)) !== null) {
        const selector = match[1].trim();
        const propsStr = match[2].trim();
        if (!selector || !propsStr) continue;

        // 속성 요약 생성
        const propNames = propsStr.split(';')
            .map(p => p.split(':')[0]?.trim())
            .filter(p => p);
        const desc = `${selector}에 ${propNames.slice(0, 3).join(', ')}${propNames.length > 3 ? ' 등' : ''}을 설정한다.`;
        const cssCode = `${selector} { ${propsStr} }`;

        const checks = [];
        const props = {};
        propsStr.split(';').forEach(p => {
            const colonIdx = p.indexOf(':');
            if (colonIdx > 0) {
                const prop = p.substring(0, colonIdx).trim();
                const val = p.substring(colonIdx + 1).trim();
                if (prop && val) props[prop] = val;
            }
        });
        if (Object.keys(props).length > 0) {
            checks.push({ selector, props });
        }
        conditions.push({ desc, cssCode, checks });
    }
    return conditions;
}

// ─── 조건이 실제 HTML과 매칭되는지 검증 ───
function validateConditions(conditions, htmlText) {
    if (conditions.length === 0) return false;
    // 조건의 선택자 중 최소 절반이 HTML에 존재하는지 확인
    let matchCount = 0;
    for (const cond of conditions) {
        for (const check of cond.checks) {
            const sel = check.selector;
            // id 선택자: #xxx → id="xxx"
            if (sel.startsWith('#')) {
                const id = sel.substring(1);
                if (htmlText.includes(`id="${id}"`)) matchCount++;
            }
            // class 선택자: .xxx → class="...xxx..."
            else if (sel.startsWith('.')) {
                const cls = sel.substring(1).split('.')[0]; // 첫 클래스만
                if (htmlText.includes(cls)) matchCount++;
            }
            // 태그 선택자
            else if (/^[a-z]+$/i.test(sel)) {
                if (htmlText.includes(`<${sel}`)) matchCount++;
            }
        }
    }
    const totalChecks = conditions.reduce((sum, c) => sum + c.checks.length, 0);
    return totalChecks > 0 && (matchCount / totalChecks) >= 0.4;
}

// ─── 파일 로드 ───
async function loadProblems() {
    const t = Date.now();
    // 1. list.txt에서 문제 목록 읽기
    const listText = await fetch(`problems/list.txt?t=${t}`).then(r => r.text());
    const titles = listText.trim().split('\n').filter(l => l.trim());

    // 2. 각 문제 폴더에서 파일 로드
    for (let i = 0; i < titles.length; i++) {
        const folder = `problems/${i + 1}`;
        const [rawHtml, cssFile, condText] = await Promise.all([
            fetch(`${folder}/code.html?t=${t}`).then(r => r.text()),
            fetch(`${folder}/answer.css?t=${t}`).then(r => r.text()),
            fetch(`${folder}/conditions.txt?t=${t}`).then(r => r.text())
        ]);

        // HTML에서 <style> 자동 분리
        const extracted = extractAndStripStyle(rawHtml);
        const htmlOnly = extracted.html;
        const extractedCss = extracted.css;

        // 정답 CSS 결정: answer.css가 있으면 사용, 없으면 HTML에서 추출한 CSS 사용
        const answerCss = cssFile.trim() || extractedCss;

        // 조건표 파싱 후 검증
        let conditions = parseConditions(condText);
        const isValid = validateConditions(conditions, htmlOnly);

        // 조건이 HTML과 맞지 않으면 CSS에서 자동 생성
        if (!isValid && answerCss) {
            conditions = autoGenerateConditions(answerCss);
        }

        problems.push({
            title: titles[i].trim(),
            html: htmlOnly,
            answerCss: answerCss,
            conditions: conditions
        });
    }
}

// ─── 조건표 파싱 (탭 구분 텍스트) ───
function parseConditions(text) {
    const lines = text.trim().split('\n').filter(l => l.trim());
    const conditions = [];

    for (const line of lines) {
        const parts = line.split('\t');
        if (parts.length < 2) continue;

        // 헤더 행 건너뛰기
        const first = parts[0].trim();
        if (first === '구분' || first === '번호' || first === 'No' || first === 'no') continue;

        const desc = parts[1]?.trim() || '';
        const cssCode = parts[2]?.trim() || '';

        // CSS 코드에서 selector { properties } 패턴 추출
        const checks = [];
        const ruleRegex = /([^{]+)\{([^}]+)\}/g;
        let match;
        while ((match = ruleRegex.exec(cssCode)) !== null) {
            const selector = match[1].trim();
            const propsStr = match[2].trim();
            const props = {};
            propsStr.split(';').forEach(p => {
                const colonIdx = p.indexOf(':');
                if (colonIdx > 0) {
                    const prop = p.substring(0, colonIdx).trim();
                    const val = p.substring(colonIdx + 1).trim();
                    if (prop && val) props[prop] = val;
                }
            });
            if (Object.keys(props).length > 0) {
                checks.push({ selector, props });
            }
        }

        conditions.push({ desc, cssCode, checks });
    }
    return conditions;
}

// ─── Tab System ───
function buildTabs() {
    const container = document.getElementById('problem-tabs');
    container.innerHTML = '';
    problems.forEach((p, idx) => {
        const btn = document.createElement('button');
        btn.className = 'problem-tab' + (idx === currentIdx ? ' active' : '');
        btn.textContent = p.title;
        btn.addEventListener('click', () => switchProblem(idx));
        container.appendChild(btn);
    });
}

function switchProblem(idx) {
    // 현재 코드 저장
    if (cssEditor) savedCode[currentIdx] = cssEditor.getValue();

    currentIdx = idx;

    // 탭 UI 갱신
    document.querySelectorAll('.problem-tab').forEach((tab, i) => {
        tab.classList.toggle('active', i === idx);
    });

    // HTML Viewer 교체
    htmlViewer.setValue(problems[idx].html);

    // CSS 에디터 복원
    const prev = savedCode[idx];
    cssEditor.setValue(prev || "/* 여기에 CSS를 작성하세요 */\n\n");

    // 조건표 & 프리뷰 갱신
    renderConditions();
    updateGhost();
}

// ─── Editor Init ───
function initEditor() {
    previewFrame  = document.getElementById('preview-frame');
    ghostFrame    = document.getElementById('ghost-frame');
    conditionList = document.getElementById('condition-list');

    const cur = problems[currentIdx];

    // HTML Viewer (Read-only)
    htmlViewer = CodeMirror(document.getElementById('html-viewer-container'), {
        value: cur.html,
        mode: "xml", htmlMode: true,
        theme: "dracula", lineNumbers: true,
        readOnly: true, cursorBlinkRate: -1
    });

    // CSS Editor
    cssEditor = CodeMirror(document.getElementById('css-editor-container'), {
        value: "/* 여기에 CSS를 작성하세요 */\n\n",
        mode: "css", theme: "dracula",
        lineNumbers: true, autoCloseBrackets: true
    });

    cssEditor.on('change', () => {
        updatePreview();
        clearTimeout(window._checkTimer);
        window._checkTimer = setTimeout(checkAnswers, 300);
    });
}

// ─── Preview ───
function updatePreview() {
    const studentCss = cssEditor.getValue();
    const html = problems[currentIdx].html;

    // Magic Reveal: 학생이 작성한 선택자만 표시
    const selectorRegex = /([#\.a-zA-Z0-9_-]+)\s*\{/g;
    let match;
    const revealSelectors = [];
    while ((match = selectorRegex.exec(studentCss)) !== null) {
        const sel = match[1].trim();
        if (sel !== '*' && sel !== 'html' && sel !== 'body') revealSelectors.push(sel);
    }

    const rootMatch = html.match(/id="([^"]+)"/);
    const rootId = rootMatch ? '#' + rootMatch[1] : 'body';

    let revealStyle = `
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Malgun Gothic',sans-serif; padding:10px; background:#fff; }
        ${rootId} > * { display: none !important; }
    `;
    if (revealSelectors.length > 0) {
        revealSelectors.forEach(sel => {
            revealStyle += `${sel} { display: block !important; }\n`;
            revealStyle += `${rootId} { display: block !important; }\n`;
        });
    }

    const content = `<html><head><style>${revealStyle}\n${studentCss}</style></head><body>${html}</body></html>`;
    const doc = previewFrame.contentWindow.document;
    doc.open(); doc.write(content); doc.close();
    setTimeout(() => injectClickInspector(previewFrame.contentWindow.document), 20);
}

function updateGhost() {
    const cur = problems[currentIdx];
    const content = `<html><head><style>${cur.answerCss}</style></head><body>${cur.html}</body></html>`;
    const doc = ghostFrame.contentWindow.document;
    doc.open(); doc.write(content); doc.close();
}

// ─── 조건표 렌더링 ───
function renderConditions() {
    conditionList.innerHTML = '';
    problems[currentIdx].conditions.forEach(c => {
        const li = document.createElement('li');
        li.className = 'check-item';
        li.innerHTML = `<span class="status-icon">⭕</span><span>${c.desc}</span>`;
        conditionList.appendChild(li);
    });
    updatePreview();
}

// ─── 자동 채점 (정답 CSS vs 학생 CSS 렌더링 비교) ───
function checkAnswers() {
    const studentDoc = previewFrame.contentWindow.document;
    const answerDoc  = ghostFrame.contentWindow.document;
    const items = document.querySelectorAll('.check-item');
    const conditions = problems[currentIdx].conditions;

    conditions.forEach((cond, idx) => {
        if (cond.checks.length === 0) return; // 체크 로직 없으면 건너뛰기

        let pass = true;
        for (const check of cond.checks) {
            try {
                const studentEl = studentDoc.querySelector(check.selector);
                const answerEl  = answerDoc.querySelector(check.selector);
                if (!studentEl || !answerEl) { pass = false; break; }

                const sStyle = studentDoc.defaultView.getComputedStyle(studentEl);
                const aStyle = answerDoc.defaultView.getComputedStyle(answerEl);

                for (const prop of Object.keys(check.props)) {
                    if (sStyle.getPropertyValue(prop) !== aStyle.getPropertyValue(prop)) {
                        pass = false; break;
                    }
                }
                if (!pass) break;
            } catch (e) { pass = false; break; }
        }

        if (pass) {
            items[idx].classList.add('done');
            items[idx].querySelector('.status-icon').innerHTML = '✅';
        } else {
            items[idx].classList.remove('done');
            items[idx].querySelector('.status-icon').innerHTML = '⭕';
        }
    });
}

// ─── Click Inspector ───
function injectClickInspector(doc) {
    if (doc.getElementById('inspect-styles')) return;
    const style = doc.createElement('style');
    style.id = 'inspect-styles';
    style.innerHTML = `
        .inspect-highlight { outline: 3px solid #2563eb !important; outline-offset: -3px; background-color: rgba(37,99,235,0.1) !important; position: relative; }
        .inspect-label { position: fixed; background: #2563eb; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-family: sans-serif; z-index: 999999; pointer-events: none; font-weight: bold; }
    `;
    doc.head.appendChild(style);
    doc.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const el = e.target;
        doc.querySelectorAll('.inspect-highlight').forEach(n => n.classList.remove('inspect-highlight'));
        doc.querySelectorAll('.inspect-label').forEach(n => n.remove());
        el.classList.add('inspect-highlight');
        let selector = el.id ? '#' + el.id : (el.className ? '.' + el.className.split(' ')[0].replace('inspect-highlight','').trim() : el.tagName.toLowerCase());
        const rect = el.getBoundingClientRect();
        const label = doc.createElement('div');
        label.className = 'inspect-label'; label.innerText = selector;
        label.style.top = (rect.top > 30 ? rect.top - 25 : rect.top + 5) + 'px';
        label.style.left = rect.left + 'px';
        doc.body.appendChild(label);
        findInEditor(selector);
    }, true);
}

function findInEditor(selector) {
    const cssLines = cssEditor.getValue().split('\n');
    const htmlLines = htmlViewer.getValue().split('\n');

    let htmlLine = htmlLines.findIndex(l => l.includes(selector.replace(/[#\.]/, '')));
    if (htmlLine !== -1) {
        htmlViewer.setCursor(htmlLine, 0);
        htmlViewer.addLineClass(htmlLine, 'background', 'highlight-line');
        setTimeout(() => htmlViewer.removeLineClass(htmlLine, 'background', 'highlight-line'), 1500);
    }

    let cssLine = cssLines.findIndex(l => l.includes(selector));
    if (cssLine !== -1) {
        cssEditor.setCursor(cssLine, 0); cssEditor.focus();
        cssEditor.addLineClass(cssLine, 'background', 'highlight-line');
        setTimeout(() => cssEditor.removeLineClass(cssLine, 'background', 'highlight-line'), 1500);
    }
}

// ─── Scroll Sync ───
function syncScroll() {
    const pW = previewFrame.contentWindow;
    const gW = ghostFrame.contentWindow;
    pW.addEventListener('scroll', () => gW.scrollTo(pW.scrollX, pW.scrollY));
    gW.addEventListener('scroll', () => pW.scrollTo(gW.scrollX, gW.scrollY));
}

// ─── Init ───
async function initUI() {
    Split(['#instruction-panel', '#html-panel', '#css-panel', '#preview-panel'], {
        sizes: [10, 20, 30, 40],
        minSize: 100,
        gutterSize: 12,
    });

    buildTabs();
    syncScroll();
    renderConditions();
    updateGhost();
}

window.onload = async () => {
    await loadProblems();
    initEditor();
    initUI();
};
