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
          console.log('[Drive] Checking Google auth status:', {
            isGoogleAuthorized: service.isGoogleAuthorized,
            hasRefreshToken: !!localStorage.getItem('google_refresh_token'),
            hasAccessToken: !!localStorage.getItem('google_access_token'),
            hasClientId: !!localStorage.getItem('google_client_id')
          });
          
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
        try {
          // Use Google Calendar instead of Apple Calendar
          const accessToken = localStorage.getItem('google_access_token');
          const refreshToken = localStorage.getItem('google_refresh_token');
          
          if (!refreshToken && !accessToken) {
            return {
              type: 'error',
              content: 'Google Calendar not configured. Please authenticate with @google auth or add tokens in Settings.'
            };
          }
          
          const daysAhead = parseInt(args) || 7;
          const startDate = new Date();
          const endDate = new Date(startDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);
          
          // Call Google Calendar API
          const params = new URLSearchParams({
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: '20'
          });
          
          const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          });
          
          if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
              // Try to refresh the token
              console.log('[Calendar] Got 401/403, attempting token refresh...');
              
              // Use the refresh token to get a new access token
              const clientId = localStorage.getItem('google_client_id');
              const clientSecret = localStorage.getItem('google_client_secret');
              const refreshToken = localStorage.getItem('google_refresh_token');
              
              if (refreshToken) {
                const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                  body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    refresh_token: refreshToken,
                    grant_type: 'refresh_token'
                  })
                });
                
                if (tokenResponse.ok) {
                  const tokenData = await tokenResponse.json();
                  localStorage.setItem('google_access_token', tokenData.access_token);
                  console.log('[Calendar] Token refreshed successfully');
                  
                  // Retry ONCE with new token (avoid infinite loop)
                  const retryResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
                    headers: {
                      'Authorization': `Bearer ${tokenData.access_token}`,
                      'Accept': 'application/json'
                    }
                  });
                  
                  if (!retryResponse.ok) {
                    const errorData = await retryResponse.json();
                    console.error('[Calendar] Still failing after token refresh:', errorData);
                    throw new Error('Calendar API not accessible. Please enable Google Calendar API in Google Cloud Console.');
                  }
                  
                  response = retryResponse;
                } else {
                  console.error('[Calendar] Token refresh failed');
                  throw new Error('Failed to refresh access token');
                }
              }
            }
            
            // Get more error details
            let errorMessage = `Google Calendar API error: ${response.status}`;
            try {
              const errorData = await response.json();
              console.error('[Calendar] Error details:', errorData);
              if (errorData.error?.message) {
                errorMessage = errorData.error.message;
              }
            } catch (e) {
              // Couldn't parse error
            }
            
            throw new Error(errorMessage);
          }
          
          const data = await response.json();
          const events = data.items || [];
          
          if (events.length === 0) {
            return {
              type: 'integration',
              content: `No calendar events found for the next ${daysAhead} days.`
            };
          }
          
          // Format events
          const formattedEvents = events.map(event => {
            const start = event.start.dateTime || event.start.date;
            const end = event.end.dateTime || event.end.date;
            const startDate = new Date(start);
            const endDate = new Date(end);
            
            const dateStr = startDate.toLocaleDateString();
            const timeStr = event.start.dateTime ? 
              `${startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 
              'All day';
            
            return `📅 ${event.summary || 'No title'}\n   ${dateStr} ${timeStr}${event.location ? '\n   📍 ' + event.location : ''}`;
          }).join('\n\n');
          
          return {
            type: 'integration',
            content: `Your Google Calendar events for the next ${daysAhead} days:\n\n${formattedEvents}`
          };
        } catch (error) {
          console.error('Calendar error:', error);
          return {
            type: 'error',
            content: `Calendar error: ${error.message}`
          };
        }

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
• @gmail [search] - Search Gmail (e.g., @gmail from:john)
• @drive [search] - List or search Google Drive files
• @calendar [days] - Show Google Calendar events (default: 7 days)
• @help - Show this help message

Examples:
• @gmail is:unread
• @drive presentation
• @calendar 14
• @search weather tomorrow
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