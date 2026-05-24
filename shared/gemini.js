/**
 * shared/gemini.js — Gemini API 공통 래퍼 모듈
 * 
 * 사용법:
 *   import 불필요 (script 태그로 로드)
 *   GeminiAPI.getApiKey()
 *   GeminiAPI.setApiKey(key)
 *   GeminiAPI.callGemini(prompt, systemPrompt?)
 *   GeminiAPI.callGeminiChat(contents, systemPrompt?)
 *   GeminiAPI.showApiKeyModal(onSuccess?)
 */

const GeminiAPI = (() => {
    const STORAGE_KEY = 'algoedu_gemini_api_key';
    const MODEL = 'gemini-2.5-flash';
    const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

    // ── API Key 관리 ──────────────────────────────
    function getApiKey() {
        return localStorage.getItem(STORAGE_KEY) || '';
    }

    function setApiKey(key) {
        localStorage.setItem(STORAGE_KEY, key.trim());
    }

    function hasApiKey() {
        return getApiKey().length > 0;
    }

    // ── 단일 프롬프트 호출 ────────────────────────
    async function callGemini(userPrompt, systemPrompt = '') {
        const apiKey = getApiKey();
        if (!apiKey) {
            throw new GeminiError('API_KEY_MISSING', 'Gemini API 키가 설정되지 않았습니다. 상단의 🔑 버튼을 눌러 API 키를 입력하세요.');
        }

        const contents = [{ role: 'user', parts: [{ text: userPrompt }] }];
        return _doRequest(contents, systemPrompt, apiKey);
    }

    // ── 멀티턴 대화 호출 ──────────────────────────
    async function callGeminiChat(contents, systemPrompt = '') {
        const apiKey = getApiKey();
        if (!apiKey) {
            throw new GeminiError('API_KEY_MISSING', 'Gemini API 키가 설정되지 않았습니다.');
        }
        return _doRequest(contents, systemPrompt, apiKey);
    }

    // ── 내부: 실제 API 호출 ───────────────────────
    async function _doRequest(contents, systemPrompt, apiKey) {
        const url = `${BASE_URL}/models/${MODEL}:generateContent?key=${apiKey}`;

        const body = { contents };

        if (systemPrompt) {
            body.systemInstruction = {
                parts: [{ text: systemPrompt }]
            };
        }

        // 안전 설정: 교육용이므로 모든 카테고리 허용
        body.safetySettings = [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ];

        body.generationConfig = {
            temperature: 0.7,
            maxOutputTokens: 4096,
        };

        let response;
        try {
            response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
        } catch (err) {
            throw new GeminiError('NETWORK_ERROR', '네트워크 연결에 실패했습니다. 인터넷 연결을 확인하세요.');
        }

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const status = response.status;

            if (status === 400) {
                throw new GeminiError('BAD_REQUEST', 'API 요청 형식이 올바르지 않습니다.');
            } else if (status === 403) {
                throw new GeminiError('API_KEY_INVALID', 'API 키가 유효하지 않습니다. 키를 다시 확인해 주세요.');
            } else if (status === 429) {
                throw new GeminiError('RATE_LIMIT', '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.');
            } else {
                const msg = errData?.error?.message || `서버 오류가 발생했습니다 (${status}).`;
                throw new GeminiError('SERVER_ERROR', msg);
            }
        }

        const data = await response.json();

        // 응답에서 텍스트 추출
        const candidate = data.candidates?.[0];
        if (!candidate || !candidate.content?.parts?.length) {
            throw new GeminiError('EMPTY_RESPONSE', 'AI로부터 응답을 받지 못했습니다. 다시 시도해 주세요.');
        }

        return candidate.content.parts[0].text;
    }

    // ── 커스텀 에러 클래스 ─────────────────────────
    class GeminiError extends Error {
        constructor(code, message) {
            super(message);
            this.name = 'GeminiError';
            this.code = code;
        }
    }

    // ── API 키 설정 모달 ──────────────────────────
    function showApiKeyModal(onSuccess = null) {
        // 기존 모달 제거
        const existing = document.getElementById('gemini-api-modal');
        if (existing) existing.remove();

        const currentKey = getApiKey();
        const maskedKey = currentKey ? currentKey.slice(0, 6) + '•'.repeat(Math.max(0, currentKey.length - 10)) + currentKey.slice(-4) : '';

        const modal = document.createElement('div');
        modal.id = 'gemini-api-modal';
        modal.innerHTML = `
            <div class="gm-overlay" onclick="document.getElementById('gemini-api-modal').remove()"></div>
            <div class="gm-dialog">
                <div class="gm-dialog-header">
                    <span>🔑 Gemini API 키 설정</span>
                    <button class="gm-close" onclick="document.getElementById('gemini-api-modal').remove()">&times;</button>
                </div>
                <div class="gm-dialog-body">
                    <p class="gm-desc">AI 기능을 사용하려면 Google Gemini API 키가 필요합니다.</p>
                    <a href="https://aistudio.google.com/apikey" target="_blank" class="gm-link">
                        → Google AI Studio에서 무료 API 키 발급받기
                    </a>
                    ${currentKey ? `<p class="gm-current">현재 키: <code>${maskedKey}</code></p>` : ''}
                    <input type="text" id="gm-key-input" class="gm-input" 
                           placeholder="API 키를 입력하세요 (AIza...)" 
                           value="${currentKey}" spellcheck="false" autocomplete="off">
                    <div class="gm-actions">
                        <button class="gm-btn gm-btn-cancel" onclick="document.getElementById('gemini-api-modal').remove()">취소</button>
                        <button class="gm-btn gm-btn-save" id="gm-save-btn">저장</button>
                    </div>
                </div>
            </div>
        `;

        // 스타일 삽입 (한 번만)
        if (!document.getElementById('gemini-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'gemini-modal-styles';
            style.textContent = `
                #gemini-api-modal { position:fixed; inset:0; z-index:99999; display:flex; align-items:center; justify-content:center; }
                .gm-overlay { position:absolute; inset:0; background:rgba(0,0,0,0.5); backdrop-filter:blur(4px); }
                .gm-dialog { position:relative; background:#fff; border-radius:20px; max-width:460px; width:90%; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); overflow:hidden; animation:gmSlideUp .3s ease; }
                @keyframes gmSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
                .gm-dialog-header { display:flex; justify-content:space-between; align-items:center; padding:1.25rem 1.5rem; border-bottom:1px solid #e2e8f0; font-weight:700; font-size:1.1rem; }
                .gm-close { background:none; border:none; font-size:1.5rem; cursor:pointer; color:#94a3b8; line-height:1; }
                .gm-close:hover { color:#0f172a; }
                .gm-dialog-body { padding:1.5rem; }
                .gm-desc { color:#475569; margin-bottom:0.75rem; font-size:0.95rem; line-height:1.5; }
                .gm-link { display:inline-block; color:#7c3aed; font-size:0.9rem; margin-bottom:1rem; text-decoration:none; font-weight:500; }
                .gm-link:hover { text-decoration:underline; }
                .gm-current { font-size:0.85rem; color:#64748b; margin-bottom:0.75rem; }
                .gm-current code { background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:0.8rem; }
                .gm-input { width:100%; padding:0.75rem 1rem; border:2px solid #e2e8f0; border-radius:12px; font-size:0.95rem; font-family:'Inter',sans-serif; outline:none; transition:border-color .2s; }
                .gm-input:focus { border-color:#7c3aed; }
                .gm-actions { display:flex; gap:0.75rem; justify-content:flex-end; margin-top:1.25rem; }
                .gm-btn { padding:0.6rem 1.25rem; border-radius:10px; border:none; font-size:0.9rem; font-weight:600; cursor:pointer; transition:all .2s; }
                .gm-btn-cancel { background:#f1f5f9; color:#475569; }
                .gm-btn-cancel:hover { background:#e2e8f0; }
                .gm-btn-save { background:linear-gradient(135deg,#7c3aed,#2563eb); color:#fff; }
                .gm-btn-save:hover { opacity:0.9; transform:translateY(-1px); }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(modal);

        // 이벤트 바인딩
        const input = document.getElementById('gm-key-input');
        const saveBtn = document.getElementById('gm-save-btn');

        input.focus();
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') saveBtn.click();
        });

        saveBtn.addEventListener('click', () => {
            const key = input.value.trim();
            if (!key) {
                input.style.borderColor = '#ef4444';
                input.placeholder = 'API 키를 입력해 주세요!';
                return;
            }
            setApiKey(key);
            modal.remove();
            if (onSuccess) onSuccess(key);
        });
    }

    // ── Public API ─────────────────────────────────
    return {
        getApiKey,
        setApiKey,
        hasApiKey,
        callGemini,
        callGeminiChat,
        showApiKeyModal,
        GeminiError,
    };
})();
