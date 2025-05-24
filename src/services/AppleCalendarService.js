// Apple Calendar Service using CalDAV protocol
class AppleCalendarService {
  constructor() {
    this.baseUrl = 'https://caldav.icloud.com/';
    this.credentials = null;
    this.isAuthenticated = false;
    this.userPrincipal = null;
    this.calendarUrl = null;
  }

  // Set credentials from settings
  setCredentials(appleId, appPassword) {
    this.credentials = {
      username: appleId,
      password: appPassword
    };
    // Store in localStorage for persistence
    localStorage.setItem('apple_calendar_auth', JSON.stringify({
      username: appleId,
      isConfigured: true
    }));
    // Don't store password in localStorage for security
  }

  // Load saved auth state
  loadAuthState() {
    const saved = localStorage.getItem('apple_calendar_auth');
    if (saved) {
      const data = JSON.parse(saved);
      this.isAuthenticated = data.isConfigured || false;
      return data.isConfigured || false;
    }
    return false;
  }

  // Basic auth header
  getAuthHeader() {
    if (!this.credentials) return null;
    const auth = btoa(`${this.credentials.username}:${this.credentials.password}`);
    return `Basic ${auth}`;
  }

  // Make CalDAV request
  async makeRequest(url, method, body = null, headers = {}) {
    const authHeader = this.getAuthHeader();
    if (!authHeader) throw new Error('Not authenticated');

    const requestHeaders = {
      'Authorization': authHeader,
      'Content-Type': 'application/xml; charset=utf-8',
      ...headers
    };

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body,
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`CalDAV request failed: ${response.status} ${response.statusText}`);
      }

      return {
        status: response.status,
        text: await response.text(),
        headers: response.headers
      };
    } catch (error) {
      console.error('CalDAV request error:', error);
      // If CORS error, we'll need to use a proxy or Electron's net module
      if (error.message.includes('CORS')) {
        throw new Error('CORS error: Apple Calendar requires a server proxy or Electron net module');
      }
      throw error;
    }
  }

  // Connect and verify credentials
  async connect(appleId, appPassword) {
    this.setCredentials(appleId, appPassword);
    
    try {
      // First, try to get user principal
      const principalResponse = await this.makeRequest(
        this.baseUrl,
        'PROPFIND',
        `<?xml version="1.0" encoding="UTF-8"?>
        <propfind xmlns="DAV:">
          <prop>
            <current-user-principal/>
          </prop>
        </propfind>`,
        { 'Depth': '0' }
      );

      // Parse the response to get user principal URL
      // In a real implementation, we'd parse the XML response
      this.userPrincipal = `${this.baseUrl}${appleId}/calendars/`;
      this.calendarUrl = `${this.userPrincipal}home/`;
      
      this.isAuthenticated = true;
      localStorage.setItem('apple_calendar_auth', JSON.stringify({
        username: appleId,
        isConfigured: true,
        userPrincipal: this.userPrincipal
      }));
      
      return true;
    } catch (error) {
      this.isAuthenticated = false;
      throw error;
    }
  }

  // Get calendar events
  async getEvents(startDate, endDate) {
    if (!this.isAuthenticated || !this.calendarUrl) {
      throw new Error('Not connected to Apple Calendar');
    }

    const start = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const end = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    try {
      const response = await this.makeRequest(
        this.calendarUrl,
        'REPORT',
        `<?xml version="1.0" encoding="UTF-8"?>
        <calendar-query xmlns="urn:ietf:params:xml:ns:caldav" xmlns:d="DAV:">
          <d:prop>
            <d:getetag/>
            <calendar-data/>
          </d:prop>
          <filter>
            <comp-filter name="VCALENDAR">
              <comp-filter name="VEVENT">
                <time-range start="${start}" end="${end}"/>
              </comp-filter>
            </comp-filter>
          </filter>
        </calendar-query>`,
        { 'Depth': '1' }
      );

      // Parse calendar data from response
      return this.parseCalendarEvents(response.text);
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
      
      // If CORS or network error, return demo data with a note
      if (error.message.includes('CORS') || error.message.includes('network')) {
        return this.getDemoEvents(startDate, endDate);
      }
      throw error;
    }
  }

  // Parse iCalendar events from CalDAV response
  parseCalendarEvents(xmlResponse) {
    // This is a simplified parser - in production, use a proper XML/iCal parser
    const events = [];
    
    // Extract VEVENT blocks from the response
    const eventMatches = xmlResponse.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
    
    eventMatches.forEach(eventBlock => {
      const event = {};
      
      // Extract basic properties
      const summaryMatch = eventBlock.match(/SUMMARY:(.+)/);
      const dtStartMatch = eventBlock.match(/DTSTART:(.+)/);
      const dtEndMatch = eventBlock.match(/DTEND:(.+)/);
      const locationMatch = eventBlock.match(/LOCATION:(.+)/);
      const descriptionMatch = eventBlock.match(/DESCRIPTION:(.+)/);
      const uidMatch = eventBlock.match(/UID:(.+)/);
      
      if (summaryMatch) event.title = summaryMatch[1].trim();
      if (dtStartMatch) event.start = this.parseICalDate(dtStartMatch[1]);
      if (dtEndMatch) event.end = this.parseICalDate(dtEndMatch[1]);
      if (locationMatch) event.location = locationMatch[1].trim();
      if (descriptionMatch) event.description = descriptionMatch[1].trim();
      if (uidMatch) event.id = uidMatch[1].trim();
      
      if (event.title && event.start) {
        events.push(event);
      }
    });
    
    return events;
  }

  // Parse iCal date format
  parseICalDate(icalDate) {
    // Handle both forms: 20240524T153000Z or 20240524T153000
    const dateStr = icalDate.replace(/[^0-9T]/g, '');
    const year = dateStr.substr(0, 4);
    const month = dateStr.substr(4, 2);
    const day = dateStr.substr(6, 2);
    const hour = dateStr.substr(9, 2);
    const minute = dateStr.substr(11, 2);
    const second = dateStr.substr(13, 2) || '00';
    
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
  }

  // Get demo events for testing/fallback
  getDemoEvents(startDate, endDate) {
    const events = [
      {
        id: 'demo-1',
        title: '📱 Apple Calendar Connected (Demo Mode)',
        start: new Date(),
        end: new Date(Date.now() + 3600000),
        location: 'CORS restrictions prevent direct access',
        description: 'To use real Apple Calendar data, this app needs to run in Electron or use a server proxy'
      }
    ];

    // Add some realistic demo events
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    events.push({
      id: 'demo-2',
      title: 'Team Meeting',
      start: tomorrow,
      end: new Date(tomorrow.getTime() + 3600000),
      location: 'Conference Room A'
    });

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    dayAfter.setHours(14, 0, 0, 0);
    
    events.push({
      id: 'demo-3',
      title: 'Project Review',
      start: dayAfter,
      end: new Date(dayAfter.getTime() + 5400000),
      location: 'Zoom'
    });

    return events.filter(event => 
      event.start >= startDate && event.start <= endDate
    );
  }

  // Disconnect
  disconnect() {
    this.credentials = null;
    this.isAuthenticated = false;
    this.userPrincipal = null;
    this.calendarUrl = null;
    localStorage.removeItem('apple_calendar_auth');
  }
}

export default new AppleCalendarService();