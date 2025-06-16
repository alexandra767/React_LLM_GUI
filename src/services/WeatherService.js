class WeatherService {
  constructor() {
    // Using free OpenWeatherMap API - no key required for current weather
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    // Backup: Using free weather API that doesn't require key
    this.backupUrl = 'https://wttr.in';
  }

  // Get weather for a location
  async getWeather(location) {
    console.log('[WeatherService] Getting weather for:', location);
    
    try {
      // Try multiple approaches for getting weather data
      
      // Approach 1: Try wttr.in (no API key required)
      const wttrResult = await this.getWttrWeather(location);
      if (wttrResult) {
        return wttrResult;
      }
      
      // Approach 2: Try web scraping approach
      const webResult = await this.getWebWeather(location);
      if (webResult) {
        return webResult;
      }
      
      // If all fail, return error
      throw new Error('Unable to fetch weather data from any source');
      
    } catch (error) {
      console.error('[WeatherService] Weather fetch failed:', error);
      throw error;
    }
  }

  // Try wttr.in service (free, no key required)
  async getWttrWeather(location) {
    try {
      console.log('[WeatherService] Trying wttr.in for:', location);
      
      // wttr.in provides weather in various formats
      const response = await fetch(`${this.backupUrl}/${encodeURIComponent(location)}?format=j1`);
      
      if (!response.ok) {
        throw new Error(`wttr.in failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[WeatherService] wttr.in response:', data);
      
      if (data && data.current_condition && data.current_condition[0]) {
        const current = data.current_condition[0];
        const today = data.weather && data.weather[0];
        
        return {
          location: data.nearest_area?.[0]?.areaName?.[0]?.value || location,
          current: {
            temperature: `${current.temp_F}°F (${current.temp_C}°C)`,
            condition: current.weatherDesc?.[0]?.value || 'Unknown',
            humidity: `${current.humidity}%`,
            windSpeed: `${current.windspeedMiles} mph`,
            windDirection: current.winddir16Point,
            visibility: `${current.visibility} miles`,
            pressure: `${current.pressure} in`,
            feelsLike: `${current.FeelsLikeF}°F (${current.FeelsLikeC}°C)`
          },
          forecast: today ? {
            high: `${today.maxtempF}°F (${today.maxtempC}°C)`,
            low: `${today.mintempF}°F (${today.mintempC}°C)`,
            description: today.hourly?.[0]?.weatherDesc?.[0]?.value || 'No forecast'
          } : null,
          source: 'wttr.in',
          timestamp: new Date().toISOString()
        };
      }
      
      return null;
    } catch (error) {
      console.error('[WeatherService] wttr.in failed:', error);
      return null;
    }
  }

  // Fallback: Use web search to find weather info
  async getWebWeather(location) {
    try {
      console.log('[WeatherService] Trying web search for weather:', location);
      
      // This would use the existing web search capability
      // For now, return null to indicate this approach needs web search integration
      return null;
    } catch (error) {
      console.error('[WeatherService] Web weather failed:', error);
      return null;
    }
  }

  // Format weather data for display
  formatWeatherResponse(weatherData) {
    if (!weatherData) {
      return 'Unable to retrieve weather data at this time.';
    }

    const { location, current, forecast, source } = weatherData;
    
    let response = `🌤️ **Current Weather for ${location}:**\n\n`;
    
    if (current) {
      response += `**🌡️ Temperature:** ${current.temperature}`;
      if (current.feelsLike) {
        response += ` (feels like ${current.feelsLike})`;
      }
      response += '\n';
      
      response += `**☁️ Conditions:** ${current.condition}\n`;
      
      if (current.humidity) {
        response += `**💧 Humidity:** ${current.humidity}\n`;
      }
      
      if (current.windSpeed) {
        response += `**💨 Wind:** ${current.windSpeed}`;
        if (current.windDirection) {
          response += ` ${current.windDirection}`;
        }
        response += '\n';
      }
      
      if (current.pressure) {
        response += `**📊 Pressure:** ${current.pressure}\n`;
      }
      
      if (current.visibility) {
        response += `**👁️ Visibility:** ${current.visibility}\n`;
      }
    }

    if (forecast) {
      response += `\n**📅 Today's Forecast:**\n`;
      response += `**🔝 High:** ${forecast.high}\n`;
      response += `**🔻 Low:** ${forecast.low}\n`;
      if (forecast.description) {
        response += `**📝 Details:** ${forecast.description}\n`;
      }
    }
    
    response += `\n*Data from ${source}*`;
    
    return response;
  }

  // Extract location from user message
  extractLocation(message) {
    const lowerMessage = message.toLowerCase();
    
    // Common patterns for weather queries
    const patterns = [
      /weather (?:for |in |at )?(.+?)(?:\?|$)/i,
      /(?:what's|whats|what is) (?:the )?weather (?:like )?(?:for |in |at )?(.+?)(?:\?|$)/i,
      /temperature (?:for |in |at )?(.+?)(?:\?|$)/i,
      /forecast (?:for |in |at )?(.+?)(?:\?|$)/i,
      /weather (.+?)(?:\?|$)/i
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const location = match[1].trim();
        // Filter out common non-location words
        const stopWords = ['today', 'tomorrow', 'now', 'currently', 'right now', 'this morning', 'tonight'];
        if (!stopWords.includes(location.toLowerCase())) {
          return location;
        }
      }
    }
    
    return null;
  }

  // Check if message is asking for weather
  isWeatherQuery(message) {
    const weatherKeywords = [
      'weather', 'temperature', 'forecast', 'rain', 'snow', 'sunny', 'cloudy',
      'hot', 'cold', 'warm', 'cool', 'humid', 'degrees', 'celsius', 'fahrenheit'
    ];
    
    const lowerMessage = message.toLowerCase();
    return weatherKeywords.some(keyword => lowerMessage.includes(keyword));
  }
}

export default WeatherService;