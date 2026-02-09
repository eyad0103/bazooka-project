// Utility Functions for Bazooka PC Monitoring System

// Loading overlay functions
function showLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.classList.remove('hidden');
  }
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
  }
}

// Toast notification system
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    </div>
  `;

  container.appendChild(toast);

  // Auto remove after duration
  setTimeout(() => {
    toast.classList.add('toast-removing');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

// Modal functions
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

// Format date/time functions
function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatDateTime(dateString);
}

// Status indicator functions
function updateStatusIndicator(elementId, status, text) {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.className = `status-indicator ${status}`;
  element.innerHTML = `
    <i class="fas fa-circle"></i>
    <span>${text}</span>
  `;
}

// Error handling
function handleError(error, context = 'Operation') {
  console.error(`${context} failed:`, error);
  showToast(error.message || `${context} failed`, 'error');
}

// Validation functions
function validateApiKey(key) {
  return key && key.startsWith('sk-or-v1-') && key.length > 20;
}

function validatePCName(name) {
  return name && name.trim().length >= 2 && name.trim().length <= 50;
}

// API response helper
function handleApiResponse(response, successMessage, errorMessage) {
  if (response.success) {
    showToast(successMessage, 'success');
    return true;
  } else {
    showToast(response.error || errorMessage, 'error');
    return false;
  }
}

// Initialize global API client
const api = new APIClient();

// Make functions globally available
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showToast = showToast;
window.showModal = showModal;
window.hideModal = hideModal;
window.formatDateTime = formatDateTime;
window.formatRelativeTime = formatRelativeTime;
window.updateStatusIndicator = updateStatusIndicator;
window.handleError = handleError;
window.validateApiKey = validateApiKey;
window.validatePCName = validatePCName;
window.handleApiResponse = handleApiResponse;
