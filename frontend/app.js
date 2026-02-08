// BAZOOKA PC MONITORING SYSTEM - Frontend JavaScript

class BazookaMonitor {
  constructor() {
    this.baseURL = window.location.origin;
    this.currentTab = 'dashboard';
    this.refreshInterval = 2000; // 2 seconds
    this.refreshTimer = null;
    this.init();
  }

  async init() {
    this.setupTabNavigation();
    this.setupEventListeners();
    await this.loadDashboard();
    this.startAutoRefresh();
    this.updateLastUpdateTime();
  }

  // Tab Navigation
  setupTabNavigation() {
    const tabs = document.querySelectorAll('nav button');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        // Add active class to clicked tab and corresponding content
        tab.classList.add('active');
        const tabName = tab.dataset.tab;
        document.getElementById(tabName).classList.add('active');
        
        this.currentTab = tabName;
        this.loadTabContent(tabName);
      });
    });
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
      case 'settings':
        this.loadSettings();
        break;
    }
  }

  // Event Listeners
  setupEventListeners() {
    // Registration
    document.getElementById('register-btn').addEventListener('click', () => this.registerPC());
    document.getElementById('pc-name').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.registerPC();
    });

    // Error controls
    document.getElementById('error-filter').addEventListener('change', () => this.filterErrors());
    document.getElementById('clear-errors').addEventListener('click', () => this.clearErrors());

    // App controls
    document.getElementById('pc-filter').addEventListener('change', () => this.filterApps());

    // Settings
    document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());
    document.getElementById('reset-settings').addEventListener('click', () => this.resetSettings());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key >= '1' && e.key <= '4') {
        const tabIndex = parseInt(e.key) - 1;
        const tabButtons = document.querySelectorAll('nav button');
        if (tabButtons[tabIndex]) {
          tabButtons[tabIndex].click();
        }
      }
    });
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
      const response = await this.apiCall('/pcs', 'POST', { pcName });
      
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

      this.updateStats(pcsData.pcs, errorsData.errors);
      this.updatePCDisplay(pcsData.pcs);
      this.updateErrorsDisplay(errorsData.errors);
      this.updateLastUpdateTime();
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
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

  updatePCDisplay(pcs) {
    const container = document.getElementById('pcs-container');
    container.innerHTML = '';

    pcs.forEach(pc => {
      const card = document.createElement('div');
      card.className = 'pc-card slide-in-up';
      card.innerHTML = `
        <h3>${pc.name}</h3>
        <span class="pc-status ${pc.status.toLowerCase()}">${pc.status}</span>
        <div class="pc-metrics">
          <div class="metric">
            <div class="metric-label">CPU</div>
            <div class="metric-value">${pc.cpu}%</div>
          </div>
          <div class="metric">
            <div class="metric-label">Memory</div>
            <div class="metric-value">${pc.memory}%</div>
          </div>
        </div>
        <div style="margin-top: 15px; font-size: 0.8rem; color: var(--text-secondary);">
          Last Heartbeat: ${pc.lastHeartbeat ? new Date(pc.lastHeartbeat).toLocaleString() : 'Never'}
        </div>
      `;
      container.appendChild(card);
    });
  }

  updateErrorsDisplay(errors) {
    const container = document.getElementById('errors-container');
    container.innerHTML = '';

    if (errors.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No errors reported</p>';
      return;
    }

    errors.forEach(error => {
      const card = document.createElement('div');
      card.className = `error-card ${error.type.toLowerCase()}`;
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
          <h4 style="color: var(--text-primary); margin: 0;">${error.type}</h4>
          <span style="font-size: 0.8rem; color: var(--text-secondary);">
            ${new Date(error.timestamp).toLocaleString()}
          </span>
        </div>
        <p style="margin: 0; color: var(--text-secondary);">${error.message}</p>
        ${error.details ? `<p style="margin: 10px 0 0 0; font-size: 0.8rem; color: var(--text-muted);">${error.details}</p>` : ''}
        <p style="margin: 10px 0 0 0; font-size: 0.8rem; color: var(--text-muted);">PC: ${error.pcName}</p>
      `;
      container.appendChild(card);
    });
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
      const response = await this.apiCall('/errors');
      this.updateErrorsDisplay(response.errors);
    } catch (error) {
      console.error('Failed to refresh errors:', error);
    }
  }

  filterErrors() {
    const filter = document.getElementById('error-filter').value;
    const errorCards = document.querySelectorAll('.error-card');
    
    errorCards.forEach(card => {
      if (filter === 'all') {
        card.style.display = 'block';
      } else {
        const cardType = card.className.split(' ')[1];
        card.style.display = cardType === filter ? 'block' : 'none';
      }
    });
  }

  async clearErrors() {
    try {
      // This would need a backend endpoint to clear errors
      console.log('Clear errors functionality would need backend endpoint');
      this.showResult('Error clearing not implemented yet', 'error');
    } catch (error) {
      console.error('Failed to clear errors:', error);
    }
  }

  // Apps handling
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
      const response = await this.apiCall('/apps-status');
      this.updateAppsDisplay(response.apps);
    } catch (error) {
      console.error('Failed to refresh apps:', error);
    }
  }

  updateAppsDisplay(apps) {
    const container = document.getElementById('apps-container');
    container.innerHTML = '';

    if (apps.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No applications found</p>';
      return;
    }

    apps.forEach(app => {
      const card = document.createElement('div');
      card.className = 'app-card';
      card.innerHTML = `
        <h4>${app.name}</h4>
        <span class="app-status ${app.status.toLowerCase().replace('_', '')}">${app.status}</span>
        <div style="margin-top: 10px; font-size: 0.8rem; color: var(--text-secondary);">
          <div>Version: ${app.version}</div>
          <div>CPU: ${app.cpuUsage}</div>
          <div>Memory: ${app.memoryUsage}</div>
          <div>PC: ${app.pcName}</div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  async loadPCsForFilter() {
    try {
      const response = await this.apiCall('/pcs');
      const filter = document.getElementById('pc-filter');
      
      // Clear existing options except "All PCs"
      filter.innerHTML = '<option value="all">All PCs</option>';
      
      // Add PC options
      response.pcs.forEach(pc => {
        const option = document.createElement('option');
        option.value = pc.id;
        option.textContent = pc.name;
        filter.appendChild(option);
      });
    } catch (error) {
      console.error('Failed to load PCs for filter:', error);
    }
  }

  filterApps() {
    const filter = document.getElementById('pc-filter').value;
    const appCards = document.querySelectorAll('.app-card');
    
    appCards.forEach(card => {
      if (filter === 'all') {
        card.style.display = 'block';
      } else {
        // This would need to be implemented with proper data attributes
        card.style.display = 'block';
      }
    });
  }

  // Settings handling
  loadSettings() {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('bazooka-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      document.getElementById('refresh-rate').value = settings.refreshRate || 2;
      document.getElementById('alert-threshold').value = settings.alertThreshold || 'medium';
      document.getElementById('theme').value = settings.theme || 'futuristic';
      document.getElementById('animations').checked = settings.animations !== false;
    }
  }

  saveSettings() {
    const settings = {
      refreshRate: parseInt(document.getElementById('refresh-rate').value),
      alertThreshold: document.getElementById('alert-threshold').value,
      theme: document.getElementById('theme').value,
      animations: document.getElementById('animations').checked
    };

    localStorage.setItem('bazooka-settings', JSON.stringify(settings));
    
    // Apply refresh rate
    this.refreshInterval = settings.refreshRate * 1000;
    this.restartAutoRefresh();
    
    this.showResult('Settings saved successfully', 'success');
  }

  resetSettings() {
    const defaultSettings = {
      refreshRate: 2,
      alertThreshold: 'medium',
      theme: 'futuristic',
      animations: true
    };

    localStorage.setItem('bazooka-settings', JSON.stringify(defaultSettings));
    
    // Reset form
    document.getElementById('refresh-rate').value = defaultSettings.refreshRate;
    document.getElementById('alert-threshold').value = defaultSettings.alertThreshold;
    document.getElementById('theme').value = defaultSettings.theme;
    document.getElementById('animations').checked = defaultSettings.animations;
    
    // Apply refresh rate
    this.refreshInterval = defaultSettings.refreshRate * 1000;
    this.restartAutoRefresh();
    
    this.showResult('Settings reset to default', 'success');
  }

  restartAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    this.startAutoRefresh();
  }
}

// Global functions for HTML onclick handlers
function refreshErrors() {
  monitor.refreshErrors();
}

function filterErrors() {
  monitor.filterErrors();
}

function clearErrors() {
  monitor.clearErrors();
}

function refreshApps() {
  monitor.refreshApps();
}

function filterApps() {
  monitor.filterApps();
}

function saveSettings() {
  monitor.saveSettings();
}

function resetSettings() {
  monitor.resetSettings();
}

// Initialize when DOM is loaded
let monitor;
document.addEventListener('DOMContentLoaded', () => {
  monitor = new BazookaMonitor();
  
  // Load saved settings
  monitor.loadSavedSettings = monitor.loadSettings;
  monitor.loadSavedSettings();
  
  // Add enter key support for registration
  document.getElementById('pc-name').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      monitor.registerPC();
    }
  });
});
