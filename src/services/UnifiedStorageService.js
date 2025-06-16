// Unified Storage Service
// Single source of truth for all app storage needs

class UnifiedStorageService {
  constructor() {
    this.isElectron = !!(window.electron?.storage || window.electron?.fs);
    this.initialized = false;
    
    // Define all data categories and their storage strategy
    this.storageConfig = {
      // App settings - always in localStorage for quick access
      settings: {
        keys: ['sephia_settings', 'sephia_voice_settings', 'sephia_theme', 'sephia_current_model', 'sephia_companion_mode'],
        strategy: 'localStorage'
      },
      
      // User profile - localStorage + backup to persistent storage
      profile: {
        keys: ['sephia_profile'],
        strategy: 'localStorage_with_backup'
      },
      
      // Chat data - localStorage for recent, persistent for history
      chats: {
        keys: ['sephia_chats'],
        strategy: 'localStorage_with_backup'
      },
      
      // Project data - localStorage for active, persistent for archives
      projects: {
        keys: ['sephia_projects'],
        strategy: 'localStorage_with_backup'
      },
      
      // Aria memory - specialized storage with external SSD fallback
      memory: {
        keys: ['aria_memory_system'],
        strategy: 'memory_system'
      }
    };
    
    this.cache = new Map();
    this.persistentStoragePath = this.isElectron ? 
      '/Users/alexandratitus767/Documents/Sephia-Storage' : null;
      
    console.log('[UnifiedStorage] 🚀 Unified Storage Service created');
  }
  
  async initialize() {
    if (this.initialized) return;
    
    console.log('[UnifiedStorage] 📡 Initializing unified storage...');
    
    try {
      // Ensure persistent storage directory exists
      if (this.isElectron && window.electron?.fs) {
        await this.ensurePersistentStorage();
      }
      
      // Load all data according to strategy
      await this.loadAllData();
      
      // Initialize Aria memory system
      await this.initializeMemorySystem();
      
      this.initialized = true;
      console.log('[UnifiedStorage] ✅ Unified storage initialized successfully');
      
    } catch (error) {
      console.error('[UnifiedStorage] ❌ Initialization failed:', error);
      this.initialized = true; // Continue with localStorage fallback
    }
  }
  
  async ensurePersistentStorage() {
    if (!this.persistentStoragePath) return;
    
    try {
      await window.electron.fs.mkdir(this.persistentStoragePath);
      console.log('[UnifiedStorage] ✅ Persistent storage ready:', this.persistentStoragePath);
    } catch (error) {
      console.warn('[UnifiedStorage] ⚠️ Persistent storage not available:', error.message);
      this.persistentStoragePath = null;
    }
  }
  
  async loadAllData() {
    console.log('[UnifiedStorage] 📂 Loading all data...');
    
    for (const [category, config] of Object.entries(this.storageConfig)) {
      for (const key of config.keys) {
        try {
          let data = null;
          
          switch (config.strategy) {
            case 'localStorage':
              data = localStorage.getItem(key);
              break;
              
            case 'localStorage_with_backup':
              data = localStorage.getItem(key);
              if (!data && this.persistentStoragePath) {
                data = await this.loadFromPersistent(key);
                if (data) {
                  localStorage.setItem(key, data);
                  console.log(`[UnifiedStorage] ✅ Restored ${key} from persistent storage`);
                }
              }
              break;
              
            case 'memory_system':
              data = localStorage.getItem(key);
              if (!data) {
                data = this.createDefaultMemorySystem();
                localStorage.setItem(key, data);
                console.log(`[UnifiedStorage] ✅ Created default ${key}`);
              }
              break;
          }
          
          if (data) {
            this.cache.set(key, data);
          }
          
        } catch (error) {
          console.error(`[UnifiedStorage] ❌ Failed to load ${key}:`, error);
        }
      }
    }
  }
  
  async loadFromPersistent(key) {
    if (!this.persistentStoragePath || !window.electron?.fs) return null;
    
    try {
      const filePath = `${this.persistentStoragePath}/${key}.json`;
      const fileExists = await window.electron.fs.fileExists(filePath);
      
      if (fileExists) {
        const content = await window.electron.fs.readFile(filePath);
        const parsed = JSON.parse(content);
        return parsed.data || null;
      }
    } catch (error) {
      console.error(`[UnifiedStorage] Failed to load ${key} from persistent:`, error);
    }
    
    return null;
  }
  
  async saveToPersistent(key, data) {
    if (!this.persistentStoragePath || !window.electron?.fs) return false;
    
    try {
      const filePath = `${this.persistentStoragePath}/${key}.json`;
      const fileData = {
        key,
        data,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      
      await window.electron.fs.writeFile(filePath, JSON.stringify(fileData, null, 2));
      return true;
    } catch (error) {
      console.error(`[UnifiedStorage] Failed to save ${key} to persistent:`, error);
      return false;
    }
  }
  
  createDefaultMemorySystem() {
    const timestamp = new Date().toISOString();
    return JSON.stringify({
      personal: [
        ['name', { value: 'Alexandra', timestamp, source: 'unified_storage', confidence: 1.0 }],
        ['user_name', { value: 'Alexandra', timestamp, source: 'unified_storage', confidence: 1.0 }]
      ],
      conversations: [],
      relationships: [],
      projects: [],
      interests: [],
      patterns: [],
      emotions: [],
      achievements: [],
      timestamp,
      source: 'unified_storage'
    });
  }
  
  async initializeMemorySystem() {
    console.log('[UnifiedStorage] 🧠 Initializing Aria memory system...');
    
    const memoryData = this.get('aria_memory_system');
    if (memoryData) {
      try {
        const parsed = JSON.parse(memoryData);
        // Ensure Alexandra's name is in memory
        const personalMap = new Map(parsed.personal || []);
        
        if (!personalMap.has('name') && !personalMap.has('user_name')) {
          const timestamp = new Date().toISOString();
          personalMap.set('name', { value: 'Alexandra', timestamp, source: 'unified_storage', confidence: 1.0 });
          personalMap.set('user_name', { value: 'Alexandra', timestamp, source: 'unified_storage', confidence: 1.0 });
          
          parsed.personal = Array.from(personalMap.entries());
          this.set('aria_memory_system', JSON.stringify(parsed));
          
          console.log('[UnifiedStorage] ✅ Ensured Alexandra\'s name in memory system');
        }
      } catch (error) {
        console.error('[UnifiedStorage] ❌ Memory system validation failed:', error);
      }
    }
  }
  
  // Simple get/set interface
  get(key) {
    // Try cache first
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    // Fallback to localStorage
    const data = localStorage.getItem(key);
    if (data) {
      this.cache.set(key, data);
    }
    return data;
  }
  
  async set(key, value) {
    // Check cache to avoid redundant writes
    const cachedValue = this.cache.get(key);
    if (cachedValue === value) {
      return; // No change, skip write
    }
    
    // Always save to localStorage for immediate access
    localStorage.setItem(key, value);
    
    // Update cache
    this.cache.set(key, value);
    
    // Determine if we need persistent backup with throttling
    const category = this.getCategoryForKey(key);
    if (category?.strategy === 'localStorage_with_backup' || category?.strategy === 'memory_system') {
      this.scheduleBackup(key, value);
    }
    
    console.log(`[UnifiedStorage] ✅ Saved ${key} (${value.length} chars)`);
  }

  scheduleBackup(key, value) {
    // Throttle backups to prevent excessive I/O
    if (this._backupTimeouts) {
      clearTimeout(this._backupTimeouts[key]);
    } else {
      this._backupTimeouts = {};
    }
    
    this._backupTimeouts[key] = setTimeout(async () => {
      await this.saveToPersistent(key, value);
      delete this._backupTimeouts[key];
    }, 2000); // Wait 2 seconds before backup
  }
  
  getCategoryForKey(key) {
    for (const [categoryName, config] of Object.entries(this.storageConfig)) {
      if (config.keys.includes(key)) {
        return config;
      }
    }
    return null;
  }
  
  remove(key) {
    localStorage.removeItem(key);
    this.cache.delete(key);
    
    // Also remove from persistent storage if applicable
    if (this.persistentStoragePath && window.electron?.fs) {
      const filePath = `${this.persistentStoragePath}/${key}.json`;
      window.electron.fs.deleteFile(filePath).catch(() => {
        // Ignore deletion errors
      });
    }
  }
  
  // Create a single daily backup
  async createDailyBackup() {
    if (!this.persistentStoragePath || !window.electron?.fs) return false;
    
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const backupPath = `${this.persistentStoragePath}/backup-${today}.json`;
      
      // Check if today's backup already exists
      const exists = await window.electron.fs.fileExists(backupPath);
      if (exists) {
        console.log('[UnifiedStorage] Today\'s backup already exists');
        return true;
      }
      
      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {}
      };
      
      // Backup all important data
      for (const category of Object.values(this.storageConfig)) {
        for (const key of category.keys) {
          const data = this.get(key);
          if (data) {
            backup.data[key] = data;
          }
        }
      }
      
      await window.electron.fs.writeFile(backupPath, JSON.stringify(backup, null, 2));
      console.log('[UnifiedStorage] ✅ Daily backup created:', backupPath);
      return true;
      
    } catch (error) {
      console.error('[UnifiedStorage] ❌ Daily backup failed:', error);
      return false;
    }
  }
  
  // Get storage statistics
  getStats() {
    const stats = {
      storageLocation: this.persistentStoragePath || 'localStorage only',
      totalKeys: 0,
      totalSize: 0,
      categories: {}
    };
    
    for (const [categoryName, config] of Object.entries(this.storageConfig)) {
      stats.categories[categoryName] = {
        keys: config.keys.length,
        strategy: config.strategy,
        sizes: {}
      };
      
      for (const key of config.keys) {
        const data = this.get(key);
        if (data) {
          const size = new Blob([data]).size;
          stats.categories[categoryName].sizes[key] = size;
          stats.totalSize += size;
          stats.totalKeys++;
        }
      }
    }
    
    return stats;
  }
  
  // Cleanup method to migrate from old storage services
  async migrateFromOldServices() {
    console.log('[UnifiedStorage] 🚛 Migrating from old storage services...');
    
    let migratedCount = 0;
    
    // Get all data keys we care about
    const allKeys = Object.values(this.storageConfig).flatMap(config => config.keys);
    
    for (const key of allKeys) {
      const data = localStorage.getItem(key);
      if (data) {
        await this.set(key, data);
        migratedCount++;
      }
    }
    
    console.log(`[UnifiedStorage] ✅ Migration complete: ${migratedCount} items`);
    return migratedCount;
  }
}

// Create singleton instance
const unifiedStorageService = new UnifiedStorageService();

export default unifiedStorageService;