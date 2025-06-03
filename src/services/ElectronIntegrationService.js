// Simplified integration service for Electron that doesn't load Google APIs
import appleCalendarService from './AppleCalendarService';
import macCalendarService from './MacCalendarService';
import googleCalendarService from './GoogleCalendarService';
import ElectronGoogleAuthDirect from './ElectronGoogleAuthDirect';
import ElectronGoogleAuthDirectPatched from './ElectronGoogleAuthDirectPatched';
import webSearchService from './WebSearchService';
import GoogleDriveService from './GoogleDriveService';

// Run migration to ensure backward compatibility
import './MigrateGoogleTokens';

class ElectronIntegrationService {
  constructor() {
    this.isAppleAuthorized = appleCalendarService.loadAuthState();
    this.googleAuth = new ElectronGoogleAuthDirectPatched();
    this.isGoogleAuthorized = this.googleAuth.isAuthenticated();
    this.googleDriveService = new GoogleDriveService();
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
        maxResults: '50' // Increased to 50 emails
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
      
      // Fetch details for each message (increased to 50)
      const messages = await Promise.all(
        messageIds.slice(0, 50).map(async (msg) => {
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
      
      return `📧 **Email ${messages.indexOf(msg) + 1}: ${subject}**\n` +
             `   From: ${from}\n` +
             `   Date: ${date}\n` +
             `   Content: ${body}` +
             `${body.includes('...') ? '\n\n💬 *Say "tell me more about email ' + (messages.indexOf(msg) + 1) + '" for full content or summary*' : ''}`;
    }).join('\n\n');
  }

  // Get email details and summary
  async getEmailDetails(emailNumber, action = 'show') {
    try {
      console.log('[ElectronIntegrationService] Getting email details:', emailNumber, action);
      
      // Get recent emails to find the requested one
      const messages = await this.searchGmail('is:unread');
      
      if (!messages || emailNumber < 1 || emailNumber > messages.length) {
        return {
          content: `❌ Email ${emailNumber} not found. I only found ${messages?.length || 0} unread emails.`
        };
      }
      
      const email = messages[emailNumber - 1];
      const headers = email.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
      const date = headers.find(h => h.name === 'Date')?.value || '';
      
      // Get full body using same extraction logic
      const extractBody = (payload) => {
        if (payload.body?.data) {
          try {
            return atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          } catch (e) {
            console.error('Failed to decode body:', e);
          }
        }
        
        if (payload.parts) {
          for (const part of payload.parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
              try {
                return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
              } catch (e) {
                console.error('Failed to decode part:', e);
              }
            }
            if (part.parts) {
              const nestedBody = extractBody(part);
              if (nestedBody) return nestedBody;
            }
          }
        }
        
        return email.snippet || '';
      };
      
      const fullBody = extractBody(email.payload)
        .replace(/\r\n/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (action === 'summarize') {
        // Create a concise summary
        const summary = fullBody.length > 300 ? 
          fullBody.substring(0, 300) + '...\n\n📋 **Key Points:** This email appears to be about ' + 
          (subject.toLowerCase().includes('meeting') ? 'a meeting or appointment.' :
           subject.toLowerCase().includes('project') ? 'a project or work matter.' :
           subject.toLowerCase().includes('invoice') || subject.toLowerCase().includes('payment') ? 'billing or payment.' :
           'general correspondence.') :
          fullBody;
          
        return {
          content: `📧 **Email ${emailNumber} Summary:**\n\n**Subject:** ${subject}\n**From:** ${from}\n**Date:** ${new Date(date).toLocaleDateString()}\n\n**Summary:**\n${summary}`
        };
      } else {
        // Show full email
        return {
          content: `📧 **Email ${emailNumber} - Full Content:**\n\n**Subject:** ${subject}\n**From:** ${from}\n**Date:** ${new Date(date).toLocaleDateString()}\n\n**Content:**\n${fullBody}\n\n💬 *Say "summarize email ${emailNumber}" for a summary*`
        };
      }
    } catch (error) {
      console.error('[ElectronIntegrationService] Email details error:', error);
      return {
        content: `❌ Error getting email details: ${error.message}`
      };
    }
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
        
        // Return error details instead of throwing
        return {
          content: `❌ Failed to create calendar event. Error ${response.status}: ${error}`,
          error: true
        };
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

  // Send Gmail email
  async sendGmailEmail(emailDetails) {
    console.log('[ElectronIntegrationService] Sending Gmail email:', emailDetails);
    
    try {
      const accessToken = await this.googleAuth.getValidAccessToken();
      
      // Parse email details
      const { to, subject, body } = this.parseEmailDetails(emailDetails);
      
      // Create email in RFC 2822 format
      const email = [
        `To: ${to}`,
        `Subject: ${subject}`,
        `Content-Type: text/plain; charset="UTF-8"`,
        ``,
        body
      ].join('\r\n');
      
      // Base64 encode the email
      const encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      
      const url = 'https://www.googleapis.com/gmail/v1/users/me/messages/send';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          raw: encodedEmail
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.googleAuth.refreshAccessToken();
          return this.sendGmailEmail(emailDetails);
        }
        
        const error = await response.text();
        console.error('[ElectronIntegrationService] Gmail sending error:', response.status, error);
        
        return {
          content: `❌ Failed to send email. Error ${response.status}: ${error}`,
          error: true
        };
      }

      const sentEmail = await response.json();
      console.log('[ElectronIntegrationService] Email sent:', sentEmail.id);
      
      return {
        content: `✅ Email sent successfully to ${to} with subject "${subject}"`
      };
    } catch (error) {
      console.error('[ElectronIntegrationService] Failed to send email:', error);
      return {
        content: `❌ Error sending email: ${error.message}`,
        error: true
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
        if (searchResponse.status === 401) {
          await this.googleAuth.refreshAccessToken();
          return this.deleteGoogleCalendarEvent(eventDetails);
        }
        
        const error = await searchResponse.text();
        console.error('[ElectronIntegrationService] Calendar search error:', searchResponse.status, error);
        return {
          content: `❌ Failed to search calendar events. Error ${searchResponse.status}: ${error}`,
          error: true
        };
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
        if (deleteResponse.status === 401) {
          await this.googleAuth.refreshAccessToken();
          return this.deleteGoogleCalendarEvent(eventDetails);
        }
        
        const error = await deleteResponse.text();
        console.error('[ElectronIntegrationService] Calendar deletion error:', deleteResponse.status, error);
        return {
          content: `❌ Failed to delete calendar event. Error ${deleteResponse.status}: ${error}`,
          error: true
        };
      }

      return {
        content: `Successfully deleted calendar event: "${eventToDelete.summary}"`
      };
    } catch (error) {
      console.error('[ElectronIntegrationService] Failed to delete calendar event:', error);
      return {
        content: `❌ Error deleting calendar event: ${error.message}`,
        error: true
      };
    }
  }

  // Update/move Google Calendar event
  async updateGoogleCalendarEvent(eventDetails) {
    console.log('[ElectronIntegrationService] Updating calendar event:', eventDetails);
    
    try {
      const accessToken = await this.googleAuth.getValidAccessToken();
      
      // Parse the update request
      const updateInfo = this.parseEventUpdateDetails(eventDetails);
      
      // First, search for the event to update
      const searchQuery = encodeURIComponent(updateInfo.searchTerm);
      const searchUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?q=${searchQuery}&maxResults=10`;
      
      const searchResponse = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!searchResponse.ok) {
        if (searchResponse.status === 401) {
          await this.googleAuth.refreshAccessToken();
          return this.updateGoogleCalendarEvent(eventDetails);
        }
        
        const error = await searchResponse.text();
        console.error('[ElectronIntegrationService] Calendar search error:', searchResponse.status, error);
        return {
          content: `❌ Failed to search calendar events. Error ${searchResponse.status}: ${error}`,
          error: true
        };
      }

      const searchData = await searchResponse.json();
      const events = searchData.items || [];
      
      if (events.length === 0) {
        return {
          content: `❌ No calendar events found matching "${updateInfo.searchTerm}"`
        };
      }

      // Get the first matching event
      const eventToUpdate = events[0];
      const updateUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventToUpdate.id}`;
      
      // Create updated event data
      const updatedEvent = {
        ...eventToUpdate,
        summary: updateInfo.newTitle || eventToUpdate.summary,
        start: updateInfo.newStart ? {
          dateTime: updateInfo.newStart.toISOString(),
          timeZone: 'America/New_York'
        } : eventToUpdate.start,
        end: updateInfo.newEnd ? {
          dateTime: updateInfo.newEnd.toISOString(),
          timeZone: 'America/New_York'
        } : eventToUpdate.end,
        description: updateInfo.newDescription || eventToUpdate.description,
        location: updateInfo.newLocation || eventToUpdate.location
      };
      
      const updateResponse = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedEvent)
      });

      if (!updateResponse.ok) {
        if (updateResponse.status === 401) {
          await this.googleAuth.refreshAccessToken();
          return this.updateGoogleCalendarEvent(eventDetails);
        }
        
        const error = await updateResponse.text();
        console.error('[ElectronIntegrationService] Calendar update error:', updateResponse.status, error);
        return {
          content: `❌ Failed to update calendar event. Error ${updateResponse.status}: ${error}`,
          error: true
        };
      }

      const updatedEventData = await updateResponse.json();
      
      return {
        content: `✅ Successfully updated calendar event: "${updatedEventData.summary}" scheduled for ${new Date(updatedEventData.start.dateTime || updatedEventData.start.date).toLocaleString()}`
      };
    } catch (error) {
      console.error('[ElectronIntegrationService] Failed to update calendar event:', error);
      return {
        content: `❌ Error updating calendar event: ${error.message}`,
        error: true
      };
    }
  }

  // Parse event update details from natural language
  parseEventUpdateDetails(updateDetails) {
    console.log('[ElectronIntegrationService] Parsing event update details:', updateDetails);
    
    // Extract the event to search for (usually at the beginning)
    let searchTerm = updateDetails;
    let newTitle = null;
    let newStart = null;
    let newEnd = null;
    let newDescription = null;
    let newLocation = null;
    
    // Pattern: "move [event] to [new time/date]"
    const moveMatch = updateDetails.match(/move\s+(.+?)\s+to\s+(.+)/i);
    if (moveMatch) {
      searchTerm = moveMatch[1].trim();
      const newTimeStr = moveMatch[2].trim();
      newStart = this.parseDateTime(newTimeStr);
      if (newStart) {
        newEnd = new Date(newStart.getTime() + 30 * 60 * 1000); // Default 30 minutes
      }
    }
    
    // Pattern: "change [event] time to [new time]"
    const changeTimeMatch = updateDetails.match(/change\s+(.+?)\s+time\s+to\s+(.+)/i);
    if (changeTimeMatch) {
      searchTerm = changeTimeMatch[1].trim();
      const newTimeStr = changeTimeMatch[2].trim();
      newStart = this.parseDateTime(newTimeStr);
      if (newStart) {
        newEnd = new Date(newStart.getTime() + 30 * 60 * 1000);
      }
    }
    
    // Pattern: "rename [event] to [new name]"
    const renameMatch = updateDetails.match(/rename\s+(.+?)\s+to\s+(.+)/i);
    if (renameMatch) {
      searchTerm = renameMatch[1].trim();
      newTitle = renameMatch[2].trim();
    }
    
    return {
      searchTerm,
      newTitle,
      newStart,
      newEnd,
      newDescription,
      newLocation
    };
  }

  // Parse date/time from natural language
  parseDateTime(dateTimeStr) {
    try {
      // Handle common formats
      const lowerStr = dateTimeStr.toLowerCase();
      
      // Handle "tomorrow at 3pm", "today at 2:30pm", etc.
      if (lowerStr.includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const timeMatch = lowerStr.match(/(\d{1,2}):?(\d{0,2})\s*(am|pm)/);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]) || 0;
          const ampm = timeMatch[3];
          
          if (ampm === 'pm' && hours !== 12) hours += 12;
          if (ampm === 'am' && hours === 12) hours = 0;
          
          tomorrow.setHours(hours, minutes, 0, 0);
          return tomorrow;
        }
      }
      
      if (lowerStr.includes('today')) {
        const today = new Date();
        const timeMatch = lowerStr.match(/(\d{1,2}):?(\d{0,2})\s*(am|pm)/);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]) || 0;
          const ampm = timeMatch[3];
          
          if (ampm === 'pm' && hours !== 12) hours += 12;
          if (ampm === 'am' && hours === 12) hours = 0;
          
          today.setHours(hours, minutes, 0, 0);
          return today;
        }
      }
      
      // Try direct time parsing for formats like "3pm", "2:30pm"
      const timeMatch = lowerStr.match(/(\d{1,2}):?(\d{0,2})\s*(am|pm)/);
      if (timeMatch) {
        const today = new Date();
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]) || 0;
        const ampm = timeMatch[3];
        
        if (ampm === 'pm' && hours !== 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;
        
        today.setHours(hours, minutes, 0, 0);
        return today;
      }
      
      // Try standard date parsing as fallback
      const parsed = new Date(dateTimeStr);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch (error) {
      console.error('[ElectronIntegrationService] Failed to parse date/time:', error);
      return null;
    }
  }

  // Upload file to Google Drive
  async uploadGoogleDriveFile(fileDetails) {
    console.log('[ElectronIntegrationService] Uploading file to Drive:', fileDetails);
    
    try {
      // Check if we have text content to upload
      if (typeof fileDetails === 'string') {
        // Simple text upload
        const fileName = `aria-upload-${Date.now()}.txt`;
        const uploadedFile = await this.googleDriveService.uploadTextFile(fileDetails, fileName);
        
        return {
          content: `✅ Successfully uploaded text file to Google Drive!\n\n📄 **${uploadedFile.name}**\n🆔 File ID: ${uploadedFile.id}\n🔗 View: https://drive.google.com/file/d/${uploadedFile.id}/view`
        };
      }
      
      // Handle file object or structured data
      if (fileDetails.content && fileDetails.fileName) {
        const uploadedFile = await this.googleDriveService.uploadTextFile(
          fileDetails.content, 
          fileDetails.fileName,
          fileDetails.mimeType || 'text/plain'
        );
        
        return {
          content: `✅ Successfully uploaded "${fileDetails.fileName}" to Google Drive!\n\n📄 **${uploadedFile.name}**\n🆔 File ID: ${uploadedFile.id}\n🔗 View: https://drive.google.com/file/d/${uploadedFile.id}/view`
        };
      }
      
      return {
        content: `❌ Invalid file data provided. Please provide either:\n• Text content as a string\n• Object with 'content' and 'fileName' properties`
      };
      
    } catch (error) {
      console.error('[ElectronIntegrationService] Failed to upload file:', error);
      
      if (error.message.includes('not configured')) {
        return {
          content: `❌ Google Drive not configured. Please:\n\n1. Add your Google Client ID in Settings\n2. Optionally add Client Secret for better authentication\n3. Try the upload command again`
        };
      }
      
      return {
        content: `❌ Upload failed: ${error.message}`
      };
    }
  }

  // Download file from Google Drive
  async downloadGoogleDriveFile(fileDetails) {
    console.log('[ElectronIntegrationService] Downloading file from Drive:', fileDetails);
    
    try {
      // First search for the file
      const files = await this.googleDriveService.listFiles(fileDetails, 10);
      
      if (files.length === 0) {
        return {
          content: `❌ No Google Drive files found matching "${fileDetails}"`
        };
      }
      
      const file = files[0]; // Use the most recently modified match
      console.log('[ElectronIntegrationService] Downloading file:', file.name, file.id);
      
      // Download the file to user's Downloads folder
      try {
        const downloadResult = await this.googleDriveService.downloadFile(file.id);
        
        // Use the downloadFileToUser helper to trigger actual download
        this.googleDriveService.downloadFileToUser(downloadResult.content, file.name);
        
        return {
          content: `✅ Downloaded "${file.name}" from Google Drive to your Downloads folder\n\n` +
                   `📊 **File Info:**\n` +
                   `• Size: ${this.googleDriveService.formatFileSize(parseInt(file.size || 0))}\n` +
                   `• Type: ${this.googleDriveService.getFileTypeDisplay(file.mimeType)}\n` +
                   `• Modified: ${new Date(file.modifiedTime).toLocaleString()}\n` +
                   `• ID: ${file.id}\n\n` +
                   `💾 **Download complete!** Check your Downloads folder for "${file.name}"`
        };
        
      } catch (downloadError) {
        console.log('[ElectronIntegrationService] Download failed, trying content preview:', downloadError.message);
        
        // Fallback: Try to get file content for preview (text files only)
        try {
          const fileWithContent = await this.googleDriveService.getFileContent(file.id);
          
          // For text files, show content inline as fallback
          const previewLength = 500;
          const contentPreview = fileWithContent.content.length > previewLength 
            ? fileWithContent.content.substring(0, previewLength) + '...\n\n[Content truncated]'
            : fileWithContent.content;
          
          return {
            content: `⚠️ Could not download "${file.name}" to Downloads folder, showing content instead:\n\n` +
                     `📄 **File Content:**\n\`\`\`\n${contentPreview}\n\`\`\`\n\n` +
                     `📊 **File Info:**\n` +
                     `• Size: ${this.googleDriveService.formatFileSize(parseInt(file.size || 0))}\n` +
                     `• Type: ${this.googleDriveService.getFileTypeDisplay(file.mimeType)}\n` +
                     `• Modified: ${new Date(file.modifiedTime).toLocaleString()}\n` +
                     `• ID: ${file.id}\n\n` +
                     `🔗 **Manual download:** https://drive.google.com/file/d/${file.id}/view`
          };
          
        } catch (contentError) {
          // Complete fallback: provide download link
          return {
            content: `❌ Could not download "${file.name}" automatically\n\n` +
                     `📊 **File Info:**\n` +
                     `• Size: ${this.googleDriveService.formatFileSize(parseInt(file.size || 0))}\n` +
                     `• Type: ${this.googleDriveService.getFileTypeDisplay(file.mimeType)}\n` +
                     `• Modified: ${new Date(file.modifiedTime).toLocaleString()}\n` +
                     `• ID: ${file.id}\n\n` +
                     `🔗 **Manual download:** https://drive.google.com/file/d/${file.id}/view\n\n` +
                     `💡 *Please download manually from Google Drive web interface*`
          };
        }
      }
      
    } catch (error) {
      console.error('[ElectronIntegrationService] Failed to download file:', error);
      
      if (error.message.includes('not configured')) {
        return {
          content: `❌ Google Drive not configured. Please add your Google Client ID in Settings.`
        };
      }
      
      return {
        content: `❌ Download failed: ${error.message}`
      };
    }
  }

  // Delete file from Google Drive
  async deleteGoogleDriveFile(fileDetails) {
    console.log('[ElectronIntegrationService] Deleting file from Drive:', fileDetails);
    
    try {
      // First search for the file
      const files = await this.googleDriveService.listFiles(fileDetails, 10);
      
      if (files.length === 0) {
        return {
          content: `❌ No Google Drive files found matching "${fileDetails}"`
        };
      }
      
      const file = files[0]; // Use the most recently modified match
      
      // Confirm deletion (for safety)
      const confirmMessage = `⚠️ **Delete Confirmation Required**\n\nAre you sure you want to delete "${file.name}"?\n\n📊 **File Info:**\n• Size: ${this.googleDriveService.formatFileSize(parseInt(file.size || 0))}\n• Modified: ${new Date(file.modifiedTime).toLocaleString()}\n• Type: ${this.googleDriveService.getFileTypeDisplay(file.mimeType)}\n\n🔥 **This action cannot be undone!**\n\nTo confirm deletion, use: \`@drive-delete-confirm ${file.id}\``;
      
      // Check if this is a confirmation command
      if (fileDetails.startsWith('confirm-') || fileDetails.includes(file.id)) {
        // Actually delete the file
        await this.googleDriveService.deleteFile(file.id);
        
        return {
          content: `✅ Successfully deleted "${file.name}" from Google Drive\n\n🗑️ The file has been permanently removed.`
        };
      } else {
        // Return confirmation prompt
        return {
          content: confirmMessage
        };
      }
      
    } catch (error) {
      console.error('[ElectronIntegrationService] Failed to delete file:', error);
      
      if (error.message.includes('not configured')) {
        return {
          content: `❌ Google Drive not configured. Please add your Google Client ID in Settings.`
        };
      }
      
      return {
        content: `❌ Delete failed: ${error.message}`
      };
    }
  }

  // Share file from Google Drive
  async shareGoogleDriveFile(shareDetails) {
    console.log('[ElectronIntegrationService] Sharing file from Drive:', shareDetails);
    
    try {
      // Parse the share details (file name and optional email)
      const parts = shareDetails.split(' ');
      const fileName = parts[0];
      const email = parts.slice(1).join(' ').trim() || null;
      
      if (!fileName) {
        return {
          content: `❌ Please provide a file name. Examples:\n• @drive-share report.pdf\n• @drive-share document.pdf john@example.com`
        };
      }
      
      // First search for the file
      const files = await this.googleDriveService.listFiles(fileName, 10);
      
      if (files.length === 0) {
        return {
          content: `❌ No Google Drive files found matching "${fileName}"`
        };
      }
      
      const file = files[0]; // Use the most recently modified match
      console.log('[ElectronIntegrationService] Sharing file:', file.name, file.id);
      
      // Share the file
      const permissionResult = await this.googleDriveService.shareFile(file.id, email);
      
      let shareMessage = `✅ Successfully shared "${file.name}" from Google Drive!\n\n`;
      
      if (email) {
        shareMessage += `📧 **Shared with:** ${email}\n`;
        shareMessage += `🔗 **Access:** The user will receive an email notification\n`;
      } else {
        shareMessage += `🌐 **Public access:** Anyone with the link can view\n`;
        shareMessage += `🔗 **Share link:** https://drive.google.com/file/d/${file.id}/view\n`;
      }
      
      shareMessage += `📊 **File Info:**\n`;
      shareMessage += `• Size: ${this.googleDriveService.formatFileSize(parseInt(file.size || 0))}\n`;
      shareMessage += `• Type: ${this.googleDriveService.getFileTypeDisplay(file.mimeType)}\n`;
      shareMessage += `• Modified: ${new Date(file.modifiedTime).toLocaleString()}`;
      
      return {
        content: shareMessage
      };
      
    } catch (error) {
      console.error('[ElectronIntegrationService] Failed to share file:', error);
      
      if (error.message.includes('not configured')) {
        return {
          content: `❌ Google Drive not configured. Please add your Google Client ID in Settings.`
        };
      }
      
      return {
        content: `❌ Share failed: ${error.message}`
      };
    }
  }

  // Create folder in Google Drive
  async createGoogleDriveFolder(folderDetails) {
    console.log('[ElectronIntegrationService] Creating folder in Drive:', folderDetails);
    
    try {
      // Parse folder details (remove 'folder' keyword and quotes)
      let folderName = folderDetails.replace(/^folder\s+/i, '').trim();
      
      // Remove quotes if present
      if ((folderName.startsWith('"') && folderName.endsWith('"')) ||
          (folderName.startsWith("'") && folderName.endsWith("'"))) {
        folderName = folderName.slice(1, -1);
      }
      
      if (!folderName) {
        return {
          content: `❌ Please provide a folder name. Example: @drive-create folder "My Project"`
        };
      }
      
      // Create the folder
      const createdFolder = await this.googleDriveService.createFolder(folderName);
      
      return {
        content: `✅ Successfully created folder "${createdFolder.name}" in Google Drive!\n\n📁 **Folder Info:**\n• ID: ${createdFolder.id}\n• Created: ${new Date().toLocaleString()}\n🔗 **View:** https://drive.google.com/drive/folders/${createdFolder.id}`
      };
      
    } catch (error) {
      console.error('[ElectronIntegrationService] Failed to create folder:', error);
      
      if (error.message.includes('not configured')) {
        return {
          content: `❌ Google Drive not configured. Please add your Google Client ID in Settings.`
        };
      }
      
      return {
        content: `❌ Folder creation failed: ${error.message}`
      };
    }
  }

  // Move file to folder in Google Drive
  async moveGoogleDriveFile(moveDetails) {
    console.log('[ElectronIntegrationService] Moving file in Drive:', moveDetails);
    
    try {
      // Parse move details (file and folder names in quotes)
      const quoteMatches = moveDetails.match(/"([^"]+)"/g);
      
      if (!quoteMatches || quoteMatches.length < 2) {
        return {
          content: `❌ Please provide file and folder names in quotes. Example: @drive-move "report.pdf" "Projects"`
        };
      }
      
      const fileName = quoteMatches[0].slice(1, -1); // Remove quotes
      const folderName = quoteMatches[1].slice(1, -1); // Remove quotes
      
      // Search for the file
      const files = await this.googleDriveService.listFiles(fileName, 10);
      if (files.length === 0) {
        return {
          content: `❌ No files found matching "${fileName}"`
        };
      }
      
      // Search for the folder
      const folders = await this.googleDriveService.listFiles(`name:'${folderName}' and mimeType:'application/vnd.google-apps.folder'`, 10);
      if (folders.length === 0) {
        return {
          content: `❌ No folders found matching "${folderName}"`
        };
      }
      
      const file = files[0];
      const folder = folders[0];
      
      // Note: Moving files requires updating the file's parents in Google Drive API
      // This would need a new method in GoogleDriveService
      return {
        content: `📋 **Move Request:** "${file.name}" → "${folder.name}"\n\n⚠️ **Note:** File moving functionality requires additional Google Drive API implementation.\n\n🔗 **Manual Option:**\n• File: https://drive.google.com/file/d/${file.id}/view\n• Folder: https://drive.google.com/drive/folders/${folder.id}\n\n💡 *You can manually move the file using the Google Drive web interface*`
      };
      
    } catch (error) {
      console.error('[ElectronIntegrationService] Failed to move file:', error);
      
      if (error.message.includes('not configured')) {
        return {
          content: `❌ Google Drive not configured. Please add your Google Client ID in Settings.`
        };
      }
      
      return {
        content: `❌ Move failed: ${error.message}`
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
    const timeMatch = eventDetails.match(/(\d{1,2}):?(\d{0,2})\s*(am|pm)/i);
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

    // Extract specific date information (month day format)
    const specificDateMatch = eventDetails.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(st|nd|rd|th)?/i);
    if (specificDateMatch) {
      const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
      const month = monthNames.indexOf(specificDateMatch[1].toLowerCase());
      const day = parseInt(specificDateMatch[2]);
      
      // Create date for this year, or next year if the date has passed
      const targetDate = new Date(now.getFullYear(), month, day);
      if (targetDate < now) {
        targetDate.setFullYear(now.getFullYear() + 1);
      }
      
      // For birthdays and all-day events, make it all-day
      if (eventDetails.toLowerCase().includes('birthday')) {
        return {
          summary: title.replace(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(st|nd|rd|th)?/gi, '').trim() || 'New Event',
          description: description,
          location: location,
          start: {
            date: targetDate.toISOString().split('T')[0] // All-day format
          },
          end: {
            date: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        };
      }
      
      startDate = targetDate;
      endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    } else {
      // Extract relative date information
      const dateMatch = eventDetails.match(/(tomorrow|today|next week|this week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
      if (dateMatch) {
        const dateRef = dateMatch[1].toLowerCase();
        if (dateRef === 'tomorrow') {
          startDate.setDate(startDate.getDate() + 1);
          endDate.setDate(endDate.getDate() + 1);
        } else if (dateRef === 'next week') {
          startDate.setDate(startDate.getDate() + 7);
          endDate.setDate(endDate.getDate() + 7);
        } else if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(dateRef)) {
          // Find the next occurrence of this weekday
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const targetDay = dayNames.indexOf(dateRef);
          const currentDay = now.getDay();
          
          let daysUntilTarget = targetDay - currentDay;
          if (daysUntilTarget <= 0) {
            daysUntilTarget += 7; // Next week if the day has passed or is today
          }
          
          startDate.setDate(startDate.getDate() + daysUntilTarget);
          endDate.setDate(endDate.getDate() + daysUntilTarget);
        }
      }
    }

    // Clean up title by removing time and date references
    title = eventDetails
      .replace(/(at\s+)?\d{1,2}:?\d{0,2}\s*(am|pm)/gi, '')
      .replace(/(tomorrow|today|next week|this week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi, '')
      .replace(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(st|nd|rd|th)?/gi, '')
      .trim();

    return {
      summary: title || 'New Event',
      description: description,
      location: location,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'America/New_York'
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'America/New_York'
      }
    };
  }

  // Parse email details from natural language
  parseEmailDetails(emailDetails) {
    console.log('[ElectronIntegrationService] Parsing email details:', emailDetails);
    
    // Extract email address
    const emailMatch = emailDetails.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const to = emailMatch ? emailMatch[1] : '';
    
    // Extract subject
    let subject = 'Email from Aria';
    const subjectMatch = emailDetails.match(/subject[\s:]+["']?([^"'\n]+)["']?/i) ||
                        emailDetails.match(/with subject[\s:]+["']?([^"'\n]+)["']?/i);
    if (subjectMatch) {
      subject = subjectMatch[1].trim();
    }
    
    // Extract body/message
    let body = emailDetails;
    const bodyMatch = emailDetails.match(/(?:message|body|saying)[\s:]+["']?([^"']+)["']?/i);
    if (bodyMatch) {
      body = bodyMatch[1].trim();
    } else {
      // Clean up the email details to use as body
      body = emailDetails
        .replace(/send.*?email.*?to.*?@.*?\.(com|org|net|edu)/i, '')
        .replace(/with subject.*$/i, '')
        .replace(/subject[\s:]+.*$/i, '')
        .trim();
      
      if (!body) {
        body = 'Email sent from Aria assistant.';
      }
    }
    
    return { to, subject, body };
  }
  // Get latest news using enhanced search
  async getLatestNews(query = 'latest news') {
    console.log('[ElectronIntegrationService] Getting latest news for:', query);
    
    try {
      // Use the enhanced web search with better content
      const results = await webSearchService.search(query);
      return results.filter(result => 
        result.type === 'news' && 
        result.publishedAt && 
        !result.url.includes('/search?')
      ).slice(0, 10);
    } catch (error) {
      console.error('[ElectronIntegrationService] News fetch failed:', error);
      throw error;
    }
  }

  // Get SpaceX specific updates
  async getSpaceXUpdates() {
    console.log('[ElectronIntegrationService] Getting SpaceX updates...');
    
    try {
      // Try multiple SpaceX-specific sources
      const updates = [];
      
      // SpaceX RSS feed
      try {
        const spaceXRSS = await this.fetchSpaceXRSS();
        updates.push(...spaceXRSS);
      } catch (error) {
        console.error('SpaceX RSS failed:', error);
      }
      
      // General SpaceX news search
      try {
        const newsResults = await webSearchService.search('SpaceX latest news');
        const recentNews = newsResults.filter(result => 
          result.type === 'news' && 
          !result.url.includes('/search?')
        ).slice(0, 5);
        updates.push(...recentNews);
      } catch (error) {
        console.error('SpaceX news search failed:', error);
      }
      
      // Add official links if we don't have much content
      if (updates.length < 3) {
        updates.push({
          title: '🚀 SpaceX Official Website',
          url: 'https://www.spacex.com/',
          snippet: 'Visit SpaceX.com for official mission updates, launch schedules, and company announcements.',
          source: 'SpaceX Official',
          type: 'official'
        });
        
        updates.push({
          title: '📡 SpaceX Live Updates',
          url: 'https://twitter.com/spacex',
          snippet: 'Follow @SpaceX on Twitter/X for real-time mission updates and launch coverage.',
          source: 'SpaceX Twitter',
          type: 'social'
        });
      }
      
      return this.formatWebSearchResults(updates);
      
    } catch (error) {
      console.error('[ElectronIntegrationService] SpaceX updates failed:', error);
      return 'Unable to fetch SpaceX updates at this time. Check https://www.spacex.com/ for official updates.';
    }
  }

  // Fetch SpaceX RSS feed
  async fetchSpaceXRSS() {
    try {
      // Try SpaceX news via RSS proxy
      const rssUrl = 'https://news.google.com/rss/search?q=SpaceX&hl=en-US&gl=US&ceid=US:en';
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) return [];
      
      const data = await response.json();
      const xmlText = data.contents;
      
      // Parse RSS
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const items = xmlDoc.getElementsByTagName('item');
      
      const results = [];
      for (let i = 0; i < Math.min(items.length, 5); i++) {
        const item = items[i];
        
        const title = item.getElementsByTagName('title')[0]?.textContent;
        const link = item.getElementsByTagName('link')[0]?.textContent;
        const description = item.getElementsByTagName('description')[0]?.textContent;
        const pubDate = item.getElementsByTagName('pubDate')[0]?.textContent;
        
        if (title && link && title.toLowerCase().includes('spacex')) {
          results.push({
            title: title.replace(/<[^>]*>/g, ''),
            url: link,
            snippet: description ? description.replace(/<[^>]*>/g, '').substring(0, 200) : 'SpaceX news update',
            source: 'Google News',
            type: 'news',
            publishedAt: pubDate
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('[ElectronIntegrationService] SpaceX RSS failed:', error);
      return [];
    }
  }
}

// Export the class, not an instance, to prevent constructor from running on import
export default ElectronIntegrationService;