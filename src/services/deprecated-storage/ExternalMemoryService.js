// External Storage Memory Service for Aria

class ExternalMemoryService {
  constructor(storagePath = null) {
    // Use external SSD for unified memory storage
    this.storagePath = storagePath || '/Volumes/Alexandra-External-SSD-Storge/Aria-Memory';
    this.isElectron = !!(window.electron || (window.process && window.process.type));
    this.fallbackToLocal = false;
    this.isInitialized = false;
    this.initPromise = null;
    
    // Memory structure
    this.memories = {
      personal: new Map(),
      relationships: new Map(), 
      conversations: [],
      projects: new Map(),
      interests: new Map(),
      patterns: new Map(),
      emotions: [],
      achievements: [],
      knowledge: new Map(),
      preferences: new Map()
    };
    
    // Start initialization but don't block constructor
    this.initPromise = this.initializeStorage();
  }

  async initializeStorage() {
    try {
      console.log('[ExternalMemory] 🚀 Starting initialization...');
      console.log('[ExternalMemory] Target storage path:', this.storagePath);
      console.log('[ExternalMemory] Is Electron environment:', this.isElectron);
      
      if (!this.isElectron) {
        console.warn('[ExternalMemory] Not in Electron, falling back to localStorage');
        this.fallbackToLocal = true;
        await this.loadFromLocalStorage();
        await this.addAlexandraName(); // Ensure name is added even in fallback mode
        return;
      }

      // Check if external SSD is accessible
      console.log('[ExternalMemory] 🔍 Checking external SSD access...');
      const storageExists = await this.checkStorageAccess();
      if (!storageExists) {
        console.warn('[Memory] External SSD not accessible, falling back to localStorage');
        this.fallbackToLocal = true;
        await this.loadFromLocalStorage();
        await this.addAlexandraName(); // Ensure name is added even in fallback mode
        return;
      }

      console.log('[Memory] ✅ External SSD storage initialized:', this.storagePath);
      await this.loadMemoriesFromStorage();
      
      // Ensure Alexandra's name is in memory after loading
      await this.addAlexandraName();
      
      this.isInitialized = true;
      console.log('[ExternalMemory] ✅ Initialization completed successfully');
      
    } catch (error) {
      console.error('[ExternalMemory] Initialization failed:', error);
      this.fallbackToLocal = true;
      await this.loadFromLocalStorage();
      await this.addAlexandraName(); // Ensure name is added even in fallback mode
      this.isInitialized = true;
      console.log('[ExternalMemory] ✅ Fallback initialization completed');
    }
  }

  // Ensure initialization is complete before using memory
  async ensureInitialized() {
    if (!this.isInitialized && this.initPromise) {
      await this.initPromise;
    }
    return this.isInitialized;
  }

  async checkStorageAccess() {
    try {
      if (!this.isElectron) return false;
      
      // Check if directory exists and is writable
      const testFile = `${this.storagePath}/.aria-test`;
      await window.electron.writeFile(testFile, 'test');
      await window.electron.deleteFile(testFile);
      return true;
    } catch (error) {
      return false;
    }
  }

  async loadMemoriesFromStorage() {
    try {
      if (this.fallbackToLocal) {
        return this.loadFromLocalStorage();
      }

      // Load from individual JSON files on external SSD
      const files = {
        conversations: `${this.storagePath}/conversations/recent.json`,
        personal: `${this.storagePath}/personal-facts/facts.json`,
        projects: `${this.storagePath}/projects/active.json`
      };

      for (const [type, filePath] of Object.entries(files)) {
        try {
          const data = await window.electron.readFile(filePath);
          const parsed = JSON.parse(data);
          
          if (type === 'conversations') {
            this.memories.conversations = parsed || [];
          } else {
            this.memories[type] = new Map(parsed || []);
          }
        } catch (fileError) {
          console.log(`[ExternalMemory] No existing ${type} file, starting fresh`);
        }
      }

      console.log('[ExternalMemory] ✅ Loaded memories from External SSD:', {
        conversations: this.memories.conversations.length,
        personal: this.memories.personal.size,
        projects: this.memories.projects.size
      });

    } catch (error) {
      console.error('[ExternalMemory] Failed to load from External SSD:', error);
      this.fallbackToLocal = true;
      this.loadFromLocalStorage();
    }
  }

  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('aria_memory_system');
      if (stored) {
        const data = JSON.parse(stored);
        this.memories.personal = new Map(data.personal || []);
        this.memories.relationships = new Map(data.relationships || []);
        this.memories.projects = new Map(data.projects || []);
        this.memories.conversations = data.conversations || [];
        console.log('[ExternalMemory] 📱 Loaded memories from localStorage');
        console.log('[ExternalMemory] 📱 Personal facts loaded:', Array.from(this.memories.personal.keys()));
        
        // Log name specifically
        const nameValue = this.memories.personal.get('name')?.value;
        const userNameValue = this.memories.personal.get('user_name')?.value;
        console.log('[ExternalMemory] 📱 Name values after load:', { name: nameValue, user_name: userNameValue });
      } else {
        console.log('[ExternalMemory] 📱 No localStorage data found');
      }
    } catch (error) {
      console.error('[ExternalMemory] Failed to load from localStorage:', error);
    }
  }

  async saveMemories() {
    if (this.fallbackToLocal) {
      return this.saveToLocalStorage();
    }

    try {
      // Save to organized files on external SSD
      const saves = [
        this.saveConversations(),
        this.savePersonalFacts(),
        this.saveProjects(),
        this.createBackup()
      ];

      await Promise.all(saves);
      console.log('[ExternalMemory] ✅ Saved all memories to External SSD');

    } catch (error) {
      console.error('[ExternalMemory] Failed to save to External SSD:', error);
      // Fallback to localStorage
      this.saveToLocalStorage();
    }
  }

  async saveConversations() {
    const filePath = `${this.storagePath}/conversations/recent.json`;
    const data = this.memories.conversations.slice(-1000); // Keep last 1000 conversations
    await window.electron.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async savePersonalFacts() {
    const filePath = `${this.storagePath}/personal-facts/facts.json`;
    const data = Array.from(this.memories.personal.entries());
    await window.electron.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async saveProjects() {
    const filePath = `${this.storagePath}/projects/active.json`;
    const data = Array.from(this.memories.projects.entries());
    await window.electron.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async createBackup() {
    const backupDir = `${this.storagePath}/backups`;
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const backupFile = `${backupDir}/aria-memory-${timestamp}.json`;

    const fullBackup = {
      timestamp: new Date().toISOString(),
      personal: Array.from(this.memories.personal.entries()),
      relationships: Array.from(this.memories.relationships.entries()),
      projects: Array.from(this.memories.projects.entries()),
      conversations: this.memories.conversations.slice(-100), // Last 100 for backup
      interests: Array.from(this.memories.interests.entries()),
      patterns: Array.from(this.memories.patterns.entries()),
      knowledge: Array.from(this.memories.knowledge.entries())
    };

    await window.electron.writeFile(backupFile, JSON.stringify(fullBackup, null, 2));
    console.log('[ExternalMemory] 📦 Created backup:', backupFile);
  }

  saveToLocalStorage() {
    try {
      const data = {
        personal: Array.from(this.memories.personal.entries()),
        relationships: Array.from(this.memories.relationships.entries()),
        projects: Array.from(this.memories.projects.entries()),
        conversations: this.memories.conversations.slice(-100),
        interests: Array.from(this.memories.interests.entries()),
        patterns: Array.from(this.memories.patterns.entries()),
        knowledge: Array.from(this.memories.knowledge.entries()),
        timestamp: new Date().toISOString()
      };

      localStorage.setItem('aria_memory_system', JSON.stringify(data));
      console.log('[ExternalMemory] 📱 Saved to localStorage as fallback');
    } catch (error) {
      console.error('[ExternalMemory] Failed to save to localStorage:', error);
    }
  }

  // Add conversation to memory
  addConversation(userMessage, assistantMessage, metadata = {}) {
    // Clean assistant message BEFORE storing to prevent identity confusion
    const cleanedAssistantMessage = this.sanitizeMessage(assistantMessage.substring(0, 2000));
    
    const conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      userMessage: userMessage.substring(0, 1000), // Limit length
      assistantMessage: cleanedAssistantMessage,
      topics: this.extractTopics(userMessage + ' ' + cleanedAssistantMessage),
      mood: metadata.mood || 'neutral',
      context: metadata.context || {},
      importance: this.calculateImportance(userMessage, cleanedAssistantMessage)
    };

    this.memories.conversations.push(conversation);
    
    // Auto-save every 5 conversations
    if (this.memories.conversations.length % 5 === 0) {
      this.saveMemories();
    }

    console.log('[ExternalMemory] 💬 Added conversation:', conversation.id);
    return conversation;
  }

  // Add personal fact
  async addPersonalInfo(key, value, source = 'conversation') {
    await this.ensureInitialized();
    
    const fact = {
      value,
      timestamp: new Date().toISOString(),
      source,
      confidence: 0.8,
      lastUpdated: new Date().toISOString()
    };

    this.memories.personal.set(key, fact);
    await this.saveMemories();
    
    console.log('[ExternalMemory] 👤 Added personal fact:', key);
    return fact;
  }

  // Add project/task
  addProject(name, details) {
    const project = {
      name,
      details,
      status: 'active',
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      tasks: [],
      progress: 0
    };

    this.memories.projects.set(name, project);
    this.saveMemories();
    
    console.log('[ExternalMemory] 📋 Added project:', name);
    return project;
  }

  // Add interest/topic tracking
  addInterest(topic, type = 'mentioned', metadata = {}) {
    const interest = {
      topic,
      type,
      firstMentioned: new Date().toISOString(),
      lastMentioned: new Date().toISOString(),
      frequency: 1,
      metadata
    };

    if (this.memories.interests.has(topic)) {
      const existing = this.memories.interests.get(topic);
      existing.lastMentioned = new Date().toISOString();
      existing.frequency += 1;
      existing.metadata = { ...existing.metadata, ...metadata };
    } else {
      this.memories.interests.set(topic, interest);
    }

    console.log('[ExternalMemory] 💡 Added interest:', topic);
    return this.memories.interests.get(topic);
  }

  // Add relationship tracking
  addRelationship(name, relationship, metadata = {}) {
    const relationshipData = {
      name,
      relationship,
      firstMentioned: new Date().toISOString(),
      lastMentioned: new Date().toISOString(),
      metadata
    };

    this.memories.relationships.set(name, relationshipData);
    console.log('[ExternalMemory] 👥 Added relationship:', name, '-', relationship);
    return relationshipData;
  }

  // Get relevant context for current conversation
  async getRelevantContext(currentMessage) {
    try {
      // Ensure memory is initialized before accessing
      await this.ensureInitialized();
      
      // Clean conversations to remove identity confusion
      const cleanConversations = this.memories.conversations
        .slice(-10)
        .map(conv => this.sanitizeConversation(conv));

      // Build personal facts object in the format CompanionService expects
      const personal = {};
      for (const [key, fact] of this.memories.personal.entries()) {
        personal[key] = fact;
      }

      // Build relationships object
      const relationships = {};
      for (const [name, relationshipData] of this.memories.relationships.entries()) {
        relationships[name] = relationshipData;
      }

      // Build interests/preferences
      const topInterests = Array.from(this.memories.interests.entries())
        .sort((a, b) => b[1].frequency - a[1].frequency)
        .slice(0, 5)
        .map(([topic]) => topic);

      const context = {
        personal: personal,
        relationships: relationships,
        conversations: cleanConversations,
        preferences: {
          topInterests: topInterests
        },
        currentTopics: this.extractTopics(currentMessage),
        conversationCount: this.memories.conversations.length
      };

      console.log('[ExternalMemory] 🧠 Retrieved context:', {
        conversations: context.conversations.length,
        personalKeys: Object.keys(context.personal),
        relationshipCount: Object.keys(context.relationships).length,
        userName: context.personal.name?.value || context.personal.user_name?.value,
        personalData: context.personal
      });

      return context;
    } catch (error) {
      console.error('[ExternalMemory] Failed to get context:', error);
      return {};
    }
  }

  // Sanitize conversation to remove identity confusion
  // Clean individual message before storage
  sanitizeMessage(message) {
    if (!message || typeof message !== 'string') {
      return message;
    }

    return message
      // ULTRA-AGGRESSIVE Monica/identity cleaning - apply same patterns as CompanionService
      .replace(/Hi! I'm Monica.*?I'm Aria/gi, "Hi! I'm Aria")
      .replace(/Hello! I'm Monica.*?I'm Aria/gi, "Hello! I'm Aria")
      .replace(/I'm Monica.*?I'm Aria/gi, "I'm Aria")
      .replace(/Monica.*?Aria/gi, "Aria")
      .replace(/I'm Monica/gi, "I'm Aria")
      .replace(/I am Monica/gi, "I am Aria")
      .replace(/My name is Monica/gi, "My name is Aria")
      .replace(/Hello! I'm Monica/gi, "Hello! I'm Aria")
      .replace(/Hi! I'm Monica/gi, "Hi! I'm Aria")
      .replace(/\bMonica\b/gi, "Aria")
      // Other AI models
      .replace(/I'm Qwen/gi, "I'm Aria")
      .replace(/I am Qwen/gi, "I am Aria")
      .replace(/Hello! I'm Qwen/gi, "Hello! I'm Aria")
      .replace(/This is Qwen/gi, "This is Aria")
      .replace(/My name is Qwen/gi, "My name is Aria")
      .replace(/I'm DeepSeek/gi, "I'm Aria")
      .replace(/I am DeepSeek/gi, "I am Aria")
      .replace(/I'm Claude/gi, "I'm Aria")
      .replace(/I am Claude/gi, "I am Aria")
      .replace(/developed by Alibaba Cloud/gi, "your AI assistant")
      .replace(/developed by DeepSeek/gi, "your AI assistant")
      .replace(/large-scale language model/gi, "AI assistant")
      .replace(/\bQwen\b/gi, "Aria")
      .replace(/\bDeepSeek\b/gi, "Aria")
      .replace(/\bClaude\b/gi, "Aria")
      // Remove thinking processes that were accidentally saved
      .replace(/^(Okay, the user asked me to|First, I should|Let me think about)[\s\S]*?(?=Hello!|Hi!|I'm)/i, '')
      .trim();
  }

  sanitizeConversation(conversation) {
    if (!conversation || !conversation.assistantMessage) {
      return conversation;
    }

    // Use the new sanitizeMessage method
    const cleanedMessage = this.sanitizeMessage(conversation.assistantMessage);

    return {
      ...conversation,
      assistantMessage: cleanedMessage
    };
  }

  // Extract topics from text
  extractTopics(text) {
    const commonTopics = [
      'work', 'family', 'technology', 'health', 'travel', 'food', 'music', 
      'movies', 'books', 'sports', 'weather', 'news', 'programming', 'ai',
      'projects', 'goals', 'relationships', 'hobbies', 'learning'
    ];

    const lowercaseText = text.toLowerCase();
    return commonTopics.filter(topic => lowercaseText.includes(topic));
  }

  // Calculate conversation importance
  calculateImportance(userMessage, assistantMessage) {
    const personalKeywords = ['my name', 'i am', 'i work', 'i live', 'my job', 'my family'];
    const projectKeywords = ['project', 'task', 'goal', 'plan', 'working on'];
    
    const text = (userMessage + ' ' + assistantMessage).toLowerCase();
    
    let importance = 0.5; // Base importance
    
    personalKeywords.forEach(keyword => {
      if (text.includes(keyword)) importance += 0.2;
    });
    
    projectKeywords.forEach(keyword => {
      if (text.includes(keyword)) importance += 0.1;
    });
    
    return Math.min(importance, 1.0);
  }

  // Clean all stored conversations to fix identity issues
  async cleanStoredIdentity() {
    console.log('[ExternalMemory] 🧹 Cleaning stored identity issues...');
    
    // Clean all conversations
    this.memories.conversations = this.memories.conversations.map(conv => this.sanitizeConversation(conv));
    
    // Save cleaned memories
    await this.saveMemories();
    
    console.log('[ExternalMemory] ✅ Identity cleanup completed');
  }

  // Migrate existing localStorage memory to external SSD
  async migrateFromLocalStorage() {
    try {
      console.log('[ExternalMemory] 🚛 Starting migration from localStorage...');
      
      const stored = localStorage.getItem('aria_memory_system');
      if (!stored) {
        console.log('[ExternalMemory] No localStorage data to migrate');
        return false;
      }

      const data = JSON.parse(stored);
      
      // Merge with existing memory (don't overwrite)
      if (data.personal) {
        for (const [key, fact] of data.personal) {
          if (!this.memories.personal.has(key)) {
            this.memories.personal.set(key, fact);
          }
        }
      }
      
      if (data.relationships) {
        for (const [name, rel] of data.relationships) {
          if (!this.memories.relationships.has(name)) {
            this.memories.relationships.set(name, rel);
          }
        }
      }
      
      if (data.conversations) {
        // Add conversations that aren't already there
        const existingIds = new Set(this.memories.conversations.map(c => c.id));
        for (const conv of data.conversations) {
          if (!existingIds.has(conv.id)) {
            this.memories.conversations.push(conv);
          }
        }
      }

      // Save migrated data
      await this.saveMemories();
      
      console.log('[ExternalMemory] ✅ Migration completed successfully');
      return true;
    } catch (error) {
      console.error('[ExternalMemory] Migration failed:', error);
      return false;
    }
  }

  // Add Alexandra's name to memory if not already present
  async addAlexandraName() {
    console.log('[ExternalMemory] 🔍 Checking if user name exists...');
    console.log('[ExternalMemory] Current personal facts:', Array.from(this.memories.personal.keys()));
    
    const hasName = this.memories.personal.has('name') || this.memories.personal.has('user_name');
    console.log('[ExternalMemory] Has name in memory:', hasName);
    
    if (!hasName) {
      console.log('[ExternalMemory] 👤 Adding Alexandra\'s name to memory...');
      await this.addPersonalInfo('name', 'Alexandra', 'system_setup');
      await this.addPersonalInfo('user_name', 'Alexandra', 'system_setup');
      console.log('[ExternalMemory] ✅ Alexandra\'s name added to memory');
      return true;
    } else {
      console.log('[ExternalMemory] ✅ User name already exists in memory');
      // Log existing name values
      const nameValue = this.memories.personal.get('name')?.value;
      const userNameValue = this.memories.personal.get('user_name')?.value;
      console.log('[ExternalMemory] Existing names:', { name: nameValue, user_name: userNameValue });
      return false;
    }
  }

  // Force reload memory from localStorage (useful for debugging)
  async forceReloadFromLocalStorage() {
    console.log('[ExternalMemory] 🔄 Force reloading from localStorage...');
    this.fallbackToLocal = true;
    await this.loadFromLocalStorage();
    console.log('[ExternalMemory] ✅ Force reload completed');
    
    // Log current state
    console.log('[ExternalMemory] Current personal facts:', Array.from(this.memories.personal.keys()));
    const nameValue = this.memories.personal.get('name')?.value;
    const userNameValue = this.memories.personal.get('user_name')?.value;
    console.log('[ExternalMemory] Name values:', { name: nameValue, user_name: userNameValue });
  }

  // Get memory statistics
  getMemoryStats() {
    return {
      storageLocation: this.fallbackToLocal ? 'localStorage' : this.storagePath,
      totalConversations: this.memories.conversations.length,
      personalFacts: this.memories.personal.size,
      activeProjects: Array.from(this.memories.projects.values())
        .filter(p => p.status === 'active').length,
      totalProjects: this.memories.projects.size,
      interests: this.memories.interests.size,
      memoryCapacity: this.fallbackToLocal ? '~10MB (localStorage)' : 'Unlimited (External SSD)',
      lastSaved: new Date().toISOString()
    };
  }
}

export default new ExternalMemoryService();