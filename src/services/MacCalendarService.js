// Native macOS Calendar Service using AppleScript
class MacCalendarService {
  constructor() {
    this.isElectron = !!(window.electron && window.electron.execAppleScript);
  }

  // Check if native calendar access is available
  isAvailable() {
    console.log('[MacCalendar] Checking availability:', {
      isElectron: this.isElectron,
      hasExecAppleScript: !!(window.electron && window.electron.execAppleScript)
    });
    return this.isElectron;
  }

  // Get calendar events using AppleScript
  async getEvents(startDate, endDate) {
    if (!this.isElectron) {
      throw new Error('Native calendar access only available in Electron');
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // First check if Calendar is running and accessible
    const checkScript = `
      try
        tell application "System Events"
          if not (exists process "Calendar") then
            tell application "Calendar" to launch
            delay 1
          end if
        end tell
        return "ready"
      on error errMsg
        return "error: " & errMsg
      end try
    `;
    
    try {
      console.log('[MacCalendar] Checking Calendar.app status...');
      const checkResult = await window.electron.execAppleScript(checkScript);
      console.log('[MacCalendar] Calendar check result:', checkResult);
      
      if (checkResult.includes('error')) {
        throw new Error('Cannot access Calendar: ' + checkResult);
      }
    } catch (error) {
      console.error('[MacCalendar] Calendar check failed:', error);
      // Continue anyway
    }

    // Much faster script - only get today's and tomorrow's events from main calendars
    const script = `
      set output to "[]"
      set maxEvents to 20
      set eventCount to 0
      
      tell application "Calendar"
        set eventList to {}
        set todayDate to current date
        set todayDate's time to 0
        set tomorrowDate to todayDate + 1 * days
        set endSearchDate to todayDate + ${Math.min(7, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)))} * days
        
        -- Only check first 3 calendars to avoid timeout
        set calCount to count of calendars
        if calCount > 3 then set calCount to 3
        
        repeat with i from 1 to calCount
          if eventCount < maxEvents then
            try
              set cal to calendar i
              set calName to name of cal
              
              -- Only get events starting from today
              set todayEvents to (every event of cal whose start date >= todayDate and start date < endSearchDate)
              
              repeat with evt in todayEvents
                if eventCount < maxEvents then
                  try
                    set eventTitle to summary of evt
                    set eventStart to start date of evt
                    set eventEnd to end date of evt
                    
                    -- Format dates properly
                    set startStr to (eventStart as string)
                    set endStr to (eventEnd as string)
                    
                    -- Create JSON
                    set eventJSON to "{"
                    set eventJSON to eventJSON & "\\"title\\":\\"" & my escapeJSON(eventTitle) & "\\","
                    set eventJSON to eventJSON & "\\"start\\":\\"" & startStr & "\\","
                    set eventJSON to eventJSON & "\\"end\\":\\"" & endStr & "\\","
                    set eventJSON to eventJSON & "\\"calendar\\":\\"" & my escapeJSON(calName) & "\\""
                    
                    -- Add location if available
                    try
                      set loc to location of evt
                      if loc is not missing value then
                        set eventJSON to eventJSON & ",\\"location\\":\\"" & my escapeJSON(loc) & "\\""
                      end if
                    end try
                    
                    set eventJSON to eventJSON & "}"
                    set end of eventList to eventJSON
                    set eventCount to eventCount + 1
                  end try
                end if
              end repeat
            end try
          end if
        end repeat
        
        -- Build result
        if (count of eventList) > 0 then
          set output to "["
          repeat with i from 1 to count of eventList
            if i > 1 then set output to output & ","
            set output to output & item i of eventList
          end repeat
          set output to output & "]"
        end if
      end tell
      
      return output
    end
    
    -- Helper to escape JSON strings
    on escapeJSON(str)
      set str to my replaceText(str, "\\\\", "\\\\\\\\")
      set str to my replaceText(str, "\\"", "\\\\\\"")
      set str to my replaceText(str, return, "\\\\n")
      set str to my replaceText(str, tab, "\\\\t")
      return str
    end escapeJSON
    
    on replaceText(someText, oldText, newText)
      set AppleScript's text item delimiters to oldText
      set textItems to text items of someText
      set AppleScript's text item delimiters to newText
      set someText to textItems as text
      set AppleScript's text item delimiters to ""
      return someText
    end replaceText
    `;

    try {
      console.log('[MacCalendar] Fetching events from Calendar.app...');
      const result = await window.electron.execAppleScript(script);
      console.log('[MacCalendar] AppleScript returned:', result);
      
      // Parse AppleScript result
      const events = this.parseAppleScriptEvents(result);
      console.log('[MacCalendar] Found', events.length, 'events');
      
      return events;
    } catch (error) {
      console.error('[MacCalendar] Failed to get events:', error);
      console.error('[MacCalendar] Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // Check for permission error
      if (error.message && error.message.includes('not allowed')) {
        throw new Error('Calendar access denied. Please grant permission in System Settings > Privacy & Security > Calendar');
      }
      
      throw error;
    }
  }

  // Parse AppleScript output into JavaScript objects
  parseAppleScriptEvents(scriptResult) {
    const events = [];
    
    try {
      // Parse the JSON-like output
      const parsed = JSON.parse(scriptResult);
      
      parsed.forEach((item, index) => {
        const event = {
          id: `mac-event-${index}`,
          title: item.title,
          start: new Date(item.start),
          end: new Date(item.end),
          location: item.location || '',
          description: ''
        };
        
        if (event.title && !isNaN(event.start.getTime())) {
          events.push(event);
        }
      });
    } catch (e) {
      console.error('[MacCalendar] Error parsing events:', e);
      console.error('[MacCalendar] Raw result:', scriptResult);
    }
    
    return events;
  }

  // Extract value from AppleScript record
  extractValue(record, key) {
    const regex = new RegExp(`${key}:([^,}]+)`);
    const match = record.match(regex);
    return match ? match[1].trim().replace(/^"|"$/g, '') : '';
  }

  // Get calendar list
  async getCalendars() {
    if (!this.isElectron) {
      return [];
    }

    const script = `
      tell application "Calendar"
        set calList to {}
        repeat with cal in calendars
          set calInfo to {calName:(name of cal), calId:(uid of cal)}
          set end of calList to calInfo
        end repeat
        return calList
      end tell
    `;

    try {
      const result = await window.electron.execAppleScript(script);
      return this.parseCalendarList(result);
    } catch (error) {
      console.error('[MacCalendar] Failed to get calendars:', error);
      return [];
    }
  }

  // Parse calendar list from AppleScript
  parseCalendarList(scriptResult) {
    const calendars = [];
    const calMatches = scriptResult.match(/\{[^}]+\}/g) || [];
    
    calMatches.forEach(match => {
      calendars.push({
        name: this.extractValue(match, 'calName'),
        id: this.extractValue(match, 'calId')
      });
    });
    
    return calendars;
  }
}

export default new MacCalendarService();