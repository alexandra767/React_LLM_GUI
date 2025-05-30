// Storage Recovery Service
// Detects localStorage issues and provides recovery solutions

class StorageRecoveryService {
  constructor() {
    this.isElectron = !!(window.electron || (window.process && window.process.type));
    this.dataKeys = [
      'sephia_profile',
      'sephia_settings', 
      'sephia_voice_settings',
      'sephia_chats',
      'sephia_projects',
      'aria_memory_system',
      'sephia_current_model',
      'sephia_companion_mode'
    ];
    
    this.recoveryAttempts = 0;
    this.maxRecoveryAttempts = 3;
    this.lastDataCheck = null;
    
    // Start recovery monitoring
    this.startRecoveryMonitoring();
  }
  
  // Test if localStorage is working properly
  testLocalStorage() {
    try {
      const testKey = 'storage_test_' + Date.now();
      const testValue = 'test_value_' + Math.random();
      
      // Test write
      localStorage.setItem(testKey, testValue);
      
      // Test read
      const retrieved = localStorage.getItem(testKey);
      
      // Test delete
      localStorage.removeItem(testKey);
      
      // Verify test was successful
      const afterDelete = localStorage.getItem(testKey);
      
      return {
        working: retrieved === testValue && afterDelete === null,
        error: null
      };
    } catch (error) {
      return {
        working: false,
        error: error.message
      };
    }
  }
  
  // Check data integrity
  checkDataIntegrity() {
    const results = {
      total: this.dataKeys.length,
      found: 0,
      missing: [],
      sizes: {},
      totalSize: 0,
      lastCheck: new Date().toISOString()
    };
    
    this.dataKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        results.found++;
        const size = new Blob([data]).size;
        results.sizes[key] = size;
        results.totalSize += size;
      } else {
        results.missing.push(key);
      }
    });
    
    results.integrityScore = results.found / results.total;
    this.lastDataCheck = results;
    
    return results;
  }
  
  // Detect the specific localStorage issue
  async diagnoseProblem() {
    console.log('[StorageRecovery] 🔍 Diagnosing storage problem...');
    
    const diagnosis = {
      localStorageWorking: false,
      dataIntegrity: null,
      possibleCauses: [],
      recommendations: []
    };
    
    // Test localStorage functionality
    const storageTest = this.testLocalStorage();
    diagnosis.localStorageWorking = storageTest.working;
    
    if (!storageTest.working) {
      diagnosis.possibleCauses.push('localStorage API not functioning');
      diagnosis.possibleCauses.push('Storage quota exceeded');
      diagnosis.possibleCauses.push('Private browsing mode');
      diagnosis.recommendations.push('Use file-based storage');
    }
    
    // Test data integrity
    diagnosis.dataIntegrity = this.checkDataIntegrity();
    
    if (diagnosis.dataIntegrity.integrityScore === 0) {
      diagnosis.possibleCauses.push('Data being cleared on app restart');
      diagnosis.possibleCauses.push('Electron session configuration issue');
      diagnosis.possibleCauses.push('localStorage being reset by app');
      diagnosis.recommendations.push('Switch to file-based storage immediately');
      diagnosis.recommendations.push('Check Electron webPreferences');
    }
    
    // Check for Electron-specific issues
    if (this.isElectron) {
      diagnosis.possibleCauses.push('webSecurity: false may affect storage');
      diagnosis.possibleCauses.push('Session not persisting between restarts');
      diagnosis.recommendations.push('Use userData directory for storage');
    }
    
    console.log('[StorageRecovery] 📊 Diagnosis complete:', diagnosis);
    return diagnosis;
  }
  
  // Force recreate all critical data
  async forceRecreateData() {
    console.log('[StorageRecovery] 🔧 Force recreating critical data...');
    
    const timestamp = new Date().toISOString();
    const recoveryData = {
      // Profile
      sephia_profile: JSON.stringify({
        name: 'Alexandra',
        email: 'alexandra@example.com',
        picture: '',
        bio: 'Developer working on AI systems',
        recoveryTimestamp: timestamp,
        source: 'StorageRecoveryService'
      }),
      
      // Memory system
      aria_memory_system: JSON.stringify({
        personal: [
          ['name', { value: 'Alexandra', timestamp: timestamp, source: 'recovery', confidence: 1.0 }],
          ['user_name', { value: 'Alexandra', timestamp: timestamp, source: 'recovery', confidence: 1.0 }]
        ],
        conversations: [],
        relationships: [],
        projects: [],
        interests: [],
        patterns: [],
        emotions: [],
        achievements: [],
        timestamp: timestamp,
        source: 'recovery'
      }),
      
      // Voice settings
      sephia_voice_settings: JSON.stringify({
        speechRate: 1.0,
        speechPitch: 1.0,
        speechVolume: 0.8,
        selectedVoice: '',
        recognitionLanguage: 'en-US',
        voiceEnabled: true,
        autoSpeak: true,
        recoveryTimestamp: timestamp
      }),
      
      // App settings
      sephia_settings: JSON.stringify({
        ollamaEndpoint: 'http://localhost:11434',
        temperature: 0.7,
        defaultModel: 'qwen3:14B',
        connectionType: 'ollama',
        syntaxHighlighting: true,
        streamingResponses: true,
        recoveryTimestamp: timestamp
      }),
      
      // Other essentials
      sephia_current_model: 'qwen3:14B',
      sephia_companion_mode: 'true',
      sephia_chats: JSON.stringify([]),
      sephia_projects: JSON.stringify([])
    };
    
    let createdCount = 0;
    const errors = [];
    
    Object.entries(recoveryData).forEach(([key, value]) => {
      try {
        localStorage.setItem(key, value);
        createdCount++;
        console.log(`[StorageRecovery] ✅ Recreated ${key}`);
      } catch (error) {
        errors.push({ key, error: error.message });
        console.error(`[StorageRecovery] ❌ Failed to recreate ${key}:`, error);
      }
    });
    
    console.log(`[StorageRecovery] 📊 Recovery complete: ${createdCount} items created, ${errors.length} errors`);
    
    return {
      success: createdCount > 0,
      createdCount,
      errors,
      timestamp
    };
  }
  
  // Try multiple recovery strategies
  async attemptRecovery() {
    if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
      console.error('[StorageRecovery] ❌ Max recovery attempts reached');
      return { success: false, reason: 'Max attempts reached' };
    }
    
    this.recoveryAttempts++;
    console.log(`[StorageRecovery] 🔄 Recovery attempt ${this.recoveryAttempts}/${this.maxRecoveryAttempts}`);
    
    try {
      // Strategy 1: Check for backups in localStorage
      const backupKeys = ['data_backup_1', 'data_backup_2', 'emergency_backup'];
      for (const backupKey of backupKeys) {
        const backup = localStorage.getItem(backupKey);
        if (backup) {
          try {
            const backupData = JSON.parse(backup);
            if (backupData.data) {
              console.log(`[StorageRecovery] 🔄 Attempting restore from ${backupKey}...`);
              
              let restoredCount = 0;
              Object.entries(backupData.data).forEach(([key, value]) => {
                localStorage.setItem(key, value);
                restoredCount++;
              });
              
              if (restoredCount > 0) {
                console.log(`[StorageRecovery] ✅ Restored ${restoredCount} items from backup`);
                return { success: true, method: 'backup_restore', restoredCount };
              }
            }
          } catch (parseError) {
            console.error(`[StorageRecovery] ❌ Failed to parse backup ${backupKey}:`, parseError);
          }
        }
      }
      
      // Strategy 2: Force recreate essential data
      console.log('[StorageRecovery] 🔧 No backups found, force recreating data...');
      const recreateResult = await this.forceRecreateData();
      
      if (recreateResult.success) {
        return { 
          success: true, 
          method: 'force_recreate', 
          createdCount: recreateResult.createdCount 
        };
      }
      
      // Strategy 3: Try file-based storage
      if (this.isElectron) {
        console.log('[StorageRecovery] 🔄 Attempting file-based storage fallback...');
        try {
          const { default: fileBasedStorageService } = await import('./FileBasedStorageService');
          await fileBasedStorageService.ensureInitialized();
          const loadResult = await fileBasedStorageService.loadAllDataFromFiles();
          
          if (loadResult.loadedCount > 0) {
            return { 
              success: true, 
              method: 'file_storage', 
              loadedCount: loadResult.loadedCount 
            };
          }
        } catch (fileError) {
          console.error('[StorageRecovery] ❌ File storage fallback failed:', fileError);
        }
      }
      
      return { success: false, reason: 'All recovery strategies failed' };
      
    } catch (error) {
      console.error('[StorageRecovery] ❌ Recovery attempt failed:', error);
      return { success: false, reason: error.message };
    }
  }
  
  // Start monitoring for storage issues
  startRecoveryMonitoring() {
    // Check immediately
    setTimeout(() => {
      this.checkAndRecover();
    }, 2000);
    
    // Check every 10 seconds
    setInterval(() => {
      this.checkAndRecover();
    }, 10000);
    
    console.log('[StorageRecovery] ✅ Recovery monitoring started');
  }
  
  async checkAndRecover() {
    const integrity = this.checkDataIntegrity();
    
    // If we have very low integrity, attempt recovery
    if (integrity.integrityScore < 0.3) {
      console.warn(`[StorageRecovery] 🚨 Low data integrity detected: ${(integrity.integrityScore * 100).toFixed(1)}%`);
      console.warn('[StorageRecovery] Missing:', integrity.missing);
      
      const recoveryResult = await this.attemptRecovery();
      
      if (recoveryResult.success) {
        console.log(`[StorageRecovery] ✅ Recovery successful via ${recoveryResult.method}`);
        
        // Trigger page reload to pick up recovered data
        if (recoveryResult.method !== 'backup_restore') {
          console.log('[StorageRecovery] 🔄 Reloading page to apply recovered data...');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else {
        console.error(`[StorageRecovery] ❌ Recovery failed: ${recoveryResult.reason}`);
      }
    }
  }
  
  // Get recovery status for debugging
  getRecoveryStatus() {
    return {
      recoveryAttempts: this.recoveryAttempts,
      maxRecoveryAttempts: this.maxRecoveryAttempts,
      lastDataCheck: this.lastDataCheck,
      isElectron: this.isElectron,
      localStorageTest: this.testLocalStorage()
    };
  }
  
  // Manual recovery trigger
  async manualRecovery() {
    console.log('[StorageRecovery] 🔧 Manual recovery triggered...');
    this.recoveryAttempts = 0; // Reset attempts for manual recovery
    return await this.attemptRecovery();
  }
}

// Create singleton instance
const storageRecoveryService = new StorageRecoveryService();

export default storageRecoveryService;