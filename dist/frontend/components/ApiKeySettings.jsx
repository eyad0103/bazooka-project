// API Key Settings Component - Uses only backend truth

// Use global instances
const settingsApi = window.settingsApi;
const aiStatusStore = window.aiStatusStore;

class ApiKeySettingsComponent {
  constructor() {
    this.unsubscribe = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.subscribeToStatus();
    // Force initial status refresh
    aiStatusStore.refresh();
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

  subscribeToStatus() {
    this.unsubscribe = aiStatusStore.subscribe((status) => {
      this.updateAPIKeyStatusUI(status);
    });
  }

  updateAPIKeyStatusUI(status) {
    const statusDiv = document.getElementById('api-key-info');
    
    if (status.configured) {
      statusDiv.innerHTML = `
        <div class="status-card success">
          <div class="status-header">
            <i class="fas fa-check-circle"></i>
            <span>API Key Configured</span>
          </div>
          <div class="status-details">
            <div class="detail-row">
              <label>Description:</label>
              <span>${status.description || 'No description'}</span>
            </div>
            <div class="detail-row">
              <label>Created:</label>
              <span>${status.createdAt ? this.formatDateTime(status.createdAt) : 'Unknown'}</span>
            </div>
            <div class="detail-row">
              <label>Last Used:</label>
              <span>${status.lastUsed ? this.formatDateTime(status.lastUsed) : 'Never'}</span>
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
      const response = await settingsApi.saveApiKey(key, description);
      
      if (response.success) {
        showToast('API key saved successfully', 'success');
        
        // Clear input fields for security
        keyInput.value = '';
        descriptionInput.value = '';
        
        // Refresh status from backend
        await aiStatusStore.refresh();
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
      const response = await settingsApi.testApiKey(key);
      
      if (response.success) {
        if (response.valid) {
          showToast('API key is valid', 'success');
        } else {
          showToast('API key is invalid', 'error');
        }
      } else {
        showToast('Failed to test API key', 'error');
      }
    } catch (error) {
      console.error('API key test error:', error);
      showToast('Failed to test API key', 'error');
    } finally {
      hideLoading();
    }
  }

  async deleteAPIKey() {
    const status = aiStatusStore.getStatus();
    
    if (!status.configured) {
      showToast('No API key to delete', 'warning');
      return;
    }

    if (!confirm('Are you sure you want to delete the API key? This will disable all AI features.')) {
      return;
    }

    try {
      showLoading();
      const response = await settingsApi.deleteApiKey();
      
      if (response.success) {
        showToast('API key deleted successfully', 'success');
        
        // Clear input fields
        document.getElementById('api-key-input').value = '';
        document.getElementById('api-key-description').value = '';
        
        // Refresh status from backend
        await aiStatusStore.refresh();
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

  formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

// Make available globally
window.ApiKeySettingsComponent = ApiKeySettingsComponent;
