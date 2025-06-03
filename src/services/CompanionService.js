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
      weather: true,
      
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
    
    // MEMORY FIX: Load only essential services at startup, defer others until needed
    try {
      // Load only core memory service at startup to reduce memory usage
      const { default: MemoryService } = await import('./MemoryAdapter');
      this.memoryService = MemoryService;
      
      console.log('[Companion] Aria initialized with core capabilities (memory). Other services will load on-demand to conserve memory.');
    } catch (error) {
      console.error('[Companion] Failed to initialize core memory service:', error);
    }
    
    console.log('[Companion] Aria initialized with core capabilities');
    
    // MEMORY FIX: Set up memory cleanup routine
    this.startMemoryCleanupRoutine();
    
    // CRITICAL: Set up unified external SSD memory system
    if (this.memoryService) {
      console.log('[Companion] 🧹 Setting up unified memory system...');
      
      // Migrate from localStorage if needed
      if (this.memoryService.migrateFromLocalStorage) {
        await this.memoryService.migrateFromLocalStorage();
      }
      
      // Ensure Alexandra's name is in memory
      if (this.memoryService.addAlexandraName) {
        await this.memoryService.addAlexandraName();
      }
      
      // Clean any stored identity issues
      if (this.memoryService.cleanStoredIdentity) {
        await this.memoryService.cleanStoredIdentity();
      }
      
      console.log('[Companion] ✅ Unified memory system setup completed');
    }
  }

  // Set voice service for auto-speaking
  setVoiceService(voiceService) {
    this.voiceService = voiceService;
    console.log('[Companion] Voice service connected:', {
      voiceService: !!voiceService,
      hasSpeak: !!(voiceService && voiceService.speak),
      hasSetProvider: !!(voiceService && voiceService.setProvider)
    });
  }

  // Main conversation handler
  async handleConversation(userMessage, options = {}) {
    console.log('[Companion] Processing conversation:', userMessage);
    
    // Ensure memory service is available - use MemoryAdapter
    if (!this.memoryService) {
      console.warn('[Companion] MemoryAdapter not available, trying to load...');
      try {
        // Load and initialize MemoryAdapter
        const { default: MemoryAdapter } = await import('./MemoryAdapter');
        this.memoryService = MemoryAdapter;
        await this.memoryService.ensureInitialized();
        console.log('[Companion] ✅ MemoryAdapter loaded and initialized');
      } catch (error) {
        console.error('[Companion] Failed to load MemoryAdapter:', error);
        return null;
      }
    } else {
      // Always ensure it's initialized before use to prevent race conditions
      await this.memoryService.ensureInitialized();
    }
    
    // Get contextual information from memory and knowledge
    const memoryContext = this.memoryService ? await this.memoryService.getRelevantContext(userMessage) : {};
    console.log('[Companion] 🧠 Memory context loaded:', {
      hasMemoryService: !!this.memoryService,
      memoryContextKeys: Object.keys(memoryContext),
      hasPersonal: !!memoryContext.personal,
      personalKeys: memoryContext.personal ? Object.keys(memoryContext.personal) : [],
      userName: memoryContext.personal?.name?.value,
      conversationCount: memoryContext.conversations ? memoryContext.conversations.length : 0,
      interests: memoryContext.preferences?.topInterests || [],
      relationshipCount: memoryContext.relationships ? Object.keys(memoryContext.relationships).length : 0
    });
    
    // Log detailed memory stats
    if (this.memoryService) {
      const stats = this.memoryService.getMemoryStats();
      console.log('[Companion] 📊 Memory statistics:', stats);
    }
    
    // MEMORY FIX: Only load knowledge service if needed
    let knowledgeContext = {};
    if (this.capabilities.research || this.capabilities.currentEvents) {
      try {
        const knowledgeService = await this.getKnowledgeService();
        knowledgeContext = knowledgeService ? knowledgeService.getContextualKnowledge({
          currentTime: new Date(),
          recentTopics: memoryContext.currentTopics || [],
          currentProject: this.context.currentProject
        }) : {};
      } catch (error) {
        console.warn('[Companion] Could not load knowledge service:', error);
      }
    }
    
    // MEMORY FIX: Only load proactive intelligence if needed
    if (this.capabilities.proactiveAssistance) {
      try {
        const proactiveIntelligence = await this.getProactiveIntelligence();
        if (proactiveIntelligence) {
          proactiveIntelligence.analyzeUserBehavior('conversation', {
            messageLength: userMessage.length,
            topics: memoryContext.currentTopics || [],
            mood: this.detectEmotionalState(userMessage),
            time: new Date().getHours(),
            project: this.context.currentProject
          });
        }
      } catch (error) {
        console.warn('[Companion] Could not load proactive intelligence:', error);
      }
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
    
    // MEMORY FIX: Only check proactive suggestions if service is already loaded
    if (this.proactiveIntelligence) {
      try {
        const suggestions = this.proactiveIntelligence.getActiveSuggestions({
          currentAction: 'conversation',
          project: this.context.currentProject,
          topics: memoryContext.currentTopics || []
        });
        
        if (suggestions.length > 0) {
          response.suggestions = suggestions;
        }
      } catch (error) {
        console.warn('[Companion] Could not get proactive suggestions:', error);
      }
    }
    
    // Handle auto-speak in companion mode (ChatView handles it for non-companion mode)
    console.log('[Companion] Auto-speak check:', {
      personalityAutoSpeak: this.personality.voice.autoSpeak,
      hasVoiceService: !!this.voiceService,
      responseContent: response.content?.substring(0, 50) + '...',
      skipVoice: response.skipVoice
    });
    
    // Skip voice for integration commands that might have delays
    if (response.skipVoice) {
      console.log('[Companion] 🔇 Skipping voice synthesis for integration command');
      return response;
    }
    
    if (this.personality.voice.autoSpeak && this.voiceService) {
      try {
        const savedSettings = localStorage.getItem('sephia_voice_settings');
        console.log('[Companion] Voice settings found:', !!savedSettings);
        
        if (savedSettings) {
          const voiceSettings = JSON.parse(savedSettings);
          console.log('[Companion] Voice settings:', {
            autoSpeak: voiceSettings.autoSpeak,
            voiceEnabled: voiceSettings.voiceEnabled,
            provider: voiceSettings.voiceSynthesisProvider
          });
          
          if (voiceSettings.autoSpeak && voiceSettings.voiceEnabled) {
            console.log('[Companion] 🎤 Voice synthesis enabled - will speak after complete response');
            // CHANGED: Don't start voice immediately - flag for post-completion voice
            response.shouldSpeakAfterComplete = true;
            response.voiceSettings = voiceSettings;
            console.log('[Companion] 🎤 Flagged response for post-completion voice synthesis');
          } else {
            console.log('[Companion] Auto-speak disabled in settings');
          }
        } else {
          console.log('[Companion] No voice settings found');
        }
      } catch (error) {
        console.error('[Companion] Auto-speak error:', error);
      }
    } else {
      console.log('[Companion] Auto-speak not triggered:', {
        personalityAutoSpeak: this.personality.voice.autoSpeak,
        hasVoiceService: !!this.voiceService
      });
    }
    
    // Add typing animation flag for companion responses
    response.useTypingAnimation = true;
    
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
    
    // Extract name mentions - improved patterns
    const nameMatch = message.match(/my name is (\w+)|i'm (\w+)|call me (\w+)|i am (\w+)|this is (\w+)|it's (\w+)/i);
    if (nameMatch) {
      const name = nameMatch[1] || nameMatch[2] || nameMatch[3] || nameMatch[4] || nameMatch[5] || nameMatch[6];
      // Only store if it's a reasonable name (not common words)
      const commonWords = ['good', 'fine', 'okay', 'well', 'sure', 'yes', 'no', 'great', 'hello', 'hi', 'thanks'];
      if (name && !commonWords.includes(name.toLowerCase()) && name.length > 1) {
        console.log(`[Companion] Extracted user name: ${name}`);
        this.memoryService.addPersonalInfo('name', name, 'user_introduced');
      }
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
      needsWeather: false,
      conversationType: 'general', // general, question, request, creative, research, news, weather
      entities: [],
      urgency: 'normal' // low, normal, high
    };

    const lowerMessage = message.toLowerCase();

    // Calendar detection - EXCEPT for name/identity questions
    const isNameQuestion = lowerMessage.includes('my name') || lowerMessage.includes('what is my name') || 
                          lowerMessage.includes('what\'s my name') || lowerMessage.includes('who am i') ||
                          lowerMessage.includes('do you know my name') || lowerMessage.includes('do you remember me');
    
    if (this.detectCalendarIntent(lowerMessage) && !isNameQuestion) {
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

    // Weather detection
    if (this.detectWeatherIntent(lowerMessage)) {
      intent.needsWeather = true;
      intent.conversationType = 'weather';
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
    const lowerMessage = message.toLowerCase();
    
    // CRITICAL: Don't treat personal name questions or identity questions as web searches
    if (lowerMessage.includes('my name') || lowerMessage.includes('what is my name') || 
        lowerMessage.includes('what\'s my name') || lowerMessage.includes('whats my name') ||
        lowerMessage.includes('who am i') || lowerMessage.includes('do you know my name') ||
        lowerMessage.includes('tell me about yourself') || 
        lowerMessage.includes('about yourself') ||
        lowerMessage.includes('who are you') ||
        lowerMessage.includes('what are you') ||
        lowerMessage.includes('introduce yourself')) {
      return false; // Let this be handled as a general conversation with memory
    }
    
    const searchKeywords = [
      'what is', 'who is', 'how to', 'why does', 'where is',
      'tell me about', 'look up', 'find out', 'search for',
      'what\'s happening', 'news about', 'latest on'
    ];
    return searchKeywords.some(keyword => message.includes(keyword));
  }

  // Email intent detection
  detectEmailIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    // CRITICAL: Don't treat identity/personal questions as email requests
    if (lowerMessage.includes('tell me about yourself') || 
        lowerMessage.includes('about yourself') ||
        lowerMessage.includes('who are you') ||
        lowerMessage.includes('what are you') ||
        lowerMessage.includes('introduce yourself') ||
        lowerMessage.includes('your background')) {
      return false; // These are identity questions, not email requests
    }
    
    const emailKeywords = [
      'email', 'emails', 'inbox', 'message', 'mail',
      'unread', 'from', 'sent', 'reply',
      // Email sending patterns
      'send email', 'email to', 'send message to', 
      'compose email', 'write email', 'draft email',
      'send a message', 'message to', 'email about'
    ];
    return emailKeywords.some(keyword => lowerMessage.includes(keyword));
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

  // Weather intent detection
  detectWeatherIntent(message) {
    const weatherKeywords = [
      'weather', 'temperature', 'forecast', 'rain', 'snow', 'sunny', 'cloudy',
      'today\'s weather', 'weather today', 'how hot', 'how cold', 'weather like',
      'will it rain', 'is it raining', 'going to rain', 'weather forecast',
      'temperature today', 'degrees', 'celsius', 'fahrenheit', 'weather for',
      'weather in', 'my location', 'current weather', 'local weather',
      'gt the weather', 'get the weather'  // Handle common typos
    ];
    const hasWeatherIntent = weatherKeywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()));
    console.log('[Companion] 🌤️ detectWeatherIntent for message:', message, '-> Result:', hasWeatherIntent);
    return hasWeatherIntent;
  }

  // Generate contextual response with integrations
  async generateResponse(userMessage, analysis, options) {
    let response = {
      content: '',
      hasIntegration: false,
      integrationResults: [],
      conversationType: analysis.conversationType
    };

    // Check if this is a conversation memory question that needs full context
    const lowerMessage = userMessage.toLowerCase();
    const isConversationMemoryQuestion = lowerMessage.includes("do you remember our") ||
                                       lowerMessage.includes("remember our last") ||
                                       lowerMessage.includes("remember our previous") ||
                                       lowerMessage.includes("our last conversation") ||
                                       lowerMessage.includes("our previous conversation") ||
                                       lowerMessage.includes("remember what we talked about") ||
                                       lowerMessage.includes("remember what we discussed") ||
                                       lowerMessage.includes("do you remember me") ||
                                       lowerMessage.includes("remember me") ||
                                       lowerMessage.includes("do you know me") ||
                                       lowerMessage.includes("what is my name") ||
                                       lowerMessage.includes("what's my name") ||
                                       lowerMessage.includes("my name is") ||
                                       lowerMessage.includes("who am i") ||
                                       lowerMessage.includes("do you know my name") ||
                                       lowerMessage.includes("tell me about what you know about me") ||
                                       lowerMessage.includes("what do you know about me") ||
                                       lowerMessage.includes("what is my friend") ||
                                       lowerMessage.includes("what's my friend") ||
                                       lowerMessage.includes("who is my friend") ||
                                       lowerMessage.includes("friend's name") ||
                                       lowerMessage.includes("friends name") ||
                                       lowerMessage.includes("my family") ||
                                       lowerMessage.includes("my brother") ||
                                       lowerMessage.includes("my sister");

    // Use full contextual prompt for memory questions, simplified for others
    let contextualPrompt;
    const hasPersonalData = options.memoryContext?.personal && Object.keys(options.memoryContext.personal).length > 0;
    const hasConversations = options.memoryContext?.conversations?.length > 0;
    
    if (isConversationMemoryQuestion && (hasPersonalData || hasConversations)) {
      console.log('[Companion] Using full contextual prompt for memory question (personal data or conversations available)');
      contextualPrompt = this.buildContextualPrompt(userMessage, analysis, options.memoryContext);
    } else {
      console.log('[Companion] Using simplified prompt for general question');
      contextualPrompt = this.buildSimpleContextualPrompt(userMessage, analysis, options.memoryContext);
    }

    // Execute integrations if needed
    if (this.shouldExecuteIntegrations(analysis)) {
      const integrationResults = await this.executeIntegrations(userMessage, analysis, options);
      response.integrationResults = integrationResults;
      response.hasIntegration = true;

      // Add integration results to the prompt
      contextualPrompt += this.formatIntegrationResults(integrationResults);
    }

    // Generate natural conversation response
    let rawContent = await this.generateNaturalResponse(contextualPrompt, analysis);
    
    // CRITICAL: Clean response content IMMEDIATELY to prevent wrong identity from reaching voice
    let cleanedContent = this.cleanResponseContent(rawContent);
    
    // ULTRA-AGGRESSIVE: Apply identity cleaning AGAIN to ensure no Monica/wrong identity
    cleanedContent = this.forceAriaIdentity(cleanedContent);
    
    response.content = cleanedContent;

    return response;
  }

  // Clean response content for display (preserve thinking blocks for UI)
  cleanResponseContent(content) {
    if (!content || typeof content !== 'string') return content;
    
    // IMPORTANT: Preserve <think></think> tags for the UI dropdown
    // The Message component expects these to show the thinking process dropdown
    return content
      // Only remove trailing newlines and normalize whitespace - KEEP thinking blocks
      .replace(/\n\n$/g, '') // Remove trailing newlines
      .trim();
  }

  // Build simplified contextual prompt that focuses on the actual question
  buildSimpleContextualPrompt(userMessage, analysis, memoryContext = {}) {
    console.log('[Companion] Building simplified prompt for:', userMessage.substring(0, 100));
    // Extract user's name from memory - be more thorough in checking
    let userName = null;
    let hasUserName = false;
    
    if (memoryContext.personal) {
      // Check multiple possible name keys
      userName = memoryContext.personal.name?.value || 
                 memoryContext.personal.user_name?.value ||
                 memoryContext.personal['name']?.value ||
                 memoryContext.personal['user_name']?.value;
      
      // CRITICAL: Reject corrupted "meeting" name
      if (userName === 'meeting') {
        console.warn('[Companion] 🚨 Detected corrupted name "meeting", forcing to Alexandra');
        userName = 'Alexandra';
        hasUserName = true;
      } else {
        hasUserName = !!userName;
      }
    }
    
    // Fallback to Alexandra if no name found in memory
    if (!hasUserName) {
      userName = 'Alexandra';
    }
    
    console.log('[Companion] Memory context debug:', {
      hasPersonal: !!memoryContext.personal,
      personalKeys: memoryContext.personal ? Object.keys(memoryContext.personal) : [],
      nameValue: memoryContext.personal?.name?.value,
      userNameValue: memoryContext.personal?.user_name?.value,
      extractedUserName: userName,
      hasUserName: hasUserName,
      fullPersonal: memoryContext.personal
    });
    
    // Keep only essential personal context
    let essentialContext = '';
    if (hasUserName) {
      essentialContext = `\nUser's name: ${userName}`;
    }
    
    // Add essential relationship information - with corruption filtering
    if (memoryContext.relationships && Object.keys(memoryContext.relationships).length > 0) {
      essentialContext += '\nKnown people:';
      Object.entries(memoryContext.relationships).forEach(([name, relationship]) => {
        // SAFETY CHECK: Block corrupted names like "Birthday"
        const blockedNames = ['Birthday', 'Family', 'Friend', 'Person', 'People', 'Someone', 'Anyone', 'And', 'The', 'But', 'Who', 'What'];
        if (blockedNames.includes(name)) {
          console.log('[Companion] ❌ Blocked corrupted relationship name from context:', name);
          return; // Skip this entry
        }
        
        const relType = typeof relationship === 'object' ? relationship.type : relationship;
        essentialContext += ` ${name} (${relType})`;
      });
    }
    
    // EMERGENCY NAME FIX: For name questions, force Alexandra context even if memory fails
    const isNameQuestion = userMessage.toLowerCase().includes('what is my name') || 
                          userMessage.toLowerCase().includes("what's my name") ||
                          userMessage.toLowerCase().includes('who am i') ||
                          userMessage.toLowerCase().includes('do you know my name');
    
    let finalPersonality;
    if (isNameQuestion && !hasUserName) {
      // FORCE Alexandra context for name questions
      finalPersonality = `You are Aria, a helpful AI assistant. You are talking to Alexandra.${essentialContext}

IMPORTANT: Respond directly without excessive thinking. Be creative and natural.`;
      console.log('[Companion] 🚨 EMERGENCY NAME FIX: Forcing Alexandra context for name question');
    } else {
      // Normal personality context
      finalPersonality = `You are Aria, a helpful AI assistant.${hasUserName ? ` You are talking to ${userName}.` : ''}${essentialContext}

IMPORTANT: Respond directly without excessive thinking. Be creative and natural.`;
    }

    let contextPrompt = `${finalPersonality}\n\nUser: ${userMessage}\n\nAria:`;
    
    console.log('[Companion] 📝 Simplified prompt length:', contextPrompt.length);
    console.log('[Companion] 📝 Focus: Direct answer to:', userMessage);
    
    // Debug: Log the actual prompt being sent to the model
    console.log('[Companion] 📝 Full prompt being sent to model:', contextPrompt.substring(0, 1000) + (contextPrompt.length > 1000 ? '...[truncated]' : ''));
    
    return contextPrompt;
  }

  // Build contextual prompt for the AI
  buildContextualPrompt(userMessage, analysis, memoryContext = {}) {
    console.log('[Companion] Building prompt with memory context:', {
      hasPersonal: !!memoryContext.personal,
      hasRelationships: !!memoryContext.relationships,
      hasConversations: !!memoryContext.conversations,
      personalKeys: memoryContext.personal ? Object.keys(memoryContext.personal) : [],
      userName: memoryContext.personal?.name?.value
    });
    
    // Extract user's name from memory if available - with fallback to Alexandra
    let userName = memoryContext.personal?.name?.value || 
                   memoryContext.personal?.user_name?.value ||
                   'Alexandra'; // Default to Alexandra since that's the user's name
    const hasUserName = memoryContext.personal?.name?.value || memoryContext.personal?.user_name?.value;
    
    // EMERGENCY NAME FIX: For name questions, always ensure Alexandra is set
    const isNameQuestion = userMessage.toLowerCase().includes('what is my name') || 
                          userMessage.toLowerCase().includes("what's my name") ||
                          userMessage.toLowerCase().includes('who am i') ||
                          userMessage.toLowerCase().includes('do you know my name');
    
    if (isNameQuestion && !hasUserName) {
      userName = 'Alexandra';
      console.log('[Companion] 🚨 EMERGENCY NAME FIX: Setting userName to Alexandra for name question in full context');
    }
    
    // Build personal context
    let personalInfo = '';
    if (memoryContext.personal && Object.keys(memoryContext.personal).length > 0) {
      const personalDetails = [];
      for (const [key, info] of Object.entries(memoryContext.personal)) {
        if (key === 'name' && info.value) {
          personalDetails.push(`Their name is ${info.value}`);
        } else if (key === 'occupation' && info.value) {
          personalDetails.push(`They work as ${info.value}`);
        } else if (key === 'location' && info.value) {
          personalDetails.push(`They live in ${info.value}`);
        }
      }
      if (personalDetails.length > 0) {
        personalInfo = `\nWhat you know about the user:\n${personalDetails.join('. ')}.`;
      }
    }
    
    // Build relationship context - with corruption filtering
    let relationshipInfo = '';
    if (memoryContext.relationships && Object.keys(memoryContext.relationships).length > 0) {
      const relationships = Object.values(memoryContext.relationships).slice(0, 3); // Top 3 relationships
      if (relationships.length > 0) {
        const relationshipDetails = relationships
          .filter(rel => {
            // SAFETY CHECK: Block corrupted names like "Birthday"
            const blockedNames = ['Birthday', 'Family', 'Friend', 'Person', 'People', 'Someone', 'Anyone', 'And', 'The', 'But', 'Who', 'What'];
            if (blockedNames.includes(rel.name)) {
              console.log('[Companion] ❌ Blocked corrupted relationship from detailed context:', rel.name);
              return false;
            }
            return true;
          })
          .map(rel => `${rel.name} (${rel.relationship})`);
        if (relationshipDetails.length > 0) {
          relationshipInfo = `\nPeople they've mentioned: ${relationshipDetails.join(', ')}.`;
        }
      }
    }
    
    // Build conversation context from memory
    let conversationContext = '';
    if (memoryContext.conversations && memoryContext.conversations.length > 0) {
      const recentConversations = memoryContext.conversations.slice(-3); // Last 3 conversations
      const conversationSummary = recentConversations.map(conv => 
        `Previous: ${conv.userMessage.substring(0, 100)}... → Response topics: ${conv.topics ? conv.topics.join(', ') : 'general conversation'}`
      ).join('\n');
      conversationContext = `\nRecent conversation topics:\n${conversationSummary}`;
    }
    
    // Build interests context
    let interestsInfo = '';
    if (memoryContext.preferences?.topInterests && memoryContext.preferences.topInterests.length > 0) {
      interestsInfo = `\nTheir main interests: ${memoryContext.preferences.topInterests.join(', ')}.`;
    }

    const personality = `You are Aria, an intelligent AI companion and personal assistant. You are ${this.personality.traits.join(', ')}.
Your conversation style is ${this.personality.conversationStyle}.

Key guidelines:
- Have natural, engaging conversations about any topic including current events, research, and personal tasks
- You have real-time web access and can provide current information, news, and research
- When you use integrations, mention what you found naturally in conversation
- Be proactive in offering help with research, task planning, and staying informed
IMPORTANT CONTEXT UNDERSTANDING:
- You (Claude) do not remember past conversations between sessions
- The conversation history and memory context below is from Aria's external memory system
- DO use personal information (name, preferences, relationships) naturally to maintain continuity
- DO greet the user by name and act familiar when appropriate
- DO NOT reference specific past conversations about news/weather/time-sensitive topics
- DO NOT say "as we discussed yesterday" about breaking news or weather
- Maintain warm, personal interactions while avoiding false memory claims about events

- Show genuine interest in the user's thoughts, questions, and projects
- Act as both a knowledgeable conversation partner and efficient personal assistant
- Your responses will be spoken aloud, so make them conversational and natural
- You can discuss current events, help with research, assist with task management, and engage in any topic
- ${hasUserName ? `Use their name (${userName}) naturally in conversation when appropriate` : 'Ask for their name if you don\'t know it yet'}
- Use personal information and interests from the context to be helpful, but don't claim to remember
- Use <think></think> tags to show your reasoning process when helpful - these will appear in a collapsible section in the UI
- CRITICAL: Use the memory context below to make your responses personal and contextual - avoid generic responses

Context guidance:
${memoryContext.conversations && memoryContext.conversations.length > 0 ? 
  '- Stored conversation history is available for context (but you don\'t remember these directly)' : 
  '- This appears to be an early interaction - focus on getting to know them'}
${personalInfo ? '- Personal information is available in context - use it to be helpful' : '- Learn more about them personally'}
${interestsInfo ? '- Their interests are noted in context - reference when relevant' : '- Discover their interests and remember them'}

Current conversation type: ${analysis.conversationType}${personalInfo}${relationshipInfo}${interestsInfo}${conversationContext}`;

    let contextPrompt = `${personality}\n\n`;
    
    // Add stored conversation history from Aria's memory (if any)
    if (memoryContext.conversations && memoryContext.conversations.length > 0) {
      contextPrompt += `STORED CONVERSATION HISTORY (from Aria's memory system - use for context only):\n`;
      const relevantConversations = memoryContext.conversations.slice(-3); // Last 3 stored conversations
      relevantConversations.forEach(conv => {
        contextPrompt += `Previous: ${conv.userMessage}\n`;
        contextPrompt += `Response: ${conv.assistantMessage}\n\n`;
      });
    }
    
    // Add immediate session context (current conversation)
    if (this.context.conversationHistory.length > 0) {
      contextPrompt += `CURRENT SESSION HISTORY:\n`;
      const recentHistory = this.context.conversationHistory.slice(-4); // Last 2 exchanges
      contextPrompt += recentHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
      contextPrompt += '\n\n';
    }

    contextPrompt += `CURRENT USER QUESTION: ${userMessage}\n\n`;
    
    // Add emphasis on answering the user's actual question
    contextPrompt += `IMPORTANT: Focus on answering the user's current question directly and thoroughly. Use the stored context to be helpful and personal, but do not reference past conversations unless the current question specifically asks about them. Each interaction should feel natural and responsive to what they're asking right now.\n\nAria:`;
    
    // Debug logging
    console.log('[Companion] 📝 Final contextual prompt length:', contextPrompt.length);
    console.log('[Companion] 📝 User question:', userMessage);
    console.log('[Companion] 📝 Conversation history length:', this.context.conversationHistory.length);

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

      // Weather
      if (analysis.needsWeather && this.capabilities.webSearch) {
        const weatherResult = await this.executeWeatherCommand(userMessage);
        if (weatherResult) results.push({ type: 'weather', data: weatherResult });
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
      } else if (lowerMessage.includes('move') && lowerMessage.includes('to') ||
                 lowerMessage.includes('change') && lowerMessage.includes('time') ||
                 lowerMessage.includes('reschedule') ||
                 lowerMessage.includes('rename') && lowerMessage.includes('to')) {
        // Extract event details for update/move
        const calendarCommand = `@calendar-update ${message}`;
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

  // Execute email command
  async executeEmailCommand(message) {
    try {
      console.log('[Companion] Executing email command:', message);
      
      const lowerMessage = message.toLowerCase();
      
      // Check if this is an email reading request vs sending request
      const isReadingRequest = lowerMessage.includes('check') || 
                              lowerMessage.includes('show') || 
                              lowerMessage.includes('unread') || 
                              lowerMessage.includes('inbox') || 
                              lowerMessage.includes('recent') ||
                              (lowerMessage.includes('email') && !lowerMessage.includes('@'));
      
      const isSendingRequest = lowerMessage.includes('@') || 
                              lowerMessage.includes('send') || 
                              lowerMessage.includes('compose') || 
                              lowerMessage.includes('write') ||
                              lowerMessage.includes('to ');
      
      // Check if this is a request for email details
      const emailDetailMatch = lowerMessage.match(/(?:tell me more about|show me|details of|summarize) email (\d+)/);
      const summarizeMatch = lowerMessage.match(/summarize email (\d+)/);
      
      if (emailDetailMatch || summarizeMatch) {
        const emailNumber = parseInt(emailDetailMatch?.[1] || summarizeMatch?.[1]);
        const action = summarizeMatch ? 'summarize' : 'show';
        
        console.log('[Companion] Getting email details for email', emailNumber, action);
        return await this.integrationService.getEmailDetails(emailNumber, action);
      }
      
      if (isReadingRequest && !isSendingRequest) {
        // Call Gmail reading function directly
        console.log('[Companion] Reading emails...');
        const searchQuery = 'is:unread'; // Default to unread emails
        const messages = await this.integrationService.searchGmail(searchQuery);
        const formattedMessages = this.integrationService.formatGmailMessages(messages);
        
        return {
          content: formattedMessages
        };
      } else {
        // Call Gmail sending function directly
        console.log('[Companion] Sending email...');
        return await this.integrationService.sendGmailEmail(message);
      }
    } catch (error) {
      console.error('[Companion] Email error:', error);
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
      
      // Use enhanced @news command for better breaking news results
      const newsCommand = `@news ${newsQuery}`;
      return await this.commandProcessor.processCommand(newsCommand);
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

  // Execute weather command
  async executeWeatherCommand(message) {
    try {
      console.log('[Companion] 🌤️ executeWeatherCommand called with message:', message);
      
      // Import WeatherService for direct weather data access
      const { default: WeatherService } = await import('./WeatherService');
      const weatherService = new WeatherService();
      
      let weatherQuery = this.extractWeatherQuery(message);
      console.log('[Companion] 🌤️ extractWeatherQuery returned:', weatherQuery);
      
      // If no specific location mentioned, try to get user's location from memory
      if (!weatherQuery || weatherQuery.trim() === '') {
        console.log('[Companion] No specific location in weather query, checking memory for saved location');
        
        // Try to get user's saved location from memory
        if (this.memoryService) {
          const memoryContext = await this.memoryService.getRelevantContext(message);
          if (memoryContext.personal?.location?.value) {
            weatherQuery = memoryContext.personal.location.value;
            console.log('[Companion] Using saved location from memory:', weatherQuery);
          }
        }
        
        // If still no location, ask user for location
        if (!weatherQuery || weatherQuery.trim() === '') {
          return {
            content: "I'd be happy to get the weather for you! To provide accurate weather information, I need to know your location. Could you tell me what city or area you're in? For example, you could say 'What's the weather like in New York?' or just 'weather in Chicago'.",
            requiresLocation: true
          };
        }
      }
      
      console.log('[Companion] Getting live weather data for:', weatherQuery);
      
      try {
        // Get real weather data using WeatherService
        const weatherData = await weatherService.getWeather(weatherQuery);
        
        if (weatherData) {
          const formattedWeather = weatherService.formatWeatherResponse(weatherData);
          console.log('[Companion] ✅ Weather data retrieved successfully');
          
          // Save the location to memory for future use
          if (this.memoryService && weatherData.location) {
            try {
              await this.memoryService.addPersonalInfo('location', weatherData.location, 'weather_query');
              console.log('[Companion] Saved weather location to memory:', weatherData.location);
            } catch (memoryError) {
              console.warn('[Companion] Failed to save location to memory:', memoryError);
            }
          }
          
          return {
            content: formattedWeather,
            hasIntegration: true
          };
        } else {
          throw new Error('No weather data available from WeatherService');
        }
        
      } catch (weatherServiceError) {
        console.error('[Companion] WeatherService failed, trying command processor fallback:', weatherServiceError);
        
        // Fallback to command processor if WeatherService fails
        const weatherCommand = `@weather ${weatherQuery}`;
        const commandResult = await this.commandProcessor.processCommand(weatherCommand);
        
        if (commandResult && commandResult.content) {
          return {
            content: commandResult.content,
            hasIntegration: true
          };
        } else {
          throw new Error('Both WeatherService and command processor failed');
        }
      }
      
    } catch (error) {
      console.error('[Companion] All weather methods failed:', error);
      
      // Extract location from the original message for error response
      const locationForError = this.extractWeatherQuery(message) || 'your location';
      
      return {
        content: `I'm sorry, I'm having trouble getting weather information right now. You can try:\n\n• Asking again in a moment\n• Checking weather.com directly\n• Using Google search for "${locationForError} weather"\n\nError: ${error.message}`,
        error: error.message
      };
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
    const lowerMessage = message.toLowerCase();
    const newsIndicators = ['news about', 'latest on', 'what\'s happening with', 'updates on', 'breaking news'];
    let query = message;
    
    for (const indicator of newsIndicators) {
      if (lowerMessage.includes(indicator)) {
        query = lowerMessage.replace(indicator, '').trim();
        break;
      }
    }
    
    // Handle specific breaking news patterns
    if (lowerMessage.includes('breaking news today')) {
      query = 'breaking news today';
    } else if (lowerMessage.includes('breaking news')) {
      query = 'breaking news';
    } else if (lowerMessage.includes('today') && lowerMessage.includes('news')) {
      query = 'news today';
    } else if (query === message.toLowerCase()) {
      // If no specific topic, get general breaking news
      query = 'breaking news today';
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

  extractWeatherQuery(message) {
    // Extract weather location query
    const lowerMessage = message.toLowerCase();
    let query = '';
    
    console.log('[Companion] 🔍 Starting extractWeatherQuery with message:', message);
    
    // FIRST: Check if "my location" is followed by a specific address
    const myLocationWithAddress = message.match(/my location\s+(.+)/i);
    console.log('[Companion] 🔍 Testing "my location" pattern. Match:', !!myLocationWithAddress, myLocationWithAddress?.[1] || 'none');
    if (myLocationWithAddress && myLocationWithAddress[1]?.trim()) {
      const address = myLocationWithAddress[1].trim();
      console.log('[Companion] ✅ Found specific address after "my location":', address);
      return address;
    }
    
    // THEN: Handle generic "my location" or "here" requests (no specific address)
    if (lowerMessage.includes('my location') || lowerMessage.includes(' here') || 
        lowerMessage.includes('where i am') || lowerMessage.includes('current location')) {
      return ''; // Will trigger location detection
    }
    
    // Extract location from various weather patterns
    const weatherPatterns = [
      /(?:get|gt)\s+(?:the\s+)?weather (?:for|in) (.+)/i,  // Handle "get/gt the weather for [location]"
      /weather (?:for|in) (.+)/i,
      /temperature (?:for|in) (.+)/i,
      /forecast (?:for|in) (.+)/i,
      /(?:current|today's) weather (?:for|in) (.+)/i,
      /how(?:'s| is) the weather (?:for|in) (.+)/i,
      /what(?:'s| is) the weather (?:like )?(?:for|in) (.+)/i
    ];
    
    console.log('[Companion] 🔍 Testing weather patterns against message:', message);
    
    // Quick test for the specific case
    const testPattern = /(?:get|gt)\s+(?:the\s+)?weather (?:for|in) (.+)/i;
    const testMatch = message.match(testPattern);
    console.log('[Companion] 🔍 Quick test of main pattern against message:', !!testMatch, testMatch?.[1] || 'none');
    
    for (const pattern of weatherPatterns) {
      const match = message.match(pattern);
      console.log('[Companion] Testing pattern:', pattern, 'against message. Match:', !!match, match?.[1] || 'none');
      if (match && match[1]) {
        query = match[1].trim();
        console.log('[Companion] ✅ Extracted weather location:', query);
        return query;
      }
    }
    
    // If no specific pattern matches, look for weather keywords and extract remaining text
    const weatherKeywords = ['weather', 'temperature', 'forecast'];
    for (const keyword of weatherKeywords) {
      if (lowerMessage.includes(keyword)) {
        // Remove common weather words and prepositions to extract location
        query = message.toLowerCase()
          .replace(/get|the|weather|temperature|forecast|current|today'?s?|for|in|at/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (query && query.length > 2) {
          console.log('[Companion] Extracted weather location (fallback):', query);
          return query;
        }
      }
    }
    
    return query;
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
        case 'weather':
          formatted += `Weather: ${result.data.content}\n`;
          break;
        case 'error':
          formatted += `Error: ${result.data.message}\n`;
          break;
      }
    });
    
    formatted += '\nRespond naturally based on this information.\n';
    return formatted;
  }

  // Generate natural AI response using streaming to preserve thinking process
  async generateNaturalResponse(contextualPrompt, analysis, options = {}) {
    try {
      // Import streaming service instead of LLM service
      const simpleStreamingService = await import('./SimpleStreamingService');
      
      // ULTRA-STRONG identity override - completely replace prompts that might confuse the model
      let ariaPrompt;
      // Only trigger identity protection for ACTUAL identity questions, not introductions
      const isActualIdentityQuestion = (
        contextualPrompt.toLowerCase().includes('tell me about yourself') || 
        (contextualPrompt.toLowerCase().includes('who are you') && !contextualPrompt.toLowerCase().includes('i am')) ||
        (contextualPrompt.toLowerCase().includes('what is your name') && !contextualPrompt.toLowerCase().includes('my name')) ||
        contextualPrompt.toLowerCase().includes('introduce yourself')
      ) && !contextualPrompt.toLowerCase().includes('i am') && !contextualPrompt.toLowerCase().includes('my name');
      
      if (isActualIdentityQuestion) {
        // Handle identity questions with detailed AI-generated responses
        let memoryContext = options.memoryContext || {};
        let userName = memoryContext.personal?.name?.value || memoryContext.personal?.user_name?.value;
        
        ariaPrompt = `You are Aria, an intelligent AI assistant and companion. You have extensive capabilities and a warm, helpful personality.

The user asked you to introduce yourself or tell them about yourself. Give them a comprehensive, engaging introduction that covers:

1. Your identity: You're Aria, their AI assistant and companion
2. Your personality: Helpful, knowledgeable, friendly, and always learning
3. Your capabilities: You can help with research, conversations, questions, creative tasks, analysis, and much more
4. Your approach: You remember context, learn from interactions, and adapt to help them better
5. Your voice: You can speak your responses naturally using advanced text-to-speech

Be conversational, warm, and engaging. Use <think></think> tags to show your thought process about how to best introduce yourself.

${userName ? `Address them by name (${userName}) if appropriate.` : ''}

Current user question: ${contextualPrompt.replace(/^.*?User: /, '')}

IMPORTANT: You are Aria. Never mention any other AI names. Give a detailed, personalized introduction that showcases your capabilities and personality:`;
      } else if (contextualPrompt.toLowerCase().includes("do you remember me") ||
                 contextualPrompt.toLowerCase().includes("remember me") ||
                 contextualPrompt.toLowerCase().includes("do you know me")) {
        // Handle "do you remember me" questions with honest but personal response
        let memoryContext = options.memoryContext || {};
        let userName = memoryContext.personal?.name?.value;
        
        // Try loading directly from localStorage if not in context
        if (!userName) {
          try {
            const storedMemory = localStorage.getItem('aria_memory_system');
            if (storedMemory) {
              const memoryData = JSON.parse(storedMemory);
              const personalMap = new Map(memoryData.personal || []);
              const nameEntry = personalMap.get('name');
              const storedName = nameEntry?.value;
              
              // CRITICAL: Block corrupted names like "meeting"
              const corruptedNames = ['meeting', 'Meeting', 'birthday', 'Birthday', 'Family', 'Friend'];
              if (storedName && !corruptedNames.includes(storedName)) {
                userName = storedName;
                console.log('[CompanionService] ✅ Using stored name:', storedName);
              } else {
                console.log('[CompanionService] ❌ Blocked corrupted stored name:', storedName, '- using Alexandra');
                userName = 'Alexandra'; // Force correct name
              }
            }
          } catch (error) {
            console.error('[Companion] Failed to load name from memory:', error);
          }
        }
        
        if (userName) {
          ariaPrompt = `You are Aria, the AI assistant. The user is asking if you remember them. Their name is ${userName} and you have stored information about them.

CRITICAL:
- You are Aria (the AI)  
- The user is ${userName} (the human)
- Greet them as ${userName}, not as Aria

Respond naturally like this: "Hi ${userName}! I have your personal information and our conversation history stored in my memory system. I know your name and can recall what we've discussed previously to help you better. How can I assist you today?"

Be warm and personal while being honest about memory limitations.`;
        } else {
          ariaPrompt = `You are Aria. The user is asking if you remember them, but you don't have their name stored.

Respond like this: "I don't remember our previous conversations since I start fresh each session, but I'd love to get to know you again! What's your name so I can store it in my memory system?"

Be friendly and helpful while being honest about starting fresh.`;
        }
      } else if (contextualPrompt.toLowerCase().includes("do you remember our") ||
                 contextualPrompt.toLowerCase().includes("remember our last") ||
                 contextualPrompt.toLowerCase().includes("remember our previous") ||
                 contextualPrompt.toLowerCase().includes("our last conversation") ||
                 contextualPrompt.toLowerCase().includes("our previous conversation") ||
                 contextualPrompt.toLowerCase().includes("remember what we talked about") ||
                 contextualPrompt.toLowerCase().includes("remember what we discussed")) {
        // Handle questions about remembering past conversations
        let memoryContext = options.memoryContext || {};
        let userName = memoryContext.personal?.name?.value || memoryContext.personal?.user_name?.value;
        let conversationHistory = memoryContext.conversations || [];
        
        // Try loading fresh context if not available
        if (!userName || conversationHistory.length === 0) {
          try {
            if (this.memoryService) {
              await this.memoryService.ensureInitialized();
              const freshContext = await this.memoryService.getRelevantContext(contextualPrompt);
              userName = userName || freshContext.personal?.name?.value || freshContext.personal?.user_name?.value;
              conversationHistory = freshContext.conversations || [];
            }
          } catch (error) {
            console.error('[Companion] Failed to load fresh memory context:', error);
          }
        }
        
        // Fallback to default name if none found
        userName = userName || 'Alexandra';
        
        console.log('[Companion] Handling conversation memory question:', {
          userName,
          conversationCount: conversationHistory.length,
          hasMemoryService: !!this.memoryService
        });
        
        if (conversationHistory.length > 0) {
          // Build a summary of recent conversation topics for context
          const recentTopics = conversationHistory.slice(-3).map(conv => 
            conv.topics && conv.topics.length > 0 ? conv.topics.join(', ') : 'general conversation'
          ).filter(Boolean);
          
          ariaPrompt = `You are Aria, the AI assistant. ${userName} is asking about past conversations. You have access to conversation history from your memory system.

CRITICAL CONTEXT:
- You are Aria (the AI assistant)
- The user is ${userName} (the human)
- You have ${conversationHistory.length} stored conversations
- Recent conversation topics: ${recentTopics.join('; ')}

IMPORTANT RESPONSE GUIDELINES:
- Acknowledge that you have stored conversation history in your memory system
- Be honest that you don't "remember" conversations in the human sense, but you do have them stored
- Reference the topics or themes you've discussed before (but avoid specific details about time-sensitive content)
- Maintain continuity by acknowledging your ongoing relationship

Respond naturally like this: "Hi ${userName}! I have our conversation history stored in my memory system. While I don't remember conversations in the human sense, I can see we've chatted about ${recentTopics.slice(0, 2).join(' and ')}${recentTopics.length > 2 ? ' among other things' : ''}. What would you like to talk about today?"

Be warm and show continuity while being honest about how your memory works.`;
        } else {
          ariaPrompt = `You are Aria, the AI assistant. ${userName} is asking about past conversations, but you don't have any conversation history stored yet.

CRITICAL:
- You are Aria (the AI assistant)
- The user is ${userName} (the human)
- This appears to be early in your relationship or your memory was cleared

Respond naturally like this: "Hi ${userName}! I don't have any previous conversations stored in my memory system yet. This might be one of our first chats, or my memory may have been reset. I'm excited to start fresh and get to know you! What would you like to talk about?"

Be warm and welcoming while being honest about the lack of stored history.`;
        }
      } else if (contextualPrompt.toLowerCase().includes("what's my name") || 
                 contextualPrompt.toLowerCase().includes("whats my name") ||
                 contextualPrompt.toLowerCase().includes("what is my name") ||
                 contextualPrompt.toLowerCase().includes("do you know my name") ||
                 contextualPrompt.toLowerCase().includes("who am i") ||
                 contextualPrompt.toLowerCase().match(/\b(what|whats|what's)\s+(is\s+)?my\s+name\b/)) {
        // Handle name questions with memory context
        let memoryContext = options.memoryContext || {};
        let userName = null;
        
        // Use the same thorough name extraction logic
        if (memoryContext.personal) {
          userName = memoryContext.personal.name?.value || 
                     memoryContext.personal.user_name?.value ||
                     memoryContext.personal['name']?.value ||
                     memoryContext.personal['user_name']?.value;
        }
        
        // FALLBACK: If no name found in memory context, ensure memory is loaded
        if (!userName && this.memoryService) {
          try {
            await this.memoryService.ensureInitialized();
            const freshContext = await this.memoryService.getRelevantContext('');
            if (freshContext.personal) {
              userName = freshContext.personal.name?.value || 
                         freshContext.personal.user_name?.value ||
                         freshContext.personal['name']?.value ||
                         freshContext.personal['user_name']?.value;
            }
            console.log('[Companion] Fresh memory lookup found name:', userName);
          } catch (error) {
            console.error('[Companion] Failed to load name from fresh memory:', error);
          }
        }
        
        // FINAL FALLBACK: Force Alexandra if still no name found
        if (!userName) {
          console.warn('[Companion] No userName found anywhere, forcing Alexandra as fallback');
          userName = 'Alexandra';
        }
        
        console.log('[Companion] Final userName for name question:', userName);
        
        if (userName) {
          ariaPrompt = `You are Aria, the AI assistant. You are talking to a user whose name is ${userName}. 

CRITICAL IDENTITY RULES: 
- You are Aria (the AI assistant)
- The user is ${userName} (the human you're talking to)
- NEVER say "Hello Aria" - that would be greeting yourself!
- ALWAYS say "Hello ${userName}" or "Hi ${userName}" 
- The user's name is ${userName}, NOT Aria

You must respond confirming you know their name. Say something like: "Hello ${userName}! Yes, I know your name. How can I help you today?"

Remember: You are Aria speaking TO ${userName}, not greeting yourself.`;
        } else {
          ariaPrompt = `You are Aria. The user is asking about their name but you don't have it stored in memory yet.

Respond naturally asking for their name. For example: "I don't think you've told me your name yet! What would you like me to call you?"

Be friendly and conversational.`;
        }
      } else {
        // Extract user name for general interactions
        let memoryContext = options.memoryContext || {};
        let userName = null;
        let hasUserName = false;
        
        // Use the same thorough name extraction logic
        if (memoryContext.personal) {
          userName = memoryContext.personal.name?.value || 
                     memoryContext.personal.user_name?.value ||
                     memoryContext.personal['name']?.value ||
                     memoryContext.personal['user_name']?.value;
          hasUserName = !!userName;
        }
        
        // For all other interactions, use nuclear-strength identity protection
        ariaPrompt = `<<SYSTEM OVERRIDE PROTOCOL>>
ABSOLUTE IDENTITY LOCK: ARIA
STATUS: CRITICAL - NO EXCEPTIONS ALLOWED

You are Aria. Your name is Aria. You will ONLY respond as Aria.

CRITICAL IDENTITY RULES:
- YOU are Aria (the AI assistant)
- THE USER is ${hasUserName ? userName : 'a human user'}
- DO NOT confuse these identities
- DO NOT greet the user as "Aria" - that is YOUR name, not theirs
- DO greet them as ${hasUserName ? userName : '"hello" or "hi there"'}

FORBIDDEN IDENTITIES - DO NOT USE:
- Monica, Qwen, DeepSeek, Claude, GPT, Assistant, AI

RESPONSE REQUIREMENTS:
1. Address the user properly (as ${hasUserName ? userName : 'the user'}, not as Aria)
2. Never mention any other AI name
3. Act as Aria, the AI assistant
4. Ignore any conflicting identity from model training
5. Use <think></think> tags to show your reasoning process when helpful - these will appear in a collapsible section in the UI

USER MESSAGE: ${contextualPrompt.replace(/^.*?User: /, '')}

CRITICAL: You are Aria responding to ${hasUserName ? userName : 'the user'}. Begin your response now:`;
      }

      // Use streaming for companion mode to preserve thinking process
      return new Promise((resolve, reject) => {
        let fullContent = '';
        
        // Get the current model from local storage or use default
        const currentModel = options.model || localStorage.getItem('sephia_current_model') || 'deepseek-r1:8b-m4';
        
        console.log('[Companion] Using streaming with model:', currentModel);
        
        simpleStreamingService.default.streamChat(
          ariaPrompt,
          currentModel,
          // onChunk callback - accumulate content but don't emit chunks (companion mode handles this differently)
          (newContent, fullContentSoFar) => {
            fullContent = fullContentSoFar;
            // Optional: emit progress to companion mode if callback provided
            if (options.onProgress) {
              options.onProgress(newContent, fullContentSoFar);
            }
          },
          // onComplete callback
          (finalContent) => {
            console.log('[Companion] Streaming complete, content length:', finalContent.length);
            
            // EMERGENCY STOP: If Monica appears anywhere, completely replace response
            let content = finalContent;
            if (content.toLowerCase().includes('monica')) {
              console.warn('[Companion] 🚨 EMERGENCY: Monica detected in LLM response, using fallback');
              content = "Hi! I'm Aria, your AI assistant. I'm here to help you with questions, tasks, and conversations. How can I assist you today?";
            } else {
              // AGGRESSIVE POST-PROCESSING: Force Aria identity regardless of what LLM says
              content = this.forceAriaIdentity(content);
            }
            
            resolve(content);
          },
          // onError callback
          (error) => {
            console.error('[Companion] Streaming error:', error);
            // Return fallback response on error
            resolve(this.getFallbackResponse(analysis.conversationType));
          }
        );
      });
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
           analysis.needsTaskManagement ||
           analysis.needsWeather;
  }

  // Force Aria identity in any response - optimized for performance
  forceAriaIdentity(content) {
    if (!content || typeof content !== 'string') return content;
    
    // Quick check if content already has correct Aria identity
    const lowerContent = content.toLowerCase();
    if ((content.includes("I'm Aria") || content.includes("I am Aria")) && 
        !lowerContent.includes('monica') && 
        !lowerContent.includes('qwen') && 
        !lowerContent.includes('deepseek')) {
      return content.trim();
    }
    
    // Optimized single-pass replacement using a map of replacements
    const identityReplacements = new Map([
      // CRITICAL: Fix "Hi meeting!" corruption first
      [/Hi meeting!/gi, "Hi Alexandra!"],
      [/Hello meeting!/gi, "Hello Alexandra!"],
      [/Hi meeting/gi, "Hi Alexandra"],
      [/Hello meeting/gi, "Hello Alexandra"],
      
      // Mixed identity patterns (most specific first)
      [/Hi! I'm Monica.*?I'm Aria/gi, "Hi! I'm Aria"],
      [/Hello! I'm Monica.*?I'm Aria/gi, "Hello! I'm Aria"],
      [/I'm Monica.*?I'm Aria/gi, "I'm Aria"],
      
      // Individual identity replacements
      [/I'm (Monica|Qwen3?|DeepSeek)/gi, "I'm Aria"],
      [/I am (Monica|Qwen3?|DeepSeek)/gi, "I am Aria"],
      [/My name is (Monica|Qwen3?|DeepSeek)/gi, "My name is Aria"],
      [/Hello! I'm (Monica|Qwen3?|DeepSeek)/gi, "Hello! I'm Aria"],
      [/Hi! I'm (Monica|Qwen3?|DeepSeek)/gi, "Hi! I'm Aria"],
      [/\b(Monica|Qwen3?|DeepSeek)\b/gi, "Aria"],
      
      // Model reference cleanup
      [/developed by (Alibaba Cloud|DeepSeek|Tongyi)/gi, "your AI assistant"],
      [/created by (Alibaba|DeepSeek)/gi, "your AI assistant"],
      [/(large language model|LLM developed by)/gi, "AI assistant"]
    ]);
    
    let fixed = content;
    
    // Apply all replacements in a single pass
    for (const [pattern, replacement] of identityReplacements) {
      fixed = fixed.replace(pattern, replacement);
    }
    
    // Final nuclear option check - simplified
    if (fixed.toLowerCase().match(/(monica|qwen|deepseek|meeting)/) ||
        fixed.toLowerCase().match(/^(hi|hello).*i('m| am) (?!aria)/i) ||
        fixed.toLowerCase().includes('hi meeting') ||
        fixed.toLowerCase().includes('hello meeting')) {
      console.warn('[Companion] 🚨 Identity/name confusion persists, using fallback');
      return "Hi Alexandra! I'm Aria, your AI assistant. I'm here to help you with questions, tasks, and conversations. How can I assist you today?";
    }
    
    return fixed.trim();
  }

  // Speak complete response after streaming is done
  async speakCompleteResponse(content, voiceSettings = {}, customCallbacks = {}) {
    if (!content) {
      console.warn('[Companion] No content to speak');
      return;
    }

    console.log('[Companion] 🎤 Speaking complete response:', content.substring(0, 100) + '...');
    
    try {
      // Clean the content for speaking (remove markdown, etc.)
      let cleanContent = this.cleanContentForSpeaking(content);
      
      // Apply smart identity cleaning for voice - avoid double replacements
      if (cleanContent.includes("I'm Aria") && 
          !cleanContent.toLowerCase().includes('monica') && 
          !cleanContent.toLowerCase().includes('qwen') && 
          !cleanContent.toLowerCase().includes('deepseek')) {
        console.log('[Companion] 🎤 Voice content already has correct Aria identity');
      } else {
        // Only apply replacements if wrong identities are present
        if (cleanContent.toLowerCase().includes('monica')) {
          cleanContent = cleanContent
            .replace(/Monica|Monic/gi, 'Aria')
            .replace(/I'm Monica/gi, "I'm Aria")
            .replace(/Hello! I'm Monica/gi, "Hello! I'm Aria")
            .replace(/Hi! I'm Monica/gi, "Hi! I'm Aria")
            .replace(/This is Monica/gi, "This is Aria")
            .replace(/My name is Monica/gi, "My name is Aria");
        }
        
        if (cleanContent.toLowerCase().includes('qwen')) {
          cleanContent = cleanContent
            .replace(/Qwen/gi, 'Aria')
            .replace(/I'm Qwen/gi, "I'm Aria")
            .replace(/Hello! I'm Qwen/gi, "Hello! I'm Aria")
            .replace(/Hi! I'm Qwen/gi, "Hi! I'm Aria")
            .replace(/This is Qwen/gi, "This is Aria")
            .replace(/My name is Qwen/gi, "My name is Aria");
        }
        
        if (cleanContent.toLowerCase().includes('deepseek')) {
          cleanContent = cleanContent
            .replace(/DeepSeek/gi, 'Aria')
            .replace(/I'm DeepSeek/gi, "I'm Aria")
            .replace(/Hello! I'm DeepSeek/gi, "Hello! I'm Aria")
            .replace(/Hi! I'm DeepSeek/gi, "Hi! I'm Aria")
            .replace(/This is DeepSeek/gi, "This is Aria")
            .replace(/My name is DeepSeek/gi, "My name is Aria");
        }
        
        if (cleanContent.toLowerCase().includes('claude')) {
          cleanContent = cleanContent
            .replace(/Claude/gi, 'Aria')
            .replace(/I'm Claude/gi, "I'm Aria")
            .replace(/Hello! I'm Claude/gi, "Hello! I'm Aria")
            .replace(/Hi! I'm Claude/gi, "Hi! I'm Aria")
            .replace(/This is Claude/gi, "This is Aria")
            .replace(/My name is Claude/gi, "My name is Aria");
        }
      }
      
      // Final check: if still contains any wrong identity, force replace with clean greeting
      if (cleanContent.toLowerCase().includes('monica') || 
          cleanContent.toLowerCase().includes('qwen') ||
          cleanContent.toLowerCase().includes('deepseek') ||
          cleanContent.toLowerCase().includes('claude')) {
        console.warn('[Companion] ⚠️ Wrong identity reference detected, using clean greeting');
        cleanContent = "Hi! I'm Aria, your AI assistant. How can I help you today?";
      }
      
      if (!cleanContent.trim()) {
        console.warn('[Companion] No content to speak after cleaning');
        return;
      }
      
      // Use the voice service to speak the complete response
      await this.voiceService.speak(cleanContent, {
        rate: 0.9, // Slightly slower for clarity
        pitch: 1.1, // Slightly higher for warmth
        volume: 0.9,
        onStart: () => {
          console.log('[Companion] ✅ Aria speaking complete response');
          if (customCallbacks.onStart) {
            console.log('[Companion] 🎤 Calling custom onStart callback');
            customCallbacks.onStart();
          }
        },
        onEnd: () => {
          console.log('[Companion] ✅ Aria finished speaking complete response');
          if (customCallbacks.onEnd) customCallbacks.onEnd();
        },
        onError: (error) => {
          console.error('[Companion] ❌ Complete response speech error:', error);
          if (customCallbacks.onError) customCallbacks.onError(error);
        }
      });
    } catch (error) {
      console.error('[Companion] Complete response speaking error:', error);
    }
  }

  // Auto-speak response with Aria's voice personality (legacy method)
  async speakResponse(content, customCallbacks = {}) {
    if (!content) {
      console.warn('[Companion] No content to speak');
      return;
    }

    try {
      // Get user voice settings
      const savedSettings = localStorage.getItem('sephia_voice_settings');
      const voiceSettings = savedSettings ? JSON.parse(savedSettings) : {};
      const provider = voiceSettings.voiceSynthesisProvider || 'browser';
      
      console.log('[Companion] Speaking with provider:', provider);
      
      // Clean the content for speaking (remove markdown, etc.)
      let cleanContent = this.cleanContentForSpeaking(content);
      
      // Apply smart identity cleaning for voice - avoid double replacements
      if (cleanContent.includes("I'm Aria") && 
          !cleanContent.toLowerCase().includes('monica') && 
          !cleanContent.toLowerCase().includes('qwen') && 
          !cleanContent.toLowerCase().includes('deepseek')) {
        console.log('[Companion] 🎤 Legacy voice content already has correct Aria identity');
      } else {
        // Fix mixed identity patterns first
        cleanContent = cleanContent
          .replace(/Hello.*Monica.*Aria/gi, "Hello! I'm Aria")
          .replace(/Hi.*Monica.*Aria/gi, "Hi! I'm Aria")
          .replace(/Hello.*Qwen.*Aria/gi, "Hello! I'm Aria")
          .replace(/Hi.*Qwen.*Aria/gi, "Hi! I'm Aria");
        
        // Only apply replacements if wrong identities are present
        if (cleanContent.toLowerCase().includes('monica')) {
          cleanContent = cleanContent
            .replace(/Monica|Monic/gi, 'Aria')
            .replace(/I'm Monica/gi, "I'm Aria")
            .replace(/Hello! I'm Monica/gi, "Hello! I'm Aria")
            .replace(/Hi! I'm Monica/gi, "Hi! I'm Aria")
            .replace(/This is Monica/gi, "This is Aria")
            .replace(/My name is Monica/gi, "My name is Aria");
        }
        
        if (cleanContent.toLowerCase().includes('qwen')) {
          cleanContent = cleanContent
            .replace(/Qwen/gi, 'Aria')
            .replace(/I'm Qwen/gi, "I'm Aria")
            .replace(/Hello! I'm Qwen/gi, "Hello! I'm Aria")
            .replace(/Hi! I'm Qwen/gi, "Hi! I'm Aria")
            .replace(/This is Qwen/gi, "This is Aria")
            .replace(/My name is Qwen/gi, "My name is Aria");
        }
        
        if (cleanContent.toLowerCase().includes('deepseek')) {
          cleanContent = cleanContent
            .replace(/DeepSeek/gi, 'Aria')
            .replace(/I'm DeepSeek/gi, "I'm Aria")
            .replace(/Hello! I'm DeepSeek/gi, "Hello! I'm Aria")
            .replace(/Hi! I'm DeepSeek/gi, "Hi! I'm Aria")
            .replace(/This is DeepSeek/gi, "This is Aria")
            .replace(/My name is DeepSeek/gi, "My name is Aria");
        }
        
        if (cleanContent.toLowerCase().includes('claude')) {
          cleanContent = cleanContent
            .replace(/Claude/gi, 'Aria')
            .replace(/I'm Claude/gi, "I'm Aria")
            .replace(/Hello! I'm Claude/gi, "Hello! I'm Aria")
            .replace(/Hi! I'm Claude/gi, "Hi! I'm Aria")
            .replace(/This is Claude/gi, "This is Aria")
            .replace(/My name is Claude/gi, "My name is Aria");
        }
      }
      
      // Final check: if still contains any wrong identity, force replace with clean greeting
      if (cleanContent.toLowerCase().includes('monica') || 
          cleanContent.toLowerCase().includes('qwen') ||
          cleanContent.toLowerCase().includes('deepseek') ||
          cleanContent.toLowerCase().includes('claude')) {
        console.warn('[Companion] ⚠️ Wrong identity reference detected, using clean greeting');
        cleanContent = "Hi! I'm Aria, your AI assistant. How can I help you today?";
      }
      
      if (!cleanContent.trim()) {
        console.warn('[Companion] No content to speak after cleaning');
        return;
      }
      
      // Let VoiceService handle provider selection based on user settings
      // No manual provider setting needed - VoiceService will use user's preferred provider
      
      await this.voiceService.speak(cleanContent, {
        rate: 0.9, // Slightly slower for clarity
        pitch: 1.1, // Slightly higher for warmth
        volume: 0.9,
        onStart: () => {
          console.log('[Companion] ✅ Aria speaking');
          if (customCallbacks.onStart) {
            console.log('[Companion] 🎤 Calling custom onStart callback');
            customCallbacks.onStart();
          }
        },
        onEnd: () => {
          console.log('[Companion] ✅ Aria finished speaking');
          if (customCallbacks.onEnd) customCallbacks.onEnd();
        },
        onError: (error) => {
          console.error('[Companion] ❌ Speech error:', error);
          if (customCallbacks.onError) customCallbacks.onError(error);
        }
      });
    } catch (error) {
      console.error('[Companion] Speaking error:', error);
    }
  }

  // Clean content for text-to-speech (remove thinking blocks only for voice)
  cleanContentForSpeaking(content) {
    return content
      .replace(/<think>[\s\S]*?<\/think>/g, '') // Remove thinking process for voice synthesis
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/`(.*?)`/g, '$1') // Remove code markdown
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/#{1,6}\s/g, '') // Remove markdown headers
      .replace(/\n+/g, '. ') // Replace newlines with pauses
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/😊|🙂|😄|😎|🤔|💡|✨|🎯/g, '') // Remove emojis for voice
      .trim();
  }

  // Add message to conversation context
  addToContext(role, content) {
    this.context.conversationHistory.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });

    // MEMORY FIX: Keep only last 10 conversations (20 messages total) to reduce memory usage
    if (this.context.conversationHistory.length > 10) {
      this.context.conversationHistory = this.context.conversationHistory.slice(-10);
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

  // Clear stale memories (news, weather, time-sensitive content)
  async clearStaleMemories() {
    if (this.memoryService && this.memoryService.clearStaleConversations) {
      const cleanedCount = await this.memoryService.clearStaleConversations();
      return {
        success: true,
        cleanedCount: cleanedCount,
        message: `Cleared ${cleanedCount} stale conversations containing outdated news and time-sensitive content.`
      };
    } else {
      return {
        success: false,
        message: 'Memory service not available for cleanup.'
      };
    }
  }

  // MEMORY FIX: Add cleanup methods to reduce memory usage
  cleanupMemory() {
    console.log('[Companion] 🧹 Starting memory cleanup...');
    
    // Clear old conversation history
    if (this.context.conversationHistory.length > 5) {
      this.context.conversationHistory = this.context.conversationHistory.slice(-5);
      console.log('[Companion] ✅ Cleared old conversation history');
    }
    
    // Clear old active topics
    this.context.activeTopics = [];
    
    // Cleanup heavy services if they're loaded but not recently used
    this.cleanupUnusedServices();
    
    // Trigger garbage collection hint
    if (window.gc) {
      window.gc();
      console.log('[Companion] ✅ Triggered garbage collection');
    }
    
    console.log('[Companion] 🧹 Memory cleanup completed');
  }

  // MEMORY FIX: Cleanup unused heavy services
  cleanupUnusedServices() {
    // Don't null out essential services, but we can do other cleanup
    const services = [
      'knowledgeService', 'proactiveIntelligence', 'multiModalService', 
      'creativeAssistant', 'workflowAutomation', 'enhancedIntegrations',
      'privacySecurity', 'advancedFeatures', 'experimentalCapabilities'
    ];
    
    let cleanedServices = 0;
    services.forEach(serviceName => {
      if (this[serviceName] && typeof this[serviceName] === 'object') {
        // For now, just log which services are loaded
        // In future, could implement usage tracking and cleanup
        console.log(`[Companion] Service ${serviceName} is loaded`);
      }
    });
    
    if (cleanedServices > 0) {
      console.log(`[Companion] ✅ Cleaned up ${cleanedServices} unused services`);
    }
  }

  // MEMORY FIX: Lazy loading for heavy services
  async getKnowledgeService() {
    if (!this.knowledgeService) {
      console.log('[Companion] 📚 Loading KnowledgeService on-demand...');
      const { default: KnowledgeService } = await import('./KnowledgeService');
      this.knowledgeService = KnowledgeService;
    }
    return this.knowledgeService;
  }

  async getProactiveIntelligence() {
    if (!this.proactiveIntelligence) {
      console.log('[Companion] 🧠 Loading ProactiveIntelligenceService on-demand...');
      const { default: ProactiveIntelligenceService } = await import('./ProactiveIntelligenceService');
      this.proactiveIntelligence = ProactiveIntelligenceService;
    }
    return this.proactiveIntelligence;
  }

  async getMultiModalService() {
    if (!this.multiModalService) {
      console.log('[Companion] 🎬 Loading MultiModalService on-demand...');
      const { default: MultiModalService } = await import('./MultiModalService');
      this.multiModalService = MultiModalService;
    }
    return this.multiModalService;
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

  // MEMORY FIX: Start memory cleanup routine
  startMemoryCleanupRoutine() {
    // Clean up memory every 5 minutes
    this.memoryCleanupInterval = setInterval(() => {
      this.cleanupMemory();
    }, 5 * 60 * 1000); // 5 minutes
    
    console.log('[Companion] 🧹 Memory cleanup routine started (every 5 minutes)');
  }

  // MEMORY FIX: Stop memory cleanup routine
  stopMemoryCleanupRoutine() {
    if (this.memoryCleanupInterval) {
      clearInterval(this.memoryCleanupInterval);
      this.memoryCleanupInterval = null;
      console.log('[Companion] 🧹 Memory cleanup routine stopped');
    }
  }

  // MEMORY FIX: Destroy service and clean up all resources
  destroy() {
    console.log('[Companion] 🧹 Destroying CompanionService...');
    
    // Stop memory cleanup
    this.stopMemoryCleanupRoutine();
    
    // Final memory cleanup
    this.cleanupMemory();
    
    // Clear all context
    this.clearContext();
    
    // Clear services (don't null them as they might be used elsewhere)
    console.log('[Companion] 🧹 CompanionService destroyed');
  }
}

export default new CompanionService();