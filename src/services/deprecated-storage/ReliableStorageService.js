// Reliable Storage Service
// Uses Electron's userData directory for guaranteed persistence

class ReliableStorageService {
  constructor() {
    this.isElectron = !!(window.electron?.storage);
    this.cache = new Map(); // In-memory cache for performance
    this.isInitialized = false;
    this.initPromise = null;
    
    // Data keys that need reliable storage
    this.dataKeys = [
      'sephia_profile',
      'sephia_settings', 
      'sephia_voice_settings',
      'sephia_chats',
      'sephia_projects',
      'aria_memory_system',
      'sephia_current_model',
      'sephia_companion_mode',
      'sephia_theme'
    ];
    
    console.log('[ReliableStorage] Service created, Electron available:', this.isElectron);
    
    // Start initialization
    this.initPromise = this.initialize();
  }
  
  async initialize() {
    console.log('[ReliableStorage] 🚀 Initializing reliable storage...');
    
    try {
      if (!this.isElectron) {
        console.warn('[ReliableStorage] Not in Electron, using localStorage fallback');
        this.isInitialized = true;
        return;
      }
      
      // Load all data from persistent storage into cache and localStorage
      await this.loadAllData();
      
      // Override localStorage methods to intercept critical data
      this.interceptLocalStorage();
      
      this.isInitialized = true;
      console.log('[ReliableStorage] ✅ Reliable storage initialized');
      
    } catch (error) {
      console.error('[ReliableStorage] ❌ Initialization failed:', error);
      this.isInitialized = true; // Continue with localStorage fallback
    }
  }
  
  async ensureInitialized() {
    if (!this.isInitialized && this.initPromise) {
      await this.initPromise;
    }
    return this.isInitialized;
  }
  
  // Load all data from persistent storage
  async loadAllData() {
    console.log('[ReliableStorage] 📂 Loading all data from persistent storage...');
    
    let loadedCount = 0;
    
    for (const key of this.dataKeys) {
      try {
        const data = await window.electron.storage.get(key);
        if (data) {
          // Extract the actual value from the storage format
          let valueToRestore = data;
          
          // Check if data is in the {key, value, timestamp} format
          if (typeof data === 'string') {
            try {
              const parsed = JSON.parse(data);
              if (parsed.value) {
                valueToRestore = parsed.value;
              }
            } catch (e) {
              // If parsing fails, use data as-is
              valueToRestore = data;
            }
          }
          
          // Store in cache
          this.cache.set(key, valueToRestore);
          
          // Also restore to localStorage for immediate access
          localStorage.setItem(key, valueToRestore);
          
          loadedCount++;
          console.log(`[ReliableStorage] ✅ Loaded ${key} (${typeof valueToRestore === 'string' ? valueToRestore.length : 'object'} chars)`);
        }
      } catch (error) {
        console.error(`[ReliableStorage] ❌ Failed to load ${key}:`, error);
      }
    }
    
    console.log(`[ReliableStorage] 📊 Loaded ${loadedCount}/${this.dataKeys.length} items`);
    return loadedCount;
  }
  
  // Save data to persistent storage
  async saveData(key, value) {
    try {
      if (!this.isElectron) {
        // Fallback to localStorage only
        localStorage.setItem(key, value);
        return true;
      }
      
      // Save to persistent storage
      await window.electron.storage.set(key, value);
      
      // Update cache
      this.cache.set(key, value);
      
      // Also update localStorage for immediate access
      localStorage.setItem(key, value);
      
      console.log(`[ReliableStorage] ✅ Saved ${key} to persistent storage`);
      return true;
      
    } catch (error) {
      console.error(`[ReliableStorage] ❌ Failed to save ${key}:`, error);
      
      // Fallback to localStorage only
      localStorage.setItem(key, value);
      this.cache.set(key, value);
      return false;
    }
  }
  
  // Get data (try cache first, then localStorage, then persistent storage)
  async getData(key) {
    try {
      // Try cache first
      if (this.cache.has(key)) {
        return this.cache.get(key);
      }
      
      // Try localStorage
      const localData = localStorage.getItem(key);
      if (localData) {
        this.cache.set(key, localData);
        return localData;
      }
      
      // Try persistent storage
      if (this.isElectron) {
        const persistentData = await window.electron.storage.get(key);
        if (persistentData) {
          // Extract the actual value from the storage format
          let valueToRestore = persistentData;
          
          // Check if data is in the {key, value, timestamp} format
          if (typeof persistentData === 'string') {
            try {
              const parsed = JSON.parse(persistentData);
              if (parsed.value) {
                valueToRestore = parsed.value;
              }
            } catch (e) {
              // If parsing fails, use data as-is
              valueToRestore = persistentData;
            }
          }
          
          this.cache.set(key, valueToRestore);
          localStorage.setItem(key, valueToRestore);
          return valueToRestore;
        }
      }
      
      return null;
      
    } catch (error) {
      console.error(`[ReliableStorage] ❌ Failed to get ${key}:`, error);
      return localStorage.getItem(key);
    }
  }
  
  // Intercept localStorage methods for critical data
  interceptLocalStorage() {
    const originalSetItem = localStorage.setItem.bind(localStorage);
    const self = this;
    
    localStorage.setItem = function(key, value) {
      // Always call original first
      originalSetItem(key, value);
      
      // If it's critical data, also save to persistent storage
      if (self.dataKeys.includes(key)) {
        console.log(`[ReliableStorage] 🔄 Intercepted ${key}, saving to persistent storage...`);
        
        // Save async without blocking
        self.saveData(key, value).catch(err => 
          console.error(`[ReliableStorage] Background save failed for ${key}:`, err)
        );
      }
    };
    
    console.log('[ReliableStorage] ✅ localStorage interception active');
  }
  
  // Force create essential user data
  async forceCreateUserData() {
    console.log('[ReliableStorage] 🔧 Force creating essential user data...');
    
    const timestamp = new Date().toISOString();
    
    const essentialData = {
      sephia_profile: JSON.stringify({
        name: 'Alexandra',
        email: 'alexandra@example.com',
        picture: '',
        bio: 'Developer working on AI systems',
        reliableStorageCreated: true,
        timestamp: timestamp
      }),
      
      aria_memory_system: JSON.stringify({
        personal: [
          ['name', { value: 'Alexandra', timestamp: timestamp, source: 'reliable_storage', confidence: 1.0 }],
          ['user_name', { value: 'Alexandra', timestamp: timestamp, source: 'reliable_storage', confidence: 1.0 }]
        ],
        conversations: [],
        relationships: [],
        projects: [],
        interests: [],
        patterns: [],
        emotions: [],
        achievements: [],
        timestamp: timestamp,
        source: 'reliable_storage'
      }),
      
      sephia_voice_settings: JSON.stringify({
        speechRate: 1.0,
        speechPitch: 1.0,
        speechVolume: 0.8,
        selectedVoice: '',
        recognitionLanguage: 'en-US',
        voiceEnabled: true,
        autoSpeak: true,
        reliableStorageCreated: true,
        timestamp: timestamp
      }),
      
      sephia_settings: JSON.stringify({
        ollamaEndpoint: 'http://localhost:11434',
        temperature: 0.7,
        defaultModel: 'qwen3:14B',
        connectionType: 'ollama',
        syntaxHighlighting: true,
        streamingResponses: true,
        reliableStorageCreated: true,
        timestamp: timestamp
      }),
      
      sephia_current_model: 'qwen3:14B',
      sephia_companion_mode: 'true',
      sephia_chats: JSON.stringify([]),
      sephia_projects: JSON.stringify([])
    };
    
    let createdCount = 0;
    const errors = [];
    
    for (const [key, value] of Object.entries(essentialData)) {
      try {
        await this.saveData(key, value);
        createdCount++;
        console.log(`[ReliableStorage] ✅ Created ${key}`);
      } catch (error) {
        errors.push({ key, error: error.message });
        console.error(`[ReliableStorage] ❌ Failed to create ${key}:`, error);
      }
    }
    
    console.log(`[ReliableStorage] 📊 Created ${createdCount}/${Object.keys(essentialData).length} items`);
    
    return {
      success: createdCount > 0,
      createdCount,
      totalCount: Object.keys(essentialData).length,
      errors,
      timestamp
    };
  }
  
  // Check data integrity
  async checkIntegrity() {
    await this.ensureInitialized();
    
    const results = {
      total: this.dataKeys.length,
      found: 0,
      missing: [],
      storage: {
        localStorage: 0,
        persistentStorage: 0,
        cache: 0
      }
    };
    
    for (const key of this.dataKeys) {
      let found = false;
      
      // Check localStorage
      if (localStorage.getItem(key)) {
        results.storage.localStorage++;
        found = true;
      }
      
      // Check cache
      if (this.cache.has(key)) {
        results.storage.cache++;
        found = true;
      }
      
      // Check persistent storage
      if (this.isElectron) {
        try {
          const data = await window.electron.storage.get(key);
          if (data) {
            results.storage.persistentStorage++;
            found = true;
          }
        } catch (error) {
          // Ignore errors for integrity check
        }
      }
      
      if (found) {
        results.found++;
      } else {
        results.missing.push(key);
      }
    }
    
    results.integrityScore = results.found / results.total;
    
    console.log('[ReliableStorage] 📊 Integrity check:', results);
    return results;
  }
  
  // Recover data from any available source
  async recoverData() {
    console.log('[ReliableStorage] 🔄 Checking data integrity...');
    
    const integrity = await this.checkIntegrity();
    
    // Be less aggressive about force creating data
    // Only force create if we have literally no data at all
    if (integrity.integrityScore === 0) {
      console.warn('[ReliableStorage] 🚨 No data found, creating minimal defaults...');
      const createResult = await this.forceCreateUserData();
      
      if (createResult.success) {
        console.log('[ReliableStorage] ✅ Minimal data created');
        return { success: true, method: 'minimal_create', ...createResult };
      } else {
        console.error('[ReliableStorage] ❌ Data creation failed');
        return { success: false, error: 'Minimal create failed' };
      }
    } else {
      console.log('[ReliableStorage] ✅ Data integrity OK:', `${(integrity.integrityScore * 100).toFixed(1)}%`);
      return { success: true, method: 'no_recovery_needed', integrity };
    }
  }
  
  // Manual save all localStorage data to persistent storage
  async syncAllToPersistent() {
    console.log('[ReliableStorage] 🔄 Syncing all data to persistent storage...');
    
    let syncedCount = 0;
    
    for (const key of this.dataKeys) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          await this.saveData(key, data);
          syncedCount++;
        } catch (error) {
          console.error(`[ReliableStorage] Failed to sync ${key}:`, error);
        }
      }
    }
    
    console.log(`[ReliableStorage] ✅ Synced ${syncedCount} items to persistent storage`);
    return syncedCount;
  }
}

// Create singleton instance
const reliableStorageService = new ReliableStorageService();

export default reliableStorageService;