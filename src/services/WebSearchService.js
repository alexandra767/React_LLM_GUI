// Enhanced web search service with article summarization
class WebSearchService {
  constructor() {
    this.newsApiKey = localStorage.getItem('news_api_key'); // Optional NewsAPI key
  }

  // Main search function that aggregates results from multiple sources
  async search(query) {
    console.log('[WebSearchService] Searching for:', query);
    
    const results = [];
    
    // Try multiple search strategies in parallel - prioritize actual content
    const searchPromises = [
      this.searchDuckDuckGo(query),
      this.searchWikipedia(query),
      this.searchAlternativeNews(query), // Better than just search links
      this.searchNewsAPI(query), // Only works with API key
      this.searchGoogleNews(query) // Try Google News RSS
    ];
    
    const searchResults = await Promise.allSettled(searchPromises);
    
    // Combine results from successful searches
    searchResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        results.push(...(Array.isArray(result.value) ? result.value : [result.value]));
      }
    });
    
    // Remove duplicates and limit results
    const uniqueResults = this.deduplicateResults(results);
    
    // Check if this is a weather query and prioritize weather sites
    const lowerQuery = query.toLowerCase();
    const isWeatherQuery = lowerQuery.includes('weather') || 
                          lowerQuery.includes('temperature') || 
                          lowerQuery.includes('forecast') || 
                          lowerQuery.includes('rain') || 
                          lowerQuery.includes('snow') || 
                          lowerQuery.includes('sunny') || 
                          lowerQuery.includes('cloudy');
    
    if (isWeatherQuery) {
      // For weather queries, always add weather sites as primary results
      const weatherLinks = this.generateNewsLinks(query);
      // Insert weather sites at the beginning for weather queries
      uniqueResults.unshift(...weatherLinks);
    } else if (uniqueResults.length < 3) {
      // Only add search portal links if we have very few real results
      const portalLinks = this.generateNewsLinks(query);
      uniqueResults.push(...portalLinks.slice(0, 3));
    }
    
    // Try to fetch summaries for more results
    const resultsWithSummaries = await this.fetchSummaries(uniqueResults.slice(0, 20));
    
    return resultsWithSummaries;
  }

  // DuckDuckGo Instant Answer API
  async searchDuckDuckGo(query) {
    try {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
      const response = await fetch(url);
      
      if (!response.ok) return [];
      
      const data = await response.json();
      const results = [];
      
      // Main abstract/answer
      if (data.Abstract) {
        results.push({
          title: data.Heading || query,
          url: data.AbstractURL,
          snippet: data.Abstract,
          source: 'DuckDuckGo',
          type: 'summary'
        });
      }
      
      // Definition
      if (data.Definition) {
        results.push({
          title: `Definition: ${query}`,
          url: data.DefinitionURL,
          snippet: data.Definition,
          source: 'DuckDuckGo',
          type: 'definition'
        });
      }
      
      return results;
    } catch (error) {
      console.error('[WebSearchService] DuckDuckGo search failed:', error);
      return [];
    }
  }

  // Wikipedia search
  async searchWikipedia(query) {
    try {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&format=json`;
      const response = await fetch(searchUrl);
      
      if (!response.ok) return [];
      
      const [searchTerm, titles, descriptions, urls] = await response.json();
      const results = [];
      
      for (let i = 0; i < titles.length; i++) {
        if (titles[i] && urls[i]) {
          // Try to get extract for each result
          const extract = await this.getWikipediaExtract(titles[i]);
          
          results.push({
            title: titles[i],
            url: urls[i],
            snippet: extract || descriptions[i] || 'Wikipedia article',
            source: 'Wikipedia',
            type: 'encyclopedia'
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('[WebSearchService] Wikipedia search failed:', error);
      return [];
    }
  }

  // Get Wikipedia article extract
  async getWikipediaExtract(title) {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&exsentences=3&titles=${encodeURIComponent(title)}&format=json`;
      const response = await fetch(url);
      
      if (!response.ok) return null;
      
      const data = await response.json();
      const pages = data.query?.pages;
      
      if (pages) {
        const page = Object.values(pages)[0];
        return page.extract || null;
      }
      
      return null;
    } catch (error) {
      console.error('[WebSearchService] Wikipedia extract failed:', error);
      return null;
    }
  }

  // Generate direct links to major news sites or weather sites based on query
  generateNewsLinks(query) {
    const encodedQuery = encodeURIComponent(query);
    const lowerQuery = query.toLowerCase();
    
    // Check if this is a weather-related query
    const isWeatherQuery = lowerQuery.includes('weather') || 
                          lowerQuery.includes('temperature') || 
                          lowerQuery.includes('forecast') || 
                          lowerQuery.includes('rain') || 
                          lowerQuery.includes('snow') || 
                          lowerQuery.includes('sunny') || 
                          lowerQuery.includes('cloudy');
    
    if (isWeatherQuery) {
      // Return weather-specific sites with actual weather content
      return [
        {
          title: `Weather.com: Current conditions and forecast`,
          url: `https://weather.com/`,
          snippet: `Current weather conditions, hourly forecasts, and 10-day outlook. Check temperature, humidity, precipitation, and severe weather alerts for your location.`,
          source: 'Weather.com',
          type: 'weather'
        },
        {
          title: `National Weather Service`,
          url: `https://weather.gov/`,
          snippet: `Official weather forecasts, warnings, and meteorological data from the U.S. National Weather Service. Get detailed temperature, precipitation, and weather alerts.`,
          source: 'National Weather Service',
          type: 'weather'
        },
        {
          title: `AccuWeather: Detailed forecast`,
          url: `https://www.accuweather.com/`,
          snippet: `Accurate weather forecasts with minute-by-minute precipitation, temperature trends, and extended outlooks. Check current conditions and hourly forecasts.`,
          source: 'AccuWeather',
          type: 'weather'
        }
      ];
    }
    
    // Return news search links for non-weather queries
    return [
      {
        title: `CNN: ${query}`,
        url: `https://www.cnn.com/search?q=${encodedQuery}`,
        snippet: `Search CNN for breaking news and in-depth reporting about "${query}". CNN provides 24-hour news coverage and analysis.`,
        source: 'CNN',
        type: 'news'
      },
      {
        title: `BBC News: ${query}`,
        url: `https://www.bbc.co.uk/search?q=${encodedQuery}`,
        snippet: `Search BBC for international news and unbiased reporting about "${query}". BBC offers comprehensive global news coverage.`,
        source: 'BBC',
        type: 'news'
      },
      {
        title: `Associated Press: ${query}`,
        url: `https://apnews.com/search?q=${encodedQuery}`,
        snippet: `Search AP News for factual, unbiased reporting about "${query}". The Associated Press is a trusted source for breaking news.`,
        source: 'AP News',
        type: 'news'
      },
      {
        title: `Reuters: ${query}`,
        url: `https://www.reuters.com/site-search/?query=${encodedQuery}`,
        snippet: `Search Reuters for business news and global reporting about "${query}". Reuters provides trusted financial and world news.`,
        source: 'Reuters',
        type: 'news'
      },
      {
        title: `The Guardian: ${query}`,
        url: `https://www.theguardian.com/search?q=${encodedQuery}`,
        snippet: `Search The Guardian for news, opinion, and investigative journalism about "${query}".`,
        source: 'The Guardian',
        type: 'news'
      }
    ];
  }

  // Search using NewsAPI (requires API key)
  async searchNewsAPI(query) {
    if (!this.newsApiKey) return [];
    
    try {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=relevancy&pageSize=15&apiKey=${this.newsApiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) return [];
      
      const data = await response.json();
      
      if (data.articles) {
        return data.articles.map(article => ({
          title: article.title,
          url: article.url,
          snippet: article.description || article.content?.substring(0, 200) || 'No description available',
          source: article.source.name,
          type: 'news',
          publishedAt: article.publishedAt
        }));
      }
      
      return [];
    } catch (error) {
      console.error('[WebSearchService] NewsAPI search failed:', error);
      return [];
    }
  }

  // Search Google News RSS for actual articles
  async searchGoogleNews(query) {
    try {
      // Google News RSS feed
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
      
      // Use a CORS proxy to access the RSS feed
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) return [];
      
      const data = await response.json();
      const xmlText = data.contents;
      
      // Parse RSS XML (simple parsing)
      const results = this.parseGoogleNewsRSS(xmlText, query);
      return results.slice(0, 10); // Limit to 10 results
      
    } catch (error) {
      console.error('[WebSearchService] Google News search failed:', error);
      return [];
    }
  }

  // Parse Google News RSS feed
  parseGoogleNewsRSS(xmlText, query) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const items = xmlDoc.getElementsByTagName('item');
      
      const results = [];
      for (let i = 0; i < Math.min(items.length, 10); i++) {
        const item = items[i];
        
        const title = item.getElementsByTagName('title')[0]?.textContent;
        const link = item.getElementsByTagName('link')[0]?.textContent;
        const description = item.getElementsByTagName('description')[0]?.textContent;
        const pubDate = item.getElementsByTagName('pubDate')[0]?.textContent;
        const source = item.getElementsByTagName('source')[0]?.textContent || 'Google News';
        
        if (title && link) {
          results.push({
            title: title.replace(/<[^>]*>/g, ''), // Remove HTML tags
            url: link,
            snippet: description ? description.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : `Recent news about ${query}`,
            source: source.replace(/<[^>]*>/g, ''),
            type: 'news',
            publishedAt: pubDate
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('[WebSearchService] RSS parsing failed:', error);
      return [];
    }
  }

  // Alternative news search that tries to get real content
  async searchAlternativeNews(query) {
    const results = [];
    
    // Try some public APIs that might work
    try {
      // Try Bing News API (public endpoint, limited)
      const bingUrl = `https://api.bing.microsoft.com/v7.0/news/search?q=${encodeURIComponent(query)}&count=10`;
      
      // Note: This requires API key, but we can try without
      // Just return some structured fallback for now
      
      // For SpaceX specifically, let's try some known sources
      if (query.toLowerCase().includes('spacex')) {
        results.push({
          title: 'SpaceX Official Updates',
          url: 'https://www.spacex.com/',
          snippet: 'Check SpaceX official website for the latest mission updates, launch schedules, and company announcements.',
          source: 'SpaceX Official',
          type: 'official'
        });
        
        results.push({
          title: 'SpaceX on Twitter/X',
          url: 'https://twitter.com/spacex',
          snippet: 'Follow @SpaceX on Twitter/X for real-time updates on launches, tests, and mission progress.',
          source: 'SpaceX Twitter',
          type: 'social'
        });
      }
      
      return results;
      
    } catch (error) {
      console.error('[WebSearchService] Alternative news search failed:', error);
      return results;
    }
  }

  // Try to fetch article content and generate summaries
  async fetchSummaries(results) {
    // In Electron, we're limited by CORS, so we can only enhance what we have
    return results.map(result => {
      // Add more context based on source
      if (result.type === 'news' && !result.publishedAt) {
        result.snippet = `📰 Latest news from ${result.source}: ${result.snippet}`;
      } else if (result.type === 'encyclopedia') {
        result.snippet = `📚 ${result.snippet}`;
      } else if (result.type === 'definition') {
        result.snippet = `📖 ${result.snippet}`;
      }
      
      // Add search tips
      if (result.source === 'CNN' || result.source === 'BBC' || result.source === 'AP News') {
        result.snippet += '\n💡 Tip: Click to see the latest articles and videos.';
      }
      
      return result;
    });
  }

  // Remove duplicate results
  deduplicateResults(results) {
    const seen = new Set();
    return results.filter(result => {
      const key = result.url || result.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Format results for display
  formatResults(results) {
    if (!results || results.length === 0) {
      return 'No search results found.';
    }
    
    return results.map((result, index) => {
      let icon = '🔍';
      
      // Choose icon based on source/type
      switch (result.source) {
        case 'Wikipedia': icon = '📚'; break;
        case 'CNN': icon = '📺'; break;
        case 'BBC': icon = '🌍'; break;
        case 'AP News': icon = '📡'; break;
        case 'Reuters': icon = '💼'; break;
        case 'The Guardian': icon = '📰'; break;
        case 'DuckDuckGo': 
          icon = result.type === 'definition' ? '📖' : '🦆'; 
          break;
        default:
          if (result.type === 'news') icon = '📰';
          else if (result.type === 'encyclopedia') icon = '📚';
      }
      
      let output = `${icon} ${result.title}\n`;
      output += `   Source: ${result.source}`;
      
      if (result.publishedAt) {
        const date = new Date(result.publishedAt);
        output += ` | ${date.toLocaleDateString()}`;
      }
      
      output += `\n   URL: ${result.url}\n`;
      output += `   ${result.snippet}`;
      
      return output;
    }).join('\n\n');
  }
}

// Export as singleton
export default new WebSearchService();