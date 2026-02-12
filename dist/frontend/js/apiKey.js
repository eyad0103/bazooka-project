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

    if (!validateApiKey(apiKey)) {
      this.showToast('Invalid API key format. OpenRouter keys start with "sk-or-v1-"', 'error');
      return;
    }

    try {
      showLoading();
      
      // Call actual API to save key
      const response = await settingsApi.saveApiKey(apiKey, description);
      
      if (response.success) {
        this.showToast('API key saved successfully', 'success');
        this.loadApiKeyStatus();
        keyInput.value = '';
        descriptionInput.value = '';
      } else {
        this.showToast(response.error || 'Failed to save API key', 'error');
      }
    } catch (error) {
      console.error('Save API key error:', error);
      this.showToast('Failed to save API key', 'error');
    } finally {
      hideLoading();
    }
  }

  async testApiKey() {
    const keyInput = document.getElementById('api-key-input');
    const apiKey = keyInput.value.trim();

    if (!apiKey) {
      this.showToast('Please enter an API key to test', 'error');
      return;
    }

    if (!validateApiKey(apiKey)) {
      this.showToast('Invalid API key format. OpenRouter keys start with "sk-or-v1-"', 'error');
      return;
    }

    try {
      showLoading();
      
      // Call actual API to test the key
      const response = await settingsApi.testApiKey(apiKey);
      
      if (response.success) {
        this.showToast('API key test passed! AI features are now available.', 'success');
      } else {
        this.showToast(response.error || 'API key test failed', 'error');
      }
    } catch (error) {
      console.error('Test API key error:', error);
      this.showToast('API key test failed', 'error');
    } finally {
      hideLoading();
    }
  }

  async deleteApiKey() {
    if (!confirm('Are you sure you want to delete the API key?')) {
      return;
    }

    try {
      showLoading();
      
      // Call actual API to delete the key
      const response = await settingsApi.deleteApiKey();
      
      if (response.success) {
        this.showToast('API key deleted successfully', 'success');
        this.loadApiKeyStatus();
      } else {
        this.showToast(response.error || 'Failed to delete API key', 'error');
      }
    } catch (error) {
      console.error('Delete API key error:', error);
      this.showToast('Failed to delete API key', 'error');
    } finally {
      hideLoading();
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
    
    try {
      // Call actual API to get status
      const response = await settingsApi.getApiKeyStatus();
      
      if (response.success && response.configured) {
        statusInfo.innerHTML = `
          <div class="status-card success">
            <div class="status-header">
              <i class="fas fa-check-circle"></i>
              API Key Configured
            </div>
            <div class="status-details">
              <p><strong>Description:</strong> ${response.description || 'No description'}</p>
              <p><strong>Created:</strong> ${formatDateTime(response.createdAt)}</p>
              <p><strong>Last Used:</strong> ${response.lastUsed ? formatDateTime(response.lastUsed) : 'Never'}</p>
            </div>
          `;
      } else {
        statusInfo.innerHTML = `
          <div class="status-card warning">
            <div class="status-header">
              <i class="fas fa-exclamation-triangle"></i>
              No API Key Configured
            </div>
            <div class="status-details">
              <p>Please configure an OpenRouter API key to enable AI features.</p>
            </div>
          `;
      }
    } catch (error) {
      console.error('Load API key status error:', error);
      statusInfo.innerHTML = `
        <div class="status-card warning">
          <div class="status-header">
            <i class="fas fa-exclamation-triangle"></i>
            No API Key Configured
          </div>
          <div class="status-details">
            <p>Please configure an OpenRouter API key to enable AI features.</p>
          </div>
        `;
    }
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

// API Key validation function
function validateApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  const trimmedKey = apiKey.trim();
  
  if (trimmedKey.length < 20) {
    return false;
  }
  
  if (!trimmedKey.startsWith('sk-or-v1-')) {
    return false;
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmedKey)) {
    return false;
  }
  
  return true;
}
