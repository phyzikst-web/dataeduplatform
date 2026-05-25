class SlideManager {
    constructor() {
        this.slides = []; 
        this.currentSlideIndex = 0;
        this.rawMarkdown = '';
        
        // DOM Elements
        this.rawEditor = document.getElementById('rawMarkdown');
        this.thumbnailsList = document.getElementById('thumbnailsList');
        this.slideMarkdownEditor = document.getElementById('slideMarkdownEditor');
        this.slidePreviewRender = document.getElementById('slidePreviewRender');
        this.currentSlideLabel = document.getElementById('currentSlideLabel');
        
        this.btnExportHtml = document.getElementById('btnExportHtml');
        this.btnExportMd = document.getElementById('btnExportMd');
        this.btnExportPpt = document.getElementById('btnExportPpt');
        
        this.bindEvents();
    }

    bindEvents() {
        // Raw Markdown Input
        this.rawEditor.addEventListener('input', (e) => {
            this.rawMarkdown = e.target.value;
            this.parseSlides(this.rawMarkdown);
            this.renderThumbnails();
            this.renderCurrentSlide();
            this.updateExportButtons();
        });

        // Slide Editor Input
        this.slideMarkdownEditor.addEventListener('input', (e) => {
            if (this.slides.length > 0) {
                this.slides[this.currentSlideIndex] = e.target.value;
                this.updateRawFromSlides();
                this.renderSlidePreview();
                this.updateThumbnail(this.currentSlideIndex);
            }
        });

        // Form Submit
        document.getElementById('lectureForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.startGeneration();
        });
        
        // Toolbar actions
        document.getElementById('btnAddSlide').addEventListener('click', () => this.addSlide());
        document.getElementById('btnDeleteSlide').addEventListener('click', () => this.deleteSlide());
        document.getElementById('btnRegenerateSlide').addEventListener('click', () => this.regenerateSlide());
        
        // Configure marked.js to use highlight.js
        marked.setOptions({
            highlight: function(code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    return hljs.highlight(code, { language: lang }).value;
                }
                return hljs.highlightAuto(code).value;
            },
            breaks: true
        });
    }

    startGeneration() {
        const formData = {
            courseName: document.getElementById('courseName').value,
            topic: document.getElementById('topic').value,
            week: document.getElementById('week').value,
            targetAudience: document.getElementById('targetAudience').value,
            learningObjectives: document.getElementById('learningObjectives').value,
            slideCount: document.getElementById('slideCount').value,
            incConcept: document.getElementById('incConcept').checked,
            incCode: document.getElementById('incCode').checked,
            incVisual: document.getElementById('incVisual').checked,
            incActivity: document.getElementById('incActivity').checked,
            incSummary: document.getElementById('incSummary').checked,
            codeLang: document.getElementById('codeLang').value,
            extraInstructions: document.getElementById('extraInstructions').value
        };

        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.remove('hidden');
        document.getElementById('loadingMessage').textContent = 'AI가 강의자료를 작성 중입니다... (약 1~3분 소요)';

        this.rawMarkdown = '';
        this.currentSlideIndex = 0;
        
        // Disable generate button
        document.getElementById('btnGenerate').disabled = true;
        document.querySelector('#btnGenerate .spinner').classList.remove('hidden');
        
        window.geminiAPI.generateLecture(
            formData,
            (chunk) => {
                this.rawMarkdown = chunk;
                this.rawEditor.value = this.rawMarkdown;
                this.parseSlides(this.rawMarkdown);
                this.renderThumbnails();
                this.renderCurrentSlide();
            },
            (finalContent) => {
                overlay.classList.add('hidden');
                document.getElementById('btnGenerate').disabled = false;
                document.querySelector('#btnGenerate .spinner').classList.add('hidden');
                
                this.rawMarkdown = finalContent;
                this.rawEditor.value = this.rawMarkdown;
                this.parseSlides(this.rawMarkdown);
                this.renderThumbnails();
                this.renderCurrentSlide();
                this.updateExportButtons();
            },
            (errorMsg) => {
                overlay.classList.add('hidden');
                document.getElementById('btnGenerate').disabled = false;
                document.querySelector('#btnGenerate .spinner').classList.add('hidden');
                alert(`오류가 발생했습니다: ${errorMsg}`);
            }
        );
    }

    parseSlides(markdown) {
        // Split by --- or ___ or ***
        const regex = /\n(?:---|___|\*\*\*)\n/;
        this.slides = markdown.split(regex).map(s => s.trim()).filter(s => s.length > 0);
        if (this.slides.length === 0 && markdown.trim().length > 0) {
            this.slides = [markdown.trim()];
        }
        
        if (this.currentSlideIndex >= this.slides.length) {
            this.currentSlideIndex = Math.max(0, this.slides.length - 1);
        }
    }

    updateRawFromSlides() {
        this.rawMarkdown = this.slides.join('\n\n---\n\n');
        this.rawEditor.value = this.rawMarkdown;
    }

    getSlideTitle(markdown) {
        const match = markdown.match(/#+\s+(.+)/);
        return match ? match[1] : '제목 없음';
    }

    renderThumbnails() {
        if (this.slides.length === 0) {
            this.thumbnailsList.innerHTML = `<div class="empty-state"><p>좌측 패널에서 정보를 입력하고<br>강의자료를 생성해주세요.</p></div>`;
            return;
        }

        this.thumbnailsList.innerHTML = '';
        this.slides.forEach((slide, index) => {
            const title = this.getSlideTitle(slide);
            const desc = slide.replace(/#+\s+.+\n?/, '').substring(0, 50) + '...';
            
            const thumb = document.createElement('div');
            thumb.className = `thumbnail-item ${index === this.currentSlideIndex ? 'active' : ''}`;
            thumb.innerHTML = `
                <div class="thumbnail-title">${index + 1}. ${title}</div>
                <div class="thumbnail-desc">${desc.replace(/[#\n\*`]/g, ' ').trim()}</div>
            `;
            
            thumb.addEventListener('click', () => {
                this.currentSlideIndex = index;
                this.renderThumbnails();
                this.renderCurrentSlide();
            });
            
            this.thumbnailsList.appendChild(thumb);
        });
    }

    updateThumbnail(index) {
        if (index >= 0 && index < this.slides.length) {
            const thumbs = this.thumbnailsList.querySelectorAll('.thumbnail-item');
            if (thumbs[index]) {
                const title = this.getSlideTitle(this.slides[index]);
                const desc = this.slides[index].replace(/#+\s+.+\n?/, '').substring(0, 50) + '...';
                thumbs[index].querySelector('.thumbnail-title').textContent = `${index + 1}. ${title}`;
                thumbs[index].querySelector('.thumbnail-desc').textContent = desc.replace(/[#\n\*`]/g, ' ').trim();
            }
        }
    }

    renderCurrentSlide() {
        if (this.slides.length === 0) {
            this.slideMarkdownEditor.value = '';
            this.slidePreviewRender.innerHTML = '';
            this.currentSlideLabel.textContent = '슬라이드 0 / 0';
            return;
        }

        const md = this.slides[this.currentSlideIndex];
        this.slideMarkdownEditor.value = md;
        this.currentSlideLabel.textContent = `슬라이드 ${this.currentSlideIndex + 1} / ${this.slides.length}`;
        this.renderSlidePreview();
    }

    renderSlidePreview() {
        if (this.slides.length === 0) return;
        const md = this.slides[this.currentSlideIndex];
        this.slidePreviewRender.innerHTML = marked.parse(md);
    }

    addSlide() {
        const newSlide = "## 새 슬라이드 제목\n\n내용을 입력하세요.";
        this.slides.splice(this.currentSlideIndex + 1, 0, newSlide);
        this.currentSlideIndex++;
        this.updateRawFromSlides();
        this.renderThumbnails();
        this.renderCurrentSlide();
        this.updateExportButtons();
    }

    deleteSlide() {
        if (this.slides.length === 0) return;
        if (this.slides.length === 1) {
            alert('최소 1개의 슬라이드는 있어야 합니다.');
            return;
        }
        if (confirm('현재 슬라이드를 삭제하시겠습니까?')) {
            this.slides.splice(this.currentSlideIndex, 1);
            if (this.currentSlideIndex >= this.slides.length) {
                this.currentSlideIndex = this.slides.length - 1;
            }
            this.updateRawFromSlides();
            this.renderThumbnails();
            this.renderCurrentSlide();
            this.updateExportButtons();
        }
    }

    regenerateSlide() {
        if (this.slides.length === 0) return;
        
        const currentTitle = this.getSlideTitle(this.slides[this.currentSlideIndex]);
        
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.remove('hidden');
        document.getElementById('loadingMessage').textContent = '현재 슬라이드를 다시 생성 중입니다...';

        window.geminiAPI.regenerateSlide(
            currentTitle,
            (chunk) => {
                let newContent = chunk.replace(/^(---|___|\*\*\*)\n*/, '');
                this.slides[this.currentSlideIndex] = newContent;
                this.updateRawFromSlides();
                this.renderThumbnails();
                this.renderCurrentSlide();
            },
            (finalContent) => {
                overlay.classList.add('hidden');
                let newContent = finalContent.replace(/^(---|___|\*\*\*)\n*/, '');
                this.slides[this.currentSlideIndex] = newContent;
                this.updateRawFromSlides();
                this.renderThumbnails();
                this.renderCurrentSlide();
            },
            (errorMsg) => {
                overlay.classList.add('hidden');
                alert(`오류가 발생했습니다: ${errorMsg}`);
            }
        );
    }

    updateExportButtons() {
        const hasContent = this.slides.length > 0;
        this.btnExportHtml.disabled = !hasContent;
        this.btnExportMd.disabled = !hasContent;
        this.btnExportPpt.disabled = !hasContent;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.slideManager = new SlideManager();
});
