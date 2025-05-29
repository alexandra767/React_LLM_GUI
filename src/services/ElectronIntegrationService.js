// Simplified integration service for Electron that doesn't load Google APIs
import appleCalendarService from './AppleCalendarService';
import macCalendarService from './MacCalendarService';
import googleCalendarService from './GoogleCalendarService';
import ElectronGoogleAuthDirect from './ElectronGoogleAuthDirect';
import ElectronGoogleAuthDirectPatched from './ElectronGoogleAuthDirectPatched';
import webSearchService from './WebSearchService';

// Run migration to ensure backward compatibility
import './MigrateGoogleTokens';

class ElectronIntegrationService {
  constructor() {
    this.isAppleAuthorized = appleCalendarService.loadAuthState();
    this.googleAuth = new ElectronGoogleAuthDirectPatched();
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

  // Google Calendar Integration
  async getGoogleCalendarEvents(startDate, endDate) {
    try {
      const accessToken = await this.googleAuth.getValidAccessToken();
      const events = await googleCalendarService.getEvents(accessToken, startDate, endDate);
      return events;
    } catch (error) {
      console.error('[Integration] Failed to fetch Google Calendar events:', error);
      
      // If we get a 403, try to refresh the token
      if (error.message && error.message.includes('403')) {
        console.log('[Integration] Got 403 error, attempting to refresh token...');
        try {
          // Force token refresh
          await this.googleAuth.refreshAccessToken(true); // Force refresh
          const newAccessToken = await this.googleAuth.getValidAccessToken();
          const events = await googleCalendarService.getEvents(newAccessToken, startDate, endDate);
          return events;
        } catch (refreshError) {
          console.error('[Integration] Token refresh failed:', refreshError);
          throw new Error('Google Calendar access denied. Please re-authenticate with Google.');
        }
      }
      
      throw error;
    }
  }

  formatGoogleCalendarEvents(events) {
    return googleCalendarService.formatEvents(events);
  }

  async getAppleCalendarEvents(startDate, endDate) {
    // Try native Calendar.app access if available
    if (macCalendarService.isAvailable()) {
      try {
        console.log('[Integration] Trying native Calendar.app access...');
        const events = await macCalendarService.getEvents(startDate, endDate);
        if (events && events.length > 0) {
          console.log('[Integration] Got events from Calendar.app');
          return events;
        }
      } catch (error) {
        console.error('[Integration] Native calendar access failed:', error);
        // Fall through to try CalDAV
      }
    }
    
    // Try CalDAV as fallback (or primary if native is skipped)
    try {
      console.log('[Integration] Using CalDAV/demo calendar approach...');
      const events = await appleCalendarService.getEvents(startDate, endDate);
      return events;
    } catch (error) {
      console.error('Failed to fetch Apple Calendar events:', error);
      
      // Always return demo events for now
      console.log('Returning demo events');
      return appleCalendarService.getDemoEvents(startDate, endDate);
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

  // Create Google Calendar event
  async createGoogleCalendarEvent(eventDetails) {
    console.log('[ElectronIntegrationService] Creating calendar event:', eventDetails);
    
    try {
      const accessToken = await this.googleAuth.getValidAccessToken();
      
      // Parse event details (basic implementation)
      const event = this.parseEventDetails(eventDetails);
      
      const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.googleAuth.refreshAccessToken();
          return this.createGoogleCalendarEvent(eventDetails);
        }
        
        const error = await response.text();
        console.error('[ElectronIntegrationService] Calendar creation error:', response.status, error);
        throw new Error(`Failed to create calendar event: ${response.status}`);
      }

      const createdEvent = await response.json();
      console.log('[ElectronIntegrationService] Calendar event created:', createdEvent.id);
      
      return {
        content: `Successfully created calendar event: "${createdEvent.summary}" scheduled for ${new Date(createdEvent.start.dateTime || createdEvent.start.date).toLocaleString()}`
      };
    } catch (error) {
      console.error('[ElectronIntegrationService] Failed to create calendar event:', error);
      return {
        content: `Error creating calendar event: ${error.message}`
      };
    }
  }

  // Delete Google Calendar event
  async deleteGoogleCalendarEvent(eventDetails) {
    console.log('[ElectronIntegrationService] Deleting calendar event:', eventDetails);
    
    try {
      const accessToken = await this.googleAuth.getValidAccessToken();
      
      // First, search for events matching the details
      const searchQuery = encodeURIComponent(eventDetails);
      const searchUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?q=${searchQuery}&maxResults=10`;
      
      const searchResponse = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!searchResponse.ok) {
        throw new Error(`Failed to search calendar events: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      const events = searchData.items || [];
      
      if (events.length === 0) {
        return {
          content: `No calendar events found matching "${eventDetails}"`
        };
      }

      // Delete the first matching event
      const eventToDelete = events[0];
      const deleteUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventToDelete.id}`;
      
      const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!deleteResponse.ok) {
        throw new Error(`Failed to delete calendar event: ${deleteResponse.status}`);
      }

      return {
        content: `Successfully deleted calendar event: "${eventToDelete.summary}"`
      };
    } catch (error) {
      console.error('[ElectronIntegrationService] Failed to delete calendar event:', error);
      return {
        content: `Error deleting calendar event: ${error.message}`
      };
    }
  }

  // Upload file to Google Drive
  async uploadGoogleDriveFile(fileDetails) {
    console.log('[ElectronIntegrationService] Uploading file to Drive:', fileDetails);
    
    try {
      return {
        content: `File upload to Google Drive is not yet fully implemented. For now, you can:\n\n• Use the Google Drive web interface\n• Drag and drop files directly to drive.google.com\n• Use the Google Drive desktop sync app\n\nRequested upload: "${fileDetails}"`
      };
    } catch (error) {
      console.error('[ElectronIntegrationService] Failed to upload file:', error);
      return {
        content: `Error uploading file: ${error.message}`
      };
    }
  }

  // Download file from Google Drive
  async downloadGoogleDriveFile(fileDetails) {
    console.log('[ElectronIntegrationService] Downloading file from Drive:', fileDetails);
    
    try {
      const accessToken = await this.googleAuth.getValidAccessToken();
      
      // Search for the file
      const searchQuery = encodeURIComponent(fileDetails);
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name contains '${searchQuery}'&fields=files(id,name,mimeType,webViewLink)`;
      
      const searchResponse = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!searchResponse.ok) {
        throw new Error(`Failed to search Drive files: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      const files = searchData.files || [];
      
      if (files.length === 0) {
        return {
          content: `No Google Drive files found matching "${fileDetails}"`
        };
      }

      const file = files[0];
      
      return {
        content: `Found file: "${file.name}"\nView/Download: ${file.webViewLink}\n\nNote: Direct download will be implemented in a future update. For now, click the link above to access your file.`
      };
    } catch (error) {
      console.error('[ElectronIntegrationService] Failed to download file:', error);
      return {
        content: `Error accessing file: ${error.message}`
      };
    }
  }

  // Delete file from Google Drive
  async deleteGoogleDriveFile(fileDetails) {
    console.log('[ElectronIntegrationService] Deleting file from Drive:', fileDetails);
    
    try {
      const accessToken = await this.googleAuth.getValidAccessToken();
      
      // Search for the file
      const searchQuery = encodeURIComponent(fileDetails);
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name contains '${searchQuery}'&fields=files(id,name)`;
      
      const searchResponse = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!searchResponse.ok) {
        throw new Error(`Failed to search Drive files: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      const files = searchData.files || [];
      
      if (files.length === 0) {
        return {
          content: `No Google Drive files found matching "${fileDetails}"`
        };
      }

      const file = files[0];
      
      // Delete the file
      const deleteUrl = `https://www.googleapis.com/drive/v3/files/${file.id}`;
      
      const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!deleteResponse.ok) {
        throw new Error(`Failed to delete file: ${deleteResponse.status}`);
      }

      return {
        content: `Successfully deleted file: "${file.name}" from Google Drive`
      };
    } catch (error) {
      console.error('[ElectronIntegrationService] Failed to delete file:', error);
      return {
        content: `Error deleting file: ${error.message}`
      };
    }
  }

  // Parse event details from natural language
  parseEventDetails(eventDetails) {
    const now = new Date();
    let startDate = new Date(now.getTime() + 60 * 60 * 1000); // Default to 1 hour from now
    let endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
    let title = eventDetails;
    let description = '';
    let location = '';

    // Extract time information
    const timeMatch = eventDetails.match(/at (\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2] || '0');
      const ampm = timeMatch[3];
      
      if (ampm && ampm.toLowerCase() === 'pm' && hours !== 12) {
        hours += 12;
      } else if (ampm && ampm.toLowerCase() === 'am' && hours === 12) {
        hours = 0;
      }
      
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    }

    // Extract date information
    const dateMatch = eventDetails.match(/(tomorrow|today|next week|this week)/i);
    if (dateMatch) {
      const dateRef = dateMatch[1].toLowerCase();
      if (dateRef === 'tomorrow') {
        startDate.setDate(startDate.getDate() + 1);
        endDate.setDate(endDate.getDate() + 1);
      } else if (dateRef === 'next week') {
        startDate.setDate(startDate.getDate() + 7);
        endDate.setDate(endDate.getDate() + 7);
      }
    }

    // Clean up title by removing time and date references
    title = eventDetails
      .replace(/at \d{1,2}:?\d{0,2}\s*(am|pm)?/gi, '')
      .replace(/(tomorrow|today|next week|this week)/gi, '')
      .trim();

    return {
      summary: title || 'New Event',
      description: description,
      location: location,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
  }
}

// Export the class, not an instance, to prevent constructor from running on import
export default ElectronIntegrationService;