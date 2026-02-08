// BAZOOKA PC MONITORING SYSTEM - Frontend JavaScript

class BazookaMonitor {
  constructor() {
    this.baseURL = window.location.origin;
    this.refreshInterval = 5000; // 5 seconds
    this.currentTab = 'dashboard';
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

    tabButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        this.switchTab(targetTab, button, tabSlider);
      });
    });

    // Initialize slider position
    this.updateSliderPosition(document.querySelector('.tab-btn.active'), tabSlider);
  }

  switchTab(tabName, activeButton, slider) {
    // Update button states
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    activeButton.classList.add('active');

    // Update content visibility
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Update slider position
    this.updateSliderPosition(activeButton, slider);

    // Update current tab
    this.currentTab = tabName;

    // Load tab-specific content
    this.loadTabContent(tabName);
  }

  updateSliderPosition(activeButton, slider) {
    if (slider && activeButton) {
      const buttonRect = activeButton.getBoundingClientRect();
      const navRect = activeButton.parentElement.getBoundingClientRect();
      
      slider.style.width = `${buttonRect.width}px`;
      slider.style.left = `${buttonRect.left - navRect.left}px`;
    }
  }

  loadTabContent(tabName) {
    switch(tabName) {
      case 'dashboard':
        this.loadDashboard();
        break;
      case 'errors':
        this.refreshErrors();
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
    if (e.altKey && e.key >= '1' && e.key <= '3') {
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
  });
});
