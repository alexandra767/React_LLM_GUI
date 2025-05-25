// Conditionally import based on environment
const isElectron = typeof window !== 'undefined' && (window.electron || (window.process && window.process.type));

console.log('[commandProcessor] Environment check:', {
  isElectron,
  hasElectron: !!window.electron,
  hasProcess: !!window.process,
  processType: window.process?.type,
  userAgent: navigator.userAgent
});

// Only import the service we need
const getIntegrationService = async () => {
  // Check if running in Electron - use multiple checks
  const inElectron = !!(window.electron || (window.process && window.process.type) || navigator.userAgent.includes('Electron'));
  
  console.log('[commandProcessor] Service selection:', {
    inElectron,
    checks: {
      windowElectron: !!window.electron,
      windowProcess: !!window.process,
      processType: window.process?.type,
      electronInUA: navigator.userAgent.includes('Electron')
    }
  });
  
  if (inElectron) {
    console.log('[commandProcessor] Loading ElectronIntegrationService directly');
    const { default: ElectronIntegrationService } = await import('../services/ElectronIntegrationService');
    return new ElectronIntegrationService();
  } else {
    console.log('[commandProcessor] Loading IntegrationService for web');
    const { default: IntegrationService } = await import('../services/IntegrationService');
    return new IntegrationService();
  }
};

export const processCommand = async (message) => {
  // Get the appropriate service
  const service = await getIntegrationService();
  // Check if message starts with @
  if (!message.startsWith('@')) {
    return null;
  }

  // Parse command and arguments
  const parts = message.split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');

  try {
    switch (command) {
      case '@gmail':
        // @gmail [search query]
        try {
          // Check authorization first
          if (!service.isGoogleAuthorized) {
            await service.signInGoogle();
          }
          
          const query = args || 'is:unread';
          const messages = await service.searchGmail(query);
          const formattedGmail = service.formatGmailMessages(messages);
          return {
            type: 'integration',
            content: `Gmail search results for "${query}":\n\n${formattedGmail || 'No messages found.'}`
          };
        } catch (gmailError) {
          console.error('Gmail error:', gmailError);
          if (gmailError.message && gmailError.message.includes('not configured')) {
            return {
              type: 'error',
              content: 'Gmail not configured. Please add your Google Client ID (and optionally Client Secret) in Settings → API Keys & Integrations.'
            };
          }
          return {
            type: 'error',
            content: `Gmail error: ${gmailError.message}`
          };
        }

      case '@drive':
        // @drive [search query]
        try {
          // Check authorization first
          if (!service.isGoogleAuthorized) {
            await service.signInGoogle();
          }
          
          // Check if the service has the new preview methods
          if (service.listGoogleDriveFilesWithPreviews) {
            const files = await service.listGoogleDriveFilesWithPreviews(args);
            const formattedDrive = service.formatDriveFilesWithPreviews(files);
            return {
              type: 'integration',
              content: `Your Google Drive files${args ? ` matching "${args}"` : ''} (with previews):\n\n${formattedDrive || 'No files found.'}`
            };
          } else {
            // Fallback to old method
            const files = await service.listGoogleDriveFiles(args);
            const formattedDrive = service.formatDriveFiles(files);
            return {
              type: 'integration',
              content: `Your Google Drive files${args ? ` matching "${args}"` : ''}:\n\n${formattedDrive || 'No files found.'}`
            };
          }
        } catch (driveError) {
          console.error('Google Drive error:', driveError);
          if (driveError.message && driveError.message.includes('not configured')) {
            return {
              type: 'error',
              content: 'Google Drive not configured. Please add your Google Client ID (and optionally Client Secret) in Settings → API Keys & Integrations.'
            };
          }
          return {
            type: 'error',
            content: `Google Drive error: ${driveError.message}`
          };
        }

      case '@calendar':
        // @calendar [days ahead, default 7]
        if (!service.isAppleAuthorized) {
          // Try to use saved credentials
          const username = localStorage.getItem('apple_calendar_username');
          const password = localStorage.getItem('apple_calendar_password');
          
          if (!username || !password) {
            return {
              type: 'error',
              content: 'Apple Calendar not configured. Please add your iCloud credentials in Settings → API Keys & Integrations.'
            };
          }
          
          await service.connectAppleCalendar(username, password);
        }
        
        const daysAhead = parseInt(args) || 7;
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);
        const events = await service.getAppleCalendarEvents(startDate, endDate);
        const formattedEvents = service.formatCalendarEvents(events);
        return {
          type: 'integration',
          content: `Your calendar events for the next ${daysAhead} days:\n\n${formattedEvents || 'No events found.'}`
        };

      case '@search':
      case '@web':
        // @search [query] or @web [query]
        if (!args) {
          return {
            type: 'error',
            content: 'Please provide a search query. Example: @search weather today'
          };
        }
        const results = await service.webSearch(args);
        const formattedResults = service.formatWebSearchResults(results);
        return {
          type: 'integration',
          content: `Web search results for "${args}":\n\n${formattedResults}`
        };

      case '@help':
        // @help - show available commands
        const isElectron = typeof window !== 'undefined' && window.process && window.process.type;
        
        if (isElectron) {
          return {
            type: 'help',
            content: `Available commands in Electron:
• @search [query] - Search the web
• @calendar [days] - Show Apple Calendar events (requires iCloud credentials)
• @help - Show this help message

Note: Google integrations (@gmail, @drive) are not available in the Electron version yet due to OAuth limitations.

Examples:
• @search weather tomorrow
• @calendar 7
• @help`
          };
        }
        
        return {
          type: 'help',
          content: `Available commands:
• @gmail [search] - Search Gmail (e.g., @gmail from:john)
• @drive [search] - List or search Google Drive files
• @calendar [days] - Show calendar events (default: 7 days)
• @search [query] - Search the web
• @help - Show this help message

Examples:
• @gmail is:unread
• @drive presentation
• @calendar 14
• @search weather tomorrow`
        };

      default:
        return {
          type: 'error',
          content: `Unknown command: ${command}. Type @help for available commands.`
        };
    }
  } catch (error) {
    console.error('Command processing error:', error);
    let errorMessage = 'An unknown error occurred';
    
    if (error && error.message) {
      errorMessage = error.message;
    } else if (error && error.error) {
      errorMessage = error.error;
    } else if (error && error.response) {
      errorMessage = error.response;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = JSON.stringify(error);
    }
    
    return {
      type: 'error',
      content: `Error: ${errorMessage}`
    };
  }
};