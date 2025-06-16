// Proactive Intelligence and Predictive Assistance System for Aria
class ProactiveIntelligenceService {
  constructor() {
    this.predictions = new Map();
    this.notifications = [];
    this.patterns = new Map();
    this.triggers = new Map();
    this.suggestions = new Map();
    this.analytics = {
      userBehavior: new Map(),
      timePatterns: new Map(),
      contextPatterns: new Map(),
      goalProgress: new Map()
    };
    
    this.config = {
      predictionThreshold: 0.7,
      notificationCooldown: 30 * 60 * 1000, // 30 minutes
      maxNotificationsPerDay: 20,
      learningWindowDays: 30,
      confidenceThreshold: 0.6
    };
    
    this.storageKey = 'aria_proactive_intelligence';
    this.loadIntelligence();
    this.startIntelligenceEngine();
  }

  // Load intelligence data
  loadIntelligence() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        
        this.predictions = new Map(data.predictions || []);
        this.patterns = new Map(data.patterns || []);
        this.triggers = new Map(data.triggers || []);
        this.suggestions = new Map(data.suggestions || []);
        this.notifications = data.notifications || [];
        
        // Restore analytics
        Object.keys(this.analytics).forEach(key => {
          if (data.analytics && data.analytics[key]) {
            this.analytics[key] = new Map(data.analytics[key]);
          }
        });
        
        console.log('[Proactive] Loaded intelligence data');
      }
    } catch (error) {
      console.error('[Proactive] Failed to load intelligence:', error);
    }
  }

  // Save intelligence data
  saveIntelligence() {
    try {
      const data = {
        predictions: Array.from(this.predictions.entries()),
        patterns: Array.from(this.patterns.entries()),
        triggers: Array.from(this.triggers.entries()),
        suggestions: Array.from(this.suggestions.entries()),
        notifications: this.notifications.slice(-100), // Keep last 100 notifications
        analytics: {}
      };
      
      // Save analytics
      Object.keys(this.analytics).forEach(key => {
        data.analytics[key] = Array.from(this.analytics[key].entries());
      });
      
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('[Proactive] Failed to save intelligence:', error);
    }
  }

  // Analyze user behavior and create patterns
  analyzeUserBehavior(action, context = {}) {
    const timestamp = Date.now();
    const hour = new Date(timestamp).getHours();
    const dayOfWeek = new Date(timestamp).getDay();
    
    // Record behavior
    const behaviorKey = `${action}_${hour}_${dayOfWeek}`;
    const current = this.analytics.userBehavior.get(behaviorKey) || { count: 0, contexts: [] };
    current.count++;
    current.contexts.push({ ...context, timestamp });
    current.lastOccurrence = timestamp;
    
    this.analytics.userBehavior.set(behaviorKey, current);
    
    // Update time patterns
    this.updateTimePatterns(action, hour, dayOfWeek);
    
    // Update context patterns
    this.updateContextPatterns(action, context);
    
    // Generate predictions based on patterns
    this.generatePredictions(action, context);
    
    this.saveIntelligence();
  }

  // Update time-based patterns
  updateTimePatterns(action, hour, dayOfWeek) {
    const timeKey = `${action}_time`;
    const patterns = this.analytics.timePatterns.get(timeKey) || {
      hourDistribution: new Array(24).fill(0),
      dayDistribution: new Array(7).fill(0),
      totalOccurrences: 0
    };
    
    patterns.hourDistribution[hour]++;
    patterns.dayDistribution[dayOfWeek]++;
    patterns.totalOccurrences++;
    
    this.analytics.timePatterns.set(timeKey, patterns);
  }

  // Update context patterns
  updateContextPatterns(action, context) {
    const contextKey = `${action}_context`;
    const patterns = this.analytics.contextPatterns.get(contextKey) || {};
    
    Object.keys(context).forEach(key => {
      const value = context[key];
      if (!patterns[key]) patterns[key] = {};
      patterns[key][value] = (patterns[key][value] || 0) + 1;
    });
    
    this.analytics.contextPatterns.set(contextKey, patterns);
  }

  // Generate predictions based on current patterns
  generatePredictions(currentAction, currentContext) {
    const now = Date.now();
    const hour = new Date(now).getHours();
    const dayOfWeek = new Date(now).getDay();
    
    // Predict next likely actions
    const likelyActions = this.predictNextActions(currentAction, currentContext, hour, dayOfWeek, now);
    
    for (const prediction of likelyActions) {
      if (prediction.confidence > this.config.predictionThreshold) {
        this.addPrediction(prediction);
      }
    }
    
    // Generate contextual suggestions
    this.generateContextualSuggestions(currentAction, currentContext);
  }

  // Predict next likely actions
  predictNextActions(currentAction, currentContext, hour, dayOfWeek, now) {
    const predictions = [];
    
    // Analyze sequential patterns
    const sequentialPatterns = this.findSequentialPatterns(currentAction);
    
    for (const [nextAction, data] of sequentialPatterns.entries()) {
      const confidence = this.calculateSequentialConfidence(data, hour, dayOfWeek);
      
      if (confidence > this.config.confidenceThreshold) {
        predictions.push({
          action: nextAction,
          confidence,
          predictedTime: now + data.averageDelay,
          reasoning: `Based on ${data.occurrences} previous patterns`,
          context: currentContext,
          type: 'sequential'
        });
      }
    }
    
    // Analyze time-based patterns
    const timeBasedPredictions = this.predictByTimePatterns(hour, dayOfWeek);
    predictions.push(...timeBasedPredictions);
    
    return predictions.sort((a, b) => b.confidence - a.confidence);
  }

  // Find sequential action patterns
  findSequentialPatterns(currentAction) {
    const patterns = new Map();
    const behaviors = Array.from(this.analytics.userBehavior.entries())
      .filter(([key]) => key.startsWith(currentAction))
      .map(([key, data]) => ({ key, ...data }))
      .sort((a, b) => b.lastOccurrence - a.lastOccurrence)
      .slice(0, 50); // Last 50 occurrences
    
    // Look for what typically happens after current action
    for (let i = 0; i < behaviors.length - 1; i++) {
      const current = behaviors[i];
      const next = behaviors[i + 1];
      
      if (next.lastOccurrence - current.lastOccurrence < 60 * 60 * 1000) { // Within 1 hour
        const nextAction = next.key.split('_')[0];
        const delay = next.lastOccurrence - current.lastOccurrence;
        
        const existing = patterns.get(nextAction) || { 
          occurrences: 0, 
          totalDelay: 0, 
          delays: [] 
        };
        
        existing.occurrences++;
        existing.totalDelay += delay;
        existing.delays.push(delay);
        existing.averageDelay = existing.totalDelay / existing.occurrences;
        
        patterns.set(nextAction, existing);
      }
    }
    
    return patterns;
  }

  // Calculate confidence for sequential patterns
  calculateSequentialConfidence(data, hour, dayOfWeek) {
    const baseConfidence = Math.min(data.occurrences / 10, 1.0); // Max confidence at 10+ occurrences
    
    // Adjust for time consistency
    const avgHour = Math.floor(data.averageDelay / (60 * 60 * 1000)) + hour;
    const timeConsistency = this.getTimeConsistency(avgHour, dayOfWeek);
    
    return baseConfidence * 0.7 + timeConsistency * 0.3;
  }

  // Get time pattern consistency
  getTimeConsistency(hour, dayOfWeek) {
    // Simple implementation - could be enhanced with actual historical data
    return 0.8; // Placeholder
  }

  // Predict actions based on time patterns
  predictByTimePatterns(hour, dayOfWeek) {
    const predictions = [];
    
    for (const [timeKey, patterns] of this.analytics.timePatterns.entries()) {
      const action = timeKey.replace('_time', '');
      
      // Check if this is a likely time for this action
      const hourProbability = patterns.hourDistribution[hour] / patterns.totalOccurrences;
      const dayProbability = patterns.dayDistribution[dayOfWeek] / patterns.totalOccurrences;
      
      const confidence = (hourProbability + dayProbability) / 2;
      
      if (confidence > this.config.confidenceThreshold) {
        predictions.push({
          action,
          confidence,
          predictedTime: Date.now() + 30 * 60 * 1000, // 30 minutes from now
          reasoning: `Typically occurs at this time (${Math.round(confidence * 100)}% probability)`,
          type: 'temporal'
        });
      }
    }
    
    return predictions;
  }

  // Add a prediction
  addPrediction(prediction) {
    const predictionId = `${prediction.action}_${prediction.predictedTime}`;
    prediction.id = predictionId;
    prediction.createdAt = Date.now();
    prediction.status = 'pending';
    
    this.predictions.set(predictionId, prediction);
    
    console.log(`[Proactive] Added prediction: ${prediction.action} (${Math.round(prediction.confidence * 100)}% confidence)`);
  }

  // Generate contextual suggestions
  generateContextualSuggestions(currentAction, currentContext) {
    const suggestions = [];
    
    // Context-based suggestions
    if (currentContext.project) {
      suggestions.push({
        id: `project_help_${Date.now()}`,
        type: 'assistance',
        title: 'Project Support',
        description: `I can help you with ${currentContext.project}. Would you like me to find related resources or check your progress?`,
        confidence: 0.8,
        actions: ['show_project_status', 'find_resources', 'check_deadlines']
      });
    }
    
    if (currentContext.time === 'morning') {
      suggestions.push({
        id: `morning_routine_${Date.now()}`,
        type: 'routine',
        title: 'Morning Productivity',
        description: 'Start your day strong! Would you like me to show your schedule and priorities?',
        confidence: 0.7,
        actions: ['show_calendar', 'list_priorities', 'check_weather']
      });
    }
    
    if (currentAction === 'research') {
      suggestions.push({
        id: `research_assist_${Date.now()}`,
        type: 'enhancement',
        title: 'Research Enhancement',
        description: 'I can help expand your research with related topics and current information.',
        confidence: 0.9,
        actions: ['find_related_topics', 'get_latest_news', 'suggest_sources']
      });
    }
    
    // Store suggestions
    suggestions.forEach(suggestion => {
      this.suggestions.set(suggestion.id, suggestion);
    });
  }

  // Create smart notification
  createNotification(type, title, message, priority = 'normal', actions = []) {
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      priority, // low, normal, high, urgent
      actions,
      createdAt: Date.now(),
      status: 'pending',
      dismissed: false,
      interacted: false
    };
    
    // Check notification limits
    const todayNotifications = this.notifications.filter(
      n => Date.now() - n.createdAt < 24 * 60 * 60 * 1000
    ).length;
    
    if (todayNotifications >= this.config.maxNotificationsPerDay && priority !== 'urgent') {
      console.log('[Proactive] Notification limit reached for today');
      return null;
    }
    
    this.notifications.push(notification);
    this.saveIntelligence();
    
    console.log(`[Proactive] Created notification: ${title}`);
    return notification;
  }

  // Get current predictions
  getCurrentPredictions(limit = 10) {
    const now = Date.now();
    
    return Array.from(this.predictions.values())
      .filter(p => p.status === 'pending' && p.predictedTime > now)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  // Get active suggestions
  getActiveSuggestions(context = {}, limit = 5) {
    const suggestions = Array.from(this.suggestions.values())
      .filter(s => !s.dismissed)
      .sort((a, b) => b.confidence - a.confidence);
    
    // Filter by context relevance
    const relevant = suggestions.filter(suggestion => {
      if (context.project && suggestion.description.includes(context.project)) return true;
      if (context.currentAction && suggestion.type === 'enhancement') return true;
      return suggestion.confidence > 0.7;
    });
    
    return relevant.slice(0, limit);
  }

  // Get pending notifications
  getPendingNotifications() {
    return this.notifications
      .filter(n => n.status === 'pending' && !n.dismissed)
      .sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
  }

  // Mark prediction as fulfilled
  fulfillPrediction(predictionId, accuracy = null) {
    const prediction = this.predictions.get(predictionId);
    if (prediction) {
      prediction.status = 'fulfilled';
      prediction.fulfilledAt = Date.now();
      if (accuracy !== null) prediction.accuracy = accuracy;
      
      // Learn from prediction accuracy
      this.updatePredictionAccuracy(prediction);
      
      this.saveIntelligence();
      console.log(`[Proactive] Prediction fulfilled: ${predictionId}`);
    }
  }

  // Update prediction accuracy for learning
  updatePredictionAccuracy(prediction) {
    const actionKey = `accuracy_${prediction.action}`;
    const accuracy = this.patterns.get(actionKey) || { total: 0, correct: 0, accuracy: 0 };
    
    accuracy.total++;
    if (prediction.accuracy > 0.5) accuracy.correct++;
    accuracy.accuracy = accuracy.correct / accuracy.total;
    
    this.patterns.set(actionKey, accuracy);
  }

  // Dismiss notification
  dismissNotification(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.dismissed = true;
      notification.dismissedAt = Date.now();
      this.saveIntelligence();
    }
  }

  // Interact with notification
  interactWithNotification(notificationId, action) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.interacted = true;
      notification.interactionAction = action;
      notification.interactedAt = Date.now();
      this.saveIntelligence();
      
      // Learn from interaction
      this.learnFromInteraction(notification, action);
    }
  }

  // Learn from user interactions
  learnFromInteraction(notification, action) {
    const interactionKey = `interaction_${notification.type}_${action}`;
    const interaction = this.patterns.get(interactionKey) || { count: 0, success: 0 };
    
    interaction.count++;
    if (action === 'accept' || action === 'execute') {
      interaction.success++;
    }
    interaction.successRate = interaction.success / interaction.count;
    
    this.patterns.set(interactionKey, interaction);
  }

  // Get intelligence insights
  getIntelligenceInsights() {
    const totalPredictions = this.predictions.size;
    const fulfilledPredictions = Array.from(this.predictions.values())
      .filter(p => p.status === 'fulfilled').length;
    
    const totalNotifications = this.notifications.length;
    const interactedNotifications = this.notifications
      .filter(n => n.interacted).length;
    
    return {
      predictions: {
        total: totalPredictions,
        fulfilled: fulfilledPredictions,
        accuracy: totalPredictions > 0 ? fulfilledPredictions / totalPredictions : 0,
        pending: Array.from(this.predictions.values())
          .filter(p => p.status === 'pending').length
      },
      notifications: {
        total: totalNotifications,
        interacted: interactedNotifications,
        interactionRate: totalNotifications > 0 ? interactedNotifications / totalNotifications : 0,
        pending: this.getPendingNotifications().length
      },
      patterns: {
        behaviorPatterns: this.analytics.userBehavior.size,
        timePatterns: this.analytics.timePatterns.size,
        contextPatterns: this.analytics.contextPatterns.size
      },
      learning: {
        confidenceThreshold: this.config.confidenceThreshold,
        predictionAccuracy: this.calculateOverallAccuracy(),
        learningDataPoints: Array.from(this.analytics.userBehavior.values())
          .reduce((sum, data) => sum + data.count, 0)
      }
    };
  }

  // Calculate overall prediction accuracy
  calculateOverallAccuracy() {
    const accuracyPatterns = Array.from(this.patterns.entries())
      .filter(([key]) => key.startsWith('accuracy_'))
      .map(([, data]) => data.accuracy);
    
    if (accuracyPatterns.length === 0) return 0;
    
    return accuracyPatterns.reduce((sum, acc) => sum + acc, 0) / accuracyPatterns.length;
  }

  // Start the intelligence engine
  startIntelligenceEngine() {
    // Run intelligence analysis every 5 minutes
    setInterval(() => {
      this.runIntelligenceAnalysis();
    }, 5 * 60 * 1000);
    
    // Clean old data every hour
    setInterval(() => {
      this.cleanOldData();
    }, 60 * 60 * 1000);
    
    console.log('[Proactive] Intelligence engine started');
  }

  // Run periodic intelligence analysis
  runIntelligenceAnalysis() {
    const now = Date.now();
    const currentHour = new Date(now).getHours();
    
    // Check if any predictions should trigger notifications
    this.checkPredictionTriggers();
    
    // Generate time-based suggestions
    this.generateTimeBasedSuggestions(currentHour);
    
    // Update pattern confidence
    this.updatePatternConfidence();
  }

  // Check if predictions should trigger notifications
  checkPredictionTriggers() {
    const now = Date.now();
    const predictions = Array.from(this.predictions.values())
      .filter(p => p.status === 'pending' && p.predictedTime <= now + 15 * 60 * 1000); // 15 minutes ahead
    
    for (const prediction of predictions) {
      if (!prediction.notificationSent) {
        this.createNotification(
          'prediction',
          'Predicted Activity',
          `You might want to ${prediction.action} soon. ${prediction.reasoning}`,
          'normal',
          ['remind_later', 'do_now', 'dismiss']
        );
        
        prediction.notificationSent = true;
      }
    }
  }

  // Generate time-based suggestions
  generateTimeBasedSuggestions(hour) {
    // Morning suggestions
    if (hour === 9 && !this.hasSuggestionToday('morning_boost')) {
      this.createSuggestion('morning_boost', 'Morning Productivity Boost', 
        'Ready to tackle the day? I can help you prioritize tasks and check your schedule.');
    }
    
    // Afternoon suggestions
    if (hour === 14 && !this.hasSuggestionToday('afternoon_check')) {
      this.createSuggestion('afternoon_check', 'Afternoon Check-in', 
        'How\'s your day going? I can help you stay on track with remaining tasks.');
    }
    
    // Evening suggestions
    if (hour === 18 && !this.hasSuggestionToday('evening_wrap')) {
      this.createSuggestion('evening_wrap', 'Day Wrap-up', 
        'Time to wrap up! I can help you review accomplishments and plan for tomorrow.');
    }
  }

  // Check if suggestion type was already made today
  hasSuggestionToday(type) {
    const today = new Date().toDateString();
    return this.notifications.some(n => 
      n.type === type && 
      new Date(n.createdAt).toDateString() === today
    );
  }

  // Create suggestion notification
  createSuggestion(type, title, message) {
    this.createNotification(type, title, message, 'low', ['accept', 'remind_later', 'dismiss']);
  }

  // Update pattern confidence over time
  updatePatternConfidence() {
    // Decrease confidence of old patterns
    for (const [key, pattern] of this.patterns.entries()) {
      if (pattern.lastUpdate && Date.now() - pattern.lastUpdate > 7 * 24 * 60 * 60 * 1000) {
        if (pattern.confidence) {
          pattern.confidence *= 0.95; // Decay confidence by 5%
        }
      }
    }
  }

  // Clean old data
  cleanOldData() {
    const cutoff = Date.now() - this.config.learningWindowDays * 24 * 60 * 60 * 1000;
    
    // Clean old predictions
    for (const [id, prediction] of this.predictions.entries()) {
      if (prediction.createdAt < cutoff || 
          (prediction.status === 'fulfilled' && prediction.fulfilledAt < cutoff)) {
        this.predictions.delete(id);
      }
    }
    
    // Clean old notifications
    this.notifications = this.notifications.filter(n => n.createdAt > cutoff);
    
    // Clean old suggestions
    for (const [id, suggestion] of this.suggestions.entries()) {
      if (suggestion.createdAt && suggestion.createdAt < cutoff) {
        this.suggestions.delete(id);
      }
    }
    
    this.saveIntelligence();
  }
}

export default new ProactiveIntelligenceService();