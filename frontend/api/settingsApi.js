// Settings API Client - ONLY calls backend endpoints

class SettingsApiClient {
  constructor() {
    this.baseURL = window.location.origin;
  }

  async request(method, endpoint, data = null) {
    const url = `${this.baseURL}/api${endpoint}`;
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Settings API request failed:', error);
      throw error;
    }
  }

  // POST /api/settings/api-key - Save API key
  async saveApiKey(key, description = '') {
    return this.request('POST', '/settings/api-key', { key, description });
  }

  // POST /api/settings/api-key/test - Test API key
  async testApiKey(key) {
    return this.request('POST', '/settings/api-key/test', { key });
  }

  // DELETE /api/settings/api-key - Delete API key
  async deleteApiKey() {
    return this.request('DELETE', '/settings/api-key');
  }
}

module.exports = new SettingsApiClient();
