// algo/ai-chat/app.js

const systemPrompt = `당신은 자료구조 및 알고리즘을 가르치는 친절한 대학 강사입니다. 
전문대 학생 수준에 맞춰 쉽고 간결하게 한국어로 설명하세요. 
필요하면 Python 코드 예시를 포함하세요. 핵심 개념은 비유를 사용하여 이해하기 쉽게 설명하세요. 
마크다운 형식으로 답변하세요.`;

let conversationHistory = [];

document.addEventListener('DOMContentLoaded', () => {
    const inputEl = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const chatMessages = document.getElementById('chat-messages');
    
    // Auto-resize textarea
    inputEl.addEventListener('input', () => {
        inputEl.style.height = 'auto';
        inputEl.style.height = Math.min(inputEl.scrollHeight, 150) + 'px';
        sendBtn.disabled = inputEl.value.trim() === '';
    });

    // Handle Enter key (Shift+Enter for newline, Enter to send)
    inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!sendBtn.disabled) sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);

    // Initial check for API Key
    if (!GeminiAPI.hasApiKey()) {
        setTimeout(() => GeminiAPI.showApiKeyModal(), 1000);
    }

    document.getElementById('api-key-btn').addEventListener('click', () => {
        GeminiAPI.showApiKeyModal();
    });

    document.getElementById('clear-chat-btn').addEventListener('click', () => {
        if (confirm('대화 내용을 모두 지우시겠습니까?')) {
            conversationHistory = [];
            // Keep only the first welcome message
            const welcomeMsg = chatMessages.firstElementChild;
            chatMessages.innerHTML = '';
            chatMessages.appendChild(welcomeMsg);
            inputEl.value = '';
            inputEl.style.height = 'auto';
            inputEl.focus();
        }
    });

    async function sendMessage() {
        const text = inputEl.value.trim();
        if (!text) return;

        // Add User Message UI
        appendUserMessage(text);
        
        // Reset Input
        inputEl.value = '';
        inputEl.style.height = 'auto';
        sendBtn.disabled = true;
        
        // Record Usage
        LearningTracker.recordAIUsage({ 
            feature: 'chat', 
            topic: text.substring(0, 30) + (text.length > 30 ? '...' : '')
        });

        // Add to history
        conversationHistory.push({ role: 'user', parts: [{ text }] });

        // Show Typing Indicator
        const typingId = appendTypingIndicator();
        scrollToBottom();

        try {
            // Call Gemini
            const responseText = await GeminiAPI.callGeminiChat(conversationHistory, systemPrompt);
            
            // Add to history
            conversationHistory.push({ role: 'model', parts: [{ text: responseText }] });
            
            // Remove typing indicator & show response
            document.getElementById(typingId).remove();
            appendAiMessage(responseText);
        } catch (error) {
            document.getElementById(typingId).remove();
            // Remove the failed user message from history
            conversationHistory.pop();
            
            if (error.code === 'API_KEY_MISSING') {
                GeminiAPI.showApiKeyModal(() => {
                    // Retry on success
                    inputEl.value = text;
                    sendBtn.disabled = false;
                });
            } else {
                appendErrorMessage(error.message);
            }
        }
        
        scrollToBottom();
    }

    function appendUserMessage(text) {
        const row = document.createElement('div');
        row.className = 'message-row user';
        
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        // Escape HTML
        const safeText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

        row.innerHTML = `
            <div class="message-bubble">
                <div class="message-content">
                    <p>${safeText}</p>
                </div>
                <div class="timestamp">${timeStr}</div>
            </div>
        `;
        chatMessages.appendChild(row);
    }

    function appendAiMessage(markdown) {
        const row = document.createElement('div');
        row.className = 'message-row ai';
        
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        // Parse markdown
        const htmlContent = marked.parse(markdown);

        row.innerHTML = `
            <div class="avatar">🧠</div>
            <div class="message-bubble">
                <div class="message-content">${htmlContent}</div>
                <div class="timestamp">${timeStr}</div>
            </div>
        `;
        chatMessages.appendChild(row);

        // Apply syntax highlighting
        row.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }

    function appendTypingIndicator() {
        const id = 'typing-' + Date.now();
        const row = document.createElement('div');
        row.id = id;
        row.className = 'message-row ai';
        row.innerHTML = `
            <div class="avatar">🧠</div>
            <div class="message-bubble" style="padding: 1rem 1.5rem;">
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(row);
        return id;
    }

    function appendErrorMessage(msg) {
        const row = document.createElement('div');
        row.className = 'message-row ai error';
        row.innerHTML = `
            <div class="avatar">⚠️</div>
            <div class="message-bubble">
                <div class="message-content">
                    <p><strong>오류 발생:</strong> ${msg}</p>
                    <p>다시 시도해 주세요.</p>
                </div>
            </div>
        `;
        chatMessages.appendChild(row);
    }

    function scrollToBottom() {
        const container = document.querySelector('.chat-container');
        container.scrollTop = container.scrollHeight;
    }
});
