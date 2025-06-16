// Test service to check if AppleScript works
class TestAppleScriptService {
  async testBasic() {
    if (!window.electron || !window.electron.execAppleScript) {
      throw new Error('AppleScript not available');
    }

    // Super simple test
    const script = `return "Hello from AppleScript"`;
    
    try {
      console.log('[TestAppleScript] Running basic test...');
      const result = await window.electron.execAppleScript(script);
      console.log('[TestAppleScript] Basic test result:', result);
      return result;
    } catch (error) {
      console.error('[TestAppleScript] Basic test failed:', error);
      throw error;
    }
  }

  async testCalendarAccess() {
    if (!window.electron || !window.electron.execAppleScript) {
      throw new Error('AppleScript not available');
    }

    // Test if we can access Calendar at all
    const script = `
      tell application "Calendar"
        set calCount to count of calendars
        return "Found " & calCount & " calendars"
      end tell
    `;
    
    try {
      console.log('[TestAppleScript] Testing Calendar access...');
      const result = await window.electron.execAppleScript(script);
      console.log('[TestAppleScript] Calendar access result:', result);
      return result;
    } catch (error) {
      console.error('[TestAppleScript] Calendar access failed:', error);
      throw error;
    }
  }

  async testSimpleEvents() {
    if (!window.electron || !window.electron.execAppleScript) {
      throw new Error('AppleScript not available');
    }

    // Get just one event to test
    const script = `
      tell application "Calendar"
        set eventCount to 0
        repeat with cal in calendars
          set calEvents to events of cal
          if (count of calEvents) > 0 then
            set evt to first item of calEvents
            set eventTitle to summary of evt
            return "Found event: " & eventTitle
          end if
        end repeat
        return "No events found"
      end tell
    `;
    
    try {
      console.log('[TestAppleScript] Testing simple event fetch...');
      const result = await window.electron.execAppleScript(script);
      console.log('[TestAppleScript] Simple event result:', result);
      return result;
    } catch (error) {
      console.error('[TestAppleScript] Simple event test failed:', error);
      throw error;
    }
  }
}

export default new TestAppleScriptService();