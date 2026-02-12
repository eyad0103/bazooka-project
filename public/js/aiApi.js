// AI API Client

class AIApiClient {
  constructor() {
    this.baseURL = window.location.origin;
    this.defaultTimeout = 30000;
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
      console.error('AI API request failed:', error);
      throw error;
    }
  }

  async chat(message, errorContext = null) {
    const data = { message };
    if (errorContext) {
      data.errorContext = errorContext;
    }
    return this.request('POST', '/ai/chat', data);
  }

  async explainError(errorId) {
    return this.request('GET', `/ai/explain/${errorId}`);
  }
}

// Global AI API client instance
const aiApi = new AIApiClient();
