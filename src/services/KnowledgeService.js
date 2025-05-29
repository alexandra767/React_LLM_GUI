// Advanced Knowledge Integration System for Aria
class KnowledgeService {
  constructor() {
    this.knowledgeBase = {
      realTime: new Map(), // Live data feeds and updates
      personal: new Map(), // User's personal documents and knowledge
      domain: new Map(), // Domain-specific expertise
      factual: new Map(), // Verified facts and information
      procedural: new Map(), // How-to knowledge and procedures
      contextual: new Map(), // Context-dependent information
      temporal: new Map(), // Time-sensitive information
      relational: new Map() // Relationships between concepts
    };
    
    this.dataSources = {
      news: [],
      research: [],
      social: [],
      personal: [],
      realTime: []
    };
    
    this.updateSchedule = {
      news: 30 * 60 * 1000, // 30 minutes
      research: 4 * 60 * 60 * 1000, // 4 hours
      social: 15 * 60 * 1000, // 15 minutes
      realTime: 5 * 60 * 1000 // 5 minutes
    };
    
    this.storageKey = 'aria_knowledge_base';
    this.loadKnowledge();
    this.startUpdateScheduler();
  }

  // Load knowledge from storage
  loadKnowledge() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        
        // Convert arrays back to Maps
        Object.keys(this.knowledgeBase).forEach(key => {
          if (data[key]) {
            this.knowledgeBase[key] = new Map(data[key]);
          }
        });
        
        this.dataSources = { ...this.dataSources, ...data.dataSources };
        
        console.log('[Knowledge] Loaded knowledge base:', {
          realTime: this.knowledgeBase.realTime.size,
          personal: this.knowledgeBase.personal.size,
          domain: this.knowledgeBase.domain.size,
          factual: this.knowledgeBase.factual.size
        });
      }
    } catch (error) {
      console.error('[Knowledge] Failed to load knowledge:', error);
    }
  }

  // Save knowledge to storage
  saveKnowledge() {
    try {
      const data = {
        dataSources: this.dataSources
      };
      
      // Convert Maps to arrays for storage
      Object.keys(this.knowledgeBase).forEach(key => {
        data[key] = Array.from(this.knowledgeBase[key].entries());
      });
      
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('[Knowledge] Failed to save knowledge:', error);
    }
  }

  // Add real-time knowledge
  addRealTimeKnowledge(category, key, value, source, ttl = 3600000) { // 1 hour default TTL
    const knowledge = {
      value,
      source,
      timestamp: Date.now(),
      ttl,
      expiresAt: Date.now() + ttl,
      category,
      confidence: 0.9,
      verified: false
    };
    
    this.knowledgeBase.realTime.set(`${category}:${key}`, knowledge);
    console.log(`[Knowledge] Added real-time: ${category}:${key}`);
  }

  // Add personal knowledge from documents/files
  addPersonalKnowledge(documentId, content, metadata = {}) {
    const knowledge = {
      content,
      metadata: {
        ...metadata,
        addedAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 0,
        tags: metadata.tags || [],
        type: metadata.type || 'document'
      },
      searchable: this.createSearchableContent(content),
      summary: this.generateSummary(content)
    };
    
    this.knowledgeBase.personal.set(documentId, knowledge);
    this.saveKnowledge();
    console.log(`[Knowledge] Added personal knowledge: ${documentId}`);
  }

  // Add domain expertise
  addDomainKnowledge(domain, topic, information, expertise_level = 'intermediate') {
    const knowledge = {
      domain,
      topic,
      information,
      expertise_level,
      addedAt: Date.now(),
      lastUpdated: Date.now(),
      reliability: 0.8,
      sources: [],
      related_topics: []
    };
    
    const key = `${domain}:${topic}`;
    this.knowledgeBase.domain.set(key, knowledge);
    this.saveKnowledge();
    console.log(`[Knowledge] Added domain knowledge: ${key}`);
  }

  // Add verified factual information
  addFactualKnowledge(fact, value, sources = [], confidence = 0.9) {
    const knowledge = {
      fact,
      value,
      sources,
      confidence,
      addedAt: Date.now(),
      lastVerified: Date.now(),
      verification_count: 1,
      related_facts: []
    };
    
    this.knowledgeBase.factual.set(fact, knowledge);
    this.saveKnowledge();
    console.log(`[Knowledge] Added factual knowledge: ${fact}`);
  }

  // Add procedural knowledge (how-to)
  addProceduralKnowledge(procedure, steps, context = {}) {
    const knowledge = {
      procedure,
      steps,
      context,
      addedAt: Date.now(),
      usageCount: 0,
      successRate: 0,
      prerequisites: context.prerequisites || [],
      tools_required: context.tools || [],
      estimated_time: context.time || 'unknown'
    };
    
    this.knowledgeBase.procedural.set(procedure, knowledge);
    this.saveKnowledge();
    console.log(`[Knowledge] Added procedural knowledge: ${procedure}`);
  }

  // Create searchable content
  createSearchableContent(content) {
    return content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .join(' ');
  }

  // Generate summary (simple implementation)
  generateSummary(content) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length <= 3) return content;
    
    // Simple extractive summarization - take first, middle, and last sentences
    const summary = [
      sentences[0],
      sentences[Math.floor(sentences.length / 2)],
      sentences[sentences.length - 1]
    ].join('. ').trim();
    
    return summary;
  }

  // Search knowledge base
  searchKnowledge(query, categories = null, limit = 10) {
    const results = [];
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    const categoriesToSearch = categories || Object.keys(this.knowledgeBase);
    
    for (const category of categoriesToSearch) {
      const knowledgeMap = this.knowledgeBase[category];
      if (!knowledgeMap) continue;
      
      for (const [key, knowledge] of knowledgeMap.entries()) {
        const score = this.calculateRelevanceScore(searchTerms, knowledge, key);
        if (score > 0.1) {
          results.push({
            category,
            key,
            knowledge,
            relevanceScore: score,
            isExpired: this.isExpired(knowledge)
          });
        }
      }
    }
    
    return results
      .filter(result => !result.isExpired)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  // Calculate relevance score
  calculateRelevanceScore(searchTerms, knowledge, key) {
    let score = 0;
    const text = JSON.stringify(knowledge).toLowerCase();
    const keyText = key.toLowerCase();
    
    for (const term of searchTerms) {
      // Exact key match
      if (keyText.includes(term)) score += 1.0;
      
      // Content match
      const matches = (text.match(new RegExp(term, 'g')) || []).length;
      score += matches * 0.2;
      
      // Title/topic match
      if (knowledge.topic && knowledge.topic.toLowerCase().includes(term)) score += 0.8;
      if (knowledge.procedure && knowledge.procedure.toLowerCase().includes(term)) score += 0.8;
    }
    
    // Boost recent and frequently accessed content
    if (knowledge.lastAccessed) {
      const daysSinceAccess = (Date.now() - knowledge.lastAccessed) / (24 * 60 * 60 * 1000);
      if (daysSinceAccess < 7) score *= 1.2;
    }
    
    if (knowledge.accessCount && knowledge.accessCount > 5) {
      score *= 1.1;
    }
    
    return score;
  }

  // Check if knowledge is expired
  isExpired(knowledge) {
    if (!knowledge.expiresAt) return false;
    return Date.now() > knowledge.expiresAt;
  }

  // Get contextual knowledge for current situation
  getContextualKnowledge(context) {
    const { currentTime, userLocation, currentProject, recentTopics, userMood } = context;
    const relevant = [];
    
    // Time-sensitive knowledge
    if (currentTime) {
      const timeKey = `time:${currentTime.getHours()}`;
      const timeKnowledge = this.knowledgeBase.temporal.get(timeKey);
      if (timeKnowledge) relevant.push({ type: 'temporal', knowledge: timeKnowledge });
    }
    
    // Project-related knowledge
    if (currentProject) {
      const projectKnowledge = this.searchKnowledge(currentProject, ['personal', 'domain'], 5);
      relevant.push(...projectKnowledge.map(k => ({ type: 'project', ...k })));
    }
    
    // Topic-related knowledge
    if (recentTopics) {
      for (const topic of recentTopics) {
        const topicKnowledge = this.searchKnowledge(topic, ['domain', 'factual'], 3);
        relevant.push(...topicKnowledge.map(k => ({ type: 'topic', ...k })));
      }
    }
    
    return relevant.slice(0, 15); // Limit contextual results
  }

  // Update real-time knowledge from external sources
  async updateRealTimeKnowledge() {
    console.log('[Knowledge] Updating real-time knowledge...');
    
    try {
      // News updates
      await this.updateNewsKnowledge();
      
      // Weather updates
      await this.updateWeatherKnowledge();
      
      // Market updates
      await this.updateMarketKnowledge();
      
      // Tech news updates
      await this.updateTechKnowledge();
      
    } catch (error) {
      console.error('[Knowledge] Failed to update real-time knowledge:', error);
    }
  }

  // Update news knowledge (mock implementation)
  async updateNewsKnowledge() {
    // In a real implementation, this would fetch from news APIs
    const mockNews = [
      {
        title: "Latest Technology Developments",
        summary: "Recent advances in AI and machine learning",
        category: "technology",
        timestamp: Date.now(),
        source: "tech-news-api"
      },
      {
        title: "Market Updates",
        summary: "Current market trends and economic indicators",
        category: "finance",
        timestamp: Date.now(),
        source: "market-api"
      }
    ];
    
    for (const news of mockNews) {
      this.addRealTimeKnowledge('news', news.title, news, 'news-api', 6 * 60 * 60 * 1000); // 6 hours TTL
    }
  }

  // Update weather knowledge
  async updateWeatherKnowledge() {
    // Mock weather data
    const weather = {
      temperature: "22°C",
      condition: "Partly cloudy",
      humidity: "65%",
      forecast: "Sunny tomorrow",
      timestamp: Date.now()
    };
    
    this.addRealTimeKnowledge('weather', 'current', weather, 'weather-api', 60 * 60 * 1000); // 1 hour TTL
  }

  // Update market knowledge
  async updateMarketKnowledge() {
    // Mock market data
    const market = {
      indices: {
        sp500: "+0.5%",
        nasdaq: "+0.8%",
        dow: "+0.3%"
      },
      trends: "Technology stocks leading gains",
      timestamp: Date.now()
    };
    
    this.addRealTimeKnowledge('market', 'current', market, 'market-api', 30 * 60 * 1000); // 30 minutes TTL
  }

  // Update technology knowledge
  async updateTechKnowledge() {
    // Mock tech updates
    const tech = {
      trends: ["AI advancement", "Quantum computing", "Green technology"],
      releases: "New framework releases and updates",
      research: "Latest research papers and findings",
      timestamp: Date.now()
    };
    
    this.addRealTimeKnowledge('technology', 'current', tech, 'tech-api', 2 * 60 * 60 * 1000); // 2 hours TTL
  }

  // Start automatic update scheduler
  startUpdateScheduler() {
    // Schedule different types of updates
    setInterval(() => this.updateRealTimeKnowledge(), this.updateSchedule.realTime);
    setInterval(() => this.cleanExpiredKnowledge(), 10 * 60 * 1000); // Clean every 10 minutes
    
    console.log('[Knowledge] Update scheduler started');
  }

  // Clean expired knowledge
  cleanExpiredKnowledge() {
    let cleaned = 0;
    
    for (const [category, knowledgeMap] of Object.entries(this.knowledgeBase)) {
      for (const [key, knowledge] of knowledgeMap.entries()) {
        if (this.isExpired(knowledge)) {
          knowledgeMap.delete(key);
          cleaned++;
        }
      }
    }
    
    if (cleaned > 0) {
      console.log(`[Knowledge] Cleaned ${cleaned} expired entries`);
      this.saveKnowledge();
    }
  }

  // Cross-reference information
  crossReference(topic, depth = 2) {
    const related = [];
    const searchResults = this.searchKnowledge(topic, null, 20);
    
    for (const result of searchResults) {
      // Find related topics and concepts
      if (result.knowledge.related_topics) {
        related.push(...result.knowledge.related_topics);
      }
      
      if (result.knowledge.related_facts) {
        related.push(...result.knowledge.related_facts);
      }
      
      // Find semantic relationships
      const semanticRelated = this.findSemanticRelationships(topic, result.knowledge);
      related.push(...semanticRelated);
    }
    
    // Remove duplicates and return top results
    return [...new Set(related)].slice(0, 10);
  }

  // Find semantic relationships (simple implementation)
  findSemanticRelationships(topic, knowledge) {
    const related = [];
    const topicWords = topic.toLowerCase().split(/\s+/);
    const knowledgeText = JSON.stringify(knowledge).toLowerCase();
    
    // Simple word association
    const commonTerms = ['technology', 'development', 'research', 'analysis', 'system', 'process'];
    
    for (const term of commonTerms) {
      if (topicWords.includes(term) && knowledgeText.includes(term)) {
        related.push(term);
      }
    }
    
    return related;
  }

  // Get knowledge summary
  getKnowledgeSummary() {
    const summary = {};
    
    for (const [category, knowledgeMap] of Object.entries(this.knowledgeBase)) {
      summary[category] = {
        total: knowledgeMap.size,
        recent: Array.from(knowledgeMap.values())
          .filter(k => k.addedAt && (Date.now() - k.addedAt) < 24 * 60 * 60 * 1000)
          .length,
        expired: Array.from(knowledgeMap.values())
          .filter(k => this.isExpired(k))
          .length
      };
    }
    
    return {
      categories: summary,
      totalEntries: Object.values(this.knowledgeBase).reduce((sum, map) => sum + map.size, 0),
      lastUpdate: Date.now(),
      updateSchedule: this.updateSchedule
    };
  }

  // Export knowledge for backup
  exportKnowledge() {
    const exportData = {
      knowledgeBase: {},
      dataSources: this.dataSources,
      exportedAt: Date.now(),
      version: '1.0'
    };
    
    // Convert Maps to arrays for export
    Object.keys(this.knowledgeBase).forEach(key => {
      exportData.knowledgeBase[key] = Array.from(this.knowledgeBase[key].entries());
    });
    
    return JSON.stringify(exportData, null, 2);
  }

  // Import knowledge from backup
  importKnowledge(importData) {
    try {
      const data = typeof importData === 'string' ? JSON.parse(importData) : importData;
      
      // Import knowledge base
      Object.keys(data.knowledgeBase).forEach(key => {
        if (this.knowledgeBase[key]) {
          this.knowledgeBase[key] = new Map(data.knowledgeBase[key]);
        }
      });
      
      // Import data sources
      this.dataSources = { ...this.dataSources, ...data.dataSources };
      
      this.saveKnowledge();
      console.log('[Knowledge] Knowledge imported successfully');
      return true;
    } catch (error) {
      console.error('[Knowledge] Failed to import knowledge:', error);
      return false;
    }
  }
}

export default new KnowledgeService();