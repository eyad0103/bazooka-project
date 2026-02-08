// AI Chat Component - Uses only backend truth

const aiApi = require('../api/aiApi');
const aiStatusStore = require('../state/aiStatusStore');

class AiChatComponent {
  constructor() {
    this.chatHistory = [];
    this.isTyping = false;
    this.unsubscribe = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.subscribeToStatus();
    this.loadChatHistory();
  }

  bindEvents() {
    document.getElementById('send-message').addEventListener('click', () => {
      this.sendMessage();
    });

    document.getElementById('chat-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    document.getElementById('clear-chat').addEventListener('click', () => {
      this.clearChat();
    });
  }

  subscribeToStatus() {
    this.unsubscribe = aiStatusStore.subscribe((status) => {
      this.updateStatusUI(status);
    });
  }

  updateStatusUI(status) {
    const statusElement = document.getElementById('ai-status');
    
    if (status.configured) {
      statusElement.innerHTML = `
        <span class="status-indicator online">
          <i class="fas fa-circle"></i>
          <span>AI Available</span>
        </span>
      `;
    } else {
      statusElement.innerHTML = `
        <span class="status-indicator offline">
          <i class="fas fa-circle"></i>
          <span>API Key Required</span>
        </span>
      `;
    }
  }

  async sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message || this.isTyping) return;

    // Check if AI is available before sending
    if (!aiStatusStore.isAvailable()) {
      this.addMessage('system', 'AI features require an API key. Please configure your OpenRouter API key in the API Key Settings tab.');
      document.querySelector('[data-tab="api-key"]').click();
      return;
    }

    // Add user message to chat
    this.addMessage('user', message);
    input.value = '';

    // Show typing indicator
    this.showTypingIndicator(true);

    try {
      const response = await aiApi.chat(message, {
        totalPCs: this.getPCCount(),
        recentErrors: this.getRecentErrorsCount()
      });

      if (response.success) {
        this.addMessage('ai', response.response);
      } else {
        this.addMessage('system', `Error: ${response.error || 'Failed to get AI response'}. Please try again.`);
      }
    } catch (error) {
      console.error('AI chat error:', error);
      this.addMessage('system', 'Sorry, I encountered an error. Please try again.');
    } finally {
      this.showTypingIndicator(false);
    }
  }

  addMessage(type, content) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    
    if (type === 'user') {
      messageElement.innerHTML = `
        <div class="message-content">
          <div class="message-text">${content}</div>
          <div class="message-time">${timestamp}</div>
        </div>
      `;
    } else if (type === 'ai') {
      messageElement.innerHTML = `
        <div class="message-content">
          <div class="message-text">${content}</div>
          <div class="message-time">${timestamp}</div>
        </div>
      `;
    } else if (type === 'system') {
      messageElement.innerHTML = `
        <div class="message-content system">
          <div class="message-text">${content}</div>
          <div class="message-time">${timestamp}</div>
        </div>
      `;
    }
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Save to history
    this.chatHistory.push({ type, content, timestamp });
    this.saveChatHistory();
  }

  showTypingIndicator(show) {
    this.isTyping = show;
    const typingElement = document.getElementById('typing-indicator');
    
    if (show) {
      typingElement.style.display = 'block';
    } else {
      typingElement.style.display = 'none';
    }
  }

  clearChat() {
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.innerHTML = '';
    this.chatHistory = [];
    this.saveChatHistory();
  }

  loadChatHistory() {
    try {
      const saved = localStorage.getItem('aiChatHistory');
      if (saved) {
        this.chatHistory = JSON.parse(saved);
        this.chatHistory.forEach(msg => {
          this.addMessage(msg.type, msg.content);
        });
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  }

  saveChatHistory() {
    try {
      localStorage.setItem('aiChatHistory', JSON.stringify(this.chatHistory));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }

  getPCCount() {
    // This would be implemented to get actual PC count from dashboard
    return document.querySelectorAll('.pc-row').length || 0;
  }

  getRecentErrorsCount() {
    // This would be implemented to get actual error count from errors tab
    return document.querySelectorAll('.error-row').length || 0;
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

module.exports = AiChatComponent;
