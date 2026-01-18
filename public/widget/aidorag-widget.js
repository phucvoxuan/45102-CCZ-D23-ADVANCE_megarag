/**
 * AIDORag Embeddable Chat Widget
 * Version: 1.0.0
 * Usage: <script src="https://aidorag.com/widget/aidorag-widget.js" data-widget-key="wgt_xxx"></script>
 */
(function() {
  'use strict';

  // Configuration
  const VERSION = '1.0.0';
  const API_BASE = window.AIDORAG_API_URL || (
    window.location.hostname === 'localhost'
      ? 'http://localhost:3000'
      : 'https://aidorag.com'
  );

  // Get widget key
  const scriptTag = document.currentScript;
  const widgetKey = scriptTag?.getAttribute('data-widget-key');

  if (!widgetKey) {
    console.error('[AIDORag] Missing data-widget-key attribute');
    return;
  }

  // State
  let config = null;
  let conversationId = null;
  let isOpen = false;
  let isLoading = false;

  // Generate visitor ID
  const getVisitorId = () => {
    let id = localStorage.getItem('aidorag_vid');
    if (!id) {
      id = 'v_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('aidorag_vid', id);
    }
    return id;
  };
  const visitorId = getVisitorId();

  // Fetch config
  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/widget/${widgetKey}/config`);
      if (!res.ok) throw new Error('Config fetch failed');
      config = await res.json();
      init();
    } catch (err) {
      console.error('[AIDORag]', err);
    }
  };

  // Initialize widget
  const init = () => {
    createStyles();
    createWidget();
    loadHistory();

    // Auto open
    if (config.autoOpenDelay > 0) {
      setTimeout(() => !isOpen && toggleWidget(), config.autoOpenDelay * 1000);
    }

    console.log(`[AIDORag] Widget v${VERSION} initialized`);
  };

  // Create styles
  const createStyles = () => {
    const theme = config.theme || {};
    const primaryColor = theme.primaryColor || '#3B82F6';
    const position = theme.position || 'bottom-right';
    const [vert, horiz] = position.split('-');

    const style = document.createElement('style');
    style.id = 'aidorag-widget-styles';
    style.textContent = `
      #aidorag-widget {
        position: fixed;
        ${vert}: 20px;
        ${horiz}: 20px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      #aidorag-widget * {
        box-sizing: border-box;
      }

      .aidorag-btn {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${primaryColor};
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.2s;
      }

      .aidorag-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(0,0,0,0.2);
      }

      .aidorag-btn svg {
        width: 28px;
        height: 28px;
        fill: white;
      }

      .aidorag-window {
        display: none;
        position: absolute;
        ${vert}: 76px;
        ${horiz}: 0;
        width: 380px;
        max-width: calc(100vw - 40px);
        height: 520px;
        max-height: calc(100vh - 120px);
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        flex-direction: column;
        overflow: hidden;
      }

      .aidorag-window.open {
        display: flex;
        animation: aidorag-slide 0.3s ease;
      }

      @keyframes aidorag-slide {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .aidorag-header {
        background: ${primaryColor};
        color: white;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .aidorag-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .aidorag-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .aidorag-info { flex: 1; }
      .aidorag-info h3 { margin: 0; font-size: 16px; font-weight: 600; }
      .aidorag-info p { margin: 4px 0 0; font-size: 12px; opacity: 0.9; }

      .aidorag-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        opacity: 0.8;
      }

      .aidorag-close:hover { opacity: 1; }

      .aidorag-new-chat {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        cursor: pointer;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 12px;
        opacity: 0.9;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .aidorag-new-chat:hover {
        opacity: 1;
        background: rgba(255,255,255,0.3);
      }

      .aidorag-new-chat svg {
        width: 14px;
        height: 14px;
      }

      .aidorag-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .aidorag-msg {
        max-width: 85%;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.5;
        word-wrap: break-word;
      }

      .aidorag-msg.user {
        background: ${primaryColor};
        color: white;
        align-self: flex-end;
        border-bottom-right-radius: 4px;
      }

      .aidorag-msg.assistant {
        background: #f3f4f6;
        color: #1f2937;
        align-self: flex-start;
        border-bottom-left-radius: 4px;
      }

      .aidorag-citations {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(0,0,0,0.1);
        font-size: 11px;
        color: #6b7280;
      }

      .aidorag-typing {
        display: flex;
        gap: 4px;
        padding: 14px 16px;
      }

      .aidorag-typing span {
        width: 8px;
        height: 8px;
        background: #9ca3af;
        border-radius: 50%;
        animation: aidorag-bounce 1.4s infinite;
      }

      .aidorag-typing span:nth-child(2) { animation-delay: 0.2s; }
      .aidorag-typing span:nth-child(3) { animation-delay: 0.4s; }

      @keyframes aidorag-bounce {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-4px); }
      }

      .aidorag-input-area {
        padding: 12px 16px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
      }

      .aidorag-input {
        flex: 1;
        padding: 10px 14px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }

      .aidorag-input:focus {
        border-color: ${primaryColor};
      }

      .aidorag-send {
        padding: 10px 16px;
        background: ${primaryColor};
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: opacity 0.2s;
      }

      .aidorag-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .aidorag-powered {
        text-align: center;
        padding: 8px;
        font-size: 11px;
        color: #9ca3af;
        border-top: 1px solid #f3f4f6;
      }

      .aidorag-powered a {
        color: #6b7280;
        text-decoration: none;
      }

      .aidorag-powered a:hover {
        color: ${primaryColor};
      }
    `;
    document.head.appendChild(style);
  };

  // Create widget HTML
  const createWidget = () => {
    const lang = config.defaultLanguage || 'vi';
    const welcome = config.welcomeMessage?.[lang] || config.welcomeMessage?.vi || 'Xin chao!';
    const placeholder = config.placeholder?.[lang] || config.placeholder?.vi || 'Nhap tin nhan...';

    const container = document.createElement('div');
    container.id = 'aidorag-widget';
    container.innerHTML = `
      <div class="aidorag-window" id="aidorag-window">
        <div class="aidorag-header">
          <div class="aidorag-avatar">
            ${config.botAvatarUrl
              ? `<img src="${config.botAvatarUrl}" alt="">`
              : `<svg viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>`
            }
          </div>
          <div class="aidorag-info">
            <h3>${config.botName || 'AI Assistant'}</h3>
            <p>Online</p>
          </div>
          <button class="aidorag-new-chat" id="aidorag-new-chat" title="${lang === 'vi' ? 'Cuộc trò chuyện mới' : 'New conversation'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span>${lang === 'vi' ? 'Mới' : 'New'}</span>
          </button>
          <button class="aidorag-close" onclick="window.AIDORag.close()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="aidorag-messages" id="aidorag-messages">
          <div class="aidorag-msg assistant">${welcome}</div>
        </div>

        <div class="aidorag-input-area">
          <input type="text" class="aidorag-input" id="aidorag-input" placeholder="${placeholder}" autocomplete="off">
          <button class="aidorag-send" id="aidorag-send">${lang === 'vi' ? 'Gui' : 'Send'}</button>
        </div>

        ${config.showPoweredBy !== false ? `
          <div class="aidorag-powered">
            Powered by <a href="https://aidorag.com" target="_blank" rel="noopener">AIDORag</a>
          </div>
        ` : ''}
      </div>

      <button class="aidorag-btn" id="aidorag-btn">
        <svg viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
          <path d="M7 9h10v2H7zm0-3h10v2H7z"/>
        </svg>
      </button>
    `;
    document.body.appendChild(container);

    // Events
    document.getElementById('aidorag-btn').onclick = toggleWidget;
    document.getElementById('aidorag-send').onclick = sendMessage;
    document.getElementById('aidorag-new-chat').onclick = clearHistory;
    document.getElementById('aidorag-input').onkeypress = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    };
  };

  // Toggle widget
  const toggleWidget = () => {
    isOpen = !isOpen;
    const win = document.getElementById('aidorag-window');
    const btn = document.getElementById('aidorag-btn');

    win.classList.toggle('open', isOpen);
    btn.innerHTML = isOpen
      ? `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`
      : `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h10v2H7zm0-3h10v2H7z"/></svg>`;

    if (isOpen) document.getElementById('aidorag-input').focus();
  };

  // Send message
  const sendMessage = async () => {
    if (isLoading) return;

    const input = document.getElementById('aidorag-input');
    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    addMessage(message, 'user');

    isLoading = true;
    const typingEl = addTyping();

    try {
      const res = await fetch(`${API_BASE}/api/widget/${widgetKey}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId,
          visitorId,
          pageUrl: window.location.href,
          pageTitle: document.title,
          language: config.defaultLanguage || 'vi'
        })
      });

      removeTyping(typingEl);

      if (res.ok) {
        const data = await res.json();
        conversationId = data.conversationId;
        addMessage(data.message.content, 'assistant', data.message.citations);
      } else {
        const err = await res.json();
        addMessage(err.error || 'Da co loi xay ra. Vui long thu lai.', 'assistant');
      }
    } catch (err) {
      removeTyping(typingEl);
      addMessage('Khong the ket noi. Vui long thu lai.', 'assistant');
    } finally {
      isLoading = false;
    }
  };

  // Add message to UI
  const addMessage = (content, role, citations = []) => {
    const container = document.getElementById('aidorag-messages');
    const el = document.createElement('div');
    el.className = `aidorag-msg ${role}`;

    // Basic markdown
    let html = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');

    el.innerHTML = html;

    if (citations && citations.length > 0) {
      const citEl = document.createElement('div');
      citEl.className = 'aidorag-citations';
      citEl.innerHTML = citations.map(c => `<span style="display:block;margin-bottom:4px;">📄 ${c.source || c.document_name || c.file_name || 'Source'}</span>`).join('');
      el.appendChild(citEl);
    }

    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
  };

  // Typing indicator
  const addTyping = () => {
    const container = document.getElementById('aidorag-messages');
    const el = document.createElement('div');
    el.className = 'aidorag-msg assistant';
    el.innerHTML = '<div class="aidorag-typing"><span></span><span></span><span></span></div>';
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
    return el;
  };

  const removeTyping = (el) => el?.remove();

  // Load history
  const loadHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/widget/${widgetKey}/history?visitorId=${visitorId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.conversationId) {
          conversationId = data.conversationId;
          const container = document.getElementById('aidorag-messages');
          // Clear welcome message if has history
          if (data.messages?.length > 0) {
            container.innerHTML = '';
            data.messages.forEach(m => addMessage(m.content, m.role, m.citations));
          }
        }
      }
    } catch (err) {
      // Ignore history load errors
    }
  };

  // Clear history and start new conversation
  const clearHistory = () => {
    // Reset conversation ID
    conversationId = null;

    // Get welcome message based on language
    const lang = config.defaultLanguage || 'vi';
    const welcome = config.welcomeMessage?.[lang] || config.welcomeMessage?.vi || 'Xin chao!';

    // Clear messages and show welcome message
    const container = document.getElementById('aidorag-messages');
    container.innerHTML = `<div class="aidorag-msg assistant">${welcome}</div>`;

    // Focus input
    document.getElementById('aidorag-input').focus();

    console.log('[AIDORag] Conversation cleared, starting new chat');
  };

  // Public API
  window.AIDORag = {
    open: () => !isOpen && toggleWidget(),
    close: () => isOpen && toggleWidget(),
    toggle: toggleWidget,
    clearHistory: clearHistory,
    newChat: clearHistory
  };

  // Start
  fetchConfig();
})();
