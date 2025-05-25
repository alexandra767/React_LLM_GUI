// Factory to create the appropriate integration service without instantiating it during import
class IntegrationServiceFactory {
  static async createService() {
    const isElectron = typeof window !== 'undefined' && window.process && window.process.type;
    
    console.log('[IntegrationServiceFactory] Creating service for:', isElectron ? 'Electron' : 'Web');
    
    if (isElectron) {
      console.log('[IntegrationServiceFactory] Loading ElectronIntegrationService...');
      const { default: ElectronIntegrationService } = await import('./ElectronIntegrationService');
      console.log('[IntegrationServiceFactory] Creating new ElectronIntegrationService instance');
      return new ElectronIntegrationService();
    } else {
      console.log('[IntegrationServiceFactory] Loading IntegrationService...');
      const { default: IntegrationService } = await import('./IntegrationService');
      console.log('[IntegrationServiceFactory] Creating new IntegrationService instance');
      return new IntegrationService();
    }
  }
}

export default IntegrationServiceFactory;