// Service for handling external integrations (Google Drive, Apple Calendar, etc.)
import appleCalendarService from './AppleCalendarService';

class IntegrationService {
  constructor() {
    this.googleAuth = null;
    this.appleAuth = null;
    this.isGoogleAuthorized = false;
    this.isAppleAuthorized = false;
    
    // Load Apple Calendar auth state
    this.isAppleAuthorized = appleCalendarService.loadAuthState();
  }

  // Google Drive Integration
  async initGoogleDrive() {
    // In Electron, we'll use OAuth2 flow
    const CLIENT_ID = localStorage.getItem('google_client_id') || '';
    const API_KEY = localStorage.getItem('google_api_key') || '';
    const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly';
    
    if (!CLIENT_ID || !API_KEY) {
      throw new Error('Google API credentials not configured. Please add them in Settings.');
    }

    // Load Google API if not already loaded
    if (window.gapi) {
      // Google API already loaded, just initialize
      return new Promise((resolve, reject) => {
        window.gapi.load('client:auth2', async () => {
          try {
            await window.gapi.client.init({
              apiKey: API_KEY,
              clientId: CLIENT_ID,
              scope: SCOPES,
              discoveryDocs: [
                'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
                'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'
              ]
            });
            
            this.googleAuth = window.gapi.auth2.getAuthInstance();
            this.isGoogleAuthorized = this.googleAuth.isSignedIn.get();
            resolve(this.isGoogleAuthorized);
          } catch (error) {
            reject(error);
          }
        });
      });
    }

    // Load Google API script
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client:auth2', async () => {
          try {
            await window.gapi.client.init({
              apiKey: API_KEY,
              clientId: CLIENT_ID,
              scope: SCOPES,
              discoveryDocs: [
                'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
                'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'
              ]
            });
            
            this.googleAuth = window.gapi.auth2.getAuthInstance();
            this.isGoogleAuthorized = this.googleAuth.isSignedIn.get();
            resolve(this.isGoogleAuthorized);
          } catch (error) {
            reject(error);
          }
        });
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  async signInGoogle() {
    if (!this.googleAuth) {
      await this.initGoogleDrive();
    }
    
    try {
      const user = await this.googleAuth.signIn();
      this.isGoogleAuthorized = true;
      return user;
    } catch (error) {
      console.error('Google sign in failed:', error);
      throw error;
    }
  }

  async listGoogleDriveFiles(query = '') {
    if (!this.isGoogleAuthorized) {
      throw new Error('Not authorized. Please sign in to Google Drive first.');
    }

    try {
      await window.gapi.client.load('drive', 'v3');
      
      const response = await window.gapi.client.drive.files.list({
        pageSize: 20,
        fields: 'files(id, name, mimeType, modifiedTime, size, webViewLink)',
        q: query || "trashed = false",
        orderBy: 'modifiedTime desc'
      });

      return response.result.files || [];
    } catch (error) {
      console.error('Failed to list files:', error);
      throw error;
    }
  }

  async getGoogleDriveFile(fileId) {
    if (!this.isGoogleAuthorized) {
      throw new Error('Not authorized. Please sign in to Google Drive first.');
    }

    try {
      // Get file metadata
      const metadataResponse = await window.gapi.client.drive.files.get({
        fileId: fileId,
        fields: 'id, name, mimeType, size'
      });

      // Get file content based on type
      let content = null;
      const mimeType = metadataResponse.result.mimeType;

      if (mimeType.includes('text') || 
          mimeType.includes('json') || 
          mimeType.includes('javascript') ||
          mimeType.includes('xml')) {
        // Get text content
        const contentResponse = await window.gapi.client.drive.files.get({
          fileId: fileId,
          alt: 'media'
        });
        content = contentResponse.body;
      } else if (mimeType.includes('document')) {
        // Export Google Docs as plain text
        const exportResponse = await window.gapi.client.drive.files.export({
          fileId: fileId,
          mimeType: 'text/plain'
        });
        content = exportResponse.body;
      } else if (mimeType.includes('spreadsheet')) {
        // Export Google Sheets as CSV
        const exportResponse = await window.gapi.client.drive.files.export({
          fileId: fileId,
          mimeType: 'text/csv'
        });
        content = exportResponse.body;
      }

      return {
        ...metadataResponse.result,
        content: content
      };
    } catch (error) {
      console.error('Failed to get file:', error);
      throw error;
    }
  }

  // Apple Calendar Integration (using CalDAV)
  async connectAppleCalendar(username, password) {
    try {
      // Use the Apple Calendar service
      await appleCalendarService.connect(username, password);
      this.isAppleAuthorized = true;
      return true;
    } catch (error) {
      console.error('Failed to connect to Apple Calendar:', error);
      this.isAppleAuthorized = false;
      throw error;
    }
  }

  async getAppleCalendarEvents(startDate, endDate) {
    try {
      // Try to get events from Apple Calendar service
      const events = await appleCalendarService.getEvents(startDate, endDate);
      return events;
    } catch (error) {
      console.error('Failed to fetch Apple Calendar events:', error);
      
      // If we get a CORS or auth error, return demo events
      if (error.message.includes('CORS') || 
          error.message.includes('not connected') || 
          error.message.includes('Not connected') ||
          error.message.includes('Failed to fetch') ||
          error.message.includes('Not authenticated')) {
        console.log('Falling back to demo events due to connection issue');
        return appleCalendarService.getDemoEvents(startDate, endDate);
      }
      
      throw error;
    }
  }
  
  // Disconnect from Apple Calendar
  disconnectAppleCalendar() {
    appleCalendarService.disconnect();
    this.isAppleAuthorized = false;
  }

  // Helper to format calendar events for chat
  formatCalendarEvents(events) {
    return events.map(event => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      return `📅 ${event.title}\n` +
             `   Time: ${start.toLocaleString()} - ${end.toLocaleTimeString()}\n` +
             `   ${event.location ? `Location: ${event.location}` : ''}`;
    }).join('\n\n');
  }

  // Gmail Integration
  async searchGmail(query, maxResults = 10) {
    if (!this.isGoogleAuthorized) {
      throw new Error('Not authorized. Please sign in to Google first.');
    }

    try {
      await window.gapi.client.load('gmail', 'v1');
      
      const response = await window.gapi.client.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: maxResults
      });

      if (!response.result.messages) {
        return [];
      }

      // Get full message details for each result
      const messages = await Promise.all(
        response.result.messages.map(async (msg) => {
          const detail = await window.gapi.client.gmail.users.messages.get({
            userId: 'me',
            id: msg.id
          });
          
          const headers = detail.result.payload.headers;
          const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
          const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
          const date = headers.find(h => h.name === 'Date')?.value || '';
          
          // Extract body text
          let body = '';
          if (detail.result.payload.body?.data) {
            body = atob(detail.result.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          } else if (detail.result.payload.parts) {
            const textPart = detail.result.payload.parts.find(
              part => part.mimeType === 'text/plain'
            );
            if (textPart?.body?.data) {
              body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
            }
          }
          
          return {
            id: msg.id,
            subject,
            from,
            date,
            snippet: body.substring(0, 200) + '...'
          };
        })
      );

      return messages;
    } catch (error) {
      console.error('Gmail search failed:', error);
      throw error;
    }
  }

  // Web Search Integration
  async webSearch(query) {
    try {
      // Using DuckDuckGo Instant Answer API (free, no auth required)
      // Note: This API is limited and won't return full search results
      // For production, consider Google Custom Search or Bing Search API
      
      const encodedQuery = encodeURIComponent(query);
      const url = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`;
      
      // Since this is a CORS-restricted API, we'll need to use a proxy in production
      // For now, we'll provide a fallback with instructions
      try {
        const response = await fetch(url);
        const data = await response.json();
        
        const results = [];
        
        // Add instant answer if available
        if (data.Abstract && data.AbstractURL) {
          results.push({
            title: data.Heading || query,
            url: data.AbstractURL,
            snippet: data.Abstract
          });
        }
        
        // Add related topics
        if (data.RelatedTopics) {
          data.RelatedTopics.slice(0, 5).forEach(topic => {
            if (topic.FirstURL && topic.Text) {
              results.push({
                title: topic.Text.split(' - ')[0] || topic.Text,
                url: topic.FirstURL,
                snippet: topic.Text
              });
            }
          });
        }
        
        if (results.length > 0) {
          return results;
        }
      } catch (corsError) {
        console.log('CORS error with DuckDuckGo API, using fallback');
      }
      
      // Fallback: Provide search engine links
      return [
        {
          title: `Search Google for "${query}"`,
          url: `https://www.google.com/search?q=${encodedQuery}`,
          snippet: 'Click to search on Google'
        },
        {
          title: `Search DuckDuckGo for "${query}"`,
          url: `https://duckduckgo.com/?q=${encodedQuery}`,
          snippet: 'Click to search on DuckDuckGo (privacy-focused)'
        },
        {
          title: `Search Bing for "${query}"`,
          url: `https://www.bing.com/search?q=${encodedQuery}`,
          snippet: 'Click to search on Bing'
        }
      ];
    } catch (error) {
      console.error('Web search failed:', error);
      throw error;
    }
  }

  // Helper to format Gmail messages for chat
  formatGmailMessages(messages) {
    return messages.map(msg => {
      return `📧 ${msg.subject}\n` +
             `   From: ${msg.from}\n` +
             `   Date: ${msg.date}\n` +
             `   Preview: ${msg.snippet}`;
    }).join('\n\n');
  }

  // Helper to format web search results for chat
  formatWebSearchResults(results) {
    return results.map(result => {
      return `🔍 ${result.title}\n` +
             `   ${result.url}\n` +
             `   ${result.snippet}`;
    }).join('\n\n');
  }

  // Helper to format Google Drive files for chat
  formatDriveFiles(files) {
    return files.map(file => {
      return `📄 ${file.name}\n` +
             `   Type: ${file.mimeType}\n` +
             `   Modified: ${new Date(file.modifiedTime).toLocaleString()}\n` +
             `   ${file.size ? `Size: ${this.formatFileSize(parseInt(file.size))}` : ''}`;
    }).join('\n\n');
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Helper to format calendar events for chat
  formatCalendarEvents(events) {
    if (!events || events.length === 0) {
      return 'No calendar events found for the specified period.';
    }

    return events.map(event => {
      const startTime = new Date(event.start).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      const endTime = event.end ? new Date(event.end).toLocaleString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }) : '';

      let eventStr = `📅 ${event.title}\n`;
      eventStr += `   ${startTime}`;
      if (endTime) {
        eventStr += ` - ${endTime}`;
      }
      if (event.location) {
        eventStr += `\n   📍 ${event.location}`;
      }
      if (event.description) {
        // Truncate long descriptions
        const desc = event.description.length > 100 
          ? event.description.substring(0, 100) + '...' 
          : event.description;
        eventStr += `\n   ${desc}`;
      }
      
      return eventStr;
    }).join('\n\n');
  }

  // Google Drive file operations (stub methods for web compatibility)
  async uploadGoogleDriveFile(fileDetails) {
    return {
      content: `❌ File upload not supported in web mode. Please use the Electron version for full Google Drive functionality.`
    };
  }

  async downloadGoogleDriveFile(fileDetails) {
    return {
      content: `❌ File download not supported in web mode. Please use the Electron version for full Google Drive functionality.`
    };
  }

  async shareGoogleDriveFile(shareDetails) {
    return {
      content: `❌ File sharing not supported in web mode. Please use the Electron version for full Google Drive functionality.`
    };
  }

  async deleteGoogleDriveFile(fileDetails) {
    return {
      content: `❌ File deletion not supported in web mode. Please use the Electron version for full Google Drive functionality.`
    };
  }

  async createGoogleDriveFolder(folderDetails) {
    return {
      content: `❌ Folder creation not supported in web mode. Please use the Electron version for full Google Drive functionality.`
    };
  }

  async moveGoogleDriveFile(moveDetails) {
    return {
      content: `❌ File moving not supported in web mode. Please use the Electron version for full Google Drive functionality.`
    };
  }
}

export default new IntegrationService();