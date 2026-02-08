// API Key Tab Controller

class APIKeyController {
  constructor() {
    this.currentKeyData = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadAPIKeyStatus();
  }

  bindEvents() {
    document.getElementById('save-api-key').addEventListener('click', () => {
      this.saveAPIKey();
    });

    document.getElementById('test-api-key').addEventListener('click', () => {
      this.testAPIKey();
    });

    document.getElementById('delete-api-key').addEventListener('click', () => {
      this.deleteAPIKey();
    });

    document.getElementById('toggle-key-visibility').addEventListener('click', () => {
      this.toggleKeyVisibility();
    });
  }

  async loadAPIKeyStatus() {
    try {
      const response = await api.getAPIKeyStatus();
      
      if (response.success) {
        this.currentKeyData = response;
        this.updateAPIKeyStatus(response);
      }
    } catch (error) {
      console.error('Failed to load API key status:', error);
      showToast('Failed to load API key status', 'error');
    }
  }

  updateAPIKeyStatus(keyData) {
    const statusDiv = document.getElementById('api-key-info');
    
    if (keyData.hasKey && keyData.apiKey) {
      const key = keyData.apiKey;
      statusDiv.innerHTML = `
        <div class="status-card success">
          <div class="status-header">
            <i class="fas fa-check-circle"></i>
            <span>API Key Configured</span>
          </div>
          <div class="status-details">
            <div class="detail-row">
              <label>Description:</label>
              <span>${key.description || 'No description'}</span>
            </div>
            <div class="detail-row">
              <label>Created:</label>
              <span>${formatDateTime(key.createdAt)}</span>
            </div>
            <div class="detail-row">
              <label>Last Used:</label>
              <span>${key.lastUsed ? formatDateTime(key.lastUsed) : 'Never'}</span>
            </div>
            <div class="detail-row">
              <label>Status:</label>
              <span class="status-indicator ${key.isActive ? 'online' : 'offline'}">
                <i class="fas fa-circle"></i>
                ${key.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      `;
    } else {
      statusDiv.innerHTML = `
        <div class="status-card warning">
          <div class="status-header">
            <i class="fas fa-exclamation-triangle"></i>
            <span>No API Key Configured</span>
          </div>
          <div class="status-details">
            <p>Enter your OpenRouter API key to enable AI features.</p>
            <p><strong>Note:</strong> Your API key is encrypted and stored securely on the server.</p>
          </div>
        </div>
      `;
    }
  }

  async saveAPIKey() {
    const keyInput = document.getElementById('api-key-input');
    const descriptionInput = document.getElementById('api-key-description');
    
    const key = keyInput.value.trim();
    const description = descriptionInput.value.trim();

    if (!key) {
      showToast('API key is required', 'warning');
      return;
    }

    if (!key.startsWith('sk-or-')) {
      showToast('Invalid API key format. Key should start with "sk-or-"', 'error');
      return;
    }

    try {
      showLoading();
      const response = await api.saveAPIKey(key, description);
      
      if (response.success) {
        showToast('API key saved successfully', 'success');
        keyInput.value = '';
        descriptionInput.value = '';
        await this.loadAPIKeyStatus();
        
        // Update AI chat status
        if (typeof aiChat !== 'undefined') {
          aiChat.checkAPIKeyStatus();
        }
        
        // Also refresh other tabs that might need API key status
        setTimeout(() => {
          if (typeof errors !== 'undefined') {
            errors.loadErrors();
          }
        }, 500);
      } else {
        showToast('Failed to save API key', 'error');
      }
    } catch (error) {
      console.error('API key save error:', error);
      showToast('Failed to save API key', 'error');
    } finally {
      hideLoading();
    }
  }

  async testAPIKey() {
    const keyInput = document.getElementById('api-key-input');
    const key = keyInput.value.trim();

    if (!key) {
      showToast('Please enter an API key to test', 'warning');
      return;
    }

    if (!key.startsWith('sk-or-')) {
      showToast('Invalid API key format. Key should start with "sk-or-"', 'error');
      return;
    }

    try {
      showLoading();
      const response = await api.testAPIKey(key);
      
      if (response.success) {
        showToast(`API key is valid! ${response.modelsAvailable} models available`, 'success');
      } else {
        showToast('API key test failed', 'error');
      }
    } catch (error) {
      console.error('API key test error:', error);
      showToast('API key test failed', 'error');
    } finally {
      hideLoading();
    }
  }

  async deleteAPIKey() {
    if (!this.currentKeyData || !this.currentKeyData.hasKey) {
      showToast('No API key to delete', 'warning');
      return;
    }

    if (!confirm('Are you sure you want to delete the API key? This will disable all AI features.')) {
      return;
    }

    try {
      showLoading();
      const response = await api.deleteAPIKey();
      
      if (response.success) {
        showToast('API key deleted successfully', 'success');
        document.getElementById('api-key-input').value = '';
        document.getElementById('api-key-description').value = '';
        await this.loadAPIKeyStatus();
        
        // Update AI chat status
        if (typeof aiChat !== 'undefined') {
          aiChat.checkAPIKeyStatus();
        }
        
        // Also refresh other tabs that might need API key status
        setTimeout(() => {
          if (typeof errors !== 'undefined') {
            errors.loadErrors();
          }
        }, 500);
      } else {
        showToast('Failed to delete API key', 'error');
      }
    } catch (error) {
      console.error('API key delete error:', error);
      showToast('Failed to delete API key', 'error');
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
}

// Global API key instance
let apiKey;
