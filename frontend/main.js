// BAZOOKA PC MONITORING SYSTEM - Frontend JavaScript

class BazookaMonitor {
  constructor() {
    this.baseURL = window.location.origin;
    this.currentTab = 'dashboard';
    this.refreshInterval = 5000; // 5 seconds
    this.refreshTimer = null;
    this.init();
  }

  async init() {
    this.setupTabNavigation();
    await this.loadDashboard();
    this.startAutoRefresh();
    this.updateLastUpdateTime();
  }

  // Tab Navigation
  setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const tabSlider = document.querySelector('.tab-slider');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        this.switchTab(targetTab, button, tabSlider);
      });
    });

    // Initialize slider position
    const activeButton = document.querySelector('.tab-btn.active');
    if (activeButton && tabSlider) {
      this.updateSliderPosition(activeButton, tabSlider);
    }
  }

  switchTab(tabName, button, slider) {
    // Update active states
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    button.classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Update slider
    if (slider) {
      this.updateSliderPosition(button, slider);
    }
    
    this.currentTab = tabName;
    this.loadTabContent(tabName);
  }

  updateSliderPosition(activeButton, slider) {
    const buttonRect = activeButton.getBoundingClientRect();
    const navRect = activeButton.parentElement.getBoundingClientRect();
    
    slider.style.width = `${buttonRect.width}px`;
    slider.style.left = `${buttonRect.left - navRect.left}px`;
  }

  loadTabContent(tabName) {
    switch(tabName) {
      case 'dashboard':
        this.loadDashboard();
        break;
      case 'errors':
        this.refreshErrors();
        break;
      case 'apps':
        this.loadApps();
        break;
      case 'ai-chat':
        this.loadAIChat();
        break;
      case 'settings':
        this.loadSettings();
        break;
    }
  }

  // API Calls
  async apiCall(endpoint, method = 'GET', data = null) {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(endpoint, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  // Registration
  async registerPC() {
    const pcNameInput = document.getElementById('pc-name');
    const resultDiv = document.getElementById('registration-result');
    const pcName = pcNameInput.value.trim();

    if (!pcName) {
      this.showResult('Please enter a PC name', 'error');
      return;
    }

    try {
      const response = await this.apiCall('/register-pc', 'POST', { pcName });
      
      this.showResult(`PC "${pcName}" registered successfully! API Key: ${response.apiKey}`, 'success');
      pcNameInput.value = '';
      
      await this.loadDashboard();
    } catch (error) {
      this.showResult('Failed to register PC', 'error');
    }
  }

  showResult(message, type) {
    const resultDiv = document.getElementById('registration-result');
    resultDiv.textContent = message;
    resultDiv.className = `result-message ${type}`;
    resultDiv.style.display = 'block';

    // Add animation class
    if (type === 'success') {
      resultDiv.classList.add('success-flash');
    } else if (type === 'error') {
      resultDiv.classList.add('error-shake');
    }

    setTimeout(() => {
      resultDiv.style.display = 'none';
      resultDiv.classList.remove('success-flash', 'error-shake');
    }, 5000);
  }

  // Load Dashboard Data
  async loadDashboard() {
    try {
      const [pcsData, errorsData] = await Promise.all([
        this.apiCall('/pcs'),
        this.apiCall('/errors')
      ]);

      this.updateStats(pcsData.pcs, errorsData.errors);
      this.updatePCDisplay(pcsData.pcs);
      this.updateErrorsDisplay(errorsData.errors);
      this.updateLastUpdateTime();
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      this.showResult('Failed to load dashboard data', 'error');
    }
  }

  updatePCDisplay(pcs) {
    const container = document.getElementById('pcs-container');
    
    if (pcs.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No PCs registered yet.</p>';
      return;
    }

    container.innerHTML = pcs.map((pc, index) => this.createPCCard(pc, index)).join('');
    
    // Animate cards appearing
    const cards = container.querySelectorAll('.pc-card');
    cards.forEach((card, i) => {
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0) scale(1)';
      }, i * 100);
    });
  }

  createPCCard(pc, index) {
    const statusClass = pc.status.toLowerCase().replace('_', '');
    const lastHeartbeat = new Date(pc.lastHeartbeat).toLocaleString();
    const registrationDate = new Date(pc.registrationDate).toLocaleDateString();
    
    // Determine metric colors
    const cpuClass = pc.cpu > 80 ? 'high' : pc.cpu > 50 ? 'medium' : 'low';
    const memoryClass = pc.memory > 80 ? 'high' : pc.memory > 50 ? 'medium' : 'low';
    const heartbeatClass = this.getHeartbeatClass(pc.lastHeartbeat);
    
    return `
      <div class="pc-card ${statusClass}" style="opacity: 0; transform: translateY(30px) scale(0.9); transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);">
        <div class="pc-header">
          <div class="pc-name">${pc.name}</div>
          <div class="pc-status ${statusClass}">${pc.status.replace('_', ' ')}</div>
        </div>
        <div class="pc-info">
          <div class="info-item">
            <span class="info-label">ID:</span>
            <span class="info-value">${pc.id}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Registered:</span>
            <span class="info-value">${registrationDate}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Last Heartbeat:</span>
            <span class="info-value">${lastHeartbeat}</span>
          </div>
        </div>
        <div class="pc-metrics">
          <div class="metric">
            <div class="metric-value">${pc.cpu || 0}%</div>
            <div class="metric-label">CPU</div>
            <div class="metric-bar">
              <div class="metric-bar-fill ${cpuClass}" style="width: ${pc.cpu || 0}%"></div>
            </div>
          </div>
          <div class="metric">
            <div class="metric-value">${pc.memory || 0}%</div>
            <div class="metric-label">Memory</div>
            <div class="metric-bar">
              <div class="metric-bar-fill ${memoryClass}" style="width: ${pc.memory || 0}%"></div>
            </div>
          </div>
          <div class="metric">
            <div class="metric-value">${this.getHeartbeatText(pc.lastHeartbeat)}</div>
            <div class="metric-label">Heartbeat</div>
            <div class="metric-bar">
              <div class="metric-bar-fill ${heartbeatClass}" style="width: ${this.getHeartbeatWidth(pc.lastHeartbeat)}%"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getHeartbeatClass(lastHeartbeat) {
    const now = new Date();
    const last = new Date(lastHeartbeat);
    const diffSeconds = (now - last) / 1000;
    
    if (diffSeconds < 60) return 'high';
    if (diffSeconds < 300) return 'medium';
    return 'low';
  }

  getHeartbeatText(lastHeartbeat) {
    const now = new Date();
    const last = new Date(lastHeartbeat);
    const diffSeconds = (now - last) / 1000;
    
    if (diffSeconds < 60) return 'Active';
    if (diffSeconds < 300) return `${Math.floor(diffSeconds / 60)}m ago`;
    return `${Math.floor(diffSeconds / 60)}m ago`;
  }

  getHeartbeatWidth(lastHeartbeat) {
    const now = new Date();
    const last = new Date(lastHeartbeat);
    const diffSeconds = (now - last) / 1000;
    
    if (diffSeconds < 60) return 100;
    if (diffSeconds < 300) return 60;
    return 20;
  }

  updateStats(pcs, errors) {
    const onlinePCs = pcs.filter(pc => pc.status === 'ONLINE').length;
    const offlinePCs = pcs.filter(pc => pc.status === 'OFFLINE').length;
    const recentErrors = errors.filter(error => {
      const errorTime = new Date(error.timestamp);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return errorTime > fiveMinutesAgo;
    }).length;

    document.getElementById('total-pcs').textContent = pcs.length;
    document.getElementById('online-pcs').textContent = onlinePCs;
    document.getElementById('offline-pcs').textContent = offlinePCs;
    document.getElementById('error-count').textContent = recentErrors;
  }

  // Load AI Chat Content
  loadAIChat() {
    this.setupAIChat();
    this.loadChatHistory();
  }

  setupAIChat() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-message');
    const clearBtn = document.getElementById('clear-chat');
    const exportBtn = document.getElementById('export-chat');
    
    if (sendBtn && !sendBtn.hasAttribute('data-listener')) {
      sendBtn.setAttribute('data-listener', 'true');
      sendBtn.addEventListener('click', () => this.sendAIMessage());
    }
    
    if (chatInput && !chatInput.hasAttribute('data-listener')) {
      chatInput.setAttribute('data-listener', 'true');
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendAIMessage();
        }
      });
    }
    
    if (clearBtn && !clearBtn.hasAttribute('data-listener')) {
      clearBtn.setAttribute('data-listener', 'true');
      clearBtn.addEventListener('click', () => this.clearChat());
    }
    
    if (exportBtn && !exportBtn.hasAttribute('data-listener')) {
      exportBtn.setAttribute('data-listener', 'true');
      exportBtn.addEventListener('click', () => this.exportChat());
    }
    
    // Initialize WebSocket for real-time updates
    this.initWebSocket();
  }

  initWebSocket() {
    if (this.ws) {
      this.ws.close();
    }
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      // Subscribe to real-time updates
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        subscriptions: ['heartbeat', 'error-reported', 'apps-updated', 'ai-chat']
      }));
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after 3 seconds
      setTimeout(() => this.initWebSocket(), 3000);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'heartbeat':
        // Update PC in real-time
        this.updatePCInRealTime(data.data);
        break;
      case 'error-reported':
        // Add new error in real-time
        this.addErrorInRealTime(data.data);
        break;
      case 'apps-updated':
        // Update apps in real-time
        this.updateAppsInRealTime(data.data);
        break;
      case 'ai-chat':
        // Add AI messages in real-time
        this.addAIMessagesInRealTime(data.data);
        break;
    }
  }

  updatePCInRealTime(pcData) {
    // Update PC card in dashboard if visible
    const pcCard = document.querySelector(`[data-pc-id="${pcData.pcId}"]`);
    if (pcCard) {
      // Update metrics
      const cpuElement = pcCard.querySelector('.metric-value');
      const memoryElement = pcCard.querySelectorAll('.metric-value')[1];
      const statusElement = pcCard.querySelector('.pc-status');
      
      if (cpuElement) cpuElement.textContent = `${pcData.cpu}%`;
      if (memoryElement) memoryElement.textContent = `${pcData.memory}%`;
      if (statusElement) {
        statusElement.textContent = pcData.status;
        statusElement.className = `pc-status ${pcData.status.toLowerCase().replace('_', '')}`;
      }
    }
  }

  addErrorInRealTime(errorData) {
    // Add error to errors tab if visible
    if (this.currentTab === 'errors') {
      this.addErrorToDisplay(errorData.error);
    }
  }

  updateAppsInRealTime(appsData) {
    // Update apps tab if visible
    if (this.currentTab === 'apps') {
      this.refreshApps();
    }
  }

  addAIMessagesInRealTime(chatData) {
    // Add AI messages to chat if visible
    if (this.currentTab === 'ai-chat') {
      chatData.messages.forEach(msg => {
        this.addMessageToChat(msg);
      });
    }
  }

  async sendAIMessage() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-message');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Disable input and button
    chatInput.disabled = true;
    sendBtn.disabled = true;
    
    // Show typing indicator
    this.showTypingIndicator(true);
    
    // Add user message to chat
    this.addMessageToChat({
      type: 'user',
      message: message,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Get current PC data for context
      const pcsData = await this.apiCall('/pcs');
      const errorsData = await this.apiCall('/errors');
      
      const context = {
        pcs: pcsData.pcs,
        errors: errorsData.errors.slice(0, 5), // Last 5 errors
        timestamp: new Date().toISOString()
      };
      
      const response = await this.apiCall('/api/ai-chat', 'POST', {
        message: message,
        sessionId: 'default',
        context: context
      });
      
      // Add AI response to chat
      this.addMessageToChat({
        type: 'assistant',
        message: response.message,
        timestamp: response.timestamp,
        model: response.model
      });
      
      // Clear input
      chatInput.value = '';
      
    } catch (error) {
      console.error('AI Chat error:', error);
      this.addMessageToChat({
        type: 'error',
        message: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      });
    } finally {
      // Re-enable input and button
      chatInput.disabled = false;
      sendBtn.disabled = false;
      
      // Hide typing indicator
      this.showTypingIndicator(false);
      
      // Focus input
      chatInput.focus();
    }
  }

  addMessageToChat(message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${message.type}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = message.type === 'user' ? '👤' : '🤖';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = `<p>${message.message}</p>`;
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    // Remove welcome message if it exists
    const welcomeMessage = chatMessages.querySelector('.welcome-message');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }
    
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  showTypingIndicator(show) {
    const indicator = document.getElementById('typing-indicator');
    if (show) {
      indicator.classList.add('active');
    } else {
      indicator.classList.remove('active');
    }
  }

  async loadChatHistory() {
    try {
      const response = await this.apiCall('/api/ai-chat/default');
      const messages = response.messages;
      
      const chatMessages = document.getElementById('chat-messages');
      
      // Clear existing messages except welcome
      const welcomeMessage = chatMessages.querySelector('.welcome-message');
      chatMessages.innerHTML = '';
      
      if (welcomeMessage) {
        chatMessages.appendChild(welcomeMessage);
      }
      
      // Add historical messages
      messages.forEach(msg => {
        this.addMessageToChat(msg);
      });
      
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  }

  async clearChat() {
    try {
      await this.apiCall('/api/ai-chat/default', 'DELETE');
      
      const chatMessages = document.getElementById('chat-messages');
      chatMessages.innerHTML = '';
      
      // Add welcome message back
      const welcomeMessage = document.createElement('div');
      welcomeMessage.className = 'welcome-message';
      welcomeMessage.innerHTML = `
        <div class="ai-avatar">🤖</div>
        <div class="message-content">
          <p>Hello! I'm your Bazooka PC Monitoring AI assistant. I can help you:</p>
          <ul>
            <li>Analyze system performance and metrics</li>
            <li>Troubleshoot PC issues and errors</li>
            <li>Provide optimization recommendations</li>
            <li>Explain monitoring data and trends</li>
          </ul>
          <p>Feel free to ask me anything about your PC monitoring data!</p>
        </div>
      `;
      chatMessages.appendChild(welcomeMessage);
      
      this.showResult('Chat history cleared', 'success');
      
    } catch (error) {
      console.error('Failed to clear chat:', error);
      this.showResult('Failed to clear chat', 'error');
    }
  }

  async exportChat() {
    try {
      const response = await this.apiCall('/api/ai-chat/default');
      const messages = response.messages;
      
      const chatText = messages.map(msg => 
        `[${msg.type.toUpperCase()}] ${new Date(msg.timestamp).toLocaleString()}\n${msg.message}`
      ).join('\n\n');
      
      // Create download
      const blob = new Blob([chatText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bazooka-ai-chat-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      this.showResult('Chat exported successfully', 'success');
      
    } catch (error) {
      console.error('Failed to export chat:', error);
      this.showResult('Failed to export chat', 'error');
    }
  }
  async loadApps() {
    try {
      await this.refreshApps();
      await this.loadPCsForFilter();
    } catch (error) {
      console.error('Failed to load apps:', error);
    }
  }

  async refreshApps() {
    try {
      const appsData = await this.apiCall('/apps-status');
      this.updateAppsDisplay(appsData.apps);
    } catch (error) {
      console.error('Failed to refresh apps:', error);
      const container = document.getElementById('apps-container');
      container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Failed to load applications</p>';
    }
  }

  async loadPCsForFilter() {
    try {
      const pcsData = await this.apiCall('/pcs');
      const filter = document.getElementById('pc-filter');
      
      // Clear existing options except "All PCs"
      filter.innerHTML = '<option value="all">All PCs</option>';
      
      // Add PC options
      pcsData.pcs.forEach(pc => {
        const option = document.createElement('option');
        option.value = pc.id;
        option.textContent = pc.name;
        filter.appendChild(option);
      });
    } catch (error) {
      console.error('Failed to load PCs for filter:', error);
    }
  }

  updateAppsDisplay(apps) {
    const container = document.getElementById('apps-container');
    const filter = document.getElementById('pc-filter').value;
    
    const filteredApps = filter === 'all' 
      ? apps 
      : apps.filter(app => app.pcId === filter);

    if (filteredApps.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No applications to display.</p>';
      return;
    }

    container.innerHTML = filteredApps.map(app => this.createAppCard(app)).join('');
  }

  createAppCard(app) {
    const statusClass = app.status.toLowerCase().replace('_', '');
    const lastUpdated = new Date(app.lastUpdated).toLocaleString();
    
    // Get appropriate icon for app
    const appIcon = this.getAppIcon(app.name);
    
    return `
      <div class="app-card ${statusClass}">
        <div class="app-header">
          <div class="app-icon">${appIcon}</div>
          <div class="app-name">${app.name}</div>
          <div class="app-status ${statusClass}">${app.status.replace('_', ' ')}</div>
        </div>
        <div class="app-details">
          <div class="app-info">
            <span><strong>PC:</strong> <span class="pc-name">${app.pcName}</span></span>
            <span><strong>Version:</strong> ${app.version || 'N/A'}</span>
          </div>
          <div class="app-info">
            <span><strong>Last Updated:</strong> ${lastUpdated}</span>
          </div>
          ${app.memoryUsage || app.cpuUsage ? `
            <div class="app-metrics">
              ${app.memoryUsage ? `
                <div class="metric">
                  <span class="metric-value">${app.memoryUsage}</span>
                  <span class="metric-label">Memory</span>
                </div>
              ` : ''}
              ${app.cpuUsage ? `
                <div class="metric">
                  <span class="metric-value">${app.cpuUsage}</span>
                  <span class="metric-label">CPU</span>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  getAppIcon(appName) {
    const icons = {
      'chrome': '🌐',
      'firefox': '🦊',
      'edge': '📘',
      'code': '💻',
      'vscode': '💻',
      'node': '🟢',
      'python': '🐍',
      'java': '☕',
      'docker': '🐳',
      'mysql': '🗄️',
      'mongodb': '🍃',
      'nginx': '🌍',
      'apache': '🪶',
      'spotify': '🎵',
      'discord': '💬',
      'slack': '📱',
      'steam': '🎮',
      'office': '📄',
      'excel': '📊',
      'word': '📝',
      'powerpoint': '📽️'
    };
    
    const name = appName.toLowerCase();
    for (const [key, icon] of Object.entries(icons)) {
      if (name.includes(key)) {
        return icon;
      }
    }
    
    // Default icons based on common patterns
    if (name.includes('browser') || name.includes('web')) return '🌐';
    if (name.includes('editor') || name.includes('code')) return '💻';
    if (name.includes('game') || name.includes('play')) return '🎮';
    if (name.includes('music') || name.includes('audio')) return '🎵';
    if (name.includes('video') || name.includes('media')) return '🎬';
    if (name.includes('database') || name.includes('db')) return '🗄️';
    if (name.includes('server') || name.includes('service')) return '🖥️';
    
    return '📱'; // Default icon
  }

  filterApps() {
    this.refreshApps();
  }

  // Load Settings Content
  loadSettings() {
    const saveBtn = document.querySelector('.save-btn');
    const resetBtn = document.querySelector('.reset-btn');

    if (saveBtn && !saveBtn.hasAttribute('data-listener')) {
      saveBtn.setAttribute('data-listener', 'true');
      saveBtn.addEventListener('click', () => this.saveSettings());
    }

    if (resetBtn && !resetBtn.hasAttribute('data-listener')) {
      resetBtn.setAttribute('data-listener', 'true');
      resetBtn.addEventListener('click', () => this.resetSettings());
    }
  }

  saveSettings() {
    const refreshRate = document.getElementById('refresh-rate').value;
    const alertThreshold = document.getElementById('alert-threshold').value;
    const theme = document.getElementById('theme').value;
    const animations = document.getElementById('animations').checked;

    // Validate refresh rate
    if (refreshRate < 1 || refreshRate > 60) {
      this.showResult('Refresh rate must be between 1 and 60 seconds', 'error');
      return;
    }

    // Save settings to localStorage
    const settings = {
      refreshRate: parseInt(refreshRate),
      alertThreshold,
      theme,
      animations,
      savedAt: new Date().toISOString()
    };

    localStorage.setItem('bazooka-settings', JSON.stringify(settings));
    
    // Apply settings immediately
    this.applySettings(settings);
    
    this.showResult('Settings saved successfully!', 'success');

    // Send settings to backend if needed
    this.syncSettingsWithBackend(settings);
  }

  resetSettings() {
    // Reset to defaults
    document.getElementById('refresh-rate').value = '5';
    document.getElementById('alert-threshold').value = 'medium';
    document.getElementById('theme').value = 'futuristic';
    document.getElementById('animations').checked = true;

    // Clear localStorage
    localStorage.removeItem('bazooka-settings');
    
    // Apply default settings
    const defaultSettings = {
      refreshRate: 5,
      alertThreshold: 'medium',
      theme: 'futuristic',
      animations: true
    };
    
    this.applySettings(defaultSettings);
    this.showResult('Settings reset to default!', 'success');
  }

  applySettings(settings) {
    // Apply refresh rate
    if (settings.refreshRate) {
      this.refreshInterval = settings.refreshRate * 1000;
      this.restartAutoRefresh();
      console.log(`Refresh rate set to ${settings.refreshRate} seconds`);
    }

    // Apply theme
    if (settings.theme) {
      this.applyTheme(settings.theme);
    }

    // Apply animations
    if (settings.animations !== undefined) {
      this.toggleAnimations(settings.animations);
    }

    // Apply alert threshold
    if (settings.alertThreshold) {
      this.setAlertThreshold(settings.alertThreshold);
    }
  }

  applyTheme(theme) {
    const body = document.body;
    body.className = body.className.replace(/theme-\w+/g, '');
    body.classList.add(`theme-${theme}`);
    
    // You can define different theme CSS classes
    switch(theme) {
      case 'classic':
        // Apply classic theme overrides
        break;
      case 'dark':
        // Apply dark theme overrides
        break;
      case 'futuristic':
      default:
        // Default futuristic theme
        break;
    }
  }

  toggleAnimations(enabled) {
    const style = document.createElement('style');
    style.id = 'animation-toggle';
    
    if (!enabled) {
      style.textContent = '* { animation: none !important; transition: none !important; }';
      document.head.appendChild(style);
    } else {
      const existingStyle = document.getElementById('animation-toggle');
      if (existingStyle) {
        existingStyle.remove();
      }
    }
  }

  setAlertThreshold(threshold) {
    // Store alert threshold for error filtering
    this.alertThreshold = threshold;
    console.log(`Alert threshold set to ${threshold}`);
  }

  async syncSettingsWithBackend(settings) {
    try {
      // Optional: Sync settings with backend
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        console.warn('Failed to sync settings with backend');
      }
    } catch (error) {
      console.warn('Backend sync not available:', error.message);
    }
  }

  restartAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    this.startAutoRefresh();
  }

  // Auto Refresh
  startAutoRefresh() {
    this.refreshTimer = setInterval(() => {
      this.loadDashboard();
    }, this.refreshInterval);
  }

  updateLastUpdateTime() {
    const lastUpdateElement = document.getElementById('last-update');
    if (lastUpdateElement) {
      lastUpdateElement.textContent = `Last Update: ${new Date().toLocaleTimeString()}`;
    }
  }

  // Error handling
  async refreshErrors() {
    try {
      const errorsData = await this.apiCall('/errors');
      this.updateErrorsDisplay(errorsData.errors);
    } catch (error) {
      console.error('Failed to refresh errors:', error);
    }
  }

  updateErrorsDisplay(errors) {
    const container = document.getElementById('errors-container');
    
    if (errors.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No errors reported.</p>';
      return;
    }

    container.innerHTML = errors.map(error => this.createErrorCard(error)).join('');
  }

  createErrorCard(error) {
    const timestamp = new Date(error.timestamp).toLocaleString();
    const typeClass = error.type.toLowerCase();
    
    return `
      <div class="error-card ${typeClass}">
        <div class="error-header">
          <div class="error-type">${error.type}</div>
          <div class="error-time">${timestamp}</div>
        </div>
        <div class="error-pc">PC: ${error.pcName}</div>
        <div class="error-message">${error.message}</div>
      </div>
    `;
  }

  filterErrors() {
    // Implementation for error filtering
    this.refreshErrors();
  }

  // Load saved settings on startup
  loadSavedSettings() {
    const savedSettings = localStorage.getItem('bazooka-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        
        // Apply settings to form
        if (settings.refreshRate) {
          document.getElementById('refresh-rate').value = settings.refreshRate;
        }
        
        if (settings.alertThreshold) {
          document.getElementById('alert-threshold').value = settings.alertThreshold;
        }
        
        if (settings.theme) {
          document.getElementById('theme').value = settings.theme;
        }
        
        if (settings.animations !== undefined) {
          document.getElementById('animations').checked = settings.animations;
        }
        
        // Apply the settings
        this.applySettings(settings);
        
        console.log('Settings loaded from localStorage:', settings);
      } catch (error) {
        console.error('Failed to load saved settings:', error);
        // Clear corrupted settings
        localStorage.removeItem('bazooka-settings');
      }
    }
  }
}

// Global Functions for HTML onclick handlers
let monitor;

function registerPC() {
  monitor.registerPC();
}

function refreshErrors() {
  monitor.refreshErrors();
}

function filterErrors() {
  monitor.filterErrors();
}

function refreshApps() {
  monitor.refreshApps();
}

function filterApps() {
  monitor.filterApps();
}

function sendAIMessage() {
  monitor.sendAIMessage();
}

function clearChat() {
  monitor.clearChat();
}

function exportChat() {
  monitor.exportChat();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  monitor = new BazookaMonitor();
  
  // Load saved settings
  monitor.loadSavedSettings();
  
  // Add enter key support for registration
  document.getElementById('pc-name').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      registerPC();
    }
  });

  // Handle window resize for tab slider
  window.addEventListener('resize', () => {
    const activeButton = document.querySelector('.tab-btn.active');
    const slider = document.querySelector('.tab-slider');
    if (activeButton && slider) {
      monitor.updateSliderPosition(activeButton, slider);
    }
  });

  // Add keyboard navigation for tabs
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key >= '1' && e.key <= '5') {
      const tabIndex = parseInt(e.key) - 1;
      const tabButtons = document.querySelectorAll('.tab-btn');
      if (tabButtons[tabIndex]) {
        tabButtons[tabIndex].click();
      }
    }
  });

  // Add settings keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      if (monitor.currentTab === 'settings') {
        monitor.saveSettings();
      }
    }
    
    if (e.ctrlKey && e.key === 'r') {
      e.preventDefault();
      if (monitor.currentTab === 'settings') {
        monitor.resetSettings();
      }
    }
    
    // AI Chat shortcuts
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      if (monitor.currentTab === 'ai-chat') {
        document.getElementById('chat-input').focus();
      }
    }
    
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      if (monitor.currentTab === 'ai-chat') {
        monitor.clearChat();
      }
    }
  });
});
