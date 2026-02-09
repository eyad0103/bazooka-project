// API Key Settings Component

class ApiKeySettingsComponent {
  constructor() {
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadApiKeyStatus();
  }

  bindEvents() {
    const saveBtn = document.getElementById('save-api-key');
    const testBtn = document.getElementById('test-api-key');
    const deleteBtn = document.getElementById('delete-api-key');
    const toggleBtn = document.getElementById('toggle-key-visibility');

    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveApiKey());
    }

    if (testBtn) {
      testBtn.addEventListener('click', () => this.testApiKey());
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => this.deleteApiKey());
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleKeyVisibility());
    }
  }

  async saveApiKey() {
    const keyInput = document.getElementById('api-key-input');
    const descriptionInput = document.getElementById('api-key-description');
    
    const apiKey = keyInput.value.trim();
    const description = descriptionInput.value.trim();

    if (!apiKey) {
      this.showToast('Please enter an API key', 'error');
      return;
    }

    try {
      // Placeholder for actual API call
      this.showToast('API key saved successfully (placeholder)', 'success');
      this.loadApiKeyStatus();
    } catch (error) {
      this.showToast('Failed to save API key', 'error');
    }
  }

  async testApiKey() {
    const keyInput = document.getElementById('api-key-input');
    const apiKey = keyInput.value.trim();

    if (!apiKey) {
      this.showToast('Please enter an API key to test', 'error');
      return;
    }

    try {
      // Placeholder for actual API test
      this.showToast('API key test passed (placeholder)', 'success');
    } catch (error) {
      this.showToast('API key test failed', 'error');
    }
  }

  async deleteApiKey() {
    if (!confirm('Are you sure you want to delete the API key?')) {
      return;
    }

    try {
      // Placeholder for actual API call
      this.showToast('API key deleted successfully (placeholder)', 'success');
      this.loadApiKeyStatus();
    } catch (error) {
      this.showToast('Failed to delete API key', 'error');
    }
  }

  toggleKeyVisibility() {
    const keyInput = document.getElementById('api-key-input');
    const toggleBtn = document.getElementById('toggle-key-visibility');
    
    if (keyInput.type === 'password') {
      keyInput.type = 'text';
      toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
      keyInput.type = 'password';
      toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
    }
  }

  async loadApiKeyStatus() {
    const statusInfo = document.getElementById('api-key-info');
    
    // Placeholder for actual API status
    statusInfo.innerHTML = `
      <div class="status-card warning">
        <div class="status-header">
          <i class="fas fa-exclamation-triangle"></i>
          No API Key Configured
        </div>
        <div class="status-details">
          <p>Please configure an OpenRouter API key to enable AI features.</p>
        </div>
      </div>
    `;
  }

  showToast(message, type = 'info') {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#2563eb'};
      color: white;
      border-radius: 6px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  destroy() {
    // Cleanup if needed
  }
}
