// Memory Initialization Service
// Ensures memory system is loaded early in app lifecycle

class MemoryInitService {
  constructor() {
    this.memoryService = null;
    this.isInitialized = false;
    this.initPromise = null;
  }

  async initialize() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  async doInitialize() {
    try {
      console.log('[MemoryInit] 🚀 Initializing memory system early...');
      
      // Load ExternalMemoryService
      const { default: ExternalMemoryService } = await import('./ExternalMemoryService');
      this.memoryService = ExternalMemoryService;
      
      // Ensure it's fully initialized
      await this.memoryService.ensureInitialized();
      
      this.isInitialized = true;
      console.log('[MemoryInit] ✅ Memory system initialized successfully');
      
      // Log memory status for debugging
      const context = await this.memoryService.getRelevantContext('test');
      const userName = context.personal?.name?.value || context.personal?.user_name?.value;
      console.log('[MemoryInit] 🧠 Memory status:', {
        userName: userName,
        personalFacts: Object.keys(context.personal || {}),
        conversationCount: context.conversations?.length || 0,
        relationshipCount: Object.keys(context.relationships || {}).length
      });
      
      return this.memoryService;
    } catch (error) {
      console.error('[MemoryInit] ❌ Failed to initialize memory system:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  getMemoryService() {
    return this.memoryService;
  }

  isReady() {
    return this.isInitialized && this.memoryService;
  }
}

// Create singleton instance
const memoryInitService = new MemoryInitService();

export default memoryInitService;