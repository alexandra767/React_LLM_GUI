// Simplified integration service for Electron that doesn't load Google APIs
import appleCalendarService from './AppleCalendarService';
import ElectronGoogleAuthDirect from './ElectronGoogleAuthDirect';
import webSearchService from './WebSearchService';

class ElectronIntegrationService {
  constructor() {
    this.isAppleAuthorized = appleCalendarService.loadAuthState();
    this.googleAuth = new ElectronGoogleAuthDirect();
    this.isGoogleAuthorized = this.googleAuth.isAuthenticated();
  }

  // Apple Calendar Integration (using CalDAV)
  async connectAppleCalendar(username, password) {
    try {
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
    if (!this.isAppleAuthorized) {
      throw new Error('Not connected to Apple Calendar. Please connect first.');
    }

    try {
      const events = await appleCalendarService.getEvents(startDate, endDate);
      return events;
    } catch (error) {
      console.error('Failed to fetch Apple Calendar events:', error);
      throw error;
    }
  }
  
  disconnectAppleCalendar() {
    appleCalendarService.disconnect();
    this.isAppleAuthorized = false;
  }

  formatCalendarEvents(events) {
    return events.map(event => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      return `📅 ${event.title}\n` +
             `   Time: ${start.toLocaleString()} - ${end.toLocaleTimeString()}\n` +
             `   ${event.location ? `Location: ${event.location}` : ''}`;
    }).join('\n\n');
  }

  // Web Search Integration
  async webSearch(query) {
    try {
      // Use the enhanced web search service
      const results = await webSearchService.search(query);
      return results;
    } catch (error) {
      console.error('Web search failed:', error);
      
      // Fallback to basic search links
      const encodedQuery = encodeURIComponent(query);
      return [
        {
          title: `Google Search: "${query}"`,
          url: `https://www.google.com/search?q=${encodedQuery}`,
          snippet: `Search Google for the latest information about "${query}".`,
          source: 'Google'
        },
        {
          title: `News Search: "${query}"`,
          url: `https://news.google.com/search?q=${encodedQuery}`,
          snippet: `Search Google News for recent articles about "${query}".`,
          source: 'Google News'
        }
      ];
    }
  }

  formatWebSearchResults(results) {
    // Use the enhanced formatting from WebSearchService
    return webSearchService.formatResults(results);
  }

  // Google Drive Integration for Electron
  async signInGoogle() {
    try {
      await this.googleAuth.authenticate();
      this.isGoogleAuthorized = true;
      return true;
    } catch (error) {
      console.error('[ElectronIntegrationService] Google sign in failed:', error);
      throw error;
    }
  }

  async listGoogleDriveFiles(query) {
    console.log('[ElectronIntegrationService] listGoogleDriveFiles called with query:', query);

    try {
      // Get valid access token
      const accessToken = await this.googleAuth.getValidAccessToken();
      const apiKey = this.googleAuth.getApiKey();
      
      // Build API URL
      let url = 'https://www.googleapis.com/drive/v3/files';
      const params = new URLSearchParams({
        pageSize: '50', // Increased from 20 to 50
        fields: 'files(id,name,mimeType,modifiedTime,size,webViewLink)',
        orderBy: 'modifiedTime desc'
      });
      
      // Add API key if no access token
      if (!accessToken && apiKey) {
        params.append('key', apiKey);
      }
      
      // Add query if provided
      if (query) {
        params.append('q', `name contains '${query}'`);
      }
      
      url += '?' + params.toString();
      
      console.log('[ElectronIntegrationService] Fetching from Google Drive API:', url);
      
      const headers = {
        'Accept': 'application/json'
      };
      
      // Add authorization header if we have a real access token
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch(url, {
        headers: headers
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[ElectronIntegrationService] Google Drive API error:', response.status, error);
        
        // If unauthorized, try to refresh token
        if (response.status === 401) {
          await this.googleAuth.refreshAccessToken();
          // Retry the request
          return this.listGoogleDriveFiles(query);
        }
        
        // If forbidden with API key, show instructions
        if (response.status === 403 && !accessToken) {
          return [{
            id: 'auth-needed',
            name: '⚠️ Google Drive requires authentication',
            mimeType: 'text/plain',
            modifiedTime: new Date().toISOString(),
            size: 0,
            webViewLink: '#'
          }, {
            id: 'get-token',
            name: '📝 To get an access token:',
            mimeType: 'text/plain',
            modifiedTime: new Date().toISOString(),
            size: 0,
            webViewLink: '#'
          }, {
            id: 'step1',
            name: '1. Open Developer Tools (Cmd+Option+I)',
            mimeType: 'text/plain',
            modifiedTime: new Date().toISOString(),
            size: 0,
            webViewLink: '#'
          }, {
            id: 'step2',
            name: '2. Go to Console tab',
            mimeType: 'text/plain',
            modifiedTime: new Date().toISOString(),
            size: 0,
            webViewLink: '#'
          }, {
            id: 'step3',
            name: '3. Run: localStorage.setItem("google_access_token", "YOUR_TOKEN")',
            mimeType: 'text/plain',
            modifiedTime: new Date().toISOString(),
            size: 0,
            webViewLink: '#'
          }, {
            id: 'step4',
            name: '4. Get token from: https://developers.google.com/oauthplayground/',
            mimeType: 'text/plain',
            modifiedTime: new Date().toISOString(),
            size: 0,
            webViewLink: '#'
          }];
        }
        
        throw new Error(`Google Drive API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[ElectronIntegrationService] Google Drive files received:', data.files?.length || 0);
      
      return data.files || [];
    } catch (error) {
      console.error('[ElectronIntegrationService] Failed to fetch Google Drive files:', error);
      
      // Return demo files as fallback
      const demoFiles = [
        {
          id: 'demo-1',
          name: 'Error: ' + error.message,
          mimeType: 'text/plain',
          modifiedTime: new Date().toISOString(),
          size: 0,
          webViewLink: '#'
        }
      ];
      
      return demoFiles;
    }
  }

  formatDriveFiles(files) {
    if (files.length === 0) return 'No files found.';
    
    return files.map(file => {
      return `📄 ${file.name}\n` +
             `   Type: ${file.mimeType}\n` +
             `   Modified: ${new Date(file.modifiedTime).toLocaleString()}\n` +
             `   Size: ${this.formatFileSize(file.size || 0)}`;
    }).join('\n\n');
  }

  async getGoogleDriveFilePreview(fileId) {
    console.log('[ElectronIntegrationService] Getting file preview for:', fileId);
    
    try {
      const accessToken = await this.googleAuth.getValidAccessToken();
      
      // First get file metadata to check type
      const metadataUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size`;
      const metadataResponse = await fetch(metadataUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!metadataResponse.ok) {
        throw new Error(`Failed to get file metadata: ${metadataResponse.status}`);
      }

      const metadata = await metadataResponse.json();
      const mimeType = metadata.mimeType;
      
      // Determine how to get content based on file type
      let contentUrl;
      let isExport = false;
      
      if (mimeType.includes('text') || 
          mimeType.includes('json') || 
          mimeType.includes('javascript') ||
          mimeType.includes('xml') ||
          mimeType.includes('csv')) {
        // Direct download for text files
        contentUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      } else if (mimeType.includes('google-apps.document')) {
        // Export Google Docs as plain text
        contentUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
        isExport = true;
      } else if (mimeType.includes('google-apps.spreadsheet')) {
        // Export Google Sheets as CSV
        contentUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`;
        isExport = true;
      } else if (mimeType.includes('google-apps.presentation')) {
        // Export Google Slides as plain text
        contentUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
        isExport = true;
      } else {
        // For other types, return just metadata
        return {
          ...metadata,
          preview: '[Binary file - preview not available]'
        };
      }
      
      // Get content
      const contentResponse = await fetch(contentUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!contentResponse.ok) {
        throw new Error(`Failed to get file content: ${contentResponse.status}`);
      }
      
      const content = await contentResponse.text();
      const preview = content.substring(0, 500) + (content.length > 500 ? '...' : '');
      
      return {
        ...metadata,
        preview: preview
      };
    } catch (error) {
      console.error('[ElectronIntegrationService] Failed to get file preview:', error);
      return null;
    }
  }

  async listGoogleDriveFilesWithPreviews(query) {
    const files = await this.listGoogleDriveFiles(query);
    
    // Get previews for first 10 text-based files (increased from 5)
    const filesWithPreviews = await Promise.all(
      files.slice(0, 10).map(async (file) => {
        if (file.mimeType && (
          file.mimeType.includes('text') ||
          file.mimeType.includes('google-apps.document') ||
          file.mimeType.includes('google-apps.spreadsheet') ||
          file.mimeType.includes('json') ||
          file.mimeType.includes('javascript')
        )) {
          const preview = await this.getGoogleDriveFilePreview(file.id);
          if (preview) {
            return { ...file, preview: preview.preview };
          }
        }
        return file;
      })
    );
    
    return filesWithPreviews;
  }

  formatDriveFilesWithPreviews(files) {
    if (files.length === 0) return 'No files found.';
    
    return files.map(file => {
      let result = `📄 ${file.name}\n` +
                   `   Type: ${file.mimeType}\n` +
                   `   Modified: ${new Date(file.modifiedTime).toLocaleString()}\n` +
                   `   Size: ${this.formatFileSize(file.size || 0)}`;
      
      if (file.preview) {
        result += `\n   Preview: ${file.preview}`;
      }
      
      return result;
    }).join('\n\n');
  }

  async searchGmail(query) {
    console.log('[ElectronIntegrationService] searchGmail called with query:', query);
    
    try {
      // Get valid access token
      const accessToken = await this.googleAuth.getValidAccessToken();
      
      // Build Gmail API URL
      const params = new URLSearchParams({
        q: query || 'is:unread',
        maxResults: '25' // Increased from 10 to 25
      });
      
      const url = `https://www.googleapis.com/gmail/v1/users/me/messages?${params}`;
      
      console.log('[ElectronIntegrationService] Searching Gmail:', url);
      
      const listResponse = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!listResponse.ok) {
        if (listResponse.status === 401) {
          await this.googleAuth.refreshAccessToken();
          return this.searchGmail(query);
        }
        throw new Error(`Gmail API error: ${listResponse.status}`);
      }

      const listData = await listResponse.json();
      const messageIds = listData.messages || [];
      
      // Fetch details for each message (increased limit)
      const messages = await Promise.all(
        messageIds.slice(0, 15).map(async (msg) => {
          const detailUrl = `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}`;
          const detailResponse = await fetch(detailUrl, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          });
          
          if (detailResponse.ok) {
            return await detailResponse.json();
          }
          return null;
        })
      );
      
      return messages.filter(m => m !== null);
    } catch (error) {
      console.error('[ElectronIntegrationService] Gmail search failed:', error);
      
      // Return demo emails as fallback
      return [
        {
          id: 'error-msg',
          snippet: 'Error: ' + error.message,
          payload: {
            headers: [
              { name: 'Subject', value: 'Gmail Error' },
              { name: 'From', value: 'system' },
              { name: 'Date', value: new Date().toISOString() }
            ]
          }
        }
      ];
    }
  }

  formatGmailMessages(messages) {
    if (!messages || messages.length === 0) return 'No messages found.';
    
    return messages.map(msg => {
      const headers = msg.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
      const date = headers.find(h => h.name === 'Date')?.value || '';
      
      // Extract body text from the email
      let body = msg.snippet || '';
      
      // Try to get full body text
      if (msg.payload) {
        const extractBody = (payload) => {
          // Check direct body
          if (payload.body?.data) {
            try {
              return atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
            } catch (e) {
              console.error('Failed to decode body:', e);
            }
          }
          
          // Check parts for text/plain
          if (payload.parts) {
            for (const part of payload.parts) {
              if (part.mimeType === 'text/plain' && part.body?.data) {
                try {
                  return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
                } catch (e) {
                  console.error('Failed to decode part:', e);
                }
              }
              // Recursively check nested parts
              if (part.parts) {
                const nestedBody = extractBody(part);
                if (nestedBody) return nestedBody;
              }
            }
          }
          
          return null;
        };
        
        const fullBody = extractBody(msg.payload);
        if (fullBody) {
          // Clean up and truncate body
          body = fullBody
            .replace(/\r\n/g, ' ')
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 500);
          
          if (fullBody.length > 500) {
            body += '...';
          }
        }
      }
      
      return `📧 ${subject}\n` +
             `   From: ${from}\n` +
             `   Date: ${date}\n` +
             `   Content: ${body}`;
    }).join('\n\n');
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export the class, not an instance, to prevent constructor from running on import
export default ElectronIntegrationService;