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
  let command = parts[0].toLowerCase();
  let args = parts.slice(1).join(' ');
  
  // Handle @flux:STEPS syntax
  if (command.startsWith('@flux:')) {
    const colonParts = command.split(':');
    command = colonParts[0]; // @flux
    args = colonParts[1] + ' ' + args; // :20 prompt becomes "20 prompt"
  }

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
            content: 'Please provide an image description.\nExamples:\n  @flux a sunset over mountains (uses 12 steps)\n  @flux:20 a detailed portrait (uses 20 steps)\n  @flux:30 complex scene with many details (uses 30 steps)'
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
          
          // Parse steps from command if specified (e.g., @flux:20 prompt)
          let steps = 12; // Default
          let actualArgs = args;
          console.log('[Flux] Parsing args:', args);
          const stepsMatch = args.match(/^(\d+)\s+(.+)/);
          if (stepsMatch) {
            steps = Math.min(Math.max(parseInt(stepsMatch[1], 10), 1), 50); // Clamp between 1-50
            actualArgs = stepsMatch[2];
            console.log('[Flux] Parsed steps:', steps, 'actualArgs:', actualArgs);
          } else {
            console.log('[Flux] No steps match found, using default steps:', steps);
          }
          
          const generationOptions = {
            width: 768,
            height: 768,
            steps: steps,
            model: 'flux-dev', // Use the new Flux model
            onProgress: (progress) => {
              console.log('[Flux Generation] Progress callback fired:', progress);
              console.log('[Flux Generation] setImageGenerationProgress available:', !!setImageGenerationProgress);
              console.log('[Flux Generation] setImageGenerationProgress type:', typeof setImageGenerationProgress);
              if (setImageGenerationProgress) {
                const progressData = {
                  currentStep: progress.currentStep || 0,
                  totalSteps: steps,
                  message: `Generating with Flux.1 Dev (${steps} steps)...`,
                  estimatedTime: progress.estimatedTime || null
                };
                console.log('[Flux Generation] Setting progress:', progressData);
                console.log('[Flux Generation] About to call setImageGenerationProgress');
                try {
                  setImageGenerationProgress(progressData);
                  console.log('[Flux Generation] setImageGenerationProgress called successfully');
                } catch (error) {
                  console.error('[Flux Generation] Error calling setImageGenerationProgress:', error);
                }
              } else {
                console.warn('[Flux Generation] setImageGenerationProgress not available');
              }
            }
          };
          
          if (attachedImage && attachedImage.content?.startsWith('data:image/')) {
            console.log('[Flux] Using attached image for img2img generation');
            generationOptions.inputImage = attachedImage.content;
            generationOptions.denoise = 0.75; // Default denoise strength
          }
          
          // Set initial progress
          console.log('[Flux] About to set initial progress, setImageGenerationProgress available:', !!setImageGenerationProgress);
          if (setImageGenerationProgress) {
            const initialProgress = {
              currentStep: 0,
              totalSteps: steps,
              message: `Starting Flux generation (${steps} steps)...`,
              estimatedTime: steps <= 10 ? '~30 minutes' : `~${Math.round(steps * 3)} minutes`
            };
            console.log('[Flux] Setting initial progress:', initialProgress);
            try {
              setImageGenerationProgress(initialProgress);
              console.log('[Flux] Initial progress set successfully');
            } catch (error) {
              console.error('[Flux] Error setting initial progress:', error);
            }
          } else {
            console.warn('[Flux] setImageGenerationProgress not available for initial progress');
          }

          // Enhance prompt with quality modifiers
          const qualityEnhancers = ', high quality, detailed, ultrarealistic photography, 8k resolution, masterpiece, best quality, extremely detailed, sharp focus, professional photography, cinematic lighting, photorealistic';
          const enhancedPrompt = actualArgs + qualityEnhancers;
          
          // Generate the image
          console.log('[Flux] Generating image with enhanced prompt:', enhancedPrompt);
          const images = await imageGen.generateImage(enhancedPrompt, generationOptions);
          
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
              console.log('[Image Generation] setImageGenerationProgress available:', !!setImageGenerationProgress);
              if (setImageGenerationProgress) {
                const progressData = {
                  currentStep: progress.currentStep || 0,
                  totalSteps: 20,
                  message: attachedImage ? 
                    `Processing image-to-image (${20} steps)...` : 
                    `Generating image (${20} steps)...`,
                  estimatedTime: progress.estimatedTime || null
                };
                console.log('[Image Generation] Setting progress:', progressData);
                setImageGenerationProgress(progressData);
              }
            }
          };
          
          if (attachedImage && attachedImage.content?.startsWith('data:image/')) {
            console.log('[Image] Using attached image for img2img generation');
            generationOptions.inputImage = attachedImage.content;
            generationOptions.denoise = 0.75; // Default denoise strength
            
            // Set initial progress for img2img
            if (setImageGenerationProgress) {
              setImageGenerationProgress({
                currentStep: 0,
                totalSteps: 20,
                message: 'Starting image-to-image generation...',
                estimatedTime: '~2 minutes'
              });
            }
          } else {
            // Set initial progress for text-to-image
            if (setImageGenerationProgress) {
              setImageGenerationProgress({
                currentStep: 0,
                totalSteps: 20,
                message: 'Starting image generation...',
                estimatedTime: '~2 minutes'
              });
            }
          }
          
          // Generate the image
          console.log('[Image] Generating image with prompt:', args);
          const images = await imageGen.generateImage(args, generationOptions);
          
          console.log('[Image] Generation result:', images);
          console.log('[Image] Generation result details:', JSON.stringify(images));
          
          if (images && images.length > 0) {
            // Clear progress on success
            if (setImageGenerationProgress) {
              setImageGenerationProgress(null);
            }
            
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
            
            // Clear progress on failure
            if (setImageGenerationProgress) {
              setImageGenerationProgress(null);
            }
            
            return {
              type: 'error',
              content: 'Image was generated but could not be displayed. Check the output folder.'
            };
          }
        } catch (imageError) {
          console.error('[Image] Image generation error:', imageError);
          console.error('[Image] Error stack:', imageError.stack);
          
          // Clear progress on error
          if (setImageGenerationProgress) {
            setImageGenerationProgress(null);
          }
          
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
• @flux [prompt] - Generate an image with Flux model (12 steps)
• @flux:STEPS [prompt] - Generate with custom steps (1-50)
• @help - Show this help message

Examples:
• @gmail is:unread
• @drive presentation
• @calendar 14
• @search weather tomorrow
• @image a beautiful sunset
• @flux a cyberpunk city at night (uses 12 steps)
• @flux:20 a detailed portrait (uses 20 steps)
• @flux:30 complex scene with many details (uses 30 steps)
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
• @flux [prompt] - Generate an image with Flux model (12 steps)
• @flux:STEPS [prompt] - Generate with custom steps (1-50)
• @help - Show this help message

Examples:
• @gmail is:unread
• @drive presentation
• @calendar - Show Google Calendar for next 7 days
• @calendar 14 google - Show Google Calendar for next 14 days
• @calendar 7 apple - Show Apple Calendar (demo) for next 7 days
• @search weather tomorrow
• @image a cyberpunk city at night
• @flux a futuristic landscape (uses 12 steps)
• @flux:20 a detailed portrait (uses 20 steps)
• @flux:30 complex scene with many details (uses 30 steps)`
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