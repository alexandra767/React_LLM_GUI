// Privacy and Security Service for Aria
class PrivacySecurityService {
  constructor() {
    this.encryptionKeys = new Map();
    this.accessControls = new Map();
    this.permissions = new Map();
    this.auditLog = [];
    this.sessions = new Map();
    this.securityPolicies = new Map();
    
    this.config = {
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      encryptionAlgorithm: 'AES-GCM',
      keyLength: 256,
      auditRetention: 90 * 24 * 60 * 60 * 1000 // 90 days
    };
    
    this.cryptoAPI = window.crypto || window.msCrypto;
    this.storageKey = 'aria_security_config';
    
    this.initializeSecurity();
  }

  // Initialize security system
  async initializeSecurity() {
    try {
      await this.loadSecurityConfig();
      await this.initializeEncryption();
      this.setupDefaultPolicies();
      this.startSecurityMonitoring();
      
      console.log('[Security] Privacy and security system initialized');
    } catch (error) {
      console.error('[Security] Failed to initialize security:', error);
    }
  }

  // Load security configuration
  async loadSecurityConfig() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const config = JSON.parse(stored);
        
        // Restore non-sensitive configuration
        this.accessControls = new Map(config.accessControls || []);
        this.permissions = new Map(config.permissions || []);
        this.securityPolicies = new Map(config.securityPolicies || []);
        this.auditLog = config.auditLog || [];
        
        console.log('[Security] Loaded security configuration');
      }
    } catch (error) {
      console.error('[Security] Failed to load security config:', error);
    }
  }

  // Save security configuration
  saveSecurityConfig() {
    try {
      const config = {
        accessControls: Array.from(this.accessControls.entries()),
        permissions: Array.from(this.permissions.entries()),
        securityPolicies: Array.from(this.securityPolicies.entries()),
        auditLog: this.auditLog.slice(-1000), // Keep last 1000 entries
        lastSave: Date.now()
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(config));
    } catch (error) {
      console.error('[Security] Failed to save security config:', error);
    }
  }

  // Initialize encryption system
  async initializeEncryption() {
    try {
      // Generate master key if not exists
      if (!this.encryptionKeys.has('master')) {
        const masterKey = await this.generateEncryptionKey();
        this.encryptionKeys.set('master', masterKey);
        
        console.log('[Security] Generated master encryption key');
      }
      
      // Generate session-specific keys
      await this.generateSessionKeys();
      
    } catch (error) {
      console.error('[Security] Failed to initialize encryption:', error);
    }
  }

  // Generate encryption key
  async generateEncryptionKey() {
    try {
      const key = await this.cryptoAPI.subtle.generateKey(
        {
          name: this.config.encryptionAlgorithm,
          length: this.config.keyLength
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );
      
      return key;
    } catch (error) {
      console.error('[Security] Failed to generate encryption key:', error);
      throw error;
    }
  }

  // Generate session-specific keys
  async generateSessionKeys() {
    const sessionId = this.generateSessionId();
    const sessionKey = await this.generateEncryptionKey();
    
    this.encryptionKeys.set(`session_${sessionId}`, sessionKey);
    
    return sessionId;
  }

  // Generate session ID
  generateSessionId() {
    const array = new Uint8Array(16);
    this.cryptoAPI.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Encrypt data
  async encryptData(data, keyId = 'master') {
    try {
      const key = this.encryptionKeys.get(keyId);
      if (!key) {
        throw new Error(`Encryption key not found: ${keyId}`);
      }
      
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(JSON.stringify(data));
      
      // Generate initialization vector
      const iv = this.cryptoAPI.getRandomValues(new Uint8Array(12));
      
      const encryptedData = await this.cryptoAPI.subtle.encrypt(
        {
          name: this.config.encryptionAlgorithm,
          iv: iv
        },
        key,
        dataBuffer
      );
      
      // Combine IV and encrypted data
      const result = new Uint8Array(iv.length + encryptedData.byteLength);
      result.set(iv);
      result.set(new Uint8Array(encryptedData), iv.length);
      
      // Convert to base64 for storage
      return btoa(String.fromCharCode(...result));
      
    } catch (error) {
      console.error('[Security] Encryption failed:', error);
      throw error;
    }
  }

  // Decrypt data
  async decryptData(encryptedData, keyId = 'master') {
    try {
      const key = this.encryptionKeys.get(keyId);
      if (!key) {
        throw new Error(`Encryption key not found: ${keyId}`);
      }
      
      // Convert from base64
      const combinedData = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      // Extract IV and encrypted data
      const iv = combinedData.slice(0, 12);
      const encrypted = combinedData.slice(12);
      
      const decryptedBuffer = await this.cryptoAPI.subtle.decrypt(
        {
          name: this.config.encryptionAlgorithm,
          iv: iv
        },
        key,
        encrypted
      );
      
      const decoder = new TextDecoder();
      const decryptedText = decoder.decode(decryptedBuffer);
      
      return JSON.parse(decryptedText);
      
    } catch (error) {
      console.error('[Security] Decryption failed:', error);
      throw error;
    }
  }

  // Secure storage methods
  async secureStore(key, data, options = {}) {
    try {
      const encryptionKeyId = options.keyId || 'master';
      const encrypted = await this.encryptData(data, encryptionKeyId);
      
      const secureData = {
        encrypted,
        keyId: encryptionKeyId,
        timestamp: Date.now(),
        checksum: await this.calculateChecksum(data),
        metadata: options.metadata || {}
      };
      
      localStorage.setItem(`secure_${key}`, JSON.stringify(secureData));
      
      this.auditLog.push({
        action: 'secure_store',
        key,
        timestamp: Date.now(),
        success: true
      });
      
      console.log(`[Security] Securely stored data: ${key}`);
      return true;
      
    } catch (error) {
      this.auditLog.push({
        action: 'secure_store',
        key,
        timestamp: Date.now(),
        success: false,
        error: error.message
      });
      
      console.error('[Security] Secure storage failed:', error);
      throw error;
    }
  }

  // Secure retrieval methods
  async secureRetrieve(key, options = {}) {
    try {
      const storedData = localStorage.getItem(`secure_${key}`);
      if (!storedData) {
        throw new Error(`Secure data not found: ${key}`);
      }
      
      const secureData = JSON.parse(storedData);
      const decrypted = await this.decryptData(secureData.encrypted, secureData.keyId);
      
      // Verify data integrity
      const currentChecksum = await this.calculateChecksum(decrypted);
      if (currentChecksum !== secureData.checksum) {
        throw new Error('Data integrity check failed');
      }
      
      this.auditLog.push({
        action: 'secure_retrieve',
        key,
        timestamp: Date.now(),
        success: true
      });
      
      return decrypted;
      
    } catch (error) {
      this.auditLog.push({
        action: 'secure_retrieve',
        key,
        timestamp: Date.now(),
        success: false,
        error: error.message
      });
      
      console.error('[Security] Secure retrieval failed:', error);
      throw error;
    }
  }

  // Calculate data checksum
  async calculateChecksum(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    
    const hashBuffer = await this.cryptoAPI.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Access control methods
  createAccessControl(resourceId, permissions, conditions = {}) {
    const accessControl = {
      id: `ac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      resourceId,
      permissions, // ['read', 'write', 'execute', 'delete']
      conditions: {
        timeRange: conditions.timeRange || null,
        ipRestrictions: conditions.ipRestrictions || [],
        userAgent: conditions.userAgent || null,
        sessionRequired: conditions.sessionRequired !== false,
        ...conditions
      },
      createdAt: Date.now(),
      lastModified: Date.now(),
      active: true
    };
    
    this.accessControls.set(accessControl.id, accessControl);
    this.saveSecurityConfig();
    
    console.log(`[Security] Created access control: ${accessControl.id}`);
    return accessControl.id;
  }

  // Check permissions
  async checkPermission(resourceId, requiredPermission, context = {}) {
    try {
      // Find applicable access controls
      const applicableControls = Array.from(this.accessControls.values()).filter(
        ac => ac.resourceId === resourceId && ac.active
      );
      
      if (applicableControls.length === 0) {
        // No specific controls - check default policy
        return this.checkDefaultPermission(resourceId, requiredPermission);
      }
      
      for (const control of applicableControls) {
        if (control.permissions.includes(requiredPermission)) {
          // Check conditions
          if (await this.evaluateAccessConditions(control.conditions, context)) {
            this.auditLog.push({
              action: 'permission_granted',
              resourceId,
              permission: requiredPermission,
              accessControlId: control.id,
              timestamp: Date.now()
            });
            
            return true;
          }
        }
      }
      
      this.auditLog.push({
        action: 'permission_denied',
        resourceId,
        permission: requiredPermission,
        reason: 'access_control_restriction',
        timestamp: Date.now()
      });
      
      return false;
      
    } catch (error) {
      console.error('[Security] Permission check failed:', error);
      
      this.auditLog.push({
        action: 'permission_check_error',
        resourceId,
        permission: requiredPermission,
        error: error.message,
        timestamp: Date.now()
      });
      
      return false;
    }
  }

  // Evaluate access conditions
  async evaluateAccessConditions(conditions, context) {
    // Session requirement
    if (conditions.sessionRequired && !context.sessionId) {
      return false;
    }
    
    // Time range restrictions
    if (conditions.timeRange) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      if (currentTime < conditions.timeRange.start || currentTime > conditions.timeRange.end) {
        return false;
      }
    }
    
    // IP restrictions
    if (conditions.ipRestrictions.length > 0 && context.ipAddress) {
      if (!conditions.ipRestrictions.includes(context.ipAddress)) {
        return false;
      }
    }
    
    // User agent restrictions
    if (conditions.userAgent && context.userAgent) {
      if (!context.userAgent.includes(conditions.userAgent)) {
        return false;
      }
    }
    
    return true;
  }

  // Check default permission
  checkDefaultPermission(resourceId, requiredPermission) {
    const defaultPolicy = this.securityPolicies.get('default');
    if (!defaultPolicy) {
      return false; // Deny by default
    }
    
    return defaultPolicy.allowedPermissions.includes(requiredPermission);
  }

  // Session management
  createSession(userId, metadata = {}) {
    const sessionId = this.generateSessionId();
    
    const session = {
      id: sessionId,
      userId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      expiresAt: Date.now() + this.config.sessionTimeout,
      metadata,
      active: true,
      permissions: []
    };
    
    this.sessions.set(sessionId, session);
    
    this.auditLog.push({
      action: 'session_created',
      sessionId,
      userId,
      timestamp: Date.now()
    });
    
    console.log(`[Security] Created session: ${sessionId}`);
    return sessionId;
  }

  // Validate session
  validateSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { valid: false, reason: 'session_not_found' };
    }
    
    if (!session.active) {
      return { valid: false, reason: 'session_inactive' };
    }
    
    if (Date.now() > session.expiresAt) {
      this.terminateSession(sessionId);
      return { valid: false, reason: 'session_expired' };
    }
    
    // Update last activity
    session.lastActivity = Date.now();
    session.expiresAt = Date.now() + this.config.sessionTimeout;
    
    return { valid: true, session };
  }

  // Terminate session
  terminateSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.active = false;
      session.terminatedAt = Date.now();
      
      this.auditLog.push({
        action: 'session_terminated',
        sessionId,
        timestamp: Date.now()
      });
      
      console.log(`[Security] Terminated session: ${sessionId}`);
    }
  }

  // Setup default security policies
  setupDefaultPolicies() {
    // Default access policy
    this.securityPolicies.set('default', {
      name: 'Default Access Policy',
      allowedPermissions: ['read'],
      deniedPermissions: ['write', 'execute', 'delete'],
      requireAuthentication: true,
      maxSessionDuration: this.config.sessionTimeout,
      auditRequired: true
    });
    
    // Sensitive data policy
    this.securityPolicies.set('sensitive', {
      name: 'Sensitive Data Policy',
      allowedPermissions: [],
      deniedPermissions: ['read', 'write', 'execute', 'delete'],
      requireAuthentication: true,
      requireMFA: true,
      auditRequired: true,
      encryptionRequired: true
    });
    
    // Public data policy
    this.securityPolicies.set('public', {
      name: 'Public Data Policy',
      allowedPermissions: ['read'],
      deniedPermissions: ['write', 'execute', 'delete'],
      requireAuthentication: false,
      auditRequired: false
    });
    
    this.saveSecurityConfig();
    console.log('[Security] Default security policies configured');
  }

  // Data classification methods
  classifyData(data, category = 'general') {
    const classification = {
      id: `data_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category, // 'public', 'internal', 'confidential', 'restricted'
      sensitivity: this.calculateSensitivity(data),
      requiresEncryption: category !== 'public',
      retentionPeriod: this.getRetentionPeriod(category),
      accessLevel: this.getAccessLevel(category),
      classifiedAt: Date.now()
    };
    
    return classification;
  }

  // Calculate data sensitivity
  calculateSensitivity(data) {
    const dataString = JSON.stringify(data).toLowerCase();
    let sensitivityScore = 0;
    
    // Check for sensitive patterns
    const sensitivePatterns = [
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/, // Email
      /\bpassword\b/i,
      /\bapi[_-]?key\b/i,
      /\btoken\b/i,
      /\bsecret\b/i
    ];
    
    sensitivePatterns.forEach(pattern => {
      if (pattern.test(dataString)) {
        sensitivityScore += 1;
      }
    });
    
    if (sensitivityScore === 0) return 'low';
    if (sensitivityScore <= 2) return 'medium';
    return 'high';
  }

  // Get retention period based on category
  getRetentionPeriod(category) {
    const retentionPeriods = {
      public: 365 * 24 * 60 * 60 * 1000, // 1 year
      internal: 3 * 365 * 24 * 60 * 60 * 1000, // 3 years
      confidential: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
      restricted: 10 * 365 * 24 * 60 * 60 * 1000 // 10 years
    };
    
    return retentionPeriods[category] || retentionPeriods.internal;
  }

  // Get access level based on category
  getAccessLevel(category) {
    const accessLevels = {
      public: 1,
      internal: 2,
      confidential: 3,
      restricted: 4
    };
    
    return accessLevels[category] || 2;
  }

  // Privacy compliance methods
  processDataRequest(requestType, userId, dataTypes = []) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const request = {
      id: requestId,
      type: requestType, // 'access', 'rectification', 'erasure', 'portability'
      userId,
      dataTypes,
      status: 'pending',
      createdAt: Date.now(),
      processedAt: null,
      response: null
    };
    
    this.auditLog.push({
      action: 'privacy_request',
      requestId,
      requestType,
      userId,
      timestamp: Date.now()
    });
    
    // Process the request
    this.processPrivacyRequest(request);
    
    return requestId;
  }

  // Process privacy request
  async processPrivacyRequest(request) {
    try {
      let response = {};
      
      switch (request.type) {
        case 'access':
          response = await this.handleDataAccessRequest(request);
          break;
        
        case 'rectification':
          response = await this.handleDataRectificationRequest(request);
          break;
        
        case 'erasure':
          response = await this.handleDataErasureRequest(request);
          break;
        
        case 'portability':
          response = await this.handleDataPortabilityRequest(request);
          break;
        
        default:
          throw new Error(`Unknown request type: ${request.type}`);
      }
      
      request.status = 'completed';
      request.processedAt = Date.now();
      request.response = response;
      
    } catch (error) {
      request.status = 'failed';
      request.processedAt = Date.now();
      request.response = { error: error.message };
      
      console.error('[Security] Privacy request processing failed:', error);
    }
  }

  // Handle data access request
  async handleDataAccessRequest(request) {
    // Mock implementation - would collect actual user data
    return {
      personalData: {
        profile: 'User profile data',
        preferences: 'User preferences',
        conversationHistory: 'Chat history summary'
      },
      dataProcessing: {
        purposes: ['Service improvement', 'Personalization'],
        legalBasis: 'User consent',
        retentionPeriod: '3 years'
      }
    };
  }

  // Handle data rectification request
  async handleDataRectificationRequest(request) {
    // Mock implementation - would update actual user data
    return {
      status: 'Data rectification completed',
      updatedFields: request.dataTypes || ['profile']
    };
  }

  // Handle data erasure request
  async handleDataErasureRequest(request) {
    // Mock implementation - would delete actual user data
    return {
      status: 'Data erasure completed',
      deletedData: request.dataTypes || ['all_personal_data']
    };
  }

  // Handle data portability request
  async handleDataPortabilityRequest(request) {
    // Mock implementation - would export user data
    return {
      status: 'Data export completed',
      downloadLink: 'secure_download_link',
      format: 'JSON',
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    };
  }

  // Start security monitoring
  startSecurityMonitoring() {
    // Clean up expired sessions
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Audit log maintenance
    setInterval(() => {
      this.maintainAuditLog();
    }, 24 * 60 * 60 * 1000); // Daily
    
    // Security health check
    setInterval(() => {
      this.performSecurityHealthCheck();
    }, 60 * 60 * 1000); // Hourly
    
    console.log('[Security] Security monitoring started');
  }

  // Clean up expired sessions
  cleanupExpiredSessions() {
    const now = Date.now();
    let cleanedSessions = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.active && now > session.expiresAt) {
        this.terminateSession(sessionId);
        cleanedSessions++;
      }
    }
    
    if (cleanedSessions > 0) {
      console.log(`[Security] Cleaned up ${cleanedSessions} expired sessions`);
    }
  }

  // Maintain audit log
  maintainAuditLog() {
    const cutoff = Date.now() - this.config.auditRetention;
    const originalLength = this.auditLog.length;
    
    this.auditLog = this.auditLog.filter(entry => entry.timestamp > cutoff);
    
    const cleaned = originalLength - this.auditLog.length;
    if (cleaned > 0) {
      console.log(`[Security] Cleaned up ${cleaned} old audit log entries`);
      this.saveSecurityConfig();
    }
  }

  // Perform security health check
  performSecurityHealthCheck() {
    const activeSessions = Array.from(this.sessions.values()).filter(s => s.active).length;
    const recentAuditEvents = this.auditLog.filter(
      e => Date.now() - e.timestamp < 60 * 60 * 1000
    ).length;
    
    console.log(`[Security] Health check: ${activeSessions} active sessions, ${recentAuditEvents} recent audit events`);
    
    // Alert on suspicious activity
    if (recentAuditEvents > 1000) {
      console.warn('[Security] High audit activity detected');
    }
  }

  // Get security metrics
  getSecurityMetrics() {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    
    const recentAuditEvents = this.auditLog.filter(e => e.timestamp > last24h);
    const activeSessions = Array.from(this.sessions.values()).filter(s => s.active);
    
    return {
      encryption: {
        algorithmsSupported: [this.config.encryptionAlgorithm],
        keyLength: this.config.keyLength,
        activeKeys: this.encryptionKeys.size
      },
      accessControl: {
        totalControls: this.accessControls.size,
        activeControls: Array.from(this.accessControls.values()).filter(ac => ac.active).length,
        securityPolicies: this.securityPolicies.size
      },
      sessions: {
        active: activeSessions.length,
        total: this.sessions.size,
        averageSessionDuration: this.calculateAverageSessionDuration()
      },
      audit: {
        totalEvents: this.auditLog.length,
        recentEvents: recentAuditEvents.length,
        eventTypes: this.getAuditEventTypes(recentAuditEvents)
      },
      compliance: {
        dataClassifications: ['public', 'internal', 'confidential', 'restricted'],
        privacyRights: ['access', 'rectification', 'erasure', 'portability'],
        retentionPolicies: 4
      }
    };
  }

  // Calculate average session duration
  calculateAverageSessionDuration() {
    const completedSessions = Array.from(this.sessions.values()).filter(
      s => !s.active && s.terminatedAt
    );
    
    if (completedSessions.length === 0) return 0;
    
    const totalDuration = completedSessions.reduce(
      (sum, session) => sum + (session.terminatedAt - session.createdAt),
      0
    );
    
    return totalDuration / completedSessions.length;
  }

  // Get audit event types
  getAuditEventTypes(events) {
    const types = {};
    events.forEach(event => {
      types[event.action] = (types[event.action] || 0) + 1;
    });
    return types;
  }
}

export default new PrivacySecurityService();