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

  // Update news knowledge with real data sources
  async updateNewsKnowledge() {
    console.log('[Knowledge] Fetching real news data...');
    
    try {
      // Try multiple news sources for redundancy
      const newsSources = [
        'https://rss.cnn.com/rss/edition.rss',
        'https://feeds.washingtonpost.com/rss/politics',
        'https://feeds.washingtonpost.com/rss/world',
        'https://feeds.npr.org/1001/rss.xml',
        'https://feeds.bbci.co.uk/news/rss.xml',
        'https://feeds.reuters.com/Reuters/PoliticsNews',
        'https://feeds.feedburner.com/oreilly/radar/atom10',
        'https://www.wired.com/feed/rss'
      ];
      
      for (const sourceUrl of newsSources) {
        try {
          const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(sourceUrl)}`;
          const response = await fetch(proxyUrl);
          
          if (response.ok) {
            const data = await response.json();
            const newsData = await this.parseRSSFeed(data.contents, sourceUrl);
            
            for (const article of newsData.slice(0, 5)) { // Limit to 5 articles per source
              this.addRealTimeKnowledge('news', `${article.source}: ${article.title}`, {
                title: article.title,
                summary: article.description || article.title,
                category: 'news',
                url: article.link,
                publishedAt: article.pubDate,
                source: article.source,
                timestamp: Date.now()
              }, 'rss-feed', 6 * 60 * 60 * 1000); // 6 hours TTL
            }
            
            console.log(`[Knowledge] ✅ Fetched ${newsData.length} articles from ${this.getSourceName(sourceUrl)}`);
            break; // Success, no need to try other sources
          }
        } catch (sourceError) {
          console.warn(`[Knowledge] Failed to fetch from ${sourceUrl}:`, sourceError.message);
        }
      }
      
      // Fallback: Hacker News API (reliable)
      try {
        const hackernewsResponse = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
        if (hackernewsResponse.ok) {
          const storyIds = await hackernewsResponse.json();
          
          // Get top 5 stories
          for (let i = 0; i < Math.min(5, storyIds.length); i++) {
            const storyResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${storyIds[i]}.json`);
            if (storyResponse.ok) {
              const story = await storyResponse.json();
              
              this.addRealTimeKnowledge('news', `HN: ${story.title}`, {
                title: story.title,
                summary: story.title,
                category: 'tech-news',
                url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
                publishedAt: new Date(story.time * 1000).toISOString(),
                source: 'Hacker News',
                score: story.score,
                timestamp: Date.now()
              }, 'hackernews-api', 4 * 60 * 60 * 1000); // 4 hours TTL
            }
          }
          
          console.log('[Knowledge] ✅ Fetched top stories from Hacker News');
        }
      } catch (hnError) {
        console.warn('[Knowledge] Hacker News API failed:', hnError.message);
      }

      // Try alternative news APIs as fallback
      try {
        // NewsAPI.org (free tier) - if available
        const newsApiUrl = 'https://newsapi.org/v2/top-headlines?country=us&category=general&pageSize=5';
        // Note: Would need API key for production use
        
        // Reddit API for politics subreddit (no auth needed for top posts)
        const redditPoliticsUrl = 'https://www.reddit.com/r/politics/top.json?limit=5&t=day';
        const redditResponse = await fetch(redditPoliticsUrl);
        
        if (redditResponse.ok) {
          const redditData = await redditResponse.json();
          const posts = redditData.data?.children || [];
          
          posts.forEach(post => {
            const postData = post.data;
            this.addRealTimeKnowledge('news', `Reddit Politics: ${postData.title}`, {
              title: postData.title,
              summary: postData.selftext?.substring(0, 200) || postData.title,
              category: 'politics',
              url: `https://reddit.com${postData.permalink}`,
              publishedAt: new Date(postData.created_utc * 1000).toISOString(),
              source: 'Reddit r/politics',
              score: postData.score,
              timestamp: Date.now()
            }, 'reddit-api', 4 * 60 * 60 * 1000);
          });
          
          console.log('[Knowledge] ✅ Fetched political discussions from Reddit');
        }
      } catch (redditError) {
        console.warn('[Knowledge] Reddit fallback failed:', redditError.message);
      }
      
    } catch (error) {
      console.error('[Knowledge] News update failed:', error);
      
      // Fallback to curated tech news
      this.addRealTimeKnowledge('news', 'Tech Update', {
        title: 'Autonomous Learning Active',
        summary: 'Aria is continuously learning from multiple data sources including news, research, and user interactions.',
        category: 'system',
        timestamp: Date.now(),
        source: 'internal'
      }, 'fallback', 2 * 60 * 60 * 1000);
    }
  }

  // Parse RSS feed content
  async parseRSSFeed(xmlContent, sourceUrl) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      
      const items = xmlDoc.getElementsByTagName('item') || xmlDoc.getElementsByTagName('entry');
      const articles = [];
      
      for (let i = 0; i < Math.min(items.length, 10); i++) {
        const item = items[i];
        
        const title = this.getTextContent(item, ['title']);
        const description = this.getTextContent(item, ['description', 'summary', 'content']);
        const link = this.getTextContent(item, ['link', 'id']) || this.getAttribute(item, 'link', 'href');
        const pubDate = this.getTextContent(item, ['pubDate', 'published', 'updated']);
        
        if (title) {
          articles.push({
            title: title.substring(0, 200),
            description: description ? description.substring(0, 300) : '',
            link: link,
            pubDate: pubDate,
            source: this.getSourceName(sourceUrl)
          });
        }
      }
      
      return articles;
    } catch (parseError) {
      console.error('[Knowledge] RSS parsing failed:', parseError);
      return [];
    }
  }

  // Helper to get text content from XML elements
  getTextContent(item, tagNames) {
    for (const tagName of tagNames) {
      const element = item.getElementsByTagName(tagName)[0];
      if (element) {
        return element.textContent?.trim() || '';
      }
    }
    return '';
  }

  // Helper to get attribute content
  getAttribute(item, tagName, attributeName) {
    const element = item.getElementsByTagName(tagName)[0];
    return element?.getAttribute(attributeName) || '';
  }

  // Get friendly source name
  getSourceName(url) {
    if (url.includes('oreilly')) return 'O\'Reilly Radar';
    if (url.includes('cnn')) return 'CNN';
    if (url.includes('washingtonpost')) return 'Washington Post';
    if (url.includes('wired')) return 'Wired';
    return 'RSS Feed';
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

  // Update technology knowledge with real GitHub data
  async updateTechKnowledge() {
    console.log('[Knowledge] Fetching real tech/programming data...');
    
    try {
      // Fetch trending GitHub repositories
      const githubResponse = await fetch('https://api.github.com/search/repositories?q=created:>2024-05-01&sort=stars&order=desc&per_page=10');
      
      if (githubResponse.ok) {
        const githubData = await githubResponse.json();
        
        for (const repo of githubData.items.slice(0, 5)) {
          this.addRealTimeKnowledge('technology', `GitHub Trending: ${repo.name}`, {
            title: repo.full_name,
            summary: repo.description || `Popular ${repo.language} repository`,
            category: 'programming',
            url: repo.html_url,
            language: repo.language,
            stars: repo.stargazers_count,
            topics: repo.topics || [],
            updatedAt: repo.updated_at,
            source: 'GitHub API',
            timestamp: Date.now()
          }, 'github-api', 4 * 60 * 60 * 1000); // 4 hours TTL
        }
        
        console.log('[Knowledge] ✅ Fetched trending GitHub repositories');
      }
      
      // Fetch programming language trends
      const langResponse = await fetch('https://api.github.com/search/repositories?q=stars:>1000&sort=updated&order=desc&per_page=20');
      
      if (langResponse.ok) {
        const langData = await langResponse.json();
        const languageCount = {};
        
        langData.items.forEach(repo => {
          if (repo.language) {
            languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
          }
        });
        
        const topLanguages = Object.entries(languageCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([lang, count]) => ({ language: lang, activity: count }));
        
        this.addRealTimeKnowledge('technology', 'Programming Language Trends', {
          title: 'Programming Language Activity',
          summary: 'Current programming language trends based on GitHub activity',
          category: 'programming-trends',
          topLanguages: topLanguages,
          source: 'GitHub API Analysis',
          timestamp: Date.now()
        }, 'github-trends', 6 * 60 * 60 * 1000); // 6 hours TTL
        
        console.log('[Knowledge] ✅ Analyzed programming language trends');
      }
      
      // Fetch tech news from developer-focused sources
      await this.fetchDeveloperNews();
      
      // Add curated tech insights
      this.addRealTimeKnowledge('technology', 'AI Development Focus', {
        title: 'Current AI/ML Development Trends',
        summary: 'Focus areas: LLM optimization, multimodal AI, autonomous agents, and real-time inference',
        category: 'ai-trends',
        trends: ['LLM Optimization', 'Multimodal AI', 'Autonomous Agents', 'Edge AI'],
        source: 'Trend Analysis',
        timestamp: Date.now()
      }, 'curated-tech', 8 * 60 * 60 * 1000); // 8 hours TTL
      
    } catch (error) {
      console.error('[Knowledge] Tech knowledge update failed:', error);
      
      // Fallback to basic tech trends
      this.addRealTimeKnowledge('technology', 'Tech Trends Fallback', {
        title: 'Current Technology Focus Areas',
        summary: 'AI/ML development, cloud computing, and developer tools continue to evolve rapidly',
        category: 'tech-general',
        trends: ['Artificial Intelligence', 'Cloud Computing', 'Developer Experience'],
        source: 'Fallback Data',
        timestamp: Date.now()
      }, 'fallback-tech', 4 * 60 * 60 * 1000);
    }
  }

  // Fetch developer-focused news
  async fetchDeveloperNews() {
    try {
      const devSources = [
        'https://feeds.feedburner.com/oreilly/radar/atom10',
        'https://github.blog/feed/',
        'https://stackoverflow.blog/feed/'
      ];
      
      for (const sourceUrl of devSources) {
        try {
          const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(sourceUrl)}`;
          const response = await fetch(proxyUrl);
          
          if (response.ok) {
            const data = await response.json();
            const articles = await this.parseRSSFeed(data.contents, sourceUrl);
            
            for (const article of articles.slice(0, 3)) {
              this.addRealTimeKnowledge('technology', `Dev News: ${article.title}`, {
                title: article.title,
                summary: article.description || article.title,
                category: 'developer-news',
                url: article.link,
                publishedAt: article.pubDate,
                source: article.source,
                timestamp: Date.now()
              }, 'dev-news', 4 * 60 * 60 * 1000);
            }
            
            console.log(`[Knowledge] ✅ Fetched developer news from ${this.getSourceName(sourceUrl)}`);
            break; // Success with one source is enough
          }
        } catch (sourceError) {
          console.warn(`[Knowledge] Dev news source failed ${sourceUrl}:`, sourceError.message);
        }
      }
    } catch (error) {
      console.error('[Knowledge] Developer news fetch failed:', error);
    }
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