document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const btnSettings = document.getElementById('btnSettings');
    const settingsModal = document.getElementById('settingsModal');
    const closeBtn = document.querySelector('.close-btn');
    const btnSaveSettings = document.getElementById('btnSaveSettings');
    const apiKeyInput = document.getElementById('apiKey');
    
    const tabs = document.querySelectorAll('.tab');
    const viewContainers = document.querySelectorAll('.view-container');
    
    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            viewContainers.forEach(v => v.classList.remove('active'));
            
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Settings Modal
    function openSettings() {
        settingsModal.classList.add('active');
        apiKeyInput.value = localStorage.getItem('gemini_api_key') || '';
    }

    function closeSettings() {
        settingsModal.classList.remove('active');
    }

    btnSettings.addEventListener('click', openSettings);
    closeBtn.addEventListener('click', closeSettings);
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) closeSettings();
    });

    btnSaveSettings.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key && !key.startsWith('AIza')) {
            alert('API 키 형식이 올바르지 않습니다. AIza 로 시작해야 합니다.');
            return;
        }
        localStorage.setItem('gemini_api_key', key);
        closeSettings();
    });

    // Check if API key exists on load
    if (!localStorage.getItem('gemini_api_key')) {
        openSettings();
    }
});
