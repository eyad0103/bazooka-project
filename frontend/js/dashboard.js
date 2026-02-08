// Dashboard Tab Controller

class DashboardController {
  constructor() {
    this.pcs = [];
    this.refreshInterval = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadDashboard();
    this.startAutoRefresh();
  }

  bindEvents() {
    document.getElementById('refresh-dashboard').addEventListener('click', () => {
      this.loadDashboard();
    });
  }

  async loadDashboard() {
    try {
      showLoading();
      const response = await api.getPCs();
      
      if (response.success) {
        this.pcs = response.pcs;
        this.updateStats();
        this.updatePCTable();
      } else {
        showToast('Failed to load dashboard data', 'error');
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      hideLoading();
    }
  }

  updateStats() {
    const totalPCs = this.pcs.length;
    const onlinePCs = this.pcs.filter(pc => pc.status === 'online').length;
    const offlinePCs = this.pcs.filter(pc => pc.status === 'offline').length;
    
    document.getElementById('total-pcs').textContent = totalPCs;
    document.getElementById('online-pcs').textContent = onlinePCs;
    document.getElementById('offline-pcs').textContent = offlinePCs;
    
    // Update recent errors (would need separate API call)
    this.updateRecentErrors();
  }

  async updateRecentErrors() {
    try {
      const response = await api.getErrors();
      if (response.success) {
        const recentErrors = response.errors.filter(error => {
          const errorTime = new Date(error.timestamp);
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          return errorTime > oneHourAgo;
        });
        document.getElementById('recent-errors').textContent = recentErrors.length;
      }
    } catch (error) {
      console.error('Failed to load recent errors:', error);
      document.getElementById('recent-errors').textContent = '?';
    }
  }

  updatePCTable() {
    const tbody = document.getElementById('pc-table-body');
    
    if (this.pcs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="no-data">No PCs registered yet</td></tr>';
      return;
    }

    tbody.innerHTML = this.pcs.map(pc => `
      <tr>
        <td>
          <div class="pc-name">
            <i class="fas fa-desktop"></i>
            ${this.escapeHtml(pc.displayName)}
          </div>
        </td>
        <td>
          <span class="status-indicator ${getStatusClass(pc.status)}">
            <i class="fas fa-circle"></i>
            ${pc.status}
          </span>
        </td>
        <td>
          <div class="last-seen">
            <div>${formatDateTime(pc.lastSeen)}</div>
            <small class="text-muted">${formatRelativeTime(pc.lastSeen)}</small>
          </div>
        </td>
        <td>
          <div class="pc-actions">
            <button class="btn btn-sm btn-secondary" onclick="dashboard.viewPCDetails('${pc.pcId}')">
              <i class="fas fa-info-circle"></i>
              Details
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  viewPCDetails(pcId) {
    const pc = this.pcs.find(p => p.pcId === pcId);
    if (!pc) return;

    // Create a simple modal with PC details
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>PC Details: ${this.escapeHtml(pc.displayName)}</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="pc-details">
            <div class="detail-row">
              <label>PC ID:</label>
              <span>${this.escapeHtml(pc.pcId)}</span>
            </div>
            <div class="detail-row">
              <label>Status:</label>
              <span class="status-indicator ${getStatusClass(pc.status)}">
                <i class="fas fa-circle"></i>
                ${pc.status}
              </span>
            </div>
            <div class="detail-row">
              <label>Last Seen:</label>
              <span>${formatDateTime(pc.lastSeen)} (${formatRelativeTime(pc.lastSeen)})</span>
            </div>
            <div class="detail-row">
              <label>Registered:</label>
              <span>${formatDateTime(pc.registeredAt)}</span>
            </div>
            ${pc.systemInfo ? `
              <div class="detail-row">
                <label>Platform:</label>
                <span>${this.escapeHtml(pc.systemInfo.platform || 'Unknown')}</span>
              </div>
              <div class="detail-row">
                <label>CPU:</label>
                <span>${this.escapeHtml(pc.systemInfo.cpuModel || 'Unknown')}</span>
              </div>
              <div class="detail-row">
                <label>Memory:</label>
                <span>${pc.systemInfo.totalMemory ? this.formatBytes(pc.systemInfo.totalMemory) : 'Unknown'}</span>
              </div>
            ` : ''}
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

  formatBytes(bytes) {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  startAutoRefresh() {
    // Refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.loadDashboard();
    }, 30000);
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  destroy() {
    this.stopAutoRefresh();
  }
}

// Global dashboard instance
let dashboard;
