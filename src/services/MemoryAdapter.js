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
      await this.loadMemories();
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
  }
  
  // Add conversation to memory
  addConversation(userMessage, assistantMessage, metadata = {}) {
    const cleanedAssistantMessage = this.sanitizeMessage(assistantMessage.substring(0, 2000));
    
    // Extract personal information from user message
    this.extractPersonalInfo(userMessage);
    
    const conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      userMessage: userMessage.substring(0, 1000),
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

    console.log('[MemoryAdapter] 💬 Added conversation:', conversation.id);
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
      
      // Build personal facts object
      const personal = {};
      for (const [key, fact] of this.memories.personal.entries()) {
        personal[key] = fact;
      }

      // Build relationships object
      const relationships = {};
      for (const [name, relationshipData] of this.memories.relationships.entries()) {
        relationships[name] = relationshipData;
      }

      // Get recent conversations (cleaned)
      const cleanConversations = this.memories.conversations
        .slice(-10)
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
        userName: context.personal.name?.value || context.personal.user_name?.value
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
  
  // Get memory statistics
  getMemoryStats() {
    return {
      storageLocation: 'Unified Storage',
      totalConversations: this.memories.conversations.length,
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