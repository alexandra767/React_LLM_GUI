// Google Calendar Service
class GoogleCalendarService {
  constructor() {
    this.baseUrl = 'https://www.googleapis.com/calendar/v3';
  }

  // Get calendar events
  async getEvents(accessToken, startDate, endDate) {
    console.log('[GoogleCalendar] Fetching events...');
    
    try {
      const timeMin = startDate.toISOString();
      const timeMax = endDate.toISOString();
      
      // First, get the list of calendars
      const calendarsUrl = `${this.baseUrl}/users/me/calendarList`;
      const calendarsResponse = await fetch(calendarsUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!calendarsResponse.ok) {
        throw new Error(`Failed to fetch calendars: ${calendarsResponse.status}`);
      }

      const calendarsData = await calendarsResponse.json();
      const calendars = calendarsData.items || [];
      
      console.log('[GoogleCalendar] Found', calendars.length, 'calendars');

      // Get events from all calendars
      const allEvents = [];
      
      for (const calendar of calendars) {
        // Skip calendars that are not selected
        if (calendar.selected === false) continue;
        
        try {
          const eventsUrl = `${this.baseUrl}/calendars/${encodeURIComponent(calendar.id)}/events`;
          const params = new URLSearchParams({
            timeMin,
            timeMax,
            singleEvents: 'true',
            orderBy: 'startTime',
            maxResults: '50'
          });
          
          const eventsResponse = await fetch(`${eventsUrl}?${params}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          });

          if (eventsResponse.ok) {
            const eventsData = await eventsResponse.json();
            const events = eventsData.items || [];
            
            // Add calendar info to each event
            events.forEach(event => {
              event.calendarName = calendar.summary;
              event.calendarColor = calendar.backgroundColor;
            });
            
            allEvents.push(...events);
          }
        } catch (error) {
          console.error(`[GoogleCalendar] Error fetching events from ${calendar.summary}:`, error);
        }
      }
      
      // Sort events by start time
      allEvents.sort((a, b) => {
        const aStart = new Date(a.start?.dateTime || a.start?.date);
        const bStart = new Date(b.start?.dateTime || b.start?.date);
        return aStart - bStart;
      });
      
      console.log('[GoogleCalendar] Total events found:', allEvents.length);
      return allEvents;
    } catch (error) {
      console.error('[GoogleCalendar] Failed to fetch events:', error);
      throw error;
    }
  }

  // Create a calendar event
  async createEvent(accessToken, eventData) {
    console.log('[GoogleCalendar] Creating event:', eventData.summary);
    
    try {
      // Use primary calendar by default
      const calendarId = 'primary';
      const url = `${this.baseUrl}/calendars/${calendarId}/events`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create event: ${response.status} ${errorText}`);
      }

      const createdEvent = await response.json();
      console.log('[GoogleCalendar] Event created successfully:', createdEvent.id);
      return createdEvent;
    } catch (error) {
      console.error('[GoogleCalendar] Failed to create event:', error);
      throw error;
    }
  }

  // Format events for display
  formatEvents(events) {
    if (!events || events.length === 0) {
      return 'No calendar events found for the specified period.';
    }

    return events.map(event => {
      const start = event.start?.dateTime || event.start?.date;
      const end = event.end?.dateTime || event.end?.date;
      
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      const isAllDay = !event.start?.dateTime;
      
      let timeStr;
      if (isAllDay) {
        timeStr = startDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
      } else {
        timeStr = startDate.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        
        // Add end time if not all day
        const endTimeStr = endDate.toLocaleString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        timeStr += ` - ${endTimeStr}`;
      }
      
      let eventStr = `📅 ${event.summary || 'Untitled Event'}\n`;
      eventStr += `   ${timeStr}`;
      
      if (event.location) {
        eventStr += `\n   📍 ${event.location}`;
      }
      
      if (event.calendarName) {
        eventStr += `\n   📋 ${event.calendarName}`;
      }
      
      if (event.description) {
        const desc = event.description.length > 100 
          ? event.description.substring(0, 100) + '...' 
          : event.description;
        eventStr += `\n   ${desc}`;
      }
      
      return eventStr;
    }).join('\n\n');
  }
}

export default new GoogleCalendarService();