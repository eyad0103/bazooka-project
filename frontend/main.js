// BAZOOKA PC MONITORING SYSTEM - Frontend JavaScript

class BazookaMonitor {
  constructor() {
    this.baseURL = window.location.origin;
    this.refreshInterval = 5000; // 5 seconds
    this.init();
  }

  async init() {
    await this.loadDashboard();
    this.startAutoRefresh();
    this.updateLastUpdateTime();
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

      const response = await fetch(`${this.baseURL}${endpoint}`, options);
      
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
      const result = await this.apiCall('/register-pc', 'POST', { pcName });
      
      this.showResult(`PC "${pcName}" registered successfully! API Key: ${result.pc.apiKey}`, 'success');
      pcNameInput.value = '';
      
      // Refresh dashboard after registration
      setTimeout(() => this.loadDashboard(), 1000);
      
    } catch (error) {
      this.showResult(`Registration failed: ${error.message}`, 'error');
    }
  }

  showResult(message, type) {
    const resultDiv = document.getElementById('registration-result');
    resultDiv.textContent = message;
    resultDiv.className = `result-message ${type}`;
    resultDiv.style.display = 'block';

    setTimeout(() => {
      resultDiv.style.display = 'none';
    }, 5000);
  }

  // Load Dashboard Data
  async loadDashboard() {
    try {
      const [pcsData, errorsData] = await Promise.all([
        this.apiCall('/pcs'),
        this.apiCall('/errors')
      ]);

      this.updatePCsDisplay(pcsData.pcs);
      this.updateErrorsDisplay(errorsData.errors);
      this.updateStats(pcsData.pcs, errorsData.errors);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  }

  // Update PCs Display
  updatePCsDisplay(pcs) {
    const container = document.getElementById('pcs-container');
    
    if (pcs.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No PCs registered yet. Register your first PC above!</p>';
      return;
    }

    container.innerHTML = pcs.map(pc => this.createPCCard(pc)).join('');
  }

  createPCCard(pc) {
    const statusClass = pc.status.toLowerCase();
    const lastHeartbeat = new Date(pc.lastHeartbeat).toLocaleString();
    
    return `
      <div class="pc-card ${statusClass}">
        <div class="pc-name">${pc.name}</div>
        <div class="pc-status">
          <div class="status-dot ${statusClass}"></div>
          <span>${pc.status}</span>
        </div>
        <div class="pc-info">
          <div>🆔 ID: ${pc.id}</div>
          <div>💓 Last: ${lastHeartbeat}</div>
          <div>📅 Registered: ${new Date(pc.registrationDate).toLocaleDateString()}</div>
        </div>
      </div>
    `;
  }

  // Update Errors Display
  updateErrorsDisplay(errors) {
    const container = document.getElementById('errors-container');
    const filter = document.getElementById('error-filter').value;
    
    const filteredErrors = filter === 'all' 
      ? errors 
      : errors.filter(error => error.errorType === filter);

    if (filteredErrors.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No errors to display.</p>';
      return;
    }

    container.innerHTML = filteredErrors.map(error => this.createErrorItem(error)).join('');
  }

  createErrorItem(error) {
    const time = new Date(error.timestamp).toLocaleString();
    
    return `
      <div class="error-item">
        <div class="error-header">
          <span class="error-type">${error.errorType}</span>
          <span class="error-pc">${error.pcName}</span>
        </div>
        <div class="error-message">${error.message}</div>
        <div class="error-time">${time}</div>
      </div>
    `;
  }

  // Update Statistics
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

  // Auto Refresh
  startAutoRefresh() {
    setInterval(() => {
      this.loadDashboard();
      this.updateLastUpdateTime();
    }, this.refreshInterval);
  }

  updateLastUpdateTime() {
    const now = new Date().toLocaleTimeString();
    document.getElementById('last-update').textContent = `Last Update: ${now}`;
  }

  // Manual Refresh
  async refreshErrors() {
    try {
      const errorsData = await this.apiCall('/errors');
      this.updateErrorsDisplay(errorsData.errors);
      this.updateStats(
        Array.from(document.querySelectorAll('.pc-card')).length ? 
          await this.apiCall('/pcs').then(d => d.pcs) : [],
        errorsData.errors
      );
    } catch (error) {
      console.error('Failed to refresh errors:', error);
    }
  }

  // Filter Errors
  filterErrors() {
    this.loadDashboard();
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  monitor = new BazookaMonitor();
  
  // Add enter key support for registration
  document.getElementById('pc-name').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      registerPC();
    }
  });
});
