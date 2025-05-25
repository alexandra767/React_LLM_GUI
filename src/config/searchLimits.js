// Configuration for search result limits
// You can adjust these values to get more or fewer results

export const SEARCH_LIMITS = {
  // Google Drive
  DRIVE_PAGE_SIZE: 50,           // Max files to fetch from Google Drive (max 100)
  DRIVE_PREVIEW_COUNT: 10,       // How many files to fetch content previews for
  
  // Gmail
  GMAIL_MAX_RESULTS: 25,         // Max emails to fetch (max 500)
  GMAIL_DETAIL_COUNT: 15,        // How many emails to fetch full details for
  
  // Web Search
  WIKIPEDIA_RESULTS: 5,          // Wikipedia articles to fetch
  NEWS_API_RESULTS: 15,          // News articles from NewsAPI (max 100)
  TOTAL_SEARCH_RESULTS: 20,      // Total unique search results to return
  
  // Content Preview Limits
  PREVIEW_LENGTH: 500,           // Characters to show in previews
  EMAIL_BODY_LENGTH: 500         // Characters to show in email body
};

// To use even higher limits, update these values and restart the app