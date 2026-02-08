// Main Application Controller

class BazookaMonitoringApp {
  constructor() {
    this.currentTab = 'dashboard';
    this.controllers = {};
    this.init();
  }

  init() {
    this.initializeControllers();
    this.bindEvents();
    this.checkConnection();
    this.showTab('dashboard');
  }

  initializeControllers() {
    // Initialize all tab controllers
    this.controllers.dashboard = new DashboardController();
    this.controllers.errors = new ErrorsController();
    
    // Initialize new AI components
    const AiChatComponent = require('../components/AiChat.jsx');
    const ApiKeySettingsComponent = require('../components/ApiKeySettings.jsx');
    const aiStatusStore = require('../state/aiStatusStore');
    
    this.controllers.aiChat = new AiChatComponent();
    this.controllers.apiKey = new ApiKeySettingsComponent();
    this.controllers.pcManagement = new PCManagementController();

    // Start AI status monitoring
    aiStatusStore.startPeriodicCheck();

    // Make them globally available
    window.dashboard = this.controllers.dashboard;
    window.errors = this.controllers.errors;
    window.aiChat = this.controllers.aiChat;
    window.apiKey = this.controllers.apiKey;
    window.pcManagement = this.controllers.pcManagement;
  }

  bindEvents() {
    // Tab navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabName = e.target.closest('.nav-btn').dataset.tab;
        this.showTab(tabName);
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key >= '1' && e.key <= '5') {
        const tabIndex = parseInt(e.key) - 1;
        const tabs = ['dashboard', 'errors', 'ai-chat', 'api-key', 'pc-management'];
        if (tabs[tabIndex]) {
          this.showTab(tabs[tabIndex]);
        }
      }
    });

    // Connection status monitoring
    setInterval(() => {
      this.checkConnection();
    }, 30000); // Check every 30 seconds
  }

  async checkConnection() {
    try {
      const response = await api.getHealth();
      const statusElement = document.getElementById('connection-status');
      
      if (response.status === 'healthy') {
        statusElement.className = 'status-indicator online';
        statusElement.innerHTML = '<i class="fas fa-circle"></i><span>Online</span>';
      } else {
        statusElement.className = 'status-indicator offline';
        statusElement.innerHTML = '<i class="fas fa-circle"></i><span>Offline</span>';
      }
    } catch (error) {
      const statusElement = document.getElementById('connection-status');
      statusElement.className = 'status-indicator offline';
      statusElement.innerHTML = '<i class="fas fa-circle"></i><span>Offline</span>';
    }
  }

  showTab(tabName) {
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    this.currentTab = tabName;

    // Initialize tab-specific functionality
    this.initializeTab(tabName);
  }

  initializeTab(tabName) {
    // Tab-specific initialization can be done here
    switch (tabName) {
      case 'dashboard':
        // Dashboard is already initialized
        break;
      case 'errors':
        // Errors tab is already initialized
        break;
      case 'ai-chat':
        // AI chat is already initialized
        break;
      case 'api-key':
        // API key tab is already initialized
        break;
      case 'pc-management':
        // PC management is already initialized
        break;
    }
  }

  destroy() {
    // Clean up all controllers
    Object.values(this.controllers).forEach(controller => {
      if (controller.destroy) {
        controller.destroy();
      }
    });
  }
}

// Add custom styles for dynamic elements
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
  .pc-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .pc-name i {
    color: var(--primary-color);
  }

  .last-seen {
    display: flex;
    flex-direction: column;
  }

  .pc-actions {
    display: flex;
    gap: 0.5rem;
  }

  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }

  .error-time {
    display: flex;
    flex-direction: column;
  }

  .error-pc {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .error-pc i {
    color: var(--secondary-color);
  }

  .error-type {
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .severity-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .severity-critical {
    background-color: var(--danger-color);
    color: white;
  }

  .severity-high {
    background-color: #dc2626;
    color: white;
  }

  .severity-medium {
    background-color: var(--warning-color);
    color: white;
  }

  .severity-low {
    background-color: var(--secondary-color);
    color: white;
  }

  .error-message {
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .error-actions {
    display: flex;
    gap: 0.5rem;
  }

  .resolved-badge {
    color: var(--success-color);
    font-weight: 500;
  }

  .pending-badge {
    color: var(--warning-color);
    font-weight: 500;
  }

  .detail-section {
    margin-bottom: 1.5rem;
  }

  .detail-section h4 {
    color: var(--text-primary);
    margin-bottom: 1rem;
    font-size: 1.1rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .detail-row:last-child {
    border-bottom: none;
  }

  .detail-row label {
    font-weight: 500;
    color: var(--text-secondary);
    min-width: 120px;
  }

  .error-message-full {
    background-color: var(--dark-bg);
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    padding: 1rem;
    white-space: pre-wrap;
    font-family: monospace;
    font-size: 0.875rem;
    line-height: 1.4;
  }

  .error-details-json {
    background-color: var(--dark-bg);
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    padding: 1rem;
    font-family: monospace;
    font-size: 0.8rem;
    overflow-x: auto;
    max-height: 200px;
    overflow-y: auto;
  }

  .ai-explanation {
    background-color: var(--dark-bg);
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    padding: 1.5rem;
    line-height: 1.6;
  }

  .typing-dots {
    display: flex;
    gap: 0.25rem;
  }

  .typing-dots span {
    width: 0.5rem;
    height: 0.5rem;
    background-color: var(--text-secondary);
    border-radius: 50%;
    animation: typing 1.4s infinite;
  }

  .typing-dots span:nth-child(2) {
    animation-delay: 0.2s;
  }

  .typing-dots span:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes typing {
    0%, 60%, 100% {
      transform: translateY(0);
    }
    30% {
      transform: translateY(-10px);
    }
  }

  .status-card {
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-bottom: 1rem;
  }

  .status-card.success {
    border-color: var(--success-color);
    background-color: rgba(22, 163, 74, 0.1);
  }

  .status-card.warning {
    border-color: var(--warning-color);
    background-color: rgba(217, 119, 6, 0.1);
  }

  .status-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    font-weight: 600;
    font-size: 1.1rem;
  }

  .status-details {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .info-card {
    background-color: var(--dark-bg);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-bottom: 1rem;
  }

  .info-card h4 {
    color: var(--primary-color);
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .info-card p {
    margin-bottom: 1rem;
    color: var(--text-secondary);
  }

  .info-card ul {
    margin-left: 1.5rem;
    margin-bottom: 1rem;
  }

  .info-card li {
    margin-bottom: 0.5rem;
    color: var(--text-secondary);
  }

  .info-card code {
    background-color: var(--dark-bg);
    border: 1px solid var(--border-color);
    border-radius: 0.25rem;
    padding: 0.25rem 0.5rem;
    font-family: monospace;
    font-size: 0.875rem;
  }

  .pc-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
`;
document.head.appendChild(additionalStyles);

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new BazookaMonitoringApp();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (window.app) {
    window.app.destroy();
  }
});
