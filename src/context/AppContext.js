import React, { createContext, useState, useContext, useEffect } from 'react';
import llmService from '../services/LLMService';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

// Load chats from localStorage
const loadChats = () => {
  try {
    const savedChats = localStorage.getItem('sephia_chats');
    return savedChats ? JSON.parse(savedChats) : [];
  } catch (error) {
    console.error('Failed to load chats from localStorage:', error);
    return [];
  }
};

// Load projects from localStorage
const loadProjects = () => {
  try {
    const savedProjects = localStorage.getItem('sephia_projects');
    return savedProjects ? JSON.parse(savedProjects) : [];
  } catch (error) {
    console.error('Failed to load projects from localStorage:', error);
    return [];
  }
};

// Load profile from localStorage
const loadProfile = () => {
  try {
    const savedProfile = localStorage.getItem('sephia_profile');
    return savedProfile ? JSON.parse(savedProfile) : {
      name: 'User',
      picture: null,
      bio: '',
    };
  } catch (error) {
    console.error('Failed to load profile from localStorage:', error);
    return {
      name: 'User',
      picture: null,
      bio: '',
    };
  }
};

export const AppProvider = ({ children }) => {
  const [currentModel, setCurrentModel] = useState('deepseek-r1:14b');
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [appState, setAppState] = useState({
    sidebarCollapsed: false,
    activeSection: 'ollama', // Default to ollama chat view
    connectionStatus: 'disconnected', // 'connected', 'connecting', 'disconnected',
    ollamaStatus: 'disconnected' // 'connected', 'connecting', 'disconnected'
  });
  
  const [chats, setChats] = useState(loadChats());
  const [projects, setProjects] = useState(loadProjects());
  const [currentChat, setCurrentChat] = useState(null);
  const [profile, setProfile] = useState(loadProfile());
  const [tokenCount, setTokenCount] = useState({ input: 0, output: 0, total: 0 });
  const [messageDuration, setMessageDuration] = useState(0);
  
  // Save chats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('sephia_chats', JSON.stringify(chats));
  }, [chats]);
  
  // Save projects to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('sephia_projects', JSON.stringify(projects));
  }, [projects]);
  
  // Save profile to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sephia_profile', JSON.stringify(profile));
  }, [profile]);
  
  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        setAppState(prev => ({
          ...prev,
          connectionStatus: 'connecting'
        }));
        
        console.log("Fetching models from service and terminal...");
        
        // Immediately set hard-coded models that match what we know exists
        const hardcodedModels = [
          { id: 'deepseek-r1:32b', name: 'DeepSeek R1 (32B)', type: 'local' },
          { id: 'deepseek-r1:8b-m4', name: 'DeepSeek 8B-M4', type: 'local' },
          { id: 'deepseek-r1:14b-m4', name: 'DeepSeek 14B-M4', type: 'local' },
          { id: 'deepseek-r1:8b', name: 'DeepSeek 8B', type: 'local' },
          { id: 'deepseek-r1:14b', name: 'DeepSeek 14B', type: 'local' }
        ];
        
        // Set hardcoded models immediately
        setModels(hardcodedModels);
        
        // Try to get actual models from Ollama in the background
        try {
          const ollamaModels = await llmService.getAvailableModels();
          
          // Only update if we got real models back
          if (ollamaModels && ollamaModels.length > 0) {
            // Map to our format
            const mappedModels = ollamaModels.map(model => ({
              id: model.id || model.name || 'unknown',
              name: model.name || 'Unknown Model',
              type: 'local',
              size: model.size || 'Unknown size',
            }));
            
            console.log("Loaded models from Ollama:", mappedModels);
            setModels(mappedModels);
            
            setAppState(prev => ({
              ...prev,
              connectionStatus: 'connected'
            }));
          }
        } catch (apiError) {
          console.error("Error fetching models from API:", apiError);
          // We keep the hardcoded models already set
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Failed in model fetch process:', err);
        setError('Failed to fetch models');
        
        // Ensure we at least have the hardcoded models
        setModels([
          { id: 'deepseek-r1:32b', name: 'DeepSeek R1 (32B)', type: 'local' },
          { id: 'deepseek-r1:8b-m4', name: 'DeepSeek 8B-M4', type: 'local' },
          { id: 'deepseek-r1:14b-m4', name: 'DeepSeek 14B-M4', type: 'local' },
          { id: 'deepseek-r1:8b', name: 'DeepSeek 8B', type: 'local' },
          { id: 'deepseek-r1:14b', name: 'DeepSeek 14B', type: 'local' }
        ]);
        
        setAppState(prev => ({
          ...prev,
          connectionStatus: 'disconnected'
        }));
        
        setLoading(false);
      }
    };
    
    fetchModels();
    
    // Set up a refresh interval to periodically check for new models
    const modelRefreshInterval = setInterval(() => {
      fetchModels();
    }, 60000); // Refresh every 60 seconds
    
    return () => {
      clearInterval(modelRefreshInterval);
    };
  }, []);
  
  const toggleSidebar = () => {
    setAppState(prev => ({
      ...prev,
      sidebarCollapsed: !prev.sidebarCollapsed
    }));
  };
  
  const setActiveSection = (section) => {
    setAppState(prev => ({
      ...prev,
      activeSection: section
    }));
  };

  const updateProfile = (newProfileData) => {
    setProfile(prev => ({
      ...prev,
      ...newProfileData
    }));
  };
  
  const createNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      model: currentModel,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tokenCount: 0
    };
    
    setChats(prev => [newChat, ...prev]);
    setCurrentChat(newChat);
    setAppState(prev => ({
      ...prev,
      activeSection: 'chat'
    }));
    
    return newChat;
  };

  const sendMessage = async (chatId, message, options = {}) => {
    try {
      // Find the chat to update
      const chatIndex = chats.findIndex(c => c.id === chatId);
      if (chatIndex === -1) {
        throw new Error(`Chat with ID ${chatId} not found`);
      }
      
      // Add the user message to the chat
      const chatToUpdate = { ...chats[chatIndex] };
      const userMessage = {
        id: Date.now().toString(),
        content: message,
        role: 'user',
        timestamp: new Date().toISOString(),
      };
      
      chatToUpdate.messages = [...chatToUpdate.messages, userMessage];
      chatToUpdate.updatedAt = new Date().toISOString();
      
      // Update the chat with the user message
      const updatedChats = [...chats];
      updatedChats[chatIndex] = chatToUpdate;
      setChats(updatedChats);
      
      // Get response from the LLM service
      const response = await llmService.generateResponse(message, {
        model: currentModel,
        ...options
      });
      
      // Add the AI response to the chat
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: response.text,
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };
      
      chatToUpdate.messages = [...chatToUpdate.messages, aiMessage];
      chatToUpdate.updatedAt = new Date().toISOString();
      
      // Update token counts
      chatToUpdate.tokenCount = (chatToUpdate.tokenCount || 0) + 
        (response.tokens?.input || 0) + 
        (response.tokens?.output || 0);
      
      // Update the chat with the AI response
      updatedChats[chatIndex] = chatToUpdate;
      setChats(updatedChats);
      
      // Update application token counts
      updateTokenCount(response.tokens);
      
      // Update message generation duration
      setMessageTime(response.duration);
      
      return aiMessage;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  // Function to support streaming messages
  const streamMessage = async (message, options = {}, onChunk) => {
    try {
      console.log(`AppContext: Streaming message using model ${currentModel}`);
      
      // First validate the connection status
      if (appState.connectionStatus !== 'connected') {
        console.log('Connection not established, setting to connecting state...');
        setAppState(prev => ({
          ...prev,
          connectionStatus: 'connecting'
        }));
        
        // Add a short delay to ensure UI updates
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Wrap the onChunk callback to update connection status based on responses
      const enhancedCallback = (chunkData) => {
        try {
          const data = JSON.parse(chunkData);
          
          // If we get a successful response, update connection status
          if (data.response && !data.error) {
            if (appState.connectionStatus !== 'connected') {
              console.log('Received valid response, updating connection status to connected');
              setAppState(prev => ({
                ...prev,
                connectionStatus: 'connected'
              }));
            }
          } 
          // If we get an error response, update connection status
          else if (data.error) {
            console.log('Received error response, updating connection status to disconnected');
            setAppState(prev => ({
              ...prev,
              connectionStatus: 'disconnected'
            }));
          }
          
          // Pass the data to the original callback
          if (onChunk) {
            onChunk(chunkData);
          }
        } catch (e) {
          console.error('Error processing chunk in enhanced callback:', e);
          // Still try to pass the data to the original callback
          if (onChunk) {
            onChunk(chunkData);
          }
        }
      };
      
      return await llmService.streamMessage(message, { 
        model: currentModel,
        ...options 
      }, enhancedCallback);
    } catch (error) {
      console.error('Error streaming message:', error);
      
      // Update connection status on error
      setAppState(prev => ({
        ...prev,
        connectionStatus: 'disconnected'
      }));
      
      throw error;
    }
  };

  const createNewProject = (projectData) => {
    const newProject = {
      id: Date.now().toString(),
      title: projectData.title || 'New Project',
      description: projectData.description || '',
      chats: [],
      files: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setProjects(prev => [newProject, ...prev]);
    return newProject;
  };
  
  const deleteChat = (chatId) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChat && currentChat.id === chatId) {
      setCurrentChat(null);
    }
  };
  
  const deleteProject = (projectId) => {
    setProjects(prev => prev.filter(project => project.id !== projectId));
  };
  
  const loadModel = async (modelId) => {
    try {
      // Set model first, so UI doesn't get stuck
      setCurrentModel(modelId);
      
      console.log(`Loading model: ${modelId}`);
      
      // For M4 Macs, skip the connecting state and just set to connected immediately
      // This prevents the UI from getting stuck in "connecting" state
      setAppState(prev => ({
        ...prev,
        connectionStatus: 'connected'
      }));
      
      // In the background, try to actually warm up the model without blocking UI
      setTimeout(async () => {
        try {
          // Quick tags check - more reliable than health endpoint
          const tagsResponse = await fetch('http://localhost:11434/api/tags', { 
            method: 'GET',
            signal: AbortSignal.timeout(3000)
          }).catch(() => null);
          
          if (tagsResponse?.ok) {
            console.log("Ollama is available");
            
            // For M4 Mac optimization, setup options for best performance
            const warmupBody = {
              model: modelId,
              prompt: 'Hello',
              stream: false,
              max_tokens: 5,
              num_gpu: 1,          // Use GPU acceleration
              num_thread: 8,       // Use 8 CPU threads for M4
              num_keep: 0,         // Don't keep context in memory
              temperature: 0.7,    // Standard temperature
              repeat_penalty: 1.1, // Prevent repetition
              tfs_z: 1.0           // Top frequent sampling
            };
            
            // Start a non-blocking model warmup
            fetch('http://localhost:11434/api/generate', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(warmupBody),
              signal: AbortSignal.timeout(3000) // Short timeout for warmup
            }).catch(() => {
              console.log("Model warmup request sent in background");
            });
          }
        } catch (e) {
          // Silently continue - we don't want to block the UI
          console.warn('Background model preparation error (non-critical):', e);
        }
      }, 100); // Start the background task quickly but don't block UI
      
      return true;
    } catch (error) {
      console.error('Failed to load model:', error);
      
      // Even on error, keep the new model selected, just mark as disconnected
      setCurrentModel(modelId);
      setAppState(prev => ({
        ...prev,
        connectionStatus: 'disconnected'
      }));
      
      return false;
    }
  };
  
  const unloadModel = async (modelId) => {
    try {
      // In a real implementation, this would call Ollama's API to unload the model
      // await llmService.unloadModel(modelId);
      
      // Simulate unloading
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // If the current model is being unloaded, switch to default
      if (currentModel === modelId) {
        setCurrentModel(models[0]?.id || 'unknown');
      }
      
      return true;
    } catch (error) {
      console.error('Failed to unload model:', error);
      return false;
    }
  };
  
  const updateTokenCount = (newTokens) => {
    setTokenCount(prev => ({
      input: prev.input + (newTokens?.input || 0),
      output: prev.output + (newTokens?.output || 0),
      total: prev.total + (newTokens?.input || 0) + (newTokens?.output || 0)
    }));
  };
  
  const resetTokenCount = () => {
    setTokenCount({ input: 0, output: 0, total: 0 });
  };
  
  const setMessageTime = (duration) => {
    setMessageDuration(duration);
  };
  
  const value = {
    currentModel,
    setCurrentModel,
    models,
    loading,
    error,
    appState,
    setAppState,
    chats,
    setChats,
    projects,
    setProjects,
    currentChat,
    setCurrentChat,
    sendMessage,
    streamMessage,
    profile,
    updateProfile,
    tokenCount,
    updateTokenCount,
    resetTokenCount,
    messageDuration,
    setMessageTime,
    toggleSidebar,
    setActiveSection,
    createNewChat,
    createNewProject,
    deleteChat,
    deleteProject,
    loadModel,
    unloadModel
  };
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};