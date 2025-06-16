// Multi-Modal Processing Service for Aria
class MultiModalService {
  constructor() {
    this.supportedFormats = {
      images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'],
      audio: ['mp3', 'wav', 'ogg', 'aac', 'm4a'],
      video: ['mp4', 'webm', 'avi', 'mov', 'mkv'],
      documents: ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'],
      spreadsheets: ['xls', 'xlsx', 'csv'],
      presentations: ['ppt', 'pptx'],
      code: ['js', 'ts', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json', 'xml'],
      archives: ['zip', 'rar', '7z', 'tar', 'gz']
    };
    
    this.processors = {
      image: new ImageProcessor(),
      audio: new AudioProcessor(),
      video: new VideoProcessor(),
      document: new DocumentProcessor(),
      code: new CodeProcessor()
    };
    
    this.cache = new Map();
    this.storageKey = 'aria_multimodal_cache';
    this.loadCache();
  }

  // Load cache from storage
  loadCache() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.cache = new Map(data.cache || []);
        console.log('[MultiModal] Loaded cache with', this.cache.size, 'entries');
      }
    } catch (error) {
      console.error('[MultiModal] Failed to load cache:', error);
    }
  }

  // Save cache to storage
  saveCache() {
    try {
      const data = {
        cache: Array.from(this.cache.entries()),
        lastSave: Date.now()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('[MultiModal] Failed to save cache:', error);
    }
  }

  // Process file based on its type
  async processFile(file, context = {}) {
    console.log('[MultiModal] Processing file:', file.name, file.type);
    
    // Check cache first
    const cacheKey = this.generateCacheKey(file);
    if (this.cache.has(cacheKey)) {
      console.log('[MultiModal] Returning cached result');
      return this.cache.get(cacheKey);
    }
    
    try {
      const fileType = this.detectFileType(file);
      const processor = this.processors[fileType];
      
      if (!processor) {
        throw new Error(`Unsupported file type: ${fileType}`);
      }
      
      const result = await processor.process(file, context);
      
      // Cache the result
      this.cache.set(cacheKey, {
        ...result,
        cached: true,
        cacheTime: Date.now()
      });
      this.saveCache();
      
      return result;
    } catch (error) {
      console.error('[MultiModal] Processing failed:', error);
      return {
        success: false,
        error: error.message,
        file: {
          name: file.name,
          type: file.type,
          size: file.size
        }
      };
    }
  }

  // Process multiple files
  async processFiles(files, context = {}) {
    const results = [];
    
    for (const file of files) {
      const result = await this.processFile(file, context);
      results.push(result);
    }
    
    return {
      success: true,
      results,
      summary: this.generateProcessingSummary(results)
    };
  }

  // Detect file type from file object
  detectFileType(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    
    for (const [type, extensions] of Object.entries(this.supportedFormats)) {
      if (extensions.includes(extension)) {
        switch (type) {
          case 'images': return 'image';
          case 'audio': return 'audio';
          case 'video': return 'video';
          case 'documents':
          case 'spreadsheets':
          case 'presentations': return 'document';
          case 'code': return 'code';
          default: return 'document';
        }
      }
    }
    
    // Fallback to MIME type
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('text/')) return 'code';
    
    return 'document';
  }

  // Generate cache key for file
  generateCacheKey(file) {
    return `${file.name}_${file.size}_${file.lastModified || Date.now()}`;
  }

  // Generate processing summary
  generateProcessingSummary(results) {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    const types = {};
    results.forEach(result => {
      if (result.success && result.type) {
        types[result.type] = (types[result.type] || 0) + 1;
      }
    });
    
    return {
      total: results.length,
      successful,
      failed,
      types,
      hasImages: types.image > 0,
      hasDocuments: types.document > 0,
      hasCode: types.code > 0,
      hasAudio: types.audio > 0,
      hasVideo: types.video > 0
    };
  }

  // Clean old cache entries
  cleanCache(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of this.cache.entries()) {
      if (value.cacheTime && (now - value.cacheTime > maxAge)) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`[MultiModal] Cleaned ${cleaned} old cache entries`);
      this.saveCache();
    }
  }

  // Get supported formats
  getSupportedFormats() {
    return this.supportedFormats;
  }

  // Check if file is supported
  isFileSupported(file) {
    const fileType = this.detectFileType(file);
    return fileType !== 'unknown';
  }
}

// Image Processor
class ImageProcessor {
  async process(file, context = {}) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const img = new Image();
        
        img.onload = async () => {
          try {
            const analysis = await this.analyzeImage(img, e.target.result);
            
            resolve({
              success: true,
              type: 'image',
              file: {
                name: file.name,
                size: file.size,
                type: file.type
              },
              metadata: {
                width: img.width,
                height: img.height,
                aspectRatio: img.width / img.height,
                megapixels: (img.width * img.height) / 1000000,
                orientation: img.width > img.height ? 'landscape' : img.height > img.width ? 'portrait' : 'square'
              },
              analysis,
              dataUrl: e.target.result,
              description: this.generateImageDescription(analysis)
            });
          } catch (error) {
            resolve({
              success: false,
              error: error.message,
              type: 'image'
            });
          }
        };
        
        img.onerror = () => {
          resolve({
            success: false,
            error: 'Failed to load image',
            type: 'image'
          });
        };
        
        img.src = e.target.result;
      };
      
      reader.onerror = () => {
        resolve({
          success: false,
          error: 'Failed to read file',
          type: 'image'
        });
      };
      
      reader.readAsDataURL(file);
    });
  }

  // Basic image analysis
  async analyzeImage(img, dataUrl) {
    // This is a simplified analysis - in a real implementation,
    // you would use computer vision APIs or ML models
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = Math.min(img.width, 100);
    canvas.height = Math.min(img.height, 100);
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const colors = this.analyzeColors(imageData);
    
    return {
      colors,
      brightness: this.calculateBrightness(imageData),
      dominantColor: colors.dominant,
      colorPalette: colors.palette,
      estimatedContent: this.estimateContent(img.width, img.height, colors),
      format: this.getImageFormat(dataUrl)
    };
  }

  // Analyze colors in image
  analyzeColors(imageData) {
    const data = imageData.data;
    const colorCounts = {};
    let totalPixels = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = data[i + 3];
      
      if (alpha > 128) { // Only count visible pixels
        const color = `${Math.floor(r/32)*32},${Math.floor(g/32)*32},${Math.floor(b/32)*32}`;
        colorCounts[color] = (colorCounts[color] || 0) + 1;
        totalPixels++;
      }
    }
    
    const sortedColors = Object.entries(colorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    return {
      dominant: sortedColors[0]?.[0] || '128,128,128',
      palette: sortedColors.map(([color, count]) => ({
        color,
        percentage: (count / totalPixels * 100).toFixed(1)
      })),
      totalColors: Object.keys(colorCounts).length
    };
  }

  // Calculate average brightness
  calculateBrightness(imageData) {
    const data = imageData.data;
    let totalBrightness = 0;
    let pixelCount = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = data[i + 3];
      
      if (alpha > 128) {
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
        totalBrightness += brightness;
        pixelCount++;
      }
    }
    
    return pixelCount > 0 ? (totalBrightness / pixelCount / 255).toFixed(2) : 0;
  }

  // Estimate content type
  estimateContent(width, height, colors) {
    const aspectRatio = width / height;
    const brightness = parseFloat(colors.brightness);
    
    if (aspectRatio > 1.5) {
      return 'landscape/panoramic';
    } else if (aspectRatio < 0.7) {
      return 'portrait/vertical';
    } else if (brightness > 0.8) {
      return 'bright/light';
    } else if (brightness < 0.3) {
      return 'dark/night';
    } else {
      return 'mixed/balanced';
    }
  }

  // Get image format from data URL
  getImageFormat(dataUrl) {
    if (dataUrl.startsWith('data:image/png')) return 'PNG';
    if (dataUrl.startsWith('data:image/jpeg')) return 'JPEG';
    if (dataUrl.startsWith('data:image/gif')) return 'GIF';
    if (dataUrl.startsWith('data:image/webp')) return 'WebP';
    return 'Unknown';
  }

  // Generate image description
  generateImageDescription(analysis) {
    const { colors, brightness, estimatedContent } = analysis;
    
    let description = `This is a ${estimatedContent} image`;
    
    if (colors.dominant) {
      const [r, g, b] = colors.dominant.split(',').map(Number);
      const colorName = this.getColorName(r, g, b);
      description += ` with dominant ${colorName} colors`;
    }
    
    if (brightness > 0.7) {
      description += ', appearing bright and well-lit';
    } else if (brightness < 0.3) {
      description += ', appearing dark or dimly lit';
    }
    
    description += '. The image contains a variety of colors and tones.';
    
    return description;
  }

  // Get approximate color name
  getColorName(r, g, b) {
    if (r > 200 && g < 100 && b < 100) return 'red';
    if (g > 200 && r < 100 && b < 100) return 'green';
    if (b > 200 && r < 100 && g < 100) return 'blue';
    if (r > 200 && g > 200 && b < 100) return 'yellow';
    if (r > 200 && g < 100 && b > 200) return 'magenta';
    if (r < 100 && g > 200 && b > 200) return 'cyan';
    if (r > 200 && g > 200 && b > 200) return 'white';
    if (r < 100 && g < 100 && b < 100) return 'black';
    if (r > 150 && g > 100 && b < 100) return 'brown';
    if (r > 150 && g > 150 && b > 150) return 'gray';
    return 'mixed';
  }
}

// Audio Processor
class AudioProcessor {
  async process(file, context = {}) {
    return new Promise((resolve) => {
      const audio = new Audio();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        audio.onloadedmetadata = () => {
          resolve({
            success: true,
            type: 'audio',
            file: {
              name: file.name,
              size: file.size,
              type: file.type
            },
            metadata: {
              duration: audio.duration,
              format: this.getAudioFormat(file.type),
              estimatedBitrate: this.estimateBitrate(file.size, audio.duration)
            },
            analysis: {
              durationFormatted: this.formatDuration(audio.duration),
              sizeFormatted: this.formatFileSize(file.size),
              estimatedQuality: this.estimateQuality(file.size, audio.duration)
            },
            dataUrl: e.target.result,
            description: `Audio file: ${file.name}, Duration: ${this.formatDuration(audio.duration)}`
          });
        };
        
        audio.onerror = () => {
          resolve({
            success: false,
            error: 'Failed to load audio',
            type: 'audio'
          });
        };
        
        audio.src = e.target.result;
      };
      
      reader.onerror = () => {
        resolve({
          success: false,
          error: 'Failed to read audio file',
          type: 'audio'
        });
      };
      
      reader.readAsDataURL(file);
    });
  }

  getAudioFormat(mimeType) {
    const formats = {
      'audio/mpeg': 'MP3',
      'audio/wav': 'WAV',
      'audio/ogg': 'OGG',
      'audio/aac': 'AAC',
      'audio/mp4': 'M4A'
    };
    return formats[mimeType] || 'Unknown';
  }

  estimateBitrate(fileSize, duration) {
    if (!duration || duration === 0) return 0;
    // Rough estimation: (file size in bits) / duration in seconds
    return Math.round((fileSize * 8) / duration / 1000); // kbps
  }

  estimateQuality(fileSize, duration) {
    const bitrate = this.estimateBitrate(fileSize, duration);
    if (bitrate > 320) return 'Very High';
    if (bitrate > 192) return 'High';
    if (bitrate > 128) return 'Medium';
    if (bitrate > 64) return 'Low';
    return 'Very Low';
  }

  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

// Video Processor (basic implementation)
class VideoProcessor {
  async process(file, context = {}) {
    return {
      success: true,
      type: 'video',
      file: {
        name: file.name,
        size: file.size,
        type: file.type
      },
      metadata: {
        format: this.getVideoFormat(file.type),
        estimatedDuration: 'Unknown (processing not implemented)',
        resolution: 'Unknown'
      },
      description: `Video file: ${file.name} (${this.getVideoFormat(file.type)})`
    };
  }

  getVideoFormat(mimeType) {
    const formats = {
      'video/mp4': 'MP4',
      'video/webm': 'WebM',
      'video/avi': 'AVI',
      'video/quicktime': 'MOV',
      'video/x-msvideo': 'AVI'
    };
    return formats[mimeType] || 'Unknown';
  }
}

// Document Processor
class DocumentProcessor {
  async process(file, context = {}) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target.result;
        
        resolve({
          success: true,
          type: 'document',
          file: {
            name: file.name,
            size: file.size,
            type: file.type
          },
          content: content,
          analysis: {
            characterCount: content.length,
            wordCount: this.countWords(content),
            lineCount: this.countLines(content),
            estimatedReadingTime: this.estimateReadingTime(content)
          },
          description: `Document: ${file.name}, ${this.countWords(content)} words, estimated ${this.estimateReadingTime(content)} reading time`
        });
      };
      
      reader.onerror = () => {
        resolve({
          success: false,
          error: 'Failed to read document',
          type: 'document'
        });
      };
      
      reader.readAsText(file);
    });
  }

  countWords(text) {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  countLines(text) {
    return text.split('\n').length;
  }

  estimateReadingTime(text) {
    const wordsPerMinute = 200;
    const words = this.countWords(text);
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  }
}

// Code Processor
class CodeProcessor {
  async process(file, context = {}) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target.result;
        const analysis = this.analyzeCode(content, file.name);
        
        resolve({
          success: true,
          type: 'code',
          file: {
            name: file.name,
            size: file.size,
            type: file.type
          },
          content: content,
          analysis,
          description: `${analysis.language} code file: ${file.name}, ${analysis.lineCount} lines`
        });
      };
      
      reader.onerror = () => {
        resolve({
          success: false,
          error: 'Failed to read code file',
          type: 'code'
        });
      };
      
      reader.readAsText(file);
    });
  }

  analyzeCode(content, filename) {
    const extension = filename.split('.').pop().toLowerCase();
    const language = this.detectLanguage(extension);
    
    const lines = content.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    const commentLines = this.countComments(lines, language);
    
    return {
      language,
      lineCount: lines.length,
      nonEmptyLineCount: nonEmptyLines.length,
      commentLineCount: commentLines,
      characterCount: content.length,
      estimatedComplexity: this.estimateComplexity(content, language),
      hasMainFunction: this.hasMainFunction(content, language),
      imports: this.countImports(content, language)
    };
  }

  detectLanguage(extension) {
    const languages = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'py': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'html': 'HTML',
      'css': 'CSS',
      'json': 'JSON',
      'xml': 'XML',
      'php': 'PHP',
      'rb': 'Ruby',
      'go': 'Go',
      'rs': 'Rust',
      'sh': 'Shell',
      'sql': 'SQL'
    };
    return languages[extension] || 'Unknown';
  }

  countComments(lines, language) {
    const commentPatterns = {
      'JavaScript': ['//', '/*', '*'],
      'TypeScript': ['//', '/*', '*'],
      'Python': ['#'],
      'Java': ['//', '/*', '*'],
      'C++': ['//', '/*', '*'],
      'C': ['//', '/*', '*'],
      'HTML': ['<!--'],
      'CSS': ['/*', '*']
    };
    
    const patterns = commentPatterns[language] || ['//'];
    return lines.filter(line => {
      const trimmed = line.trim();
      return patterns.some(pattern => trimmed.startsWith(pattern));
    }).length;
  }

  estimateComplexity(content, language) {
    const complexityKeywords = {
      'JavaScript': ['function', 'class', 'if', 'for', 'while', 'switch', 'try', 'catch'],
      'Python': ['def', 'class', 'if', 'for', 'while', 'try', 'except'],
      'Java': ['public', 'private', 'class', 'if', 'for', 'while', 'switch', 'try', 'catch']
    };
    
    const keywords = complexityKeywords[language] || ['function', 'class', 'if', 'for', 'while'];
    let complexity = 0;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) complexity += matches.length;
    });
    
    if (complexity < 10) return 'Low';
    if (complexity < 25) return 'Medium';
    if (complexity < 50) return 'High';
    return 'Very High';
  }

  hasMainFunction(content, language) {
    const mainPatterns = {
      'JavaScript': /function\s+main|exports\.main/,
      'Python': /if\s+__name__\s*==\s*['""]__main__['""]|def\s+main/,
      'Java': /public\s+static\s+void\s+main/,
      'C++': /int\s+main\s*\(/,
      'C': /int\s+main\s*\(/
    };
    
    const pattern = mainPatterns[language];
    return pattern ? pattern.test(content) : false;
  }

  countImports(content, language) {
    const importPatterns = {
      'JavaScript': /import\s+.*from|require\s*\(/g,
      'TypeScript': /import\s+.*from|require\s*\(/g,
      'Python': /import\s+|from\s+.*import/g,
      'Java': /import\s+/g,
      'C++': /#include\s*</g,
      'C': /#include\s*</g
    };
    
    const pattern = importPatterns[language];
    if (!pattern) return 0;
    
    const matches = content.match(pattern);
    return matches ? matches.length : 0;
  }
}

export default new MultiModalService();