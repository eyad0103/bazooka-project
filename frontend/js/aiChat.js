// AI Chat Tab Controller

class AIChatController {
  constructor() {
    this.chatHistory = [];
    this.isTyping = false;
    this.init();
  }

  init() {
    this.bindEvents();
    this.checkAPIKeyStatus();
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

  async checkAPIKeyStatus() {
    try {
      const response = await api.getAPIKeyStatus();
      const statusElement = document.getElementById('ai-status');
      
      if (response.success && response.hasKey) {
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
    } catch (error) {
      console.error('Failed to check API key status:', error);
      document.getElementById('ai-status').innerHTML = `
        <span class="status-indicator warning">
          <i class="fas fa-circle"></i>
          <span>Unknown</span>
        </span>
      `;
    }
  }

  async sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message || this.isTyping) return;

    // Add user message to chat
    this.addMessage('user', message);
    input.value = '';

    // Show typing indicator
    this.showTypingIndicator(true);

    try {
      const response = await api.chatWithAI(message, {
        totalPCs: this.getPCCount(),
        recentErrors: this.getRecentErrorsCount()
      });

      if (response.success) {
        this.addMessage('ai', response.response);
      } else if (response.requiresApiKey) {
        this.addMessage('system', 'AI features require an API key. Please configure your OpenRouter API key in the API Key tab.');
        document.querySelector('[data-tab="api-key"]').click();
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
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;

    const avatar = type === 'user' ? 
      '<i class="fas fa-user"></i>' : 
      type === 'ai' ? 
      '<i class="fas fa-robot"></i>' : 
      '<i class="fas fa-info-circle"></i>';

    messageDiv.innerHTML = `
      <div class="message-avatar">
        ${avatar}
      </div>
      <div class="message-content">
        ${content.replace(/\n/g, '<br>')}
      </div>
    `;

    // Remove welcome message if it exists
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage && type !== 'system') {
      welcomeMessage.remove();
    }

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Add to history
    this.chatHistory.push({
      type,
      content,
      timestamp: new Date().toISOString()
    });
  }

  showTypingIndicator(show) {
    this.isTyping = show;
    const messagesContainer = document.getElementById('chat-messages');
    
    // Remove existing typing indicator
    const existingIndicator = messagesContainer.querySelector('.typing-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }

    if (show) {
      const indicator = document.createElement('div');
      indicator.className = 'message ai-message typing-indicator';
      indicator.innerHTML = `
        <div class="message-avatar">
          <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      `;
      messagesContainer.appendChild(indicator);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  clearChat() {
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.innerHTML = `
      <div class="welcome-message">
        <div class="message ai-message">
          <div class="message-avatar">
            <i class="fas fa-robot"></i>
          </div>
          <div class="message-content">
            <p>Hello! I'm your PC monitoring AI assistant. I can help you:</p>
            <ul>
              <li>Explain errors and provide troubleshooting steps</li>
              <li>Analyze system performance and suggest optimizations</li>
              <li>Answer questions about your PC monitoring setup</li>
              <li>Provide guidance on system maintenance</li>
            </ul>
            <p>Feel free to ask me anything about your PC monitoring system!</p>
          </div>
        </div>
      </div>
    `;
    
    this.chatHistory = [];
    showToast('Chat cleared', 'info');
  }

  getPCCount() {
    // This would ideally come from a global state or API call
    const pcTable = document.getElementById('pc-table-body');
    if (!pcTable) return 0;
    
    const rows = pcTable.querySelectorAll('tr');
    return rows.length > 0 && !rows[0].querySelector('.no-data') ? rows.length : 0;
  }

  getRecentErrorsCount() {
    // This would ideally come from a global state or API call
    const errorTable = document.getElementById('error-table-body');
    if (!errorTable) return 0;
    
    const rows = errorTable.querySelectorAll('tr');
    return rows.length > 0 && !rows[0].querySelector('.no-data') ? rows.length : 0;
  }
}

// Global AI chat instance
let aiChat;
