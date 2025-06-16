// Proactive Learning Notification System for Aria
class LearningNotificationService {
  constructor() {
    this.notifications = [];
    this.preferences = {
      enableNotifications: true,
      notificationTypes: {
        interesting_articles: true,
        programming_trends: true,
        new_tools: true,
        learning_insights: true,
        daily_summary: true
      },
      quietHours: {
        enabled: false,
        start: 22, // 10 PM
        end: 8     // 8 AM
      },
      maxPerDay: 10,
      cooldownMinutes: 30
    };
    
    this.storageKey = 'aria_learning_notifications';
    this.preferencesKey = 'aria_notification_preferences';
    this.lastNotificationTime = 0;
    this.dailyCount = 0;
    this.lastDayReset = new Date().getDate();
    
    this.loadPreferences();
    this.loadNotifications();
    this.startNotificationEngine();
  }

  // Load notification preferences
  loadPreferences() {
    try {
      const stored = localStorage.getItem(this.preferencesKey);
      if (stored) {
        const prefs = JSON.parse(stored);
        this.preferences = { ...this.preferences, ...prefs };
      }
    } catch (error) {
      console.error('[LearningNotifications] Failed to load preferences:', error);
    }
  }

  // Save notification preferences
  savePreferences() {
    try {
      localStorage.setItem(this.preferencesKey, JSON.stringify(this.preferences));
    } catch (error) {
      console.error('[LearningNotifications] Failed to save preferences:', error);
    }
  }

  // Load stored notifications
  loadNotifications() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[LearningNotifications] Failed to load notifications:', error);
    }
  }

  // Save notifications
  saveNotifications() {
    try {
      // Keep only last 50 notifications
      const recentNotifications = this.notifications.slice(-50);
      localStorage.setItem(this.storageKey, JSON.stringify(recentNotifications));
      this.notifications = recentNotifications;
    } catch (error) {
      console.error('[LearningNotifications] Failed to save notifications:', error);
    }
  }

  // Start the notification engine
  startNotificationEngine() {
    // Check for interesting content every 10 minutes
    setInterval(() => {
      this.checkForInterestingContent();
    }, 10 * 60 * 1000);

    // Generate daily summary at 6 PM
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 18 && now.getMinutes() < 10) {
        this.generateDailySummary();
      }
    }, 10 * 60 * 1000);

    console.log('[LearningNotifications] Notification engine started');
  }

  // Check for interesting content from knowledge base
  async checkForInterestingContent() {
    try {
      if (!this.shouldCreateNotification()) {
        return;
      }

      // Get recent knowledge updates
      const knowledgeData = localStorage.getItem('aria_knowledge_base');
      if (!knowledgeData) return;

      const knowledge = JSON.parse(knowledgeData);
      const recentItems = this.getRecentKnowledgeItems(knowledge);

      // Analyze for interesting content
      for (const item of recentItems) {
        const interestScore = this.calculateInterestScore(item);
        
        if (interestScore > 0.7) {
          await this.createInterestingContentNotification(item);
          break; // Only one notification per check
        }
      }

    } catch (error) {
      console.error('[LearningNotifications] Content check failed:', error);
    }
  }

  // Get recent knowledge items
  getRecentKnowledgeItems(knowledge) {
    const items = [];
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    // Check real-time knowledge
    if (knowledge.realTime) {
      for (const [category, knowledgeMap] of knowledge.realTime) {
        for (const [key, item] of knowledgeMap) {
          if (item.timestamp > oneHourAgo) {
            items.push({ ...item, category, key });
          }
        }
      }
    }

    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
  }

  // Calculate interest score for content
  calculateInterestScore(item) {
    let score = 0;

    // Programming/tech content gets higher score
    if (item.category?.includes('programming') || item.category?.includes('tech')) {
      score += 0.3;
    }

    // GitHub trending repositories
    if (item.source === 'GitHub API') {
      score += 0.4;
    }

    // Popular content (high stars, scores)
    if (item.stars > 1000) {
      score += 0.2;
    }
    if (item.score > 100) {
      score += 0.2;
    }

    // AI/ML related content
    const aiKeywords = ['ai', 'machine learning', 'neural', 'llm', 'gpt', 'transformer'];
    const hasAIKeywords = aiKeywords.some(keyword => 
      item.title?.toLowerCase().includes(keyword) || 
      item.summary?.toLowerCase().includes(keyword)
    );
    if (hasAIKeywords) {
      score += 0.3;
    }

    // React/JavaScript content (based on user's project)
    const webKeywords = ['react', 'javascript', 'typescript', 'node', 'npm'];
    const hasWebKeywords = webKeywords.some(keyword => 
      item.title?.toLowerCase().includes(keyword) || 
      item.language?.toLowerCase().includes(keyword)
    );
    if (hasWebKeywords) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  // Create notification for interesting content
  async createInterestingContentNotification(item) {
    if (!this.preferences.notificationTypes.interesting_articles) {
      return;
    }

    const notification = {
      id: `interesting_${Date.now()}`,
      type: 'interesting_content',
      title: 'Found Something Interesting!',
      message: this.formatInterestingContentMessage(item),
      item: item,
      timestamp: Date.now(),
      read: false,
      actions: ['view', 'save', 'dismiss']
    };

    this.addNotification(notification);
    
    // Show browser notification if available
    await this.showBrowserNotification(notification);
  }

  // Format message for interesting content
  formatInterestingContentMessage(item) {
    if (item.source === 'GitHub API') {
      return `🔥 Trending: ${item.title} (${item.language}) - ${item.stars} stars\n${item.summary}`;
    }
    
    if (item.category?.includes('tech') || item.category?.includes('programming')) {
      return `💡 Tech Update: ${item.title}\n${item.summary}`;
    }

    return `📰 ${item.source}: ${item.title}\n${item.summary}`;
  }

  // Generate daily learning summary
  async generateDailySummary() {
    if (!this.preferences.notificationTypes.daily_summary) {
      return;
    }

    try {
      const knowledgeData = localStorage.getItem('aria_knowledge_base');
      const proactiveData = localStorage.getItem('aria_proactive_intelligence');
      
      if (!knowledgeData && !proactiveData) return;

      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).getTime();
      
      let learnedToday = 0;
      let topCategories = [];
      let interestingItems = [];

      // Analyze knowledge learned today
      if (knowledgeData) {
        const knowledge = JSON.parse(knowledgeData);
        if (knowledge.realTime) {
          for (const [category, knowledgeMap] of knowledge.realTime) {
            for (const [key, item] of knowledgeMap) {
              if (item.timestamp > startOfDay) {
                learnedToday++;
                topCategories.push(category);
                
                if (this.calculateInterestScore(item) > 0.6) {
                  interestingItems.push(item);
                }
              }
            }
          }
        }
      }

      if (learnedToday === 0) return;

      // Count category frequencies
      const categoryCounts = {};
      topCategories.forEach(cat => {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
      
      const topCats = Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([cat]) => cat);

      const notification = {
        id: `daily_summary_${Date.now()}`,
        type: 'daily_summary',
        title: '🧠 Daily Learning Summary',
        message: `Today I learned ${learnedToday} new things!\n\nTop areas: ${topCats.join(', ')}\n${interestingItems.length > 0 ? `\nHighlights: ${interestingItems.length} particularly interesting items` : ''}`,
        timestamp: Date.now(),
        read: false,
        stats: {
          totalItems: learnedToday,
          topCategories: topCats,
          interestingItems: interestingItems.length
        },
        actions: ['view_details', 'dismiss']
      };

      this.addNotification(notification);
      await this.showBrowserNotification(notification);

    } catch (error) {
      console.error('[LearningNotifications] Daily summary failed:', error);
    }
  }

  // Add notification to the list
  addNotification(notification) {
    this.notifications.push(notification);
    this.dailyCount++;
    this.lastNotificationTime = Date.now();
    this.saveNotifications();
    
    console.log(`[LearningNotifications] Created notification: ${notification.title}`);
  }

  // Show browser notification
  async showBrowserNotification(notification) {
    if (!('Notification' in window)) {
      return;
    }

    // Request permission if needed
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message.split('\n')[0], // First line only
        icon: '/brain-lightning.png',
        tag: notification.type,
        requireInteraction: false
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  }

  // Check if we should create a notification
  shouldCreateNotification() {
    // Reset daily count if it's a new day
    const currentDay = new Date().getDate();
    if (currentDay !== this.lastDayReset) {
      this.dailyCount = 0;
      this.lastDayReset = currentDay;
    }

    // Check if notifications are enabled
    if (!this.preferences.enableNotifications) {
      return false;
    }

    // Check daily limit
    if (this.dailyCount >= this.preferences.maxPerDay) {
      return false;
    }

    // Check cooldown
    const timeSinceLastNotification = Date.now() - this.lastNotificationTime;
    const cooldownMs = this.preferences.cooldownMinutes * 60 * 1000;
    if (timeSinceLastNotification < cooldownMs) {
      return false;
    }

    // Check quiet hours
    if (this.preferences.quietHours.enabled) {
      const currentHour = new Date().getHours();
      const start = this.preferences.quietHours.start;
      const end = this.preferences.quietHours.end;
      
      if (start > end) { // Overnight quiet hours (e.g., 10 PM to 8 AM)
        if (currentHour >= start || currentHour < end) {
          return false;
        }
      } else if (currentHour >= start && currentHour < end) {
        return false;
      }
    }

    return true;
  }

  // Get all notifications
  getNotifications() {
    return [...this.notifications].reverse(); // Most recent first
  }

  // Get unread notifications
  getUnreadNotifications() {
    return this.notifications.filter(n => !n.read);
  }

  // Mark notification as read
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
    }
  }

  // Mark all notifications as read
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
  }

  // Update preferences
  updatePreferences(newPreferences) {
    this.preferences = { ...this.preferences, ...newPreferences };
    this.savePreferences();
  }

  // Get current preferences
  getPreferences() {
    return { ...this.preferences };
  }
}

export default new LearningNotificationService();