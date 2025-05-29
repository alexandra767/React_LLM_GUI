// Advanced Memory and Learning System for Aria
class MemoryService {
  constructor() {
    this.memories = {
      personal: new Map(), // Personal facts, preferences, goals
      relationships: new Map(), // People and their relationships
      conversations: [], // Recent conversation context
      projects: new Map(), // Ongoing projects and tasks
      interests: new Map(), // User interests and expertise levels
      patterns: new Map(), // Behavioral and preference patterns
      emotions: [], // Emotional context history
      achievements: [], // User accomplishments and milestones
      knowledge: new Map(), // Learned domain knowledge
      preferences: new Map() // Communication and interaction preferences
    };
    
    this.learningState = {
      communicationStyle: {},
      responsePreferences: {},
      topicInterests: {},
      emotionalPatterns: {},
      schedulePatterns: {},
      workPatterns: {}
    };
    
    this.storageKey = 'aria_memory_system';
    this.loadMemories();
  }

  // Load memories from localStorage
  loadMemories() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        
        // Convert arrays back to Maps
        this.memories.personal = new Map(data.personal || []);
        this.memories.relationships = new Map(data.relationships || []);
        this.memories.projects = new Map(data.projects || []);
        this.memories.interests = new Map(data.interests || []);
        this.memories.patterns = new Map(data.patterns || []);
        this.memories.knowledge = new Map(data.knowledge || []);
        this.memories.preferences = new Map(data.preferences || []);
        
        this.memories.conversations = data.conversations || [];
        this.memories.emotions = data.emotions || [];
        this.memories.achievements = data.achievements || [];
        
        this.learningState = { ...this.learningState, ...data.learningState };
        
        console.log('[Memory] Loaded memories:', {
          personal: this.memories.personal.size,
          relationships: this.memories.relationships.size,
          conversations: this.memories.conversations.length,
          projects: this.memories.projects.size
        });
      }
    } catch (error) {
      console.error('[Memory] Failed to load memories:', error);
    }
  }

  // Save memories to localStorage
  saveMemories() {
    try {
      const data = {
        personal: Array.from(this.memories.personal.entries()),
        relationships: Array.from(this.memories.relationships.entries()),
        projects: Array.from(this.memories.projects.entries()),
        interests: Array.from(this.memories.interests.entries()),
        patterns: Array.from(this.memories.patterns.entries()),
        knowledge: Array.from(this.memories.knowledge.entries()),
        preferences: Array.from(this.memories.preferences.entries()),
        conversations: this.memories.conversations.slice(-100), // Keep last 100 conversations
        emotions: this.memories.emotions.slice(-50), // Keep last 50 emotional contexts
        achievements: this.memories.achievements,
        learningState: this.learningState
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      console.log('[Memory] Memories saved successfully');
    } catch (error) {
      console.error('[Memory] Failed to save memories:', error);
    }
  }

  // Add personal information
  addPersonalInfo(key, value, context = null) {
    const info = {
      value,
      context,
      timestamp: new Date().toISOString(),
      confidence: 1.0,
      lastUpdated: new Date().toISOString()
    };
    
    this.memories.personal.set(key, info);
    this.saveMemories();
    console.log(`[Memory] Added personal info: ${key} = ${value}`);
  }

  // Add relationship information
  addRelationship(personName, relationship, details = {}) {
    const relationshipInfo = {
      name: personName,
      relationship,
      details,
      interactions: [],
      lastMentioned: new Date().toISOString(),
      importance: details.importance || 'medium'
    };
    
    this.memories.relationships.set(personName.toLowerCase(), relationshipInfo);
    this.saveMemories();
    console.log(`[Memory] Added relationship: ${personName} (${relationship})`);
  }

  // Add conversation to memory
  addConversation(userMessage, ariaResponse, context = {}) {
    const conversation = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      userMessage,
      ariaResponse,
      context,
      topics: this.extractTopics(userMessage),
      sentiment: this.analyzeSentiment(userMessage),
      length: userMessage.length
    };
    
    this.memories.conversations.push(conversation);
    
    // Learn from conversation
    this.learnFromConversation(conversation);
    
    // Keep only recent conversations in memory
    if (this.memories.conversations.length > 200) {
      this.memories.conversations = this.memories.conversations.slice(-100);
    }
    
    this.saveMemories();
  }

  // Add project information
  addProject(projectName, details) {
    const project = {
      name: projectName,
      ...details,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: details.status || 'active',
      progress: details.progress || 0,
      tasks: details.tasks || [],
      deadlines: details.deadlines || [],
      collaborators: details.collaborators || []
    };
    
    this.memories.projects.set(projectName.toLowerCase(), project);
    this.saveMemories();
    console.log(`[Memory] Added project: ${projectName}`);
  }

  // Add interest/expertise
  addInterest(topic, level = 'beginner', details = {}) {
    const interest = {
      topic,
      level, // beginner, intermediate, advanced, expert
      details,
      addedAt: new Date().toISOString(),
      lastDiscussed: new Date().toISOString(),
      discussionCount: 1,
      relatedTopics: details.relatedTopics || []
    };
    
    this.memories.interests.set(topic.toLowerCase(), interest);
    this.saveMemories();
    console.log(`[Memory] Added interest: ${topic} (${level})`);
  }

  // Learn from conversation patterns
  learnFromConversation(conversation) {
    // Update communication style preferences
    this.updateCommunicationStyle(conversation);
    
    // Update topic interests
    this.updateTopicInterests(conversation.topics);
    
    // Update emotional patterns
    this.updateEmotionalPatterns(conversation.sentiment);
    
    // Extract and store patterns
    this.extractPatterns(conversation);
  }

  // Update communication style learning
  updateCommunicationStyle(conversation) {
    const style = this.learningState.communicationStyle;
    
    // Learn preferred response length
    if (conversation.userMessage.length < 50) {
      style.prefersBriefResponses = (style.prefersBriefResponses || 0) + 1;
    } else {
      style.prefersDetailedResponses = (style.prefersDetailedResponses || 0) + 1;
    }
    
    // Learn formality preference
    if (this.isInformal(conversation.userMessage)) {
      style.prefersInformal = (style.prefersInformal || 0) + 1;
    } else {
      style.prefersFormal = (style.prefersFormal || 0) + 1;
    }
    
    // Learn question asking frequency
    if (conversation.userMessage.includes('?')) {
      style.asksQuestions = (style.asksQuestions || 0) + 1;
    }
  }

  // Extract topics from message
  extractTopics(message) {
    const topics = [];
    const words = message.toLowerCase().split(/\s+/);
    
    // Technology topics
    const techKeywords = ['code', 'programming', 'software', 'ai', 'machine learning', 'data', 'algorithm', 'api', 'database'];
    // Business topics
    const businessKeywords = ['meeting', 'project', 'deadline', 'team', 'client', 'presentation', 'strategy', 'budget'];
    // Personal topics
    const personalKeywords = ['family', 'friend', 'health', 'hobby', 'travel', 'food', 'music', 'movie', 'book'];
    
    for (const word of words) {
      if (techKeywords.includes(word)) topics.push('technology');
      if (businessKeywords.includes(word)) topics.push('business');
      if (personalKeywords.includes(word)) topics.push('personal');
    }
    
    return [...new Set(topics)]; // Remove duplicates
  }

  // Simple sentiment analysis
  analyzeSentiment(message) {
    const positive = ['good', 'great', 'awesome', 'excellent', 'happy', 'love', 'like', 'amazing', 'wonderful'];
    const negative = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'frustrated', 'angry', 'sad', 'disappointed'];
    
    const words = message.toLowerCase().split(/\s+/);
    let score = 0;
    
    for (const word of words) {
      if (positive.includes(word)) score += 1;
      if (negative.includes(word)) score -= 1;
    }
    
    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  }

  // Check if message is informal
  isInformal(message) {
    const informalIndicators = ['hey', 'hi', 'lol', 'gonna', 'wanna', 'yeah', 'nah', 'awesome', 'cool'];
    const words = message.toLowerCase().split(/\s+/);
    return informalIndicators.some(indicator => words.includes(indicator));
  }

  // Update topic interests
  updateTopicInterests(topics) {
    for (const topic of topics) {
      const current = this.learningState.topicInterests[topic] || 0;
      this.learningState.topicInterests[topic] = current + 1;
    }
  }

  // Update emotional patterns
  updateEmotionalPatterns(sentiment) {
    const emotions = this.learningState.emotionalPatterns;
    emotions[sentiment] = (emotions[sentiment] || 0) + 1;
    
    // Store emotional context with timestamp
    this.memories.emotions.push({
      sentiment,
      timestamp: new Date().toISOString(),
      context: 'conversation'
    });
  }

  // Extract behavioral patterns
  extractPatterns(conversation) {
    const timestamp = new Date(conversation.timestamp);
    const hour = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();
    
    // Time patterns
    const timePattern = `hour_${hour}`;
    this.updatePattern('active_hours', timePattern);
    
    const dayPattern = `day_${dayOfWeek}`;
    this.updatePattern('active_days', dayPattern);
    
    // Message length patterns
    const lengthCategory = conversation.length < 50 ? 'short' : conversation.length < 200 ? 'medium' : 'long';
    this.updatePattern('message_length', lengthCategory);
  }

  // Update pattern frequency
  updatePattern(category, pattern) {
    const patterns = this.memories.patterns.get(category) || {};
    patterns[pattern] = (patterns[pattern] || 0) + 1;
    this.memories.patterns.set(category, patterns);
  }

  // Get relevant context for current conversation
  getRelevantContext(currentMessage, limit = 5) {
    const topics = this.extractTopics(currentMessage);
    const sentiment = this.analyzeSentiment(currentMessage);
    
    // Get recent conversations
    const recentConversations = this.memories.conversations
      .slice(-20)
      .filter(conv => {
        // Include conversations with similar topics or recent interactions
        return conv.topics.some(topic => topics.includes(topic)) ||
               (Date.now() - new Date(conv.timestamp).getTime()) < 24 * 60 * 60 * 1000; // Last 24 hours
      })
      .slice(-limit);
    
    // Get relevant personal info
    const relevantPersonal = this.getRelevantPersonalInfo(currentMessage);
    
    // Get relevant relationships
    const relevantRelationships = this.getRelevantRelationships(currentMessage);
    
    // Get relevant projects
    const relevantProjects = this.getRelevantProjects(currentMessage);
    
    return {
      conversations: recentConversations,
      personal: relevantPersonal,
      relationships: relevantRelationships,
      projects: relevantProjects,
      currentSentiment: sentiment,
      currentTopics: topics,
      patterns: this.getRelevantPatterns(),
      preferences: this.getCommunicationPreferences()
    };
  }

  // Get relevant personal information
  getRelevantPersonalInfo(message) {
    const relevant = {};
    const words = message.toLowerCase().split(/\s+/);
    
    for (const [key, info] of this.memories.personal.entries()) {
      if (words.some(word => key.includes(word) || info.value.toString().toLowerCase().includes(word))) {
        relevant[key] = info;
      }
    }
    
    return relevant;
  }

  // Get relevant relationships
  getRelevantRelationships(message) {
    const relevant = {};
    const words = message.toLowerCase().split(/\s+/);
    
    for (const [name, info] of this.memories.relationships.entries()) {
      if (words.includes(name) || words.some(word => info.relationship.includes(word))) {
        relevant[name] = info;
      }
    }
    
    return relevant;
  }

  // Get relevant projects
  getRelevantProjects(message) {
    const relevant = {};
    const words = message.toLowerCase().split(/\s+/);
    
    for (const [projectName, project] of this.memories.projects.entries()) {
      if (words.includes(projectName) || 
          words.some(word => project.name.toLowerCase().includes(word) ||
                            project.tasks.some(task => task.toLowerCase().includes(word)))) {
        relevant[projectName] = project;
      }
    }
    
    return relevant;
  }

  // Get communication preferences
  getCommunicationPreferences() {
    const style = this.learningState.communicationStyle;
    
    return {
      prefersBrief: (style.prefersBriefResponses || 0) > (style.prefersDetailedResponses || 0),
      prefersInformal: (style.prefersInformal || 0) > (style.prefersFormal || 0),
      asksQuestions: (style.asksQuestions || 0) > 10,
      topInterests: Object.entries(this.learningState.topicInterests)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([topic]) => topic),
      emotionalTrend: this.getEmotionalTrend()
    };
  }

  // Get emotional trend
  getEmotionalTrend() {
    const recent = this.memories.emotions.slice(-10);
    if (recent.length === 0) return 'neutral';
    
    const counts = recent.reduce((acc, emotion) => {
      acc[emotion.sentiment] = (acc[emotion.sentiment] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';
  }

  // Get relevant patterns
  getRelevantPatterns() {
    const patterns = {};
    for (const [category, categoryPatterns] of this.memories.patterns.entries()) {
      const sorted = Object.entries(categoryPatterns)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);
      patterns[category] = sorted;
    }
    return patterns;
  }

  // Add achievement
  addAchievement(title, description, category = 'general') {
    const achievement = {
      id: Date.now(),
      title,
      description,
      category,
      timestamp: new Date().toISOString(),
      celebrated: false
    };
    
    this.memories.achievements.push(achievement);
    this.saveMemories();
    console.log(`[Memory] Added achievement: ${title}`);
    return achievement;
  }

  // Get learning insights
  getLearningInsights() {
    return {
      totalConversations: this.memories.conversations.length,
      totalRelationships: this.memories.relationships.size,
      totalProjects: this.memories.projects.size,
      totalInterests: this.memories.interests.size,
      communicationStyle: this.learningState.communicationStyle,
      topTopics: Object.entries(this.learningState.topicInterests)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10),
      emotionalProfile: this.learningState.emotionalPatterns,
      achievements: this.memories.achievements.length,
      memoryHealth: this.assessMemoryHealth()
    };
  }

  // Assess memory system health
  assessMemoryHealth() {
    return {
      conversationRetention: this.memories.conversations.length,
      personalInfoCompleteness: this.memories.personal.size,
      relationshipMaintenance: this.memories.relationships.size,
      projectTracking: this.memories.projects.size,
      learningProgress: Object.keys(this.learningState.topicInterests).length,
      lastSave: this.memories.conversations[this.memories.conversations.length - 1]?.timestamp
    };
  }

  // Clear memories (with confirmation)
  clearMemories(confirmationCode = null) {
    if (confirmationCode !== 'CLEAR_ALL_MEMORIES') {
      throw new Error('Invalid confirmation code. Use "CLEAR_ALL_MEMORIES" to confirm.');
    }
    
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
    
    this.learningState = {
      communicationStyle: {},
      responsePreferences: {},
      topicInterests: {},
      emotionalPatterns: {},
      schedulePatterns: {},
      workPatterns: {}
    };
    
    this.saveMemories();
    console.log('[Memory] All memories cleared');
  }
}

export default new MemoryService();