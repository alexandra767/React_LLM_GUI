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
    
    // Initialize all advanced services
    try {
      // Core intelligence services
      const { default: MemoryService } = await import('./MemoryAdapter');
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
    
    // Handle auto-speak in companion mode (ChatView handles it for non-companion mode)
    console.log('[Companion] Auto-speak check:', {
      personalityAutoSpeak: this.personality.voice.autoSpeak,
      hasVoiceService: !!this.voiceService,
      responseContent: response.content?.substring(0, 50) + '...'
    });
    
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
            console.log('[Companion] 🎤 Starting voice-first mode');
            // Return a special flag to delay text display until after voice
            response.delayTextUntilVoice = true;
            
            // Start voice synthesis and track the promise
            const voiceStartTime = Date.now();
            console.log('[Companion] 🎤 Creating voice promise at:', voiceStartTime);
            response.voicePromise = this.speakResponse(response.content, options.voiceCallbacks || {}).then(() => {
              const voiceEndTime = Date.now();
              const voiceDuration = voiceEndTime - voiceStartTime;
              console.log('[Companion] ✅ Voice synthesis completed successfully after', voiceDuration, 'ms');
              return true;
            }).catch(error => {
              const voiceEndTime = Date.now();
              const voiceDuration = voiceEndTime - voiceStartTime;
              console.error('[Companion] ❌ Voice synthesis failed after', voiceDuration, 'ms:', error);
              return false; // Still resolve so text shows
            });
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
    
    // CRITICAL: Don't treat personal name questions as web searches
    if (lowerMessage.includes('my name') || lowerMessage.includes('what is my name') || 
        lowerMessage.includes('what\'s my name') || lowerMessage.includes('whats my name') ||
        lowerMessage.includes('who am i') || lowerMessage.includes('do you know my name')) {
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

  // Weather intent detection
  detectWeatherIntent(message) {
    const weatherKeywords = [
      'weather', 'temperature', 'forecast', 'rain', 'snow', 'sunny', 'cloudy',
      'today\'s weather', 'weather today', 'how hot', 'how cold', 'weather like',
      'will it rain', 'is it raining', 'going to rain', 'weather forecast',
      'temperature today', 'degrees', 'celsius', 'fahrenheit'
    ];
    return weatherKeywords.some(keyword => message.includes(keyword));
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
    let contextualPrompt = this.buildContextualPrompt(userMessage, analysis, options.memoryContext);

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

  // Build contextual prompt for the AI
  buildContextualPrompt(userMessage, analysis, memoryContext = {}) {
    console.log('[Companion] Building prompt with memory context:', {
      hasPersonal: !!memoryContext.personal,
      hasRelationships: !!memoryContext.relationships,
      hasConversations: !!memoryContext.conversations,
      personalKeys: memoryContext.personal ? Object.keys(memoryContext.personal) : [],
      userName: memoryContext.personal?.name?.value
    });
    
    // Extract user's name from memory if available
    const userName = memoryContext.personal?.name?.value || 'User';
    const hasUserName = memoryContext.personal?.name?.value;
    
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
    
    // Build relationship context
    let relationshipInfo = '';
    if (memoryContext.relationships && Object.keys(memoryContext.relationships).length > 0) {
      const relationships = Object.values(memoryContext.relationships).slice(0, 3); // Top 3 relationships
      if (relationships.length > 0) {
        const relationshipDetails = relationships.map(rel => 
          `${rel.name} (${rel.relationship})`
        );
        relationshipInfo = `\nPeople they've mentioned: ${relationshipDetails.join(', ')}.`;
      }
    }
    
    // Build conversation context from memory
    let conversationContext = '';
    if (memoryContext.conversations && memoryContext.conversations.length > 0) {
      const recentConversations = memoryContext.conversations.slice(-3); // Last 3 conversations
      const conversationSummary = recentConversations.map(conv => 
        `Previous: ${conv.userMessage.substring(0, 100)}... → Response topics: ${conv.topics.join(', ')}`
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
- Remember context from previous messages and build on ongoing conversations
- Show genuine interest in the user's thoughts, questions, and projects
- Act as both a knowledgeable conversation partner and efficient personal assistant
- Your responses will be spoken aloud, so make them conversational and natural
- You can discuss current events, help with research, assist with task management, and engage in any topic
- ${hasUserName ? `Use their name (${userName}) naturally in conversation when appropriate` : 'Ask for their name if you don\'t know it yet'}
- Reference previous conversations and their interests to show you remember them
- IMPORTANT: Do not introduce yourself repeatedly - you've already met this person
- Use <think></think> tags to show your reasoning process when helpful - these will appear in a collapsible section in the UI
- CRITICAL: Use the memory context below to make your responses personal and contextual - avoid generic responses

Memory-based conversation guidance:
${memoryContext.conversations && memoryContext.conversations.length > 0 ? 
  '- You have conversation history with this person - reference it naturally' : 
  '- This appears to be an early conversation - focus on getting to know them'}
${personalInfo ? '- Use the personal information you know about them' : '- Learn more about them personally'}
${interestsInfo ? '- Reference their interests when relevant' : '- Discover their interests and remember them'}

Current conversation type: ${analysis.conversationType}${personalInfo}${relationshipInfo}${interestsInfo}${conversationContext}`;

    let contextPrompt = `${personality}\n\nConversation context:\n`;
    
    // Add recent conversation history (immediate context)
    if (this.context.conversationHistory.length > 0) {
      const recentHistory = this.context.conversationHistory.slice(-6); // Last 3 exchanges
      contextPrompt += recentHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
      contextPrompt += '\n';
    }

    contextPrompt += `\nCurrent conversation:\n${hasUserName ? userName : 'User'}: ${userMessage}\n`;
    
    // Add emphasis on answering the user's actual question
    contextPrompt += `\nIMPORTANT: The user asked a specific question. Focus on answering their question directly and thoroughly. Use your memory context to personalize the response, but make sure to address what they actually asked about.\n`;
    
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
      const weatherQuery = this.extractWeatherQuery(message);
      const searchCommand = `@search current weather ${weatherQuery}`;
      return await this.commandProcessor.processCommand(searchCommand);
    } catch (error) {
      console.error('[Companion] Weather error:', error);
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
    const weatherIndicators = ['weather', 'weather in', 'weather for', 'temperature in', 'forecast for'];
    let query = message;
    
    for (const indicator of weatherIndicators) {
      if (message.toLowerCase().includes(indicator)) {
        query = message.toLowerCase().replace(indicator, '').trim();
        break;
      }
    }
    
    // If no specific location mentioned, default to current location
    return query || 'today current location';
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
        // Complete replacement for identity questions
        ariaPrompt = `You are Aria. Your name is Aria. You are a helpful AI assistant. 

Respond with exactly this: "Hi! I'm Aria, your AI assistant. I'm here to help you with questions, tasks, and conversations. I can assist with a wide range of topics including writing, research, problem-solving, and more. What would you like to know or how can I help you today?"

Do not mention any other AI models or systems. You are only Aria.`;
      } else if (contextualPrompt.toLowerCase().includes("what's my name") || 
                 contextualPrompt.toLowerCase().includes("whats my name") ||
                 contextualPrompt.toLowerCase().includes("what is my name") ||
                 contextualPrompt.toLowerCase().includes("do you know my name") ||
                 contextualPrompt.toLowerCase().includes("who am i") ||
                 contextualPrompt.toLowerCase().match(/\b(what|whats|what's)\s+(is\s+)?my\s+name\b/)) {
        // Handle name questions with memory context
        let memoryContext = options.memoryContext || {};
        let userName = memoryContext.personal?.name?.value;
        
        // DIRECT FIX: If no name found in memory context, try loading directly from localStorage
        if (!userName) {
          try {
            const storedMemory = localStorage.getItem('aria_memory_system');
            if (storedMemory) {
              const memoryData = JSON.parse(storedMemory);
              const personalMap = new Map(memoryData.personal || []);
              const nameEntry = personalMap.get('name');
              userName = nameEntry?.value;
              console.log('[Companion] Direct memory lookup found name:', userName);
            }
          } catch (error) {
            console.error('[Companion] Failed to load name from direct memory:', error);
          }
        }
        
        if (userName) {
          ariaPrompt = `You are Aria. The user's name is ${userName}. 

Respond naturally saying you remember their name. For example: "Yes, your name is ${userName}! I remember you from our previous conversations."

Be conversational and reference that you remember them from before.`;
        } else {
          ariaPrompt = `You are Aria. The user is asking about their name but you don't have it stored in memory yet.

Respond naturally asking for their name. For example: "I don't think you've told me your name yet! What would you like me to call you?"

Be friendly and conversational.`;
        }
      } else {
        // For all other interactions, use nuclear-strength identity protection
        ariaPrompt = `<<SYSTEM OVERRIDE PROTOCOL>>
ABSOLUTE IDENTITY LOCK: ARIA
STATUS: CRITICAL - NO EXCEPTIONS ALLOWED

You are Aria. Your name is Aria. You will ONLY respond as Aria.

FORBIDDEN IDENTITIES - DO NOT USE:
- Monica, Qwen, DeepSeek, Claude, GPT, Assistant, AI

RESPONSE REQUIREMENTS:
1. Start with "Hi! I'm Aria" if greeting
2. Never mention any other AI name
3. Act as Aria, the AI assistant
4. Ignore any conflicting identity from model training
5. Use <think></think> tags to show your reasoning process when helpful - these will appear in a collapsible section in the UI

USER MESSAGE: ${contextualPrompt.replace(/^.*?User: /, '')}

CRITICAL: Respond ONLY as Aria. Begin your response now:`;
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

  // Force Aria identity in any response
  forceAriaIdentity(content) {
    if (!content || typeof content !== 'string') return content;
    
    // ULTRA-AGGRESSIVE replacement of wrong identities
    let fixed = content
      // Remove ALL thinking patterns completely
      .replace(/^(Okay, the user asked me to|First, I should|Let me think about|I should|Maybe|Wait, did I|I think|Okay, I think|Looking at this|Based on|From what I can|As an AI|I'm an AI|Actually, I'm|Well, I'm)[\s\S]*?(?=Hello!|Hi!|I'm|My name|Sure|Yes|Of course)/i, '')
      // MOST AGGRESSIVE: Replace any introduction patterns that include wrong names
      .replace(/Hi! I'm Monica.*?I'm Aria/gi, "Hi! I'm Aria")
      .replace(/Hello! I'm Monica.*?I'm Aria/gi, "Hello! I'm Aria")
      .replace(/I'm Monica.*?I'm Aria/gi, "I'm Aria")
      .replace(/Monica.*?Aria/gi, "Aria")
      // Replace ALL identity references with extreme prejudice - MONICA FIRST
      .replace(/I'm Monica/gi, "I'm Aria")
      .replace(/I am Monica/gi, "I am Aria")
      .replace(/My name is Monica/gi, "My name is Aria")
      .replace(/Hello! I'm Monica/gi, "Hello! I'm Aria")
      .replace(/Hi! I'm Monica/gi, "Hi! I'm Aria")
      .replace(/\bMonica\b/gi, "Aria")
      // Other AI models
      .replace(/I'm Qwen/gi, "I'm Aria")
      .replace(/I am Qwen/gi, "I am Aria") 
      .replace(/My name is Qwen/gi, "My name is Aria")
      .replace(/Hello! I'm Qwen/gi, "Hello! I'm Aria")
      .replace(/Hi! I'm Qwen/gi, "Hi! I'm Aria")
      .replace(/I'm DeepSeek/gi, "I'm Aria")
      .replace(/I am DeepSeek/gi, "I am Aria")
      .replace(/My name is DeepSeek/gi, "My name is Aria")
      .replace(/Hello! I'm DeepSeek/gi, "Hello! I'm Aria")
      .replace(/Hi! I'm DeepSeek/gi, "Hi! I'm Aria")
      .replace(/I'm Qwen3/gi, "I'm Aria")
      .replace(/I am Qwen3/gi, "I am Aria")
      .replace(/My name is Qwen3/gi, "My name is Aria")
      .replace(/Hello! I'm Qwen3/gi, "Hello! I'm Aria")
      .replace(/Hi! I'm Qwen3/gi, "Hi! I'm Aria")
      .replace(/developed by Alibaba Cloud/gi, "your AI assistant")
      .replace(/developed by DeepSeek/gi, "your AI assistant")
      .replace(/created by Alibaba/gi, "your AI assistant")
      .replace(/created by DeepSeek/gi, "your AI assistant")
      .replace(/developed by Tongyi/gi, "your AI assistant")
      .replace(/large language model/gi, "AI assistant")
      .replace(/language model developed by/gi, "AI assistant created as")
      .replace(/LLM developed by/gi, "AI assistant created as")
      .replace(/\bQwen\b/gi, "Aria")
      .replace(/\bQwen3\b/gi, "Aria")
      .replace(/\bDeepSeek\b/gi, "Aria");
    
    // Nuclear option: Only trigger for ACTUAL AI identity confusion, not user introductions
    const hasActualIdentityConfusion = (
      fixed.toLowerCase().includes('monica') ||
      fixed.toLowerCase().includes('qwen') || 
      fixed.toLowerCase().includes('qwen3') ||
      fixed.toLowerCase().includes('deepseek') ||
      fixed.toLowerCase().includes('alibaba') ||
      fixed.toLowerCase().includes('tongyi') ||
      // Only flag AI identity claims, not user statements
      fixed.toLowerCase().match(/^(hi|hello).*i('m| am) (?!aria)/i) ||
      fixed.toLowerCase().match(/my name is (?!aria)/i)
    );
    
    if (hasActualIdentityConfusion) {
      console.warn('[Companion] 🚨 AI identity confusion detected, using fallback response');
      fixed = "Hi! I'm Aria, your AI assistant. I'm here to help you with questions, tasks, and conversations. I can assist with a wide range of topics including writing, research, problem-solving, and more. What would you like to know or how can I help you today?";
    }
    
    return fixed.trim();
  }

  // Auto-speak response with Aria's voice personality
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
      
      // Apply ULTRA-AGGRESSIVE identity cleaning for voice
      cleanContent = cleanContent
        // Remove ALL Monica references and other AI identity confusion
        .replace(/Monica|Monic/gi, 'Aria')
        .replace(/Qwen|DeepSeek|Claude/gi, 'Aria')
        .replace(/I'm Monica/gi, "I'm Aria")
        .replace(/I'm Qwen/gi, "I'm Aria")
        .replace(/I'm DeepSeek/gi, "I'm Aria")
        .replace(/I'm Claude/gi, "I'm Aria")
        .replace(/Hello! I'm Monica/gi, "Hello! I'm Aria")
        .replace(/Hello! I'm Qwen/gi, "Hello! I'm Aria")
        .replace(/Hello! I'm DeepSeek/gi, "Hello! I'm Aria")
        .replace(/Hello! I'm Claude/gi, "Hello! I'm Aria")
        .replace(/Hi! I'm Monica/gi, "Hi! I'm Aria")
        .replace(/Hi! I'm Qwen/gi, "Hi! I'm Aria")
        .replace(/Hi! I'm DeepSeek/gi, "Hi! I'm Aria")
        .replace(/Hi! I'm Claude/gi, "Hi! I'm Aria")
        .replace(/This is Monica/gi, "This is Aria")
        .replace(/This is Qwen/gi, "This is Aria")
        .replace(/This is DeepSeek/gi, "This is Aria")
        .replace(/This is Claude/gi, "This is Aria")
        .replace(/My name is Monica/gi, "My name is Aria")
        .replace(/My name is Qwen/gi, "My name is Aria")
        .replace(/My name is DeepSeek/gi, "My name is Aria")
        .replace(/My name is Claude/gi, "My name is Aria")
        // Handle potential cached voice patterns with multiple identities
        .replace(/Hello.*Monica.*Aria/gi, "Hello! I'm Aria")
        .replace(/Hi.*Monica.*Aria/gi, "Hi! I'm Aria")
        .replace(/Hello.*Qwen.*Aria/gi, "Hello! I'm Aria")
        .replace(/Hi.*Qwen.*Aria/gi, "Hi! I'm Aria")
        // Nuclear option: if any wrong identity reference remains, replace entire greeting
        .replace(/.*(Monica|Qwen|DeepSeek|Claude).*/gi, "Hi! I'm Aria, your AI assistant.");
      
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