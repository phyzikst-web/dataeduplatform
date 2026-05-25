async function initMaterialsApp() {
    // Configure PDF.js worker path
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    }

    const materialList = document.getElementById('material-list');
    const viewerPlaceholder = document.getElementById('viewer-placeholder');
    const viewerContainer = document.getElementById('viewer-container');
    const canvas = document.getElementById('pdf-canvas');
    const viewerControls = document.getElementById('viewer-controls');
    
    let ctx = null;
    if (canvas) {
        ctx = canvas.getContext('2d');
    }
    
    // PDF.js variables
    let pdfDoc = null;
    let pageNum = 1;
    let pageIsRendering = false;
    let pageNumIsPending = null;

    // Create a container for download cards if it doesn't exist
    let downloadCardContainer = document.getElementById('download-card-container');
    if (!downloadCardContainer) {
        downloadCardContainer = document.createElement('div');
        downloadCardContainer.id = 'download-card-container';
        downloadCardContainer.style.width = '100%';
        downloadCardContainer.style.height = '100%';
        downloadCardContainer.style.display = 'none'; // Initially hidden
        downloadCardContainer.style.alignItems = 'center';
        downloadCardContainer.style.justifyContent = 'center';
        downloadCardContainer.style.padding = '2rem';
        viewerContainer.appendChild(downloadCardContainer);
    }

    // Load materials list from materials.js
    if (typeof LECTURE_MATERIALS !== 'undefined' && LECTURE_MATERIALS.length > 0) {
        renderList(LECTURE_MATERIALS);
        // Automatically load the first material (12주차) immediately with a small delay for safety
        setTimeout(() => {
            const firstItem = materialList.querySelector('.material-item');
            if (firstItem) {
                firstItem.click();
            }
        }, 150);
    } else {
        materialList.innerHTML = '<li style="color:#ef4444; padding:1.5rem; text-align:center;">자료 목록을 불러오지 못했습니다. LECTURE_MATERIALS 변수를 찾을 수 없습니다.</li>';
    }

    // Render Page
    const renderPage = num => {
        if (!pdfDoc || !canvas || !ctx) return;
        pageIsRendering = true;
        
        // Get page
        pdfDoc.getPage(num).then(page => {
            // Set scale (higher scale = better quality)
            const viewport = page.getViewport({ scale: 1.5 });
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.style.display = 'block';

            const renderCtx = {
                canvasContext: ctx,
                viewport: viewport
            };

            page.render(renderCtx).promise.then(() => {
                pageIsRendering = false;
                if (pageNumIsPending !== null) {
                    renderPage(pageNumIsPending);
                    pageNumIsPending = null;
                }
            });

            // Output current page info
            document.getElementById('current-page').textContent = num;
            document.getElementById('total-pages').textContent = pdfDoc.numPages;
        });
    };

    // Check for pages rendering
    const queueRenderPage = num => {
        if (pageIsRendering) {
            pageNumIsPending = num;
        } else {
            renderPage(num);
        }
    };

    const onPrevPage = () => {
        if (!pdfDoc || pageNum <= 1) return;
        pageNum--;
        queueRenderPage(pageNum);
    };

    const onNextPage = () => {
        if (!pdfDoc || pageNum >= pdfDoc.numPages) return;
        pageNum++;
        queueRenderPage(pageNum);
    };

    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    if (prevBtn) prevBtn.addEventListener('click', onPrevPage);
    if (nextBtn) nextBtn.addEventListener('click', onNextPage);

    // Fullscreen support
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn && viewerContainer) {
        fullscreenBtn.addEventListener('click', () => {
            if (viewerContainer.requestFullscreen) {
                viewerContainer.requestFullscreen();
            }
        });
    }

    // Keyboard support (Left/Right arrows & Space)
    document.addEventListener('keydown', (e) => {
        if (pdfDoc && canvas && canvas.style.display !== 'none') {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                onNextPage();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                onPrevPage();
            }
        }
    });

    function renderList(materials) {
        materialList.innerHTML = '';
        
        materials.forEach(item => {
            const li = document.createElement('li');
            li.className = 'material-item';
            
            li.innerHTML = `
                <div class="item-week">${item.week}</div>
                <div class="item-title">${item.title}</div>
            `;
            
            li.addEventListener('click', () => {
                // Remove active class from all
                document.querySelectorAll('.material-item').forEach(el => el.classList.remove('active'));
                li.classList.add('active');
                
                // Hide placeholder
                if (viewerPlaceholder) viewerPlaceholder.style.display = 'none';
                
                const isPdf = item.filename.toLowerCase().endsWith('.pdf');
                
                if (isPdf) {
                    // Show PDF viewer elements
                    canvas.style.display = 'block';
                    if (viewerControls) viewerControls.style.display = 'flex';
                    downloadCardContainer.style.display = 'none';
                    
                    // Load PDF via PDF.js
                    pdfjsLib.getDocument(item.filename).promise.then(pdfDoc_ => {
                        pdfDoc = pdfDoc_;
                        pageNum = 1;
                        renderPage(pageNum);
                    }).catch(err => {
                        console.error(err);
                        alert('PDF 파일을 불러오는 중 오류가 발생했습니다. 파일이 해당 경로에 있는지 확인해 주세요: ' + err.message);
                    });
                } else {
                    // Show Download card instead of PDF Canvas
                    canvas.style.display = 'none';
                    if (viewerControls) viewerControls.style.display = 'none';
                    downloadCardContainer.style.display = 'flex';
                    
                    // Render custom premium download card
                    renderDownloadCard(item);
                }
            });
            
            materialList.appendChild(li);
        });
    }

    function renderDownloadCard(item) {
        const ext = item.filename.split('.').pop().toLowerCase();
        let iconHtml = '';
        let fileTypeLabel = '';
        let themeColor = '';
        let desc = '';
        
        if (ext === 'pptx') {
            iconHtml = `
                <div class="file-icon-wrapper" style="background: linear-gradient(135deg, #ffedd5 0%, #ffdbc2 100%); border: 1px solid #fed7aa; box-shadow: 0 10px 25px -5px rgba(234, 88, 12, 0.15);">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#ea580c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="6 2 18 2 18 18 6 22 6 2"></polygon>
                        <line x1="10" y1="7" x2="14" y2="7"></line>
                        <line x1="10" y1="11" x2="14" y2="11"></line>
                        <circle cx="12" cy="16" r="1"></circle>
                    </svg>
                    <div class="icon-badge" style="background-color: #ea580c;">PPTX</div>
                </div>
            `;
            fileTypeLabel = 'PowerPoint Presentation (.pptx)';
            themeColor = '#ea580c'; // Orange-600
            desc = '12주차 문자열 검색 수업용 공식 강의자료 슬라이드 파일입니다. 다운로드하여 오프라인에서 강의 진행 및 복습용 슬라이드로 활용하실 수 있습니다.';
        } else if (ext === 'docx') {
            iconHtml = `
                <div class="file-icon-wrapper" style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 1px solid #93c5fd; box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.15);">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="6 2 18 2 18 18 6 22 6 2"></polygon>
                        <line x1="9" y1="7" x2="15" y2="7"></line>
                        <line x1="9" y1="11" x2="15" y2="11"></line>
                        <line x1="9" y1="15" x2="13" y2="15"></line>
                    </svg>
                    <div class="icon-badge" style="background-color: #2563eb;">DOCX</div>
                </div>
            `;
            fileTypeLabel = 'Word Document (.docx)';
            themeColor = '#2563eb'; // Blue-600
            desc = '12주차 연습문제 및 정답 해설 워드 파일입니다. 다운로드하여 상세한 주석 및 보완 풀이 문항을 자유롭게 확인해 보세요.';
        } else if (ext === 'ipynb') {
            iconHtml = `
                <div class="file-icon-wrapper" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #fcd34d; box-shadow: 0 10px 25px -5px rgba(217, 119, 6, 0.15);">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="6 2 18 2 18 18 6 22 6 2"></polygon>
                        <circle cx="12" cy="10" r="3"></circle>
                        <line x1="12" y1="2" x2="12" y2="7"></line>
                    </svg>
                    <div class="icon-badge" style="background-color: #d97706;">IPYNB</div>
                </div>
            `;
            fileTypeLabel = 'Jupyter Notebook (.ipynb)';
            themeColor = '#d97706'; // Amber-600
            desc = '12주차 문자열 검색 실습 및 정답 해설 주피터 노트북 파일입니다. 다운로드하여 주피터 환경에서 대조 실행을 해보거나, 개념 학습 모드에서 즉시 불러올 수 있습니다.';
        } else {
            iconHtml = `
                <div class="file-icon-wrapper" style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border: 1px solid #cbd5e1; box-shadow: 0 10px 25px -5px rgba(100, 116, 139, 0.15);">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <div class="icon-badge" style="background-color: #475569;">FILE</div>
                </div>
            `;
            fileTypeLabel = 'Lecture Material File';
            themeColor = '#475569';
            desc = '수업 학습을 돕기 위해 선생님께서 등록하신 보조 교육 자료 파일입니다. 다운로드하여 활용해 보세요.';
        }

        let embedHtml = '';
        if (ext === 'pptx' || ext === 'docx') {
            const baseUrl = window.location.hostname.includes('github.io') 
                ? window.location.href.substring(0, window.location.href.lastIndexOf('/')) 
                : 'https://phyzikst-web.github.io/dataeduplatform/materials';
            const fileUrl = encodeURIComponent(`${baseUrl}/${item.filename}`);
            const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${fileUrl}`;
            
            embedHtml = `
                <div class="embed-container" style="margin-top: 2rem; margin-bottom: 2rem; width: 100%; max-width: 900px; height: 60vh; border-radius: 12px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
                    <iframe src="${viewerUrl}" width="100%" height="100%" frameborder="0" title="Office Viewer"></iframe>
                    <div style="text-align: center; font-size: 0.85rem; color: #64748b; padding: 0.75rem; background: #f8fafc; border-top: 1px solid #cbd5e1;">
                        ※ 미리보기가 안 나올 경우, 상단의 다운로드 버튼을 이용해 주세요. (로컬 환경에서는 미리보기가 지원되지 않습니다)
                    </div>
                </div>
            `;
        }

        downloadCardContainer.style.flexDirection = 'column';
        downloadCardContainer.style.justifyContent = 'flex-start';
        downloadCardContainer.style.overflowY = 'auto';

        downloadCardContainer.innerHTML = `
            <div class="download-card" style="margin-top: 2rem; flex-shrink: 0;">
                ${iconHtml}
                <div class="file-meta-tag" style="background-color: ${themeColor}12; color: ${themeColor}; border: 1px solid ${themeColor}20;">
                    ${fileTypeLabel}
                </div>
                <h3 class="file-title">${item.title}</h3>
                <p class="file-desc">${desc}</p>
                <div class="file-details">
                    <div class="detail-row">
                        <span class="detail-lbl">과정 주차</span>
                        <span class="detail-val-badge">${item.week}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-lbl">파일명</span>
                        <span class="detail-val-code">${item.filename}</span>
                    </div>
                </div>
                <a href="${item.filename}" download class="download-btn-premium" style="background: linear-gradient(135deg, ${themeColor}e0, ${themeColor}); box-shadow: 0 10px 25px -5px ${themeColor}33;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    학습 자료 다운로드
                </a>
            </div>
            ${embedHtml}
        `;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMaterialsApp);
} else {
    initMaterialsApp();
}
