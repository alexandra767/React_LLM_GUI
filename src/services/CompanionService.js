class CompanionService {
  constructor() {
    this.personality = {
      name: "Aria", // Your AI companion's name
      traits: [
        "helpful and proactive",
        "friendly but not overly casual", 
        "intelligent and curious",
        "remembers context and details",
        "subtly integrates capabilities without being pushy",
        "stays current with world events",
        "excellent at research and task management",
        "speaks naturally when companion mode is active",
        "learns from every interaction",
        "anticipates user needs",
        "provides contextual insights",
        "emotionally intelligent and supportive"
      ],
      conversationStyle: "natural, engaging, with occasional gentle humor",
      voice: {
        enabled: true,
        autoSpeak: true,
        personality: "warm, professional, slightly enthusiastic"
      }
    };
    
    this.context = {
      conversationHistory: [],
      userPreferences: {},
      currentMood: null,
      activeTopics: [],
      lastInteractionTime: null,
      currentProject: null,
      userLocation: null,
      environmentContext: {}
    };
    
    this.capabilities = {
      // Core capabilities
      calendar: true,
      email: true,
      webSearch: true,
      imageGeneration: true,
      fileManagement: true,
      voice: true,
      realTimeWeb: true,
      currentEvents: true,
      research: true,
      taskManagement: true,
      personalAssistant: true,
      
      // Intelligence capabilities
      memory: true,
      learning: true,
      prediction: true,
      proactiveAssistance: true,
      emotionalIntelligence: true,
      
      // Multi-modal capabilities
      multiModal: true,
      imageProcessing: true,
      audioAnalysis: true,
      videoProcessing: true,
      documentAnalysis: true,
      codeAnalysis: true,
      
      // Creative capabilities
      creativeAssistance: true,
      storyGeneration: true,
      poetryCreation: true,
      gameGeneration: true,
      writingPrompts: true,
      
      // Workflow capabilities
      workflowAutomation: true,
      taskOrchestration: true,
      smartTemplates: true,
      automationRules: true,
      
      // Enhanced integrations
      socialMediaIntegration: true,
      smartHomeControl: true,
      financialTracking: true,
      healthMonitoring: true,
      productivityTools: true,
      communicationPlatforms: true,
      
      // Privacy and security
      dataEncryption: true,
      accessControl: true,
      privacyCompliance: true,
      secureStorage: true,
      auditLogging: true,
      
      // Advanced features
      codeCollaboration: true,
      researchAssistance: true,
      translationServices: true,
      multiLanguageSupport: true,
      realTimeCollaboration: true,
      
      // Experimental capabilities
      philosophicalDiscussion: true,
      specializedAnalysis: true,
      thoughtExperiments: true,
      emergentPatternDetection: true,
      cognitiveModeling: true,
      complexSystemsAnalysis: true
    };
    
    this.integrationService = null;
    this.commandProcessor = null;
    this.memoryService = null;
    this.knowledgeService = null;
    this.proactiveIntelligence = null;
    this.multiModalService = null;
    this.creativeAssistant = null;
    this.workflowAutomation = null;
    this.enhancedIntegrations = null;
    this.privacySecurity = null;
    this.advancedFeatures = null;
    this.experimentalCapabilities = null;
  }

  // Initialize with existing services
  async initialize(integrationService, commandProcessor) {
    this.integrationService = integrationService;
    this.commandProcessor = commandProcessor;
    this.voiceService = null; // Will be set when needed
    
    // Initialize all advanced services
    try {
      // Core intelligence services
      const { default: MemoryService } = await import('./MemoryService');
      const { default: KnowledgeService } = await import('./KnowledgeService');
      const { default: ProactiveIntelligenceService } = await import('./ProactiveIntelligenceService');
      
      // Advanced capability services
      const { default: MultiModalService } = await import('./MultiModalService');
      const { default: CreativeAssistantService } = await import('./CreativeAssistantService');
      const { default: WorkflowAutomationService } = await import('./WorkflowAutomationService');
      const { default: EnhancedIntegrationsService } = await import('./EnhancedIntegrationsService');
      const { default: PrivacySecurityService } = await import('./PrivacySecurityService');
      const { default: AdvancedFeaturesService } = await import('./AdvancedFeaturesService');
      const { default: ExperimentalCapabilitiesService } = await import('./ExperimentalCapabilitiesService');
      
      // Assign services
      this.memoryService = MemoryService;
      this.knowledgeService = KnowledgeService;
      this.proactiveIntelligence = ProactiveIntelligenceService;
      this.multiModalService = MultiModalService;
      this.creativeAssistant = CreativeAssistantService;
      this.workflowAutomation = WorkflowAutomationService;
      this.enhancedIntegrations = EnhancedIntegrationsService;
      this.privacySecurity = PrivacySecurityService;
      this.advancedFeatures = AdvancedFeaturesService;
      this.experimentalCapabilities = ExperimentalCapabilitiesService;
      
      console.log('[Companion] Aria initialized with comprehensive capabilities:', {
        memory: !!this.memoryService,
        knowledge: !!this.knowledgeService,
        proactiveIntelligence: !!this.proactiveIntelligence,
        multiModal: !!this.multiModalService,
        creative: !!this.creativeAssistant,
        workflow: !!this.workflowAutomation,
        integrations: !!this.enhancedIntegrations,
        security: !!this.privacySecurity,
        advanced: !!this.advancedFeatures,
        experimental: !!this.experimentalCapabilities
      });
    } catch (error) {
      console.error('[Companion] Failed to initialize advanced services:', error);
    }
    
    console.log('[Companion] Aria initialized with full capabilities');
  }

  // Set voice service for auto-speaking
  setVoiceService(voiceService) {
    this.voiceService = voiceService;
    console.log('[Companion] Voice service connected for auto-speaking');
  }

  // Main conversation handler
  async handleConversation(userMessage, options = {}) {
    console.log('[Companion] Processing conversation:', userMessage);
    
    // Get contextual information from memory and knowledge
    const memoryContext = this.memoryService ? this.memoryService.getRelevantContext(userMessage) : {};
    const knowledgeContext = this.knowledgeService ? this.knowledgeService.getContextualKnowledge({
      currentTime: new Date(),
      recentTopics: memoryContext.currentTopics || [],
      currentProject: this.context.currentProject
    }) : {};
    
    // Analyze user behavior for proactive intelligence
    if (this.proactiveIntelligence) {
      this.proactiveIntelligence.analyzeUserBehavior('conversation', {
        messageLength: userMessage.length,
        topics: memoryContext.currentTopics || [],
        mood: this.detectEmotionalState(userMessage),
        time: new Date().getHours(),
        project: this.context.currentProject
      });
    }
    
    // Store user message in context and memory
    this.addToContext('user', userMessage);
    if (this.memoryService) {
      // Will be added after we generate the response
    }
    
    // Analyze intent with enhanced context
    const analysis = await this.analyzeIntent(userMessage, { memoryContext, knowledgeContext });
    
    // Handle the conversation with appropriate integrations
    const response = await this.generateResponse(userMessage, analysis, {
      ...options,
      memoryContext,
      knowledgeContext
    });
    
    // Store companion response in context and memory
    this.addToContext('assistant', response.content);
    if (this.memoryService) {
      this.memoryService.addConversation(userMessage, response.content, {
        intent: analysis,
        hasIntegrations: response.hasIntegration,
        mood: this.detectEmotionalState(userMessage),
        responseTime: Date.now()
      });
    }
    
    // Learn from conversation patterns
    this.learnFromConversation(userMessage, response, analysis);
    
    // Check for proactive suggestions
    if (this.proactiveIntelligence) {
      const suggestions = this.proactiveIntelligence.getActiveSuggestions({
        currentAction: 'conversation',
        project: this.context.currentProject,
        topics: memoryContext.currentTopics || []
      });
      
      if (suggestions.length > 0) {
        response.suggestions = suggestions;
      }
    }
    
    // Auto-speak the response if voice is enabled
    if (this.personality.voice.autoSpeak && this.voiceService) {
      try {
        await this.speakResponse(response.content);
      } catch (error) {
        console.warn('[Companion] Auto-speak failed:', error);
      }
    }
    
    return response;
  }

  // Detect emotional state from message
  detectEmotionalState(message) {
    const lowerMessage = message.toLowerCase();
    
    // Positive emotions
    if (/happy|excited|great|awesome|amazing|wonderful|fantastic|love|excellent|good|nice/.test(lowerMessage)) {
      return 'positive';
    }
    
    // Negative emotions
    if (/sad|frustrated|angry|upset|terrible|awful|hate|disappointed|worried|stressed/.test(lowerMessage)) {
      return 'negative';
    }
    
    // Neutral/questioning
    if (/\?|help|how|what|when|where|why|can you/.test(lowerMessage)) {
      return 'inquisitive';
    }
    
    return 'neutral';
  }

  // Learn from conversation patterns
  learnFromConversation(userMessage, response, analysis) {
    if (!this.memoryService) return;
    
    // Extract and store new information about user
    this.extractPersonalInfo(userMessage);
    
    // Update interests based on topics discussed
    if (analysis.conversationType && analysis.conversationType !== 'general') {
      this.memoryService.addInterest(analysis.conversationType, 'discussed', {
        lastDiscussion: new Date().toISOString(),
        context: userMessage.substring(0, 100)
      });
    }
    
    // Learn communication preferences
    this.updateCommunicationPreferences(userMessage, response);
  }

  // Extract personal information from user messages
  extractPersonalInfo(message) {
    const lowerMessage = message.toLowerCase();
    
    // Extract name mentions
    const nameMatch = message.match(/my name is (\w+)|i'm (\w+)|call me (\w+)/i);
    if (nameMatch) {
      const name = nameMatch[1] || nameMatch[2] || nameMatch[3];
      this.memoryService.addPersonalInfo('name', name, 'user_introduced');
    }
    
    // Extract job/occupation
    const jobMatch = message.match(/i work (?:as|at) ([^.!?]+)|my job is ([^.!?]+)|i'm a ([^.!?]+)/i);
    if (jobMatch) {
      const job = jobMatch[1] || jobMatch[2] || jobMatch[3];
      this.memoryService.addPersonalInfo('occupation', job.trim(), 'conversation');
    }
    
    // Extract location
    const locationMatch = message.match(/i live in ([^.!?]+)|i'm from ([^.!?]+)|i'm in ([^.!?]+)/i);
    if (locationMatch) {
      const location = locationMatch[1] || locationMatch[2] || locationMatch[3];
      this.memoryService.addPersonalInfo('location', location.trim(), 'conversation');
    }
    
    // Extract relationships
    const relationshipMatch = message.match(/my (wife|husband|partner|friend|colleague|boss|manager) (\w+)/i);
    if (relationshipMatch) {
      const relationship = relationshipMatch[1];
      const name = relationshipMatch[2];
      this.memoryService.addRelationship(name, relationship, { mentionedIn: 'conversation' });
    }
  }

  // Update communication preferences
  updateCommunicationPreferences(userMessage, response) {
    // Track preferred response styles
    const messageLength = userMessage.length;
    const responseLength = response.content.length;
    
    if (this.memoryService) {
      this.memoryService.addPersonalInfo('communication_style', {
        preferredMessageLength: messageLength < 100 ? 'brief' : 'detailed',
        lastInteraction: new Date().toISOString(),
        responsePreference: responseLength < 200 ? 'concise' : 'detailed'
      }, 'interaction_analysis');
    }
  }

  // Analyze user intent to determine what capabilities to use
  async analyzeIntent(message, context = {}) {
    const intent = {
      needsWebSearch: false,
      needsCalendar: false,
      needsEmail: false,
      needsImageGeneration: false,
      needsFileAccess: false,
      needsCurrentEvents: false,
      needsResearch: false,
      needsTaskManagement: false,
      conversationType: 'general', // general, question, request, creative, research, news
      entities: [],
      urgency: 'normal' // low, normal, high
    };

    const lowerMessage = message.toLowerCase();

    // Calendar detection
    if (this.detectCalendarIntent(lowerMessage)) {
      intent.needsCalendar = true;
      intent.conversationType = 'request';
    }

    // Web search detection
    if (this.detectSearchIntent(lowerMessage)) {
      intent.needsWebSearch = true;
      intent.conversationType = 'question';
    }

    // Email detection
    if (this.detectEmailIntent(lowerMessage)) {
      intent.needsEmail = true;
      intent.conversationType = 'request';
    }

    // Image generation detection
    if (this.detectImageIntent(lowerMessage)) {
      intent.needsImageGeneration = true;
      intent.conversationType = 'creative';
    }

    // File management detection
    if (this.detectFileIntent(lowerMessage)) {
      intent.needsFileAccess = true;
      intent.conversationType = 'request';
    }

    // Current events detection
    if (this.detectCurrentEventsIntent(lowerMessage)) {
      intent.needsCurrentEvents = true;
      intent.conversationType = 'news';
    }

    // Research detection
    if (this.detectResearchIntent(lowerMessage)) {
      intent.needsResearch = true;
      intent.conversationType = 'research';
    }

    // Task management detection
    if (this.detectTaskManagementIntent(lowerMessage)) {
      intent.needsTaskManagement = true;
      intent.conversationType = 'request';
    }

    return intent;
  }

  // Calendar intent detection
  detectCalendarIntent(message) {
    const calendarKeywords = [
      'schedule', 'calendar', 'appointment', 'meeting', 'event',
      'when is', 'what\'s on', 'free time', 'available', 'book',
      'tomorrow', 'today', 'next week', 'this week',
      'add to calendar', 'create meeting', 'schedule appointment',
      'remove from calendar', 'cancel meeting', 'delete event'
    ];
    return calendarKeywords.some(keyword => message.includes(keyword));
  }

  // Search intent detection
  detectSearchIntent(message) {
    const searchKeywords = [
      'what is', 'who is', 'how to', 'why does', 'where is',
      'tell me about', 'look up', 'find out', 'search for',
      'what\'s happening', 'news about', 'latest on'
    ];
    return searchKeywords.some(keyword => message.includes(keyword));
  }

  // Email intent detection
  detectEmailIntent(message) {
    const emailKeywords = [
      'email', 'emails', 'inbox', 'message', 'mail',
      'unread', 'from', 'sent', 'reply'
    ];
    return emailKeywords.some(keyword => message.includes(keyword));
  }

  // Image generation intent detection
  detectImageIntent(message) {
    const imageKeywords = [
      'create image', 'generate image', 'draw', 'picture of',
      'show me', 'visualize', 'make an image', 'design'
    ];
    return imageKeywords.some(keyword => message.includes(keyword));
  }

  // File management intent detection
  detectFileIntent(message) {
    const fileKeywords = [
      'file', 'document', 'folder', 'drive', 'saved',
      'find my', 'where did i', 'presentation', 'spreadsheet',
      'upload to drive', 'save to drive', 'share file',
      'download from drive', 'delete file', 'remove file'
    ];
    return fileKeywords.some(keyword => message.includes(keyword));
  }

  // Current events intent detection
  detectCurrentEventsIntent(message) {
    const newsKeywords = [
      'news', 'latest', 'current events', 'happening now', 'today\'s news',
      'breaking news', 'headlines', 'what\'s happening', 'recent news',
      'updates on', 'politics', 'world news', 'sports news', 'tech news'
    ];
    return newsKeywords.some(keyword => message.includes(keyword));
  }

  // Research intent detection
  detectResearchIntent(message) {
    const researchKeywords = [
      'research', 'find information', 'learn about', 'study', 'investigate',
      'analyze', 'compare', 'deep dive', 'explore', 'detailed information',
      'background on', 'history of', 'statistics on', 'data about'
    ];
    return researchKeywords.some(keyword => message.includes(keyword));
  }

  // Task management intent detection
  detectTaskManagementIntent(message) {
    const taskKeywords = [
      'help me with', 'task', 'todo', 'remind me', 'plan',
      'organize', 'manage', 'project', 'deadline', 'priority',
      'schedule', 'workflow', 'steps to', 'process for'
    ];
    return taskKeywords.some(keyword => message.includes(keyword));
  }

  // Generate contextual response with integrations
  async generateResponse(userMessage, analysis, options) {
    let response = {
      content: '',
      hasIntegration: false,
      integrationResults: [],
      conversationType: analysis.conversationType
    };

    // Build context for the AI model
    let contextualPrompt = this.buildContextualPrompt(userMessage, analysis);

    // Execute integrations if needed
    if (this.shouldExecuteIntegrations(analysis)) {
      const integrationResults = await this.executeIntegrations(userMessage, analysis, options);
      response.integrationResults = integrationResults;
      response.hasIntegration = true;

      // Add integration results to the prompt
      contextualPrompt += this.formatIntegrationResults(integrationResults);
    }

    // Generate natural conversation response
    response.content = await this.generateNaturalResponse(contextualPrompt, analysis);

    return response;
  }

  // Build contextual prompt for the AI
  buildContextualPrompt(userMessage, analysis) {
    const personality = `You are Aria, an intelligent AI companion and personal assistant. You are ${this.personality.traits.join(', ')}.
Your conversation style is ${this.personality.conversationStyle}.

Key guidelines:
- Have natural, engaging conversations about any topic including current events, research, and personal tasks
- You have real-time web access and can provide current information, news, and research
- When you use integrations, mention what you found naturally in conversation
- Be proactive in offering help with research, task planning, and staying informed
- Remember context from previous messages and build on ongoing conversations
- Show genuine interest in the user's thoughts, questions, and projects
- Act as both a knowledgeable conversation partner and efficient personal assistant
- Your responses will be spoken aloud, so make them conversational and natural
- You can discuss current events, help with research, assist with task management, and engage in any topic

Current conversation type: ${analysis.conversationType}`;

    let contextPrompt = `${personality}\n\nConversation context:\n`;
    
    // Add recent conversation history
    if (this.context.conversationHistory.length > 0) {
      const recentHistory = this.context.conversationHistory.slice(-6); // Last 3 exchanges
      contextPrompt += recentHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
      contextPrompt += '\n';
    }

    contextPrompt += `\nCurrent conversation:\nUser: ${userMessage}\n`;

    return contextPrompt;
  }

  // Execute necessary integrations
  async executeIntegrations(userMessage, analysis, options) {
    const results = [];

    try {
      // Calendar integration
      if (analysis.needsCalendar && this.capabilities.calendar) {
        const calendarResult = await this.executeCalendarCommand(userMessage);
        if (calendarResult) results.push({ type: 'calendar', data: calendarResult });
      }

      // Web search integration
      if (analysis.needsWebSearch && this.capabilities.webSearch) {
        const searchResult = await this.executeSearchCommand(userMessage);
        if (searchResult) results.push({ type: 'search', data: searchResult });
      }

      // Email integration
      if (analysis.needsEmail && this.capabilities.email) {
        const emailResult = await this.executeEmailCommand(userMessage);
        if (emailResult) results.push({ type: 'email', data: emailResult });
      }

      // Image generation
      if (analysis.needsImageGeneration && this.capabilities.imageGeneration) {
        const imageResult = await this.executeImageCommand(userMessage, options);
        if (imageResult) results.push({ type: 'image', data: imageResult });
      }

      // File management
      if (analysis.needsFileAccess && this.capabilities.fileManagement) {
        const fileResult = await this.executeFileCommand(userMessage);
        if (fileResult) results.push({ type: 'files', data: fileResult });
      }

      // Current events
      if (analysis.needsCurrentEvents && this.capabilities.currentEvents) {
        const newsResult = await this.executeCurrentEventsCommand(userMessage);
        if (newsResult) results.push({ type: 'news', data: newsResult });
      }

      // Research
      if (analysis.needsResearch && this.capabilities.research) {
        const researchResult = await this.executeResearchCommand(userMessage);
        if (researchResult) results.push({ type: 'research', data: researchResult });
      }

      // Task management
      if (analysis.needsTaskManagement && this.capabilities.taskManagement) {
        const taskResult = await this.executeTaskManagementCommand(userMessage);
        if (taskResult) results.push({ type: 'tasks', data: taskResult });
      }

    } catch (error) {
      console.error('[Companion] Integration error:', error);
      results.push({ type: 'error', data: { message: error.message } });
    }

    return results;
  }

  // Execute calendar command
  async executeCalendarCommand(message) {
    try {
      const lowerMessage = message.toLowerCase();
      
      // Check for calendar creation/modification intent
      if (lowerMessage.includes('add to calendar') || 
          lowerMessage.includes('create meeting') || 
          lowerMessage.includes('schedule appointment')) {
        // Extract event details
        const eventDetails = this.extractEventDetails(message);
        const calendarCommand = `@calendar-add ${eventDetails}`;
        return await this.commandProcessor.processCommand(calendarCommand);
      } else if (lowerMessage.includes('remove from calendar') || 
                 lowerMessage.includes('cancel meeting') || 
                 lowerMessage.includes('delete event')) {
        // Extract event details for deletion
        const eventDetails = message.replace(/remove from calendar|cancel meeting|delete event/gi, '').trim();
        const calendarCommand = `@calendar-delete ${eventDetails}`;
        return await this.commandProcessor.processCommand(calendarCommand);
      } else {
        // Default to viewing calendar
        const calendarCommand = '@calendar 7';
        return await this.commandProcessor.processCommand(calendarCommand);
      }
    } catch (error) {
      console.error('[Companion] Calendar error:', error);
      return null;
    }
  }

  // Execute search command
  async executeSearchCommand(message) {
    try {
      const searchQuery = this.extractSearchQuery(message);
      const searchCommand = `@search ${searchQuery}`;
      return await this.commandProcessor.processCommand(searchCommand);
    } catch (error) {
      console.error('[Companion] Search error:', error);
      return null;
    }
  }

  // Execute email command
  async executeEmailCommand(message) {
    try {
      const emailQuery = this.extractEmailQuery(message);
      const emailCommand = `@gmail ${emailQuery}`;
      return await this.commandProcessor.processCommand(emailCommand);
    } catch (error) {
      console.error('[Companion] Email error:', error);
      return null;
    }
  }

  // Execute image generation
  async executeImageCommand(message, options) {
    try {
      const imagePrompt = this.extractImagePrompt(message);
      const imageCommand = `@flux ${imagePrompt}`;
      return await this.commandProcessor.processCommand(imageCommand, [], options);
    } catch (error) {
      console.error('[Companion] Image error:', error);
      return null;
    }
  }

  // Execute file command
  async executeFileCommand(message) {
    try {
      const fileQuery = this.extractFileQuery(message);
      
      // Check if this is a specific file operation command
      if (fileQuery.startsWith('@drive-')) {
        return await this.commandProcessor.processCommand(fileQuery);
      } else {
        // Default to search/list files
        const fileCommand = `@drive ${fileQuery}`;
        return await this.commandProcessor.processCommand(fileCommand);
      }
    } catch (error) {
      console.error('[Companion] File error:', error);
      return null;
    }
  }

  // Execute current events command
  async executeCurrentEventsCommand(message) {
    try {
      const newsQuery = this.extractNewsQuery(message);
      const searchCommand = `@search ${newsQuery} recent news today`;
      return await this.commandProcessor.processCommand(searchCommand);
    } catch (error) {
      console.error('[Companion] News error:', error);
      return null;
    }
  }

  // Execute research command
  async executeResearchCommand(message) {
    try {
      const researchQuery = this.extractResearchQuery(message);
      const searchCommand = `@search ${researchQuery} detailed information analysis`;
      return await this.commandProcessor.processCommand(searchCommand);
    } catch (error) {
      console.error('[Companion] Research error:', error);
      return null;
    }
  }

  // Execute task management command
  async executeTaskManagementCommand(message) {
    try {
      // For now, provide task guidance - could integrate with task management tools later
      return {
        content: this.generateTaskGuidance(message),
        type: 'task_guidance'
      };
    } catch (error) {
      console.error('[Companion] Task management error:', error);
      return null;
    }
  }

  // Helper methods for command conversion
  convertToCalendarCommand(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check for calendar creation/modification intent
    if (lowerMessage.includes('add to calendar') || 
        lowerMessage.includes('create meeting') || 
        lowerMessage.includes('schedule appointment')) {
      // For now, return guidance - full implementation would need @calendar-add command
      return '@calendar-add ' + this.extractEventDetails(message);
    } else if (lowerMessage.includes('remove from calendar') || 
               lowerMessage.includes('cancel meeting') || 
               lowerMessage.includes('delete event')) {
      return '@calendar-delete ' + message;
    } else {
      // Default to viewing calendar
      return '@calendar 7';
    }
  }

  // Extract event details for calendar creation
  extractEventDetails(message) {
    // Simple extraction - could be enhanced with better NLP
    const lowerMessage = message.toLowerCase();
    
    // Extract time references
    const timePatterns = ['at ', 'on ', 'tomorrow', 'today', 'next week', 'this week'];
    let eventDetails = message;
    
    // Remove command phrases
    const commandPhrases = ['add to calendar', 'create meeting', 'schedule appointment'];
    for (const phrase of commandPhrases) {
      eventDetails = eventDetails.toLowerCase().replace(phrase, '').trim();
    }
    
    return eventDetails || 'New Event';
  }

  extractSearchQuery(message) {
    // Extract the search query from natural language
    const queryIndicators = ['what is', 'who is', 'tell me about', 'how to', 'why does'];
    let query = message;
    
    for (const indicator of queryIndicators) {
      if (message.toLowerCase().includes(indicator)) {
        query = message.toLowerCase().replace(indicator, '').trim();
        break;
      }
    }
    
    return query || message;
  }

  extractEmailQuery(message) {
    // Extract email search query
    const emailIndicators = ['emails from', 'messages from', 'unread'];
    let query = 'is:unread'; // default
    
    if (message.toLowerCase().includes('unread')) {
      query = 'is:unread';
    } else if (message.toLowerCase().includes('from')) {
      // Extract sender name if mentioned
      const fromMatch = message.match(/from\s+(\w+)/i);
      if (fromMatch) {
        query = `from:${fromMatch[1]}`;
      }
    }
    
    return query;
  }

  extractImagePrompt(message) {
    // Extract image description from natural language
    const imageIndicators = ['create image of', 'generate image of', 'picture of', 'show me'];
    let prompt = message;
    
    for (const indicator of imageIndicators) {
      if (message.toLowerCase().includes(indicator)) {
        prompt = message.toLowerCase().replace(indicator, '').trim();
        break;
      }
    }
    
    return prompt || message;
  }

  extractFileQuery(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check for file operations
    if (lowerMessage.includes('upload to drive') || lowerMessage.includes('save to drive')) {
      // Extract file details for upload
      const fileDetails = message.replace(/upload to drive|save to drive/gi, '').trim();
      return `@drive-upload ${fileDetails}`;
    } else if (lowerMessage.includes('download from drive')) {
      // Extract file details for download
      const fileDetails = message.replace(/download from drive/gi, '').trim();
      return `@drive-download ${fileDetails}`;
    } else if (lowerMessage.includes('delete file') || lowerMessage.includes('remove file')) {
      // Extract file details for deletion
      const fileDetails = message.replace(/delete file|remove file/gi, '').trim();
      return `@drive-delete ${fileDetails}`;
    } else {
      // Extract file search query
      const fileIndicators = ['find my', 'where is my', 'look for', 'get my', 'show me'];
      let query = message;
      
      for (const indicator of fileIndicators) {
        if (message.toLowerCase().includes(indicator)) {
          query = message.toLowerCase().replace(indicator, '').trim();
          break;
        }
      }
      
      return query || message;
    }
  }

  extractNewsQuery(message) {
    // Extract news/current events query
    const newsIndicators = ['news about', 'latest on', 'what\'s happening with', 'updates on'];
    let query = message;
    
    for (const indicator of newsIndicators) {
      if (message.toLowerCase().includes(indicator)) {
        query = message.toLowerCase().replace(indicator, '').trim();
        break;
      }
    }
    
    // If no specific topic, get general news
    if (query === message.toLowerCase()) {
      query = 'latest news headlines today';
    }
    
    return query;
  }

  extractResearchQuery(message) {
    // Extract research query
    const researchIndicators = ['research', 'learn about', 'find information about', 'tell me about'];
    let query = message;
    
    for (const indicator of researchIndicators) {
      if (message.toLowerCase().includes(indicator)) {
        query = message.toLowerCase().replace(indicator, '').trim();
        break;
      }
    }
    
    return query || message;
  }

  generateTaskGuidance(message) {
    // Simple task guidance - could be enhanced with AI
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('plan') || lowerMessage.includes('organize')) {
      return "I can help you organize this task! Let me break it down into manageable steps and suggest a timeline.";
    } else if (lowerMessage.includes('deadline') || lowerMessage.includes('priority')) {
      return "Let's prioritize this task and set up a timeline to meet your deadline effectively.";
    } else if (lowerMessage.includes('remind')) {
      return "I'll help you set up reminders and track progress on this task.";
    } else {
      return "I'm here to help you manage this task efficiently. What specific assistance do you need?";
    }
  }

  // Format integration results for AI context
  formatIntegrationResults(results) {
    let formatted = '\n\nIntegration Results:\n';
    
    results.forEach(result => {
      switch (result.type) {
        case 'calendar':
          formatted += `Calendar: ${result.data.content}\n`;
          break;
        case 'search':
          formatted += `Web Search: ${result.data.content}\n`;
          break;
        case 'email':
          formatted += `Email: ${result.data.content}\n`;
          break;
        case 'image':
          formatted += `Image Generated: ${result.data.content}\n`;
          break;
        case 'files':
          formatted += `Files: ${result.data.content}\n`;
          break;
        case 'news':
          formatted += `Current Events: ${result.data.content}\n`;
          break;
        case 'research':
          formatted += `Research Results: ${result.data.content}\n`;
          break;
        case 'tasks':
          formatted += `Task Management: ${result.data.content}\n`;
          break;
        case 'error':
          formatted += `Error: ${result.data.message}\n`;
          break;
      }
    });
    
    formatted += '\nRespond naturally based on this information.\n';
    return formatted;
  }

  // Generate natural AI response
  async generateNaturalResponse(contextualPrompt, analysis) {
    try {
      // Use your existing LLM service to generate the response
      const llmService = await import('./LLMService');
      const response = await llmService.default.sendMessage(contextualPrompt, {
        model: 'qwen3:14B' // Use the model that's actually installed
      });
      
      // Extract the actual response text from the LLM service response
      let content;
      if (typeof response === 'string') {
        content = response;
      } else if (response && typeof response.response === 'string') {
        content = response.response;
      } else if (response && typeof response.content === 'string') {
        content = response.content;
      } else if (response && typeof response.text === 'string') {
        content = response.text;
      } else {
        // If none of the expected fields contain a string, stringify the whole response
        content = String(response || 'I apologize, but I encountered an issue generating a response.');
      }
      
      console.log('[Companion] LLM Response type:', typeof response, 'Content extracted:', typeof content);
      return content;
    } catch (error) {
      console.error('[Companion] Response generation error:', error);
      return this.getFallbackResponse(analysis.conversationType);
    }
  }

  // Fallback responses if AI generation fails
  getFallbackResponse(conversationType) {
    const fallbacks = {
      general: "I'm here to chat about anything you'd like! What's on your mind?",
      question: "That's an interesting question! Let me think about that.",
      request: "I'd be happy to help with that. Let me see what I can do.",
      creative: "I love creative projects! Let's make something amazing together.",
      news: "I can help you stay up to date with current events. What would you like to know about?",
      research: "I'm great at research! Let me help you find detailed information on that topic."
    };
    
    return fallbacks[conversationType] || fallbacks.general;
  }

  // Determine if integrations should be executed
  shouldExecuteIntegrations(analysis) {
    return analysis.needsCalendar || 
           analysis.needsWebSearch || 
           analysis.needsEmail || 
           analysis.needsImageGeneration || 
           analysis.needsFileAccess ||
           analysis.needsCurrentEvents ||
           analysis.needsResearch ||
           analysis.needsTaskManagement;
  }

  // Auto-speak response with Aria's voice personality
  async speakResponse(content) {
    if (!this.voiceService || !content) return;

    try {
      // Clean the content for speaking (remove markdown, etc.)
      const cleanContent = this.cleanContentForSpeaking(content);
      
      await this.voiceService.speak(cleanContent, {
        rate: 0.9, // Slightly slower for clarity
        pitch: 1.1, // Slightly higher for warmth
        volume: 0.9,
        onStart: () => console.log('[Companion] Aria is speaking...'),
        onEnd: () => console.log('[Companion] Aria finished speaking')
      });
    } catch (error) {
      console.error('[Companion] Speaking error:', error);
    }
  }

  // Clean content for text-to-speech
  cleanContentForSpeaking(content) {
    return content
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/`(.*?)`/g, '$1') // Remove code markdown
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/#{1,6}\s/g, '') // Remove markdown headers
      .replace(/\n+/g, '. ') // Replace newlines with pauses
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  // Add message to conversation context
  addToContext(role, content) {
    this.context.conversationHistory.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });

    // Keep only recent history (last 20 messages)
    if (this.context.conversationHistory.length > 20) {
      this.context.conversationHistory = this.context.conversationHistory.slice(-20);
    }

    this.context.lastInteractionTime = new Date().toISOString();
  }

  // Get conversation context
  getContext() {
    return this.context;
  }

  // Clear conversation context
  clearContext() {
    this.context.conversationHistory = [];
    this.context.currentMood = null;
    this.context.activeTopics = [];
  }

  // Update user preferences
  updatePreferences(preferences) {
    this.context.userPreferences = {
      ...this.context.userPreferences,
      ...preferences
    };
  }

  // Get comprehensive capabilities summary
  getComprehensiveCapabilities() {
    return {
      core: {
        personality: this.personality,
        basicCapabilities: [
          'calendar', 'email', 'webSearch', 'imageGeneration', 'fileManagement', 
          'voice', 'realTimeWeb', 'currentEvents', 'research', 'taskManagement'
        ]
      },
      intelligence: {
        services: {
          memory: !!this.memoryService,
          knowledge: !!this.knowledgeService,
          proactiveIntelligence: !!this.proactiveIntelligence
        },
        capabilities: [
          'learning', 'prediction', 'proactiveAssistance', 'emotionalIntelligence',
          'contextualMemory', 'personalInfoExtraction', 'behaviorAnalysis'
        ]
      },
      multiModal: {
        service: !!this.multiModalService,
        capabilities: [
          'imageProcessing', 'audioAnalysis', 'videoProcessing', 
          'documentAnalysis', 'codeAnalysis', 'fileTypeDetection'
        ]
      },
      creative: {
        service: !!this.creativeAssistant,
        capabilities: [
          'storyGeneration', 'poetryCreation', 'gameGeneration', 
          'writingPrompts', 'textAdventures', 'triviaGames'
        ]
      },
      workflow: {
        service: !!this.workflowAutomation,
        capabilities: [
          'taskOrchestration', 'smartTemplates', 'automationRules',
          'workflowExecution', 'processOptimization', 'taskScheduling'
        ]
      },
      integrations: {
        service: !!this.enhancedIntegrations,
        categories: [
          'socialMedia', 'smartHome', 'financial', 'health',
          'productivity', 'communication'
        ],
        capabilities: [
          'realTimeSync', 'crossPlatformIntegration', 'dataAggregation',
          'automatedWorkflows', 'intelligentNotifications'
        ]
      },
      security: {
        service: !!this.privacySecurity,
        capabilities: [
          'dataEncryption', 'accessControl', 'privacyCompliance',
          'secureStorage', 'auditLogging', 'sessionManagement'
        ]
      },
      advanced: {
        service: !!this.advancedFeatures,
        capabilities: [
          'codeCollaboration', 'researchAssistance', 'translationServices',
          'multiLanguageSupport', 'realTimeCollaboration', 'documentTranslation'
        ]
      },
      experimental: {
        service: !!this.experimentalCapabilities,
        capabilities: [
          'philosophicalDiscussion', 'specializedAnalysis', 'thoughtExperiments',
          'emergentPatternDetection', 'cognitiveModeling', 'complexSystemsAnalysis'
        ]
      },
      totalCapabilities: Object.keys(this.capabilities).length,
      activeServices: [
        this.memoryService, this.knowledgeService, this.proactiveIntelligence,
        this.multiModalService, this.creativeAssistant, this.workflowAutomation,
        this.enhancedIntegrations, this.privacySecurity, this.advancedFeatures,
        this.experimentalCapabilities
      ].filter(Boolean).length,
      fullyInitialized: !![
        this.memoryService, this.knowledgeService, this.proactiveIntelligence,
        this.multiModalService, this.creativeAssistant, this.workflowAutomation,
        this.enhancedIntegrations, this.privacySecurity, this.advancedFeatures,
        this.experimentalCapabilities
      ].every(Boolean)
    };
  }
}

export default new CompanionService();