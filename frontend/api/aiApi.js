// AI API Client - ONLY calls backend endpoints

class AIApiClient {
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
      console.error('AI API request failed:', error);
      throw error;
    }
  }

  // GET /api/ai/status - Check if AI is available
  async getStatus() {
    return this.request('GET', '/ai/status');
  }

  // POST /api/ai/chat - Chat with AI
  async chat(message, context = null) {
    return this.request('POST', '/ai/chat', { message, context });
  }

  // POST /api/ai/explain-error - Explain an error
  async explainError(errorId) {
    return this.request('POST', '/ai/explain-error', { errorId });
  }
}

// Make available globally
window.aiApi = new AIApiClient();
