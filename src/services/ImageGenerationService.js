class ImageGenerationService {
  constructor() {
    this.baseUrl = 'http://localhost:8188';
    this.clientId = 'sephia-' + Math.random().toString(36).substring(7);
    this.ws = null;
    this.isConnected = false;
    this.pendingRequests = new Map();
  }

  async connect() {
    if (this.isConnected) return true;

    try {
      console.log('[ImageGen] Testing ComfyUI connection...');
      // Test if ComfyUI is running
      const response = await fetch(`${this.baseUrl}/system_stats`);
      console.log('[ImageGen] System stats response:', response.status);
      if (!response.ok) throw new Error('ComfyUI not responding');

      // Connect WebSocket for updates
      return new Promise((resolve, reject) => {
        this.ws = new WebSocket(`ws://localhost:8188/ws?clientId=${this.clientId}`);
        
        this.ws.onopen = () => {
          console.log('Connected to ComfyUI WebSocket');
          this.isConnected = true;
          resolve(true);
        };

        this.ws.onerror = (error) => {
          console.error('ComfyUI WebSocket error:', error);
          this.isConnected = false;
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            // Debug all message types to see what ComfyUI sends
            console.log('[ImageGen] WS Message Type:', message.type, 'Data keys:', Object.keys(message.data || {}));
            
            // More detailed logging for executed messages
            if (message.type === 'executed') {
              console.log('[ImageGen] EXECUTED message:', {
                node: message.data?.node,
                hasOutput: !!message.data?.output,
                outputKeys: message.data?.output ? Object.keys(message.data.output) : [],
                images: message.data?.output?.images,
                promptId: message.data?.prompt_id
              });
            }
            
            this.handleWebSocketMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error, 'Raw:', event.data);
          }
        };

        this.ws.onclose = () => {
          console.log('Disconnected from ComfyUI');
          this.isConnected = false;
        };

        // Timeout connection attempt
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('ComfyUI connection timeout'));
          }
        }, 5000);
      });
    } catch (error) {
      console.error('[ImageGen] Failed to connect to ComfyUI:', error);
      console.error('[ImageGen] Error details:', {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name
      });
      return false;
    }
  }

  handleWebSocketMessage(message) {
    console.log('[ImageGen] WebSocket message:', message);
    const { type, data } = message;
    
    if (type === 'executing' && data?.prompt_id) {
      const request = this.pendingRequests.get(data.prompt_id);
      if (request) {
        // Track execution state and estimate progress
        if (!request.executionState) {
          request.executionState = { startTime: Date.now(), nodesSeen: new Set() };
        }
        
        request.executionState.nodesSeen.add(data.node);
        const nodeCount = request.executionState.nodesSeen.size;
        
        // Estimate progress based on nodes executed (rough approximation)
        // For Flux: typically 8-12 major nodes, with KSampler being the main one
        if (data.node === '3') { // KSampler node - this is where the main generation happens
          // Start showing meaningful progress when KSampler starts
          request.onProgress?.({ 
            currentStep: 1, 
            totalSteps: request.totalSteps || 12,
            message: 'Generating with Flux.1 Dev...',
            status: 'sampling'
          });
        } else {
          request.onProgress?.({ 
            currentStep: Math.min(nodeCount, (request.totalSteps || 12) - 1), 
            totalSteps: request.totalSteps || 12,
            message: 'Processing...',
            status: 'executing', 
            node: data.node 
          });
        }
      }
    } else if (type === 'progress' && data?.prompt_id) {
      // Handle progress updates from ComfyUI (if they exist)
      const request = this.pendingRequests.get(data.prompt_id);
      if (request) {
        const { value, max } = data;
        request.onProgress?.({ 
          currentStep: value || 0, 
          totalSteps: max || 1,
          percentage: max > 0 ? (value / max) * 100 : 0
        });
      }
    } else if (type === 'executed' && data?.prompt_id) {
      // Log all executed messages to debug
      console.log('[ImageGen] Executed message for node:', data.node, 'output:', data.output);
      
      // Check if this message has image output (can be any node that saves images)
      if (data.output && data.output.images && Array.isArray(data.output.images)) {
        const request = this.pendingRequests.get(data.prompt_id);
        if (request && !request.resolved) {
          console.log('[ImageGen] Found image output from node:', data.node, 'images:', data.output.images);
          
          const images = data.output.images.map(img => ({
            filename: img.filename,
            subfolder: img.subfolder || '',
            type: img.type || 'output',
            url: `${this.baseUrl}/view?filename=${img.filename}&subfolder=${img.subfolder || ''}&type=${img.type || 'output'}`
          }));
          
          console.log('[ImageGen] Resolving with images:', images);
          request.resolved = true;
          request.resolve(images);
          this.pendingRequests.delete(data.prompt_id);
        }
      }
    } else if (type === 'execution_complete' && data?.prompt_id) {
      // Some versions send this when fully complete
      const request = this.pendingRequests.get(data.prompt_id);
      if (request && !request.resolved) {
        console.log('[ImageGen] Execution complete but no images found');
        request.reject(new Error('Generation completed but no images were produced'));
        this.pendingRequests.delete(data.prompt_id);
      }
    } else if (type === 'execution_error' && data?.prompt_id) {
      const request = this.pendingRequests.get(data.prompt_id);
      if (request) {
        console.error('[ImageGen] Execution error:', data);
        request.reject(new Error(data.exception_message || data.error || 'Generation failed'));
        this.pendingRequests.delete(data.prompt_id);
      }
    }
  }

  async generateImage(prompt, options = {}) {
    console.log('[ImageGen] generateImage called with:', { prompt, options });
    console.log('[ImageGen] Using steps:', options.steps, 'for model:', options.model);
    
    // Check if we have an input image for img2img
    if (options.inputImage) {
      return this.generateImageFromImage(prompt, options);
    }
    
    // Ensure we're connected
    if (!this.isConnected) {
      console.log('[ImageGen] Not connected, attempting to connect...');
      const connected = await this.connect();
      if (!connected) {
        throw new Error('Failed to connect to ComfyUI. Make sure it\'s running with: ./start-comfyui.sh');
      }
    }

    const {
      width = 512,
      height = 512,
      steps = 20,
      cfg = 7,
      sampler = 'euler',
      scheduler = 'normal',
      seed = Math.floor(Math.random() * 1000000),
      model = 'sd15',  // Will need to be configured based on available models
      onProgress = null
    } = options;

    // Create a simple workflow for text2img
    // Check if this is a Flux model and use appropriate workflow
    const isFluxModel = model.includes('flux');
    
    let workflow;
    
    if (isFluxModel) {
      // Flux-specific workflow with separate model and CLIP loaders
      workflow = {
        "3": {
          "inputs": {
            "seed": seed,
            "steps": steps,
            "cfg": cfg,
            "sampler_name": sampler,
            "scheduler": scheduler,
            "denoise": 1,
            "model": ["4", 0],
            "positive": ["6", 0],
            "negative": ["7", 0],
            "latent_image": ["5", 0]
          },
          "class_type": "KSampler"
        },
        "4": {
          "inputs": {
            "unet_name": this.getModelName(model),
            "weight_dtype": "default"
          },
          "class_type": "UNETLoader"
        },
        "5": {
          "inputs": {
            "width": width,
            "height": height,
            "batch_size": 1
          },
          "class_type": "EmptyLatentImage"
        },
        "6": {
          "inputs": {
            "text": prompt,
            "clip": ["10", 0]
          },
          "class_type": "CLIPTextEncode"
        },
        "7": {
          "inputs": {
            "text": "",
            "clip": ["10", 0]
          },
          "class_type": "CLIPTextEncode"
        },
        "8": {
          "inputs": {
            "samples": ["3", 0],
            "vae": ["11", 0]
          },
          "class_type": "VAEDecode"
        },
        "9": {
          "inputs": {
            "filename_prefix": "Sephia",
            "images": ["8", 0]
          },
          "class_type": "SaveImage"
        },
        "10": {
          "inputs": {
            "clip_name1": "clip_l.safetensors",
            "clip_name2": "t5xxl_fp16.safetensors",
            "type": "flux"
          },
          "class_type": "DualCLIPLoader"
        },
        "11": {
          "inputs": {
            "vae_name": "ae.safetensors"
          },
          "class_type": "VAELoader"
        }
      };
    } else {
      // Standard workflow for non-Flux models
      workflow = {
        "3": {
          "inputs": {
            "seed": seed,
            "steps": steps,
            "cfg": cfg,
            "sampler_name": sampler,
            "scheduler": scheduler,
            "denoise": 1,
            "model": ["4", 0],
            "positive": ["6", 0],
            "negative": ["7", 0],
            "latent_image": ["5", 0]
          },
          "class_type": "KSampler"
        },
        "4": {
          "inputs": {
            "ckpt_name": this.getModelName(model)
          },
          "class_type": "CheckpointLoaderSimple"
        },
        "5": {
          "inputs": {
            "width": width,
            "height": height,
            "batch_size": 1
          },
          "class_type": "EmptyLatentImage"
        },
        "6": {
          "inputs": {
            "text": prompt,
            "clip": ["4", 1]
          },
          "class_type": "CLIPTextEncode"
        },
        "7": {
          "inputs": {
            "text": "",
            "clip": ["4", 1]
          },
          "class_type": "CLIPTextEncode"
        },
        "8": {
          "inputs": {
            "samples": ["3", 0],
            "vae": ["4", 2]
          },
          "class_type": "VAEDecode"
        },
        "9": {
          "inputs": {
            "filename_prefix": "Sephia",
            "images": ["8", 0]
          },
          "class_type": "SaveImage"
        }
      };
    }

    // Submit the workflow
    const promptId = await this.queuePrompt(workflow);

    // Create promise to track completion
    return new Promise((resolve, reject) => {
      console.log('[ImageGen] Creating promise for promptId:', promptId);
      this.pendingRequests.set(promptId, {
        resolve,
        reject,
        onProgress,
        resolved: false,
        totalSteps: steps
      });

      // No fallback needed - WebSocket messages are working correctly

      // No timeout for Flux models - they can take 30-60+ minutes
      // Keep a reasonable timeout for other models
      if (workflow["4"]?.class_type !== "UNETLoader") {
        const timeoutMs = 300000; // 5 minutes for non-Flux models
        setTimeout(() => {
          if (this.pendingRequests.has(promptId)) {
            console.log('[ImageGen] Timeout reached for promptId:', promptId);
            this.pendingRequests.delete(promptId);
            reject(new Error('Image generation timeout'));
          }
        }, timeoutMs);
      }
    });
  }

  async generateImageFromImage(prompt, options = {}) {
    console.log('[ImageGen] generateImageFromImage called with:', { prompt, options });
    
    // Ensure we're connected
    if (!this.isConnected) {
      console.log('[ImageGen] Not connected, attempting to connect...');
      const connected = await this.connect();
      if (!connected) {
        throw new Error('Failed to connect to ComfyUI. Make sure it\'s running with: ./start-comfyui.sh');
      }
    }

    const {
      inputImage,
      width = 512,
      height = 512,
      steps = 20,
      cfg = 7,
      sampler = 'euler',
      scheduler = 'normal',
      seed = Math.floor(Math.random() * 1000000),
      model = 'sd15',
      denoise = 0.75, // How much to change the image (0=no change, 1=complete change)
      onProgress = null
    } = options;

    // First, upload the image to ComfyUI
    const imageName = await this.uploadImage(inputImage);

    // Create img2img workflow
    const workflow = {
      "3": {
        "inputs": {
          "seed": seed,
          "steps": steps,
          "cfg": cfg,
          "sampler_name": sampler,
          "scheduler": scheduler,
          "denoise": denoise,
          "model": ["4", 0],
          "positive": ["6", 0],
          "negative": ["7", 0],
          "latent_image": ["10", 0]  // Changed to use encoded image
        },
        "class_type": "KSampler"
      },
      "4": {
        "inputs": {
          "ckpt_name": this.getModelName(model)
        },
        "class_type": "CheckpointLoaderSimple"
      },
      "6": {
        "inputs": {
          "text": prompt,
          "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "7": {
        "inputs": {
          "text": "",
          "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "8": {
        "inputs": {
          "samples": ["3", 0],
          "vae": ["4", 2]
        },
        "class_type": "VAEDecode"
      },
      "9": {
        "inputs": {
          "filename_prefix": "Sephia_img2img",
          "images": ["8", 0]
        },
        "class_type": "SaveImage"
      },
      "10": {
        "inputs": {
          "pixels": ["11", 0],
          "vae": ["4", 2]
        },
        "class_type": "VAEEncode"
      },
      "11": {
        "inputs": {
          "image": imageName,
          "upload": "image"
        },
        "class_type": "LoadImage"
      }
    };

    // Submit the workflow
    const promptId = await this.queuePrompt(workflow);

    // Create promise to track completion
    return new Promise((resolve, reject) => {
      console.log('[ImageGen] Creating promise for img2img promptId:', promptId);
      this.pendingRequests.set(promptId, {
        resolve,
        reject,
        onProgress,
        resolved: false,
        totalSteps: steps
      });

      // No timeout for img2img - can take a long time
      // Keep a reasonable timeout for non-Flux models
      if (workflow["4"]?.class_type !== "CheckpointLoaderSimple" || !this.getModelName(model).includes('flux')) {
        const timeoutMs = 300000; // 5 minutes for non-Flux models
        setTimeout(() => {
          if (this.pendingRequests.has(promptId)) {
            console.log('[ImageGen] Timeout reached for promptId:', promptId);
            this.pendingRequests.delete(promptId);
            reject(new Error('Image generation timeout'));
          }
        }, timeoutMs);
      }
    });
  }

  async uploadImage(base64Image) {
    console.log('[ImageGen] Uploading image to ComfyUI');
    
    // Convert base64 to blob
    const base64Data = base64Image.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });

    // Create form data
    const formData = new FormData();
    formData.append('image', blob, 'input.png');
    formData.append('type', 'input');
    formData.append('overwrite', 'true');

    // Upload
    const response = await fetch(`${this.baseUrl}/upload/image`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const result = await response.json();
    console.log('[ImageGen] Image uploaded:', result);
    
    // Return the filename for use in workflow
    return result.name || 'input.png';
  }

  async queuePrompt(workflow) {
    const response = await fetch(`${this.baseUrl}/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: workflow,
        client_id: this.clientId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to queue prompt');
    }

    const result = await response.json();
    return result.prompt_id;
  }

  getModelName(modelKey) {
    // Map friendly names to actual model filenames
    // You'll need to update this based on what models you download
    const modelMap = {
      'sd15': 'v1-5-pruned-emaonly.ckpt',
      'sd': 'v1-5-pruned-emaonly.ckpt', // alias
      'default': 'v1-5-pruned-emaonly.ckpt', // default
      'realistic': 'realisticVisionV51.safetensors',
      'rv': 'realisticVisionV51.safetensors', // alias
      'sdxl': 'sd_xl_base_1.0.safetensors',
      'flux': 'flux1-dev.safetensors',
      'flux1': 'flux1-dev.safetensors',
      'flux-dev': 'flux1-dev.safetensors' // New Flux model for @flux command
    };

    return modelMap[modelKey] || modelMap['default'];
  }

  async getAvailableModels() {
    try {
      const response = await fetch(`${this.baseUrl}/object_info/CheckpointLoaderSimple`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.CheckpointLoaderSimple.input.required.ckpt_name[0] || [];
    } catch (error) {
      console.error('Failed to get available models:', error);
      return [];
    }
  }

  async checkStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/system_stats`);
      if (!response.ok) return { running: false };
      
      const stats = await response.json();
      return {
        running: true,
        ...stats
      };
    } catch (error) {
      return { running: false };
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.pendingRequests.clear();
  }
}

export default new ImageGenerationService();