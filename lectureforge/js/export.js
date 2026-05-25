class ExportManager {
    constructor() {
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('btnExportMd').addEventListener('click', () => this.exportMarkdown());
        document.getElementById('btnExportHtml').addEventListener('click', () => this.exportHtml());
        document.getElementById('btnExportPpt').addEventListener('click', () => this.exportPpt());
    }

    getTopic() {
        const topic = document.getElementById('topic').value || 'Lecture';
        return topic.replace(/[^a-z0-9가-힣]/gi, '_');
    }

    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type: type });
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
    }

    exportMarkdown() {
        if (!window.slideManager) return;
        const md = window.slideManager.rawMarkdown;
        this.downloadFile(md, `${this.getTopic()}.md`, 'text/markdown;charset=utf-8');
    }

    exportHtml() {
        if (!window.slideManager) return;
        const slides = window.slideManager.slides;
        
        let sections = '';
        slides.forEach(slide => {
            const html = marked.parse(slide);
            sections += `<section>\n${html}\n</section>\n`;
        });

        const template = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${document.getElementById('topic').value || '강의자료'}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reset.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reveal.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/theme/white.min.css" id="theme">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
    <style>
        .reveal h1, .reveal h2, .reveal h3 { font-family: 'Pretendard', sans-serif; text-transform: none; }
        .reveal section { font-family: 'Pretendard', sans-serif; text-align: left; }
        .reveal h2 { color: #4F46E5; border-bottom: 2px solid #4F46E5; padding-bottom: 10px; margin-bottom: 30px; }
        .reveal pre { width: 100%; font-size: 0.7em; box-shadow: 0 5px 15px rgba(0,0,0,0.15); border-radius: 8px; }
        .reveal code { font-family: 'Consolas', monospace; }
        .reveal ul, .reveal ol { display: block; margin-left: 1em; }
        .reveal li { margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="reveal">
        <div class="slides">
            ${sections}
        </div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reveal.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/plugin/highlight/highlight.min.js"><\/script>
    <script>
        Reveal.initialize({
            hash: true,
            plugins: [ RevealHighlight ],
            slideNumber: 'c/t',
            transition: 'slide'
        });
    <\/script>
</body>
</html>`;
        
        this.downloadFile(template, `${this.getTopic()}.html`, 'text/html;charset=utf-8');
    }

    async exportPpt() {
        if (!window.slideManager || typeof PptxGenJS === 'undefined') {
            alert('PPT 생성 라이브러리가 아직 로드되지 않았습니다.');
            return;
        }

        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.remove('hidden');
        document.getElementById('loadingMessage').textContent = 'PPT 파일을 생성 중입니다...';

        try {
            const pptx = new PptxGenJS();
            pptx.layout = 'LAYOUT_16x9';
            
            const slides = window.slideManager.slides;
            
            slides.forEach((mdSlide, index) => {
                const slide = pptx.addSlide();
                
                // Add header background block
                slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.9, fill: 'EEF2FF' });
                
                // Add slide number
                slide.addText(`${index + 1} / ${slides.length}`, {
                    x: '90%', y: '94%', w: '10%', fontSize: 12, color: '888888', align: 'right'
                });

                const lines = mdSlide.split('\n');
                let titleText = '';
                let bodyItems = [];
                let inCodeBlock = false;
                let codeContent = [];

                // Helper to parse **bold** text into PptxGenJS TextProps array
                const parseInline = (textStr, baseOptions) => {
                    const parts = textStr.split(/\*\*(.*?)\*\*/g);
                    let result = [];
                    parts.forEach((part, idx) => {
                        if (part) {
                            let opts = Object.assign({}, baseOptions);
                            if (idx % 2 === 1) opts.bold = true;
                            result.push({ text: part, options: opts });
                        }
                    });
                    if (result.length === 0) {
                        result.push({ text: ' ', options: Object.assign({}, baseOptions) });
                    }
                    return result;
                };

                lines.forEach(line => {
                    const trimmed = line.trim();
                    
                    if (!trimmed && !inCodeBlock) {
                        bodyItems.push({ text: ' ', options: { fontSize: 8, breakLine: true } });
                        return;
                    }
                    
                    if (trimmed.startsWith('```')) {
                        if (inCodeBlock) {
                            bodyItems.push({ 
                                text: codeContent.join('\n') || ' ', 
                                options: { fontFace: 'Consolas', fontSize: 11, color: '0055AA', breakLine: true } 
                            });
                            codeContent = [];
                            inCodeBlock = false;
                        } else {
                            inCodeBlock = true;
                        }
                        return;
                    } 
                    
                    if (inCodeBlock) {
                        codeContent.push(line);
                        return;
                    } 
                    
                    if (trimmed.startsWith('#')) {
                        const level = (trimmed.match(/^#+/) || [''])[0].length;
                        const text = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '');
                        
                        if (level <= 2 && !titleText) {
                            titleText = text; // First H1/H2 is the slide title
                        } else {
                            let parsed = parseInline(text, { fontSize: 18, bold: true, color: '333333' });
                            parsed[parsed.length - 1].options.breakLine = true;
                            bodyItems.push(...parsed);
                        }
                        return;
                    } 
                    
                    if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
                        const text = trimmed.substring(1).trim();
                        let parsed = parseInline(text, { fontSize: 16, color: '444444' });
                        parsed.unshift({ text: '• ', options: { fontSize: 16, color: '444444' } });
                        parsed[parsed.length - 1].options.breakLine = true;
                        bodyItems.push(...parsed);
                        return;
                    } 
                    
                    if (trimmed.match(/^\d+\./)) {
                        const text = trimmed.replace(/^\d+\.\s*/, '');
                        let parsed = parseInline(text, { fontSize: 16, color: '444444' });
                        // Add manual number prefix for numbered list
                        parsed.unshift({ text: trimmed.match(/^\d+\./)[0] + ' ', options: { fontSize: 16, color: '444444' } });
                        parsed[parsed.length - 1].options.breakLine = true;
                        bodyItems.push(...parsed);
                        return;
                    } 
                    
                    if (trimmed.startsWith('>')) { 
                        const text = trimmed.substring(1).trim();
                        let isImage = text.includes('[그림 설명');
                        let textColor = isImage ? '991B1B' : '4B5563';
                        let bgColor = isImage ? 'FEF2F2' : 'F3F4F6';
                        
                        let parsed = parseInline(text, { fontSize: 14, color: textColor, highlight: bgColor, italic: true });
                        parsed[parsed.length - 1].options.breakLine = true;
                        bodyItems.push(...parsed);
                        return;
                    } 
                    
                    let parsed = parseInline(trimmed, { fontSize: 16, color: '555555' });
                    parsed[parsed.length - 1].options.breakLine = true;
                    bodyItems.push(...parsed);
                });

                if (titleText) {
                    slide.addText(titleText, {
                        x: 0.5, y: 0.15, w: '90%', h: 0.6,
                        fontSize: 24, bold: true, color: '4F46E5', align: 'left', valign: 'middle'
                    });
                }

                if (bodyItems.length > 0) {
                    slide.addText(bodyItems, {
                        x: 0.5, y: 1.1, w: '90%', h: '78%', valign: 'top', fit: 'shrink'
                    });
                }
            });

            await pptx.writeFile({ fileName: `${this.getTopic()}.pptx` });
        } catch (e) {
            alert('PPT 생성 중 오류가 발생했습니다: ' + e.message + '\n자세한 내용은 콘솔(F12)을 확인해주세요.');
            console.error('PPT Error Stack:', e);
        } finally {
            overlay.classList.add('hidden');
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.exportManager = new ExportManager();
});
