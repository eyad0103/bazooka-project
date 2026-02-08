// Errors Tab Controller

class ErrorsController {
  constructor() {
    this.errors = [];
    this.pcs = [];
    this.currentError = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadErrors();
    this.loadPCs();
  }

  bindEvents() {
    document.getElementById('refresh-errors').addEventListener('click', () => {
      this.loadErrors();
    });

    document.getElementById('error-filter-pc').addEventListener('change', () => {
      this.filterErrors();
    });

    document.getElementById('error-filter-severity').addEventListener('change', () => {
      this.filterErrors();
    });
  }

  async loadErrors() {
    try {
      showLoading();
      const response = await api.getErrors();
      
      if (response.success) {
        this.errors = response.errors;
        this.updateErrorTable();
      } else {
        showToast('Failed to load errors', 'error');
      }
    } catch (error) {
      console.error('Errors load error:', error);
      showToast('Failed to load errors', 'error');
    } finally {
      hideLoading();
    }
  }

  async loadPCs() {
    try {
      const response = await api.getPCs();
      if (response.success) {
        this.pcs = response.pcs;
        this.updatePCFilter();
      }
    } catch (error) {
      console.error('Failed to load PCs for filter:', error);
    }
  }

  updatePCFilter() {
    const select = document.getElementById('error-filter-pc');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">All PCs</option>';
    
    this.pcs.forEach(pc => {
      const option = document.createElement('option');
      option.value = pc.pcId;
      option.textContent = pc.displayName;
      select.appendChild(option);
    });
    
    // Restore previous selection
    if (currentValue) {
      select.value = currentValue;
    }
  }

  filterErrors() {
    const pcFilter = document.getElementById('error-filter-pc').value;
    const severityFilter = document.getElementById('error-filter-severity').value;
    
    let filteredErrors = this.errors;
    
    if (pcFilter) {
      filteredErrors = filteredErrors.filter(error => error.pcId === pcFilter);
    }
    
    if (severityFilter) {
      filteredErrors = filteredErrors.filter(error => error.severity === severityFilter);
    }
    
    this.updateErrorTable(filteredErrors);
  }

  updateErrorTable(errorsToShow = this.errors) {
    const tbody = document.getElementById('error-table-body');
    
    if (errorsToShow.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="no-data">No errors found</td></tr>';
      return;
    }

    tbody.innerHTML = errorsToShow.map(error => `
      <tr>
        <td>
          <div class="error-time">
            <div>${formatDateTime(error.timestamp)}</div>
            <small class="text-muted">${formatRelativeTime(error.timestamp)}</small>
          </div>
        </td>
        <td>
          <div class="error-pc">
            <i class="fas fa-desktop"></i>
            ${this.escapeHtml(error.pcName)}
          </div>
        </td>
        <td>
          <span class="error-type ${getSeverityClass(error.severity)}">
            ${this.escapeHtml(error.errorType)}
          </span>
        </td>
        <td>
          <span class="severity-badge ${getSeverityClass(error.severity)}">
            ${error.severity.toUpperCase()}
          </span>
        </td>
        <td>
          <div class="error-message" title="${this.escapeHtml(error.message)}">
            ${this.escapeHtml(this.truncateMessage(error.message, 100))}
          </div>
        </td>
        <td>
          <div class="error-actions">
            <button class="btn btn-sm btn-primary" onclick="errors.viewError('${error.errorId}')">
              <i class="fas fa-eye"></i>
              View
            </button>
            ${!error.resolved ? `
              <button class="btn btn-sm btn-success" onclick="errors.resolveError('${error.errorId}')">
                <i class="fas fa-check"></i>
                Resolve
              </button>
            ` : `
              <span class="resolved-badge">
                <i class="fas fa-check-circle"></i>
                Resolved
              </span>
            `}
          </div>
        </td>
      </tr>
    `).join('');
  }

  async viewError(errorId) {
    try {
      const response = await api.getError(errorId);
      
      if (response.success) {
        this.currentError = response.error;
        this.showErrorModal();
      } else {
        showToast('Failed to load error details', 'error');
      }
    } catch (error) {
      console.error('Error details load error:', error);
      showToast('Failed to load error details', 'error');
    }
  }

  showErrorModal() {
    const modal = document.getElementById('error-modal');
    const content = document.getElementById('error-detail-content');
    
    if (!this.currentError) return;

    content.innerHTML = `
      <div class="error-detail">
        <div class="detail-section">
          <h4>Basic Information</h4>
          <div class="detail-row">
            <label>Error ID:</label>
            <span>${this.escapeHtml(this.currentError.errorId)}</span>
          </div>
          <div class="detail-row">
            <label>PC:</label>
            <span>${this.escapeHtml(this.currentError.pcName)}</span>
          </div>
          <div class="detail-row">
            <label>Type:</label>
            <span class="error-type ${getSeverityClass(this.currentError.severity)}">
              ${this.escapeHtml(this.currentError.errorType)}
            </span>
          </div>
          <div class="detail-row">
            <label>Severity:</label>
            <span class="severity-badge ${getSeverityClass(this.currentError.severity)}">
              ${this.currentError.severity.toUpperCase()}
            </span>
          </div>
          <div class="detail-row">
            <label>Timestamp:</label>
            <span>${formatDateTime(this.currentError.timestamp)}</span>
          </div>
          <div class="detail-row">
            <label>Status:</label>
            <span class="${this.currentError.resolved ? 'resolved-badge' : 'pending-badge'}">
              <i class="fas fa-${this.currentError.resolved ? 'check-circle' : 'clock'}"></i>
              ${this.currentError.resolved ? 'Resolved' : 'Pending'}
            </span>
          </div>
        </div>

        <div class="detail-section">
          <h4>Message</h4>
          <div class="error-message-full">
            ${this.escapeHtml(this.currentError.message)}
          </div>
        </div>

        ${this.currentError.details && Object.keys(this.currentError.details).length > 0 ? `
          <div class="detail-section">
            <h4>Additional Details</h4>
            <pre class="error-details-json">${JSON.stringify(this.currentError.details, null, 2)}</pre>
          </div>
        ` : ''}

        ${this.currentError.resolvedAt ? `
          <div class="detail-section">
            <h4>Resolution</h4>
            <div class="detail-row">
              <label>Resolved At:</label>
              <span>${formatDateTime(this.currentError.resolvedAt)}</span>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // Update modal footer buttons
    const footer = modal.querySelector('.modal-footer');
    footer.innerHTML = `
      <button id="get-ai-explanation" class="btn btn-primary" onclick="errors.getAIExplanation()">
        <i class="fas fa-robot"></i>
        Get AI Explanation
      </button>
      ${!this.currentError.resolved ? `
        <button id="resolve-error" class="btn btn-success" onclick="errors.resolveCurrentError()">
          <i class="fas fa-check"></i>
          Mark Resolved
        </button>
      ` : ''}
      <button class="btn btn-secondary" onclick="closeErrorModal()">
        <i class="fas fa-times"></i>
        Close
      </button>
    `;

    modal.classList.remove('hidden');
  }

  async getAIExplanation() {
    if (!this.currentError) return;

    try {
      showLoading();
      
      // Use new AI API
      const aiApi = require('../api/aiApi');
      const response = await aiApi.explainError(this.currentError.errorId);
      
      if (response.success) {
        this.showAIExplanation(response.explanation);
      } else if (response.error.includes('not configured')) {
        showToast('API key required for AI explanations', 'warning');
        // Switch to API key tab
        document.querySelector('[data-tab="api-key"]').click();
      } else {
        showToast('Failed to get AI explanation', 'error');
      }
    } catch (error) {
      console.error('AI explanation error:', error);
      showToast('Failed to get AI explanation', 'error');
    } finally {
      hideLoading();
    }
  }

  showAIExplanation(explanation) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>AI Explanation</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="ai-explanation">
            ${explanation.replace(/\n/g, '<br>')}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
            <i class="fas fa-times"></i>
            Close
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  async resolveError(errorId) {
    try {
      const response = await api.resolveError(errorId);
      
      if (response.success) {
        showToast('Error marked as resolved', 'success');
        this.loadErrors(); // Reload the errors list
      } else {
        showToast('Failed to resolve error', 'error');
      }
    } catch (error) {
      console.error('Error resolution error:', error);
      showToast('Failed to resolve error', 'error');
    }
  }

  async resolveCurrentError() {
    if (!this.currentError) return;
    
    await this.resolveError(this.currentError.errorId);
    closeErrorModal();
  }

  truncateMessage(message, maxLength) {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Global errors instance
let errors;

// Global function for closing error modal
function closeErrorModal() {
  document.getElementById('error-modal').classList.add('hidden');
}
