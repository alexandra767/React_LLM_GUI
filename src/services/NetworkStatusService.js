// Network status service for detecting online/offline state and managing model fallbacks
class NetworkStatusService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = [];
    this.cloudApiStatus = {
      claude: false,
      openai: false,
      lastChecked: null
    };
    
    // Listen for network status changes
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Check cloud API availability every 30 seconds when online
    this.startCloudApiCheck();
  }

  // Add listener for network status changes
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  // Notify all listeners of status change
  notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('[NetworkStatus] Error calling listener:', error);
      }
    });
  }

  // Handle going online
  handleOnline() {
    console.log('[NetworkStatus] Network came online');
    this.isOnline = true;
    this.checkCloudApiAvailability();
    this.notifyListeners({
      isOnline: true,
      cloudApis: this.cloudApiStatus,
      timestamp: new Date().toISOString()
    });
  }

  // Handle going offline
  handleOffline() {
    console.log('[NetworkStatus] Network went offline');
    this.isOnline = false;
    this.cloudApiStatus = {
      claude: false,
      openai: false,
      lastChecked: new Date().toISOString()
    };
    this.notifyListeners({
      isOnline: false,
      cloudApis: this.cloudApiStatus,
      timestamp: new Date().toISOString()
    });
  }

  // Get current network status
  getStatus() {
    return {
      isOnline: this.isOnline,
      cloudApis: this.cloudApiStatus,
      timestamp: new Date().toISOString()
    };
  }

  // Check if Claude API is available
  async checkClaudeApi() {
    if (!this.isOnline) return false;
    
    const claudeApiKey = localStorage.getItem('sephia_settings');
    if (!claudeApiKey) return false;
    
    try {
      const settings = JSON.parse(claudeApiKey);
      if (!settings.claudeApiKey) return false;
      
      // Simple ping to Claude API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }]
        })
      });
      
      return response.status !== 401 && response.status !== 403; // API key issues vs network issues
    } catch (error) {
      console.log('[NetworkStatus] Claude API check failed:', error.message);
      return false;
    }
  }

  // Check if OpenAI API is available
  async checkOpenAiApi() {
    if (!this.isOnline) return false;
    
    try {
      const settings = JSON.parse(localStorage.getItem('sephia_voice_settings') || '{}');
      if (!settings.openaiApiKey) return false;
      
      // Simple models list request to OpenAI
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${settings.openaiApiKey}`
        }
      });
      
      return response.status !== 401 && response.status !== 403;
    } catch (error) {
      console.log('[NetworkStatus] OpenAI API check failed:', error.message);
      return false;
    }
  }

  // Check all cloud API availability
  async checkCloudApiAvailability() {
    if (!this.isOnline) {
      this.cloudApiStatus = {
        claude: false,
        openai: false,
        lastChecked: new Date().toISOString()
      };
      return this.cloudApiStatus;
    }

    const results = await Promise.allSettled([
      this.checkClaudeApi(),
      this.checkOpenAiApi()
    ]);

    this.cloudApiStatus = {
      claude: results[0].status === 'fulfilled' ? results[0].value : false,
      openai: results[1].status === 'fulfilled' ? results[1].value : false,
      lastChecked: new Date().toISOString()
    };

    console.log('[NetworkStatus] Cloud API status updated:', this.cloudApiStatus);
    return this.cloudApiStatus;
  }

  // Start periodic cloud API checking
  startCloudApiCheck() {
    // Check immediately
    if (this.isOnline) {
      this.checkCloudApiAvailability();
    }

    // Then check every 30 seconds
    setInterval(() => {
      if (this.isOnline) {
        this.checkCloudApiAvailability();
      }
    }, 30000);
  }

  // Get recommended model based on network status and preferences
  getRecommendedModel() {
    const settings = JSON.parse(localStorage.getItem('sephia_settings') || '{}');
    const preferredModel = settings.preferredAIModel || 'ollama';
    const currentModel = localStorage.getItem('sephia_current_model') || 'qwen3:14B';

    // If offline, always use local Ollama
    if (!this.isOnline) {
      return {
        model: currentModel.includes('qwen3') ? currentModel : 'qwen3:14B',
        type: 'local',
        reason: 'offline'
      };
    }

    // If online, check preferred model availability
    switch (preferredModel) {
      case 'claude':
        if (this.cloudApiStatus.claude) {
          return {
            model: 'claude-3-5-sonnet-20241022',
            type: 'cloud',
            reason: 'preferred_available'
          };
        }
        // Fallback to local if Claude unavailable
        return {
          model: currentModel.includes('qwen3') ? currentModel : 'qwen3:14B',
          type: 'local',
          reason: 'cloud_unavailable'
        };

      case 'claude-haiku':
        if (this.cloudApiStatus.claude) {
          return {
            model: 'claude-3-haiku-20240307',
            type: 'cloud',
            reason: 'preferred_available'
          };
        }
        // Fallback to local if Claude unavailable
        return {
          model: currentModel.includes('qwen3') ? currentModel : 'qwen3:14B',
          type: 'local',
          reason: 'cloud_unavailable'
        };

      default:
        // Default to local Ollama
        return {
          model: currentModel.includes('qwen3') ? currentModel : 'qwen3:14B',
          type: 'local',
          reason: 'preferred_local'
        };
    }
  }

  // Test network connectivity
  async testConnectivity() {
    const tests = [];

    // Test 1: Basic browser online status
    tests.push({
      name: 'Browser Status',
      result: navigator.onLine,
      details: navigator.onLine ? 'Browser reports online' : 'Browser reports offline'
    });

    // Test 2: DNS resolution test
    try {
      const start = Date.now();
      await fetch('https://8.8.8.8', { 
        method: 'HEAD', 
        mode: 'no-cors',
        signal: AbortSignal.timeout(3000)
      });
      const latency = Date.now() - start;
      tests.push({
        name: 'DNS Resolution',
        result: true,
        details: `DNS resolved in ${latency}ms`
      });
    } catch (error) {
      tests.push({
        name: 'DNS Resolution',
        result: false,
        details: `DNS failed: ${error.message}`
      });
    }

    // Test 3: HTTP connectivity
    try {
      const start = Date.now();
      const response = await fetch('https://httpbin.org/status/200', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      const latency = Date.now() - start;
      tests.push({
        name: 'HTTP Connectivity',
        result: response.ok,
        details: `HTTP test completed in ${latency}ms`
      });
    } catch (error) {
      tests.push({
        name: 'HTTP Connectivity',
        result: false,
        details: `HTTP test failed: ${error.message}`
      });
    }

    // Test 4: Cloud API connectivity
    const apiTests = await this.checkCloudApiAvailability();
    tests.push({
      name: 'Claude API',
      result: apiTests.claude,
      details: apiTests.claude ? 'Claude API accessible' : 'Claude API not accessible'
    });

    tests.push({
      name: 'OpenAI API',
      result: apiTests.openai,
      details: apiTests.openai ? 'OpenAI API accessible' : 'OpenAI API not accessible'
    });

    return {
      timestamp: new Date().toISOString(),
      overallStatus: tests.filter(t => t.result).length >= 2, // At least 2 tests pass
      tests
    };
  }

  // Get network info for diagnostics
  getNetworkInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    return {
      online: navigator.onLine,
      connectionType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 'unknown',
      rtt: connection?.rtt || 'unknown',
      saveData: connection?.saveData || false,
      userAgent: navigator.userAgent,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      timestamp: new Date().toISOString()
    };
  }
}

// Export as singleton
export default new NetworkStatusService();