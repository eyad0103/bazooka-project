// API Client for Bazooka PC Monitoring System

class APIClient {
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
      console.error('API request failed:', error);
      throw error;
    }
  }

  // PC endpoints
  async getPCs() {
    return this.request('GET', '/pcs');
  }

  async getPC(pcId) {
    return this.request('GET', `/pcs/${pcId}`);
  }

  async renamePC(pcId, displayName) {
    return this.request('PUT', `/pcs/${pcId}/rename`, { displayName });
  }

  // Error endpoints
  async getErrors(filters = {}) {
    const params = new URLSearchParams();
    if (filters.pcId) params.append('pcId', filters.pcId);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.resolved !== undefined) params.append('resolved', filters.resolved);

    const endpoint = params.toString() ? `/errors?${params}` : '/errors';
    return this.request('GET', endpoint);
  }

  async getError(errorId) {
    return this.request('GET', `/errors/${errorId}`);
  }

  async resolveError(errorId) {
    return this.request('PUT', `/errors/${errorId}/resolve`);
  }

  // Note: AI and API Key endpoints are now handled by dedicated API clients
  // See: frontend/api/aiApi.js and frontend/api/settingsApi.js

  // Utility endpoints
  async getHealth() {
    return this.request('GET', '/health');
  }

  async getAPIInfo() {
    return this.request('GET', '');
  }
}

// Global API client instance
const api = new APIClient();

// Utility functions
function showLoading() {
  document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
}

function showToast(message, type = 'info', duration = 5000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  }[type] || 'fa-info-circle';

  toast.innerHTML = `
    <i class="fas ${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}

function formatDateTime(isoString) {
  if (!isoString) return 'Never';
  
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  
  // If less than 1 day ago, show time
  if (diffMs < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Otherwise show date and time
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatRelativeTime(isoString) {
  if (!isoString) return 'Never';
  
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

function getSeverityClass(severity) {
  return {
    critical: 'severity-critical',
    high: 'severity-high',
    medium: 'severity-medium',
    low: 'severity-low'
  }[severity] || 'severity-medium';
}

function getStatusClass(status) {
  return {
    online: 'status-online',
    offline: 'status-offline',
    idle: 'status-idle'
  }[status] || 'status-offline';
}

// Add slideOut animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideOut {
    to {
      transform: translateX(120%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
