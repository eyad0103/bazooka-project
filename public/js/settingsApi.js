// Settings API Client

class SettingsApiClient {
  constructor() {
    this.baseURL = window.location.origin;
    this.defaultTimeout = 10000;
  }

  async request(method, endpoint, data = null, options = {}) {
    const url = `${this.baseURL}/api${endpoint}`;
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: options.timeout || this.defaultTimeout,
      ...options
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

  async getApiKeyStatus() {
    return this.request('GET', '/settings/api-key');
  }

  async saveApiKey(key, description) {
    return this.request('POST', '/settings/api-key', { key, description });
  }

  async deleteApiKey() {
    return this.request('DELETE', '/settings/api-key');
  }

  async testApiKey(key) {
    return this.request('POST', '/settings/api-key/test', { key });
  }
}

// Global Settings API client instance
const settingsApi = new SettingsApiClient();
