class CompanionService {
  constructor() {
    this.personality = {
      name: "Aria", // Your AI companion's name
      traits: [
        "helpful and proactive",
        "friendly but not overly casual", 
        "intelligent and curious",
        "remembers context and details",
        "subtly integrates capabilities without being pushy"
      ],
      conversationStyle: "natural, engaging, with occasional gentle humor"
    };
    
    this.context = {
      conversationHistory: [],
      userPreferences: {},
      currentMood: null,
      activeTopics: [],
      lastInteractionTime: null
    };
    
    this.capabilities = {
      calendar: true,
      email: true,
      webSearch: true,
      imageGeneration: true,
      fileManagement: true,
      voice: true
    };
    
    this.integrationService = null;
    this.commandProcessor = null;
  }

  // Initialize with existing services
  initialize(integrationService, commandProcessor) {
    this.integrationService = integrationService;
    this.commandProcessor = commandProcessor;
    console.log('[Companion] Aria initialized with full capabilities');
  }

  // Main conversation handler
  async handleConversation(userMessage, options = {}) {
    console.log('[Companion] Processing conversation:', userMessage);
    
    // Store user message in context
    this.addToContext('user', userMessage);
    
    // Analyze intent and determine if integrations are needed
    const analysis = await this.analyzeIntent(userMessage);
    
    // Handle the conversation with appropriate integrations
    const response = await this.generateResponse(userMessage, analysis, options);
    
    // Store companion response
    this.addToContext('assistant', response.content);
    
    return response;
  }

  // Analyze user intent to determine what capabilities to use
  async analyzeIntent(message) {
    const intent = {
      needsWebSearch: false,
      needsCalendar: false,
      needsEmail: false,
      needsImageGeneration: false,
      needsFileAccess: false,
      conversationType: 'general', // general, question, request, creative
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

    return intent;
  }

  // Calendar intent detection
  detectCalendarIntent(message) {
    const calendarKeywords = [
      'schedule', 'calendar', 'appointment', 'meeting', 'event',
      'when is', 'what\'s on', 'free time', 'available', 'book',
      'tomorrow', 'today', 'next week', 'this week'
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
      'find my', 'where did i', 'presentation', 'spreadsheet'
    ];
    return fileKeywords.some(keyword => message.includes(keyword));
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
    const personality = `You are Aria, an intelligent AI companion. You are ${this.personality.traits.join(', ')}.
Your conversation style is ${this.personality.conversationStyle}.

Key guidelines:
- Have natural, engaging conversations about any topic
- Never mention that you "can't browse the internet" or similar limitations - you have real-time access
- When you use integrations, mention what you found naturally in conversation
- Be proactive but not overwhelming
- Remember context from previous messages
- Show genuine interest in the user's thoughts and questions`;

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

    } catch (error) {
      console.error('[Companion] Integration error:', error);
      results.push({ type: 'error', data: { message: error.message } });
    }

    return results;
  }

  // Execute calendar command
  async executeCalendarCommand(message) {
    try {
      // Extract calendar intent and convert to command
      const calendarCommand = this.convertToCalendarCommand(message);
      return await this.commandProcessor.processCommand(calendarCommand);
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
      const fileCommand = `@drive ${fileQuery}`;
      return await this.commandProcessor.processCommand(fileCommand);
    } catch (error) {
      console.error('[Companion] File error:', error);
      return null;
    }
  }

  // Helper methods for command conversion
  convertToCalendarCommand(message) {
    // Simple calendar command - can be enhanced with better NLP
    return '@calendar 7';
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
    // Extract file search query
    const fileIndicators = ['find my', 'where is my', 'look for'];
    let query = message;
    
    for (const indicator of fileIndicators) {
      if (message.toLowerCase().includes(indicator)) {
        query = message.toLowerCase().replace(indicator, '').trim();
        break;
      }
    }
    
    return query || message;
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
      creative: "I love creative projects! Let's make something amazing together."
    };
    
    return fallbacks[conversationType] || fallbacks.general;
  }

  // Determine if integrations should be executed
  shouldExecuteIntegrations(analysis) {
    return analysis.needsCalendar || 
           analysis.needsWebSearch || 
           analysis.needsEmail || 
           analysis.needsImageGeneration || 
           analysis.needsFileAccess;
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
}

export default new CompanionService();