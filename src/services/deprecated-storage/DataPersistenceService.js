// Data Persistence Service
// Handles backup, restore, and persistence of all user data

class DataPersistenceService {
  constructor() {
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
    
    this.backupKeys = [
      'data_backup_1',
      'data_backup_2', 
      'data_backup_3',
      'emergency_backup'
    ];
    
    this.isElectron = !!(window.electron || (window.process && window.process.type));
    
    // Start monitoring for data loss
    this.startDataMonitoring();
  }

  // Check if all critical data exists
  checkDataIntegrity() {
    const results = {
      total: this.dataKeys.length,
      found: 0,
      missing: [],
      sizes: {},
      totalSize: 0
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
    
    console.log('[DataPersistence] Data integrity check:', results);
    return results;
  }

  // Create comprehensive backup of all user data
  async createBackup() {
    try {
      console.log('[DataPersistence] Creating comprehensive backup...');
      
      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        source: 'DataPersistenceService',
        data: {}
      };

      // Backup all important data
      let backedUpCount = 0;
      this.dataKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          backup.data[key] = data;
          backedUpCount++;
        }
      });

      // Store backup in multiple localStorage locations
      const backupString = JSON.stringify(backup);
      
      // Rotate backups (keep multiple versions)
      const existing1 = localStorage.getItem('data_backup_1');
      const existing2 = localStorage.getItem('data_backup_2');
      
      if (existing1) localStorage.setItem('data_backup_3', existing1);
      if (existing2) localStorage.setItem('data_backup_2', existing2);
      localStorage.setItem('data_backup_1', backupString);
      
      // Also create emergency backup
      localStorage.setItem('emergency_backup', backupString);
      localStorage.setItem('last_backup_time', backup.timestamp);

      console.log(`[DataPersistence] ✅ Backup created: ${backedUpCount} items, ${(backupString.length/1024).toFixed(1)}KB`);
      
      // If in Electron, also try to save to external storage
      if (this.isElectron) {
        await this.saveBackupToFile(backup);
      }
      
      return backup;
    } catch (error) {
      console.error('[DataPersistence] Backup creation failed:', error);
      throw error;
    }
  }

  // Save backup to external file (Electron only)
  async saveBackupToFile(backup) {
    try {
      if (!this.isElectron || !window.electron?.fs) return false;

      const backupDir = '/Volumes/Alexandra-External-SSD-Storge/Aria-Backups';
      const timestamp = backup.timestamp.slice(0, 10);
      const filename = `sephia-backup-${timestamp}.json`;
      const filepath = `${backupDir}/${filename}`;

      // Ensure directory exists
      await window.electron.fs.mkdir(backupDir);
      
      // Write backup file
      await window.electron.fs.writeFile(filepath, JSON.stringify(backup, null, 2));
      
      console.log(`[DataPersistence] ✅ External backup saved: ${filepath}`);
      return true;
    } catch (error) {
      console.error('[DataPersistence] External backup failed:', error);
      return false;
    }
  }

  // Restore data from backup
  async restoreFromBackup(backupKey = null) {
    try {
      console.log('[DataPersistence] Attempting data restore...');
      
      // Try different backup sources in order of preference
      const backupSources = backupKey ? [backupKey] : [
        'data_backup_1',
        'data_backup_2', 
        'data_backup_3',
        'emergency_backup'
      ];

      for (const source of backupSources) {
        const backupData = localStorage.getItem(source);
        if (backupData) {
          try {
            const backup = JSON.parse(backupData);
            
            if (backup.data && typeof backup.data === 'object') {
              let restoredCount = 0;
              
              // Restore each data item
              Object.entries(backup.data).forEach(([key, value]) => {
                localStorage.setItem(key, value);
                restoredCount++;
              });
              
              console.log(`[DataPersistence] ✅ Restored ${restoredCount} items from ${source}`);
              console.log(`[DataPersistence] Backup timestamp: ${backup.timestamp}`);
              
              return {
                success: true,
                source: source,
                timestamp: backup.timestamp,
                itemsRestored: restoredCount
              };
            }
          } catch (parseError) {
            console.error(`[DataPersistence] Failed to parse backup ${source}:`, parseError);
            continue;
          }
        }
      }
      
      console.error('[DataPersistence] No valid backups found');
      return { success: false, error: 'No valid backups found' };
      
    } catch (error) {
      console.error('[DataPersistence] Restore failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Detect and fix data loss
  async detectAndFixDataLoss() {
    console.log('[DataPersistence] Checking for data loss...');
    
    const integrity = this.checkDataIntegrity();
    
    // If we're missing critical data, try to restore
    if (integrity.integrityScore < 0.5) {
      console.warn(`[DataPersistence] 🚨 Data loss detected! Integrity: ${(integrity.integrityScore * 100).toFixed(1)}%`);
      console.warn('[DataPersistence] Missing:', integrity.missing);
      
      // Attempt automatic restore
      const restoreResult = await this.restoreFromBackup();
      
      if (restoreResult.success) {
        console.log(`[DataPersistence] ✅ Auto-restore successful: ${restoreResult.itemsRestored} items`);
        
        // Re-check integrity
        const newIntegrity = this.checkDataIntegrity();
        console.log(`[DataPersistence] New integrity: ${(newIntegrity.integrityScore * 100).toFixed(1)}%`);
        
        return {
          dataLossDetected: true,
          autoRestoreSuccessful: true,
          originalIntegrity: integrity.integrityScore,
          newIntegrity: newIntegrity.integrityScore,
          restoredItems: restoreResult.itemsRestored
        };
      } else {
        console.error('[DataPersistence] ❌ Auto-restore failed');
        return {
          dataLossDetected: true,
          autoRestoreSuccessful: false,
          integrity: integrity.integrityScore,
          error: restoreResult.error
        };
      }
    }
    
    console.log(`[DataPersistence] ✅ Data integrity good: ${(integrity.integrityScore * 100).toFixed(1)}%`);
    return {
      dataLossDetected: false,
      integrity: integrity.integrityScore
    };
  }

  // Monitor data and create periodic backups
  startDataMonitoring() {
    // Create backup on service initialization
    setTimeout(() => {
      this.createBackup().catch(err => 
        console.error('[DataPersistence] Initial backup failed:', err)
      );
    }, 1000);

    // Create backup every 5 minutes
    setInterval(() => {
      this.createBackup().catch(err => 
        console.error('[DataPersistence] Periodic backup failed:', err)
      );
    }, 5 * 60 * 1000);

    // Check for data loss every 30 seconds
    setInterval(() => {
      this.detectAndFixDataLoss().catch(err => 
        console.error('[DataPersistence] Data loss check failed:', err)
      );
    }, 30 * 1000);

    // Listen for beforeunload to create final backup
    window.addEventListener('beforeunload', () => {
      try {
        this.createBackup();
      } catch (error) {
        console.error('[DataPersistence] Final backup failed:', error);
      }
    });

    console.log('[DataPersistence] ✅ Data monitoring started');
  }

  // Force restore from file (Electron only)
  async restoreFromFile(filepath = null) {
    try {
      if (!this.isElectron || !window.electron?.fs) {
        throw new Error('File restore only available in Electron');
      }

      if (!filepath) {
        // Try to find latest backup file
        const backupDir = '/Volumes/Alexandra-External-SSD-Storge/Aria-Backups';
        // This would need directory listing functionality
        filepath = `${backupDir}/sephia-backup-latest.json`;
      }

      const fileData = await window.electron.fs.readFile(filepath);
      const backup = JSON.parse(fileData);

      if (backup.data && typeof backup.data === 'object') {
        let restoredCount = 0;
        
        Object.entries(backup.data).forEach(([key, value]) => {
          localStorage.setItem(key, value);
          restoredCount++;
        });
        
        console.log(`[DataPersistence] ✅ Restored ${restoredCount} items from file: ${filepath}`);
        return { success: true, itemsRestored: restoredCount };
      } else {
        throw new Error('Invalid backup file format');
      }
    } catch (error) {
      console.error('[DataPersistence] File restore failed:', error);
      throw error;
    }
  }

  // Get backup status and statistics
  getBackupStatus() {
    const status = {
      hasBackups: false,
      backupCount: 0,
      latestBackup: null,
      backupSizes: {},
      totalBackupSize: 0
    };

    this.backupKeys.forEach(key => {
      const backup = localStorage.getItem(key);
      if (backup) {
        status.hasBackups = true;
        status.backupCount++;
        const size = new Blob([backup]).size;
        status.backupSizes[key] = size;
        status.totalBackupSize += size;

        try {
          const parsed = JSON.parse(backup);
          if (parsed.timestamp && (!status.latestBackup || parsed.timestamp > status.latestBackup)) {
            status.latestBackup = parsed.timestamp;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    });

    const lastBackupTime = localStorage.getItem('last_backup_time');
    if (lastBackupTime) {
      status.lastBackupTime = lastBackupTime;
    }

    return status;
  }
}

// Create singleton instance
const dataPersistenceService = new DataPersistenceService();

export default dataPersistenceService;