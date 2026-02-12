// PC Management Tab Controller

class PCManagementController {
  constructor() {
    this.pcs = [];
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadPCs();
  }

  bindEvents() {
    document.getElementById('rename-pc').addEventListener('click', () => {
      this.renamePC();
    });

    document.getElementById('rename-pc-select').addEventListener('change', () => {
      this.updateRenameForm();
    });
  }

  async loadPCs() {
    try {
      showLoading();
      const response = await api.getPCs();
      
      if (response.success) {
        this.pcs = response.pcs;
        this.updatePCSelect();
      } else {
        showToast('Failed to load PCs', 'error');
      }
    } catch (error) {
      console.error('PCs load error:', error);
      showToast('Failed to load PCs', 'error');
    } finally {
      hideLoading();
    }
  }

  updatePCSelect() {
    const select = document.getElementById('rename-pc-select');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">Select a PC...</option>';
    
    this.pcs.forEach(pc => {
      const option = document.createElement('option');
      option.value = pc.pcId;
      option.textContent = `${pc.displayName} (${pc.status})`;
      select.appendChild(option);
    });
    
    // Restore previous selection if it still exists
    if (currentValue && this.pcs.find(pc => pc.pcId === currentValue)) {
      select.value = currentValue;
      this.updateRenameForm();
    }
  }

  updateRenameForm() {
    const select = document.getElementById('rename-pc-select');
    const nameInput = document.getElementById('new-pc-name');
    const pcId = select.value;
    
    if (pcId) {
      const pc = this.pcs.find(p => p.pcId === pcId);
      if (pc) {
        nameInput.value = pc.displayName;
        nameInput.disabled = false;
        document.getElementById('rename-pc').disabled = false;
      }
    } else {
      nameInput.value = '';
      nameInput.disabled = true;
      document.getElementById('rename-pc').disabled = true;
    }
  }

  async renamePC() {
    const select = document.getElementById('rename-pc-select');
    const nameInput = document.getElementById('new-pc-name');
    
    const pcId = select.value;
    const newName = nameInput.value.trim();
    
    if (!pcId) {
      showToast('Please select a PC to rename', 'warning');
      return;
    }

    if (!newName) {
      showToast('Please enter a new name for the PC', 'warning');
      return;
    }

    if (newName.length < 1 || newName.length > 50) {
      showToast('PC name must be between 1 and 50 characters', 'warning');
      return;
    }

    // Check if name is the same
    const pc = this.pcs.find(p => p.pcId === pcId);
    if (pc && pc.displayName === newName) {
      showToast('PC name is already set to this value', 'info');
      return;
    }

    try {
      showLoading();
      const response = await api.renamePC(pcId, newName);
      
      if (response.success) {
        showToast(`PC renamed successfully to "${newName}"`, 'success');
        
        // Update local data
        const pcIndex = this.pcs.findIndex(p => p.pcId === pcId);
        if (pcIndex !== -1) {
          this.pcs[pcIndex].displayName = newName;
        }
        
        // Update form
        nameInput.value = newName;
        
        // Refresh dashboard if it exists
        if (typeof dashboard !== 'undefined') {
          dashboard.loadDashboard();
        }
        
        // Update error filter if it exists
        if (typeof errors !== 'undefined') {
          errors.loadPCs();
        }
      } else {
        showToast('Failed to rename PC', 'error');
      }
    } catch (error) {
      console.error('PC rename error:', error);
      showToast('Failed to rename PC', 'error');
    } finally {
      hideLoading();
    }
  }
}

// Global PC management instance
let pcManagement;
