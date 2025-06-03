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
      
      // Clean invalid relationships from previous bad extractions
      this.cleanInvalidRelationships();
      
      // EMERGENCY: Force clean ALL memory if name is missing
      await this.emergencyNameCleanup();
      
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
        
        // CRITICAL: Ensure Alexandra's name is always present and correct
        const currentName = this.memories.personal.get('name')?.value;
        const currentUserName = this.memories.personal.get('user_name')?.value;
        
        if (!currentName || !currentUserName || currentName === 'meeting' || currentUserName === 'meeting') {
          console.log('[MemoryAdapter] ⚠️ Name missing or corrupted (found:', currentName, '), restoring Alexandra...');
          const timestamp = new Date().toISOString();
          this.memories.personal.set('name', {
            value: 'Alexandra',
            timestamp,
            source: 'memory_recovery',
            confidence: 1.0
          });
          this.memories.personal.set('user_name', {
            value: 'Alexandra',
            timestamp,
            source: 'memory_recovery',
            confidence: 1.0
          });
          this.saveMemories();
        }
        
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
    
    // CRITICAL: Extract relationships from user message
    this.extractRelationships(userMessage);
    
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
  
  // Extract relationships from user messages - IMPROVED with better patterns
  extractRelationships(message) {
    if (!message || typeof message !== 'string') return [];
    
    try {
      console.log('[MemoryAdapter] 🔍 DEBUG: Extracting relationships from:', message);
      const relationships = [];
      
      // Extract friend relationships - improved patterns
      const friendPatterns = [
        /my friend ([A-Z][a-z]+)/gi,
        /friend named ([A-Z][a-z]+)/gi,
        /my friend ([A-Z][a-z]+) (?:called|said|told|asked|visited|came)/gi,
        /([A-Z][a-z]+) is my friend/gi
      ];
      
      friendPatterns.forEach(pattern => {
        const matches = [...message.matchAll(pattern)];
        matches.forEach(match => {
          const name = match[1];
          console.log('[MemoryAdapter] 🔍 DEBUG: Friend pattern matched - name:', name, 'valid:', this.isValidName(name));
          if (this.isValidName(name)) {
            this.addRelationship(name, 'friend', { 
              source: `Friend mentioned: "${message.substring(0, 50)}..."`,
              lastMentioned: new Date().toISOString()
            });
            console.log('[MemoryAdapter] 👫 Extracted friend relationship:', name);
          }
        });
      });
      
      // Extract family relationships - ENHANCED patterns with more variations including SON/DAUGHTER
      const familyPatterns = [
        // Existing patterns with "my" - NOW INCLUDING SON AND DAUGHTER
        { pattern: /my (mom|mother|dad|father|sister|brother|son|daughter|wife|husband|partner|aunt|uncle|grandmother|grandma|grandfather|grandpa|cousin|niece|nephew) ([A-Z][a-z]+)/gi, type: 'family_member_name' },
        { pattern: /my (mom|mother|dad|father|sister|brother|son|daughter|wife|husband|partner|aunt|uncle|grandmother|grandma|grandfather|grandpa|cousin|niece|nephew) is ([A-Z][a-z]+)/gi, type: 'family_member_is' },
        { pattern: /my (mom|mother|dad|father|sister|brother|son|daughter|wife|husband|partner|aunt|uncle|grandmother|grandma|grandfather|grandpa|cousin|niece|nephew) ([A-Z][a-z]+) (?:called|said|told|asked|visited|came)/gi, type: 'family_member_action' },
        // NEW patterns without "my" to catch "uncle Butch", "aunt Andrea", etc.
        { pattern: /(aunt|uncle|cousin|grandma|grandmother|grandpa|grandfather) ([A-Z][a-z]+)/gi, type: 'family_no_my' },
        { pattern: /(aunt|uncle|cousin|grandma|grandmother|grandpa|grandfather) ([A-Z][a-z]+) (?:called|said|told|asked|visited|came)/gi, type: 'family_no_my_action' }
      ];
      
      familyPatterns.forEach(patternObj => {
        const matches = [...message.matchAll(patternObj.pattern)];
        matches.forEach(match => {
          const relationship = match[1]; // The family relationship (mom, dad, etc.)
          const name = match[2]; // The actual name
          
          console.log('[MemoryAdapter] 🔍 DEBUG: Family pattern matched - relationship:', relationship, 'name:', name, 'valid:', this.isValidName(name));
          
          if (this.isValidName(name)) {
            this.addRelationship(name, relationship, {
              source: `Family member mentioned: "${message.substring(0, 50)}..."`,
              lastMentioned: new Date().toISOString()
            });
            console.log('[MemoryAdapter] 👨‍👩‍👧‍👦 Extracted family relationship:', name, '(', relationship, ')');
            relationships.push({ name, type: relationship, source: 'extractRelationships' });
          }
        });
      });
      
      console.log('[MemoryAdapter] 🔍 DEBUG: Total relationships extracted:', relationships.length);
      return relationships;
    } catch (error) {
      console.error('[MemoryAdapter] Error extracting relationships:', error);
      return [];
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
  
  // Add relationship information - with strict validation
  addRelationship(name, type, metadata = {}) {
    try {
      // STRICT validation to prevent corruption
      if (!this.isValidName(name)) {
        console.log(`[MemoryAdapter] ❌ Rejected invalid relationship name: "${name}"`);
        return false;
      }
      
      if (!this.isValidRelationshipType(type)) {
        console.log(`[MemoryAdapter] ❌ Rejected invalid relationship type: "${type}"`);
        return false;
      }
      
      const timestamp = new Date().toISOString();
      this.memories.relationships.set(name, {
        type,
        metadata,
        timestamp,
        source: 'conversation'
      });
      
      this.saveMemories();
      console.log(`[MemoryAdapter] ✅ Added valid relationship: ${name} (${type})`);
      return true;
    } catch (error) {
      console.error('[MemoryAdapter] Failed to add relationship:', error);
      return false;
    }
  }
  
  // Validate if a name is acceptable for relationships
  isValidName(name) {
    if (!name || typeof name !== 'string') return false;
    
    // Must be properly capitalized
    if (!/^[A-Z][a-z]+$/.test(name)) return false;
    
    // Reasonable length
    if (name.length < 2 || name.length > 20) return false;
    
    // Block common false matches
    const blockedWords = [
      'And', 'The', 'But', 'Who', 'What', 'When', 'Where', 'Why', 'How', 
      'That', 'This', 'They', 'She', 'Her', 'His', 'Him', 'Is', 'Are', 
      'Was', 'Were', 'Have', 'Has', 'Had', 'Will', 'Would', 'Could', 
      'Should', 'Can', 'May', 'Might', 'Must', 'Shall', 'Do', 'Does', 
      'Did', 'Get', 'Got', 'Give', 'Gave', 'Take', 'Took', 'Make', 'Made',
      'Birthday', 'Family', 'Friend', 'Person', 'People', 'Someone', 'Anyone'
    ];
    
    if (blockedWords.includes(name)) return false;
    
    return true;
  }
  
  // Validate relationship type
  isValidRelationshipType(type) {
    if (!type || typeof type !== 'string') return false;
    
    const validTypes = [
      'mom', 'mother', 'dad', 'father', 'sister', 'brother', 'son', 'daughter',
      'wife', 'husband', 'partner', 'aunt', 'uncle', 
      'grandmother', 'grandma', 'grandfather', 'grandpa', 
      'cousin', 'niece', 'nephew', 'friend', 'family'
    ];
    
    return validTypes.includes(type.toLowerCase());
  }

  // Extract and store relationships from user messages
  extractAndStoreRelationships(message) {
    try {
      console.log('[MemoryAdapter] 🔍 Extracting relationships from:', message);
      const relationships = [];
      
      // Extract friend relationships - improved patterns
      const friendPatterns = [
        /my friend ([A-Z][a-z]+)/gi,
        /friend named ([A-Z][a-z]+)/gi,
        /my friend ([A-Z][a-z]+) (?:called|said|told|asked|visited|came)/gi,
        /([A-Z][a-z]+) is my friend/gi
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
      
      // Extract family relationships - enhanced patterns to capture all variations INCLUDING SON/DAUGHTER
      const familyPatterns = [
        { pattern: /my (mom|mother|dad|father|sister|brother|son|daughter|wife|husband|partner|aunt|uncle|grandmother|grandma|grandfather|grandpa|cousin|niece|nephew) ([A-Z][a-z]+)/gi, type: 'family_member_name' },
        { pattern: /my (mom|mother|dad|father|sister|brother|son|daughter|wife|husband|partner|aunt|uncle|grandmother|grandma|grandfather|grandpa|cousin|niece|nephew) is ([A-Z][a-z]+)/gi, type: 'family_member_is' },
        { pattern: /my (mom|mother|dad|father|sister|brother|son|daughter|wife|husband|partner|aunt|uncle|grandmother|grandma|grandfather|grandpa|cousin|niece|nephew) ([A-Z][a-z]+) (?:called|said|told|asked|visited|came)/gi, type: 'family_member_action' },
        // Enhanced patterns to catch relationships without "my" prefix
        { pattern: /(aunt|uncle|cousin|grandma|grandmother|grandpa|grandfather) ([A-Z][a-z]+)/gi, type: 'no_my_required' },
        { pattern: /(aunt|uncle|cousin|grandma|grandmother|grandpa|grandfather) ([A-Z][a-z]+) (?:called|said|told|asked|visited|came)/gi, type: 'action_no_my' }
      ];
      
      // Extract birthday information for family members - SAFER patterns that avoid "Birthday" extraction
      const birthdayPatterns = [
        // More precise patterns that require actual names, not just \w+
        { pattern: /([A-Z][a-z]{1,19})'s birthday (?:is )?(?:on )?(?:the )?(\d{1,2})(?:st|nd|rd|th)? (?:of )?(january|february|march|april|may|june|july|august|september|october|november|december)/gi, type: 'birthday_date' },
        { pattern: /([A-Z][a-z]{1,19})'s birthday (?:is )?(?:on )?(january|february|march|april|may|june|july|august|september|october|november|december) (\d{1,2})(?:st|nd|rd|th)?/gi, type: 'birthday_month_first' },
        { pattern: /([A-Z][a-z]{1,19})'s birthday (january|february|march|april|may|june|july|august|september|october|november|december) (\d{1,2})(?:st|nd|rd|th)?/gi, type: 'birthday_simple' },
        // Family member patterns - require proper names
        { pattern: /my (?:mom|mother|dad|father|sister|brother|wife|husband|partner|aunt|uncle|grandmother|grandma|grandfather|grandpa|cousin|niece|nephew) ([A-Z][a-z]{1,19})'s birthday (?:is )?(?:on )?(?:the )?(\d{1,2})(?:st|nd|rd|th)? (?:of )?(january|february|march|april|may|june|july|august|september|october|november|december)/gi, type: 'family_birthday_date' },
        { pattern: /my (?:mom|mother|dad|father|sister|brother|wife|husband|partner|aunt|uncle|grandmother|grandma|grandfather|grandpa|cousin|niece|nephew) ([A-Z][a-z]{1,19})'s birthday (?:is )?(?:on )?(january|february|march|april|may|june|july|august|september|october|november|december) (\d{1,2})(?:st|nd|rd|th)?/gi, type: 'family_birthday_month_first' }
      ];
      
      familyPatterns.forEach(patternObj => {
        const matches = [...message.matchAll(patternObj.pattern)];
        matches.forEach(match => {
          const relationship = match[1]; // The family relationship (mom, dad, etc.)
          const name = match[2]; // The actual name
          
          console.log('[MemoryAdapter] 🔍 Pattern match debug:', {
            fullMatch: match[0],
            extractedRelationship: relationship,
            extractedName: name,
            patternType: patternObj.type
          });
          
          // Only accept proper names (capitalized, alpha only, reasonable length)
          if (name && name.length >= 2 && name.length <= 20 && /^[A-Z][a-z]+$/.test(name)) {
            // Skip common false matches
            const falseMatches = ['And', 'The', 'But', 'Who', 'What', 'When', 'Where', 'Why', 'How', 'That', 'This', 'They', 'She', 'Her', 'His', 'Him'];
            if (!falseMatches.includes(name)) {
              relationships.push({ 
                name: name, 
                type: relationship, 
                source: `Family member mentioned: "${message.substring(0, 50)}..."` 
              });
              
              console.log('[MemoryAdapter] 👨‍👩‍👧‍👦 Extracted family relationship:', {
                name: name,
                relationship: relationship,
                fullMatch: match[0],
                fromMessage: message.substring(0, 50)
              });
            } else {
              console.log('[MemoryAdapter] ❌ Skipped false match:', name);
            }
          } else {
            console.log('[MemoryAdapter] ❌ Invalid name format:', name);
          }
        });
      });
      
      // Process birthday patterns
      birthdayPatterns.forEach(patternObj => {
        const matches = [...message.matchAll(patternObj.pattern)];
        matches.forEach(match => {
          let name, month, day;
          
          if (patternObj.type === 'birthday_date' || patternObj.type === 'family_birthday_date') {
            name = match[1];
            day = match[2];
            month = match[3];
          } else if (patternObj.type === 'birthday_month_first' || patternObj.type === 'family_birthday_month_first') {
            name = match[1];
            month = match[2];
            day = match[3];
          } else if (patternObj.type === 'birthday_simple') {
            name = match[1];
            month = match[2];
            day = match[3];
          }
          
          if (name && month && day) {
            const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            
            // CRITICAL: Block "Birthday" from being treated as a name
            if (!this.isValidName(capitalizedName)) {
              console.log('[MemoryAdapter] ❌ Blocked invalid birthday name:', capitalizedName);
              return; // Skip this match entirely
            }
            
            const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
            const birthday = `${capitalizedMonth} ${day}`;
            
            // Check if this person is already in relationships, if so update with birthday
            const existingRelationship = this.memories.relationships.get(capitalizedName);
            if (existingRelationship) {
              existingRelationship.metadata.birthday = birthday;
              this.memories.relationships.set(capitalizedName, existingRelationship);
              console.log('[MemoryAdapter] 🎂 Updated birthday for existing relationship:', capitalizedName, '=', birthday);
            } else {
              // Add as new relationship with birthday
              this.addRelationship(capitalizedName, 'friend', { 
                source: `Birthday mentioned: "${message.substring(0, 50)}..."`,
                birthday: birthday
              });
              console.log('[MemoryAdapter] 🎂 Added new person with birthday:', capitalizedName, '=', birthday);
            }
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

  // Clean invalid relationships from memory - TARGETED cleanup
  cleanInvalidRelationships() {
    const invalidNames = ['And', 'The', 'But', 'Who', 'What', 'When', 'Where', 'Why', 'How', 'That', 'This', 'They', 'She', 'Her', 'His', 'Him', 'Is', 'Birthday', 'who', 'and', 'i'];
    let cleanedCount = 0;
    
    // Only remove specific invalid relationships, not all relationships
    for (const invalidName of invalidNames) {
      if (this.memories.relationships.has(invalidName)) {
        this.memories.relationships.delete(invalidName);
        cleanedCount++;
        console.log('[MemoryAdapter] 🧹 Removed invalid relationship:', invalidName);
      }
    }
    
    // SPECIFIC FIX: Check for Andrew misclassified as aunt and fix it
    const andrewRelationship = this.memories.relationships.get('Andrew');
    if (andrewRelationship && andrewRelationship.type === 'aunt') {
      console.log('[MemoryAdapter] 🔧 FIXING: Andrew misclassified as aunt, correcting to son');
      this.memories.relationships.set('Andrew', {
        type: 'son',
        metadata: {
          source: 'corrected_from_aunt_to_son',
          originalType: 'aunt',
          lastMentioned: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        source: 'relationship_correction'
      });
      cleanedCount++;
    }
    
    console.log('[MemoryAdapter] 🧹 Cleaned invalid relationships:', cleanedCount);
    
    if (cleanedCount > 0) {
      this.saveMemories();
      console.log(`[MemoryAdapter] ✅ Force cleaned ${cleanedCount} relationships - starting fresh`);
    }
    
    return cleanedCount;
  }

  // EMERGENCY: Complete memory cleanup if name recognition is broken
  async emergencyNameCleanup() {
    try {
      console.log('[MemoryAdapter] 🚨 Running emergency name cleanup...');
      
      // Check if name is missing or corrupted
      const nameValue = this.memories.personal.get('name')?.value;
      const userNameValue = this.memories.personal.get('user_name')?.value;
      
      if (!nameValue || !userNameValue || nameValue === 'meeting' || userNameValue === 'meeting') {
        console.log('[MemoryAdapter] 🚨 CRITICAL: No name or corrupted name found in memory (found:', nameValue, '), performing emergency rebuild');
        
        // NUCLEAR OPTION: Clear ALL memory and rebuild
        this.memories.personal.clear();
        this.memories.relationships.clear();
        this.memories.conversations = [];
        this.memories.projects.clear();
        this.memories.interests.clear();
        this.memories.patterns.clear();
        this.memories.knowledge.clear();
        this.memories.preferences.clear();
        this.memories.emotions = [];
        this.memories.achievements = [];
        
        console.log('[MemoryAdapter] 🧹 Memory completely wiped');
        
        // Rebuild with Alexandra's name
        const timestamp = new Date().toISOString();
        this.memories.personal.set('name', {
          value: 'Alexandra',
          timestamp,
          source: 'emergency_cleanup',
          confidence: 1.0,
          verified: true
        });
        
        this.memories.personal.set('user_name', {
          value: 'Alexandra',
          timestamp,
          source: 'emergency_cleanup',
          confidence: 1.0,
          verified: true
        });
        
        // FORCE save to localStorage directly
        await this.saveMemories();
        
        // ALSO force save to alternative storage locations
        try {
          const storageData = this.serializeMemories();
          localStorage.setItem('unified_storage_memory_backup', JSON.stringify(storageData));
          localStorage.setItem('emergency_memory_backup', JSON.stringify(storageData));
          console.log('[MemoryAdapter] ✅ Emergency name recovery complete with multiple backups');
        } catch (backupError) {
          console.error('[MemoryAdapter] Backup save failed:', backupError);
        }
        
        return true;
      } else if (nameValue !== 'Alexandra' || userNameValue !== 'Alexandra') {
        console.log('[MemoryAdapter] 🚨 Wrong name in memory, correcting to Alexandra');
        
        // Fix wrong name
        const timestamp = new Date().toISOString();
        this.memories.personal.set('name', {
          value: 'Alexandra',
          timestamp,
          source: 'emergency_name_fix',
          confidence: 1.0,
          verified: true
        });
        
        this.memories.personal.set('user_name', {
          value: 'Alexandra',
          timestamp,
          source: 'emergency_name_fix',
          confidence: 1.0,
          verified: true
        });
        
        await this.saveMemories();
        console.log('[MemoryAdapter] ✅ Name corrected to Alexandra');
        return true;
      }
      
      console.log('[MemoryAdapter] ✅ Name verification passed:', nameValue);
      return false;
      
    } catch (error) {
      console.error('[MemoryAdapter] Emergency cleanup failed:', error);
      return false;
    }
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