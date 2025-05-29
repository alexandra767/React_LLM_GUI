// Creative Assistant Service for Aria
class CreativeAssistantService {
  constructor() {
    this.capabilities = {
      writing: {
        stories: true,
        poetry: true,
        essays: true,
        scripts: true,
        lyrics: true,
        blogs: true,
        emails: true,
        reports: true
      },
      games: {
        textAdventure: true,
        trivia: true,
        wordGames: true,
        puzzles: true,
        riddles: true,
        storytelling: true
      },
      learning: {
        languages: true,
        subjects: true,
        skills: true,
        tutorials: true,
        quizzes: true,
        explanations: true
      },
      entertainment: {
        jokes: true,
        conversations: true,
        roleplay: true,
        brainstorming: true,
        ideaGeneration: true
      }
    };
    
    this.templates = {
      story: {
        genres: ['fantasy', 'sci-fi', 'mystery', 'romance', 'thriller', 'adventure', 'horror', 'comedy'],
        structures: ['beginning-middle-end', 'hero-journey', 'mystery-reveal', 'conflict-resolution']
      },
      poetry: {
        forms: ['free-verse', 'sonnet', 'haiku', 'limerick', 'ballad', 'acrostic'],
        themes: ['nature', 'love', 'life', 'dreams', 'emotions', 'seasons', 'philosophy']
      },
      games: {
        difficulty: ['easy', 'medium', 'hard', 'expert'],
        categories: ['general', 'science', 'history', 'literature', 'movies', 'music', 'technology']
      }
    };
    
    this.gameStates = new Map();
    this.learningProgress = new Map();
    this.creativeHistory = [];
    
    this.storageKey = 'aria_creative_assistant';
    this.loadCreativeData();
  }

  // Load creative data from storage
  loadCreativeData() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.gameStates = new Map(data.gameStates || []);
        this.learningProgress = new Map(data.learningProgress || []);
        this.creativeHistory = data.creativeHistory || [];
        console.log('[Creative] Loaded creative data');
      }
    } catch (error) {
      console.error('[Creative] Failed to load creative data:', error);
    }
  }

  // Save creative data to storage
  saveCreativeData() {
    try {
      const data = {
        gameStates: Array.from(this.gameStates.entries()),
        learningProgress: Array.from(this.learningProgress.entries()),
        creativeHistory: this.creativeHistory.slice(-100), // Keep last 100 entries
        lastSave: Date.now()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('[Creative] Failed to save creative data:', error);
    }
  }

  // Create story based on user input
  async createStory(prompt, options = {}) {
    const {
      genre = 'adventure',
      length = 'short', // short, medium, long
      style = 'narrative',
      includeDialogue = true,
      perspective = 'third-person'
    } = options;
    
    console.log('[Creative] Creating story:', { prompt, genre, length });
    
    try {
      const storyStructure = this.generateStoryStructure(prompt, genre, length);
      const story = await this.generateStoryContent(storyStructure, style, includeDialogue, perspective);
      
      const result = {
        success: true,
        type: 'story',
        content: story,
        metadata: {
          genre,
          length,
          style,
          wordCount: this.countWords(story),
          estimatedReadingTime: this.estimateReadingTime(story),
          createdAt: new Date().toISOString()
        }
      };
      
      this.addToCreativeHistory('story', prompt, result);
      return result;
    } catch (error) {
      console.error('[Creative] Story creation failed:', error);
      return {
        success: false,
        error: error.message,
        type: 'story'
      };
    }
  }

  // Generate story structure
  generateStoryStructure(prompt, genre, length) {
    const structures = {
      short: ['setup', 'conflict', 'resolution'],
      medium: ['introduction', 'rising-action', 'climax', 'falling-action', 'conclusion'],
      long: ['exposition', 'inciting-incident', 'rising-action', 'climax', 'falling-action', 'resolution', 'denouement']
    };
    
    return {
      prompt,
      genre,
      length,
      acts: structures[length] || structures.short,
      theme: this.extractTheme(prompt),
      characters: this.suggestCharacters(prompt, genre),
      setting: this.suggestSetting(prompt, genre)
    };
  }

  // Generate story content
  async generateStoryContent(structure, style, includeDialogue, perspective) {
    const { prompt, genre, acts, theme, characters, setting } = structure;
    
    let story = '';
    
    // Generate opening
    story += this.generateOpening(setting, characters[0], genre, perspective);
    story += '\n\n';
    
    // Generate main narrative based on prompt
    story += this.generateMainNarrative(prompt, theme, characters, includeDialogue, perspective);
    story += '\n\n';
    
    // Generate conclusion
    story += this.generateConclusion(theme, characters, genre, perspective);
    
    return story;
  }

  // Generate story opening
  generateOpening(setting, mainCharacter, genre, perspective) {
    const openings = {
      'fantasy': [
        `The ancient ${setting.type} ${setting.name} had seen many ${mainCharacter.type}s, but none quite like ${mainCharacter.name}.`,
        `Magic crackled in the air around ${setting.name}, and ${mainCharacter.name} could feel its pull.`,
        `In the realm of ${setting.name}, where ${setting.description}, ${mainCharacter.name} began their extraordinary journey.`
      ],
      'sci-fi': [
        `The year ${setting.year || '2157'}, aboard the ${setting.name}, ${mainCharacter.name} monitored the approaching ${setting.threat || 'anomaly'}.`,
        `Binary stars cast an eerie glow over ${setting.name} as ${mainCharacter.name} made a discovery that would change everything.`,
        `The quantum ${setting.type} hummed with energy as ${mainCharacter.name} prepared for the impossible.`
      ],
      'mystery': [
        `The fog rolled in over ${setting.name} just as ${mainCharacter.name} discovered the first clue.`,
        `Something wasn't right about ${setting.name}, and ${mainCharacter.name} intended to find out what.`,
        `The case seemed simple enough, but ${mainCharacter.name} had learned never to trust appearances in ${setting.name}.`
      ],
      'adventure': [
        `The map led ${mainCharacter.name} to the edge of ${setting.name}, where adventure awaited.`,
        `With courage in their heart, ${mainCharacter.name} set foot in the legendary ${setting.name}.`,
        `The journey to ${setting.name} had been long, but ${mainCharacter.name} was finally here.`
      ]
    };
    
    const choices = openings[genre] || openings.adventure;
    return choices[Math.floor(Math.random() * choices.length)];
  }

  // Generate main narrative
  generateMainNarrative(prompt, theme, characters, includeDialogue, perspective) {
    // This is a simplified implementation - in a real system,
    // you would use more sophisticated narrative generation
    
    const conflict = this.extractConflict(prompt);
    const mainCharacter = characters[0];
    
    let narrative = `${mainCharacter.name} faced a ${conflict.type}: ${conflict.description}. `;
    
    if (characters.length > 1) {
      const ally = characters[1];
      narrative += `Fortunately, ${ally.name} was there to help. `;
      
      if (includeDialogue) {
        narrative += `\n\n"${this.generateDialogue(ally, 'supportive')}" ${ally.name} said encouragingly.\n\n`;
      }
    }
    
    narrative += `Through determination and ${theme.qualities || 'courage'}, ${mainCharacter.name} worked to overcome the challenge. `;
    
    if (conflict.obstacles) {
      narrative += `The path was not easy - ${conflict.obstacles} stood in the way. `;
    }
    
    narrative += `But ${mainCharacter.name} persevered, drawing on inner strength and ${theme.values || 'wisdom'}.`;
    
    return narrative;
  }

  // Generate conclusion
  generateConclusion(theme, characters, genre, perspective) {
    const mainCharacter = characters[0];
    const conclusions = {
      'fantasy': `As the magical energies settled, ${mainCharacter.name} realized that the true power had been within them all along.`,
      'sci-fi': `The technology had advanced, but ${mainCharacter.name} understood that humanity's greatest asset remained unchanged.`,
      'mystery': `With the mystery solved, ${mainCharacter.name} reflected on how truth has a way of revealing itself to those who seek it.`,
      'adventure': `The adventure was complete, but ${mainCharacter.name} knew that the greatest journeys change us from within.`
    };
    
    return conclusions[genre] || `${mainCharacter.name} emerged from the experience wiser and stronger, carrying forward the lessons learned.`;
  }

  // Create poetry
  async createPoetry(prompt, options = {}) {
    const {
      form = 'free-verse',
      theme = 'general',
      mood = 'contemplative',
      length = 'medium'
    } = options;
    
    console.log('[Creative] Creating poetry:', { prompt, form, theme });
    
    try {
      let poem;
      
      switch (form) {
        case 'haiku':
          poem = this.generateHaiku(prompt, theme);
          break;
        case 'limerick':
          poem = this.generateLimerick(prompt);
          break;
        case 'sonnet':
          poem = this.generateSonnet(prompt, theme);
          break;
        default:
          poem = this.generateFreeVerse(prompt, theme, mood, length);
      }
      
      const result = {
        success: true,
        type: 'poetry',
        content: poem,
        metadata: {
          form,
          theme,
          mood,
          lineCount: poem.split('\n').filter(line => line.trim()).length,
          createdAt: new Date().toISOString()
        }
      };
      
      this.addToCreativeHistory('poetry', prompt, result);
      return result;
    } catch (error) {
      console.error('[Creative] Poetry creation failed:', error);
      return {
        success: false,
        error: error.message,
        type: 'poetry'
      };
    }
  }

  // Generate haiku
  generateHaiku(prompt, theme) {
    // Simplified haiku generation based on 5-7-5 syllable pattern
    const haikuTemplates = {
      nature: [
        "Cherry blossoms fall\nGentle breeze carries petals\nSpring's fleeting beauty",
        "Morning dew glistens\nOn emerald grass blades bright\nNew day awakens",
        "Ocean waves crash down\nSalt spray kisses sandy shore\nEndless rhythms flow"
      ],
      life: [
        "Each moment passes\nLike leaves dancing in the wind\nTime's gentle journey",
        "Dreams take flight at dawn\nHope rises with morning sun\nNew paths unfold wide",
        "Quiet wisdom grows\nIn spaces between heartbeats\nLife's simple truths shine"
      ]
    };
    
    const templates = haikuTemplates[theme] || haikuTemplates.nature;
    const baseHaiku = templates[Math.floor(Math.random() * templates.length)];
    
    // Simple customization based on prompt keywords
    const keywords = prompt.toLowerCase().split(/\s+/);
    let customizedHaiku = baseHaiku;
    
    if (keywords.includes('sun') || keywords.includes('light')) {
      customizedHaiku = customizedHaiku.replace(/morning/, 'golden').replace(/dawn/, 'sunrise');
    }
    
    return customizedHaiku;
  }

  // Generate free verse poetry
  generateFreeVerse(prompt, theme, mood, length) {
    const lines = [];
    const stanzaCount = length === 'short' ? 2 : length === 'long' ? 4 : 3;
    
    // Extract key imagery from prompt
    const imagery = this.extractImagery(prompt);
    
    for (let stanza = 0; stanza < stanzaCount; stanza++) {
      const stanzaLines = this.generateStanzaLines(imagery, theme, mood, stanza === 0);
      lines.push(...stanzaLines);
      if (stanza < stanzaCount - 1) {
        lines.push(''); // Empty line between stanzas
      }
    }
    
    return lines.join('\n');
  }

  // Start text adventure game
  startTextAdventure(setting = 'fantasy', difficulty = 'medium') {
    const gameId = `adventure_${Date.now()}`;
    
    const gameState = {
      id: gameId,
      type: 'text_adventure',
      setting,
      difficulty,
      currentScene: 'start',
      playerStats: {
        health: 100,
        inventory: ['torch', 'map'],
        experience: 0,
        level: 1
      },
      story: {
        currentLocation: this.getStartingLocation(setting),
        visitedLocations: [],
        completedQuests: [],
        activeQuests: []
      },
      choices: [],
      gameHistory: [],
      startedAt: new Date().toISOString()
    };
    
    // Generate opening scene
    const openingScene = this.generateAdventureScene(gameState);
    gameState.currentScene = openingScene;
    
    this.gameStates.set(gameId, gameState);
    this.saveCreativeData();
    
    return {
      success: true,
      gameId,
      scene: openingScene,
      playerStats: gameState.playerStats,
      message: "Your adventure begins! Choose your path wisely."
    };
  }

  // Process adventure game action
  processAdventureAction(gameId, action) {
    const gameState = this.gameStates.get(gameId);
    if (!gameState) {
      return { success: false, error: 'Game not found' };
    }
    
    // Process the action
    const result = this.processGameAction(gameState, action);
    
    // Update game state
    gameState.gameHistory.push({
      action,
      result: result.outcome,
      timestamp: new Date().toISOString()
    });
    
    // Generate new scene based on action result
    if (result.success) {
      const newScene = this.generateAdventureScene(gameState, result);
      gameState.currentScene = newScene;
    }
    
    this.gameStates.set(gameId, gameState);
    this.saveCreativeData();
    
    return {
      success: result.success,
      scene: gameState.currentScene,
      playerStats: gameState.playerStats,
      message: result.message,
      gameOver: result.gameOver || false
    };
  }

  // Start trivia game
  startTriviaGame(category = 'general', difficulty = 'medium', questionCount = 10) {
    const gameId = `trivia_${Date.now()}`;
    
    const gameState = {
      id: gameId,
      type: 'trivia',
      category,
      difficulty,
      totalQuestions: questionCount,
      currentQuestion: 0,
      score: 0,
      questions: this.generateTriviaQuestions(category, difficulty, questionCount),
      answers: [],
      startedAt: new Date().toISOString()
    };
    
    this.gameStates.set(gameId, gameState);
    this.saveCreativeData();
    
    const firstQuestion = gameState.questions[0];
    
    return {
      success: true,
      gameId,
      question: firstQuestion,
      questionNumber: 1,
      totalQuestions: questionCount,
      score: 0,
      message: `Welcome to ${category} trivia! Question 1 of ${questionCount}:`
    };
  }

  // Process trivia answer
  processTriviaAnswer(gameId, answer) {
    const gameState = this.gameStates.get(gameId);
    if (!gameState) {
      return { success: false, error: 'Game not found' };
    }
    
    const currentQuestion = gameState.questions[gameState.currentQuestion];
    const isCorrect = answer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
    
    if (isCorrect) {
      gameState.score++;
    }
    
    gameState.answers.push({
      question: currentQuestion.question,
      userAnswer: answer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      timestamp: new Date().toISOString()
    });
    
    gameState.currentQuestion++;
    
    const isGameComplete = gameState.currentQuestion >= gameState.totalQuestions;
    let nextQuestion = null;
    
    if (!isGameComplete) {
      nextQuestion = gameState.questions[gameState.currentQuestion];
    }
    
    this.gameStates.set(gameId, gameState);
    this.saveCreativeData();
    
    return {
      success: true,
      isCorrect,
      correctAnswer: currentQuestion.correctAnswer,
      explanation: currentQuestion.explanation,
      currentScore: gameState.score,
      questionNumber: gameState.currentQuestion + 1,
      totalQuestions: gameState.totalQuestions,
      nextQuestion: nextQuestion,
      gameComplete: isGameComplete,
      finalScore: isGameComplete ? `${gameState.score}/${gameState.totalQuestions}` : null
    };
  }

  // Generate creative writing prompts
  generateWritingPrompts(type = 'general', count = 5) {
    const prompts = {
      story: [
        "A librarian discovers that one book in their collection can predict the future",
        "The last person on Earth receives a phone call",
        "A child's imaginary friend starts leaving physical evidence of their existence",
        "Time stops for everyone except you during your morning commute",
        "A museum security guard notices that the paintings change when no one is looking"
      ],
      character: [
        "A retired superhero working as a substitute teacher",
        "A time traveler stuck in the wrong century trying to blend in",
        "A translator for aliens who doesn't speak any human language",
        "A professional apology writer for celebrities",
        "A person who can hear the thoughts of inanimate objects"
      ],
      setting: [
        "A city where it rains memories instead of water",
        "A library that exists between dimensions",
        "A coffee shop where each table exists in a different time period",
        "An island where lost things wash ashore",
        "A school for children who don't cast shadows"
      ],
      dialogue: [
        "Two AIs discussing what it means to be human",
        "A conversation between past and future versions of yourself",
        "The last conversation between Earth and a departing space colony",
        "A debate between a pessimist and an optimist about the same event",
        "A job interview for the position of 'Professional Daydreamer'"
      ]
    };
    
    const selectedPrompts = prompts[type] || prompts.story;
    
    // Shuffle and return requested count
    const shuffled = [...selectedPrompts].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // Helper methods
  extractTheme(prompt) {
    const themes = {
      friendship: ['friend', 'companion', 'ally', 'together'],
      courage: ['brave', 'courage', 'fear', 'challenge'],
      love: ['love', 'heart', 'romance', 'affection'],
      adventure: ['journey', 'quest', 'explore', 'adventure'],
      growth: ['learn', 'grow', 'change', 'develop'],
      mystery: ['secret', 'hidden', 'unknown', 'mystery']
    };
    
    const words = prompt.toLowerCase().split(/\s+/);
    
    for (const [theme, keywords] of Object.entries(themes)) {
      if (keywords.some(keyword => words.includes(keyword))) {
        return { name: theme, qualities: keywords.join(', ') };
      }
    }
    
    return { name: 'discovery', qualities: 'curiosity, wonder' };
  }

  extractConflict(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('lost') || lowerPrompt.includes('find')) {
      return { type: 'search', description: 'finding something important', obstacles: 'confusion and misdirection' };
    }
    if (lowerPrompt.includes('enemy') || lowerPrompt.includes('villain')) {
      return { type: 'confrontation', description: 'facing a formidable opponent', obstacles: 'danger and deception' };
    }
    if (lowerPrompt.includes('save') || lowerPrompt.includes('rescue')) {
      return { type: 'rescue', description: 'saving someone in peril', obstacles: 'time pressure and hazards' };
    }
    
    return { type: 'challenge', description: 'overcoming a significant obstacle', obstacles: 'doubt and difficulty' };
  }

  suggestCharacters(prompt, genre) {
    const mainCharacter = {
      name: this.generateCharacterName(genre),
      type: this.getCharacterType(prompt, genre),
      traits: this.getCharacterTraits(genre)
    };
    
    const supportingCharacter = {
      name: this.generateCharacterName(genre),
      type: 'ally',
      traits: ['loyal', 'wise', 'resourceful']
    };
    
    return [mainCharacter, supportingCharacter];
  }

  suggestSetting(prompt, genre) {
    const settings = {
      fantasy: { type: 'realm', name: 'Eldermoor', description: 'ancient magic flows freely' },
      'sci-fi': { type: 'station', name: 'Nova Prime', year: '2387', description: 'at the edge of known space' },
      mystery: { type: 'town', name: 'Willowbrook', description: 'where secrets hide behind every door' },
      adventure: { type: 'wilderness', name: 'the Whispering Woods', description: 'where legends come alive' }
    };
    
    return settings[genre] || settings.adventure;
  }

  generateCharacterName(genre) {
    const names = {
      fantasy: ['Aeliana', 'Theron', 'Lyra', 'Gareth', 'Seraphina', 'Darian'],
      'sci-fi': ['Zara', 'Kael', 'Nova', 'Cyrus', 'Luna', 'Orion'],
      mystery: ['Detective Harper', 'Dr. Sterling', 'Professor Ashford', 'Agent Cross'],
      adventure: ['Morgan', 'River', 'Phoenix', 'Storm', 'Sage', 'Atlas']
    };
    
    const nameList = names[genre] || names.adventure;
    return nameList[Math.floor(Math.random() * nameList.length)];
  }

  getCharacterType(prompt, genre) {
    if (prompt.toLowerCase().includes('hero')) return 'hero';
    if (prompt.toLowerCase().includes('detective')) return 'detective';
    if (prompt.toLowerCase().includes('explorer')) return 'explorer';
    
    const types = {
      fantasy: 'adventurer',
      'sci-fi': 'explorer',
      mystery: 'investigator',
      adventure: 'wanderer'
    };
    
    return types[genre] || 'protagonist';
  }

  getCharacterTraits(genre) {
    const traits = {
      fantasy: ['courageous', 'wise', 'determined'],
      'sci-fi': ['innovative', 'logical', 'adaptable'],
      mystery: ['observant', 'analytical', 'persistent'],
      adventure: ['brave', 'resourceful', 'curious']
    };
    
    return traits[genre] || traits.adventure;
  }

  generateDialogue(character, mood) {
    const dialogues = {
      supportive: [
        "We can do this together.",
        "I believe in you.",
        "Don't give up now.",
        "We've come too far to quit."
      ],
      mysterious: [
        "Things are not always what they seem.",
        "The answer lies where you least expect it.",
        "Some secrets are worth keeping.",
        "Trust your instincts."
      ],
      encouraging: [
        "You're stronger than you know.",
        "This is just the beginning.",
        "Every step forward matters.",
        "You've got this."
      ]
    };
    
    const options = dialogues[mood] || dialogues.supportive;
    return options[Math.floor(Math.random() * options.length)];
  }

  // Game helper methods
  getStartingLocation(setting) {
    const locations = {
      fantasy: "The Village of Thornwick",
      'sci-fi': "Space Station Alpha",
      modern: "Downtown Metro City",
      historical: "The Port of Seahaven"
    };
    
    return locations[setting] || locations.fantasy;
  }

  generateAdventureScene(gameState, previousResult = null) {
    // Simplified scene generation
    const location = gameState.story.currentLocation;
    const setting = gameState.setting;
    
    let scene = `You find yourself in ${location}. `;
    
    if (previousResult) {
      scene += `${previousResult.outcome} `;
    }
    
    // Add random encounter or choice
    const encounters = [
      "A mysterious figure approaches you.",
      "You notice something glinting in the distance.",
      "The sound of footsteps echoes nearby.",
      "A path diverges into two directions."
    ];
    
    scene += encounters[Math.floor(Math.random() * encounters.length)];
    
    return {
      description: scene,
      choices: this.generateChoices(gameState),
      location: location
    };
  }

  generateChoices(gameState) {
    return [
      { id: 'explore', text: "Explore the area", risk: 'low' },
      { id: 'interact', text: "Approach carefully", risk: 'medium' },
      { id: 'retreat', text: "Step back and observe", risk: 'low' },
      { id: 'advance', text: "Move forward boldly", risk: 'high' }
    ];
  }

  processGameAction(gameState, action) {
    // Simplified action processing
    const actions = {
      explore: { success: true, outcome: "You discover something interesting.", message: "Your exploration reveals new possibilities." },
      interact: { success: true, outcome: "You make a connection.", message: "Your careful approach pays off." },
      retreat: { success: true, outcome: "You gain valuable perspective.", message: "Sometimes wisdom lies in restraint." },
      advance: { success: Math.random() > 0.3, outcome: "Your boldness is tested.", message: "Fortune favors the brave, but risks remain." }
    };
    
    return actions[action] || actions.explore;
  }

  generateTriviaQuestions(category, difficulty, count) {
    // Simplified trivia generation - in a real system, you'd have a comprehensive database
    const questionTemplates = {
      general: [
        { question: "What is the capital of Australia?", correctAnswer: "Canberra", explanation: "While Sydney and Melbourne are larger, Canberra is the capital." },
        { question: "Which planet is known as the Red Planet?", correctAnswer: "Mars", explanation: "Mars appears red due to iron oxide on its surface." },
        { question: "What year did World War II end?", correctAnswer: "1945", explanation: "WWII ended in 1945 with Japan's surrender in September." }
      ],
      science: [
        { question: "What is the chemical symbol for gold?", correctAnswer: "Au", explanation: "Au comes from the Latin word 'aurum' meaning gold." },
        { question: "How many chambers does a human heart have?", correctAnswer: "4", explanation: "The heart has two atria and two ventricles." },
        { question: "What is the speed of light in a vacuum?", correctAnswer: "299,792,458 m/s", explanation: "This is approximately 300,000 kilometers per second." }
      ]
    };
    
    const questions = questionTemplates[category] || questionTemplates.general;
    
    // Repeat questions if needed to reach count
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(questions[i % questions.length]);
    }
    
    return result;
  }

  extractImagery(prompt) {
    const words = prompt.toLowerCase().split(/\s+/);
    const imagery = {
      nature: words.filter(w => ['tree', 'flower', 'sky', 'ocean', 'mountain', 'river', 'sun', 'moon', 'star'].includes(w)),
      emotion: words.filter(w => ['love', 'joy', 'sorrow', 'hope', 'fear', 'peace', 'anger', 'wonder'].includes(w)),
      color: words.filter(w => ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'black', 'white', 'gold', 'silver'].includes(w)),
      time: words.filter(w => ['dawn', 'morning', 'noon', 'evening', 'night', 'twilight', 'midnight', 'sunrise', 'sunset'].includes(w))
    };
    
    return imagery;
  }

  generateStanzaLines(imagery, theme, mood, isFirst) {
    // Simplified line generation based on extracted imagery
    const lines = [];
    
    if (isFirst) {
      lines.push("In moments of quiet reflection,");
      lines.push("Where thoughts and dreams converge,");
    }
    
    if (imagery.nature.length > 0) {
      lines.push(`Like ${imagery.nature[0]} in the gentle breeze,`);
    }
    
    if (imagery.emotion.length > 0) {
      lines.push(`${imagery.emotion[0].charAt(0).toUpperCase() + imagery.emotion[0].slice(1)} flows through every heartbeat,`);
    }
    
    lines.push("Creating ripples in the fabric of time.");
    
    return lines;
  }

  // Utility methods
  countWords(text) {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  estimateReadingTime(text) {
    const wordsPerMinute = 200;
    const words = this.countWords(text);
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min`;
  }

  addToCreativeHistory(type, prompt, result) {
    this.creativeHistory.push({
      type,
      prompt,
      result: {
        ...result,
        content: result.content.substring(0, 200) // Store only preview
      },
      timestamp: new Date().toISOString()
    });
    
    this.saveCreativeData();
  }

  // Get creative capabilities
  getCapabilities() {
    return this.capabilities;
  }

  // Get active games
  getActiveGames() {
    return Array.from(this.gameStates.values()).map(game => ({
      id: game.id,
      type: game.type,
      setting: game.setting,
      startedAt: game.startedAt,
      status: 'active'
    }));
  }

  // Get creative history
  getCreativeHistory(type = null, limit = 20) {
    let history = this.creativeHistory;
    
    if (type) {
      history = history.filter(item => item.type === type);
    }
    
    return history.slice(-limit).reverse();
  }
}

export default new CreativeAssistantService();