// Debug version of Main Application Controller

console.log('Debug: Loading main.js...');

class BazookaMonitoringApp {
  constructor() {
    console.log('Debug: BazookaMonitoringApp constructor called');
    this.currentTab = 'dashboard';
    this.controllers = {};
    this.init();
  }

  init() {
    console.log('Debug: Initializing app...');
    this.initializeControllers();
    this.bindEvents();
    this.checkConnection();
    this.showTab('dashboard');
  }

  initializeControllers() {
    console.log('Debug: Initializing controllers...');
    // For debugging, we'll skip the controllers that might cause errors
    this.controllers = {};
    console.log('Debug: Controllers initialized');
  }

  bindEvents() {
    console.log('Debug: Binding events...');
    
    // Tab navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    console.log('Debug: Found nav buttons:', navButtons.length);
    
    navButtons.forEach((btn, index) => {
      console.log(`Debug: Binding event to button ${index}:`, btn.dataset.tab);
      btn.addEventListener('click', (e) => {
        console.log('Debug: Nav button clicked:', e.target);
        const tabName = e.target.closest('.nav-btn').dataset.tab;
        console.log('Debug: Tab name:', tabName);
        this.showTab(tabName);
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key >= '1' && e.key <= '5') {
        const tabIndex = parseInt(e.key) - 1;
        const tabs = ['dashboard', 'errors', 'ai-chat', 'api-key', 'pc-management'];
        if (tabs[tabIndex]) {
          this.showTab(tabs[tabIndex]);
        }
      }
    });
    
    console.log('Debug: Events bound successfully');
  }

  async checkConnection() {
    console.log('Debug: Checking connection...');
    // Skip for debugging
  }

  showTab(tabName) {
    console.log('Debug: showTab called with:', tabName);
    
    try {
      // Update navigation
      const navButtons = document.querySelectorAll('.nav-btn');
      console.log('Debug: Found nav buttons for update:', navButtons.length);
      
      navButtons.forEach(btn => {
        btn.classList.remove('active');
      });
      
      const activeNavBtn = document.querySelector(`[data-tab="${tabName}"]`);
      if (activeNavBtn) {
        activeNavBtn.classList.add('active');
        console.log('Debug: Active nav button set');
      } else {
        console.error('Debug: Could not find nav button for tab:', tabName);
      }

      // Update content
      const tabContents = document.querySelectorAll('.tab-content');
      console.log('Debug: Found tab contents:', tabContents.length);
      
      tabContents.forEach(content => {
        content.classList.remove('active');
      });
      
      const activeTabContent = document.getElementById(`${tabName}-tab`);
      if (activeTabContent) {
        activeTabContent.classList.add('active');
        console.log('Debug: Active tab content set');
      } else {
        console.error('Debug: Could not find tab content for:', tabName);
      }

      this.currentTab = tabName;
      console.log('Debug: Tab switch completed:', tabName);
    } catch (error) {
      console.error('Debug: Error in showTab:', error);
    }
  }

  initializeTab(tabName) {
    console.log('Debug: Initializing tab:', tabName);
    // Skip for debugging
  }

  destroy() {
    console.log('Debug: Destroying app...');
  }
}

// Initialize the application when DOM is loaded
console.log('Debug: Setting up DOMContentLoaded listener');

document.addEventListener('DOMContentLoaded', () => {
  console.log('Debug: DOM loaded, initializing app');
  try {
    window.app = new BazookaMonitoringApp();
    console.log('Debug: App initialized successfully');
  } catch (error) {
    console.error('Debug: Error initializing app:', error);
  }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (window.app) {
    window.app.destroy();
  }
});

console.log('Debug: main.js loaded');
