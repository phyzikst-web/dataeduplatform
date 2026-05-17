document.addEventListener('DOMContentLoaded', async () => {
    const materialList = document.getElementById('material-list');
    const viewerPlaceholder = document.getElementById('viewer-placeholder');
    const presentationContainer = document.getElementById('presentation-container');
    const canvas = document.getElementById('pdf-render');
    const ctx = canvas.getContext('2d');
    
    // PDF.js variables
    let pdfDoc = null;
    let pageNum = 1;
    let pageIsRendering = false;
    let pageNumIsPending = null;

    // Load materials list
    try {
        const response = await fetch('materials.json');
        const materials = await response.json();
        renderList(materials);
    } catch (err) {
        materialList.innerHTML = '<li style="color:#ef4444; padding:1.5rem; text-align:center;">자료 목록을 불러오지 못했습니다. 로컬 서버 환경을 확인하세요.</li>';
    }

    // Render Page
    const renderPage = num => {
        pageIsRendering = true;
        // Get page
        pdfDoc.getPage(num).then(page => {
            // Set scale (higher scale = better quality)
            const viewport = page.getViewport({ scale: 2.0 });
            canvas.height = viewport.height;
            canvas.width = viewport.width;

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

            // Output current page
            document.getElementById('page-info').textContent = `${num} / ${pdfDoc.numPages}`;
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
        if (pageNum <= 1) return;
        pageNum--;
        queueRenderPage(pageNum);
    };

    const onNextPage = () => {
        if (pageNum >= pdfDoc.numPages) return;
        pageNum++;
        queueRenderPage(pageNum);
    };

    document.getElementById('prev-page').addEventListener('click', onPrevPage);
    document.getElementById('next-page').addEventListener('click', onNextPage);

    // Fullscreen support
    document.getElementById('fullscreen-btn').addEventListener('click', () => {
        if (presentationContainer.requestFullscreen) {
            presentationContainer.requestFullscreen();
        }
    });

    // Keyboard support (Left/Right arrows & Space)
    document.addEventListener('keydown', (e) => {
        if (presentationContainer.style.display === 'flex') {
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
                
                // Show Presentation Container
                viewerPlaceholder.style.display = 'none';
                presentationContainer.style.display = 'flex';
                
                // Load PDF via PDF.js
                pdfjsLib.getDocument(item.filename).promise.then(pdfDoc_ => {
                    pdfDoc = pdfDoc_;
                    pageNum = 1;
                    renderPage(pageNum);
                }).catch(err => {
                    alert('PDF 파일을 불러오는 중 오류가 발생했습니다: ' + err.message);
                });
            });
            
            materialList.appendChild(li);
        });
    }
});
