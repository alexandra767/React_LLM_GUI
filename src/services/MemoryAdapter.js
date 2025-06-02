// Memory Adapter for Unified Storage
// Provides Aria's memory functionality using the unified storage service

import unifiedStorageService from './UnifiedStorageService';

class MemoryAdapter {
  constructor() {
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
    
    this.isInitialized = false;
    this.loadMemories();
  }
  
  async ensureInitialized() {
    if (!this.isInitialized) {
      console.log('[MemoryAdapter] Ensuring initialization...');
      await this.loadMemories();
      
      // Force create default memory with Alexandra's name if no name exists
      if (!this.memories.personal.has('name') && !this.memories.personal.has('user_name')) {
        console.log('[MemoryAdapter] No name found, creating default with Alexandra');
        await this.createDefaultMemory();
      }
    }
    return this.isInitialized;
  }
  
  async loadMemories() {
    try {
      const memoryData = unifiedStorageService.get('aria_memory_system');
      if (memoryData) {
        const parsed = JSON.parse(memoryData);
        
        // Convert arrays back to Maps
        this.memories.personal = new Map(parsed.personal || []);
        this.memories.relationships = new Map(parsed.relationships || []);
        this.memories.projects = new Map(parsed.projects || []);
        this.memories.interests = new Map(parsed.interests || []);
        this.memories.patterns = new Map(parsed.patterns || []);
        this.memories.knowledge = new Map(parsed.knowledge || []);
        this.memories.preferences = new Map(parsed.preferences || []);
        
        // Keep arrays as arrays
        this.memories.conversations = parsed.conversations || [];
        this.memories.emotions = parsed.emotions || [];
        this.memories.achievements = parsed.achievements || [];
        
        console.log('[MemoryAdapter] ✅ Loaded memories from unified storage:', {
          personalFacts: this.memories.personal.size,
          conversations: this.memories.conversations.length,
          relationships: this.memories.relationships.size,
          userName: this.memories.personal.get('name')?.value
        });
      } else {
        console.log('[MemoryAdapter] 📝 No existing memory found, creating default...');
        await this.createDefaultMemory();
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('[MemoryAdapter] ❌ Failed to load memories:', error);
      await this.createDefaultMemory();
      this.isInitialized = true;
    }
  }
  
  async createDefaultMemory() {
    const timestamp = new Date().toISOString();
    
    // Add Alexandra's name to memory
    this.memories.personal.set('name', {
      value: 'Alexandra',
      timestamp,
      source: 'memory_adapter',
      confidence: 1.0
    });
    
    this.memories.personal.set('user_name', {
      value: 'Alexandra',
      timestamp,
      source: 'memory_adapter',
      confidence: 1.0
    });
    
    await this.saveMemories();
    console.log('[MemoryAdapter] ✅ Created default memory with Alexandra\'s name');
  }
  
  async saveMemories() {
    // Throttle saves to prevent excessive storage operations
    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout);
    }
    
    this._saveTimeout = setTimeout(async () => {
      try {
        const memoryData = {
          personal: Array.from(this.memories.personal.entries()),
          relationships: Array.from(this.memories.relationships.entries()),
          projects: Array.from(this.memories.projects.entries()),
          interests: Array.from(this.memories.interests.entries()),
          patterns: Array.from(this.memories.patterns.entries()),
        knowledge: Array.from(this.memories.knowledge.entries()),
        preferences: Array.from(this.memories.preferences.entries()),
        conversations: this.memories.conversations.slice(-100), // Keep last 100
        emotions: this.memories.emotions.slice(-50), // Keep last 50
        achievements: this.memories.achievements,
        timestamp: new Date().toISOString(),
        source: 'memory_adapter'
      };
      
        await unifiedStorageService.set('aria_memory_system', JSON.stringify(memoryData));
        console.log('[MemoryAdapter] ✅ Saved memories to unified storage');
      } catch (error) {
        console.error('[MemoryAdapter] ❌ Failed to save memories:', error);
      }
    }, 1000); // Throttle saves to once per second
  }
  
  // Add conversation to memory
  addConversation(userMessage, assistantMessage, metadata = {}) {
    const cleanedAssistantMessage = this.sanitizeMessage(assistantMessage.substring(0, 2000));
    
    // Extract personal information from user message
    this.extractPersonalInfo(userMessage);
    
    // Detect if this conversation contains time-sensitive content
    const fullText = (userMessage + ' ' + cleanedAssistantMessage).toLowerCase();
    const isTimeSensitive = fullText.includes('breaking news') ||
                           fullText.includes('latest news') ||
                           fullText.includes('today\'s news') ||
                           fullText.includes('recent news') ||
                           fullText.includes('current events') ||
                           fullText.includes('happening now') ||
                           fullText.includes('this morning') ||
                           fullText.includes('yesterday') ||
                           fullText.includes('weather') ||
                           fullText.includes('forecast');
    
    const conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      userMessage: userMessage.substring(0, 1000),
      assistantMessage: cleanedAssistantMessage,
      topics: this.extractTopics(userMessage + ' ' + cleanedAssistantMessage),
      mood: metadata.mood || 'neutral',
      context: metadata.context || {},
      importance: this.calculateImportance(userMessage, cleanedAssistantMessage),
      isTimeSensitive: isTimeSensitive // Flag time-sensitive content
    };

    this.memories.conversations.push(conversation);
    
    // Clean up old conversations more aggressively when adding new ones
    this.cleanOldConversations();
    
    // Auto-save every 5 conversations
    if (this.memories.conversations.length % 5 === 0) {
      this.saveMemories();
    }

    console.log('[MemoryAdapter] 💬 Added conversation:', conversation.id, 
                isTimeSensitive ? '(time-sensitive)' : '');
    return conversation;
  }
  
  // Extract personal information from user messages
  extractPersonalInfo(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Look for name introductions
    if (lowerMessage.includes('i am ') || lowerMessage.includes('my name is ') || lowerMessage.includes('i\'m ')) {
      // Extract name patterns
      const namePatterns = [
        /(?:i am|i'm|my name is)\s+([a-zA-Z]+)/i,
        /(?:call me|i'm called)\s+([a-zA-Z]+)/i
      ];
      
      for (const pattern of namePatterns) {
        const match = userMessage.match(pattern);
        if (match && match[1]) {
          const extractedName = match[1].trim();
          // Only save real names (not common words)
          if (extractedName.length > 1 && /^[A-Z][a-z]+$/.test(extractedName)) {
            console.log('[MemoryAdapter] 👤 Extracted name from user message:', extractedName);
            this.addPersonalInfo('name', extractedName, 'conversation_extraction');
            this.addPersonalInfo('user_name', extractedName, 'conversation_extraction');
            break;
          }
        }
      }
    }
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
    
    console.log('[MemoryAdapter] 👤 Added personal fact:', key);
    return fact;
  }
  
  // Get relevant context for current conversation
  async getRelevantContext(currentMessage = '') {
    try {
      await this.ensureInitialized();
      
      console.log('[MemoryAdapter] 🔍 getRelevantContext called with message:', currentMessage?.substring(0, 50));
      console.log('[MemoryAdapter] Memory status:', {
        personalCount: this.memories.personal.size,
        relationshipsCount: this.memories.relationships.size,
        conversationsCount: this.memories.conversations.length
      });
      
      // Build personal facts object
      const personal = {};
      for (const [key, fact] of this.memories.personal.entries()) {
        personal[key] = fact;
        console.log('[MemoryAdapter] Personal fact:', key, '=', fact);
      }

      // Build relationships object
      const relationships = {};
      for (const [name, relationshipData] of this.memories.relationships.entries()) {
        relationships[name] = relationshipData;
        console.log('[MemoryAdapter] Relationship:', name, '=', relationshipData);
      }

      // Get recent conversations (cleaned) - filter by time and relevance
      const now = new Date();
      const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
      
      const cleanConversations = this.memories.conversations
        .filter(conv => {
          // Only include conversations from the last 24 hours to prevent stale news references
          const conversationTime = new Date(conv.timestamp);
          const isRecent = conversationTime > twentyFourHoursAgo;
          
          // Skip conversations that mention specific news, dates, or time-sensitive content
          const conversationText = (conv.userMessage + ' ' + conv.assistantMessage).toLowerCase();
          const hasStaleContent = conversationText.includes('breaking news') ||
                                 conversationText.includes('latest news') ||
                                 conversationText.includes('today\'s news') ||
                                 conversationText.includes('recent news') ||
                                 conversationText.includes('yesterday') ||
                                 conversationText.includes('last week') ||
                                 conversationText.includes('this morning') ||
                                 conversationText.includes('earlier today');
          
          // Include only recent conversations without stale news content
          return isRecent && !hasStaleContent;
        })
        .slice(-5) // Limit to last 5 relevant conversations instead of 10
        .map(conv => this.sanitizeConversation(conv));

      const context = {
        personal: personal,
        relationships: relationships,
        conversations: cleanConversations,
        preferences: {
          topInterests: Array.from(this.memories.interests.entries())
            .sort((a, b) => b[1].frequency - a[1].frequency)
            .slice(0, 5)
            .map(([topic]) => topic)
        },
        currentTopics: this.extractTopics(currentMessage),
        conversationCount: this.memories.conversations.length
      };

      console.log('[MemoryAdapter] 🧠 Retrieved context:', {
        conversations: context.conversations.length,
        personalKeys: Object.keys(context.personal),
        relationshipCount: Object.keys(context.relationships).length,
        userName: context.personal.name?.value || context.personal.user_name?.value,
        friendKeys: Object.keys(context.personal).filter(key => key.includes('friend')),
        allPersonalEntries: context.personal
      });

      return context;
    } catch (error) {
      console.error('[MemoryAdapter] Failed to get context:', error);
      return {
        personal: {},
        relationships: {},
        conversations: [],
        preferences: { topInterests: [] },
        currentTopics: [],
        conversationCount: 0
      };
    }
  }
  
  // Clean messages to prevent identity confusion
  sanitizeMessage(message) {
    if (!message || typeof message !== 'string') {
      return message;
    }

    return message
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
      .trim();
  }

  sanitizeConversation(conversation) {
    if (!conversation || !conversation.assistantMessage) {
      return conversation;
    }

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
    
    let importance = 0.5;
    
    personalKeywords.forEach(keyword => {
      if (text.includes(keyword)) importance += 0.2;
    });
    
    projectKeywords.forEach(keyword => {
      if (text.includes(keyword)) importance += 0.1;
    });
    
    return Math.min(importance, 1.0);
  }
  
  // Add interest information
  addInterest(topic, action = 'discussed', metadata = {}) {
    try {
      const timestamp = new Date().toISOString();
      const existing = this.memories.interests.get(topic) || {
        frequency: 0,
        lastDiscussion: null,
        contexts: []
      };
      
      existing.frequency += 1;
      existing.lastDiscussion = timestamp;
      existing.contexts.push({
        action,
        metadata,
        timestamp
      });
      
      // Keep only last 10 contexts to prevent memory bloat
      if (existing.contexts.length > 10) {
        existing.contexts = existing.contexts.slice(-10);
      }
      
      this.memories.interests.set(topic, existing);
      this.saveMemories();
      
      console.log(`[MemoryAdapter] Added interest: ${topic} (${action})`);
    } catch (error) {
      console.error('[MemoryAdapter] Failed to add interest:', error);
    }
  }
  
  // Add personal information
  addPersonalInfo(key, value, source = 'conversation') {
    try {
      const timestamp = new Date().toISOString();
      this.memories.personal.set(key, {
        value,
        timestamp,
        source,
        confidence: 0.8
      });
      
      this.saveMemories();
      console.log(`[MemoryAdapter] Added personal info: ${key} = ${value}`);
    } catch (error) {
      console.error('[MemoryAdapter] Failed to add personal info:', error);
    }
  }
  
  // Add relationship information
  addRelationship(name, type, metadata = {}) {
    try {
      const timestamp = new Date().toISOString();
      this.memories.relationships.set(name, {
        type,
        metadata,
        timestamp,
        source: 'conversation'
      });
      
      this.saveMemories();
      console.log(`[MemoryAdapter] Added relationship: ${name} (${type})`);
    } catch (error) {
      console.error('[MemoryAdapter] Failed to add relationship:', error);
    }
  }
  
  // Add conversation to memory
  addConversation(userMessage, assistantMessage, metadata = {}) {
    try {
      const timestamp = new Date().toISOString();
      const importance = this.calculateImportance(userMessage, assistantMessage);
      
      // Clean messages to prevent identity confusion
      const cleanedAssistantMessage = this.sanitizeMessage(assistantMessage);
      
      const conversation = {
        timestamp,
        userMessage: userMessage.substring(0, 1000), // Limit length
        assistantMessage: cleanedAssistantMessage.substring(0, 1000),
        importance,
        metadata
      };
      
      this.memories.conversations.push(conversation);
      
      // Keep only last 100 conversations to prevent memory bloat
      if (this.memories.conversations.length > 100) {
        this.memories.conversations = this.memories.conversations.slice(-100);
      }
      
      // Extract and store relationships from the conversation
      this.extractAndStoreRelationships(userMessage);
      
      this.saveMemories();
      console.log(`[MemoryAdapter] Added conversation (importance: ${importance.toFixed(2)})`);
    } catch (error) {
      console.error('[MemoryAdapter] Failed to add conversation:', error);
    }
  }

  // Extract and store relationships from user messages
  extractAndStoreRelationships(message) {
    try {
      console.log('[MemoryAdapter] 🔍 Extracting relationships from:', message);
      const relationships = [];
      
      // Extract friend relationships
      const friendPatterns = [
        /my friend (\w+)/gi,
        /friend named (\w+)/gi,
        /friend (\w+)/gi,
        /(\w+) is my friend/gi
      ];
      
      friendPatterns.forEach(pattern => {
        const matches = [...message.matchAll(pattern)];
        matches.forEach(match => {
          const name = match[1];
          if (name && name.length > 1 && /^[A-Za-z]+$/.test(name)) {
            relationships.push({ name, type: 'friend', source: `Friend mentioned: "${message.substring(0, 50)}..."` });
          }
        });
      });
      
      // Extract family relationships
      const familyPatterns = [
        /my (?:mom|mother|dad|father|sister|brother|wife|husband|partner) (\w+)/gi,
        /my (?:mom|mother|dad|father|sister|brother|wife|husband|partner) is (\w+)/gi,
        /my (?:mom|mother|dad|father|sister|brother|wife|husband|partner) (\w+) (?:called|said|told|asked|visited|came)/gi
      ];
      
      familyPatterns.forEach(pattern => {
        const matches = [...message.matchAll(pattern)];
        matches.forEach(match => {
          const name = match[1];
          const relationshipMatch = match[0].match(/my (\w+)/);
          const relationship = relationshipMatch ? relationshipMatch[1] : 'family';
          
          if (name && name.length > 1 && /^[A-Za-z]+$/.test(name)) {
            // Capitalize the name for consistency
            const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            
            relationships.push({ 
              name: capitalizedName, 
              type: relationship, 
              source: `Family member mentioned: "${message.substring(0, 50)}..."` 
            });
            
            console.log('[MemoryAdapter] 👨‍👩‍👧‍👦 Extracted family relationship:', {
              name: capitalizedName,
              relationship,
              fullMatch: match[0],
              fromMessage: message.substring(0, 50)
            });
          }
        });
      });
      
      // Store each relationship
      if (relationships.length > 0) {
        relationships.forEach(rel => {
          this.addRelationship(rel.name, rel.type, { source: rel.source });
          console.log('[MemoryAdapter] 👨‍👩‍👧‍👦 Stored relationship:', rel.name, '=', rel.type);
        });
      } else {
        console.log('[MemoryAdapter] ❌ No relationships found in message:', message);
      }
      
    } catch (error) {
      console.error('[MemoryAdapter] Failed to extract relationships:', error);
    }
  }
  
  // Migration methods for compatibility
  async migrateFromLocalStorage() {
    try {
      console.log('[MemoryAdapter] Migration from localStorage already handled by UnifiedStorageService');
      return true;
    } catch (error) {
      console.error('[MemoryAdapter] Migration failed:', error);
      return false;
    }
  }
  
  async addAlexandraName() {
    try {
      if (!this.memories.personal.has('name') && !this.memories.personal.has('user_name')) {
        this.addPersonalInfo('name', 'Alexandra', 'default');
        this.addPersonalInfo('user_name', 'Alexandra', 'default');
        console.log('[MemoryAdapter] Added Alexandra name to memory');
      }
      return true;
    } catch (error) {
      console.error('[MemoryAdapter] Failed to add Alexandra name:', error);
      return false;
    }
  }
  
  async cleanStoredIdentity() {
    try {
      // Clean any stored identity confusion in conversations
      let cleanedCount = 0;
      this.memories.conversations = this.memories.conversations.map(conv => {
        const cleaned = this.sanitizeConversation(conv);
        if (cleaned.assistantMessage !== conv.assistantMessage) {
          cleanedCount++;
        }
        return cleaned;
      });
      
      if (cleanedCount > 0) {
        await this.saveMemories();
        console.log(`[MemoryAdapter] Cleaned ${cleanedCount} conversations with identity confusion`);
      }
      
      return true;
    } catch (error) {
      console.error('[MemoryAdapter] Failed to clean stored identity:', error);
      return false;
    }
  }

  // Clean old conversations to prevent stale context
  cleanOldConversations() {
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    
    const originalLength = this.memories.conversations.length;
    
    this.memories.conversations = this.memories.conversations.filter(conv => {
      const conversationTime = new Date(conv.timestamp);
      
      // Keep all conversations from the last 24 hours
      if (conversationTime > dayAgo) {
        return true;
      }
      
      // For older conversations, only keep non-time-sensitive ones that are important
      if (conversationTime > weekAgo) {
        return !conv.isTimeSensitive && conv.importance >= 0.7;
      }
      
      // For very old conversations, only keep the most important ones
      return conv.importance >= 0.9;
    });
    
    const cleanedCount = originalLength - this.memories.conversations.length;
    if (cleanedCount > 0) {
      console.log(`[MemoryAdapter] 🧹 Cleaned ${cleanedCount} old/stale conversations`);
    }
  }

  // Manually clear stale conversations (for user-triggered cleanup)
  clearStaleConversations() {
    const now = new Date();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    
    const originalLength = this.memories.conversations.length;
    
    // Remove all time-sensitive conversations older than 24 hours
    this.memories.conversations = this.memories.conversations.filter(conv => {
      const conversationTime = new Date(conv.timestamp);
      
      // Keep recent conversations
      if (conversationTime > dayAgo) {
        return true;
      }
      
      // Remove old time-sensitive conversations
      return !conv.isTimeSensitive;
    });
    
    const cleanedCount = originalLength - this.memories.conversations.length;
    console.log(`[MemoryAdapter] 🧹 Manually cleared ${cleanedCount} stale conversations`);
    
    this.saveMemories();
    return cleanedCount;
  }

  // Get memory statistics
  getMemoryStats() {
    const now = new Date();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    
    const recentConversations = this.memories.conversations.filter(conv => 
      new Date(conv.timestamp) > dayAgo
    ).length;
    
    const timeSensitiveConversations = this.memories.conversations.filter(conv => 
      conv.isTimeSensitive
    ).length;
    
    return {
      storageLocation: 'Unified Storage',
      totalConversations: this.memories.conversations.length,
      recentConversations: recentConversations,
      timeSensitiveConversations: timeSensitiveConversations,
      personalFacts: this.memories.personal.size,
      activeProjects: Array.from(this.memories.projects.values())
        .filter(p => p.status === 'active').length,
      totalProjects: this.memories.projects.size,
      interests: this.memories.interests.size,
      lastSaved: new Date().toISOString()
    };
  }
}

// Create singleton instance
const memoryAdapter = new MemoryAdapter();

export default memoryAdapter;