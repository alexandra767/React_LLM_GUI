// External SSD Memory Service for Aria

class ExternalMemoryService {
  constructor(ssdPath = '/Volumes/Alexandra-External-SSD-Storge/Aria-Memory') {
    this.ssdPath = ssdPath;
    this.isElectron = !!(window.electron || (window.process && window.process.type));
    this.fallbackToLocal = false;
    
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
    
    this.initializeStorage();
  }

  async initializeStorage() {
    try {
      if (!this.isElectron) {
        console.warn('[ExternalMemory] Not in Electron, falling back to localStorage');
        this.fallbackToLocal = true;
        return;
      }

      // Check if SSD is accessible
      const ssdExists = await this.checkSSDAccess();
      if (!ssdExists) {
        console.warn('[ExternalMemory] SSD not accessible, falling back to localStorage');
        this.fallbackToLocal = true;
        return;
      }

      console.log('[ExternalMemory] ✅ External SSD storage initialized:', this.ssdPath);
      await this.loadMemoriesFromSSD();
      
    } catch (error) {
      console.error('[ExternalMemory] Initialization failed:', error);
      this.fallbackToLocal = true;
    }
  }

  async checkSSDAccess() {
    try {
      if (!this.isElectron) return false;
      
      // Check if directory exists and is writable
      const testFile = `${this.ssdPath}/.aria-test`;
      await window.electron.writeFile(testFile, 'test');
      await window.electron.deleteFile(testFile);
      return true;
    } catch (error) {
      return false;
    }
  }

  async loadMemoriesFromSSD() {
    try {
      if (this.fallbackToLocal) {
        return this.loadFromLocalStorage();
      }

      // Load from individual JSON files on SSD
      const files = {
        conversations: `${this.ssdPath}/conversations/recent.json`,
        personal: `${this.ssdPath}/personal-facts/facts.json`,
        projects: `${this.ssdPath}/projects/active.json`
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

      console.log('[ExternalMemory] ✅ Loaded memories from SSD:', {
        conversations: this.memories.conversations.length,
        personal: this.memories.personal.size,
        projects: this.memories.projects.size
      });

    } catch (error) {
      console.error('[ExternalMemory] Failed to load from SSD:', error);
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
      // Save to organized files on SSD
      const saves = [
        this.saveConversations(),
        this.savePersonalFacts(),
        this.saveProjects(),
        this.createBackup()
      ];

      await Promise.all(saves);
      console.log('[ExternalMemory] ✅ Saved all memories to SSD');

    } catch (error) {
      console.error('[ExternalMemory] Failed to save to SSD:', error);
      // Fallback to localStorage
      this.saveToLocalStorage();
    }
  }

  async saveConversations() {
    const filePath = `${this.ssdPath}/conversations/recent.json`;
    const data = this.memories.conversations.slice(-1000); // Keep last 1000 conversations
    await window.electron.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async savePersonalFacts() {
    const filePath = `${this.ssdPath}/personal-facts/facts.json`;
    const data = Array.from(this.memories.personal.entries());
    await window.electron.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async saveProjects() {
    const filePath = `${this.ssdPath}/projects/active.json`;
    const data = Array.from(this.memories.projects.entries());
    await window.electron.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async createBackup() {
    const backupDir = `${this.ssdPath}/backups`;
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
    const conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      userMessage: userMessage.substring(0, 1000), // Limit length
      assistantMessage: assistantMessage.substring(0, 2000),
      topics: this.extractTopics(userMessage + ' ' + assistantMessage),
      mood: metadata.mood || 'neutral',
      context: metadata.context || {},
      importance: this.calculateImportance(userMessage, assistantMessage)
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
  addPersonalInfo(key, value, source = 'conversation') {
    const fact = {
      value,
      timestamp: new Date().toISOString(),
      source,
      confidence: 0.8,
      lastUpdated: new Date().toISOString()
    };

    this.memories.personal.set(key, fact);
    this.saveMemories();
    
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

  // Get relevant context for current conversation
  getRelevantContext(currentMessage) {
    try {
      // Clean conversations to remove identity confusion
      const cleanConversations = this.memories.conversations
        .slice(-10)
        .map(conv => this.sanitizeConversation(conv));

      const context = {
        recentConversations: cleanConversations,
        personalFacts: Array.from(this.memories.personal.entries()).slice(-20),
        activeProjects: Array.from(this.memories.projects.entries())
          .filter(([_, project]) => project.status === 'active'),
        currentTopics: this.extractTopics(currentMessage),
        conversationCount: this.memories.conversations.length
      };

      console.log('[ExternalMemory] 🧠 Retrieved context:', {
        conversations: context.recentConversations.length,
        facts: context.personalFacts.length,
        projects: context.activeProjects.length
      });

      return context;
    } catch (error) {
      console.error('[ExternalMemory] Failed to get context:', error);
      return {};
    }
  }

  // Sanitize conversation to remove identity confusion
  sanitizeConversation(conversation) {
    if (!conversation || !conversation.assistantMessage) {
      return conversation;
    }

    // Clean assistant messages that have wrong identity
    let cleanedMessage = conversation.assistantMessage
      // Remove references to being Qwen, Monica, Claude, etc.
      .replace(/I'm Qwen/gi, "I'm Aria")
      .replace(/I am Qwen/gi, "I am Aria")
      .replace(/Hello! I'm Qwen/gi, "Hello! I'm Aria")
      .replace(/This is Qwen/gi, "This is Aria")
      .replace(/My name is Qwen/gi, "My name is Aria")
      .replace(/developed by Alibaba Cloud/gi, "your AI assistant")
      .replace(/large-scale language model/gi, "AI assistant")
      // Remove thinking processes that were accidentally saved
      .replace(/^(Okay, the user asked me to|First, I should|Let me think about)[\s\S]*?(?=Hello!|Hi!|I'm)/i, '');

    return {
      ...conversation,
      assistantMessage: cleanedMessage.trim()
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

  // Get memory statistics
  getMemoryStats() {
    return {
      storageLocation: this.fallbackToLocal ? 'localStorage' : this.ssdPath,
      totalConversations: this.memories.conversations.length,
      personalFacts: this.memories.personal.size,
      activeProjects: Array.from(this.memories.projects.values())
        .filter(p => p.status === 'active').length,
      totalProjects: this.memories.projects.size,
      interests: this.memories.interests.size,
      memoryCapacity: this.fallbackToLocal ? '~10MB (localStorage)' : 'Unlimited (SSD)',
      lastSaved: new Date().toISOString()
    };
  }
}

export default new ExternalMemoryService();