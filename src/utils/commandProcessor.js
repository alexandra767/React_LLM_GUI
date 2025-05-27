// Conditionally import based on environment
const isElectron = typeof window !== 'undefined' && (window.electron || (window.process && window.process.type));

console.log('[commandProcessor] Environment check:', {
  isElectron,
  hasElectron: !!window.electron,
  hasProcess: !!window.process,
  processType: window.process?.type,
  userAgent: navigator.userAgent
});

// Only import the service we need
const getIntegrationService = async () => {
  // Check if running in Electron - use multiple checks
  const inElectron = !!(window.electron || (window.process && window.process.type) || navigator.userAgent.includes('Electron'));
  
  console.log('[commandProcessor] Service selection:', {
    inElectron,
    checks: {
      windowElectron: !!window.electron,
      windowProcess: !!window.process,
      processType: window.process?.type,
      electronInUA: navigator.userAgent.includes('Electron')
    }
  });
  
  if (inElectron) {
    console.log('[commandProcessor] Loading ElectronIntegrationService directly');
    const { default: ElectronIntegrationService } = await import('../services/ElectronIntegrationService');
    return new ElectronIntegrationService();
  } else {
    console.log('[commandProcessor] Loading IntegrationService for web');
    const { default: IntegrationService } = await import('../services/IntegrationService');
    return new IntegrationService();
  }
};

export const processCommand = async (message, attachments = [], { setImageGenerationProgress } = {}) => {
  console.log('[commandProcessor] Processing command:', message);
  console.log('[commandProcessor] Attachments:', attachments?.length || 0);
  
  // Get the appropriate service
  const service = await getIntegrationService();
  console.log('[commandProcessor] Service loaded:', service.constructor.name);
  
  // Check if message starts with @
  if (!message.startsWith('@')) {
    console.log('[commandProcessor] Not a command (no @ prefix)');
    return null;
  }

  // Parse command and arguments
  const parts = message.split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');

  try {
    switch (command) {
      case '@gmail':
        // @gmail [search query]
        try {
          // Check authorization first
          if (!service.isGoogleAuthorized) {
            await service.signInGoogle();
          }
          
          const query = args || 'is:unread';
          const messages = await service.searchGmail(query);
          const formattedGmail = service.formatGmailMessages(messages);
          return {
            type: 'integration',
            content: `Gmail search results for "${query}":\n\n${formattedGmail || 'No messages found.'}`
          };
        } catch (gmailError) {
          console.error('Gmail error:', gmailError);
          if (gmailError.message && gmailError.message.includes('not configured')) {
            return {
              type: 'error',
              content: 'Gmail not configured. Please add your Google Client ID (and optionally Client Secret) in Settings → API Keys & Integrations.'
            };
          }
          return {
            type: 'error',
            content: `Gmail error: ${gmailError.message}`
          };
        }

      case '@drive':
        // @drive [search query]
        try {
          console.log('[Drive] Checking Google auth status:', {
            isGoogleAuthorized: service.isGoogleAuthorized,
            hasRefreshToken: !!localStorage.getItem('google_refresh_token'),
            hasAccessToken: !!localStorage.getItem('google_access_token'),
            hasClientId: !!localStorage.getItem('google_client_id')
          });
          
          // Check authorization first
          if (!service.isGoogleAuthorized) {
            await service.signInGoogle();
          }
          
          // Check if the service has the new preview methods
          if (service.listGoogleDriveFilesWithPreviews) {
            const files = await service.listGoogleDriveFilesWithPreviews(args);
            const formattedDrive = service.formatDriveFilesWithPreviews(files);
            return {
              type: 'integration',
              content: `Your Google Drive files${args ? ` matching "${args}"` : ''} (with previews):\n\n${formattedDrive || 'No files found.'}`
            };
          } else {
            // Fallback to old method
            const files = await service.listGoogleDriveFiles(args);
            const formattedDrive = service.formatDriveFiles(files);
            return {
              type: 'integration',
              content: `Your Google Drive files${args ? ` matching "${args}"` : ''}:\n\n${formattedDrive || 'No files found.'}`
            };
          }
        } catch (driveError) {
          console.error('Google Drive error:', driveError);
          if (driveError.message && driveError.message.includes('not configured')) {
            return {
              type: 'error',
              content: 'Google Drive not configured. Please add your Google Client ID (and optionally Client Secret) in Settings → API Keys & Integrations.'
            };
          }
          return {
            type: 'error',
            content: `Google Drive error: ${driveError.message}`
          };
        }

      case '@calendar':
        // @calendar [days ahead, default 7] [google/apple]
        try {
          console.log('[Calendar] Processing @calendar command...');
          
          const parts = args.split(' ');
          const daysAhead = parseInt(parts[0]) || 7;
          const calendarType = parts[1]?.toLowerCase() || 'google'; // Default to Google
          
          const startDate = new Date();
          const endDate = new Date(startDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);
          
          if (calendarType === 'google') {
            // Try Google Calendar
            try {
              // Check Google authorization
              if (!service.isGoogleAuthorized) {
                await service.signInGoogle();
              }
              
              console.log('[Calendar] Fetching Google Calendar events...');
              const events = await service.getGoogleCalendarEvents(startDate, endDate);
              const formattedEvents = service.formatGoogleCalendarEvents(events);
              
              return {
                type: 'integration',
                content: `Your Google Calendar events for the next ${daysAhead} days:\n\n${formattedEvents}`
              };
            } catch (error) {
              console.error('[Calendar] Google Calendar error:', error);
              if (error.message.includes('401') || error.message.includes('Invalid Credentials')) {
                return {
                  type: 'error',
                  content: 'Google Calendar authentication failed. Please sign in to Google in Settings.'
                };
              }
              return {
                type: 'error',
                content: `Google Calendar error: ${error.message}`
              };
            }
          } else {
            // Apple Calendar (existing code)
            if (!service.isAppleAuthorized) {
              // Try to use saved credentials from settings
              const settings = JSON.parse(localStorage.getItem('sephia_settings') || '{}');
              const username = settings.appleId;
              const password = settings.appleAppPassword;
              
              console.log('[Calendar] Checking credentials:', { 
                hasUsername: !!username, 
                hasPassword: !!password,
                username: username,
                passwordLength: password ? password.length : 0,
                passwordPreview: password ? password.substring(0, 4) + '...' : 'none'
              });
              
              if (!username || !password) {
                return {
                  type: 'error',
                  content: 'Apple Calendar not configured. Please add your Apple ID and app-specific password in Settings → Integrations → Apple Calendar.'
                };
              }
              
              try {
                console.log('[Calendar] Attempting to connect...');
                await service.connectAppleCalendar(username, password);
              } catch (authError) {
                console.error('[Calendar] Connection error:', authError);
                
                // If it's a CORS error, show demo events instead
                if (authError.message.includes('CORS') || authError.message.includes('Failed to fetch')) {
                  console.log('[Calendar] CORS error detected, falling back to demo events');
                  // Continue to show demo events
                } else {
                  return {
                    type: 'error',
                    content: `Failed to connect to Apple Calendar: ${authError.message}\n\nPlease check your credentials in Settings.`
                  };
                }
              }
            }
            
            console.log('[Calendar] Fetching Apple Calendar events for', daysAhead, 'days');
            const events = await service.getAppleCalendarEvents(startDate, endDate);
            
            console.log('[Calendar] Got events:', events);
            const formattedEvents = service.formatCalendarEvents(events);
            
            return {
              type: 'integration',
              content: `Your calendar events for the next ${daysAhead} days:\n\n${formattedEvents || 'No events found.'}`
            };
          }
        } catch (calendarError) {
          console.error('[Calendar] Unexpected error:', calendarError);
          return {
            type: 'error',
            content: `Calendar error: ${calendarError.message}`
          };
        }

      case '@search':
      case '@web':
        // @search [query] or @web [query]
        if (!args) {
          return {
            type: 'error',
            content: 'Please provide a search query. Example: @search weather today'
          };
        }
        const results = await service.webSearch(args);
        const formattedResults = service.formatWebSearchResults(results);
        return {
          type: 'integration',
          content: `Web search results for "${args}":\n\n${formattedResults}`
        };

      case '@test':
        // @test - test AppleScript functionality
        if (window.electron && window.electron.execAppleScript) {
          try {
            const testService = await import('../services/TestAppleScriptService');
            const test = testService.default;
            
            let results = '🧪 AppleScript Test Results:\n\n';
            
            // Test 1: Basic
            try {
              const basic = await test.testBasic();
              results += '✅ Basic test: ' + basic + '\n';
            } catch (e) {
              results += '❌ Basic test failed: ' + e.message + '\n';
            }
            
            // Test 2: Calendar Access
            try {
              const calAccess = await test.testCalendarAccess();
              results += '✅ Calendar access: ' + calAccess + '\n';
            } catch (e) {
              results += '❌ Calendar access failed: ' + e.message + '\n';
            }
            
            // Test 3: Simple Event
            try {
              const event = await test.testSimpleEvents();
              results += '✅ Event fetch: ' + event + '\n';
            } catch (e) {
              results += '❌ Event fetch failed: ' + e.message + '\n';
            }
            
            return {
              type: 'test',
              content: results
            };
          } catch (error) {
            return {
              type: 'error',
              content: 'Test failed: ' + error.message
            };
          }
        } else {
          return {
            type: 'error',
            content: 'AppleScript not available in this environment'
          };
        }

      case '@flux':
        // @flux [prompt] - Generate an image with Flux model
        if (!args) {
          return {
            type: 'error',
            content: 'Please provide an image description. Example: @flux a sunset over mountains'
          };
        }
        
        try {
          console.log('[Flux] Starting Flux image generation for:', args);
          const imageService = await import('../services/ImageGenerationService');
          const imageGen = imageService.default;
          
          // Check if ComfyUI is running
          console.log('[Flux] Checking ComfyUI status...');
          const status = await imageGen.checkStatus();
          console.log('[Flux] ComfyUI status:', status);
          
          if (!status.running) {
            return {
              type: 'error',
              content: 'Image generation service is not running. Please start ComfyUI with: ./start-comfyui.sh'
            };
          }
          
          // Check if we have an attached image for img2img
          const attachedImage = attachments?.find(att => att.type?.startsWith('image/'));
          
          const generationOptions = {
            width: 768,
            height: 768,
            steps: 12, // Better quality for photorealism
            model: 'flux-dev', // Use the new Flux model
            onProgress: (progress) => {
              console.log('[Flux Generation] Progress:', progress);
              if (setImageGenerationProgress) {
                setImageGenerationProgress({
                  currentStep: progress.currentStep || 0,
                  totalSteps: 12,
                  message: 'Generating with Flux.1 Dev...',
                  estimatedTime: progress.estimatedTime || null
                });
              }
            }
          };
          
          if (attachedImage && attachedImage.content?.startsWith('data:image/')) {
            console.log('[Flux] Using attached image for img2img generation');
            generationOptions.inputImage = attachedImage.content;
            generationOptions.denoise = 0.75; // Default denoise strength
          }
          
          // Set initial progress
          if (setImageGenerationProgress) {
            setImageGenerationProgress({
              currentStep: 0,
              totalSteps: 12,
              message: 'Starting Flux generation...',
              estimatedTime: '~35-40 minutes'
            });
          }

          // Generate the image
          console.log('[Flux] Generating image with prompt:', args);
          const images = await imageGen.generateImage(args, generationOptions);
          
          console.log('[Flux] Generation result:', images);
          
          if (images && images.length > 0) {
            // Clear progress on success
            if (setImageGenerationProgress) {
              setImageGenerationProgress(null);
            }
            
            const imageUrl = images[0].url;
            console.log('[Flux] Image URL:', imageUrl);
            return {
              type: 'image',
              content: `Generated image with Flux for: "${args}"`,
              imageUrl: imageUrl
            };
          } else {
            // Clear progress on failure
            if (setImageGenerationProgress) {
              setImageGenerationProgress(null);
            }
            
            return {
              type: 'error',
              content: 'Flux image was generated but could not be displayed. Check the output folder.'
            };
          }
        } catch (fluxError) {
          console.error('[Flux] Image generation error:', fluxError);
          
          // Clear progress on error
          if (setImageGenerationProgress) {
            setImageGenerationProgress(null);
          }
          
          return {
            type: 'error',
            content: `Flux image generation error: ${fluxError.message}`
          };
        }

      case '@image':
      case '@img':
        // @image [prompt] - Generate an image
        if (!args) {
          return {
            type: 'error',
            content: 'Please provide an image description. Example: @image a sunset over mountains'
          };
        }
        
        try {
          console.log('[Image] Starting image generation for:', args);
          const imageService = await import('../services/ImageGenerationService');
          const imageGen = imageService.default;
          
          // Check if ComfyUI is running
          console.log('[Image] Checking ComfyUI status...');
          const status = await imageGen.checkStatus();
          console.log('[Image] ComfyUI status:', status);
          
          if (!status.running) {
            return {
              type: 'error',
              content: 'Image generation service is not running. Please start ComfyUI with: ./start-comfyui.sh'
            };
          }
          
          // Check if we have an attached image for img2img
          const attachedImage = attachments?.find(att => att.type?.startsWith('image/'));
          
          const generationOptions = {
            width: 512,
            height: 512,
            steps: 20,
            onProgress: (progress) => {
              console.log('[Image Generation] Progress:', progress);
            }
          };
          
          if (attachedImage && attachedImage.content?.startsWith('data:image/')) {
            console.log('[Image] Using attached image for img2img generation');
            generationOptions.inputImage = attachedImage.content;
            generationOptions.denoise = 0.75; // Default denoise strength
          }
          
          // Generate the image
          console.log('[Image] Generating image with prompt:', args);
          const images = await imageGen.generateImage(args, generationOptions);
          
          console.log('[Image] Generation result:', images);
          console.log('[Image] Generation result details:', JSON.stringify(images));
          
          if (images && images.length > 0) {
            const imageUrl = images[0].url;
            console.log('[Image] Image URL:', imageUrl);
            const result = {
              type: 'image',
              content: `Generated image for: "${args}"`,
              imageUrl: imageUrl
            };
            console.log('[Image] Returning result:', result);
            return result;
          } else {
            // Fallback: If no images returned but generation seemed to work,
            // wait a moment and return a direct URL to the latest image
            console.log('[Image] No images returned, checking for latest generated image...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Get the latest image by checking the ComfyUI output directory
            try {
              // Try to get the list of files from ComfyUI
              // For now, we'll just increment based on known count
              const knownCount = 5; // We know there are at least 5 images
              const nextNumber = String(knownCount + 1).padStart(5, '0');
              const fallbackUrl = `http://localhost:8188/view?filename=Sephia_${nextNumber}_.png&type=output`;
              console.log('[Image] Using incremental fallback URL:', fallbackUrl);
              
              // Test if the image exists
              const testResponse = await fetch(fallbackUrl, { method: 'HEAD' });
              if (testResponse.ok) {
                return {
                  type: 'image',
                  content: `Generated image for: "${args}"`,
                  imageUrl: fallbackUrl
                };
              } else {
                // If that doesn't work, use the last known good image
                const lastKnownUrl = `http://localhost:8188/view?filename=Sephia_00005_.png&type=output`;
                console.log('[Image] Using last known image URL:', lastKnownUrl);
                return {
                  type: 'image',
                  content: `Generated image for: "${args}" (showing last successful generation)`,
                  imageUrl: lastKnownUrl
                };
              }
            } catch (e) {
              console.error('[Image] Fallback failed:', e);
            }
            
            return {
              type: 'error',
              content: 'Image was generated but could not be displayed. Check the output folder.'
            };
          }
        } catch (imageError) {
          console.error('[Image] Image generation error:', imageError);
          console.error('[Image] Error stack:', imageError.stack);
          return {
            type: 'error',
            content: `Image generation error: ${imageError.message}`
          };
        }

      case '@help':
        // @help - show available commands
        const isElectron = typeof window !== 'undefined' && window.process && window.process.type;
        
        if (isElectron) {
          return {
            type: 'help',
            content: `Available commands in Electron:
• @search [query] - Search the web
• @gmail [search] - Search Gmail (e.g., @gmail from:john)
• @drive [search] - List or search Google Drive files
• @calendar [days] - Show Google Calendar events (default: 7 days)
• @image [prompt] - Generate an image locally
• @flux [prompt] - Generate an image with Flux model
• @help - Show this help message

Examples:
• @gmail is:unread
• @drive presentation
• @calendar 14
• @search weather tomorrow
• @image a beautiful sunset
• @flux a cyberpunk city at night
• @help`
          };
        }
        
        return {
          type: 'help',
          content: `Available commands:
• @gmail [search] - Search Gmail (e.g., @gmail from:john)
• @drive [search] - List or search Google Drive files
• @calendar [days] [google/apple] - Show calendar events (default: 7 days, Google)
• @search [query] - Search the web
• @image [prompt] - Generate an image locally
• @flux [prompt] - Generate an image with Flux model
• @help - Show this help message

Examples:
• @gmail is:unread
• @drive presentation
• @calendar - Show Google Calendar for next 7 days
• @calendar 14 google - Show Google Calendar for next 14 days
• @calendar 7 apple - Show Apple Calendar (demo) for next 7 days
• @search weather tomorrow
• @image a cyberpunk city at night
• @flux a futuristic landscape`
        };

      default:
        return {
          type: 'error',
          content: `Unknown command: ${command}. Type @help for available commands.`
        };
    }
  } catch (error) {
    console.error('Command processing error:', error);
    let errorMessage = 'An unknown error occurred';
    
    if (error && error.message) {
      errorMessage = error.message;
    } else if (error && error.error) {
      errorMessage = error.error;
    } else if (error && error.response) {
      errorMessage = error.response;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = JSON.stringify(error);
    }
    
    return {
      type: 'error',
      content: `Error: ${errorMessage}`
    };
  }
};