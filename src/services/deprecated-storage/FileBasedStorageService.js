// File-Based Storage Service
// Alternative to localStorage that uses actual files for data persistence

class FileBasedStorageService {
  constructor() {
    this.isElectron = !!(window.electron || (window.process && window.process.type));
    this.storageDir = '/Users/alexandratitus767/Documents/Sephia-Data';
    this.fallbackDir = '/tmp/sephia-data';
    this.isInitialized = false;
    this.initPromise = null;
    
    // Data keys that need to be persisted
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
    
    // Start initialization
    this.initPromise = this.initialize();
  }
  
  async initialize() {
    console.log('[FileStorage] 🚀 Initializing file-based storage...');
    
    try {
      if (!this.isElectron) {
        console.warn('[FileStorage] Not in Electron environment, using localStorage fallback');
        this.isInitialized = true;
        return;
      }
      
      // Ensure storage directory exists
      await this.ensureStorageDirectory();
      
      // Load all data from files into localStorage
      await this.loadAllDataFromFiles();
      
      this.isInitialized = true;
      console.log('[FileStorage] ✅ File-based storage initialized successfully');
      
    } catch (error) {
      console.error('[FileStorage] ❌ Initialization failed:', error);
      this.isInitialized = true; // Continue with localStorage fallback
    }
  }
  
  async ensureInitialized() {
    if (!this.isInitialized && this.initPromise) {
      await this.initPromise;
    }
    return this.isInitialized;
  }
  
  async ensureStorageDirectory() {
    if (!this.isElectron || !window.electron?.fs) {
      throw new Error('File system not available');
    }
    
    try {
      // Try primary storage directory
      await window.electron.fs.mkdir(this.storageDir);
      console.log('[FileStorage] ✅ Storage directory ready:', this.storageDir);
    } catch (error) {
      // Try fallback directory
      try {
        await window.electron.fs.mkdir(this.fallbackDir);
        this.storageDir = this.fallbackDir;
        console.log('[FileStorage] ✅ Using fallback storage directory:', this.storageDir);
      } catch (fallbackError) {
        console.error('[FileStorage] ❌ Cannot create storage directory:', fallbackError);
        throw fallbackError;
      }
    }
  }
  
  getFilePath(key) {
    return `${this.storageDir}/${key}.json`;
  }
  
  async saveToFile(key, data) {
    await this.ensureInitialized();
    
    if (!this.isElectron || !window.electron?.fs) {
      // Fallback to localStorage
      localStorage.setItem(key, data);
      return;
    }
    
    try {
      const filePath = this.getFilePath(key);
      const fileData = {
        key: key,
        data: data,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      
      await window.electron.fs.writeFile(filePath, JSON.stringify(fileData, null, 2));
      console.log(`[FileStorage] ✅ Saved ${key} to file (${(data.length/1024).toFixed(1)}KB)`);
      
      // Also save to localStorage for immediate access
      localStorage.setItem(key, data);
      
    } catch (error) {
      console.error(`[FileStorage] ❌ Failed to save ${key} to file:`, error);
      // Fallback to localStorage only
      localStorage.setItem(key, data);
    }
  }
  
  async loadFromFile(key) {
    await this.ensureInitialized();
    
    if (!this.isElectron || !window.electron?.fs) {
      // Fallback to localStorage
      return localStorage.getItem(key);
    }
    
    try {
      const filePath = this.getFilePath(key);
      const fileExists = await window.electron.fs.fileExists(filePath);
      
      if (!fileExists) {
        // Check localStorage as fallback
        return localStorage.getItem(key);
      }
      
      const fileContent = await window.electron.fs.readFile(filePath);
      const fileData = JSON.parse(fileContent);
      
      if (fileData.data) {
        console.log(`[FileStorage] ✅ Loaded ${key} from file (${(fileData.data.length/1024).toFixed(1)}KB)`);
        
        // Save to localStorage for immediate access
        localStorage.setItem(key, fileData.data);
        
        return fileData.data;
      }
      
    } catch (error) {
      console.error(`[FileStorage] ❌ Failed to load ${key} from file:`, error);
      // Fallback to localStorage
      return localStorage.getItem(key);
    }
    
    return null;
  }
  
  async loadAllDataFromFiles() {
    console.log('[FileStorage] 📂 Loading all data from files...');
    
    let loadedCount = 0;
    let errorCount = 0;
    
    for (const key of this.dataKeys) {
      try {
        const data = await this.loadFromFile(key);
        if (data) {
          loadedCount++;
          console.log(`[FileStorage] ✅ Restored ${key}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`[FileStorage] ❌ Failed to load ${key}:`, error);
      }
    }
    
    console.log(`[FileStorage] 📊 Loaded ${loadedCount} items, ${errorCount} errors`);
    return { loadedCount, errorCount };
  }
  
  async saveAllDataToFiles() {
    console.log('[FileStorage] 💾 Saving all data to files...');
    
    let savedCount = 0;
    let errorCount = 0;
    
    for (const key of this.dataKeys) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          await this.saveToFile(key, data);
          savedCount++;
        }
      } catch (error) {
        errorCount++;
        console.error(`[FileStorage] ❌ Failed to save ${key}:`, error);
      }
    }
    
    console.log(`[FileStorage] 📊 Saved ${savedCount} items, ${errorCount} errors`);
    return { savedCount, errorCount };
  }
  
  // Override localStorage methods to automatically save to files
  setItem(key, value) {
    if (this.dataKeys.includes(key)) {
      // Save to file AND localStorage
      this.saveToFile(key, value).catch(err => 
        console.error(`[FileStorage] Background save failed for ${key}:`, err)
      );
    } else {
      // Just localStorage for non-critical data
      localStorage.setItem(key, value);
    }
  }
  
  getItem(key) {
    return localStorage.getItem(key);
  }
  
  removeItem(key) {
    localStorage.removeItem(key);
    
    if (this.dataKeys.includes(key) && this.isElectron && window.electron?.fs) {
      // Also remove from file
      const filePath = this.getFilePath(key);
      window.electron.fs.deleteFile(filePath).catch(err => 
        console.error(`[FileStorage] Failed to delete file for ${key}:`, err)
      );
    }
  }
  
  // Create comprehensive backup
  async createBackup() {
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      source: 'FileBasedStorageService',
      localStorage: {},
      files: {}
    };
    
    // Backup localStorage data
    for (const key of this.dataKeys) {
      const data = localStorage.getItem(key);
      if (data) {
        backup.localStorage[key] = data;
      }
    }
    
    // Save backup to file
    if (this.isElectron && window.electron?.fs) {
      try {
        const backupPath = `${this.storageDir}/backup-${Date.now()}.json`;
        await window.electron.fs.writeFile(backupPath, JSON.stringify(backup, null, 2));
        console.log('[FileStorage] ✅ Backup created:', backupPath);
        return backupPath;
      } catch (error) {
        console.error('[FileStorage] ❌ Backup creation failed:', error);
      }
    }
    
    return backup;
  }
  
  // Monitor for localStorage changes and auto-save
  startMonitoring() {
    // Override localStorage methods globally
    const originalSetItem = localStorage.setItem.bind(localStorage);
    const self = this;
    
    localStorage.setItem = function(key, value) {
      originalSetItem(key, value);
      
      if (self.dataKeys.includes(key)) {
        console.log(`[FileStorage] 🔄 Auto-saving ${key} to file...`);
        self.saveToFile(key, value).catch(err => 
          console.error(`[FileStorage] Auto-save failed for ${key}:`, err)
        );
      }
    };
    
    // Periodic full backup
    setInterval(() => {
      this.saveAllDataToFiles().catch(err => 
        console.error('[FileStorage] Periodic save failed:', err)
      );
    }, 2 * 60 * 1000); // Every 2 minutes
    
    // Save on page unload
    window.addEventListener('beforeunload', () => {
      this.saveAllDataToFiles().catch(err => 
        console.error('[FileStorage] Final save failed:', err)
      );
    });
    
    console.log('[FileStorage] ✅ Monitoring started');
  }
  
  // Check data integrity
  async checkIntegrity() {
    const results = {
      localStorage: { found: 0, missing: [] },
      files: { found: 0, missing: [] },
      inconsistent: []
    };
    
    for (const key of this.dataKeys) {
      // Check localStorage
      const localData = localStorage.getItem(key);
      if (localData) {
        results.localStorage.found++;
      } else {
        results.localStorage.missing.push(key);
      }
      
      // Check files
      if (this.isElectron && window.electron?.fs) {
        try {
          const filePath = this.getFilePath(key);
          const fileExists = await window.electron.fs.fileExists(filePath);
          if (fileExists) {
            results.files.found++;
            
            // Check if localStorage and file data match
            const fileContent = await window.electron.fs.readFile(filePath);
            const fileData = JSON.parse(fileContent);
            if (fileData.data !== localData) {
              results.inconsistent.push(key);
            }
          } else {
            results.files.missing.push(key);
          }
        } catch (error) {
          results.files.missing.push(key);
        }
      }
    }
    
    return results;
  }
}

// Create singleton instance
const fileBasedStorageService = new FileBasedStorageService();

export default fileBasedStorageService;