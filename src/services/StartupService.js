/**
 * Startup Service
 * Automatically launches and monitors all AI services
 * Handles Ollama, ComfyUI, and Bark TTS startup and health monitoring
 */

class StartupService {
  constructor() {
    this.services = {
      ollama: { port: 11434, name: 'Ollama LLM', status: 'unknown', process: null },
      comfyui: { port: 8188, name: 'ComfyUI Image Gen', status: 'unknown', process: null },
      bark: { port: 8189, name: 'Bark TTS', status: 'unknown', process: null }
    };
    
    this.isElectron = window.electron !== undefined;
    this.startupCallbacks = [];
    this.statusCallbacks = [];
    this.autoStartEnabled = true;
    
    console.log('[StartupService] Initialized', { isElectron: this.isElectron });
  }

  // Add callbacks for startup events
  onStartup(callback) {
    this.startupCallbacks.push(callback);
  }

  onStatusChange(callback) {
    this.statusCallbacks.push(callback);
  }

  // Emit startup events
  emitStartupEvent(event, data) {
    this.startupCallbacks.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('[StartupService] Callback error:', error);
      }
    });
  }

  emitStatusChange(service, status) {
    this.services[service].status = status;
    this.statusCallbacks.forEach(callback => {
      try {
        callback(service, status, this.getOverallStatus());
      } catch (error) {
        console.error('[StartupService] Status callback error:', error);
      }
    });
  }

  // Check if a service is running
  async checkService(service) {
    const { port, name } = this.services[service];
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`http://localhost:${port}/`, {
        signal: controller.signal,
        mode: 'no-cors'
      });
      
      clearTimeout(timeoutId);
      this.emitStatusChange(service, 'running');
      return true;
    } catch (error) {
      // For specific service endpoints
      if (service === 'ollama') {
        try {
          const response = await fetch('http://localhost:11434/api/tags', { timeout: 2000 });
          this.emitStatusChange(service, 'running');
          return true;
        } catch (e) {
          this.emitStatusChange(service, 'stopped');
          return false;
        }
      } else if (service === 'bark') {
        try {
          const response = await fetch('http://localhost:8189/status', { timeout: 2000 });
          if (response.ok) {
            const data = await response.json();
            const status = data.models_loaded ? 'ready' : 'loading';
            this.emitStatusChange(service, status);
            return true;
          }
        } catch (e) {
          this.emitStatusChange(service, 'stopped');
          return false;
        }
      } else if (service === 'comfyui') {
        try {
          const response = await fetch('http://localhost:8188/', { timeout: 2000 });
          this.emitStatusChange(service, 'running');
          return true;
        } catch (e) {
          this.emitStatusChange(service, 'stopped');
          return false;
        }
      }
      
      this.emitStatusChange(service, 'stopped');
      return false;
    }
  }

  // Start a specific service
  async startService(service) {
    if (!this.isElectron) {
      console.warn('[StartupService] Cannot start services outside Electron');
      return false;
    }

    this.emitStatusChange(service, 'starting');
    this.emitStartupEvent('service_starting', { service, name: this.services[service].name });

    try {
      const scripts = {
        ollama: 'ollama serve',
        comfyui: './start-comfyui.sh',
        bark: 'cd ai-tools/ComfyUI && ./start-bark-tts.sh'
      };

      const script = scripts[service];
      if (!script) {
        throw new Error(`No start script for service: ${service}`);
      }

      // Use Electron's process spawning
      if (window.electron && window.electron.spawn) {
        const process = await window.electron.spawn(script, { shell: true });
        this.services[service].process = process;
        
        // Monitor service startup
        this.monitorServiceStartup(service);
        
        return true;
      } else {
        console.warn('[StartupService] Electron spawn not available');
        return false;
      }
    } catch (error) {
      console.error(`[StartupService] Failed to start ${service}:`, error);
      this.emitStatusChange(service, 'error');
      this.emitStartupEvent('service_error', { 
        service, 
        name: this.services[service].name, 
        error: error.message 
      });
      return false;
    }
  }

  // Monitor service startup progress
  async monitorServiceStartup(service) {
    const maxWaitTime = service === 'bark' ? 120000 : 60000; // 2 min for Bark, 1 min for others
    const checkInterval = 2000;
    let elapsed = 0;

    while (elapsed < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      elapsed += checkInterval;

      const isRunning = await this.checkService(service);
      if (isRunning) {
        this.emitStartupEvent('service_ready', { 
          service, 
          name: this.services[service].name,
          elapsed: elapsed / 1000 
        });
        return true;
      }

      // Update progress
      const progress = Math.min((elapsed / maxWaitTime) * 100, 95);
      this.emitStartupEvent('service_progress', { 
        service, 
        name: this.services[service].name, 
        progress 
      });
    }

    // Timeout
    this.emitStatusChange(service, 'timeout');
    this.emitStartupEvent('service_timeout', { 
      service, 
      name: this.services[service].name 
    });
    return false;
  }

  // Start all services
  async startAllServices() {
    if (!this.autoStartEnabled) {
      console.log('[StartupService] Auto-start disabled');
      return;
    }

    this.emitStartupEvent('startup_begin', { services: Object.keys(this.services) });

    // Check what's already running
    console.log('[StartupService] Checking existing services...');
    const statuses = await Promise.all([
      this.checkService('ollama'),
      this.checkService('comfyui'), 
      this.checkService('bark')
    ]);

    const [ollamaRunning, comfyuiRunning, barkRunning] = statuses;

    // Start services that aren't running
    const startPromises = [];

    if (!ollamaRunning) {
      console.log('[StartupService] Starting Ollama...');
      startPromises.push(this.startService('ollama'));
    } else {
      console.log('[StartupService] Ollama already running');
    }

    if (!comfyuiRunning) {
      console.log('[StartupService] Starting ComfyUI...');
      startPromises.push(this.startService('comfyui'));
    } else {
      console.log('[StartupService] ComfyUI already running');
    }

    if (!barkRunning) {
      console.log('[StartupService] Starting Bark TTS...');
      startPromises.push(this.startService('bark'));
    } else {
      console.log('[StartupService] Bark TTS already running');
    }

    // Wait for all services to start
    if (startPromises.length > 0) {
      await Promise.all(startPromises);
    }

    // Final status check
    setTimeout(() => {
      this.checkAllServices();
      this.emitStartupEvent('startup_complete', { 
        status: this.getOverallStatus(),
        services: this.getAllStatuses()
      });
    }, 5000);
  }

  // Check all services
  async checkAllServices() {
    const promises = Object.keys(this.services).map(service => this.checkService(service));
    const results = await Promise.all(promises);
    
    return results.every(result => result);
  }

  // Get overall system status
  getOverallStatus() {
    const statuses = Object.values(this.services).map(s => s.status);
    
    if (statuses.every(s => s === 'running' || s === 'ready')) {
      return 'ready';
    } else if (statuses.some(s => s === 'starting' || s === 'loading')) {
      return 'starting';
    } else if (statuses.some(s => s === 'error' || s === 'timeout')) {
      return 'error';
    } else {
      return 'stopped';
    }
  }

  // Get all service statuses
  getAllStatuses() {
    return Object.entries(this.services).map(([key, service]) => ({
      service: key,
      name: service.name,
      port: service.port,
      status: service.status
    }));
  }

  // Start monitoring (call this on app startup)
  async initialize() {
    console.log('[StartupService] Initializing...');
    
    // Initial check
    await this.checkAllServices();
    
    // Start services if needed
    if (this.isElectron && this.autoStartEnabled) {
      setTimeout(() => this.startAllServices(), 1000);
    }
    
    // Set up periodic health checks
    this.startHealthMonitoring();
  }

  // Periodic health monitoring
  startHealthMonitoring() {
    setInterval(async () => {
      await this.checkAllServices();
    }, 30000); // Check every 30 seconds
  }

  // Restart a service
  async restartService(service) {
    console.log(`[StartupService] Restarting ${service}...`);
    
    // Stop first (if possible)
    if (this.services[service].process) {
      try {
        this.services[service].process.kill();
      } catch (error) {
        console.error(`[StartupService] Error stopping ${service}:`, error);
      }
    }
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start again
    return await this.startService(service);
  }

  // Get service logs (if available)
  getServiceLogs(service) {
    // This would be implemented with proper log reading
    return `Logs for ${this.services[service].name} would appear here`;
  }

  // Disable/enable auto-start
  setAutoStart(enabled) {
    this.autoStartEnabled = enabled;
    localStorage.setItem('sephia_auto_start', enabled ? 'true' : 'false');
  }

  getAutoStartEnabled() {
    const stored = localStorage.getItem('sephia_auto_start');
    return stored !== 'false'; // Default to true
  }
}

// Create singleton instance
const startupService = new StartupService();

export default startupService;