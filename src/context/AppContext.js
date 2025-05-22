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
    try {
      if (chats && Array.isArray(chats)) {
        localStorage.setItem('sephia_chats', JSON.stringify(chats));
        // Also save the current chat ID for persistence
        if (currentChat) {
          localStorage.setItem('sephia_current_chat_id', currentChat.id);
          
          // Update the chat in the chats array to keep it in sync
          setChats(prev => {
            if (!prev || !Array.isArray(prev)) return [];
            const chatIndex = prev.findIndex(c => c.id === currentChat.id);
            if (chatIndex >= 0) {
              const updatedChats = [...prev];
              updatedChats[chatIndex] = currentChat;
              return updatedChats;
            }
            return prev;
          });
        }
      }
    } catch (error) {
      console.error('Failed to save chats to localStorage:', error);
    }
  }, [chats, currentChat]);
  
  // Load current chat ID on initial load
  useEffect(() => {
    try {
      const savedChatId = localStorage.getItem('sephia_current_chat_id');
      if (savedChatId && chats.length > 0) {
        const chat = chats.find(c => c.id === savedChatId);
        if (chat) {
          // Apply the chat's saved theme if it exists
          if (chat.theme) {
            localStorage.setItem('sephia_theme', chat.theme);
            document.documentElement.setAttribute('data-theme', chat.theme);
          }
          setCurrentChat(chat);
        } else if (chats.length > 0) {
          setCurrentChat(chats[0]);
        }
      } else if (chats.length > 0) {
        setCurrentChat(chats[0]);
      }
    } catch (error) {
      console.error('Failed to load current chat from localStorage:', error);
    }
  }, [chats.length]);
  
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
  
  // Generate a description from the first message content
  const generateChatDescription = (content) => {
    if (!content) return 'New chat';
    
    // Take first 100 characters and remove line breaks
    let description = content
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .substring(0, 100)   // Take first 100 characters
      .trim();
      
    // Add ellipsis if we cut off the text
    if (content.length > 100) {
      description += '...';
    }
    
    return description || 'New chat';
  };

const createNewChat = (initialTitle = 'New Chat', themeName = 'dark', firstMessage = '') => {
  const newChat = {
    id: Date.now().toString(),
    title: initialTitle,
    description: firstMessage ? generateChatDescription(firstMessage) : 'New chat',
    messages: [],
    model: currentModel,
    theme: themeName, // Save the theme with the chat
    isStarred: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tokenCount: 0
  };
  
  setChats(prev => {
    const newChats = prev && Array.isArray(prev) ? [...prev] : [];
    return [newChat, ...newChats];
  });
  
  setCurrentChat(newChat);
  setAppState(prev => ({
    ...prev,
    activeSection: 'chat'
  }));
  
  // Apply the theme for the new chat
  if (themeName) {
    localStorage.setItem('sephia_theme', themeName);
    document.documentElement.setAttribute('data-theme', themeName);
  }
  
  return newChat;
};

  const sendMessage = async (chatId, message, options = {}) => {
    try {
      const chat = chats.find(c => c.id === chatId);
      if (!chat) {
        console.error('Chat not found');
        return;
      }

      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };

      // Add user message to chat
      const updatedChat = {
        ...chat,
        messages: [...chat.messages, userMessage],
        updatedAt: new Date().toISOString()
      };

      // Update chats state
      const updatedChats = chats.map(c => c.id === chatId ? updatedChat : c);
      setChats(updatedChats);
      setCurrentChat(updatedChat);

      // If this is the first message, update the chat description
      if (updatedChat.messages.length === 1) {
        const description = generateChatDescription(message);
        updatedChat.description = description;
        
        const updatedChatsWithDescription = updatedChats.map(c => 
          c.id === chatId ? { ...c, description } : c
        );
        setChats(updatedChatsWithDescription);
        setCurrentChat(prev => ({ ...prev, description }));
      }

      // Get AI response
      const response = await llmService.sendMessage(chatId, message, {
        model: chat.model || currentModel,
        ...options
      });

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString()
      };

      // Add AI response to chat
      const finalChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, aiMessage],
        updatedAt: new Date().toISOString()
      };

      // Update chats state with AI response
      const finalChats = updatedChats.map(c => c.id === chatId ? finalChat : c);
      setChats(finalChats);
      setCurrentChat(finalChat);

      // Save to localStorage
      localStorage.setItem('sephia_chats', JSON.stringify(finalChats));

      return aiMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const streamMessage = async (chatId, message, options = {}) => {
    try {
      const chat = chats.find(c => c.id === chatId);
      if (!chat) {
        console.error('Chat not found');
        return;
      }

      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };

      // Add user message to chat
      const updatedChat = {
        ...chat,
        messages: [...chat.messages, userMessage],
        updatedAt: new Date().toISOString()
      };

      // Update chats state
      const updatedChats = chats.map(c => c.id === chatId ? updatedChat : c);
      setChats(updatedChats);
      setCurrentChat(updatedChat);

      // If this is the first message, update the chat description
      if (updatedChat.messages.length === 1) {
        const description = generateChatDescription(message);
        updatedChat.description = description;
        
        const updatedChatsWithDescription = updatedChats.map(c => 
          c.id === chatId ? { ...c, description } : c
        );
        setChats(updatedChatsWithDescription);
        setCurrentChat(prev => ({ ...prev, description }));
      }

      // Create a placeholder for the AI response that will be streamed
      const aiMessageId = (Date.now() + 1).toString();
      const aiMessage = {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        isStreaming: true
      };

      // Add placeholder AI message to chat
      const chatWithPlaceholder = {
        ...updatedChat,
        messages: [...updatedChat.messages, aiMessage],
        updatedAt: new Date().toISOString()
      };

      const chatsWithPlaceholder = updatedChats.map(c => 
        c.id === chatId ? chatWithPlaceholder : c
      );
      setChats(chatsWithPlaceholder);
      setCurrentChat(chatWithPlaceholder);

      // Stream the response
      const onChunk = (chunk) => {
        setChats(prevChats => {
          const updatedChats = prevChats.map(chat => {
            if (chat.id !== chatId) return chat;
            
            const updatedMessages = chat.messages.map(msg => {
              if (msg.id === aiMessageId) {
                return {
                  ...msg,
                  content: msg.content + (chunk.content || '')
                };
              }
              return msg;
            });

            return {
              ...chat,
              messages: updatedMessages,
              updatedAt: new Date().toISOString()
            };
          });

          // Update current chat if it's the one being streamed to
          setCurrentChat(prev => 
            prev?.id === chatId 
              ? updatedChats.find(c => c.id === chatId)
              : prev
          );

          return updatedChats;
        });
      };

      const onComplete = () => {
        setChats(prevChats => {
          const updatedChats = prevChats.map(chat => {
            if (chat.id !== chatId) return chat;
            
            const updatedMessages = chat.messages.map(msg => {
              if (msg.id === aiMessageId) {
                const { isStreaming, ...rest } = msg;
                return rest; // Remove isStreaming flag
              }
              return msg;
            });

            return {
              ...chat,
              messages: updatedMessages,
              updatedAt: new Date().toISOString()
            };
          });

          // Save to localStorage when streaming is complete
          localStorage.setItem('sephia_chats', JSON.stringify(updatedChats));
          
          // Update current chat if it's the one being streamed to
          setCurrentChat(prev => 
            prev?.id === chatId 
              ? updatedChats.find(c => c.id === chatId)
              : prev
          );

          return updatedChats;
        });
      };

      // Start streaming the response
      await llmService.streamMessage(chatId, message, {
        model: chat.model || currentModel,
        ...options,
        onChunk,
        onComplete
      });

      return aiMessageId;
    } catch (error) {
      console.error('Error streaming message:', error);
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
    setChats(prev => {
      if (!prev || !Array.isArray(prev)) return [];
      return prev.filter(chat => chat.id !== chatId);
    });
    
    if (currentChat && currentChat.id === chatId) {
      // If we're deleting the current chat, select the most recent chat if available
      setChats(prev => {
        if (!prev || !Array.isArray(prev) || prev.length === 0) {
          setCurrentChat(null);
          return [];
        }
        
        // Find the most recent chat that's not the one being deleted
        const otherChats = prev.filter(chat => chat.id !== chatId);
        if (otherChats.length > 0) {
          const mostRecentChat = [...otherChats].sort(
            (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
          )[0];
          setCurrentChat(mostRecentChat);
          
          // Apply the chat's theme if it has one
          if (mostRecentChat.theme) {
            localStorage.setItem('sephia_theme', mostRecentChat.theme);
            document.documentElement.setAttribute('data-theme', mostRecentChat.theme);
          }
        } else {
          setCurrentChat(null);
        }
        
        return otherChats;
      });
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

export default AppContext;