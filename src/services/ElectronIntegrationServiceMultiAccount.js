/**
 * Updated Electron Integration Service with Multi-Account Google Calendar Support
 */

import appleCalendarService from './AppleCalendarService';
import macCalendarService from './MacCalendarService';
import googleCalendarService from './GoogleCalendarService';
import multiAccountGoogleCalendarService from './MultiAccountGoogleCalendarService';
import multiAccountGoogleAuth from './ElectronGoogleAuthMultiAccount';
import webSearchService from './WebSearchService';

class ElectronIntegrationServiceMultiAccount {
  constructor() {
    this.isAppleAuthorized = appleCalendarService.loadAuthState();
    this.googleAuth = multiAccountGoogleAuth;
  }

  // Google Calendar Multi-Account Methods

  // Add a new Google Calendar account
  async addGoogleAccount(accountLabel) {
    try {
      const result = await this.googleAuth.authenticateNewAccount(accountLabel);
      return result;
    } catch (error) {
      console.error('[Integration] Failed to add Google account:', error);
      throw error;
    }
  }

  // Get all Google accounts
  getGoogleAccounts() {
    return multiAccountGoogleCalendarService.getAccounts();
  }

  // Remove a Google account
  removeGoogleAccount(accountId) {
    this.googleAuth.disconnectAccount(accountId);
  }

  // Get events from a specific Google account
  async getGoogleAccountEvents(accountId, startDate, endDate) {
    try {
      const accessToken = await this.googleAuth.getValidAccessToken(accountId);
      const events = await googleCalendarService.getEvents(accessToken, startDate, endDate);
      
      // Tag events with account info
      const account = multiAccountGoogleCalendarService.getAccount(accountId);
      return events.map(event => ({
        ...event,
        accountId,
        accountEmail: account?.email || accountId
      }));
    } catch (error) {
      console.error(`[Integration] Failed to fetch events for account ${accountId}:`, error);
      throw error;
    }
  }

  // Get events from all Google accounts
  async getAllGoogleCalendarEvents(startDate, endDate) {
    const results = await multiAccountGoogleCalendarService.getAllAccountsEvents(startDate, endDate);
    
    if (results.errors.length > 0) {
      console.warn('[Integration] Some accounts had errors:', results.errors);
    }
    
    return results.events;
  }

  // Legacy method - gets events from all accounts
  async getGoogleCalendarEvents(startDate, endDate) {
    return this.getAllGoogleCalendarEvents(startDate, endDate);
  }

  // Check if any Google accounts are connected
  hasGoogleAccounts() {
    return this.googleAuth.hasAuthenticatedAccounts();
  }

  // Format Google Calendar events (works with single or multiple accounts)
  formatGoogleCalendarEvents(events) {
    // Group events by account if multiple accounts
    const eventsByAccount = {};
    
    events.forEach(event => {
      const accountKey = event.accountEmail || 'Unknown Account';
      if (!eventsByAccount[accountKey]) {
        eventsByAccount[accountKey] = [];
      }
      eventsByAccount[accountKey].push(event);
    });
    
    // If only one account, use standard formatting
    const accounts = Object.keys(eventsByAccount);
    if (accounts.length === 1) {
      return googleCalendarService.formatEvents(events);
    }
    
    // Format with account headers
    let formatted = '';
    accounts.forEach(account => {
      formatted += `\n📧 ${account}\n`;
      formatted += googleCalendarService.formatEvents(eventsByAccount[account]);
      formatted += '\n';
    });
    
    return formatted.trim();
  }

  // Apple Calendar Integration (unchanged)
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
    // Try native Calendar.app access if available
    if (macCalendarService.isAvailable()) {
      try {
        console.log('[Integration] Trying native Calendar.app access...');
        const events = await macCalendarService.getEvents(startDate, endDate);
        if (events && events.length > 0) {
          return events;
        }
      } catch (error) {
        console.log('[Integration] Native Calendar.app access failed, trying CalDAV...', error);
      }
    }

    // Fall back to CalDAV
    if (!this.isAppleAuthorized) {
      throw new Error('Not authorized. Please connect to Apple Calendar first.');
    }

    try {
      const events = await appleCalendarService.getEvents(startDate, endDate);
      return events;
    } catch (error) {
      console.error('Failed to fetch Apple Calendar events:', error);
      throw error;
    }
  }

  formatAppleCalendarEvents(events) {
    return appleCalendarService.formatEvents(events);
  }

  disconnectAppleCalendar() {
    appleCalendarService.disconnect();
    this.isAppleAuthorized = false;
  }

  // Web Search
  async searchWeb(query) {
    return webSearchService.search(query);
  }
}

export default new ElectronIntegrationServiceMultiAccount();